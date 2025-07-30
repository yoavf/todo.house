import pytest
from httpx import AsyncClient
from unittest.mock import MagicMock, AsyncMock
import uuid
from datetime import datetime
from app.database import Task as TaskModel
from app.models import TaskStatus, TaskSource, TaskPriority


@pytest.mark.asyncio
async def test_create_task_unit():
    """Unit test for creating a task - mocks database session."""
    from app.main import app
    from httpx import ASGITransport
    
    user_id = str(uuid.uuid4())
    task_data = {
        "title": "Test Task",
        "description": "Test Description",
        "priority": "medium",
    }

    # Mock task would be created by the endpoint
    # We're testing the endpoint behavior, not the exact object

    # Mock the database session dependency
    from app.database import get_session_dependency
    
    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    mock_session.commit = AsyncMock()
    async def mock_refresh(obj):
        obj.id = 1
        if not hasattr(obj, 'created_at') or obj.created_at is None:
            obj.created_at = datetime.now()
        if not hasattr(obj, 'updated_at') or obj.updated_at is None:
            obj.updated_at = datetime.now()
    
    mock_session.refresh = AsyncMock(side_effect=mock_refresh)
    
    async def mock_get_session():
        yield mock_session
    
    app.dependency_overrides[get_session_dependency] = mock_get_session
    
    # Make the request
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/tasks/", json=task_data, headers={"x-user-id": user_id}
        )

        # Since the endpoint creates a new TaskModel, we can't easily check the exact response
        # but we can verify the status code
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == task_data["title"]
        assert data["status"] == "active"

        # Verify the mock was called
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
    
    # Clean up overrides
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_tasks_unit():
    """Unit test for getting tasks - mocks database session."""
    from app.main import app
    from httpx import ASGITransport
    from app.database import get_session_dependency
    
    user_id = str(uuid.uuid4())

    # Create mock tasks
    mock_tasks = [
        TaskModel(
            id=1,
            title="Task 1",
            status=TaskStatus.ACTIVE,
            user_id=user_id,
            description=None,
            priority=TaskPriority.MEDIUM,
            source=TaskSource.MANUAL,
            completed=False,
            snoozed_until=None,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        ),
        TaskModel(
            id=2,
            title="Task 2",
            status=TaskStatus.COMPLETED,
            user_id=user_id,
            description=None,
            priority=TaskPriority.MEDIUM,
            source=TaskSource.MANUAL,
            completed=True,
            snoozed_until=None,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        ),
    ]

    # Mock the database session
    mock_session = AsyncMock()
    
    # Mock the query execution
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = mock_tasks
    mock_session.execute = AsyncMock(return_value=mock_result)
    
    async def mock_get_session():
        yield mock_session
    
    app.dependency_overrides[get_session_dependency] = mock_get_session

    # Make request
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/tasks/", headers={"x-user-id": user_id})

        assert response.status_code == 200
        tasks = response.json()
        assert len(tasks) == 2
        assert tasks[0]["title"] == "Task 1"
        assert tasks[1]["title"] == "Task 2"
    
    # Clean up overrides
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_task_not_found():
    """Test deleting non-existent task returns 404."""
    from app.main import app
    from httpx import ASGITransport
    from app.database import get_session_dependency
    
    user_id = str(uuid.uuid4())

    # Mock the database session
    mock_session = AsyncMock()
    
    # Mock the query execution to return None (task not found)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute = AsyncMock(return_value=mock_result)
    
    async def mock_get_session():
        yield mock_session
    
    app.dependency_overrides[get_session_dependency] = mock_get_session

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.delete("/api/tasks/999", headers={"x-user-id": user_id})

        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"
    
    # Clean up overrides
    app.dependency_overrides.clear()