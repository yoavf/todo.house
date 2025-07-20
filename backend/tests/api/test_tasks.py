import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch

from app.models import TaskStatus


class TestTasksAPI:
    """Test all task-related API endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_tasks_no_auth(self, async_client):
        """Test that accessing tasks without auth header returns 422."""
        response = await async_client.get("/api/tasks/")
        assert response.status_code == 422
        assert "x-user-id" in str(response.json())
    
    @pytest.mark.asyncio
    async def test_get_tasks_empty(self, async_client, mock_user_headers, mock_supabase):
        """Test getting tasks when none exist."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = Mock(data=[], count=0)
        
        response = await async_client.get("/api/tasks/", headers=mock_user_headers)
        assert response.status_code == 200
        assert response.json() == []
    
    @pytest.mark.asyncio
    async def test_get_tasks_with_results(self, async_client, mock_user_headers, mock_supabase, sample_task):
        """Test getting tasks returns proper results."""
        task_dict = {
            "id": sample_task.id,
            "user_id": sample_task.user_id,
            "title": sample_task.title,
            "description": sample_task.description,
            "completed": sample_task.completed,
            "status": sample_task.status.value,
            "created_at": sample_task.created_at.isoformat(),
            "updated_at": sample_task.updated_at.isoformat(),
            "snoozed_until": None
        }
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = Mock(data=[task_dict])
        
        response = await async_client.get("/api/tasks/", headers=mock_user_headers)
        assert response.status_code == 200
        tasks = response.json()
        assert len(tasks) == 1
        assert tasks[0]["title"] == sample_task.title
    
    @pytest.mark.asyncio
    async def test_get_tasks_with_status_filter(self, async_client, mock_user_headers, mock_supabase):
        """Test filtering tasks by status."""
        mock_table = mock_supabase.table.return_value
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = Mock(data=[], count=0)
        
        response = await async_client.get("/api/tasks/?status=active", headers=mock_user_headers)
        assert response.status_code == 200
        
        mock_table.eq.assert_any_call("status", "active")
    
    @pytest.mark.asyncio
    async def test_create_task(self, async_client, mock_user_headers, mock_supabase, sample_task_data):
        """Test creating a new task."""
        created_task = {
            "id": 1,
            "user_id": "test-user-123",
            **sample_task_data,
            "status": sample_task_data["status"].value,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "snoozed_until": None
        }
        
        mock_supabase.table.return_value.insert.return_value.execute.return_value = Mock(data=[created_task])
        
        response = await async_client.post(
            "/api/tasks/",
            headers=mock_user_headers,
            json=sample_task_data
        )
        assert response.status_code == 200
        result = response.json()
        assert result["title"] == sample_task_data["title"]
        assert result["id"] == 1
    
    @pytest.mark.asyncio
    async def test_create_task_invalid_data(self, async_client, mock_user_headers):
        """Test creating task with invalid data returns 422."""
        response = await async_client.post(
            "/api/tasks/",
            headers=mock_user_headers,
            json={"title": ""}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_get_task_by_id(self, async_client, mock_user_headers, mock_supabase, sample_task):
        """Test getting a specific task by ID."""
        task_dict = {
            "id": sample_task.id,
            "user_id": sample_task.user_id,
            "title": sample_task.title,
            "description": sample_task.description,
            "completed": sample_task.completed,
            "status": sample_task.status.value,
            "created_at": sample_task.created_at.isoformat(),
            "updated_at": sample_task.updated_at.isoformat(),
            "snoozed_until": None
        }
        
        mock_table = mock_supabase.table.return_value
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = Mock(data=[task_dict])
        
        response = await async_client.get(f"/api/tasks/{sample_task.id}", headers=mock_user_headers)
        assert response.status_code == 200
        assert response.json()["id"] == sample_task.id
    
    @pytest.mark.asyncio
    async def test_get_task_not_found(self, async_client, mock_user_headers, mock_supabase):
        """Test getting non-existent task returns 404."""
        mock_table = mock_supabase.table.return_value
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = Mock(data=[])
        
        response = await async_client.get("/api/tasks/999", headers=mock_user_headers)
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_update_task(self, async_client, mock_user_headers, mock_supabase):
        """Test updating a task."""
        task_id = 1
        update_data = {"title": "Updated Title", "completed": True}
        
        updated_task = {
            "id": task_id,
            "user_id": "test-user-123",
            "title": "Updated Title",
            "completed": True,
            "status": "completed",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "snoozed_until": None
        }
        
        mock_table = mock_supabase.table.return_value
        mock_table.update.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = Mock(data=[updated_task])
        
        response = await async_client.put(
            f"/api/tasks/{task_id}",
            headers=mock_user_headers,
            json=update_data
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"
    
    @pytest.mark.asyncio
    async def test_delete_task(self, async_client, mock_user_headers, mock_supabase):
        """Test deleting a task."""
        task_id = 1
        
        mock_table = mock_supabase.table.return_value
        mock_table.delete.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = Mock(data=[{"id": task_id}])
        
        response = await async_client.delete(f"/api/tasks/{task_id}", headers=mock_user_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Task deleted successfully"
    
    @pytest.mark.asyncio
    async def test_get_active_tasks(self, async_client, mock_user_headers, mock_supabase):
        """Test getting only active tasks."""
        active_tasks = [
            {
                "id": i,
                "user_id": "test-user-123",
                "title": f"Active Task {i}",
                "completed": False,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "snoozed_until": None
            }
            for i in range(1, 3)
        ]
        
        mock_table = mock_supabase.table.return_value
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = Mock(data=active_tasks)
        
        response = await async_client.get("/api/tasks/active", headers=mock_user_headers)
        assert response.status_code == 200
        tasks = response.json()
        assert len(tasks) == 2
        assert all(task["status"] == "active" for task in tasks)
    
    @pytest.mark.asyncio
    async def test_get_snoozed_tasks(self, async_client, mock_user_headers, mock_supabase):
        """Test getting only snoozed tasks."""
        snoozed_task = {
            "id": 1,
            "user_id": "test-user-123",
            "title": "Snoozed Task",
            "completed": False,
            "status": "snoozed",
            "snoozed_until": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        mock_table = mock_supabase.table.return_value
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = Mock(data=[snoozed_task])
        
        response = await async_client.get("/api/tasks/snoozed", headers=mock_user_headers)
        assert response.status_code == 200
        tasks = response.json()
        assert len(tasks) == 1
        assert tasks[0]["status"] == "snoozed"
        assert tasks[0]["snoozed_until"] is not None
    
    @pytest.mark.asyncio
    async def test_snooze_task(self, async_client, mock_user_headers, mock_supabase):
        """Test snoozing a task."""
        task_id = 1
        snooze_until = datetime.now(timezone.utc) + timedelta(hours=1)
        
        snoozed_task = {
            "id": task_id,
            "user_id": "test-user-123",
            "title": "Task to Snooze",
            "completed": False,
            "status": "snoozed",
            "snoozed_until": snooze_until.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        mock_table = mock_supabase.table.return_value
        mock_table.update.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = Mock(data=[snoozed_task])
        
        response = await async_client.post(
            f"/api/tasks/{task_id}/snooze",
            headers=mock_user_headers,
            json={"snoozed_until": snooze_until.isoformat()}
        )
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "snoozed"
        assert result["snoozed_until"] is not None
    
    @pytest.mark.asyncio
    async def test_snooze_task_indefinitely(self, async_client, mock_user_headers, mock_supabase):
        """Test snoozing a task without a date (indefinite snooze)."""
        task_id = 1
        
        snoozed_task = {
            "id": task_id,
            "user_id": "test-user-123",
            "title": "Task to Snooze Indefinitely",
            "completed": False,
            "status": "snoozed",
            "snoozed_until": datetime.max.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        mock_table = mock_supabase.table.return_value
        mock_table.update.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = Mock(data=[snoozed_task])
        
        response = await async_client.post(
            f"/api/tasks/{task_id}/snooze",
            headers=mock_user_headers,
            json={}
        )
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "snoozed"
    
    @pytest.mark.asyncio
    async def test_unsnooze_task(self, async_client, mock_user_headers, mock_supabase):
        """Test unsnoozing a task."""
        task_id = 1
        
        active_task = {
            "id": task_id,
            "user_id": "test-user-123",
            "title": "Task to Unsnooze",
            "completed": False,
            "status": "active",
            "snoozed_until": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        mock_table = mock_supabase.table.return_value
        mock_table.update.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = Mock(data=[active_task])
        
        response = await async_client.post(f"/api/tasks/{task_id}/unsnooze", headers=mock_user_headers)
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "active"
        assert result["snoozed_until"] is None