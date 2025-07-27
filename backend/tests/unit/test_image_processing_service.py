"""Unit tests for ImageProcessingService orchestration."""

import pytest
from unittest.mock import AsyncMock, patch
from typing import Dict, Any

from app.ai.image_processing import ImageProcessingService, ImageProcessingError, ImageValidationError
from app.ai.providers import AIProvider, AIProviderError, AIProviderRateLimitError, AIProviderAPIError


class MockAIProvider(AIProvider):
    """Mock AI provider for testing."""
    
    def __init__(self, should_fail: bool = False, fail_with: Exception = None):
        self.should_fail = should_fail
        self.fail_with = fail_with or AIProviderError("Mock error")
        self.call_count = 0
        self.usage_metrics = {
            "requests_made": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_tokens_used": 0,
            "total_cost_estimate": 0.0,
            "average_response_time": 0.0,
            "last_request_time": None
        }
    
    async def analyze_image(self, image_data: bytes, prompt: str) -> Dict[str, Any]:
        """Mock image analysis."""
        self.call_count += 1
        
        if self.should_fail:
            raise self.fail_with
        
        return {
            "analysis_summary": "Mock analysis of the image",
            "tasks": [
                {
                    "title": "Clean bathroom sink",
                    "description": "Remove limescale buildup from faucet and basin",
                    "priority": "medium",
                    "category": "cleaning",
                    "reasoning": "Visible mineral deposits affect appearance"
                }
            ],
            "provider": "mock",
            "model": "mock-model",
            "processing_time": 0.5,
            "tokens_used": 100,
            "cost_estimate": 0.001
        }
    
    def get_provider_name(self) -> str:
        return "mock"
    
    def get_usage_metrics(self) -> Dict[str, Any]:
        return self.usage_metrics.copy()
    
    def reset_usage_metrics(self) -> None:
        self.usage_metrics = {
            "requests_made": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_tokens_used": 0,
            "total_cost_estimate": 0.0,
            "average_response_time": 0.0,
            "last_request_time": None
        }


@pytest.fixture
def mock_ai_provider():
    """Create a mock AI provider."""
    return MockAIProvider()


@pytest.fixture
def failing_ai_provider():
    """Create a failing mock AI provider."""
    return MockAIProvider(should_fail=True)


@pytest.fixture
def rate_limit_provider():
    """Create a rate-limited mock AI provider."""
    return MockAIProvider(should_fail=True, fail_with=AIProviderRateLimitError("Rate limited", retry_after=1))


@pytest.fixture
def api_error_provider():
    """Create an API error mock AI provider."""
    return MockAIProvider(should_fail=True, fail_with=AIProviderAPIError("API error"))


@pytest.fixture
def sample_image_data():
    """Create sample image data for testing."""
    # Create a minimal valid JPEG image (1x1 pixel)
    import io
    from PIL import Image
    
    img = Image.new('RGB', (1, 1), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    return img_bytes.getvalue()


@pytest.fixture
def service_with_provider(mock_ai_provider):
    """Create ImageProcessingService with mock provider."""
    return ImageProcessingService(ai_provider=mock_ai_provider)


@pytest.fixture
def service_without_provider():
    """Create ImageProcessingService without provider."""
    return ImageProcessingService()


class TestImageProcessingServiceOrchestration:
    """Test the main orchestration functionality."""
    
    @pytest.mark.asyncio
    async def test_successful_analysis_with_provider(self, service_with_provider, sample_image_data):
        """Test successful image analysis with AI provider."""
        result = await service_with_provider.analyze_image_and_generate_tasks(
            image_data=sample_image_data,
            user_id="test-user"
        )
        
        # Verify result structure
        assert "image_metadata" in result
        assert "analysis_summary" in result
        assert "tasks" in result
        assert "processing_time" in result
        assert "provider_used" in result
        assert "ai_confidence" in result
        assert "retry_count" in result
        
        # Verify content
        assert result["analysis_summary"] == "Mock analysis of the image"
        assert len(result["tasks"]) == 1
        assert result["tasks"][0]["title"] == "Clean bathroom sink"
        assert result["provider_used"] == "mock"
        assert result["retry_count"] == 0
        assert isinstance(result["ai_confidence"], float)
        assert 0.0 <= result["ai_confidence"] <= 1.0
    
    @pytest.mark.asyncio
    async def test_analysis_without_provider(self, service_without_provider, sample_image_data):
        """Test image analysis without AI provider."""
        result = await service_without_provider.analyze_image_and_generate_tasks(
            image_data=sample_image_data,
            user_id="test-user"
        )
        
        # Verify result structure
        assert "image_metadata" in result
        assert "analysis_summary" in result
        assert "tasks" in result
        assert "processing_time" in result
        assert "provider_used" in result
        assert "ai_confidence" in result
        assert "retry_count" in result
        
        # Verify content for no-provider case
        assert result["analysis_summary"] == "Image processed but no AI analysis performed"
        assert result["tasks"] == []
        assert result["provider_used"] == "none"
        assert result["ai_confidence"] is None
        assert result["retry_count"] == 0
    
    @pytest.mark.asyncio
    async def test_analysis_with_generate_tasks_false(self, service_with_provider, sample_image_data):
        """Test image analysis with generate_tasks=False."""
        result = await service_with_provider.analyze_image_and_generate_tasks(
            image_data=sample_image_data,
            user_id="test-user",
            generate_tasks=False
        )
        
        # Should not call AI provider when generate_tasks=False
        assert result["tasks"] == []
        assert result["provider_used"] == "none"
        assert result["ai_confidence"] is None
    
    @pytest.mark.asyncio
    async def test_analysis_with_custom_prompt(self, service_with_provider, sample_image_data):
        """Test image analysis with custom prompt override."""
        custom_prompt = "Custom test prompt"
        
        with patch.object(service_with_provider.ai_provider, 'analyze_image', new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = {
                "analysis_summary": "Custom analysis",
                "tasks": [],
                "provider": "mock"
            }
            
            await service_with_provider.analyze_image_and_generate_tasks(
                image_data=sample_image_data,
                user_id="test-user",
                prompt_override=custom_prompt
            )
            
            # Verify custom prompt was used
            mock_analyze.assert_called_once()
            args, kwargs = mock_analyze.call_args
            assert args[1] == custom_prompt  # Second argument is the prompt
    
    @pytest.mark.asyncio
    async def test_invalid_image_raises_validation_error(self, service_with_provider):
        """Test that invalid image data raises ImageValidationError."""
        invalid_data = b"not an image"
        
        with pytest.raises(ImageValidationError):
            await service_with_provider.analyze_image_and_generate_tasks(
                image_data=invalid_data,
                user_id="test-user"
            )


class TestRetryLogic:
    """Test retry logic for AI provider failures."""
    
    @pytest.mark.asyncio
    async def test_retry_on_rate_limit_error(self, rate_limit_provider, sample_image_data):
        """Test retry logic for rate limit errors."""
        service = ImageProcessingService(ai_provider=rate_limit_provider)
        service.max_retries = 2
        service.base_retry_delay = 0.01  # Speed up test
        
        with pytest.raises(ImageProcessingError) as exc_info:
            await service.analyze_image_and_generate_tasks(
                image_data=sample_image_data,
                user_id="test-user"
            )
        
        # Should have attempted multiple times
        assert rate_limit_provider.call_count == 3  # Initial + 2 retries
        assert "Rate limited" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_retry_on_api_error(self, api_error_provider, sample_image_data):
        """Test retry logic for API errors."""
        service = ImageProcessingService(ai_provider=api_error_provider)
        service.max_retries = 2
        service.base_retry_delay = 0.01  # Speed up test
        
        with pytest.raises(ImageProcessingError) as exc_info:
            await service.analyze_image_and_generate_tasks(
                image_data=sample_image_data,
                user_id="test-user"
            )
        
        # Should have attempted multiple times
        assert api_error_provider.call_count == 3  # Initial + 2 retries
        assert "API error" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_no_retry_on_general_provider_error(self, failing_ai_provider, sample_image_data):
        """Test that general provider errors don't trigger retries."""
        service = ImageProcessingService(ai_provider=failing_ai_provider)
        service.max_retries = 2
        
        with pytest.raises(ImageProcessingError):
            await service.analyze_image_and_generate_tasks(
                image_data=sample_image_data,
                user_id="test-user"
            )
        
        # Should only attempt once for general errors
        assert failing_ai_provider.call_count == 1
    
    @pytest.mark.asyncio
    async def test_successful_retry_after_failure(self, sample_image_data):
        """Test successful analysis after initial failures."""
        # Create provider that fails first time, then succeeds
        provider = MockAIProvider()
        call_count = 0
        
        async def failing_then_success(image_data, prompt):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise AIProviderRateLimitError("Rate limited")
            # Success on second call
            return {
                "analysis_summary": "Mock analysis of the image",
                "tasks": [
                    {
                        "title": "Clean bathroom sink",
                        "description": "Remove limescale buildup from faucet and basin",
                        "priority": "medium",
                        "category": "cleaning",
                        "reasoning": "Visible mineral deposits affect appearance"
                    }
                ],
                "provider": "mock",
                "model": "mock-model",
                "processing_time": 0.5,
                "tokens_used": 100,
                "cost_estimate": 0.001
            }
        
        provider.analyze_image = failing_then_success
        
        service = ImageProcessingService(ai_provider=provider)
        service.base_retry_delay = 0.01  # Speed up test
        
        result = await service.analyze_image_and_generate_tasks(
            image_data=sample_image_data,
            user_id="test-user"
        )
        
        # Should succeed after retries
        assert call_count == 2
        assert result["retry_count"] == 1
        assert len(result["tasks"]) == 1


class TestPromptGeneration:
    """Test prompt generation functionality."""
    
    def test_generate_basic_prompt(self, service_without_provider):
        """Test basic prompt generation without context."""
        prompt = service_without_provider.generate_prompt()
        
        assert "home maintenance expert" in prompt
        assert "JSON array" in prompt
        assert "title" in prompt
        assert "description" in prompt
        assert "priority" in prompt
        assert "category" in prompt
    
    def test_generate_prompt_with_room_context(self, service_without_provider):
        """Test prompt generation with room type context."""
        context = {"room_type": "bathroom"}
        prompt = service_without_provider.generate_prompt(context)
        
        assert "bathroom" in prompt
        assert "maintenance tasks specific to this area" in prompt
    
    def test_generate_prompt_with_focus_areas(self, service_without_provider):
        """Test prompt generation with focus areas."""
        context = {"focus_areas": ["plumbing", "electrical"]}
        prompt = service_without_provider.generate_prompt(context)
        
        assert "plumbing, electrical" in prompt
        assert "Pay special attention to" in prompt
    
    def test_generate_prompt_with_full_context(self, service_without_provider):
        """Test prompt generation with complete context."""
        context = {
            "room_type": "kitchen",
            "focus_areas": ["appliances", "countertops"]
        }
        prompt = service_without_provider.generate_prompt(context)
        
        assert "kitchen" in prompt
        assert "appliances, countertops" in prompt
        assert "maintenance tasks specific to this area" in prompt
        assert "Pay special attention to" in prompt


class TestConfidenceCalculation:
    """Test AI confidence score calculation."""
    
    def test_confidence_with_no_tasks(self, service_without_provider):
        """Test confidence calculation with no tasks."""
        analysis_result = {"tasks": []}
        confidence = service_without_provider._calculate_confidence(analysis_result)
        assert confidence == 0.0
    
    def test_confidence_with_detailed_tasks(self, service_without_provider):
        """Test confidence calculation with detailed tasks."""
        analysis_result = {
            "tasks": [
                {
                    "title": "Clean sink",
                    "description": "Remove limescale buildup from the bathroom sink faucet and basin area",
                    "priority": "medium",
                    "category": "cleaning",
                    "reasoning": "Visible mineral deposits are affecting the appearance and functionality"
                },
                {
                    "title": "Fix leak",
                    "description": "Repair the dripping faucet",
                    "priority": "high",
                    "category": "repair",
                    "reasoning": "Water waste and potential damage"
                }
            ]
        }
        confidence = service_without_provider._calculate_confidence(analysis_result)
        
        assert isinstance(confidence, float)
        assert 0.0 <= confidence <= 1.0
        assert confidence > 0.5  # Should be high for detailed tasks
    
    def test_confidence_with_minimal_tasks(self, service_without_provider):
        """Test confidence calculation with minimal task details."""
        analysis_result = {
            "tasks": [
                {
                    "title": "Task",
                    "description": "Do something",
                    "priority": "low",
                    "category": "general",
                    "reasoning": ""
                }
            ]
        }
        confidence = service_without_provider._calculate_confidence(analysis_result)
        
        assert isinstance(confidence, float)
        assert 0.0 <= confidence <= 1.0
        assert confidence < 0.5  # Should be lower for minimal details
    
    def test_confidence_calculation_error_handling(self, service_without_provider):
        """Test confidence calculation with malformed data."""
        analysis_result = {"tasks": "not a list"}
        confidence = service_without_provider._calculate_confidence(analysis_result)
        assert confidence is None


class TestResponseValidation:
    """Test AI response validation."""
    
    def test_valid_response(self, service_without_provider):
        """Test validation of valid AI response."""
        response = {
            "analysis_summary": "Found maintenance issues",
            "tasks": [
                {
                    "title": "Clean sink",
                    "description": "Remove buildup",
                    "priority": "medium",
                    "category": "cleaning"
                }
            ]
        }
        errors = service_without_provider.validate_ai_response(response)
        assert errors == []
    
    def test_missing_required_fields(self, service_without_provider):
        """Test validation with missing required fields."""
        response = {"tasks": []}
        errors = service_without_provider.validate_ai_response(response)
        assert "Missing analysis_summary field" in errors
    
    def test_invalid_task_structure(self, service_without_provider):
        """Test validation with invalid task structure."""
        response = {
            "analysis_summary": "Summary",
            "tasks": [
                {
                    "title": "Task",
                    # Missing required fields
                }
            ]
        }
        errors = service_without_provider.validate_ai_response(response)
        
        assert any("missing required field: description" in error for error in errors)
        assert any("missing required field: priority" in error for error in errors)
        assert any("missing required field: category" in error for error in errors)
    
    def test_invalid_priority_value(self, service_without_provider):
        """Test validation with invalid priority value."""
        response = {
            "analysis_summary": "Summary",
            "tasks": [
                {
                    "title": "Task",
                    "description": "Description",
                    "priority": "invalid",
                    "category": "cleaning"
                }
            ]
        }
        errors = service_without_provider.validate_ai_response(response)
        assert any("invalid priority: invalid" in error for error in errors)
    
    def test_title_too_long(self, service_without_provider):
        """Test validation with title too long."""
        response = {
            "analysis_summary": "Summary",
            "tasks": [
                {
                    "title": "A" * 51,  # Too long
                    "description": "Description",
                    "priority": "medium",
                    "category": "cleaning"
                }
            ]
        }
        errors = service_without_provider.validate_ai_response(response)
        assert any("title too long" in error for error in errors)
    
    def test_tasks_not_list(self, service_without_provider):
        """Test validation when tasks is not a list."""
        response = {
            "analysis_summary": "Summary",
            "tasks": "not a list"
        }
        errors = service_without_provider.validate_ai_response(response)
        assert "Tasks field must be a list" in errors


class TestErrorHandling:
    """Test error handling scenarios."""
    
    @pytest.mark.asyncio
    async def test_preprocessing_error_propagation(self, service_with_provider):
        """Test that preprocessing errors are properly propagated."""
        # Use invalid image data that will fail preprocessing
        invalid_data = b"definitely not an image"
        
        with pytest.raises(ImageValidationError):
            await service_with_provider.analyze_image_and_generate_tasks(
                image_data=invalid_data,
                user_id="test-user"
            )
    
    @pytest.mark.asyncio
    async def test_unexpected_error_wrapping(self, sample_image_data):
        """Test that unexpected errors are wrapped in ImageProcessingError."""
        provider = MockAIProvider()
        
        # Mock the preprocessor to raise an unexpected error
        service = ImageProcessingService(ai_provider=provider)
        
        with patch.object(service.preprocessor, 'validate_and_preprocess') as mock_preprocess:
            mock_preprocess.side_effect = RuntimeError("Unexpected error")
            
            with pytest.raises(ImageProcessingError) as exc_info:
                await service.analyze_image_and_generate_tasks(
                    image_data=sample_image_data,
                    user_id="test-user"
                )
            
            assert "Image processing failed" in str(exc_info.value)
            assert "Unexpected error" in str(exc_info.value)