import os
import pytest
from typing import AsyncGenerator, Generator
from unittest.mock import Mock, AsyncMock, patch
from fastapi.testclient import TestClient
from httpx import AsyncClient
from datetime import datetime, timezone, timedelta


@pytest.fixture(scope="session", autouse=True)
def set_test_environment():
    """Set required environment variables for tests."""
    os.environ["SUPABASE_URL"] = "https://test.supabase.co"
    os.environ["SUPABASE_ANON_KEY"] = "test-key"
    yield
    os.environ.pop("SUPABASE_URL", None)
    os.environ.pop("SUPABASE_ANON_KEY", None)


from app.main import app
from app.models import Task, TaskStatus


@pytest.fixture
def test_client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI app."""
    with TestClient(app) as client:
        yield client


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for the FastAPI app."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_supabase():
    """Mock the Supabase client for unit tests."""
    with patch("app.database.supabase") as mock:
        mock_table = Mock()
        mock.table.return_value = mock_table
        
        mock_table.select.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.delete.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = Mock(data=[], count=0)
        
        yield mock


@pytest.fixture
def sample_task_data():
    """Provide sample task data for tests."""
    return {
        "title": "Test Task",
        "description": "This is a test task",
        "completed": False,
        "status": TaskStatus.ACTIVE,
        "snoozed_until": None
    }


@pytest.fixture
def sample_task():
    """Provide a sample Task instance."""
    now = datetime.now(timezone.utc)
    return Task(
        id=1,
        user_id="test-user-123",
        title="Test Task",
        description="This is a test task",
        completed=False,
        status=TaskStatus.ACTIVE,
        created_at=now,
        updated_at=now,
        snoozed_until=None
    )


@pytest.fixture
def mock_user_headers():
    """Provide mock user headers for authentication."""
    return {"x-user-id": "test-user-123"}


@pytest.fixture
def mock_supabase_response():
    """Factory fixture for creating mock Supabase responses."""
    def _create_response(data=None, count=None, error=None):
        response = Mock()
        response.data = data if data is not None else []
        response.count = count if count is not None else len(response.data)
        response.error = error
        return response
    return _create_response


@pytest.fixture(autouse=True)
def reset_environment():
    """Reset environment variables before each test."""
    original_env = os.environ.copy()
    yield
    os.environ.clear()
    os.environ.update(original_env)