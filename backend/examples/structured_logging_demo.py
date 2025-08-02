#!/usr/bin/env python3
"""
Demo script showing structured logging functionality.

This script demonstrates the structured JSON logging capabilities
added to the image processing pipeline.
"""

import asyncio
import io
import sys
import os
from PIL import Image

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.logging_config import (
    setup_logging,
    ImageProcessingLogger,
    AIProviderLogger,
    generate_correlation_id,
    set_correlation_id,
)
from app.ai.image_processing import ImageProcessingService


def create_sample_image() -> bytes:
    """Create a sample image for testing."""
    # Create a simple test image
    image = Image.new("RGB", (100, 100), color="red")

    # Save to bytes
    img_bytes = io.BytesIO()
    image.save(img_bytes, format="JPEG")
    return img_bytes.getvalue()


async def demo_structured_logging():
    """Demonstrate structured logging functionality."""
    print("=== Structured Logging Demo ===\n")

    # Setup structured logging
    setup_logging(log_level="INFO", enable_json=True)

    # Generate correlation ID for request tracking
    correlation_id = generate_correlation_id()
    set_correlation_id(correlation_id)

    print(f"Generated correlation ID: {correlation_id}\n")

    # Create loggers
    processing_logger = ImageProcessingLogger()
    ai_logger = AIProviderLogger("gemini")

    # Demo 1: Image upload logging
    print("1. Demonstrating image upload logging:")
    sample_image = create_sample_image()

    processing_logger.log_image_upload(
        user_id="demo-user",
        filename="sample.jpg",
        file_size=len(sample_image),
        content_type="image/jpeg",
        correlation_id=correlation_id,
    )

    # Demo 2: Image validation logging
    print("\n2. Demonstrating image validation logging:")
    processing_logger.log_image_validation(
        user_id="demo-user",
        validation_result="success",
        original_size=len(sample_image),
        processed_size=len(sample_image) // 2,
        compression_ratio=0.5,
    )

    # Demo 3: AI provider request logging
    print("\n3. Demonstrating AI provider request logging:")
    request_id = "demo-request-123"

    ai_logger.log_request(
        request_id=request_id,
        model="gemini-1.5-flash",
        prompt_length=500,
        image_size=len(sample_image),
    )

    # Simulate processing delay
    await asyncio.sleep(0.1)

    ai_logger.log_response(
        request_id=request_id,
        model="gemini-1.5-flash",
        processing_time=0.1,
        tokens_used=150,
        cost_estimate=0.001,
        response_length=200,
        tasks_parsed=2,
    )

    # Demo 4: Task creation logging
    print("\n4. Demonstrating task creation logging:")
    processing_logger.log_task_creation(
        user_id="demo-user",
        tasks_created=2,
        source_image_id="image-123",
        ai_confidence=0.85,
        provider="gemini",
    )

    # Demo 5: Pipeline completion logging
    print("\n5. Demonstrating pipeline completion logging:")
    processing_logger.log_processing_pipeline_complete(
        user_id="demo-user", total_processing_time=0.5, tasks_generated=2, success=True
    )

    # Demo 6: Error logging
    print("\n6. Demonstrating error logging:")
    ai_logger.log_error(
        request_id="error-request-456",
        model="gemini-1.5-flash",
        error_type="rate_limit",
        error_message="API rate limit exceeded",
        processing_time=0.05,
        retry_attempt=1,
    )

    # Demo 7: Usage metrics logging
    print("\n7. Demonstrating usage metrics logging:")
    ai_logger.log_usage_metrics(
        requests_made=10,
        successful_requests=8,
        failed_requests=2,
        total_tokens_used=1500,
        total_cost_estimate=0.015,
        average_response_time=0.25,
    )

    print("\n=== Demo Complete ===")
    print("\nAll log entries above are in structured JSON format and include:")
    print("- Timestamps in ISO format")
    print("- Log levels and logger names")
    print("- Correlation IDs for request tracking")
    print("- Event types for easy filtering")
    print("- Structured data fields for metrics and debugging")
    print("- Processing times and success/failure tracking")


async def demo_image_processing_with_logging():
    """Demonstrate image processing with integrated logging."""
    print("\n=== Image Processing Pipeline Demo ===\n")

    # Create a mock AI provider for demonstration
    class MockAIProvider:
        def get_provider_name(self):
            return "mock"

        async def analyze_image(self, image_data, prompt):
            await asyncio.sleep(0.1)  # Simulate processing
            return {
                "analysis_summary": "Mock analysis of the image",
                "tasks": [
                    {
                        "title": "Clean the area",
                        "description": "The area needs cleaning based on visual inspection",
                        "priority": "medium",
                        "category": "cleaning",
                        "reasoning": "Visible dirt and debris",
                    }
                ],
                "tokens_used": 100,
                "cost_estimate": 0.001,
                "processing_time": 0.1,
            }

    # Create processing service with mock provider
    service = ImageProcessingService(ai_provider=MockAIProvider())

    # Generate correlation ID
    correlation_id = generate_correlation_id()
    set_correlation_id(correlation_id)

    print(f"Processing with correlation ID: {correlation_id}\n")

    # Create sample image
    sample_image = create_sample_image()

    # Process the image (this will generate structured logs)
    try:
        result = await service.analyze_image_and_generate_tasks(
            image_data=sample_image, user_id="demo-user", generate_tasks=True
        )

        print("\nProcessing completed successfully!")
        print(f"Tasks generated: {len(result['tasks'])}")
        print(f"Processing time: {result['processing_time']:.3f}s")
        print(f"AI confidence: {result.get('ai_confidence', 'N/A')}")

    except Exception as e:
        print(f"\nProcessing failed: {e}")

    print("\n=== Pipeline Demo Complete ===")


if __name__ == "__main__":
    print("Starting structured logging demonstration...\n")

    # Run the demos
    asyncio.run(demo_structured_logging())
    asyncio.run(demo_image_processing_with_logging())

    print("\nDemo completed! Check the JSON log output above.")
    print("In production, these logs would be:")
    print("- Collected by log aggregation systems")
    print("- Indexed for fast searching and filtering")
    print("- Used for monitoring, alerting, and debugging")
    print("- Analyzed for performance metrics and usage patterns")
