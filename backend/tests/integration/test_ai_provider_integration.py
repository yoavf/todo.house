"""Integration tests for AI provider with configuration."""

import pytest
from app.ai.providers import AIProviderFactory, GeminiProvider
from app.config import config


@pytest.mark.integration
class TestAIProviderIntegration:
    """Integration tests for AI provider with real configuration."""

    def test_create_gemini_provider_with_config(self):
        """Test creating Gemini provider with actual configuration."""
        # This test verifies that the provider can be created with the actual config
        # but doesn't make real API calls

        if not config.ai.gemini_api_key:
            pytest.skip("GEMINI_API_KEY not configured")

        provider = AIProviderFactory.create_provider(
            config.ai.default_provider,
            api_key=config.ai.gemini_api_key,
            model=config.ai.gemini_model,
        )

        assert isinstance(provider, GeminiProvider)
        assert provider.get_provider_name() == "gemini"
        assert provider.model == config.ai.gemini_model

    def test_provider_factory_with_config_values(self):
        """Test provider factory with configuration values."""
        if not config.ai.gemini_api_key:
            pytest.skip("GEMINI_API_KEY not configured")

        # Test that we can create a provider using config values
        provider = AIProviderFactory.create_provider(
            "gemini", api_key=config.ai.gemini_api_key, model=config.ai.gemini_model
        )

        assert provider is not None
        assert provider.get_provider_name() == "gemini"

        # Test usage metrics are initialized
        metrics = provider.get_usage_metrics()
        assert "requests_made" in metrics
        assert "successful_requests" in metrics
        assert "failed_requests" in metrics
        assert metrics["requests_made"] == 0

    def test_supported_providers_includes_gemini(self):
        """Test that supported providers includes Gemini."""
        supported = AIProviderFactory.get_supported_providers()
        assert "gemini" in supported
        assert isinstance(supported, list)
        assert len(supported) >= 1
