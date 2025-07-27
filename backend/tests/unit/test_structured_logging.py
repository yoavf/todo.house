"""Tests for structured logging functionality."""

import json
import logging
from unittest.mock import patch

from app.logging_config import (
    StructuredFormatter,
    StructuredLogger,
    ImageProcessingLogger,
    AIProviderLogger,
    setup_logging,
    generate_correlation_id,
    set_correlation_id,
    get_correlation_id,
)


class TestStructuredFormatter:
    """Test structured JSON formatter."""

    def test_basic_log_formatting(self):
        """Test basic log record formatting."""
        formatter = StructuredFormatter()
        
        # Create a log record
        record = logging.LogRecord(
            name="test_logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=42,
            msg="Test message",
            args=(),
            exc_info=None
        )
        record.module = "test_module"
        record.funcName = "test_function"
        
        # Format the record
        formatted = formatter.format(record)
        
        # Parse as JSON
        log_data = json.loads(formatted)
        
        # Verify structure
        assert log_data["level"] == "INFO"
        assert log_data["logger"] == "test_logger"
        assert log_data["message"] == "Test message"
        assert log_data["module"] == "test_module"
        assert log_data["function"] == "test_function"
        assert log_data["line"] == 42
        assert "timestamp" in log_data

    def test_log_with_correlation_id(self):
        """Test log formatting with correlation ID."""
        formatter = StructuredFormatter()
        correlation_id = "test-correlation-id"
        
        # Set correlation ID
        set_correlation_id(correlation_id)
        
        # Create and format log record
        record = logging.LogRecord(
            name="test_logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=42,
            msg="Test message",
            args=(),
            exc_info=None
        )
        record.module = "test_module"
        record.funcName = "test_function"
        
        formatted = formatter.format(record)
        log_data = json.loads(formatted)
        
        # Verify correlation ID is included
        assert log_data["correlation_id"] == correlation_id

    def test_log_with_extra_fields(self):
        """Test log formatting with extra fields."""
        formatter = StructuredFormatter()
        
        # Create log record with extra fields
        record = logging.LogRecord(
            name="test_logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=42,
            msg="Test message",
            args=(),
            exc_info=None
        )
        record.module = "test_module"
        record.funcName = "test_function"
        record.extra_fields = {
            "user_id": "test-user",
            "request_id": "test-request",
            "processing_time": 1.23
        }
        
        formatted = formatter.format(record)
        log_data = json.loads(formatted)
        
        # Verify extra fields are included
        assert log_data["user_id"] == "test-user"
        assert log_data["request_id"] == "test-request"
        assert log_data["processing_time"] == 1.23


class TestStructuredLogger:
    """Test structured logger functionality."""

    def test_structured_logger_info(self):
        """Test structured logger info method."""
        with patch('logging.getLogger') as mock_get_logger:
            mock_logger = mock_get_logger.return_value
            mock_logger.name = "test_logger"
            mock_logger.makeRecord.return_value = logging.LogRecord(
                name="test_logger",
                level=logging.INFO,
                pathname="",
                lineno=0,
                msg="Test message",
                args=(),
                exc_info=None
            )
            
            structured_logger = StructuredLogger("test_logger")
            structured_logger.info(
                "Test message",
                user_id="test-user",
                processing_time=1.23
            )
            
            # Verify logger was called
            mock_logger.handle.assert_called_once()
            
            # Verify extra fields were set
            call_args = mock_logger.handle.call_args[0][0]
            assert hasattr(call_args, 'extra_fields')
            assert call_args.extra_fields["user_id"] == "test-user"
            assert call_args.extra_fields["processing_time"] == 1.23


class TestImageProcessingLogger:
    """Test image processing logger."""

    def test_log_image_upload(self):
        """Test image upload logging."""
        with patch('app.logging_config.StructuredLogger') as mock_logger_class:
            mock_logger = mock_logger_class.return_value
            
            processing_logger = ImageProcessingLogger()
            processing_logger.log_image_upload(
                user_id="test-user",
                filename="test.jpg",
                file_size=1024,
                content_type="image/jpeg",
                correlation_id="test-correlation"
            )
            
            # Verify logger was called with correct parameters
            mock_logger.info.assert_called_once_with(
                "Image upload received",
                event_type="image_upload",
                user_id="test-user",
                filename="test.jpg",
                file_size=1024,
                content_type="image/jpeg",
                correlation_id="test-correlation"
            )

    def test_log_ai_request_complete(self):
        """Test AI request completion logging."""
        with patch('app.logging_config.StructuredLogger') as mock_logger_class:
            mock_logger = mock_logger_class.return_value
            
            processing_logger = ImageProcessingLogger()
            processing_logger.log_ai_request_complete(
                user_id="test-user",
                provider="gemini",
                model="gemini-1.5-flash",
                processing_time=2.5,
                tokens_used=150,
                cost_estimate=0.001,
                tasks_generated=3,
                retry_count=1,
                success=True
            )
            
            # Verify logger was called with correct parameters
            mock_logger.info.assert_called_once_with(
                "AI analysis request completed",
                event_type="ai_request_complete",
                user_id="test-user",
                provider="gemini",
                model="gemini-1.5-flash",
                processing_time=2.5,
                tokens_used=150,
                cost_estimate=0.001,
                tasks_generated=3,
                retry_count=1,
                success=True
            )


class TestAIProviderLogger:
    """Test AI provider logger."""

    def test_log_request(self):
        """Test AI provider request logging."""
        with patch('app.logging_config.StructuredLogger') as mock_logger_class:
            mock_logger = mock_logger_class.return_value
            
            provider_logger = AIProviderLogger("gemini")
            provider_logger.log_request(
                request_id="test-request",
                model="gemini-1.5-flash",
                prompt_length=500,
                image_size=1024
            )
            
            # Verify logger was called with correct parameters
            mock_logger.info.assert_called_once_with(
                "AI provider request initiated",
                event_type="ai_provider_request",
                provider="gemini",
                request_id="test-request",
                model="gemini-1.5-flash",
                prompt_length=500,
                image_size=1024
            )

    def test_log_error(self):
        """Test AI provider error logging."""
        with patch('app.logging_config.StructuredLogger') as mock_logger_class:
            mock_logger = mock_logger_class.return_value
            
            provider_logger = AIProviderLogger("gemini")
            provider_logger.log_error(
                request_id="test-request",
                model="gemini-1.5-flash",
                error_type="api_error",
                error_message="API rate limit exceeded",
                processing_time=1.0,
                retry_attempt=2
            )
            
            # Verify logger was called with correct parameters
            mock_logger.error.assert_called_once_with(
                "AI provider request failed",
                event_type="ai_provider_error",
                provider="gemini",
                request_id="test-request",
                model="gemini-1.5-flash",
                error_type="api_error",
                error_message="API rate limit exceeded",
                processing_time=1.0,
                retry_attempt=2
            )


class TestCorrelationId:
    """Test correlation ID functionality."""

    def test_generate_correlation_id(self):
        """Test correlation ID generation."""
        correlation_id = generate_correlation_id()
        
        # Should be a valid UUID string
        assert isinstance(correlation_id, str)
        assert len(correlation_id) == 36  # UUID format
        assert correlation_id.count('-') == 4

    def test_set_and_get_correlation_id(self):
        """Test setting and getting correlation ID."""
        test_id = "test-correlation-id"
        
        # Set correlation ID
        set_correlation_id(test_id)
        
        # Get correlation ID
        retrieved_id = get_correlation_id()
        
        assert retrieved_id == test_id

    def test_correlation_id_isolation(self):
        """Test that correlation IDs are isolated between contexts."""
        # This test would need to be run in different async contexts
        # to properly test isolation, but we can at least test the basic functionality
        
        # Set a value
        set_correlation_id("test-id")
        assert get_correlation_id() == "test-id"
        
        # Set a different value
        set_correlation_id("different-id")
        assert get_correlation_id() == "different-id"


class TestLoggingSetup:
    """Test logging setup functionality."""

    def test_setup_logging_json_enabled(self):
        """Test logging setup with JSON formatting enabled."""
        with patch('logging.getLogger') as mock_get_logger, \
             patch('logging.StreamHandler') as mock_handler_class:
            
            mock_root_logger = mock_get_logger.return_value
            mock_root_logger.handlers = []  # Start with empty handlers
            mock_handler = mock_handler_class.return_value
            
            setup_logging(log_level="DEBUG", enable_json=True)
            
            # Verify root logger configuration
            mock_root_logger.setLevel.assert_called()
            mock_root_logger.addHandler.assert_called_with(mock_handler)
            
            # Verify handler formatter is StructuredFormatter
            mock_handler.setFormatter.assert_called_once()
            formatter_arg = mock_handler.setFormatter.call_args[0][0]
            assert isinstance(formatter_arg, StructuredFormatter)

    def test_setup_logging_json_disabled(self):
        """Test logging setup with JSON formatting disabled."""
        with patch('logging.getLogger') as mock_get_logger, \
             patch('logging.StreamHandler') as mock_handler_class:
            
            mock_root_logger = mock_get_logger.return_value
            mock_root_logger.handlers = []  # Start with empty handlers
            mock_handler = mock_handler_class.return_value
            
            setup_logging(log_level="INFO", enable_json=False)
            
            # Verify root logger configuration
            mock_root_logger.setLevel.assert_called()
            mock_root_logger.addHandler.assert_called_with(mock_handler)
            
            # Verify handler formatter is standard formatter
            mock_handler.setFormatter.assert_called_once()
            formatter_arg = mock_handler.setFormatter.call_args[0][0]
            assert isinstance(formatter_arg, logging.Formatter)
            assert not isinstance(formatter_arg, StructuredFormatter)