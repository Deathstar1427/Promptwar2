"""
Pytest configuration and fixtures for backend tests.

This module provides shared fixtures for FastAPI testing,
including an async client for making test requests to the API.
"""

import pytest
from httpx import AsyncClient
from main import app


@pytest.fixture
async def client():
    """
    Fixture providing an async HTTP client for testing the FastAPI app.

    Returns:
        AsyncClient: An async HTTP client configured for the test app.
    """
    async with AsyncClient(app=app, base_url="http://test") as async_client:
        yield async_client
