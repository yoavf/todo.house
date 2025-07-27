"""Middleware for request/response logging and monitoring."""

import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log HTTP requests and responses with timing information."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process the request and log details."""
        request_id = request.headers.get("X-Request-ID", "no-request-id")
        start_time = time.time()
        
        # Log request start
        logger.info(
            "Request started",
            extra={
                "event": "http_request_start",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client_host": request.client.host if request.client else None,
                "user_agent": request.headers.get("User-Agent", "unknown"),
                "context": "http_request"
            }
        )
        
        # Process the request
        try:
            response = await call_next(request)
            processing_time = time.time() - start_time
            
            # Log successful response
            logger.info(
                "Request completed",
                extra={
                    "event": "http_request_complete",
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "processing_time_seconds": round(processing_time, 3),
                    "success": 200 <= response.status_code < 400,
                    "context": "http_request"
                }
            )
            
            # Add processing time header
            response.headers["X-Processing-Time"] = f"{processing_time:.3f}"
            return response
            
        except Exception as e:
            processing_time = time.time() - start_time
            
            # Log error
            logger.error(
                "Request failed",
                extra={
                    "event": "http_request_error",
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "processing_time_seconds": round(processing_time, 3),
                    "context": "http_request"
                }
            )
            raise