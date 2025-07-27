"""Unit tests for AI provider interface and implementations."""

import json
import pytest
from unittest.mock import Mock, patch
from typing import Dict, Any

from app.ai.providers import (
    AIProvider,
    GeminiProvider,
    AIProviderFactory,
    AIProviderError,
    AIProviderRateLimitError,
    AIProviderAPIError,
)


class MockAIProvider(AIProvider):
    """Mock AI provider for testing the interface."""

    def __init__(self):
        self.usage_metrics = {
            "requests_made": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_tokens_used": 0,
            "total_cost_estimate": 0.0,
            "average_response_time": 0.0,
            "last_request_time": None,
        }

    async def analyze_image(self, image_data: bytes, prompt: str) -> Dict[str, Any]:
        self.usage_metrics["requests_made"] += 1
        self.usage_metrics["successful_requests"] += 1
        return {
            "analysis_summary": "Mock analysis",
            "tasks": [],
            "provider": "mock",
            "model": "mock-model",
            "processing_time": 0.1,
        }

    def get_provider_name(self) -> str:
        return "mock"

    def get_usage_metrics(self) -> Dict[str, Any]:
        return self.usage_metrics.copy()

    def reset_usage_metrics(self) -> None:
        self.usage_metrics = {
            "requests_made": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_tokens_used": 0,
            "total_cost_estimate": 0.0,
            "average_response_time": 0.0,
            "last_request_time": None,
        }


class TestAIProviderInterface:
    """Test the AI provider abstract interface."""

    def test_cannot_instantiate_abstract_provider(self):
        """Test that AIProvider cannot be instantiated directly."""
        with pytest.raises(TypeError):
            AIProvider()

    def test_mock_provider_implements_interface(self):
        """Test that mock provider correctly implements the interface."""
        provider = MockAIProvider()
        assert isinstance(provider, AIProvider)
        assert provider.get_provider_name() == "mock"

    @pytest.mark.asyncio
    async def test_mock_provider_analyze_image(self):
        """Test mock provider image analysis."""
        provider = MockAIProvider()
        image_data = b"fake_image_data"
        prompt = "Analyze this image"

        result = await provider.analyze_image(image_data, prompt)

        assert isinstance(result, dict)
        assert "analysis_summary" in result
        assert "tasks" in result
        assert "provider" in result
        assert result["provider"] == "mock"

    def test_mock_provider_usage_metrics(self):
        """Test usage metrics tracking."""
        provider = MockAIProvider()

        # Initial metrics
        metrics = provider.get_usage_metrics()
        assert metrics["requests_made"] == 0
        assert metrics["successful_requests"] == 0

        # Reset metrics
        provider.reset_usage_metrics()
        metrics = provider.get_usage_metrics()
        assert metrics["requests_made"] == 0


class TestGeminiProvider:
    """Test the Gemini AI provider implementation."""

    def test_gemini_provider_initialization_success(self):
        """Test successful Gemini provider initialization."""
        with (
            patch("google.generativeai.configure") as mock_configure,
            patch("google.generativeai.GenerativeModel") as mock_model,
        ):
            provider = GeminiProvider(api_key="test_key", model="gemini-1.5-flash")

            assert provider.api_key == "test_key"
            assert provider.model == "gemini-1.5-flash"
            assert provider.get_provider_name() == "gemini"
            mock_configure.assert_called_once_with(api_key="test_key")
            mock_model.assert_called_once_with("gemini-1.5-flash")

    def test_gemini_provider_initialization_no_api_key(self):
        """Test Gemini provider initialization without API key."""
        with pytest.raises(ValueError, match="API key is required"):
            GeminiProvider(api_key="")

    def test_gemini_provider_initialization_import_error(self):
        """Test Gemini provider initialization with import error."""
        with patch(
            "google.generativeai.configure", side_effect=ImportError("Module not found")
        ):
            with pytest.raises(ImportError, match="google-generativeai is required"):
                GeminiProvider(api_key="test_key")

    @pytest.mark.asyncio
    async def test_gemini_provider_analyze_image_success(self):
        """Test successful image analysis with Gemini provider."""
        with (
            patch("google.generativeai.configure"),
            patch("google.generativeai.GenerativeModel"),
        ):
            provider = GeminiProvider(api_key="test_key")

            # Mock the API call
            mock_response = Mock()
            mock_response.text = json.dumps(
                {
                    "tasks": [
                        {
                            "title": "Test task",
                            "description": "Test description",
                            "priority": "high",
                            "category": "maintenance",
                            "reasoning": "Test reasoning",
                        }
                    ],
                    "analysis_summary": "Test analysis",
                }
            )

            with patch.object(provider, "_make_api_call", return_value=mock_response):
                result = await provider.analyze_image(b"fake_image", "test prompt")

                assert result["provider"] == "gemini"
                assert result["model"] == "gemini-1.5-flash"
                assert "processing_time" in result
                assert "analysis_summary" in result
                assert "tasks" in result
                assert len(result["tasks"]) == 1
                assert result["tasks"][0]["title"] == "Test task"

    @pytest.mark.asyncio
    async def test_gemini_provider_analyze_image_invalid_json(self):
        """Test image analysis with invalid JSON response."""
        with (
            patch("google.generativeai.configure"),
            patch("google.generativeai.GenerativeModel"),
        ):
            provider = GeminiProvider(api_key="test_key")

            # Mock response with invalid JSON
            mock_response = Mock()
            mock_response.text = "Invalid JSON response"

            with patch.object(provider, "_make_api_call", return_value=mock_response):
                result = await provider.analyze_image(b"fake_image", "test prompt")

                assert result["analysis_summary"] == "Invalid JSON response"
                assert result["tasks"] == []

    @pytest.mark.asyncio
    async def test_gemini_provider_analyze_image_rate_limit_error(self):
        """Test rate limit error handling."""
        with (
            patch("google.generativeai.configure"),
            patch("google.generativeai.GenerativeModel"),
        ):
            provider = GeminiProvider(api_key="test_key")

            with patch.object(
                provider, "_make_api_call", side_effect=Exception("Rate limit exceeded")
            ):
                with pytest.raises(AIProviderRateLimitError):
                    await provider.analyze_image(b"fake_image", "test prompt")

    @pytest.mark.asyncio
    async def test_gemini_provider_analyze_image_api_error(self):
        """Test API error handling."""
        with (
            patch("google.generativeai.configure"),
            patch("google.generativeai.GenerativeModel"),
        ):
            provider = GeminiProvider(api_key="test_key")

            with patch.object(
                provider, "_make_api_call", side_effect=Exception("API error occurred")
            ):
                with pytest.raises(AIProviderAPIError):
                    await provider.analyze_image(b"fake_image", "test prompt")

    @pytest.mark.asyncio
    async def test_gemini_provider_analyze_image_generic_error(self):
        """Test generic error handling."""
        with (
            patch("google.generativeai.configure"),
            patch("google.generativeai.GenerativeModel"),
        ):
            provider = GeminiProvider(api_key="test_key")

            with patch.object(
                provider, "_make_api_call", side_effect=Exception("Unexpected error")
            ):
                with pytest.raises(AIProviderError):
                    await provider.analyze_image(b"fake_image", "test prompt")

    def test_gemini_provider_usage_metrics_tracking(self):
        """Test usage metrics tracking."""
        with (
            patch("google.generativeai.configure"),
            patch("google.generativeai.GenerativeModel"),
        ):
            provider = GeminiProvider(api_key="test_key")

            # Initial metrics
            metrics = provider.get_usage_metrics()
            assert metrics["requests_made"] == 0
            assert metrics["successful_requests"] == 0
            assert metrics["failed_requests"] == 0
            assert metrics["total_tokens_used"] == 0
            assert metrics["total_cost_estimate"] == 0.0
            assert metrics["average_response_time"] == 0.0
            assert metrics["last_request_time"] is None

    def test_gemini_provider_reset_usage_metrics(self):
        """Test resetting usage metrics."""
        with (
            patch("google.generativeai.configure"),
            patch("google.generativeai.GenerativeModel"),
        ):
            provider = GeminiProvider(api_key="test_key")

            # Modify metrics
            provider._usage_metrics["requests_made"] = 5
            provider._usage_metrics["successful_requests"] = 3

            # Reset
            provider.reset_usage_metrics()

            metrics = provider.get_usage_metrics()
            assert metrics["requests_made"] == 0
            assert metrics["successful_requests"] == 0

    def test_gemini_provider_parse_response_valid_tasks(self):
        """Test parsing response with valid task structure."""
        with (
            patch("google.generativeai.configure"),
            patch("google.generativeai.GenerativeModel"),
        ):
            provider = GeminiProvider(api_key="test_key")

            mock_response = Mock()
            mock_response.text = json.dumps(
                {
                    "tasks": [
                        {
                            "title": "Clean gutters",
                            "description": "Remove debris from gutters",
                            "priority": "high",
                            "category": "maintenance",
                            "reasoning": "Prevent water damage",
                        }
                    ],
                    "analysis_summary": "Found maintenance issues",
                }
            )

            result = provider._parse_response(mock_response)

            assert result["analysis_summary"] == "Found maintenance issues"
            assert len(result["tasks"]) == 1
            assert result["tasks"][0]["title"] == "Clean gutters"
            assert "tokens_used" in result
            assert "cost_estimate" in result

    def test_gemini_provider_parse_response_invalid_tasks(self):
        """Test parsing response with invalid task structure."""
        with (
            patch("google.generativeai.configure"),
            patch("google.generativeai.GenerativeModel"),
        ):
            provider = GeminiProvider(api_key="test_key")

            mock_response = Mock()
            mock_response.text = json.dumps(
                {
                    "tasks": [
                        {"title": "Valid task"},  # Valid
                        {"no_title": "Invalid"},  # Invalid - no title
                        "not_a_dict",  # Invalid - not a dict
                    ],
                    "analysis_summary": "Mixed task quality",
                }
            )

            result = provider._parse_response(mock_response)

            assert len(result["tasks"]) == 1  # Only valid task should remain
            assert result["tasks"][0]["title"] == "Valid task"


class TestAIProviderFactory:
    """Test the AI provider factory."""

    def test_create_gemini_provider_success(self):
        """Test successful creation of Gemini provider."""
        with (
            patch("google.generativeai.configure"),
            patch("google.generativeai.GenerativeModel"),
        ):
            provider = AIProviderFactory.create_provider(
                "gemini", api_key="test_key", model="gemini-1.5-flash"
            )

            assert isinstance(provider, GeminiProvider)
            assert provider.get_provider_name() == "gemini"

    def test_create_provider_case_insensitive(self):
        """Test provider creation is case insensitive."""
        with (
            patch("google.generativeai.configure"),
            patch("google.generativeai.GenerativeModel"),
        ):
            provider = AIProviderFactory.create_provider("GEMINI", api_key="test_key")

            assert isinstance(provider, GeminiProvider)

    def test_create_unsupported_provider(self):
        """Test creation of unsupported provider."""
        with pytest.raises(ValueError, match="Unsupported AI provider: unknown"):
            AIProviderFactory.create_provider("unknown")

    def test_create_provider_with_invalid_args(self):
        """Test provider creation with invalid arguments."""
        with pytest.raises(ValueError, match="Failed to create gemini provider"):
            AIProviderFactory.create_provider("gemini")  # Missing api_key

    def test_get_supported_providers(self):
        """Test getting list of supported providers."""
        providers = AIProviderFactory.get_supported_providers()
        assert "gemini" in providers
        assert isinstance(providers, list)

    def test_register_provider(self):
        """Test registering a new provider."""
        # Register mock provider
        AIProviderFactory.register_provider("mock", MockAIProvider)

        # Verify it's in supported providers
        providers = AIProviderFactory.get_supported_providers()
        assert "mock" in providers

        # Test creation
        provider = AIProviderFactory.create_provider("mock")
        assert isinstance(provider, MockAIProvider)

    def test_register_invalid_provider(self):
        """Test registering invalid provider class."""

        class InvalidProvider:
            pass

        with pytest.raises(
            ValueError, match="Provider class must implement AIProvider interface"
        ):
            AIProviderFactory.register_provider("invalid", InvalidProvider)


@pytest.mark.integration
class TestGeminiProviderIntegration:
    """Integration tests for Gemini provider (requires real API key)."""

    @pytest.mark.skip(reason="Requires real API key and costs money")
    async def test_real_gemini_api_call(self):
        """Test real Gemini API call (skipped by default)."""
        # This test would require a real API key and would make actual API calls
        # It's skipped by default to avoid costs and API key requirements
        import os

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            pytest.skip("GEMINI_API_KEY not set")

        provider = GeminiProvider(api_key=api_key)

        # Use a small test image
        test_image = b"fake_image_data"  # In real test, use actual image bytes
        prompt = "What maintenance tasks do you see in this image?"

        result = await provider.analyze_image(test_image, prompt)

        assert "analysis_summary" in result
        assert "tasks" in result
        assert result["provider"] == "gemini"
