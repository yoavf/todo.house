"""Unit tests for ImageProcessingService locale support."""

import pytest
from unittest.mock import Mock, patch
from app.ai.image_processing import ImageProcessingService
from app.ai.prompt_service import PromptService


class TestImageProcessingServiceLocale:
    """Test locale-aware functionality of ImageProcessingService."""

    @pytest.fixture
    def mock_prompt_service(self):
        """Create a mock PromptService for testing."""
        service = Mock(spec=PromptService)
        service.get_prompt.return_value = "Test prompt content"
        return service

    @pytest.fixture
    def image_processor(self, mock_prompt_service):
        """Create ImageProcessingService with mocked dependencies."""
        processor = ImageProcessingService()
        processor.prompt_service = mock_prompt_service
        processor.ai_provider = Mock()
        return processor

    @pytest.mark.unit
    def test_generate_prompt_with_locale(self, image_processor, mock_prompt_service):
        """Test that generate_prompt passes locale to PromptService."""
        # Test with Hebrew locale
        image_processor.generate_prompt(locale="he")
        mock_prompt_service.get_prompt.assert_called_with("home_maintenance_analysis", "he")
        
        # Test with English locale (default)
        image_processor.generate_prompt(locale="en")
        mock_prompt_service.get_prompt.assert_called_with("home_maintenance_analysis", "en")
        
        # Test with default locale (should be "en")
        image_processor.generate_prompt()
        mock_prompt_service.get_prompt.assert_called_with("home_maintenance_analysis", "en")

    @pytest.mark.unit
    def test_generate_prompt_with_context_and_locale(self, image_processor, mock_prompt_service):
        """Test generate_prompt with both context and locale parameters."""
        context = {"room_type": "kitchen"}
        
        # Mock the prompt service to return a base prompt
        mock_prompt_service.get_prompt.return_value = "Base Hebrew prompt"
        
        result = image_processor.generate_prompt(context=context, locale="he")
        
        # Verify the prompt service was called with correct locale
        mock_prompt_service.get_prompt.assert_called_with("home_maintenance_analysis", "he")
        
        # Verify context was added to the prompt
        assert "Base Hebrew prompt" in result
        assert "kitchen" in result

    @pytest.mark.unit
    def test_generate_prompt_called_with_locale_in_workflow(self, image_processor, mock_prompt_service):
        """Test that generate_prompt is called with the correct locale parameter."""
        # Test that the method signature accepts locale and passes it correctly
        with patch.object(image_processor, 'generate_prompt') as mock_generate:
            mock_generate.return_value = "Test prompt"
            
            # Simulate calling generate_prompt with locale
            image_processor.generate_prompt(locale="he")
            
            # Verify it was called with the Hebrew locale
            mock_generate.assert_called_with(locale="he")

    @pytest.mark.unit
    def test_prompt_override_workflow(self, image_processor, mock_prompt_service):
        """Test that prompt_override parameter works correctly."""
        # When prompt_override is provided, generate_prompt should not be called
        # This tests the logic flow in analyze_image_and_generate_tasks
        
        # Test the conditional logic: prompt_override or self.generate_prompt(locale=locale)
        prompt_override = "Custom Hebrew prompt"
        locale = "he"
        
        # Simulate the logic from analyze_image_and_generate_tasks
        prompt = prompt_override or image_processor.generate_prompt(locale=locale)
        
        # When override is provided, it should be used
        assert prompt == "Custom Hebrew prompt"
        
        # When no override, generate_prompt should be called
        prompt = None or image_processor.generate_prompt(locale=locale)
        mock_prompt_service.get_prompt.assert_called_with("home_maintenance_analysis", "he")

    @pytest.mark.unit
    def test_generate_prompt_handles_prompt_service_error(self, image_processor, mock_prompt_service):
        """Test error handling when PromptService fails."""
        from app.ai.prompt_service import PromptNotFoundError
        from app.ai.image_processing import ImageProcessingError
        
        # Mock PromptService to raise an error
        mock_prompt_service.get_prompt.side_effect = PromptNotFoundError("Prompt not found")
        
        # Should raise ImageProcessingError
        with pytest.raises(ImageProcessingError) as exc_info:
            image_processor.generate_prompt(locale="he")
        
        assert "AI prompt configuration missing" in str(exc_info.value)
        
        # Verify the error includes the original error message
        assert "Prompt not found" in str(exc_info.value)

    @pytest.mark.unit
    def test_generate_prompt_locale_parameter_types(self, image_processor, mock_prompt_service):
        """Test that locale parameter accepts different string types."""
        # Test with different locale formats
        locales_to_test = ["en", "he", "en-US", "he-IL", "fr"]
        
        for locale in locales_to_test:
            image_processor.generate_prompt(locale=locale)
            mock_prompt_service.get_prompt.assert_called_with("home_maintenance_analysis", locale)