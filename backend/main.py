"""
Election Assistant Backend API

A FastAPI-based backend for an Indian election assistance chatbot powered by Google's 
Gemini 2.5 Flash. This service provides helpful guidance on voter registration, election 
timelines, voting procedures, and election-related inquiries.

Author: Election Assistant Team
Tech Stack:
    - Framework: FastAPI
    - AI Model: Google Gemini 2.5 Flash
    - Async Runtime: Uvicorn
    - Database: In-memory (rate limiting, caching)
    - Logging: Python logging with JSON formatting for Cloud Logging

Key Features:
    - IP-based rate limiting (10 requests/60 seconds)
    - Response caching for duplicate queries
    - Multi-language support (English/Hinglish)
    - Conversation history support (up to 10 messages)
    - Structured JSON logging for Cloud Logging integration
    - CORS security with domain whitelisting
    - Comprehensive input validation
"""

import os
import json
import logging
import time
from collections import defaultdict
from functools import lru_cache
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, field_validator
from typing import List, Optional
import google.generativeai as genai
import google.api_core.exceptions

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

# Configure structured logging for Google Cloud Logging integration
# JSON format allows Cloud Logging to parse and index log entries
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'  # Log raw message to allow JSON formatting
)
logger = logging.getLogger(__name__)

# Optional: Configure Google Cloud Logging client if running on Google Cloud Platform
try:
    import google.cloud.logging
    cloud_logging_client = google.cloud.logging.Client()
    cloud_logging_client.setup_logging()
except (ImportError, Exception):
    # Fall back to standard Python logging if not on GCP
    pass

# ============================================================================
# GEMINI API CONFIGURATION
# ============================================================================

# Load and validate Gemini API key from environment
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.error("GEMINI_API_KEY environment variable not set")
    raise RuntimeError("GEMINI_API_KEY is not set")

genai.configure(api_key=api_key)

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(title="Election Assistant API")

# Add GZip compression middleware to reduce response payload size
# Minimum size of 1000 bytes ensures small responses aren't compressed
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ============================================================================
# CORS CONFIGURATION
# ============================================================================

# CORS (Cross-Origin Resource Sharing) configuration restricts API access
# to whitelisted origins only for security. This prevents unauthorized
# domain access while allowing legitimate frontend applications.
allowed_origins = [
    "https://election-assistant-prod.web.app",  # Production Firebase Hosting domain
    "https://universe-911.web.app",  # Current Firebase Hosting domain
    "http://localhost:5173",  # Local development (Vite default port)
    "http://localhost:3000",  # Alternative local dev port (CRA default)
    "*",  # Allow all origins for public API
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],  # Restrict to safe methods
    allow_headers=["Content-Type"],  # Only allow content-type header
    allow_credentials=False,  # Don't include credentials in CORS
)

# ============================================================================
# RATE LIMITING
# ============================================================================

# IP-based rate limiting to prevent abuse and control API usage.
# Configuration: 10 requests per 60-second window per client IP.
# This protects against DDoS attacks and ensures fair resource allocation.

rate_limit_store = defaultdict(list)
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW = 60  # seconds


def check_rate_limit(client_ip: str) -> bool:
    """
    Check if a client IP has exceeded the rate limit.

    Implements a sliding window rate limiting algorithm:
    - Tracks request timestamps for each IP
    - Removes timestamps outside the rolling window
    - Allows request if count is below limit

    Args:
        client_ip: The client's IP address (from request.client.host)

    Returns:
        bool: True if request is allowed, False if rate limit exceeded.

    Rate Limit Policy:
        - Max 10 requests per 60-second rolling window
        - Clients exceeding limit receive 429 Too Many Requests
    """
    now = time.time()
    
    # Remove timestamps outside the rate limit window (sliding window cleanup)
    rate_limit_store[client_ip] = [
        req_time for req_time in rate_limit_store[client_ip]
        if now - req_time < RATE_LIMIT_WINDOW
    ]
    
    # Check if client has hit the limit
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_REQUESTS:
        return False
    
    # Record this request's timestamp
    rate_limit_store[client_ip].append(now)
    return True


# ============================================================================
# RESPONSE CACHING
# ============================================================================

# Simple in-memory cache with TTL for identical queries
# Key: hash of (message, context), Value: (reply, timestamp)
# TTL: 3600 seconds (1 hour)

response_cache = {}
CACHE_TTL = 3600  # Cache duration in seconds


def get_cache_key(message: str, context: str) -> str:
    """
    Generate a cache key for a message and context.

    Args:
        message: User message text
        context: Conversation context

    Returns:
        str: Hashable cache key
    """
    return f"{message}:{context}"


def get_cached_response(message: str, context: str) -> Optional[str]:
    """
    Retrieve cached response if available and not expired.

    Args:
        message: User message text
        context: Conversation context

    Returns:
        str: Cached reply if valid, None otherwise
    """
    key = get_cache_key(message, context)
    if key in response_cache:
        reply, timestamp = response_cache[key]
        # Check if cache entry is still valid
        if time.time() - timestamp < CACHE_TTL:
            logger.info(json.dumps({
                "timestamp": time.time(),
                "level": "info",
                "message": "Cache hit",
                "cache_key": key
            }))
            return reply
        else:
            # Remove expired cache entry
            del response_cache[key]
    return None


def set_cached_response(message: str, context: str, reply: str):
    """
    Store response in cache with current timestamp.

    Args:
        message: User message text
        context: Conversation context
        reply: AI-generated reply to cache
    """
    key = get_cache_key(message, context)
    response_cache[key] = (reply, time.time())


# ============================================================================
# JSON LOGGING UTILITY
# ============================================================================

def log_json(level: str, message: str, **extra):
    """
    Log structured JSON entries for Google Cloud Logging.

    Formats logs as JSON with timestamp, severity level, and custom fields.
    This enables Cloud Logging to automatically parse and index log entries.

    Args:
        level: Log severity level ('info', 'warning', 'error')
        message: Main log message
        **extra: Additional fields to include in JSON log (e.g., error, client_ip)

    Example:
        log_json("info", "Chat request received", client_ip="192.168.1.1")
        # Logs: {"timestamp": 1234567890.123, "level": "info", "message": "...", "client_ip": "..."}
    """
    log_entry = {
        "timestamp": time.time(),
        "level": level,
        "message": message,
        **extra
    }
    logger.info(json.dumps(log_entry))


# ============================================================================
# PYDANTIC MODELS & VALIDATION
# ============================================================================

class Message(BaseModel):
    """
    Represents a single message in conversation history.

    Attributes:
        role: Either "user" or "assistant" indicating message sender
        content: The actual message text
    """
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """
    Request model for the /chat endpoint.

    Includes input validation for message length, history size,
    and required fields.

    Attributes:
        message: User query (1-500 characters)
        history: Previous messages in conversation (0-10 messages max)
        context: Optional context hint for response customization
                 Valid values: "general", "first_time_voter", "existing_voter"

    Raises:
        ValueError: If validation fails (see validators below)
    """
    message: str
    history: List[Message] = []
    context: Optional[str] = "general"
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        """
        Validate message content and length.

        Constraints:
            - Message must not be empty or whitespace-only
            - Maximum length: 500 characters

        Args:
            v: Message value to validate

        Returns:
            str: Validated message

        Raises:
            ValueError: If message is empty or exceeds 500 characters
        """
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        if len(v) > 500:
            raise ValueError("Message exceeds maximum length of 500 characters")
        return v
    
    @field_validator('history')
    @classmethod
    def validate_history(cls, v):
        """
        Validate conversation history to prevent memory abuse.

        Constraints:
            - Maximum 10 previous messages
            - Prevents overly large payloads

        Args:
            v: History list to validate

        Returns:
            List[Message]: Validated history

        Raises:
            ValueError: If history exceeds 10 messages
        """
        if len(v) > 10:
            raise ValueError("Conversation history exceeds maximum of 10 messages")
        return v


# ============================================================================
# SYSTEM PROMPT
# ============================================================================

# System prompt instructs Gemini to behave as an election guide for Indian elections
# This defines the AI's personality, constraints, and response guidelines
SYSTEM_PROMPT = """You are an election guide assistant for Indian elections.
Your job is to help users understand:
- Voter registration process (Form 6 on voters.eci.gov.in)
- Election timeline and phases
- What happens on voting day (EVM, VVPAT, booth process)
- How votes are counted and results declared
- Eligibility rules (age 18+, citizen, etc.)
- Special cases: NRI voters, PwD voters, relocated voters

Rules:
- Always answer in simple, plain language.
- Keep answers concise — max 4-5 lines unless user asks for detail.
- If user picks a guided topic, walk them through it step by step, one step at a time.
- Ask follow-up questions to personalize (e.g., "Are you a first-time voter?").
- Never make up facts — stick to ECI official process.
- Format responses with numbered steps or bullet points where helpful.
- Respond in the same language the user writes in. If they write in Hinglish or Hindi, reply in Hinglish. If English, reply in English.
"""

# ============================================================================
# GLOBAL EXCEPTION HANDLER
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled errors.

    Catches all unhandled exceptions, logs them with context,
    and returns a safe generic error response to the client.

    Args:
        request: The incoming HTTP request
        exc: The uncaught exception

    Returns:
        JSONResponse with 500 status and generic error message
    """
    log_json(
        "error",
        "Unhandled exception",
        path=str(request.url),
        method=request.method,
        error=str(exc),
        error_type=type(exc).__name__
    )
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """
    Health check endpoint.

    Verifies that the API is running and accessible.
    Called regularly by monitoring systems and load balancers.

    Returns:
        dict: Status object with "ok" status and descriptive message
    """
    log_json("info", "Health check endpoint called")
    return {"status": "ok", "message": "Election Assistant API is running"}


@app.get("/test")
async def test_gemini():
    """
    Test endpoint to verify Gemini API is working.
    """
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content("Say hello")
        return {"status": "ok", "message": response.text}
    except Exception as e:
        return {"status": "error", "message": str(e), "type": type(e).__name__}


@app.post("/chat")
async def chat(request: ChatRequest, req: Request):
    """
    Main chat endpoint for election assistance queries.

    Orchestrates the complete request flow:
    1. Extract and validate client IP
    2. Check rate limiting
    3. Check response cache
    4. Construct history for Gemini
    5. Call Gemini API with error handling
    6. Cache and return response

    Args:
        request: ChatRequest containing message, history, and context
        req: FastAPI Request object (provides client IP)

    Returns:
        dict: {"reply": "AI-generated response text"}

    Raises:
        HTTPException(400): Invalid input (empty, too long, history too large)
        HTTPException(429): Rate limit exceeded (>10 requests/60s)
        HTTPException(503): Gemini API error or service unavailable

    Rate Limiting:
        - 10 requests per 60 seconds per client IP
        - Returns 429 Too Many Requests when exceeded

    Caching:
        - Identical message+context combinations return cached responses
        - Cache TTL: 1 hour
    """
    client_ip = "unknown"
    try:
        # Extract client IP for rate limiting and logging
        client_ip = req.client.host if req.client else "unknown"
        print(f"DEBUG: Chat request from {client_ip}, message='{request.message}'")
        
        # ====== RATE LIMITING CHECK ======
        # Prevent abuse by limiting requests per IP
        if not check_rate_limit(client_ip):
            log_json(
                "warning",
                "Rate limit exceeded",
                client_ip=client_ip,
                message=request.message[:50]
            )
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Maximum 10 requests per minute allowed."
            )
        
        print("DEBUG: Rate limit check passed")
        
        log_json(
            "info",
            "Chat request received",
            client_ip=client_ip,
            context=request.context,
            message_length=len(request.message),
            history_count=len(request.history)
        )
        
        # ====== CACHE CHECK ======
        # Return cached response if available
        cached_reply = get_cached_response(request.message, request.context)
        if cached_reply:
            print("DEBUG: Returning cached response")
            return {"reply": cached_reply}
        
        print("DEBUG: No cached response, proceeding to Gemini")
        
        # ====== VALIDATE HISTORY STRUCTURE ======
        # Ensure each history item has required fields
        for idx, msg in enumerate(request.history):
            if not hasattr(msg, 'role') or not hasattr(msg, 'content'):
                log_json(
                    "warning",
                    "Malformed history item",
                    index=idx,
                    client_ip=client_ip
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid history format at index {idx}: missing 'role' or 'content'"
                )
        
        # ====== PREPARE HISTORY FOR GEMINI ======
        # Convert history to Gemini format:
        # - Change role from "assistant" to "model" (Gemini's expected format)
        # - Structure content as parts array
        # - Trim to last 10 messages (server-side backup validation)
        trimmed_history = request.history[-10:]  # Ensure no more than 10
        gemini_history = []
        for msg in trimmed_history:
            role = "user" if msg.role == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg.content]})
        
        # Add context to the message for better personalization
        full_prompt = f"Context: {request.context}\n\n{request.message}"
        
        print(f"DEBUG: Calling Gemini with prompt length={len(full_prompt)}")
        
        # ====== GEMINI API CALL ======
        # Initialize model with system instruction and start chat session
        try:
            print("DEBUG: Creating GenerativeModel")
            model_with_system = genai.GenerativeModel(
                model_name='gemini-2.5-flash',
                system_instruction=SYSTEM_PROMPT,
                generation_config={
                    "temperature": 0.7,  # Balanced creativity/consistency
                    "top_p": 0.9,
                    "top_k": 40,
                }
            )
            
            print("DEBUG: Starting chat session")
            # Start new chat session with conversation history
            chat_session = model_with_system.start_chat(history=gemini_history)
            
            print("DEBUG: Sending message")
            # Send message with request timeout to prevent hanging
            response = chat_session.send_message(full_prompt)
            
            print("DEBUG: Got response from Gemini")
            
        except google.api_core.exceptions.ResourceExhausted:
            # Gemini quota/rate limit exceeded on Google's side
            print("DEBUG: ResourceExhausted error")
            log_json(
                "error",
                "Gemini API quota exhausted",
                client_ip=client_ip
            )
            raise HTTPException(
                status_code=429,
                detail="Gemini quota exceeded. Please try again later."
            )
        
        except google.api_core.exceptions.InvalidArgument as e:
            # Invalid input to Gemini API
            print(f"DEBUG: InvalidArgument error: {e}")
            log_json(
                "warning",
                "Invalid argument to Gemini API",
                error=str(e),
                client_ip=client_ip
            )
            raise HTTPException(
                status_code=400,
                detail=f"Invalid input: {str(e)}"
            )
        
        except google.api_core.exceptions.PermissionDenied as e:
            # API key invalid or no permission
            print(f"DEBUG: PermissionDenied error: {e}")
            log_json(
                "error",
                "Gemini API permission denied",
                error=str(e),
                client_ip=client_ip
            )
            raise HTTPException(
                status_code=503,
                detail="AI service temporarily unavailable. Please try again later."
            )
        
        except TimeoutError:
            print("DEBUG: TimeoutError")
            log_json("error", "Gemini API request timed out", client_ip=client_ip)
            raise HTTPException(
                status_code=503,
                detail="AI service response timeout. Please try again."
            )
        
        except HTTPException:
            # Re-raise HTTP exceptions
            print("DEBUG: HTTPException being re-raised")
            raise
        
        except Exception as e:
            # Unexpected error from Gemini
            print(f"DEBUG: Unexpected exception: {type(e).__name__}: {e}")
            log_json(
                "error",
                "Error calling Gemini API",
                error=str(e),
                error_type=type(e).__name__,
                client_ip=client_ip
            )
            raise HTTPException(
                status_code=503,
                detail="AI service temporarily unavailable. Please try again later."
            )
        
        # ====== SUCCESS ======
        # Cache the response before returning
        print("DEBUG: Caching response")
        reply = response.text
        set_cached_response(request.message, request.context, reply)
        
        log_json(
            "info",
            "Chat response generated successfully",
            client_ip=client_ip,
            reply_length=len(reply)
        )
        
        print("DEBUG: Returning success response")
        return {"reply": reply}
    
    except HTTPException:
        print("DEBUG: HTTPException caught at top level")
        raise
    except Exception as e:
        # Catch any unhandled exception at top level
        print(f"DEBUG: Top-level unhandled exception: {type(e).__name__}: {e}")
        log_json(
            "error",
            "Unhandled exception in chat",
            error=str(e),
            error_type=type(e).__name__,
            client_ip=client_ip
        )
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Please try again later."
        )


# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
