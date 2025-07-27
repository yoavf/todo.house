#!/usr/bin/env python3
"""
Demonstration of structured logging in the image processing pipeline.

Run this script to see how structured JSON logs are generated during
image processing operations.
"""

import asyncio
import sys
import os
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.logging_config import setup_logging, LoggingConfig

# Configure structured JSON logging
config = LoggingConfig(
    level="INFO",
    format="json",
    include_timestamp=True,
    include_hostname=False,
    include_process_info=False
)
setup_logging(config)


async def demonstrate_logging():
    """Demonstrate structured logging output."""
    import logging
    from app.logging_config import get_image_processing_logger
    
    # Get structured logger
    structured_logger = get_image_processing_logger()
    
    print("\n=== Structured Logging Demonstration ===\n")
    print("The following JSON logs will be generated:\n")
    
    # Example 1: Image processing start
    print("1. Image Processing Start:")
    structured_logger.log_processing_start(
        user_id="demo-user-123",
        filename="kitchen.jpg",
        file_size=2048000  # 2MB
    )
    
    await asyncio.sleep(0.1)
    
    # Example 2: AI request
    print("\n2. AI Analysis Request:")
    structured_logger.log_ai_request(
        provider="gemini",
        user_id="demo-user-123",
        prompt_tokens=250,
        image_size_kb=500
    )
    
    await asyncio.sleep(0.5)
    
    # Example 3: AI response
    print("\n3. AI Analysis Response:")
    structured_logger.log_ai_response(
        provider="gemini",
        user_id="demo-user-123",
        response_time=1.234,
        tasks_found=3,
        tokens_used=450,
        cost=0.0015,
        success=True
    )
    
    await asyncio.sleep(0.1)
    
    # Example 4: Processing complete
    print("\n4. Image Processing Complete:")
    structured_logger.log_processing_complete(
        user_id="demo-user-123",
        filename="kitchen.jpg",
        processing_time=2.456,
        tasks_created=3,
        ai_provider="gemini",
        success=True
    )
    
    # Example 5: Validation failure
    print("\n5. Validation Failure Example:")
    structured_logger.log_validation_failure(
        user_id="demo-user-456",
        filename="large_file.bmp",
        reason="Unsupported format: bmp",
        file_size=15728640,  # 15MB
        file_type="image/bmp"
    )
    
    # Example 6: Processing error
    print("\n6. Processing Error Example:")
    structured_logger.log_processing_error(
        user_id="demo-user-789",
        filename="corrupted.jpg",
        error_type="ImageValidationError",
        error_message="Invalid image file: cannot identify image file",
        processing_time=0.123
    )
    
    print("\n\n=== Log Analysis ===")
    print("\nWith structured JSON logging, you can:")
    print("1. Parse logs programmatically")
    print("2. Filter by specific events (e.g., all errors)")
    print("3. Calculate metrics (average processing time, success rate)")
    print("4. Create alerts based on specific conditions")
    print("5. Visualize data in monitoring dashboards")
    
    print("\n\nExample queries for log analysis:")
    print('- Find all failed requests: jq \'select(.success == false)\'')
    print('- Calculate average processing time: jq \'select(.event == "image_processing_complete") | .processing_time_seconds\' | awk \'{sum+=$1} END {print sum/NR}\'')
    print('- Count tasks by provider: jq \'select(.event == "ai_response") | .provider\' | sort | uniq -c')


if __name__ == "__main__":
    print("Starting structured logging demonstration...")
    print("Note: Logs are written to stdout in JSON format")
    print("-" * 50)
    
    asyncio.run(demonstrate_logging())