import os
import json
import logging
import time
from collections import defaultdict
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import List, Optional
import google.generativeai as genai

# Configure structured logging for Cloud Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.error("GEMINI_API_KEY environment variable not set")
    raise RuntimeError("GEMINI_API_KEY is not set")

genai.configure(api_key=api_key)

app = FastAPI(title="Election Assistant API")

# CORS setup - Restrict to Firebase hosting domain only
allowed_origins = [
    "https://election-assistant-prod.web.app",
    "http://localhost:5173",  # Local development
    "http://localhost:3000",  # Alternative local dev port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    allow_credentials=False,
)

# Simple rate limiting: IP-based, 10 requests per 60 seconds
rate_limit_store = defaultdict(list)
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW = 60  # seconds

def check_rate_limit(client_ip: str) -> bool:
    """Check if client has exceeded rate limit. Returns True if allowed."""
    now = time.time()
    # Clean old requests outside the window
    rate_limit_store[client_ip] = [
        req_time for req_time in rate_limit_store[client_ip]
        if now - req_time < RATE_LIMIT_WINDOW
    ]
    
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_REQUESTS:
        return False
    
    rate_limit_store[client_ip].append(now)
    return True

def log_json(level: str, message: str, **extra):
    """Log in JSON format for Cloud Logging."""
    log_entry = {
        "timestamp": time.time(),
        "level": level,
        "message": message,
        **extra
    }
    logger.info(json.dumps(log_entry))

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []
    context: Optional[str] = "general"
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        """Validate message length."""
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        if len(v) > 500:
            raise ValueError("Message exceeds maximum length of 500 characters")
        return v
    
    @field_validator('history')
    @classmethod
    def validate_history(cls, v):
        """Validate history size to prevent memory abuse."""
        if len(v) > 10:
            raise ValueError("Conversation history exceeds maximum of 10 messages")
        return v

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

@app.post("/chat")
async def chat(request: ChatRequest, req: Request):
    """Handle chat requests with rate limiting and validation."""
    try:
        # Get client IP for rate limiting
        client_ip = req.client.host if req.client else "unknown"
        
        # Check rate limit
        if not check_rate_limit(client_ip):
            log_json("warning", "Rate limit exceeded", client_ip=client_ip)
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Maximum 10 requests per minute allowed."
            )
        
        log_json("info", "Chat request received", client_ip=client_ip, context=request.context)
        
        # Prepare history for Gemini
        # Gemini expects roles to be 'user' and 'model'
        gemini_history = []
        for msg in request.history:
            role = "user" if msg.role == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg.content]})

        full_prompt = f"Context: {request.context}\n\n{request.message}"
        
        # Initialize model with system instruction
        model_with_system = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=SYSTEM_PROMPT
        )
        chat_session = model_with_system.start_chat(history=gemini_history)
        
        response = chat_session.send_message(full_prompt)
        
        log_json("info", "Chat response generated successfully", client_ip=client_ip)
        return {"reply": response.text}
        
    except ValueError as e:
        # Pydantic validation error
        log_json("warning", "Validation error", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        # Re-raise HTTP exceptions (rate limit, validation)
        raise
    except Exception as e:
        log_json("error", "Chat endpoint error", error=str(e), error_type=type(e).__name__)
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable. Please try again later."
        )

@app.get("/")
async def root():
    """Health check endpoint."""
    log_json("info", "Health check")
    return {"status": "ok", "message": "Election Assistant API is running"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
