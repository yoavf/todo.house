import pytest
from httpx import AsyncClient
from faker import Faker

fake = Faker()

@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, setup_test_user):
    """Test creating a new task."""
    user_id = setup_test_user
    task_data = {
        "title": fake.sentence(nb_words=4),
        "description": fake.text(max_nb_chars=100),
        "priority": "medium"
    }
    
    response = await client.post(
        "/api/tasks/",
        json=task_data,
        headers={"x-user-id": user_id}
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
async def test_get_tasks_empty(client: AsyncClient, setup_test_user):
    """Test getting tasks when none exist for user."""
    user_id = setup_test_user
    response = await client.get(
        "/api/tasks/",
        headers={"x-user-id": user_id}
    )
    
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_get_tasks_with_filter(client: AsyncClient, setup_test_user):
    """Test filtering tasks by status."""
    user_id = setup_test_user
    
    # Create an active task
    await client.post(
        "/api/tasks/",
        json={"title": "Active task", "priority": "high"},
        headers={"x-user-id": user_id}
    )
    
    # Create and complete a task
    task_response = await client.post(
        "/api/tasks/",
        json={"title": "Completed task", "priority": "low"},
        headers={"x-user-id": user_id}
    )
    task_id = task_response.json()["id"]
    
    await client.put(
        f"/api/tasks/{task_id}",
        json={"completed": True},
        headers={"x-user-id": user_id}
    )
    
    # Get only active tasks
    response = await client.get(
        "/api/tasks/?status=active",
        headers={"x-user-id": user_id}
    )
    
    tasks = response.json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Active task"
    assert tasks[0]["status"] == "active"

@pytest.mark.asyncio
async def test_update_task(client: AsyncClient, setup_test_user):
    """Test updating a task."""
    user_id = setup_test_user
    
    # Create a task
    create_response = await client.post(
        "/api/tasks/",
        json={"title": "Original title", "priority": "low"},
        headers={"x-user-id": user_id}
    )
    task_id = create_response.json()["id"]
    
    # Update the task
    update_data = {
        "title": "Updated title",
        "priority": "high",
        "description": "Now with a description"
    }
    
    response = await client.put(
        f"/api/tasks/{task_id}",
        json=update_data,
        headers={"x-user-id": user_id}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated title"
    assert data["priority"] == "high"
    assert data["description"] == "Now with a description"

@pytest.mark.asyncio
async def test_complete_task(client: AsyncClient, setup_test_user):
    """Test marking a task as completed."""
    user_id = setup_test_user
    
    # Create a task
    create_response = await client.post(
        "/api/tasks/",
        json={"title": "Task to complete", "priority": "medium"},
        headers={"x-user-id": user_id}
    )
    task_id = create_response.json()["id"]
    
    # Complete the task
    response = await client.put(
        f"/api/tasks/{task_id}",
        json={"completed": True},
        headers={"x-user-id": user_id}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["completed"] is True
    assert data["status"] == "completed"

@pytest.mark.asyncio
async def test_delete_task(client: AsyncClient, setup_test_user):
    """Test deleting a task."""
    user_id = setup_test_user
    
    # Create a task
    create_response = await client.post(
        "/api/tasks/",
        json={"title": "Task to delete", "priority": "low"},
        headers={"x-user-id": user_id}
    )
    task_id = create_response.json()["id"]
    
    # Delete the task
    response = await client.delete(
        f"/api/tasks/{task_id}",
        headers={"x-user-id": user_id}
    )
    
    assert response.status_code == 200
    assert response.json() == {"message": "Task deleted successfully"}
    
    # Verify it's gone
    get_response = await client.get(
        f"/api/tasks/{task_id}",
        headers={"x-user-id": user_id}
    )
    assert get_response.status_code == 404

@pytest.mark.asyncio
async def test_task_not_found(client: AsyncClient, setup_test_user):
    """Test accessing non-existent task returns 404."""
    user_id = setup_test_user
    response = await client.get(
        "/api/tasks/99999",
        headers={"x-user-id": user_id}
    )
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"

@pytest.mark.asyncio
async def test_missing_user_header(client: AsyncClient):
    """Test that requests without user header fail."""
    response = await client.get("/api/tasks/")
    
    assert response.status_code == 422  # Unprocessable Entity
    assert "x-user-id" in str(response.json())