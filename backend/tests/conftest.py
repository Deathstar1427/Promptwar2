"""Pytest configuration and fixtures for Election Assistant backend tests."""

import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient


@pytest.fixture
def mock_gemini_response():
    """Mock response from Gemini API."""
    mock_response = MagicMock()
    mock_response.text = "This is a test response from Gemini"
    return mock_response


@pytest.fixture
def mock_genai_model():
    """Mock Google GenerativeModel."""
    with patch('google.generativeai.GenerativeModel') as mock_model:
        mock_instance = MagicMock()
        mock_model.return_value = mock_instance
        mock_instance.generate_content = MagicMock()
        mock_instance.start_chat = MagicMock()
        yield mock_instance


@pytest.fixture
def client():
    """Create FastAPI test client."""
    from main import app
    return TestClient(app)


@pytest.fixture
def sample_chat_request():
    """Sample valid chat request payload."""
    return {
        "message": "How do I register to vote?",
        "history": [],
        "context": "general"
    }


@pytest.fixture
def sample_history():
    """Sample conversation history."""
    return [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi! How can I help?"}
    ]