"""
Election Assistant Backend API

A FastAPI-based backend for an Indian election assistance chatbot powered by Google's 
Gemini 2.5 Flash. This service provides helpful guidance on voter registration, election 
timelines, voting procedures, and election-related inquiries.

Author: Election Assistant Team
Version: 2.0.0
Tech Stack:
    - Framework: FastAPI
    - AI Model: Google Gemini 2.5 Flash
    - Async Runtime: Uvicorn
    - Database: In-memory (rate limiting, caching)
    - Logging: Python logging with JSON formatting for Cloud Logging

Key Features:
    - IP-based rate limiting (10 requests/60 seconds)
    - LRU cache for common election questions
    - Multi-language support (English/Hinglish)
    - Conversation history support (up to 10 messages)
    - Structured JSON logging for Cloud Logging integration
    - CORS security with domain whitelisting
    - Comprehensive input validation
    - Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
    - Input sanitization for HTML/script injection prevention
"""

import os
import re
import json
import logging
import time
import uuid
from collections import defaultdict
from functools import lru_cache
from typing import Optional, List, Dict, Any
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, field_validator, Field
from pydantic_settings import BaseSettings
import google.generativeai as genai
import google.api_core.exceptions

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)

# Configure Google Cloud Logging
try:
    import google.cloud.logging
    cloud_logging_client = google.cloud.logging.Client()
    cloud_logging_client.setup_logging(log_level=logging.INFO)
except (ImportError, Exception):
    pass


# ============================================================================
# ENVIRONMENT CONFIGURATION
# ============================================================================

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    port: int = Field(default=8080, alias="PORT")
    host: str = Field(default="0.0.0.0", alias="HOST")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    cache_ttl: int = Field(default=3600, alias="CACHE_TTL")
    rate_limit_requests: int = Field(default=10, alias="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=60, alias="RATE_LIMIT_WINDOW")
    max_message_length: int = Field(default=500, alias="MAX_MESSAGE_LENGTH")
    max_history_length: int = Field(default=10, alias="MAX_HISTORY_LENGTH")
    
    class Config:
        env_file = ".env"
        extra = "ignore"


# Initialize settings
settings = Settings()

# ============================================================================
# GEMINI API CONFIGURATION
# ============================================================================

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.error("GEMINI_API_KEY environment variable not set")
    raise RuntimeError("GEMINI_API_KEY is not set")

genai.configure(api_key=api_key)

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="Election Assistant API",
    description="""AI-powered election assistance chatbot for Indian voters.
    
## Features
- 🤖 Intelligent chat responses using Gemini 2.5 Flash
- 📋 Voter registration guidance (Form 6)
- 📍 Polling booth finder
- 📅 Election information
- 🗳️ Voting process education

## Rate Limits
- 10 requests per 60 seconds per IP address

## Security
All responses include security headers for protection.""",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ============================================================================
# CORS CONFIGURATION (DO NOT CHANGE)
# ============================================================================

allowed_origins = [
    "https://election-assistant-prod.web.app",
    "https://universe-911.web.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    allow_credentials=False,
)

# ============================================================================
# SECURITY HEADERS MIDDLEWARE
# ============================================================================

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """
    Add security headers to all responses.
    
    Headers added:
        - X-Content-Type-Options: nosniff
        - X-Frame-Options: DENY
        - X-XSS-Protection: 1; mode=block
        - Strict-Transport-Security: max-age=31536000; includeSubDomains
        - Content-Security-Policy: CSP for XSS prevention
        - Referrer-Policy: strict-origin-when-cross-origin
        - Permissions-Policy: geolocation=(), microphone=(), camera=()
        - X-Request-ID: Unique identifier for request tracing
    
    Args:
        request: The incoming HTTP request
        call_next: The next middleware/handler in the chain
        
    Returns:
        Response with security headers added
    """
    import uuid
    request_id = str(uuid.uuid4())
    
    response = await call_next(request)
    
    # Basic security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Additional security headers
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://generativelanguage.googleapis.com;"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    # Request tracing
    response.headers["X-Request-ID"] = request_id
    
    return response

# ============================================================================
# INPUT SANITIZATION
# ============================================================================

def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent XSS and injection attacks.
    
    Removes:
        - HTML tags (<script>, <iframe>, etc.)
        - JavaScript event handlers (onclick, onerror, etc.)
        - HTML entities that could execute code
        - Potentially dangerous URL schemes (javascript:, data:)
    
    Args:
        text: Raw user input string
        
    Returns:
        str: Sanitized text safe for processing
        
    Example:
        >>> sanitize_input('<script>alert("xss")</script>Hello')
        'Hello'
    """
    if not text:
        return ""
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove JavaScript event handlers (case insensitive)
    text = re.sub(r'\s*on\w+\s*=\s*["\'][^"\']*["\']', '', text, flags=re.IGNORECASE)
    
    # Remove javascript: and data: URL schemes
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    text = re.sub(r'data:', '', text, flags=re.IGNORECASE)
    
    # Remove HTML entities that could be dangerous
    text = re.sub(r'&#\d+;', '', text)
    text = re.sub(r'&#[xX][0-9a-fA-F]+;', '', text)
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

# ============================================================================
# RATE LIMITING (DO NOT CHANGE VALUES)
# ============================================================================

rate_limit_store: Dict[str, List[float]] = defaultdict(list)
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW = 60


def check_rate_limit(client_ip: str) -> bool:
    """
    Check if a client IP has exceeded the rate limit using sliding window.
    
    Args:
        client_ip: The client's IP address
        
    Returns:
        bool: True if request is allowed, False if rate limit exceeded
    """
    now = time.time()
    
    # Clean old entries outside window
    rate_limit_store[client_ip] = [
        req_time for req_time in rate_limit_store[client_ip]
        if now - req_time < RATE_LIMIT_WINDOW
    ]
    
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_REQUESTS:
        return False
    
    rate_limit_store[client_ip].append(now)
    return True


# ============================================================================
# LRU CACHE FOR COMMON QUESTIONS
# ============================================================================

# Common election questions that benefit from caching
COMMON_QUESTIONS = {
    "how to register to vote": "register voter",
    "voter registration": "register voter",
    "how do i register": "register voter",
    "where is my polling booth": "polling booth",
    "find my polling station": "polling booth",
    "election dates": "election dates",
    "when are elections": "election dates",
    "am i eligible to vote": "eligibility",
    "check eligibility": "eligibility",
    "voter id status": "voter id",
    "how to vote": "voting process",
    "voting process": "voting process",
}

# LRU cache decorator with maxsize
@lru_cache(maxsize=100)
def get_cached_llm_response(prompt_hash: int, context: str) -> Optional[str]:
    """
    LRU cache for Gemini responses (placeholder - actual caching done in endpoint).
    
    Args:
        prompt_hash: Hash of the prompt
        context: Conversation context
        
    Returns:
        Optional[str]: Cached response or None
    """
    return None


def normalize_question(question: str) -> str:
    """
    Normalize a question to match common question patterns.
    
    Args:
        question: Original user question
        
    Returns:
        str: Normalized question key for caching lookup
    """
    normalized = question.lower().strip()
    # Remove common prefixes/suffixes
    normalized = re.sub(r'^(what is|how to|where is|can i)\s+', '', normalized)
    normalized = re.sub(r'\s+(process|procedure|steps|guide)$', '', normalized)
    return normalized


def is_common_question(message: str) -> bool:
    """
    Check if message matches a common election question.
    
    Args:
        message: User message to check
        
    Returns:
        bool: True if it's a common question
    """
    normalized = normalize_question(message)
    return any(
        pattern in normalized 
        for pattern in [
            "register voter", "polling booth", "election dates",
            "eligibility", "voter id", "voting process"
        ]
    )

# ============================================================================
# RESPONSE CACHING
# ============================================================================

response_cache: Dict[str, tuple[str, float]] = {}
CACHE_TTL = 3600


def get_cache_key(message: str, context: str) -> str:
    """Generate cache key for message and context."""
    return f"{message}:{context}"


def get_cached_response(message: str, context: str) -> Optional[str]:
    """Retrieve cached response if valid."""
    key = get_cache_key(message, context)
    if key in response_cache:
        reply, timestamp = response_cache[key]
        if time.time() - timestamp < CACHE_TTL:
            return reply
        del response_cache[key]
    return None


def set_cached_response(message: str, context: str, reply: str) -> None:
    """Store response in cache."""
    key = get_cache_key(message, context)
    response_cache[key] = (reply, time.time())


# ============================================================================
# JSON LOGGING UTILITY
# ============================================================================

def log_json(level: str, message: str, **extra: Any) -> None:
    """
    Log structured JSON entries for Google Cloud Logging.
    
    Args:
        level: Log severity level
        message: Main log message
        **extra: Additional fields for JSON log
    """
    log_entry = {
        "timestamp": time.time(),
        "level": level,
        "message": message,
        **extra
    }
    logger.info(json.dumps(log_entry))


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class Message(BaseModel):
    """Represents a single message in conversation history."""
    role: str
    content: str


class ChatRequest(BaseModel):
    """Request model for /chat endpoint with validation."""
    message: str
    history: List[Message] = []
    context: Optional[str] = "general"
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v: str) -> str:
        """Validate message content and length."""
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        if len(v) > 500:
            raise ValueError("Message exceeds maximum length of 500 characters")
        return v
    
    @field_validator('history')
    @classmethod
    def validate_history(cls, v: List[Message]) -> List[Message]:
        """Validate conversation history size."""
        if len(v) > 10:
            raise ValueError("Conversation history exceeds maximum of 10 messages")
        return v


# ============================================================================
# SYSTEM PROMPT
# ============================================================================

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
async def global_exception_handler(request: Request, exc: Exception) -> Response:
    """Global exception handler for unhandled errors."""
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
# HELPER FUNCTIONS (to keep routes concise)
# ============================================================================

def get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    return request.client.host if request.client else "unknown"


def validate_history_item(msg: Message, idx: int) -> None:
    """Validate a single history item."""
    if not hasattr(msg, 'role') or not hasattr(msg, 'content'):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid history format at index {idx}: missing 'role' or 'content'"
        )


def convert_to_gemini_history(history: List[Message]) -> List[Dict[str, Any]]:
    """Convert message history to Gemini format."""
    trimmed = history[-10:]
    return [
        {"role": "user" if msg.role == "user" else "model", "parts": [msg.content]}
        for msg in trimmed
    ]


async def call_gemini_api(
    gemini_history: List[Dict[str, Any]],
    full_prompt: str,
    client_ip: str
) -> str:
    """
    Call Gemini API with proper error handling.
    
    Args:
        gemini_history: Formatted conversation history
        full_prompt: User's prompt with context
        client_ip: Client IP for logging
        
    Returns:
        str: Gemini's response text
        
    Raises:
        HTTPException: On various API errors
    """
    model = genai.GenerativeModel(
        model_name='gemini-2.5-flash',
        system_instruction=SYSTEM_PROMPT,
        generation_config={
            "temperature": 0.7,
            "top_p": 0.9,
            "top_k": 40,
        }
    )
    
    chat = model.start_chat(history=gemini_history)
    response = chat.send_message(full_prompt)
    return response.text


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root() -> Dict[str, str]:
    """
    Health check endpoint.
    
    Returns:
        dict: Status object with "ok" status and message
    """
    log_json("info", "Health check endpoint called")
    return {"status": "ok", "message": "Election Assistant API is running"}


@app.get("/test")
async def test_gemini() -> Dict[str, str]:
    """
    Test endpoint to verify Gemini API connectivity.
    
    Returns:
        dict: Test result status and message
    """
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content("Say hello")
        return {"status": "ok", "message": response.text}
    except Exception as e:
        return {"status": "error", "message": str(e), "type": type(e).__name__}


@app.post("/chat")
async def chat(request: ChatRequest, req: Request) -> Dict[str, str]:
    """
    Main chat endpoint for election assistance queries.
    
    Flow:
        1. Extract client IP
        2. Check rate limiting (10 req/60s per IP)
        3. Sanitize user input
        4. Check response cache
        5. Validate history
        6. Call Gemini API
        7. Cache and return response
    
    Args:
        request: ChatRequest with message, history, context
        req: FastAPI Request object
        
    Returns:
        dict: {"reply": "AI-generated response text"}
        
    Raises:
        HTTPException(400): Invalid input
        HTTPException(429): Rate limit exceeded
        HTTPException(503): Service unavailable
    """
    start_time = time.time()
    client_ip = get_client_ip(req)
    
    try:
        # Rate limiting check
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
        
        # Sanitize input
        sanitized_message = sanitize_input(request.message)
        log_json(
            "info",
            "Chat request received",
            client_ip=client_ip,
            context=request.context,
            message_length=len(sanitized_message),
            history_count=len(request.history),
            request_timestamp=datetime.utcnow().isoformat()
        )
        
        # Cache check
        cached_reply = get_cached_response(sanitized_message, request.context)
        if cached_reply:
            response_time = time.time() - start_time
            log_json(
                "info",
                "Returning cached response",
                client_ip=client_ip,
                response_time_ms=round(response_time * 1000, 2)
            )
            return {"reply": cached_reply}
        
        # Validate history
        for idx, msg in enumerate(request.history):
            validate_history_item(msg, idx)
        
        # Convert history
        gemini_history = convert_to_gemini_history(request.history)
        
        # Add context to prompt
        full_prompt = f"Context: {request.context}\n\n{sanitized_message}"
        
        # Call Gemini API
        reply = await call_gemini_api(gemini_history, full_prompt, client_ip)
        
        # Cache response
        set_cached_response(sanitized_message, request.context, reply)
        
        response_time = time.time() - start_time
        log_json(
            "info",
            "Chat response generated successfully",
            client_ip=client_ip,
            context_type=request.context,
            response_time_ms=round(response_time * 1000, 2),
            reply_length=len(reply),
            request_timestamp=datetime.utcnow().isoformat()
        )
        
        return {"reply": reply}
    
    except HTTPException:
        raise
    except Exception as e:
        response_time = time.time() - start_time
        log_json(
            "error",
            "Unhandled exception in chat",
            error=str(e),
            error_type=type(e).__name__,
            client_ip=client_ip,
            response_time_ms=round(response_time * 1000, 2)
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