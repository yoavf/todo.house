"""Additional unit tests for tasks endpoints to improve coverage."""

import uuid
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

from app.models import TaskStatus, TaskPriority, TaskSource, TaskType


@pytest.mark.unit
class TestTasksCoverage:
    """Additional tests to improve coverage for tasks.py."""


    async def test_get_active_tasks(self, client, test_user_id):
        """Test getting only active tasks."""
        # Create tasks with different statuses
        await client.post(
            "/api/tasks/",
            json={"title": "Active Task", "status": TaskStatus.ACTIVE.value},
            headers={"x-user-id": str(test_user_id)}
        )
        
        await client.post(
            "/api/tasks/",
            json={"title": "Snoozed Task", "status": TaskStatus.SNOOZED.value},
            headers={"x-user-id": str(test_user_id)}
        )
        
        await client.post(
            "/api/tasks/",
            json={"title": "Completed Task", "status": TaskStatus.COMPLETED.value},
            headers={"x-user-id": str(test_user_id)}
        )
        
        # Get active tasks
        response = await client.get(
            "/api/tasks/active",
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 200
        tasks = response.json()
        
        # Should only have active tasks
        assert all(task["status"] == TaskStatus.ACTIVE.value for task in tasks)
        assert any(task["title"] == "Active Task" for task in tasks)
        assert not any(task["title"] == "Snoozed Task" for task in tasks)
        assert not any(task["title"] == "Completed Task" for task in tasks)

    async def test_get_snoozed_tasks(self, client, test_user_id):
        """Test getting only snoozed tasks."""
        # Create a snoozed task
        await client.post(
            "/api/tasks/",
            json={
                "title": "Snoozed Task",
                "status": TaskStatus.SNOOZED.value,
                "snoozed_until": (datetime.now() + timedelta(days=1)).isoformat()
            },
            headers={"x-user-id": str(test_user_id)}
        )
        
        # Create an active task
        await client.post(
            "/api/tasks/",
            json={"title": "Active Task"},
            headers={"x-user-id": str(test_user_id)}
        )
        
        # Get snoozed tasks
        response = await client.get(
            "/api/tasks/snoozed",
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 200
        tasks = response.json()
        
        # Should only have snoozed tasks
        assert all(task["status"] == TaskStatus.SNOOZED.value for task in tasks)
        assert any(task["title"] == "Snoozed Task" for task in tasks)
        assert not any(task["title"] == "Active Task" for task in tasks)

    async def test_get_task_not_found(self, client, test_user_id):
        """Test getting a non-existent task."""
        fake_task_id = 99999
        
        response = await client.get(
            f"/api/tasks/{fake_task_id}",
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"

    async def test_update_task_not_found(self, client, test_user_id):
        """Test updating a non-existent task."""
        fake_task_id = 99999
        
        response = await client.put(
            f"/api/tasks/{fake_task_id}",
            json={"title": "Updated Title"},
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"

    async def test_update_task_completed_status_transition(self, client, test_user_id):
        """Test updating task completion triggers status transition."""
        # Create an active task
        create_resp = await client.post(
            "/api/tasks/",
            json={"title": "Task to complete"},
            headers={"x-user-id": str(test_user_id)}
        )
        task_id = create_resp.json()["id"]
        
        # Mark as completed
        response = await client.put(
            f"/api/tasks/{task_id}",
            json={"completed": True},
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is True
        assert data["status"] == TaskStatus.COMPLETED.value
        
        # Mark as not completed
        response = await client.put(
            f"/api/tasks/{task_id}",
            json={"completed": False},
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is False
        assert data["status"] == TaskStatus.ACTIVE.value
        assert data["snoozed_until"] is None

    async def test_update_task_all_fields(self, client, test_user_id):
        """Test updating all task fields."""
        # Create a basic task
        create_resp = await client.post(
            "/api/tasks/",
            json={"title": "Original Task"},
            headers={"x-user-id": str(test_user_id)}
        )
        task_id = create_resp.json()["id"]
        
        # Update all fields
        update_data = {
            "title": "Updated Task",
            "description": "New description",
            "priority": TaskPriority.HIGH.value,
            "status": TaskStatus.SNOOZED.value,
            "snoozed_until": (datetime.now() + timedelta(hours=2)).isoformat(),
            "task_types": [TaskType.MAINTENANCE.value, TaskType.PLUMBING.value],
            "tags": ["urgent", "indoor"],
            "metrics": {"effort": 3, "time_estimate": 120}
        }
        
        response = await client.put(
            f"/api/tasks/{task_id}",
            json=update_data,
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Task"
        assert data["description"] == "New description"
        assert data["priority"] == TaskPriority.HIGH.value
        assert data["status"] == TaskStatus.SNOOZED.value
        assert len(data["task_types"]) == 2
        assert data["tags"] == ["urgent", "indoor"]
        assert data["metrics"]["effort"] == 3

    async def test_delete_task_success(self, client, test_user_id):
        """Test deleting a task successfully."""
        # Create a task
        create_resp = await client.post(
            "/api/tasks/",
            json={"title": "Task to delete"},
            headers={"x-user-id": str(test_user_id)}
        )
        task_id = create_resp.json()["id"]
        
        # Delete it
        response = await client.delete(
            f"/api/tasks/{task_id}",
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "Task deleted successfully"
        
        # Verify it's gone
        get_resp = await client.get(
            f"/api/tasks/{task_id}",
            headers={"x-user-id": str(test_user_id)}
        )
        assert get_resp.status_code == 404

    async def test_delete_task_not_found(self, client, test_user_id):
        """Test deleting a non-existent task."""
        fake_task_id = 99999
        
        response = await client.delete(
            f"/api/tasks/{fake_task_id}",
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"

    async def test_snooze_task_with_date(self, client, test_user_id):
        """Test snoozing a task with specific date."""
        # Create a task
        create_resp = await client.post(
            "/api/tasks/",
            json={"title": "Task to snooze"},
            headers={"x-user-id": str(test_user_id)}
        )
        task_id = create_resp.json()["id"]
        
        # Snooze it
        snooze_until = datetime.now() + timedelta(days=2)
        response = await client.post(
            f"/api/tasks/{task_id}/snooze",
            json={"snooze_until": snooze_until.isoformat()},
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == TaskStatus.SNOOZED.value
        assert data["snoozed_until"] is not None

    async def test_snooze_task_indefinitely(self, client, test_user_id):
        """Test snoozing a task without date (indefinitely)."""
        # Create a task
        create_resp = await client.post(
            "/api/tasks/",
            json={"title": "Task to snooze forever"},
            headers={"x-user-id": str(test_user_id)}
        )
        task_id = create_resp.json()["id"]
        
        # Snooze it without date
        response = await client.post(
            f"/api/tasks/{task_id}/snooze",
            json={},
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == TaskStatus.SNOOZED.value
        assert data["snoozed_until"] is not None
        # Should be far in the future (year 9999)
        snooze_year = datetime.fromisoformat(data["snoozed_until"].replace("Z", "+00:00")).year
        assert snooze_year > 9000

    async def test_snooze_task_not_found(self, client, test_user_id):
        """Test snoozing a non-existent task."""
        fake_task_id = 99999
        
        response = await client.post(
            f"/api/tasks/{fake_task_id}/snooze",
            json={},
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"

    async def test_unsnooze_task(self, client, test_user_id):
        """Test unsnoozing a snoozed task."""
        # Create and snooze a task
        create_resp = await client.post(
            "/api/tasks/",
            json={
                "title": "Snoozed task",
                "status": TaskStatus.SNOOZED.value,
                "snoozed_until": (datetime.now() + timedelta(days=1)).isoformat()
            },
            headers={"x-user-id": str(test_user_id)}
        )
        task_id = create_resp.json()["id"]
        
        # Unsnooze it
        response = await client.post(
            f"/api/tasks/{task_id}/unsnooze",
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == TaskStatus.ACTIVE.value
        assert data["snoozed_until"] is None

    async def test_unsnooze_task_not_found(self, client, test_user_id):
        """Test unsnoozing a non-existent task."""
        fake_task_id = 99999
        
        response = await client.post(
            f"/api/tasks/{fake_task_id}/unsnooze",
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"

    async def test_create_ai_task_success(self, client, test_user_id):
        """Test creating an AI-generated task."""
        with patch("app.services.task_service.TaskService.create_single_ai_task") as mock_create:
            # Mock successful task creation - must be a full Task object
            from app.models import Task
            mock_task = Task(
                id=1,
                title="AI Task",
                description="Test AI task",
                priority=TaskPriority.MEDIUM,
                completed=False,
                status=TaskStatus.ACTIVE,
                user_id=test_user_id,
                source=TaskSource.AI_GENERATED,
                source_image_id=uuid.uuid4(),
                ai_confidence=0.95,
                ai_provider="test-ai",
                created_at=datetime.now(),
                updated_at=datetime.now(),
                task_types=[]
            )
            mock_create.return_value = mock_task
            
            ai_task_data = {
                "title": "AI Task",
                "description": "Generated from image",
                "priority": TaskPriority.HIGH.value,
                "source_image_id": str(uuid.uuid4()),
                "ai_confidence": 0.95,
                "ai_provider": "test-ai"
            }
            
            response = await client.post(
                "/api/tasks/ai-generated",
                json=ai_task_data,
                headers={"x-user-id": str(test_user_id)}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["title"] == "AI Task"
            assert data["source"] == TaskSource.AI_GENERATED.value

    async def test_create_ai_task_failure(self, client, test_user_id):
        """Test AI task creation failure."""
        with patch("app.services.task_service.TaskService.create_single_ai_task") as mock_create:
            # Mock task creation failure
            mock_create.return_value = None
            
            ai_task_data = {
                "title": "AI Task",
                "description": "Generated from image",
                "priority": TaskPriority.HIGH.value,
                "source_image_id": str(uuid.uuid4()),
                "ai_confidence": 0.95,
                "ai_provider": "test-ai"
            }
            
            response = await client.post(
                "/api/tasks/ai-generated",
                json=ai_task_data,
                headers={"x-user-id": str(test_user_id)}
            )
            
            assert response.status_code == 500
            assert response.json()["detail"] == "Failed to create AI task"

    async def test_get_ai_tasks_with_images(self, client, test_user_id):
        """Test getting AI-generated tasks."""
        # Create an AI task
        await client.post(
            "/api/tasks/",
            json={
                "title": "AI Generated Task",
                "source": TaskSource.AI_GENERATED.value,
                "source_image_id": str(uuid.uuid4()),
                "ai_confidence": 0.85,
                "ai_provider": "test-ai"
            },
            headers={"x-user-id": str(test_user_id)}
        )
        
        # Create a manual task
        await client.post(
            "/api/tasks/",
            json={"title": "Manual Task"},
            headers={"x-user-id": str(test_user_id)}
        )
        
        # Get AI tasks
        response = await client.get(
            "/api/tasks/ai-generated/with-images",
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert response.status_code == 200
        tasks = response.json()
        
        # Should only have AI-generated tasks
        assert all(task["source"] == TaskSource.AI_GENERATED.value for task in tasks)
        assert any(task["title"] == "AI Generated Task" for task in tasks)
        assert not any(task["title"] == "Manual Task" for task in tasks)

    async def test_get_tasks_with_filters(self, client, test_user_id):
        """Test getting tasks with status and source filters."""
        # Create tasks with different statuses and sources
        await client.post(
            "/api/tasks/",
            json={
                "title": "Active Manual",
                "status": TaskStatus.ACTIVE.value,
                "source": TaskSource.MANUAL.value
            },
            headers={"x-user-id": str(test_user_id)}
        )
        
        await client.post(
            "/api/tasks/",
            json={
                "title": "Active AI",
                "status": TaskStatus.ACTIVE.value,
                "source": TaskSource.AI_GENERATED.value,
                "source_image_id": str(uuid.uuid4()),
                "ai_confidence": 0.8,
                "ai_provider": "test"
            },
            headers={"x-user-id": str(test_user_id)}
        )
        
        await client.post(
            "/api/tasks/",
            json={
                "title": "Completed Manual",
                "status": TaskStatus.COMPLETED.value,
                "source": TaskSource.MANUAL.value
            },
            headers={"x-user-id": str(test_user_id)}
        )
        
        # Test status filter
        response = await client.get(
            "/api/tasks/?status=active",
            headers={"x-user-id": str(test_user_id)}
        )
        tasks = response.json()
        assert all(task["status"] == TaskStatus.ACTIVE.value for task in tasks)
        
        # Test source filter
        response = await client.get(
            "/api/tasks/?source=ai_generated",
            headers={"x-user-id": str(test_user_id)}
        )
        tasks = response.json()
        assert all(task["source"] == TaskSource.AI_GENERATED.value for task in tasks)
        
        # Test combined filters
        response = await client.get(
            "/api/tasks/?status=active&source=manual",
            headers={"x-user-id": str(test_user_id)}
        )
        tasks = response.json()
        assert all(task["status"] == TaskStatus.ACTIVE.value for task in tasks)
        assert all(task["source"] == TaskSource.MANUAL.value for task in tasks)
        assert any(task["title"] == "Active Manual" for task in tasks)