import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
import uuid
from datetime import datetime

@pytest.mark.asyncio
async def test_create_task_unit(client: AsyncClient):
    """Unit test for creating a task - mocks database calls."""
    
    user_id = str(uuid.uuid4())
    task_data = {
        "title": "Test Task",
        "description": "Test Description", 
        "priority": "medium"
    }
    
    # Mock the database response
    mock_response = MagicMock()
    mock_response.data = [{
        "id": 1,
        "user_id": user_id,
        "title": task_data["title"],
        "description": task_data["description"],
        "priority": task_data["priority"],
        "status": "active",
        "completed": False,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }]
    
    # Patch the supabase client
    with patch('app.tasks.supabase') as mock_supabase:
        # Setup the mock chain: supabase.table('tasks').insert(data).execute()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_insert.execute.return_value = mock_response
        mock_table.insert.return_value = mock_insert
        mock_supabase.table.return_value = mock_table
        
        # Make the request
        response = await client.post(
            "/api/tasks/",
            json=task_data,
            headers={"x-user-id": user_id}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == task_data["title"]
        assert data["status"] == "active"
        
        # Verify the mock was called correctly
        mock_supabase.table.assert_called_with('tasks')
        mock_table.insert.assert_called_once()

@pytest.mark.asyncio
async def test_get_tasks_unit(client: AsyncClient):
    """Unit test for getting tasks - mocks database calls."""
    
    user_id = str(uuid.uuid4())
    
    # Mock database response with all required fields
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1, 
            "title": "Task 1", 
            "status": "active",
            "user_id": user_id,
            "description": None,
            "completed": False,
            "snoozed_until": None,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": 2, 
            "title": "Task 2", 
            "status": "completed",
            "user_id": user_id,
            "description": None,
            "completed": True,
            "snoozed_until": None,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    ]
    
    with patch('app.tasks.supabase') as mock_supabase:
        # Setup mock chain
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_eq = MagicMock()
        mock_eq.execute.return_value = mock_response
        mock_select.eq.return_value = mock_eq
        mock_table.select.return_value = mock_select
        mock_supabase.table.return_value = mock_table
        
        # Make request
        response = await client.get(
            "/api/tasks/",
            headers={"x-user-id": user_id}
        )
        
        assert response.status_code == 200
        tasks = response.json()
        assert len(tasks) == 2
        assert tasks[0]["title"] == "Task 1"

@pytest.mark.asyncio  
async def test_delete_task_not_found(client: AsyncClient):
    """Test deleting non-existent task returns 404."""
    
    user_id = str(uuid.uuid4())
    
    # Mock empty response (task not found)
    mock_response = MagicMock()
    mock_response.data = []
    
    with patch('app.tasks.supabase') as mock_supabase:
        # Setup mock chain for delete
        mock_table = MagicMock()
        mock_delete = MagicMock()
        mock_eq1 = MagicMock()
        mock_eq2 = MagicMock()
        mock_eq2.execute.return_value = mock_response
        mock_eq1.eq.return_value = mock_eq2
        mock_delete.eq.return_value = mock_eq1
        mock_table.delete.return_value = mock_delete
        mock_supabase.table.return_value = mock_table
        
        response = await client.delete(
            "/api/tasks/999",
            headers={"x-user-id": user_id}
        )
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"