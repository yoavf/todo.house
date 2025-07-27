"""Structured logging configuration for the application."""

import json
import logging
import sys
import uuid
from contextvars import ContextVar
from typing import Optional
from datetime import datetime, timezone

# Context variable for correlation ID
correlation_id: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)


class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as structured JSON."""
        # Base log structure
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add correlation ID if available
        corr_id = correlation_id.get()
        if corr_id:
            log_entry["correlation_id"] = corr_id

        # Add extra fields from record
        if hasattr(record, 'extra_fields'):
            log_entry.update(record.extra_fields)

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": self.formatException(record.exc_info) if record.exc_info else None
            }

        return json.dumps(log_entry, default=str, ensure_ascii=False)


class StructuredLogger:
    """Enhanced logger with structured logging capabilities."""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def _log_with_extra(self, level: int, message: str, **kwargs) -> None:
        """
        Log a message with additional structured fields.
        
        Args:
            level (int): The logging level (e.g., logging.INFO, logging.ERROR).
            message (str): The log message.
            **kwargs: Additional fields to include in the log entry. Fields with a value of `None`
                will be filtered out and not included in the log.
                
        Behavior:
            - Filters out any `None` values from `**kwargs`.
            - Adds the remaining fields to the log entry under the `extra_fields` key.
        """
        extra_fields = {k: v for k, v in kwargs.items() if v is not None}
        
        # Create a custom LogRecord with extra fields
        record = self.logger.makeRecord(
            name=self.logger.name,
            level=level,
            fn="",
            lno=0,
            msg=message,
            args=(),
            exc_info=None
        )
        record.extra_fields = extra_fields
        
        self.logger.handle(record)

    def info(self, message: str, **kwargs) -> None:
        """Log info message with structured data."""
        self._log_with_extra(logging.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs) -> None:
        """Log warning message with structured data."""
        self._log_with_extra(logging.WARNING, message, **kwargs)

    def error(self, message: str, **kwargs) -> None:
        """Log error message with structured data."""
        self._log_with_extra(logging.ERROR, message, **kwargs)

    def debug(self, message: str, **kwargs) -> None:
        """Log debug message with structured data."""
        self._log_with_extra(logging.DEBUG, message, **kwargs)


def setup_logging(log_level: str = "INFO", enable_json: bool = True) -> None:
    """
    Configure structured logging for the application.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
        enable_json: Whether to use JSON formatting
    """
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    
    if enable_json:
        console_handler.setFormatter(StructuredFormatter())
    else:
        # Fallback to standard formatting for development
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(formatter)

    root_logger.addHandler(console_handler)

    # Set specific logger levels
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)


def generate_correlation_id() -> str:
    """Generate a unique correlation ID for request tracking."""
    return str(uuid.uuid4())


def set_correlation_id(corr_id: str) -> None:
    """Set correlation ID for current context."""
    correlation_id.set(corr_id)


def get_correlation_id() -> Optional[str]:
    """Get current correlation ID."""
    return correlation_id.get()


class ImageProcessingLogger:
    """Specialized logger for image processing pipeline."""

    def __init__(self):
        self.logger = StructuredLogger("image_processing")

    def log_image_upload(
        self,
        user_id: str,
        filename: str,
        file_size: int,
        content_type: str,
        correlation_id: str
    ) -> None:
        """Log image upload event."""
        self.logger.info(
            "Image upload received",
            event_type="image_upload",
            user_id=user_id,
            filename=filename,
            file_size=file_size,
            content_type=content_type,
            correlation_id=correlation_id
        )

    def log_image_validation(
        self,
        user_id: str,
        validation_result: str,
        original_size: int,
        processed_size: Optional[int] = None,
        compression_ratio: Optional[float] = None,
        error_message: Optional[str] = None
    ) -> None:
        """Log image validation results."""
        self.logger.info(
            f"Image validation {validation_result}",
            event_type="image_validation",
            user_id=user_id,
            validation_result=validation_result,
            original_size=original_size,
            processed_size=processed_size,
            compression_ratio=compression_ratio,
            error_message=error_message
        )

    def log_ai_request_start(
        self,
        user_id: str,
        provider: str,
        model: str,
        image_size: int,
        prompt_length: int
    ) -> None:
        """Log AI provider request start."""
        self.logger.info(
            "AI analysis request started",
            event_type="ai_request_start",
            user_id=user_id,
            provider=provider,
            model=model,
            image_size=image_size,
            prompt_length=prompt_length
        )

    def log_ai_request_complete(
        self,
        user_id: str,
        provider: str,
        model: str,
        processing_time: float,
        tokens_used: Optional[int] = None,
        cost_estimate: Optional[float] = None,
        tasks_generated: int = 0,
        retry_count: int = 0,
        success: bool = True
    ) -> None:
        """Log AI provider request completion."""
        self.logger.info(
            f"AI analysis request {'completed' if success else 'failed'}",
            event_type="ai_request_complete",
            user_id=user_id,
            provider=provider,
            model=model,
            processing_time=processing_time,
            tokens_used=tokens_used,
            cost_estimate=cost_estimate,
            tasks_generated=tasks_generated,
            retry_count=retry_count,
            success=success
        )

    def log_ai_request_error(
        self,
        user_id: str,
        provider: str,
        error_type: str,
        error_message: str,
        retry_count: int,
        processing_time: float
    ) -> None:
        """Log AI provider request error."""
        self.logger.error(
            "AI analysis request failed",
            event_type="ai_request_error",
            user_id=user_id,
            provider=provider,
            error_type=error_type,
            error_message=error_message,
            retry_count=retry_count,
            processing_time=processing_time
        )

    def log_task_creation(
        self,
        user_id: str,
        tasks_created: int,
        source_image_id: str,
        ai_confidence: Optional[float] = None,
        provider: str = "unknown"
    ) -> None:
        """Log task creation from AI analysis."""
        self.logger.info(
            "Tasks created from AI analysis",
            event_type="task_creation",
            user_id=user_id,
            tasks_created=tasks_created,
            source_image_id=source_image_id,
            ai_confidence=ai_confidence,
            provider=provider
        )

    def log_processing_pipeline_complete(
        self,
        user_id: str,
        total_processing_time: float,
        tasks_generated: int,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> None:
        """Log complete processing pipeline result."""
        self.logger.info(
            f"Image processing pipeline {'completed' if success else 'failed'}",
            event_type="pipeline_complete",
            user_id=user_id,
            total_processing_time=total_processing_time,
            tasks_generated=tasks_generated,
            success=success,
            error_message=error_message
        )


class AIProviderLogger:
    """Specialized logger for AI provider interactions."""

    def __init__(self, provider_name: str):
        self.provider_name = provider_name
        self.logger = StructuredLogger(f"ai_provider.{provider_name}")

    def log_request(
        self,
        request_id: str,
        model: str,
        prompt_length: int,
        image_size: int
    ) -> None:
        """Log AI provider request."""
        self.logger.info(
            "AI provider request initiated",
            event_type="ai_provider_request",
            provider=self.provider_name,
            request_id=request_id,
            model=model,
            prompt_length=prompt_length,
            image_size=image_size
        )

    def log_response(
        self,
        request_id: str,
        model: str,
        processing_time: float,
        tokens_used: Optional[int] = None,
        cost_estimate: Optional[float] = None,
        response_length: int = 0,
        tasks_parsed: int = 0
    ) -> None:
        """Log AI provider response."""
        self.logger.info(
            "AI provider response received",
            event_type="ai_provider_response",
            provider=self.provider_name,
            request_id=request_id,
            model=model,
            processing_time=processing_time,
            tokens_used=tokens_used,
            cost_estimate=cost_estimate,
            response_length=response_length,
            tasks_parsed=tasks_parsed
        )

    def log_error(
        self,
        request_id: str,
        model: str,
        error_type: str,
        error_message: str,
        processing_time: float,
        retry_attempt: int = 0
    ) -> None:
        """Log AI provider error."""
        self.logger.error(
            "AI provider request failed",
            event_type="ai_provider_error",
            provider=self.provider_name,
            request_id=request_id,
            model=model,
            error_type=error_type,
            error_message=error_message,
            processing_time=processing_time,
            retry_attempt=retry_attempt
        )

    def log_rate_limit(
        self,
        request_id: str,
        model: str,
        retry_after: Optional[int] = None,
        retry_attempt: int = 0
    ) -> None:
        """Log rate limit event."""
        self.logger.warning(
            "AI provider rate limit encountered",
            event_type="ai_provider_rate_limit",
            provider=self.provider_name,
            request_id=request_id,
            model=model,
            retry_after=retry_after,
            retry_attempt=retry_attempt
        )

    def log_usage_metrics(
        self,
        requests_made: int,
        successful_requests: int,
        failed_requests: int,
        total_tokens_used: int,
        total_cost_estimate: float,
        average_response_time: float
    ) -> None:
        """Log usage metrics summary."""
        self.logger.info(
            "AI provider usage metrics",
            event_type="ai_provider_metrics",
            provider=self.provider_name,
            requests_made=requests_made,
            successful_requests=successful_requests,
            failed_requests=failed_requests,
            total_tokens_used=total_tokens_used,
            total_cost_estimate=total_cost_estimate,
            average_response_time=average_response_time,
            success_rate=successful_requests / requests_made if requests_made > 0 else 0
        )