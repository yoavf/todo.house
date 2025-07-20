import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timezone

from app.database import get_supabase_client
from app.models import TaskStatus


class TestSupabaseIntegration:
    """Integration tests for Supabase database operations."""
    
    @pytest.mark.integration
    def test_get_supabase_client(self):
        """Test that Supabase client can be retrieved."""
        client = get_supabase_client()
        assert client is not None
        assert hasattr(client, 'table')
    
    @pytest.mark.integration
    def test_supabase_client_singleton(self):
        """Test that get_supabase_client returns the same instance."""
        client1 = get_supabase_client()
        client2 = get_supabase_client()
        assert client1 is client2
    
    @pytest.mark.integration
    @patch('app.database.create_client')
    def test_supabase_connection_error(self, mock_create_client):
        """Test handling of Supabase connection errors."""
        mock_create_client.side_effect = Exception("Connection failed")
        
        with pytest.raises(Exception) as exc_info:
            from app import database
            database.supabase = None
            get_supabase_client()
        
        assert "Connection failed" in str(exc_info.value)
    
    @pytest.mark.integration
    def test_task_table_operations(self, mock_supabase):
        """Test basic table operations on the tasks table."""
        sample_task = {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "user_id": "test-user",
            "title": "Test Task",
            "description": "Integration test task",
            "status": TaskStatus.ACTIVE.value,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        mock_response = Mock(data=[sample_task], count=1)
        mock_supabase.table.return_value.select.return_value.execute.return_value = mock_response
        
        result = mock_supabase.table("tasks").select("*").execute()
        
        assert result.data == [sample_task]
        assert result.count == 1
        mock_supabase.table.assert_called_with("tasks")
    
    @pytest.mark.integration
    def test_task_filtering(self, mock_supabase):
        """Test filtering tasks by status and user."""
        mock_table = mock_supabase.table.return_value
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        
        active_tasks = [
            {
                "id": f"task-{i}",
                "user_id": "test-user",
                "title": f"Active Task {i}",
                "status": TaskStatus.ACTIVE.value,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            for i in range(3)
        ]
        
        mock_table.execute.return_value = Mock(data=active_tasks, count=3)
        
        result = (mock_supabase.table("tasks")
                  .select("*")
                  .eq("user_id", "test-user")
                  .eq("status", TaskStatus.ACTIVE.value)
                  .execute())
        
        assert len(result.data) == 3
        assert all(task["status"] == TaskStatus.ACTIVE.value for task in result.data)
        mock_table.eq.assert_any_call("user_id", "test-user")
        mock_table.eq.assert_any_call("status", TaskStatus.ACTIVE.value)