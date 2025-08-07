"""Tests for single task view functionality."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import Image as ImageModel


@pytest.mark.unit
async def test_get_single_task_success(client: AsyncClient, test_user_id: str, auth_headers: dict):
    """Test successful retrieval of a single task."""
    # Create a task first
    task_data = {
        "title": "Test Single Task",
        "description": "This is a test task",
        "priority": "high",
        "task_types": ["maintenance", "repair"],
    }

    create_response = await client.post(
        "/api/tasks/", json=task_data, headers=auth_headers
    )
    assert create_response.status_code == 200
    created_task = create_response.json()
    task_id = created_task["id"]

    # Get the single task
    response = await client.get(
        f"/api/tasks/{task_id}", headers=auth_headers
    )

    assert response.status_code == 200
    task = response.json()
    assert task["id"] == task_id
    assert task["title"] == "Test Single Task"
    assert task["description"] == "This is a test task"
    assert task["priority"] == "high"
    assert task["task_types"] == ["maintenance", "repair"]
    assert "snooze_options" in task  # Should include snooze options


@pytest.mark.unit
async def test_get_single_task_not_found(client: AsyncClient, test_user_id: str, auth_headers: dict):
    """Test getting a non-existent task returns 404."""
    response = await client.get("/api/tasks/99999", headers=auth_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


@pytest.mark.unit
async def test_get_single_task_wrong_user(client: AsyncClient, test_user_id: str, auth_headers: dict):
    """Test that users cannot access other users' tasks."""
    # Create a task
    task_data = {"title": "Private Task"}
    create_response = await client.post(
        "/api/tasks/", json=task_data, headers=auth_headers
    )
    assert create_response.status_code == 200
    task_id = create_response.json()["id"]

    # Create JWT for a different user
    import uuid
    from jose import jwt
    from datetime import datetime, timezone, timedelta
    import os
    
    different_user_id = str(uuid.uuid4())
    secret = os.getenv("JWT_SECRET", os.getenv("NEXTAUTH_SECRET", "test-secret-for-testing-only"))
    different_user_payload = {
        "sub": different_user_id,
        "email": f"different-{different_user_id}@example.com",
        "name": "Different User",
        "picture": None,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    different_user_token = jwt.encode(different_user_payload, secret, algorithm="HS256")
    different_user_headers = {"Authorization": f"Bearer {different_user_token}"}
    
    response = await client.get(
        f"/api/tasks/{task_id}", headers=different_user_headers
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


@pytest.mark.unit
async def test_get_task_with_guide_content(client: AsyncClient, test_user_id: str, auth_headers: dict):
    """Test getting a task with how-to guide content."""
    task_data = {
        "title": "Install Light Fixture",
        "description": "Replace old fixture with new LED",
        "content": {
            "type": "how_to_guide",
            "markdown": "# Installation Guide\n\n1. Turn off power\n2. Remove old fixture\n3. Install new fixture",
            "images": [
                {"url": "/images/step1.jpg", "caption": "Turn off breaker"},
                {"url": "/images/step2.jpg", "caption": "Remove fixture"},
            ],
            "videos": [
                {
                    "url": "https://youtube.com/watch?v=123",
                    "title": "Installation Video",
                }
            ],
        },
    }

    create_response = await client.post(
        "/api/tasks/", json=task_data, headers=auth_headers
    )
    assert create_response.status_code == 200
    task_id = create_response.json()["id"]

    # Get the task
    response = await client.get(
        f"/api/tasks/{task_id}", headers=auth_headers
    )

    assert response.status_code == 200
    task = response.json()
    assert task["content"]["type"] == "how_to_guide"
    assert "Installation Guide" in task["content"]["markdown"]
    assert len(task["content"]["images"]) == 2
    assert len(task["content"]["videos"]) == 1


@pytest.mark.unit
async def test_get_task_with_shopping_list(client: AsyncClient, test_user_id: str, auth_headers: dict):
    """Test getting a task with shopping list content."""
    task_data = {
        "title": "Buy Plumbing Supplies",
        "content": {
            "type": "shopping_list",
            "items": [
                {"name": 'PVC Pipe 1"', "quantity": "10 ft", "purchased": False},
                {"name": "Pipe Glue", "quantity": "1", "purchased": False},
                {"name": "Teflon Tape", "quantity": "2 rolls", "purchased": True},
            ],
            "store": "Home Depot",
            "estimated_cost": 45.99,
        },
    }

    create_response = await client.post(
        "/api/tasks/", json=task_data, headers=auth_headers
    )
    assert create_response.status_code == 200
    task_id = create_response.json()["id"]

    # Get the task
    response = await client.get(
        f"/api/tasks/{task_id}", headers=auth_headers
    )

    assert response.status_code == 200
    task = response.json()
    assert task["content"]["type"] == "shopping_list"
    assert len(task["content"]["items"]) == 3
    assert task["content"]["store"] == "Home Depot"
    assert task["content"]["estimated_cost"] == 45.99
    assert task["content"]["items"][2]["purchased"] is True


@pytest.mark.unit
async def test_get_task_with_checklist(client: AsyncClient, test_user_id: str, auth_headers: dict):
    """Test getting a task with checklist content."""
    task_data = {
        "title": "Home Inspection Checklist",
        "content": {
            "type": "checklist",
            "items": [
                {"id": "1", "text": "Check smoke detectors", "completed": True},
                {"id": "2", "text": "Test GFCI outlets", "completed": False},
                {"id": "3", "text": "Inspect roof", "completed": False},
            ],
        },
    }

    create_response = await client.post(
        "/api/tasks/", json=task_data, headers=auth_headers
    )
    assert create_response.status_code == 200
    task_id = create_response.json()["id"]

    # Get the task
    response = await client.get(
        f"/api/tasks/{task_id}", headers=auth_headers
    )

    assert response.status_code == 200
    task = response.json()
    assert task["content"]["type"] == "checklist"
    assert len(task["content"]["items"]) == 3
    assert task["content"]["items"][0]["completed"] is True
    assert task["content"]["items"][1]["completed"] is False


@pytest.mark.integration
async def test_get_task_with_image_urls(
    client: AsyncClient, test_user_id: str, auth_headers: dict, db_session: AsyncSession
):
    """Test that task with images includes proper image URLs."""
    import uuid

    # Create an image in the database
    image = ImageModel(
        id=uuid.uuid4(),
        user_id=uuid.UUID(test_user_id),
        storage_path="test/image.jpg",
        filename="test-image.jpg",
        content_type="image/jpeg",
        file_size=1024,
        analysis_status="completed",
    )
    db_session.add(image)
    await db_session.commit()
    await db_session.refresh(image)

    # Create a task with the image
    task_data = {
        "title": "Task with Image",
        "source": "ai_generated",
        "source_image_id": str(image.id),
    }

    create_response = await client.post(
        "/api/tasks/", json=task_data, headers=auth_headers
    )
    assert create_response.status_code == 200
    task_id = create_response.json()["id"]

    # Get the task
    response = await client.get(
        f"/api/tasks/{task_id}", headers=auth_headers
    )

    assert response.status_code == 200
    task = response.json()
    assert task["image_url"] == f"/api/images/proxy/{image.id}"
    assert task["thumbnail_url"] == f"/api/images/proxy/{image.id}"


@pytest.mark.unit
async def test_get_task_includes_locale_based_snooze_options(
    client: AsyncClient, test_user_id: str, auth_headers: dict
):
    """Test that single task includes locale-specific snooze options."""
    # Create a task
    task_data = {"title": "Test Task"}
    create_response = await client.post(
        "/api/tasks/", json=task_data, headers=auth_headers
    )
    assert create_response.status_code == 200
    task_id = create_response.json()["id"]

    # Get task with Spanish locale
    headers = auth_headers.copy()
    headers["Accept-Language"] = "es_ES"
    response = await client.get(
        f"/api/tasks/{task_id}",
        headers=headers,
    )

    assert response.status_code == 200
    task = response.json()
    assert "snooze_options" in task
    # Check that snooze options are present
    assert "context_sensitive" in task["snooze_options"]
    assert "next_week" in task["snooze_options"]
    assert "few_weeks" in task["snooze_options"]
    assert "later" in task["snooze_options"]
