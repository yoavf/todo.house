import pytest
from httpx import AsyncClient
from faker import Faker

fake = Faker()


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, setup_test_user, auth_headers: dict):
    """Test creating a new task."""
    task_data = {
        "title": fake.sentence(nb_words=4),
        "description": fake.text(max_nb_chars=100),
        "priority": "medium",
    }

    response = await client.post(
        "/api/tasks/", json=task_data, headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == task_data["title"]
    assert data["description"] == task_data["description"]
    assert data["priority"] == task_data["priority"]
    assert data["status"] == "active"
    assert data["completed"] is False
    assert "id" in data


@pytest.mark.asyncio
async def test_get_tasks_empty(client: AsyncClient, setup_test_user, auth_headers: dict):
    """Test getting tasks when none exist for user."""
    response = await client.get("/api/tasks/", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_tasks_with_filter(client: AsyncClient, setup_test_user, auth_headers: dict):
    """Test filtering tasks by status."""

    # Create an active task
    await client.post(
        "/api/tasks/",
        json={"title": "Active task", "priority": "high"},
        headers=auth_headers,
    )

    # Create and complete a task
    task_response = await client.post(
        "/api/tasks/",
        json={"title": "Completed task", "priority": "low"},
        headers=auth_headers,
    )
    task_id = task_response.json()["id"]

    await client.put(
        f"/api/tasks/{task_id}",
        json={"completed": True},
        headers=auth_headers,
    )

    # Get only active tasks
    response = await client.get(
        "/api/tasks/?status=active", headers=auth_headers
    )

    tasks = response.json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Active task"
    assert tasks[0]["status"] == "active"


@pytest.mark.asyncio
async def test_update_task(client: AsyncClient, setup_test_user, auth_headers: dict):
    """Test updating a task."""

    # Create a task
    create_response = await client.post(
        "/api/tasks/",
        json={"title": "Original title", "priority": "low"},
        headers=auth_headers,
    )
    task_id = create_response.json()["id"]

    # Update the task
    update_data = {
        "title": "Updated title",
        "priority": "high",
        "description": "Now with a description",
    }

    response = await client.put(
        f"/api/tasks/{task_id}", json=update_data, headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated title"
    assert data["priority"] == "high"
    assert data["description"] == "Now with a description"


@pytest.mark.asyncio
async def test_complete_task(client: AsyncClient, setup_test_user, auth_headers: dict):
    """Test marking a task as completed."""

    # Create a task
    create_response = await client.post(
        "/api/tasks/",
        json={"title": "Task to complete", "priority": "medium"},
        headers=auth_headers,
    )
    task_id = create_response.json()["id"]

    # Complete the task
    response = await client.put(
        f"/api/tasks/{task_id}",
        json={"completed": True},
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["completed"] is True
    assert data["status"] == "completed"


@pytest.mark.asyncio
async def test_delete_task(client: AsyncClient, setup_test_user, auth_headers: dict):
    """Test deleting a task."""

    # Create a task
    create_response = await client.post(
        "/api/tasks/",
        json={"title": "Task to delete", "priority": "low"},
        headers=auth_headers,
    )
    task_id = create_response.json()["id"]

    # Delete the task
    response = await client.delete(
        f"/api/tasks/{task_id}", headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Task deleted successfully"}

    # Verify it's gone
    get_response = await client.get(
        f"/api/tasks/{task_id}", headers=auth_headers
    )
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_task_not_found(client: AsyncClient, setup_test_user, auth_headers: dict):
    """Test accessing non-existent task returns 404."""
    response = await client.get("/api/tasks/99999", headers=auth_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


@pytest.mark.asyncio
async def test_missing_user_header(client: AsyncClient):
    """Test that requests without authentication fail."""
    response = await client.get("/api/tasks/")

    assert response.status_code == 401  # Unauthorized
    # The error message should indicate authentication is required
    error_detail = response.json()["detail"]
    assert "Authentication required" in error_detail or "JWT token" in error_detail
