"""
Unit tests for AI task service functionality.
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.ai_task_service import AITaskService
from app.models import GeneratedTask, TaskPriority, TaskSource, Task


class TestAITaskService:
    """Test cases for AITaskService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.service = AITaskService()
        self.sample_generated_tasks = [
            GeneratedTask(
                title="Clean bathroom sink",
                description="Remove limescale buildup from faucet and sink",
                priority=TaskPriority.MEDIUM,
                confidence_score=0.85,
                category="cleaning"
            ),
            GeneratedTask(
                title="Fix leaky pipe",
                description="Repair visible water leak under sink",
                priority=TaskPriority.HIGH,
                confidence_score=0.95,
                category="repair"
            ),
            GeneratedTask(
                title="Replace air freshener",
                description="Current air freshener appears empty",
                priority=TaskPriority.LOW,
                confidence_score=0.4,
                category="maintenance"
            )
        ]
    
    def test_prioritize_tasks_sorts_by_priority_and_confidence(self):
        """Test that tasks are sorted by priority and confidence"""
        prioritized = self.service.prioritize_tasks(self.sample_generated_tasks.copy())
        
        # Should be sorted: HIGH priority (0.95), MEDIUM priority (0.85), LOW priority (0.4)
        assert prioritized[0].title == "Fix leaky pipe"
        assert prioritized[1].title == "Clean bathroom sink"
        assert prioritized[2].title == "Replace air freshener"
    
    def test_adjust_priority_by_confidence_downgrades_low_confidence(self):
        """Test that low confidence tasks get downgraded priority"""
        # Very low confidence should downgrade HIGH to MEDIUM
        adjusted = self.service._adjust_priority_by_confidence(TaskPriority.HIGH, 0.2)
        assert adjusted == TaskPriority.MEDIUM
        
        # Very low confidence should downgrade MEDIUM to LOW
        adjusted = self.service._adjust_priority_by_confidence(TaskPriority.MEDIUM, 0.2)
        assert adjusted == TaskPriority.LOW
        
        # LOW priority stays LOW even with very low confidence
        adjusted = self.service._adjust_priority_by_confidence(TaskPriority.LOW, 0.2)
        assert adjusted == TaskPriority.LOW
    
    def test_adjust_priority_by_confidence_upgrades_high_confidence(self):
        """Test that very high confidence can upgrade MEDIUM to HIGH"""
        adjusted = self.service._adjust_priority_by_confidence(TaskPriority.MEDIUM, 0.95)
        assert adjusted == TaskPriority.HIGH
        
        # HIGH priority stays HIGH
        adjusted = self.service._adjust_priority_by_confidence(TaskPriority.HIGH, 0.95)
        assert adjusted == TaskPriority.HIGH
        
        # LOW priority doesn't get upgraded
        adjusted = self.service._adjust_priority_by_confidence(TaskPriority.LOW, 0.95)
        assert adjusted == TaskPriority.LOW
    
    def test_adjust_priority_by_confidence_maintains_normal_confidence(self):
        """Test that normal confidence levels don't change priority"""
        for priority in [TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW]:
            adjusted = self.service._adjust_priority_by_confidence(priority, 0.7)
            assert adjusted == priority
    
    @pytest.mark.asyncio
    @patch('app.ai_task_service.supabase')
    async def test_create_tasks_from_ai_response(self, mock_supabase):
        """Test creating tasks from AI response"""
        # Mock database response
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {
                'id': 1,
                'title': 'Fix leaky pipe',
                'description': 'Repair visible water leak under sink',
                'priority': 'high',
                'user_id': 'user123',
                'source': 'ai_generated',
                'source_image_id': 'img123',
                'ai_confidence': 0.95,
                'ai_provider': 'gemini',
                'status': 'active',
                'completed': False,
                'snoozed_until': None,
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            }
        ]
        
        created_tasks = await self.service.create_tasks_from_ai_response(
            [self.sample_generated_tasks[1]],  # Just the high priority task
            'user123',
            'img123',
            'gemini'
        )
        
        assert len(created_tasks) == 1
        assert created_tasks[0].title == 'Fix leaky pipe'
        assert created_tasks[0].source == TaskSource.AI_GENERATED
        assert created_tasks[0].ai_confidence == 0.95
        
        # Verify database call
        mock_supabase.table.assert_called_with('tasks')
    
    def test_filter_high_confidence_tasks(self):
        """Test filtering tasks by confidence threshold"""
        high_confidence = self.service.filter_high_confidence_tasks(
            self.sample_generated_tasks, 
            min_confidence=0.8
        )
        
        assert len(high_confidence) == 2  # 0.85 and 0.95 confidence tasks
        assert all(task.confidence_score >= 0.8 for task in high_confidence)
    
    def test_categorize_tasks_by_confidence(self):
        """Test categorizing tasks by confidence levels"""
        categories = self.service.categorize_tasks_by_confidence(self.sample_generated_tasks)
        
        assert len(categories['high_confidence']) == 2  # 0.85 and 0.95
        assert len(categories['medium_confidence']) == 0
        assert len(categories['low_confidence']) == 1  # 0.4
        
        # Check specific tasks are in correct categories
        high_conf_titles = [task.title for task in categories['high_confidence']]
        assert "Fix leaky pipe" in high_conf_titles
        assert "Clean bathroom sink" in high_conf_titles
        
        low_conf_titles = [task.title for task in categories['low_confidence']]
        assert "Replace air freshener" in low_conf_titles
    
    @pytest.mark.asyncio
    @patch('app.ai_task_service.supabase')
    async def test_get_ai_generated_tasks(self, mock_supabase):
        """Test retrieving AI-generated tasks"""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {
                'id': 1,
                'title': 'AI Task',
                'description': 'Generated by AI',
                'priority': 'medium',
                'user_id': 'user123',
                'source': 'ai_generated',
                'source_image_id': 'img123',
                'ai_confidence': 0.8,
                'ai_provider': 'gemini',
                'status': 'active',
                'completed': False,
                'snoozed_until': None,
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            }
        ]
        
        tasks = await self.service.get_ai_generated_tasks('user123')
        
        assert len(tasks) == 1
        assert tasks[0].source == TaskSource.AI_GENERATED
        assert tasks[0].ai_confidence == 0.8
    
    @pytest.mark.asyncio
    @patch('app.ai_task_service.supabase')
    async def test_get_ai_generated_tasks_with_image_filter(self, mock_supabase):
        """Test retrieving AI-generated tasks filtered by image"""
        mock_query = Mock()
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value = mock_query
        mock_query.execute.return_value.data = []
        
        await self.service.get_ai_generated_tasks('user123', 'img456')
        
        # Verify the query was built correctly with image filter
        mock_supabase.table.assert_called_with('tasks')
    
    @pytest.mark.asyncio
    @patch('app.ai_task_service.supabase')
    async def test_get_tasks_by_confidence_range(self, mock_supabase):
        """Test retrieving tasks by confidence range"""
        mock_query = Mock()
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value = mock_query
        mock_query.execute.return_value.data = []
        
        await self.service.get_tasks_by_confidence_range('user123', 0.7, 0.9)
        
        # Verify the query was built correctly
        mock_supabase.table.assert_called_with('tasks')
    
    def test_confidence_thresholds_are_properly_defined(self):
        """Test that confidence thresholds are properly configured"""
        assert self.service.confidence_thresholds[TaskPriority.HIGH] == 0.8
        assert self.service.confidence_thresholds[TaskPriority.MEDIUM] == 0.5
        assert self.service.confidence_thresholds[TaskPriority.LOW] == 0.0
    
    def test_prioritize_tasks_handles_empty_list(self):
        """Test that prioritize_tasks handles empty input gracefully"""
        result = self.service.prioritize_tasks([])
        assert result == []
    
    def test_filter_high_confidence_tasks_handles_empty_list(self):
        """Test that filter_high_confidence_tasks handles empty input gracefully"""
        result = self.service.filter_high_confidence_tasks([])
        assert result == []
    
    def test_categorize_tasks_by_confidence_handles_empty_list(self):
        """Test that categorize_tasks_by_confidence handles empty input gracefully"""
        result = self.service.categorize_tasks_by_confidence([])
        assert result == {
            'high_confidence': [],
            'medium_confidence': [],
            'low_confidence': []
        }


class TestGeneratedTaskModel:
    """Test cases for GeneratedTask model validation"""
    
    def test_generated_task_valid_data(self):
        """Test GeneratedTask with valid data"""
        task = GeneratedTask(
            title="Test task",
            description="Test description",
            priority=TaskPriority.MEDIUM,
            confidence_score=0.8
        )
        
        assert task.title == "Test task"
        assert task.description == "Test description"
        assert task.priority == TaskPriority.MEDIUM
        assert task.confidence_score == 0.8
    
    def test_generated_task_confidence_validation(self):
        """Test that confidence score is validated to be between 0 and 1"""
        # Valid confidence scores
        task = GeneratedTask(
            title="Test",
            description="Test",
            priority=TaskPriority.LOW,
            confidence_score=0.0
        )
        assert task.confidence_score == 0.0
        
        task = GeneratedTask(
            title="Test",
            description="Test",
            priority=TaskPriority.LOW,
            confidence_score=1.0
        )
        assert task.confidence_score == 1.0
        
        # Invalid confidence scores should raise validation error
        with pytest.raises(ValueError):
            GeneratedTask(
                title="Test",
                description="Test",
                priority=TaskPriority.LOW,
                confidence_score=-0.1
            )
        
        with pytest.raises(ValueError):
            GeneratedTask(
                title="Test",
                description="Test",
                priority=TaskPriority.LOW,
                confidence_score=1.1
            )
    
    def test_generated_task_title_validation(self):
        """Test title length validation"""
        # Valid title
        task = GeneratedTask(
            title="Valid title",
            description="Test",
            priority=TaskPriority.LOW,
            confidence_score=0.5
        )
        assert task.title == "Valid title"
        
        # Empty title should fail
        with pytest.raises(ValueError):
            GeneratedTask(
                title="",
                description="Test",
                priority=TaskPriority.LOW,
                confidence_score=0.5
            )
        
        # Too long title should fail
        with pytest.raises(ValueError):
            GeneratedTask(
                title="x" * 201,  # 201 characters
                description="Test",
                priority=TaskPriority.LOW,
                confidence_score=0.5
            )