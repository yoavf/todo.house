"""AI provider interface and implementations."""

import json
import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Union
import logging

logger = logging.getLogger(__name__)


class AIProviderError(Exception):
    """Base exception for AI provider errors."""

    pass


class AIProviderRateLimitError(AIProviderError):
    """Exception raised when rate limit is exceeded."""

    def __init__(self, message: str, retry_after: Optional[int] = None):
        super().__init__(message)
        self.retry_after = retry_after


class AIProviderAPIError(AIProviderError):
    """Exception raised when AI provider API returns an error."""

    pass


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
            Dictionary containing analysis results with structure:
            {
                "analysis_summary": str,
                "tasks": List[Dict],
                "provider": str,
                "model": str,
                "processing_time": float,
                "tokens_used": Optional[int],
                "cost_estimate": Optional[float]
            }

        Raises:
            AIProviderError: If analysis fails
            AIProviderRateLimitError: If rate limit is exceeded
            AIProviderAPIError: If API returns an error
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return provider identifier."""
        pass

    @abstractmethod
    def get_usage_metrics(self) -> Dict[str, Any]:
        """
        Return usage statistics.

        Returns:
            Dictionary containing usage metrics:
            {
                "requests_made": int,
                "successful_requests": int,
                "failed_requests": int,
                "total_tokens_used": int,
                "total_cost_estimate": float,
                "average_response_time": float,
                "last_request_time": Optional[float]
            }
        """
        pass

    @abstractmethod
    def reset_usage_metrics(self) -> None:
        """Reset usage statistics."""
        pass


class GeminiProvider(AIProvider):
    """Google Gemini AI provider implementation."""

    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        """
        Initialize Gemini provider.

        Args:
            api_key: Google AI API key
            model: Model name to use

        Raises:
            ImportError: If google-generativeai is not installed
            ValueError: If API key is invalid
        """
        if not api_key:
            raise ValueError("API key is required for Gemini provider")

        self.api_key = api_key
        self.model = model
        self._usage_metrics: Dict[
            str, Union[int, float, List[float], Optional[float]]
        ] = {
            "requests_made": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_tokens_used": 0,
            "total_cost_estimate": 0.0,
            "response_times": [],
            "last_request_time": None,
        }

        # Import here to avoid dependency issues if not installed
        try:
            import google.generativeai as genai

            self.genai = genai
            genai.configure(api_key=api_key)
            self.client = genai.GenerativeModel(model)
        except ImportError as e:
            logger.error(f"Failed to import google.generativeai: {e}")
            raise ImportError(
                "google-generativeai is required for Gemini provider. "
                "Install it with: pip install google-generativeai"
            )

    async def analyze_image(self, image_data: bytes, prompt: str) -> Dict[str, Any]:
        """
        Analyze image using Gemini Vision API.

        Args:
            image_data: Raw image bytes
            prompt: Analysis prompt

        Returns:
            Dictionary containing analysis results

        Raises:
            AIProviderError: If analysis fails
            AIProviderRateLimitError: If rate limit is exceeded
            AIProviderAPIError: If API returns an error
        """
        start_time = time.time()
        requests_made = self._usage_metrics["requests_made"]
        if isinstance(requests_made, int):
            self._usage_metrics["requests_made"] = requests_made + 1
        self._usage_metrics["last_request_time"] = start_time

        try:
            # Create image part for Gemini
            image_part = {
                "mime_type": "image/jpeg",  # Assuming preprocessed images are JPEG
                "data": image_data,
            }

            # Generate content with image and prompt
            response = await self._make_api_call(prompt, image_part)

            # Parse response
            result = self._parse_response(response)

            # Calculate processing time
            processing_time = time.time() - start_time
            response_times = self._usage_metrics["response_times"]
            if isinstance(response_times, list):
                response_times.append(processing_time)

            # Update success metrics
            successful_requests = self._usage_metrics["successful_requests"]
            if isinstance(successful_requests, int):
                self._usage_metrics["successful_requests"] = successful_requests + 1

            if "tokens_used" in result:
                total_tokens = self._usage_metrics["total_tokens_used"]
                if isinstance(total_tokens, int):
                    self._usage_metrics["total_tokens_used"] = (
                        total_tokens + result.get("tokens_used", 0)
                    )

            if "cost_estimate" in result:
                total_cost = self._usage_metrics["total_cost_estimate"]
                if isinstance(total_cost, (int, float)):
                    self._usage_metrics["total_cost_estimate"] = float(
                        total_cost
                    ) + result.get("cost_estimate", 0.0)

            # Add metadata to result
            result.update(
                {
                    "provider": self.get_provider_name(),
                    "model": self.model,
                    "processing_time": processing_time,
                }
            )

            return result

        except Exception as e:
            failed_requests = self._usage_metrics["failed_requests"]
            if isinstance(failed_requests, int):
                self._usage_metrics["failed_requests"] = failed_requests + 1

            processing_time = time.time() - start_time
            response_times = self._usage_metrics["response_times"]
            if isinstance(response_times, list):
                response_times.append(processing_time)

            # Handle specific error types
            if "quota" in str(e).lower() or "rate limit" in str(e).lower():
                logger.warning(f"Gemini rate limit exceeded: {e}")
                raise AIProviderRateLimitError(f"Rate limit exceeded: {e}")
            elif "api" in str(e).lower() or "invalid" in str(e).lower():
                logger.error(f"Gemini API error: {e}")
                raise AIProviderAPIError(f"API error: {e}")
            else:
                logger.error(f"Unexpected Gemini error: {e}")
                raise AIProviderError(f"Unexpected error: {e}")

    async def _make_api_call(self, prompt: str, image_part: Dict[str, Any]) -> Any:
        """
        Make API call to Gemini.

        Args:
            prompt: Text prompt
            image_part: Image data part

        Returns:
            API response
        """
        try:
            # For now, this is a placeholder that returns a mock response
            # The actual Gemini API integration will be implemented in a later task
            # when we focus on the complete image processing pipeline

            # Simulate API call delay
            import asyncio

            await asyncio.sleep(0.1)

            # Return mock response structure that matches expected format
            mock_response = type(
                "MockResponse",
                (),
                {
                    "text": json.dumps(
                        {
                            "tasks": [
                                {
                                    "title": "Example maintenance task",
                                    "description": "This is a placeholder task generated from image analysis",
                                    "priority": "medium",
                                    "category": "maintenance",
                                    "reasoning": "Placeholder reasoning for task generation",
                                }
                            ],
                            "analysis_summary": "Mock analysis of uploaded image",
                        }
                    )
                },
            )()

            return mock_response

        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            raise

    def _parse_response(self, response: Any) -> Dict[str, Any]:
        """
        Parse Gemini API response.

        Args:
            response: Raw API response

        Returns:
            Parsed response dictionary

        Raises:
            AIProviderError: If response parsing fails
        """
        try:
            # Extract text from response
            response_text = response.text

            # Try to parse as JSON
            try:
                parsed_data = json.loads(response_text)
            except json.JSONDecodeError:
                # If not valid JSON, wrap in analysis_summary
                parsed_data = {"analysis_summary": response_text, "tasks": []}

            # Ensure required fields exist
            if "analysis_summary" not in parsed_data:
                parsed_data["analysis_summary"] = "No analysis summary provided"

            if "tasks" not in parsed_data:
                parsed_data["tasks"] = []

            # Validate task structure
            validated_tasks = []
            for task in parsed_data.get("tasks", []):
                if isinstance(task, dict) and "title" in task:
                    validated_task = {
                        "title": task.get("title", "Untitled task"),
                        "description": task.get(
                            "description", "No description provided"
                        ),
                        "priority": task.get("priority", "medium"),
                        "category": task.get("category", "general"),
                        "reasoning": task.get("reasoning", "No reasoning provided"),
                    }
                    validated_tasks.append(validated_task)

            parsed_data["tasks"] = validated_tasks

            # Add token usage estimate
            # NOTE: The following token estimation logic is a placeholder and is overly simplistic.
            # It assumes an average of 4 characters per token, which may not accurately reflect
            # the actual tokenization rules of the language model being used. This should be
            # replaced with a proper token counting implementation using the tokenizer
            # associated with the specific model (e.g., OpenAI's tiktoken library).
            parsed_data["tokens_used"] = len(response_text) // 4  # Rough estimate
            parsed_data["cost_estimate"] = (
                parsed_data["tokens_used"] * 0.00001
            )  # Rough cost estimate

            return parsed_data

        except Exception as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            raise AIProviderError(f"Response parsing failed: {e}")

    def get_provider_name(self) -> str:
        """Return provider identifier."""
        return "gemini"

    def get_usage_metrics(self) -> Dict[str, Any]:
        """Return usage statistics."""
        metrics = self._usage_metrics.copy()

        # Calculate average response time
        response_times = metrics["response_times"]
        if isinstance(response_times, list) and response_times:
            metrics["average_response_time"] = sum(response_times) / len(response_times)
        else:
            metrics["average_response_time"] = 0.0

        # Remove raw response times from output
        del metrics["response_times"]

        return metrics

    def reset_usage_metrics(self) -> None:
        """Reset usage statistics."""
        self._usage_metrics = {
            "requests_made": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_tokens_used": 0,
            "total_cost_estimate": 0.0,
            "response_times": [],
            "last_request_time": None,
        }


class AIProviderFactory:
    """Factory for creating AI provider instances."""

    _supported_providers = {"gemini": GeminiProvider}

    @classmethod
    def create_provider(cls, provider_name: str, **kwargs) -> AIProvider:
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
        provider_name = provider_name.lower()

        if provider_name not in cls._supported_providers:
            supported = ", ".join(cls._supported_providers.keys())
            raise ValueError(
                f"Unsupported AI provider: {provider_name}. "
                f"Supported providers: {supported}"
            )

        provider_class = cls._supported_providers[provider_name]

        try:
            return provider_class(**kwargs)
        except Exception as e:
            logger.error(f"Failed to create {provider_name} provider: {e}")
            raise ValueError(f"Failed to create {provider_name} provider: {e}")

    @classmethod
    def get_supported_providers(cls) -> list[str]:
        """
        Get list of supported provider names.

        Returns:
            List of supported provider names
        """
        return list(cls._supported_providers.keys())

    @classmethod
    def register_provider(cls, name: str, provider_class: type[AIProvider]) -> None:
        """
        Register a new AI provider.

        Args:
            name: Provider name
            provider_class: Provider class that implements AIProvider

        Raises:
            ValueError: If provider class doesn't implement AIProvider
        """
        if not issubclass(provider_class, AIProvider):
            raise ValueError("Provider class must implement AIProvider interface")

        cls._supported_providers[name.lower()] = provider_class  # type: ignore
        logger.info(f"Registered AI provider: {name}")
