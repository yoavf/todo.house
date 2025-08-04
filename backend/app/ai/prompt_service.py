"""Service for managing AI prompts."""

import os
import logging
from typing import Dict, Optional
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
            raise PromptNotFoundError(f"Prompts directory not found: {self.prompts_dir}")
    
    @lru_cache(maxsize=128)
    def get_prompt(self, prompt_name: str) -> str:
        """
        Load a prompt by name.
        
        Args:
            prompt_name: Name of the prompt (without .txt extension)
            
        Returns:
            The prompt content as a string
            
        Raises:
            PromptNotFoundError: If the prompt file doesn't exist
        """
        prompt_file = os.path.join(self.prompts_dir, f"{prompt_name}.txt")
        
        try:
            with open(prompt_file, "r", encoding="utf-8") as f:
                content = f.read().strip()
                logger.debug(f"Loaded prompt '{prompt_name}' from {prompt_file}")
                return content
        except FileNotFoundError:
            raise PromptNotFoundError(
                f"Prompt '{prompt_name}' not found at {prompt_file}"
            )
        except Exception as e:
            logger.error(f"Error reading prompt '{prompt_name}': {e}")
            raise
    
    def list_available_prompts(self) -> Dict[str, str]:
        """
        List all available prompts.
        
        Returns:
            Dictionary mapping prompt names to their file paths
        """
        prompts = {}
        
        try:
            for filename in os.listdir(self.prompts_dir):
                if filename.endswith(".txt"):
                    prompt_name = filename[:-4]  # Remove .txt extension
                    prompts[prompt_name] = os.path.join(self.prompts_dir, filename)
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