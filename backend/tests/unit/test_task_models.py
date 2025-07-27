"""
Unit tests for extended task models with AI integration.
"""
import pytest
from datetime import datetime
from app.models import (
    Task, TaskCreate, TaskUpdate, AITaskCreate, GeneratedTask,
    TaskPriority, TaskSource
)


class TestTaskModelsAIExtensions:
    """Test cases for AI-related extensions to task models"""
    
    def test_task_source_enum_values(self):
        """Test TaskSource enum has correct values"""
        assert TaskSource.MANUAL == "manual"
        assert TaskSource.AI_GENERATED == "ai_generated"
    
    def test_task_base_with_ai_fields(self):
        """Test TaskBase includes AI-related fields with defaults"""
        task = TaskCreate(
            title="Test task",
            description="Test description"
        )
        
        # Check AI fields have correct defaults
        assert task.source == TaskSource.MANUAL
        assert task.source_image_id is None
        assert task.ai_confidence is None
        assert task.ai_provider is None
    
    def test_task_create_with_ai_fields(self):
        """Test TaskCreate can be created with AI fields"""
        task = TaskCreate(
            title="AI generated task",
            description="Generated from image analysis",
            priority=TaskPriority.HIGH,
            source=TaskSource.AI_GENERATED,
            source_image_id="img-123",
            ai_confidence=0.85,
            ai_provider="gemini"
        )
        
        assert task.source == TaskSource.AI_GENERATED
        assert task.source_image_id == "img-123"
        assert task.ai_confidence == 0.85
        assert task.ai_provider == "gemini"
    
    def test_task_update_with_ai_fields(self):
        """Test TaskUpdate can update AI fields"""
        update = TaskUpdate(
            title="Updated title",
            ai_confidence=0.9,
            ai_provider="updated-provider"
        )
        
        assert update.title == "Updated title"
        assert update.ai_confidence == 0.9
        assert update.ai_provider == "updated-provider"
    
    def test_ai_confidence_validation(self):
        """Test AI confidence score validation (0.0 to 1.0)"""
        # Valid confidence scores
        task = TaskCreate(
            title="Test",
            ai_confidence=0.0
        )
        assert task.ai_confidence == 0.0
        
        task = TaskCreate(
            title="Test",
            ai_confidence=1.0
        )
        assert task.ai_confidence == 1.0
        
        task = TaskCreate(
            title="Test",
            ai_confidence=0.5
        )
        assert task.ai_confidence == 0.5
        
        # Invalid confidence scores
        with pytest.raises(ValueError):
            TaskCreate(
                title="Test",
                ai_confidence=-0.1
            )
        
        with pytest.raises(ValueError):
            TaskCreate(
                title="Test",
                ai_confidence=1.1
            )
    
    def test_ai_task_create_model(self):
        """Test AITaskCreate model with required AI fields"""
        ai_task = AITaskCreate(
            title="Fix leaky faucet",
            description="Repair visible water leak",
            priority=TaskPriority.HIGH,
            source_image_id="img-456",
            ai_confidence=0.92,
            ai_provider="gemini-1.5-flash"
        )
        
        # Check that source defaults to AI_GENERATED
        assert ai_task.source == TaskSource.AI_GENERATED
        assert ai_task.source_image_id == "img-456"
        assert ai_task.ai_confidence == 0.92
        assert ai_task.ai_provider == "gemini-1.5-flash"
    
    def test_ai_task_create_validation(self):
        """Test AITaskCreate validation for required fields"""
        # Missing source_image_id should fail
        with pytest.raises(ValueError):
            AITaskCreate(
                title="Test",
                ai_confidence=0.8,
                ai_provider="gemini"
                # source_image_id missing
            )
        
        # Missing ai_confidence should fail
        with pytest.raises(ValueError):
            AITaskCreate(
                title="Test",
                source_image_id="img-123",
                ai_provider="gemini"
                # ai_confidence missing
            )
        
        # Missing ai_provider should fail
        with pytest.raises(ValueError):
            AITaskCreate(
                title="Test",
                source_image_id="img-123",
                ai_confidence=0.8
                # ai_provider missing
            )
    
    def test_generated_task_model(self):
        """Test GeneratedTask model for AI response parsing"""
        generated = GeneratedTask(
            title="Clean bathroom mirror",
            description="Remove water spots and streaks",
            priority=TaskPriority.MEDIUM,
            confidence_score=0.78,
            category="cleaning",
            reasoning="Visible water spots detected on mirror surface"
        )
        
        assert generated.title == "Clean bathroom mirror"
        assert generated.description == "Remove water spots and streaks"
        assert generated.priority == TaskPriority.MEDIUM
        assert generated.confidence_score == 0.78
        assert generated.category == "cleaning"
        assert generated.reasoning == "Visible water spots detected on mirror surface"
    
    def test_generated_task_required_fields(self):
        """Test GeneratedTask requires essential fields"""
        # Valid minimal task
        task = GeneratedTask(
            title="Test",
            description="Test description",
            priority=TaskPriority.LOW,
            confidence_score=0.5
        )
        assert task.title == "Test"
        
        # Missing title should fail
        with pytest.raises(ValueError):
            GeneratedTask(
                description="Test",
                priority=TaskPriority.LOW,
                confidence_score=0.5
            )
        
        # Missing description should fail
        with pytest.raises(ValueError):
            GeneratedTask(
                title="Test",
                priority=TaskPriority.LOW,
                confidence_score=0.5
            )
    
    def test_task_model_serialization_with_ai_fields(self):
        """Test that Task model can serialize/deserialize with AI fields"""
        task_data = {
            'id': 1,
            'user_id': 'user-123',
            'title': 'AI Task',
            'description': 'Generated by AI',
            'priority': 'high',
            'completed': False,
            'status': 'active',
            'snoozed_until': None,
            'source': 'ai_generated',
            'source_image_id': 'img-789',
            'ai_confidence': 0.88,
            'ai_provider': 'gemini',
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        task = Task(**task_data)
        
        assert task.source == TaskSource.AI_GENERATED
        assert task.source_image_id == 'img-789'
        assert task.ai_confidence == 0.88
        assert task.ai_provider == 'gemini'
    
    def test_task_model_dump_includes_ai_fields(self):
        """Test that model_dump includes AI fields"""
        task = TaskCreate(
            title="Test task",
            description="Test description",
            source=TaskSource.AI_GENERATED,
            source_image_id="img-123",
            ai_confidence=0.75,
            ai_provider="test-provider"
        )
        
        dumped = task.model_dump()
        
        assert dumped['source'] == 'ai_generated'
        assert dumped['source_image_id'] == 'img-123'
        assert dumped['ai_confidence'] == 0.75
        assert dumped['ai_provider'] == 'test-provider'
    
    def test_task_update_partial_ai_fields(self):
        """Test TaskUpdate can partially update AI fields"""
        update = TaskUpdate(
            ai_confidence=0.95  # Only updating confidence
        )
        
        dumped = update.model_dump()
        
        # Only non-None values should be included
        assert dumped['ai_confidence'] == 0.95
        assert 'ai_provider' not in dumped or dumped['ai_provider'] is None
        assert 'source_image_id' not in dumped or dumped['source_image_id'] is None
    
    def test_backward_compatibility_with_manual_tasks(self):
        """Test that existing manual tasks still work with new fields"""
        # Create a task the old way (without AI fields)
        manual_task = TaskCreate(
            title="Manual task",
            description="Created by user",
            priority=TaskPriority.MEDIUM
        )
        
        # Should have default values for AI fields
        assert manual_task.source == TaskSource.MANUAL
        assert manual_task.source_image_id is None
        assert manual_task.ai_confidence is None
        assert manual_task.ai_provider is None
        
        # Should serialize correctly
        dumped = manual_task.model_dump()
        assert dumped['source'] == 'manual'
        assert dumped['source_image_id'] is None
        assert dumped['ai_confidence'] is None
        assert dumped['ai_provider'] is None