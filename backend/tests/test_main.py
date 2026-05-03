"""
Test suite for Election Assistant backend API.

Tests cover:
- Health check endpoint
- Chat endpoint with validation
- Rate limiting
- Error handling
- Input validation (message length, history size)
"""

import pytest
import time
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """
    Test GET / endpoint returns health check response.

    Expected behavior:
    - Status code: 200
    - Response contains "status": "ok"
    """
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "message" in data


@pytest.mark.asyncio
async def test_chat_valid_message(client: AsyncClient):
    """
    Test POST /chat with valid message returns successful response.

    Expected behavior:
    - Status code: 200
    - Response contains "reply" field with non-empty string
    """
    payload = {
        "message": "What is voter registration?",
        "history": [],
        "context": "general"
    }
    response = await client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert isinstance(data["reply"], str)
    assert len(data["reply"]) > 0


@pytest.mark.asyncio
async def test_chat_empty_message(client: AsyncClient):
    """
    Test POST /chat with empty message returns 400 Bad Request.

    Expected behavior:
    - Status code: 400
    - Error detail indicates message cannot be empty
    """
    payload = {
        "message": "",
        "history": [],
        "context": "general"
    }
    response = await client.post("/chat", json=payload)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_chat_whitespace_only_message(client: AsyncClient):
    """
    Test POST /chat with whitespace-only message returns 400 Bad Request.

    Expected behavior:
    - Status code: 400 (validation error)
    """
    payload = {
        "message": "   ",
        "history": [],
        "context": "general"
    }
    response = await client.post("/chat", json=payload)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_chat_message_exceeds_max_length(client: AsyncClient):
    """
    Test POST /chat with message > 500 chars returns 400 Bad Request.

    Expected behavior:
    - Status code: 400
    - Error indicates message exceeds maximum length
    """
    long_message = "a" * 501
    payload = {
        "message": long_message,
        "history": [],
        "context": "general"
    }
    response = await client.post("/chat", json=payload)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_chat_history_exceeds_max_count(client: AsyncClient):
    """
    Test POST /chat with history > 10 messages returns 400 Bad Request.

    Expected behavior:
    - Status code: 400
    - Error indicates history exceeds maximum of 10 messages
    """
    # Create history with 11 messages
    history = [
        {"role": "user", "content": f"Message {i}"}
        if i % 2 == 0
        else {"role": "assistant", "content": f"Response {i}"}
        for i in range(11)
    ]
    
    payload = {
        "message": "What happens next?",
        "history": history,
        "context": "general"
    }
    response = await client.post("/chat", json=payload)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_rate_limiting():
    """
    Test rate limiting: 11 requests within 60 seconds should result in 429 for the 11th.

    Expected behavior:
    - First 10 requests return 200 OK
    - 11th request returns 429 Too Many Requests
    - Rate limit window is 60 seconds

    Note: This test simulates requests from the same IP.
    """
    from main import check_rate_limit
    
    # Reset the rate limit store for this test
    import main
    test_ip = "test_rate_limit_ip"
    main.rate_limit_store[test_ip] = []
    
    # Make 10 requests - all should be allowed
    for i in range(10):
        result = check_rate_limit(test_ip)
        assert result is True, f"Request {i+1} should be allowed"
    
    # 11th request should be rejected
    result = check_rate_limit(test_ip)
    assert result is False, "11th request should be rate limited"


@pytest.mark.asyncio
async def test_chat_with_valid_history(client: AsyncClient):
    """
    Test POST /chat with valid conversation history.

    Expected behavior:
    - Status code: 200
    - API uses history context to inform response
    """
    history = [
        {"role": "user", "content": "Tell me about elections"},
        {"role": "assistant", "content": "Elections are a democratic process..."}
    ]
    
    payload = {
        "message": "Can you explain more about voting?",
        "history": history,
        "context": "general"
    }
    response = await client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data


@pytest.mark.asyncio
async def test_chat_different_contexts(client: AsyncClient):
    """
    Test POST /chat with different context values.

    Expected behavior:
    - Status code: 200 for both contexts
    - Response adapts based on context
    """
    contexts = ["general", "first_time_voter", "existing_voter"]
    
    for context in contexts:
        payload = {
            "message": "How do I vote?",
            "history": [],
            "context": context
        }
        response = await client.post("/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data


@pytest.mark.asyncio
async def test_chat_maximum_allowed_message_length(client: AsyncClient):
    """
    Test POST /chat with exactly 500 character message (maximum allowed).

    Expected behavior:
    - Status code: 200
    - Message is accepted without validation error
    """
    message_500_chars = "a" * 500
    payload = {
        "message": message_500_chars,
        "history": [],
        "context": "general"
    }
    response = await client.post("/chat", json=payload)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_chat_maximum_allowed_history_count(client: AsyncClient):
    """
    Test POST /chat with exactly 10 messages in history (maximum allowed).

    Expected behavior:
    - Status code: 200
    - History is accepted without validation error
    """
    history = [
        {"role": "user", "content": f"Message {i}"}
        if i % 2 == 0
        else {"role": "assistant", "content": f"Response {i}"}
        for i in range(10)
    ]
    
    payload = {
        "message": "What's your advice?",
        "history": history,
        "context": "general"
    }
    response = await client.post("/chat", json=payload)
    assert response.status_code == 200
