"""AI provider interface and implementations."""

from abc import ABC, abstractmethod
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class AIProvider(ABC):
    """Abstract base class for AI providers."""
    
    @abstractmethod
    async def analyze_image(self, image_data: bytes, prompt: str) -> Dict[str, Any]:
        """
        Analyze image and return structured response.
        
        Args:
            image_data: Raw image bytes
            prompt: Analysis prompt
            
        Returns:
            Dictionary containing analysis results
        """
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Return provider identifier."""
        pass
    
    @abstractmethod
    def get_usage_metrics(self) -> Dict[str, Any]:
        """Return usage statistics."""
        pass


class GeminiProvider(AIProvider):
    """Google Gemini AI provider implementation."""
    
    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        """
        Initialize Gemini provider.
        
        Args:
            api_key: Google AI API key
            model: Model name to use
        """
        self.api_key = api_key
        self.model = model
        self._usage_metrics = {
            "requests_made": 0,
            "tokens_used": 0,
            "errors": 0
        }
        
        # Import here to avoid dependency issues if not installed
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self.client = genai.GenerativeModel(model)
        except ImportError as e:
            logger.error(f"Failed to import google.generativeai: {e}")
            raise
    
    async def analyze_image(self, image_data: bytes, prompt: str) -> Dict[str, Any]:
        """
        Analyze image using Gemini Vision API.
        
        Args:
            image_data: Raw image bytes
            prompt: Analysis prompt
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # This is a placeholder implementation
            # The actual implementation will be done in a later task
            self._usage_metrics["requests_made"] += 1
            
            # For now, return a mock response structure
            return {
                "analysis_summary": "Image analysis placeholder",
                "tasks": [],
                "provider": self.get_provider_name(),
                "model": self.model
            }
            
        except Exception as e:
            self._usage_metrics["errors"] += 1
            logger.error(f"Gemini API error: {e}")
            raise
    
    def get_provider_name(self) -> str:
        """Return provider identifier."""
        return "gemini"
    
    def get_usage_metrics(self) -> Dict[str, Any]:
        """Return usage statistics."""
        return self._usage_metrics.copy()


class AIProviderFactory:
    """Factory for creating AI provider instances."""
    
    @staticmethod
    def create_provider(provider_name: str, **kwargs) -> AIProvider:
        """
        Create AI provider instance.
        
        Args:
            provider_name: Name of the provider to create
            **kwargs: Provider-specific configuration
            
        Returns:
            AIProvider instance
            
        Raises:
            ValueError: If provider name is not supported
        """
        if provider_name == "gemini":
            return GeminiProvider(**kwargs)
        else:
            raise ValueError(f"Unsupported AI provider: {provider_name}")