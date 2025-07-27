"""Unit tests for structured logging configuration."""

import json
import logging
from io import StringIO
import pytest
from unittest.mock import patch, MagicMock

from app.logging_config import (
    setup_logging,
    StructuredFormatter,
    ImageProcessingLogger,
    LoggingConfig,
)


class TestStructuredFormatter:
    """Test the custom JSON formatter."""
    
    def test_formatter_adds_standard_fields(self):
        """Test that formatter adds required fields to log records."""
        formatter = StructuredFormatter()
        formatter._include_timestamp = True
        formatter._include_hostname = False
        formatter._include_process_info = False
        
        # Create a log record
        record = logging.LogRecord(
            name="test.logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=42,
            msg="Test message",
            args=(),
            exc_info=None
        )
        
        # Format the record
        formatted = formatter.format(record)
        log_data = json.loads(formatted)
        
        # Check standard fields
        assert log_data["level"] == "INFO"
        assert log_data["logger"] == "test.logger"
        assert log_data["module"] == "test"
        assert log_data["function"] == "<module>"
        assert log_data["line"] == 42
        assert log_data["msg"] == "Test message"
        assert "timestamp" in log_data
    
    def test_formatter_includes_extra_fields(self):
        """Test that formatter includes extra fields from the record."""
        formatter = StructuredFormatter()
        
        # Create a log record with extra fields
        record = logging.LogRecord(
            name="test.logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=42,
            msg="Test message",
            args=(),
            exc_info=None
        )
        record.user_id = "test-user-123"
        record.event = "test_event"
        
        # Format the record
        formatted = formatter.format(record)
        log_data = json.loads(formatted)
        
        # Check extra fields are included
        assert log_data["user_id"] == "test-user-123"
        assert log_data["event"] == "test_event"


class TestImageProcessingLogger:
    """Test the specialized image processing logger."""
    
    @pytest.fixture
    def mock_logger(self):
        """Create a mock logger for testing."""
        logger = MagicMock()
        return logger
    
    def test_log_processing_start(self, mock_logger):
        """Test logging of processing start event."""
        ip_logger = ImageProcessingLogger(mock_logger)
        
        ip_logger.log_processing_start(
            user_id="user-123",
            filename="test.jpg",
            file_size=1024000
        )
        
        mock_logger.info.assert_called_once()
        args, kwargs = mock_logger.info.call_args
        assert args[0] == "Image processing started"
        
        extra = kwargs["extra"]
        assert extra["event"] == "image_processing_start"
        assert extra["user_id"] == "user-123"
        assert extra["filename"] == "test.jpg"
        assert extra["file_size_bytes"] == 1024000
        assert extra["context"] == "image_processing"
    
    def test_log_processing_complete(self, mock_logger):
        """Test logging of successful processing completion."""
        ip_logger = ImageProcessingLogger(mock_logger)
        
        ip_logger.log_processing_complete(
            user_id="user-123",
            filename="test.jpg",
            processing_time=2.456,
            tasks_created=3,
            ai_provider="gemini",
            success=True
        )
        
        mock_logger.info.assert_called_once()
        args, kwargs = mock_logger.info.call_args
        assert args[0] == "Image processing completed"
        
        extra = kwargs["extra"]
        assert extra["event"] == "image_processing_complete"
        assert extra["user_id"] == "user-123"
        assert extra["filename"] == "test.jpg"
        assert extra["processing_time_seconds"] == 2.456
        assert extra["tasks_created"] == 3
        assert extra["ai_provider"] == "gemini"
        assert extra["success"] is True
    
    def test_log_processing_error(self, mock_logger):
        """Test logging of processing errors."""
        ip_logger = ImageProcessingLogger(mock_logger)
        
        ip_logger.log_processing_error(
            user_id="user-123",
            filename="test.jpg",
            error_type="ValidationError",
            error_message="Image too large",
            processing_time=0.123
        )
        
        mock_logger.error.assert_called_once()
        args, kwargs = mock_logger.error.call_args
        assert args[0] == "Image processing failed"
        
        extra = kwargs["extra"]
        assert extra["event"] == "image_processing_error"
        assert extra["user_id"] == "user-123"
        assert extra["error_type"] == "ValidationError"
        assert extra["error_message"] == "Image too large"
        assert extra["processing_time_seconds"] == 0.123
    
    def test_log_ai_request(self, mock_logger):
        """Test logging of AI provider requests."""
        ip_logger = ImageProcessingLogger(mock_logger)
        
        ip_logger.log_ai_request(
            provider="gemini",
            user_id="user-123",
            prompt_tokens=150,
            image_size_kb=256
        )
        
        mock_logger.info.assert_called_once()
        extra = mock_logger.info.call_args.kwargs["extra"]
        assert extra["event"] == "ai_request"
        assert extra["provider"] == "gemini"
        assert extra["prompt_tokens"] == 150
        assert extra["image_size_kb"] == 256
    
    def test_log_ai_response_success(self, mock_logger):
        """Test logging of successful AI responses."""
        ip_logger = ImageProcessingLogger(mock_logger)
        
        ip_logger.log_ai_response(
            provider="gemini",
            user_id="user-123",
            response_time=1.234,
            tasks_found=5,
            tokens_used=500,
            cost=0.001234,
            success=True
        )
        
        mock_logger.log.assert_called_once()
        args = mock_logger.log.call_args.args
        assert args[0] == logging.INFO
        assert args[1] == "AI analysis completed"
        
        extra = mock_logger.log.call_args.kwargs["extra"]
        assert extra["event"] == "ai_response"
        assert extra["response_time_seconds"] == 1.234
        assert extra["tasks_found"] == 5
        assert extra["tokens_used"] == 500
        assert extra["cost_usd"] == 0.001234
        assert extra["success"] is True
    
    def test_log_ai_response_failure(self, mock_logger):
        """Test logging of failed AI responses."""
        ip_logger = ImageProcessingLogger(mock_logger)
        
        ip_logger.log_ai_response(
            provider="gemini",
            user_id="user-123",
            response_time=0.5,
            tasks_found=0,
            success=False
        )
        
        mock_logger.log.assert_called_once()
        args = mock_logger.log.call_args.args
        assert args[0] == logging.ERROR
        assert args[1] == "AI analysis failed"
    
    def test_log_validation_failure(self, mock_logger):
        """Test logging of validation failures."""
        ip_logger = ImageProcessingLogger(mock_logger)
        
        ip_logger.log_validation_failure(
            user_id="user-123",
            filename="test.jpg",
            reason="File too large",
            file_size=10485760,
            file_type="image/jpeg"
        )
        
        mock_logger.warning.assert_called_once()
        extra = mock_logger.warning.call_args.kwargs["extra"]
        assert extra["event"] == "validation_failure"
        assert extra["reason"] == "File too large"
        assert extra["file_size_bytes"] == 10485760
        assert extra["file_type"] == "image/jpeg"


class TestLoggingSetup:
    """Test the logging setup functionality."""
    
    @patch("sys.stdout", new_callable=StringIO)
    def test_setup_logging_json_format(self, mock_stdout):
        """Test that JSON logging is properly configured."""
        config = LoggingConfig(format="json", level="INFO")
        setup_logging(config)
        
        # Log a test message
        logger = logging.getLogger("test")
        logger.info("Test message", extra={"user_id": "123"})
        
        # Check output is valid JSON
        output = mock_stdout.getvalue().strip()
        log_data = json.loads(output)
        
        assert log_data["msg"] == "Test message"
        assert log_data["user_id"] == "123"
        assert log_data["level"] == "INFO"
    
    def test_setup_logging_text_format(self):
        """Test that text logging format works."""
        config = LoggingConfig(format="text", level="INFO")
        
        # Capture log output
        with patch("logging.StreamHandler.emit") as mock_emit:
            setup_logging(config)
            logger = logging.getLogger("test")
            logger.info("Test message")
            
            # Verify a handler was added and used
            assert mock_emit.called
    
    def test_noisy_loggers_silenced(self):
        """Test that noisy third-party loggers are set to WARNING level."""
        setup_logging()
        
        # Check that specific loggers are set to WARNING
        assert logging.getLogger("uvicorn").level == logging.WARNING
        assert logging.getLogger("uvicorn.access").level == logging.WARNING
        assert logging.getLogger("httpcore").level == logging.WARNING
        assert logging.getLogger("httpx").level == logging.WARNING


@pytest.mark.unit
class TestLoggingConfig:
    """Test the logging configuration settings."""
    
    def test_default_config(self):
        """Test default logging configuration values."""
        config = LoggingConfig()
        
        assert config.level == "INFO"
        assert config.format == "json"
        assert config.include_timestamp is True
        assert config.include_hostname is False
        assert config.include_process_info is False
    
    def test_env_var_override(self):
        """Test that environment variables override defaults."""
        with patch.dict("os.environ", {
            "LOG_LEVEL": "DEBUG",
            "LOG_FORMAT": "text",
            "LOG_INCLUDE_HOSTNAME": "true"
        }):
            config = LoggingConfig()
            
            assert config.level == "DEBUG"
            assert config.format == "text"
            assert config.include_hostname is True