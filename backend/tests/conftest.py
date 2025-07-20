import uuid

import pytest
import pytest_asyncio
from dotenv import load_dotenv
from httpx import AsyncClient, ASGITransport

# Load test environment variables before importing app
load_dotenv(".env.test", override=True)

from app.database import supabase  # noqa: E402
from app.main import app  # noqa: E402

@pytest.fixture
def test_user_id():
    """Generate a unique user ID for each test."""
    return str(uuid.uuid4())

@pytest_asyncio.fixture
async def setup_test_user(test_user_id):
    """
    Create a test user in the database and clean up after test.
    This fixture ensures tests can create tasks without foreign key errors.
    """
    # Create test user
    user_data = {
        "id": test_user_id,
        "email": f"test-{test_user_id}@example.com",
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    try:
        # Insert user (might need to adjust based on your users table structure)
        supabase.table("users").insert(user_data).execute()
    except Exception as e:
        # User might already exist or table structure might be different
        print(f"Could not create test user: {e}")
    
    yield test_user_id
    
    # Cleanup after test
    try:
        # Delete all tasks for this user
        supabase.table("tasks").delete().eq("user_id", test_user_id).execute()
        # Delete the test user
        supabase.table("users").delete().eq("id", test_user_id).execute()
    except Exception as e:
        print(f"Cleanup error: {e}")

@pytest_asyncio.fixture
async def client():
    """
    Create an async test client for testing FastAPI endpoints.
    
    This fixture creates a new AsyncClient instance for each test,
    ensuring test isolation. The 'async with' statement ensures
    proper cleanup after each test.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

@pytest.fixture
def sample_todo():
    """
    Provide sample todo data for testing.
    
    Fixtures like this help keep test data consistent and 
    make tests more readable by avoiding repetition.
    """
    return {
        "title": "Test Todo",
        "description": "This is a test todo item",
        "completed": False
    }