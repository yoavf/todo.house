"""Integration tests for structured logging in the image processing pipeline."""

import json
import logging
from io import StringIO
from unittest.mock import patch, MagicMock
import pytest
from PIL import Image
import io

from app.ai.image_processing import ImageProcessingService
from app.ai.providers import AIProvider
from app.logging_config import setup_logging, LoggingConfig


@pytest.mark.integration
class TestLoggingIntegration:
    """Test logging integration with actual image processing components."""
    
    @pytest.fixture
    def sample_image(self):
        """Create a sample image for testing."""
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        return img_bytes.getvalue()
    
    @pytest.fixture
    def mock_ai_provider(self):
        """Create a mock AI provider."""
        provider = MagicMock(spec=AIProvider)
        provider.get_provider_name.return_value = "mock_provider"
        provider.analyze_image.return_value = {
            "tasks": [
                {
                    "title": "Test task",
                    "description": "Test description",
                    "priority": "medium"
                }
            ],
            "analysis_summary": "Test analysis",
            "tokens_used": 100,
            "cost_estimate": 0.001
        }
        return provider
    
    @patch("sys.stdout", new_callable=StringIO)
    async def test_image_processing_logs_structured_data(
        self, mock_stdout, sample_image, mock_ai_provider
    ):
        """Test that image processing generates proper structured logs."""
        # Setup JSON logging
        config = LoggingConfig(format="json", level="INFO")
        setup_logging(config)
        
        # Create service and process image
        service = ImageProcessingService(ai_provider=mock_ai_provider)
        
        await service.analyze_image_and_generate_tasks(
            image_data=sample_image,
            user_id="test-user-123",
            generate_tasks=True
        )
        
        # Parse log output
        log_lines = mock_stdout.getvalue().strip().split('\n')
        log_events = [json.loads(line) for line in log_lines if line]
        
        # Find specific log events
        processing_start = next(
            (e for e in log_events if e.get("event") == "image_processing_start"),
            None
        )
        ai_request = next(
            (e for e in log_events if e.get("event") == "ai_request"),
            None
        )
        ai_response = next(
            (e for e in log_events if e.get("event") == "ai_response"),
            None
        )
        processing_complete = next(
            (e for e in log_events if e.get("event") == "image_processing_complete"),
            None
        )
        
        # Verify processing start log
        assert processing_start is not None
        assert processing_start["user_id"] == "test-user-123"
        assert processing_start["file_size_bytes"] == len(sample_image)
        
        # Verify AI request log
        assert ai_request is not None
        assert ai_request["provider"] == "mock_provider"
        assert ai_request["user_id"] == "test-user-123"
        assert "prompt_tokens" in ai_request
        assert "image_size_kb" in ai_request
        
        # Verify AI response log
        assert ai_response is not None
        assert ai_response["provider"] == "mock_provider"
        assert ai_response["success"] is True
        assert ai_response["tasks_found"] == 1
        assert ai_response["tokens_used"] == 100
        assert ai_response["cost_usd"] == 0.001
        
        # Verify processing complete log
        assert processing_complete is not None
        assert processing_complete["user_id"] == "test-user-123"
        assert processing_complete["tasks_created"] == 1
        assert processing_complete["success"] is True
        assert "processing_time_seconds" in processing_complete
    
    @patch("sys.stdout", new_callable=StringIO)
    async def test_validation_failure_logging(self, mock_stdout):
        """Test that validation failures are properly logged."""
        # Setup JSON logging
        config = LoggingConfig(format="json", level="INFO")
        setup_logging(config)
        
        # Create service without AI provider
        service = ImageProcessingService()
        
        # Create an oversized image
        large_data = b"x" * (11 * 1024 * 1024)  # 11MB
        
        with pytest.raises(Exception):
            await service.analyze_image_and_generate_tasks(
                image_data=large_data,
                user_id="test-user-123",
                generate_tasks=False
            )
        
        # Parse log output
        log_lines = mock_stdout.getvalue().strip().split('\n')
        log_events = [json.loads(line) for line in log_lines if line]
        
        # Find error log
        error_log = next(
            (e for e in log_events if e.get("event") == "image_processing_error"),
            None
        )
        
        assert error_log is not None
        assert error_log["user_id"] == "test-user-123"
        assert error_log["error_type"] == "ImageValidationError"
        assert "too large" in error_log["error_message"].lower()
    
    @patch("sys.stdout", new_callable=StringIO)
    async def test_ai_provider_error_logging(
        self, mock_stdout, sample_image, mock_ai_provider
    ):
        """Test that AI provider errors are properly logged."""
        # Setup JSON logging
        config = LoggingConfig(format="json", level="INFO")
        setup_logging(config)
        
        # Make AI provider fail
        from app.ai.providers import AIProviderAPIError
        mock_ai_provider.analyze_image.side_effect = AIProviderAPIError("API Error")
        
        # Create service and attempt processing
        service = ImageProcessingService(ai_provider=mock_ai_provider)
        
        with pytest.raises(Exception):
            await service.analyze_image_and_generate_tasks(
                image_data=sample_image,
                user_id="test-user-123",
                generate_tasks=True
            )
        
        # Parse log output
        log_lines = mock_stdout.getvalue().strip().split('\n')
        log_events = [json.loads(line) for line in log_lines if line]
        
        # Find AI response error log
        ai_error = next(
            (e for e in log_events 
             if e.get("event") == "ai_response" and not e.get("success")),
            None
        )
        
        assert ai_error is not None
        assert ai_error["provider"] == "mock_provider"
        assert ai_error["success"] is False
    
    def test_logging_configuration_from_env(self):
        """Test that logging can be configured via environment variables."""
        with patch.dict("os.environ", {
            "LOG_LEVEL": "DEBUG",
            "LOG_FORMAT": "json",
            "LOG_INCLUDE_TIMESTAMP": "true",
            "LOG_INCLUDE_HOSTNAME": "true"
        }):
            from app.logging_config import logging_config
            
            assert logging_config.level == "DEBUG"
            assert logging_config.format == "json"
            assert logging_config.include_timestamp is True
            assert logging_config.include_hostname is True