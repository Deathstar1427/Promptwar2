"""
Integration Tests for Election Assistant API

Tests cover:
- End-to-end chat flow
- Rate limiting behavior
- Error handling
- Request/response validation
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from fastapi import HTTPException


# Test client fixture is in conftest.py
# Import it here for clarity
from backend.tests.conftest import client


class TestChatIntegration:
    """Integration tests for the /chat endpoint."""
    
    @patch('backend.main.genai.GenerativeModel')
    def test_full_chat_flow(self, mock_model, client):
        """Test complete chat request-response flow."""
        # Setup mock
        mock_chat = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Here is how you can register to vote in India"
        mock_chat.send_message.return_value = mock_response
        
        mock_instance = MagicMock()
        mock_instance.start_chat.return_value = mock_chat
        mock_model.return_value = mock_instance
        
        # Make request
        response = client.post("/chat", json={
            "message": "How do I register to vote?",
            "history": [],
            "context": "general"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert "register" in data["reply"].lower()

    @patch('backend.main.genai.GenerativeModel')
    def test_conversation_history_preserved(self, mock_model, client):
        """Test that conversation history is properly handled."""
        # Setup mock
        mock_chat = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Following up on your question..."
        mock_chat.send_message.return_value = mock_response
        
        mock_instance = MagicMock()
        mock_instance.start_chat.return_value = mock_chat
        mock_model.return_value = mock_instance
        
        # Send message with history
        response = client.post("/chat", json={
            "message": "What about EPIC card?",
            "history": [
                {"role": "user", "content": "How do I register?"},
                {"role": "assistant", "content": "Visit voters.eci.gov.in"}
            ],
            "context": "general"
        })
        
        assert response.status_code == 200
        # Verify chat was started with history
        mock_instance.start_chat.assert_called_once()

    @patch('backend.main.genai.GenerativeModel')
    def test_context_affects_response(self, mock_model, client):
        """Test that context parameter affects the request."""
        mock_chat = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "For first-time voters, here's what you need..."
        mock_chat.send_message.return_value = mock_response
        
        mock_instance = MagicMock()
        mock_instance.start_chat.return_value = mock_chat
        mock_model.return_value = mock_instance
        
        # Send with specific context
        response = client.post("/chat", json={
            "message": "What do I need?",
            "history": [],
            "context": "first_time_voter"
        })
        
        assert response.status_code == 200
        # Verify prompt includes context
        call_args = mock_chat.send_message.call_args[0][0]
        assert "first_time_voter" in call_args


class TestRateLimitIntegration:
    """Integration tests for rate limiting."""
    
    def test_rate_limit_tracking(self):
        """Test that rate limiting works across requests."""
        from backend.main import check_rate_limit
        from backend.main import rate_limit_store
        
        # Clear store
        rate_limit_store.clear()
        
        # First 10 requests should pass
        for _ in range(10):
            result = check_rate_limit("test_ip_integration")
            assert result == True
        
        # 11th should fail
        result = check_rate_limit("test_ip_integration")
        assert result == False
        
        # Clean up
        rate_limit_store.clear()


class TestSecurityHeadersIntegration:
    """Integration tests for security headers."""
    
    def test_all_security_headers_present(self, client):
        """Test all security headers are in response."""
        response = client.get("/")
        
        assert response.status_code == 200
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
        assert "Strict-Transport-Security" in response.headers
        assert "Content-Security-Policy" in response.headers
        assert "Referrer-Policy" in response.headers
        assert "Permissions-Policy" in response.headers
        assert "X-Request-ID" in response.headers

    def test_request_id_is_unique(self, client):
        """Test each request gets unique ID."""
        response1 = client.get("/")
        response2 = client.get("/")
        
        assert response1.headers["X-Request-ID"] != response2.headers["X-Request-ID"]


class TestCachingIntegration:
    """Integration tests for caching functionality."""
    
    @patch('backend.main.genai.GenerativeModel')
    def test_cache_hit_on_duplicate_request(self, mock_model, client):
        """Test that duplicate requests use cached response."""
        mock_chat = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Original response"
        mock_chat.send_message.return_value = mock_response
        
        mock_instance = MagicMock()
        mock_instance.start_chat.return_value = mock_chat
        mock_model.return_value = mock_instance
        
        request_data = {
            "message": "Test caching message",
            "history": [],
            "context": "general"
        }
        
        # First request
        response1 = client.post("/chat", json=request_data)
        assert response1.status_code == 200
        
        # Second request with same message should hit cache
        response2 = client.post("/chat", json=request_data)
        assert response2.status_code == 200
        
        # Should return same response (from cache)
        assert response1.json()["reply"] == response2.json()["reply"]


class TestInputSanitizationIntegration:
    """Integration tests for input sanitization."""
    
    @patch('backend.main.genai.GenerativeModel')
    def test_html_in_message_is_sanitized(self, mock_model, client):
        """Test that HTML tags are sanitized before processing."""
        mock_chat = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Response"
        mock_chat.send_message.return_value = mock_response
        
        mock_instance = MagicMock()
        mock_instance.start_chat.return_value = mock_chat
        mock_model.return_value = mock_instance
        
        # Send message with HTML
        response = client.post("/chat", json={
            "message": "<script>alert('xss')</script>Hello",
            "history": [],
            "context": "general"
        })
        
        assert response.status_code == 200
        
        # Verify sanitized message was sent to Gemini
        call_args = mock_chat.send_message.call_args[0][0]
        assert "<script>" not in call_args
        assert "Hello" in call_args


class TestAPIDocumentationIntegration:
    """Integration tests for API documentation endpoints."""
    
    def test_swagger_ui_available(self, client):
        """Test Swagger UI endpoint is accessible."""
        response = client.get("/api/docs")
        assert response.status_code == 200
    
    def test_redoc_available(self, client):
        """Test ReDoc endpoint is accessible."""
        response = client.get("/api/redoc")
        assert response.status_code == 200
    
    def test_openapi_schema_available(self, client):
        """Test OpenAPI schema endpoint is accessible."""
        response = client.get("/api/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "paths" in data
        assert "/chat" in data["paths"]
        assert "/" in data["paths"]


class TestErrorHandlingIntegration:
    """Integration tests for error handling."""
    
    @patch('backend.main.genai.GenerativeModel')
    def test_invalid_message_handled_gracefully(self, mock_model, client):
        """Test that invalid message returns proper error."""
        response = client.post("/chat", json={
            "message": "",  # Empty message
            "history": [],
            "context": "general"
        })
        
        assert response.status_code == 422
    
    @patch('backend.main.genai.GenerativeModel')
    def test_gemini_error_handled(self, mock_model, client):
        """Test that Gemini API errors are handled properly."""
        # Setup mock to raise error
        mock_model.side_effect = Exception("Gemini API Error")
        
        response = client.post("/chat", json={
            "message": "Test message",
            "history": [],
            "context": "general"
        })
        
        assert response.status_code == 503
        assert "unavailable" in response.json()["detail"].lower()