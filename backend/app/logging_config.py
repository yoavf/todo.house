"""Structured logging configuration for the application."""

import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict, Optional
from pythonjsonlogger import jsonlogger
from pydantic import BaseSettings, Field
from pydantic_settings import SettingsConfigDict


class LoggingConfig(BaseSettings):
    """Logging configuration settings."""

    model_config = SettingsConfigDict(env_prefix="LOG_")

    level: str = Field(default="INFO", description="Logging level")
    format: str = Field(default="json", description="Log format: json or text")
    include_timestamp: bool = Field(default=True, description="Include timestamp in logs")
    include_hostname: bool = Field(default=False, description="Include hostname in logs")
    include_process_info: bool = Field(default=False, description="Include process info in logs")


class StructuredFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional context."""

    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        """Add custom fields to the log record."""
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp
        if hasattr(self, '_include_timestamp') and self._include_timestamp:
            log_record['timestamp'] = datetime.utcnow().isoformat()
        
        # Add standard fields
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        
        # Add location info
        log_record['module'] = record.module
        log_record['function'] = record.funcName
        log_record['line'] = record.lineno
        
        # Add process info if requested
        if hasattr(self, '_include_process_info') and self._include_process_info:
            log_record['process_id'] = record.process
            log_record['thread_id'] = record.thread
            log_record['thread_name'] = record.threadName
        
        # Add hostname if requested
        if hasattr(self, '_include_hostname') and self._include_hostname:
            import socket
            log_record['hostname'] = socket.gethostname()
        
        # Move message to a dedicated field
        if 'message' in log_record:
            log_record['msg'] = log_record.pop('message')


class ImageProcessingLogger:
    """Specialized logger for image processing with structured context."""
    
    def __init__(self, logger: logging.Logger):
        self._logger = logger
    
    def log_processing_start(self, user_id: str, filename: str, file_size: int) -> None:
        """Log the start of image processing."""
        self._logger.info(
            "Image processing started",
            extra={
                'event': 'image_processing_start',
                'user_id': user_id,
                'filename': filename,
                'file_size_bytes': file_size,
                'context': 'image_processing'
            }
        )
    
    def log_processing_complete(
        self,
        user_id: str,
        filename: str,
        processing_time: float,
        tasks_created: int,
        ai_provider: str,
        success: bool = True
    ) -> None:
        """Log successful image processing completion."""
        self._logger.info(
            "Image processing completed",
            extra={
                'event': 'image_processing_complete',
                'user_id': user_id,
                'filename': filename,
                'processing_time_seconds': round(processing_time, 3),
                'tasks_created': tasks_created,
                'ai_provider': ai_provider,
                'success': success,
                'context': 'image_processing'
            }
        )
    
    def log_processing_error(
        self,
        user_id: str,
        filename: str,
        error_type: str,
        error_message: str,
        processing_time: Optional[float] = None
    ) -> None:
        """Log image processing errors."""
        extra_data = {
            'event': 'image_processing_error',
            'user_id': user_id,
            'filename': filename,
            'error_type': error_type,
            'error_message': error_message,
            'context': 'image_processing'
        }
        
        if processing_time is not None:
            extra_data['processing_time_seconds'] = round(processing_time, 3)
        
        self._logger.error("Image processing failed", extra=extra_data)
    
    def log_ai_request(
        self,
        provider: str,
        user_id: str,
        prompt_tokens: int,
        image_size_kb: int
    ) -> None:
        """Log AI provider request."""
        self._logger.info(
            "AI analysis request sent",
            extra={
                'event': 'ai_request',
                'provider': provider,
                'user_id': user_id,
                'prompt_tokens': prompt_tokens,
                'image_size_kb': image_size_kb,
                'context': 'ai_provider'
            }
        )
    
    def log_ai_response(
        self,
        provider: str,
        user_id: str,
        response_time: float,
        tasks_found: int,
        tokens_used: Optional[int] = None,
        cost: Optional[float] = None,
        success: bool = True
    ) -> None:
        """Log AI provider response."""
        extra_data = {
            'event': 'ai_response',
            'provider': provider,
            'user_id': user_id,
            'response_time_seconds': round(response_time, 3),
            'tasks_found': tasks_found,
            'success': success,
            'context': 'ai_provider'
        }
        
        if tokens_used is not None:
            extra_data['tokens_used'] = tokens_used
        
        if cost is not None:
            extra_data['cost_usd'] = round(cost, 6)
        
        level = logging.INFO if success else logging.ERROR
        message = "AI analysis completed" if success else "AI analysis failed"
        self._logger.log(level, message, extra=extra_data)
    
    def log_validation_failure(
        self,
        user_id: str,
        filename: str,
        reason: str,
        file_size: Optional[int] = None,
        file_type: Optional[str] = None
    ) -> None:
        """Log image validation failures."""
        extra_data = {
            'event': 'validation_failure',
            'user_id': user_id,
            'filename': filename,
            'reason': reason,
            'context': 'image_validation'
        }
        
        if file_size is not None:
            extra_data['file_size_bytes'] = file_size
        
        if file_type is not None:
            extra_data['file_type'] = file_type
        
        self._logger.warning("Image validation failed", extra=extra_data)


def setup_logging(config: Optional[LoggingConfig] = None) -> None:
    """Set up structured logging for the application."""
    if config is None:
        config = LoggingConfig()
    
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, config.level.upper()))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    
    if config.format.lower() == "json":
        # Set up JSON formatter
        formatter = StructuredFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s',
            json_ensure_ascii=False
        )
        formatter._include_timestamp = config.include_timestamp
        formatter._include_hostname = config.include_hostname
        formatter._include_process_info = config.include_process_info
    else:
        # Use standard text formatter
        format_str = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        formatter = logging.Formatter(format_str)
    
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)
    
    # Set specific log levels for noisy libraries
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def get_image_processing_logger(name: str = "app.image_processing") -> ImageProcessingLogger:
    """Get a specialized image processing logger."""
    return ImageProcessingLogger(logging.getLogger(name))


# Initialize logging configuration
logging_config = LoggingConfig()