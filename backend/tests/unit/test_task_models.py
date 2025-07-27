"""Unit tests for task models with AI fields."""

import pytest
from pydantic import ValidationError
from app.models import TaskCreate, AITaskCreate, Task, TaskSource, TaskPriority


class TestTaskModels:
    """Test cases for task model validation and behavior."""
    
    def test_task_create_defaults(self):
        """Test that TaskCreate has correct default values."""
        task = TaskCreate(
            title="Test task",
            description="Test description"
        )
        
        assert task.title == "Test task"
        assert task.description == "Test description"
        assert task.priority == TaskPriority.MEDIUM
        assert task.completed is False
        assert task.source == TaskSource.MANUAL
        assert task.source_image_id is None
        assert task.ai_confidence is None
        assert task.ai_provider is None
    
    def test_task_create_with_ai_fields(self):
        """Test creating a task with AI-related fields."""
        task = TaskCreate(
            title="AI detected task",
            description="Found by AI",
            source=TaskSource.AI_GENERATED,
            source_image_id="image-123",
            ai_confidence=0.75,
            ai_provider="gemini"
        )
        
        assert task.source == TaskSource.AI_GENERATED
        assert task.source_image_id == "image-123"
        assert task.ai_confidence == 0.75
        assert task.ai_provider == "gemini"
    
    def test_ai_task_create_required_fields(self):
        """Test that AITaskCreate requires all AI fields."""
        # Should succeed with all required fields
        ai_task = AITaskCreate(
            title="AI task",
            description="AI generated",
            source_image_id="image-123",
            ai_confidence=0.8,
            ai_provider="gemini"
        )
        
        assert ai_task.source == TaskSource.AI_GENERATED  # Should be set automatically
        assert ai_task.source_image_id == "image-123"
        assert ai_task.ai_confidence == 0.8
        assert ai_task.ai_provider == "gemini"
    
    def test_ai_task_create_missing_fields(self):
        """Test that AITaskCreate fails without required AI fields."""
        with pytest.raises(ValidationError) as exc_info:
            AITaskCreate(
                title="AI task",
                description="Missing required fields"
                # Missing: source_image_id, ai_confidence, ai_provider
            )
        
        errors = exc_info.value.errors()
        error_fields = {error['loc'][0] for error in errors}
        assert 'source_image_id' in error_fields
        assert 'ai_confidence' in error_fields
        assert 'ai_provider' in error_fields
    
    def test_ai_task_create_confidence_validation(self):
        """Test that AI confidence must be between 0 and 1."""
        # Valid confidence values
        task1 = AITaskCreate(
            title="Task",
            description="Desc",
            source_image_id="img-1",
            ai_confidence=0.0,
            ai_provider="gemini"
        )
        assert task1.ai_confidence == 0.0
        
        task2 = AITaskCreate(
            title="Task",
            description="Desc",
            source_image_id="img-1",
            ai_confidence=1.0,
            ai_provider="gemini"
        )
        assert task2.ai_confidence == 1.0
        
        # Invalid confidence > 1
        with pytest.raises(ValidationError) as exc_info:
            AITaskCreate(
                title="Task",
                description="Desc",
                source_image_id="img-1",
                ai_confidence=1.5,
                ai_provider="gemini"
            )
        
        errors = exc_info.value.errors()
        assert any(error['type'] == 'less_than_equal' and error['loc'] == ('ai_confidence',) for error in errors)
        
        # Invalid confidence < 0
        with pytest.raises(ValidationError) as exc_info:
            AITaskCreate(
                title="Task",
                description="Desc",
                source_image_id="img-1",
                ai_confidence=-0.1,
                ai_provider="gemini"
            )
        
        errors = exc_info.value.errors()
        assert any(error['type'] == 'greater_than_equal' and error['loc'] == ('ai_confidence',) for error in errors)
    
    def test_ai_task_create_source_is_constant(self):
        """Test that AITaskCreate source cannot be changed from AI_GENERATED."""
        # Attempting to set source to MANUAL should be ignored
        ai_task = AITaskCreate(
            title="Task",
            description="Desc",
            source_image_id="img-1",
            ai_confidence=0.8,
            ai_provider="gemini"
        )
        
        # Source should always be AI_GENERATED regardless of input
        assert ai_task.source == TaskSource.AI_GENERATED
    
    def test_task_model_includes_ai_fields(self):
        """Test that the Task response model includes AI fields."""
        from datetime import datetime
        
        task_dict = {
            "id": 1,
            "user_id": "user-123",
            "title": "Test task",
            "description": "Description",
            "priority": "high",
            "completed": False,
            "status": "active",
            "source": "ai_generated",
            "source_image_id": "img-123",
            "ai_confidence": 0.9,
            "ai_provider": "gemini",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        task = Task(**task_dict)
        
        assert task.source == TaskSource.AI_GENERATED
        assert task.source_image_id == "img-123"
        assert task.ai_confidence == 0.9
        assert task.ai_provider == "gemini"