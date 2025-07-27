#!/usr/bin/env python3
"""
Demonstration script for AI provider interface.

This script shows how to use the AI provider interface and factory.
Run with: python examples/ai_provider_demo.py
"""

import asyncio
import sys
import os

# Add the app directory to the path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.ai.providers import AIProviderFactory, AIProviderError
from app.config import config


async def demo_ai_provider():
    """Demonstrate AI provider usage."""
    print("AI Provider Interface Demonstration")
    print("=" * 40)

    # Show supported providers
    supported = AIProviderFactory.get_supported_providers()
    print(f"Supported providers: {', '.join(supported)}")
    print()

    # Check if we have an API key configured
    if not config.ai.gemini_api_key:
        print("⚠️  GEMINI_API_KEY not configured in environment")
        print("   This demo will use mock responses only")
        print()

    try:
        # Create a Gemini provider
        print("Creating Gemini provider...")
        provider = AIProviderFactory.create_provider(
            "gemini",
            api_key=config.ai.gemini_api_key or "demo_key",
            model=config.ai.gemini_model,
        )

        print(f"✅ Created provider: {provider.get_provider_name()}")
        print(f"   Model: {provider.model}")
        print()

        # Show initial usage metrics
        print("Initial usage metrics:")
        metrics = provider.get_usage_metrics()
        for key, value in metrics.items():
            print(f"   {key}: {value}")
        print()

        # Simulate image analysis
        print("Simulating image analysis...")
        fake_image_data = b"fake_image_data_for_demo"
        prompt = "Analyze this image for home maintenance tasks"

        try:
            result = await provider.analyze_image(fake_image_data, prompt)

            print("✅ Analysis completed successfully!")
            print(f"   Provider: {result['provider']}")
            print(f"   Model: {result['model']}")
            print(f"   Processing time: {result['processing_time']:.3f}s")
            print(f"   Analysis summary: {result['analysis_summary']}")
            print(f"   Tasks found: {len(result['tasks'])}")

            if result["tasks"]:
                print("   Sample task:")
                task = result["tasks"][0]
                print(f"     Title: {task['title']}")
                print(f"     Priority: {task['priority']}")
                print(f"     Category: {task['category']}")

        except AIProviderError as e:
            print(f"❌ Analysis failed: {e}")

        print()

        # Show updated usage metrics
        print("Updated usage metrics:")
        metrics = provider.get_usage_metrics()
        for key, value in metrics.items():
            print(f"   {key}: {value}")
        print()

        # Demonstrate metrics reset
        print("Resetting usage metrics...")
        provider.reset_usage_metrics()
        metrics = provider.get_usage_metrics()
        print(f"   Requests after reset: {metrics['requests_made']}")

    except Exception as e:
        print(f"❌ Error: {e}")

    print("\nDemo completed!")


if __name__ == "__main__":
    asyncio.run(demo_ai_provider())
