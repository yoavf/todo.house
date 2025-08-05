"""Service for managing AI prompts."""

import os
import logging
from typing import Dict, Optional, List
from functools import lru_cache

logger = logging.getLogger(__name__)


class PromptNotFoundError(Exception):
    """Raised when a prompt file cannot be found."""

    pass


class PromptService:
    """Service for loading and managing AI prompts from files."""

    def __init__(self, prompts_dir: Optional[str] = None):
        """
        Initialize the prompt service.

        Args:
            prompts_dir: Directory containing prompt files.
                        Defaults to 'prompts' subdirectory relative to this module.
        """
        if prompts_dir is None:
            prompts_dir = os.path.join(os.path.dirname(__file__), "prompts")

        self.prompts_dir = prompts_dir

        if not os.path.exists(self.prompts_dir):
            raise PromptNotFoundError(
                f"Prompts directory not found: {self.prompts_dir}"
            )

    @lru_cache(maxsize=128)
    def get_prompt(self, prompt_name: str, locale: str = "en") -> str:
        """
        Load a prompt by name with locale support.

        Args:
            prompt_name: Name of the prompt (without .txt extension)
            locale: Locale code (e.g., 'en', 'he'). Defaults to 'en'

        Returns:
            The prompt content as a string

        Raises:
            PromptNotFoundError: If the prompt file doesn't exist
        """
        # Try to find locale-specific prompt first, then fallback to default
        prompt_paths = self._get_prompt_paths(prompt_name, locale)
        
        for prompt_file in prompt_paths:
            try:
                with open(prompt_file, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    logger.debug(f"Loaded prompt '{prompt_name}' (locale: {locale}) from {prompt_file}")
                    return content
            except FileNotFoundError:
                continue
            except Exception as e:
                logger.error(f"Error reading prompt '{prompt_name}' from {prompt_file}: {e}")
                # Re-raise non-FileNotFoundError exceptions (like IOError, PermissionError, etc.)
                # but only if this is the last path to try, otherwise continue to fallback
                if prompt_file == prompt_paths[-1]:
                    raise
                continue
        
        # If we get here, no prompt file was found
        raise PromptNotFoundError(
            f"Prompt '{prompt_name}' not found for locale '{locale}' or default. "
            f"Searched paths: {prompt_paths}"
        )

    def _get_prompt_paths(self, prompt_name: str, locale: str) -> List[str]:
        """
        Get ordered list of prompt file paths to try for a given prompt and locale.
        
        Args:
            prompt_name: Name of the prompt (without .txt extension)
            locale: Locale code (e.g., 'en', 'he')
            
        Returns:
            List of file paths in order of preference
        """
        paths = []
        
        # 1. Try locale-specific prompt in locales subdirectory
        locale_specific_path = os.path.join(
            self.prompts_dir, "locales", locale, f"{prompt_name}.txt"
        )
        paths.append(locale_specific_path)
        
        # 2. Try default locale (en) in locales subdirectory if not already trying en
        if locale != "en":
            default_locale_path = os.path.join(
                self.prompts_dir, "locales", "en", f"{prompt_name}.txt"
            )
            paths.append(default_locale_path)
        
        # 3. Try fallback prompt in root prompts directory
        fallback_path = os.path.join(self.prompts_dir, f"{prompt_name}.txt")
        paths.append(fallback_path)
        
        return paths

    def list_available_prompts(self, locale: Optional[str] = None) -> Dict[str, str]:
        """
        List all available prompts, optionally filtered by locale.

        Args:
            locale: Optional locale code to filter prompts. If None, lists all prompts.

        Returns:
            Dictionary mapping prompt names to their file paths
        """
        prompts = {}

        try:
            # List prompts from root directory (fallback prompts)
            if os.path.exists(self.prompts_dir):
                for filename in os.listdir(self.prompts_dir):
                    if filename.endswith(".txt"):
                        prompt_name = filename[:-4]  # Remove .txt extension
                        prompts[prompt_name] = os.path.join(self.prompts_dir, filename)

            # List locale-specific prompts
            locales_dir = os.path.join(self.prompts_dir, "locales")
            if os.path.exists(locales_dir):
                if locale:
                    # List prompts for specific locale
                    locale_dir = os.path.join(locales_dir, locale)
                    if os.path.exists(locale_dir):
                        for filename in os.listdir(locale_dir):
                            if filename.endswith(".txt"):
                                prompt_name = filename[:-4]
                                prompts[f"{prompt_name}_{locale}"] = os.path.join(locale_dir, filename)
                else:
                    # List prompts for all locales
                    for locale_name in os.listdir(locales_dir):
                        locale_dir = os.path.join(locales_dir, locale_name)
                        if os.path.isdir(locale_dir):
                            for filename in os.listdir(locale_dir):
                                if filename.endswith(".txt"):
                                    prompt_name = filename[:-4]
                                    prompts[f"{prompt_name}_{locale_name}"] = os.path.join(locale_dir, filename)

        except Exception as e:
            logger.error(f"Error listing prompts: {e}")

        return prompts

    def clear_cache(self):
        """Clear the prompt cache."""
        self.get_prompt.cache_clear()
        logger.debug("Prompt cache cleared")


# Global instance for convenience
_default_service = None


def get_default_prompt_service() -> PromptService:
    """Get the default prompt service instance."""
    global _default_service
    if _default_service is None:
        _default_service = PromptService()
    return _default_service
