import sys
from pathlib import Path

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
import pytest_asyncio
from main import app

# Create a test client
client = TestClient(app)

@pytest.fixture
async def async_client():
    """
    Fixture that creates an async client for testing async endpoints
    """
    async with AsyncClient(base_url="http://testserver") as ac:
        yield ac

def test_read_root():
    """
    Test the root endpoint synchronously
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from Vocal Backend"}

def test_health_check():
    """
    Test the health check endpoint synchronously
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.asyncio
async def test_read_root_async(async_client):
    """
    Test the root endpoint asynchronously
    """
    response = await async_client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from Vocal Backend"}

@pytest.mark.asyncio
async def test_health_check_async(async_client):
    """
    Test the health check endpoint asynchronously
    """
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_error_handling():
    """
    Test error handling by accessing a non-existent endpoint
    """
    response = client.get("/nonexistent")
    assert response.status_code == 404
    assert "detail" in response.json()  # FastAPI uses 'detail' for error messages

# Test cases for different HTTP methods
@pytest.mark.parametrize(
    "method,endpoint,expected_status",
    [
        ("get", "/", 200),
        ("post", "/", 405),  # Method not allowed
        ("put", "/", 405),
        ("delete", "/", 405),
    ],
)
def test_http_methods(method, endpoint, expected_status):
    """
    Test different HTTP methods on endpoints
    """
    response = client.request(method, endpoint)
    assert response.status_code == expected_status 