"""Unit tests for TaskService with AI integration."""

import pytest
from unittest.mock import patch, MagicMock
from app.services.task_service import TaskService
from app.models import AITaskCreate, TaskPriority, TaskSource


class TestTaskService:
    """Test cases for TaskService functionality."""
    
    def test_determine_priority_from_confidence_high(self):
        """Test that high confidence (>= 0.8) results in high priority."""
        assert TaskService.determine_priority_from_confidence(0.8) == TaskPriority.HIGH
        assert TaskService.determine_priority_from_confidence(0.9) == TaskPriority.HIGH
        assert TaskService.determine_priority_from_confidence(1.0) == TaskPriority.HIGH
    
    def test_determine_priority_from_confidence_medium(self):
        """Test that medium confidence (0.6-0.79) results in medium priority."""
        assert TaskService.determine_priority_from_confidence(0.6) == TaskPriority.MEDIUM
        assert TaskService.determine_priority_from_confidence(0.7) == TaskPriority.MEDIUM
        assert TaskService.determine_priority_from_confidence(0.79) == TaskPriority.MEDIUM
    
    def test_determine_priority_from_confidence_low(self):
        """Test that low confidence (< 0.6) results in low priority."""
        assert TaskService.determine_priority_from_confidence(0.0) == TaskPriority.LOW
        assert TaskService.determine_priority_from_confidence(0.3) == TaskPriority.LOW
        assert TaskService.determine_priority_from_confidence(0.59) == TaskPriority.LOW
    
    @pytest.mark.asyncio
    @patch('app.services.task_service.supabase')
    async def test_create_ai_tasks_single(self, mock_supabase):
        """Test creating a single AI-generated task."""
        # Mock the database response
        mock_response = MagicMock()
        mock_response.data = [{
            'id': 1,
            'title': 'Fix leaky faucet',
            'description': 'Kitchen faucet is dripping',
            'priority': 'high',
            'source': 'ai_generated',
            'source_image_id': 'image-123',
            'ai_confidence': 0.85,
            'ai_provider': 'gemini',
            'user_id': 'user-123'
        }]
        mock_supabase.table().insert().execute.return_value = mock_response
        
        # Create test task
        task = AITaskCreate(
            title="Fix leaky faucet",
            description="Kitchen faucet is dripping",
            source=TaskSource.AI_GENERATED,
            source_image_id="image-123",
            ai_confidence=0.85,
            ai_provider="gemini"
        )
        
        # Execute
        result = await TaskService.create_ai_tasks([task], "user-123")
        
        # Verify
        assert len(result) == 1
        assert result[0]['title'] == 'Fix leaky faucet'
        assert result[0]['priority'] == 'high'  # Should be high due to confidence 0.85
        
        # Verify database call
        mock_supabase.table.assert_called_with('tasks')
        insert_data = mock_supabase.table().insert.call_args[0][0]
        assert insert_data['priority'] == 'high'
        assert insert_data['ai_confidence'] == 0.85
    
    @pytest.mark.asyncio
    @patch('app.services.task_service.supabase')
    async def test_create_ai_tasks_multiple(self, mock_supabase):
        """Test creating multiple AI-generated tasks with different confidence levels."""
        # Mock database responses for each insert
        mock_responses = [
            MagicMock(data=[{'id': i, 'title': f'Task {i}', 'priority': priority}])
            for i, priority in enumerate(['high', 'medium', 'low'], 1)
        ]
        mock_supabase.table().insert().execute.side_effect = mock_responses
        
        # Create test tasks with different confidence levels
        tasks = [
            AITaskCreate(
                title="Task 1",
                description="High confidence task",
                source=TaskSource.AI_GENERATED,
                source_image_id="image-123",
                ai_confidence=0.9,
                ai_provider="gemini"
            ),
            AITaskCreate(
                title="Task 2",
                description="Medium confidence task",
                source=TaskSource.AI_GENERATED,
                source_image_id="image-123",
                ai_confidence=0.7,
                ai_provider="gemini"
            ),
            AITaskCreate(
                title="Task 3",
                description="Low confidence task",
                source=TaskSource.AI_GENERATED,
                source_image_id="image-123",
                ai_confidence=0.4,
                ai_provider="gemini"
            )
        ]
        
        # Execute
        result = await TaskService.create_ai_tasks(tasks, "user-123")
        
        # Verify
        assert len(result) == 3
        assert result[0]['priority'] == 'high'
        assert result[1]['priority'] == 'medium'
        assert result[2]['priority'] == 'low'
        
        # Verify database calls
        assert mock_supabase.table().insert().execute.call_count == 3
    
    @pytest.mark.asyncio
    @patch('app.services.task_service.supabase')
    async def test_create_ai_tasks_respects_explicit_priority(self, mock_supabase):
        """Test that explicitly set priority is not overridden by confidence."""
        mock_response = MagicMock()
        mock_response.data = [{'id': 1, 'priority': 'low'}]
        mock_supabase.table().insert().execute.return_value = mock_response
        
        # Create task with high confidence but explicit low priority
        task = AITaskCreate(
            title="Non-urgent task",
            description="High confidence but low priority",
            priority=TaskPriority.LOW,  # Explicitly set
            source=TaskSource.AI_GENERATED,
            source_image_id="image-123",
            ai_confidence=0.9,  # High confidence
            ai_provider="gemini"
        )
        
        # Execute
        await TaskService.create_ai_tasks([task], "user-123")
        
        # Verify the explicit priority was kept
        insert_data = mock_supabase.table().insert.call_args[0][0]
        assert insert_data['priority'] == 'low'
    
    @pytest.mark.asyncio
    @patch('app.services.task_service.supabase')
    async def test_create_single_ai_task(self, mock_supabase):
        """Test the convenience method for creating a single task."""
        mock_response = MagicMock()
        mock_response.data = [{'id': 1, 'title': 'Single task'}]
        mock_supabase.table().insert().execute.return_value = mock_response
        
        task = AITaskCreate(
            title="Single task",
            description="Test single task creation",
            source=TaskSource.AI_GENERATED,
            source_image_id="image-123",
            ai_confidence=0.75,
            ai_provider="gemini"
        )
        
        result = await TaskService.create_single_ai_task(task, "user-123")
        
        assert result is not None
        assert result['title'] == 'Single task'
        mock_supabase.table.assert_called_once_with('tasks')