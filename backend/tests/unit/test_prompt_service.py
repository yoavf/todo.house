"""Unit tests for the PromptService."""

import os
import tempfile
import shutil
import pytest
from unittest.mock import patch, mock_open

from app.ai.prompt_service import PromptService, PromptNotFoundError, get_default_prompt_service


class TestPromptService:
    """Test cases for PromptService."""
    
    @pytest.fixture
    def temp_prompts_dir(self):
        """Create a temporary directory with test prompts."""
        temp_dir = tempfile.mkdtemp()
        
        # Create test prompt files
        test_prompts = {
            "test_prompt": "This is a test prompt",
            "another_prompt": "This is another test prompt\nWith multiple lines",
            "empty_prompt": "",
        }
        
        for name, content in test_prompts.items():
            with open(os.path.join(temp_dir, f"{name}.txt"), "w") as f:
                f.write(content)
        
        yield temp_dir
        
        # Cleanup
        shutil.rmtree(temp_dir)
    
    def test_init_with_custom_directory(self, temp_prompts_dir):
        """Test initialization with a custom prompts directory."""
        service = PromptService(prompts_dir=temp_prompts_dir)
        assert service.prompts_dir == temp_prompts_dir
    
    def test_init_with_default_directory(self):
        """Test initialization with default prompts directory."""
        with patch("os.path.exists", return_value=True):
            service = PromptService()
            assert "prompts" in service.prompts_dir
    
    def test_init_with_missing_directory(self):
        """Test initialization fails with missing directory."""
        with pytest.raises(PromptNotFoundError) as exc_info:
            PromptService(prompts_dir="/nonexistent/directory")
        assert "Prompts directory not found" in str(exc_info.value)
    
    def test_get_prompt_success(self, temp_prompts_dir):
        """Test successfully getting a prompt."""
        service = PromptService(prompts_dir=temp_prompts_dir)
        
        prompt = service.get_prompt("test_prompt")
        assert prompt == "This is a test prompt"
        
        # Test multiline prompt
        prompt2 = service.get_prompt("another_prompt")
        assert prompt2 == "This is another test prompt\nWith multiple lines"
    
    def test_get_prompt_not_found(self, temp_prompts_dir):
        """Test getting a non-existent prompt."""
        service = PromptService(prompts_dir=temp_prompts_dir)
        
        with pytest.raises(PromptNotFoundError) as exc_info:
            service.get_prompt("nonexistent_prompt")
        assert "Prompt 'nonexistent_prompt' not found" in str(exc_info.value)
    
    def test_get_prompt_caching(self, temp_prompts_dir):
        """Test that prompts are cached."""
        service = PromptService(prompts_dir=temp_prompts_dir)
        
        # First call
        prompt1 = service.get_prompt("test_prompt")
        
        # Modify the file
        with open(os.path.join(temp_prompts_dir, "test_prompt.txt"), "w") as f:
            f.write("Modified content")
        
        # Second call should return cached content
        prompt2 = service.get_prompt("test_prompt")
        assert prompt1 == prompt2 == "This is a test prompt"
        
        # Clear cache and get again
        service.clear_cache()
        prompt3 = service.get_prompt("test_prompt")
        assert prompt3 == "Modified content"
    
    def test_get_prompt_empty_file(self, temp_prompts_dir):
        """Test getting a prompt from an empty file."""
        service = PromptService(prompts_dir=temp_prompts_dir)
        
        prompt = service.get_prompt("empty_prompt")
        assert prompt == ""
    
    def test_get_prompt_read_error(self, temp_prompts_dir):
        """Test handling read errors."""
        service = PromptService(prompts_dir=temp_prompts_dir)
        
        with patch("builtins.open", mock_open()) as mock_file:
            mock_file.side_effect = IOError("Read error")
            
            with pytest.raises(IOError):
                service.get_prompt("test_prompt")
    
    def test_list_available_prompts(self, temp_prompts_dir):
        """Test listing all available prompts."""
        service = PromptService(prompts_dir=temp_prompts_dir)
        
        prompts = service.list_available_prompts()
        
        assert len(prompts) == 3
        assert "test_prompt" in prompts
        assert "another_prompt" in prompts
        assert "empty_prompt" in prompts
        
        # Check file paths
        assert prompts["test_prompt"] == os.path.join(temp_prompts_dir, "test_prompt.txt")
    
    def test_list_available_prompts_empty_directory(self):
        """Test listing prompts from empty directory."""
        with tempfile.TemporaryDirectory() as temp_dir:
            service = PromptService(prompts_dir=temp_dir)
            prompts = service.list_available_prompts()
            assert prompts == {}
    
    def test_list_available_prompts_with_non_txt_files(self, temp_prompts_dir):
        """Test that non-.txt files are ignored."""
        # Add non-txt file
        with open(os.path.join(temp_prompts_dir, "not_a_prompt.md"), "w") as f:
            f.write("This is not a prompt")
        
        service = PromptService(prompts_dir=temp_prompts_dir)
        prompts = service.list_available_prompts()
        
        assert "not_a_prompt" not in prompts
        assert len(prompts) == 3  # Only .txt files
    
    def test_list_available_prompts_error_handling(self):
        """Test error handling in list_available_prompts."""
        service = PromptService(prompts_dir="/tmp")
        
        with patch("os.listdir", side_effect=OSError("Permission denied")):
            prompts = service.list_available_prompts()
            assert prompts == {}
    
    def test_clear_cache(self, temp_prompts_dir):
        """Test clearing the prompt cache."""
        service = PromptService(prompts_dir=temp_prompts_dir)
        
        # Load a prompt to populate cache
        service.get_prompt("test_prompt")
        assert service.get_prompt.cache_info().currsize > 0
        
        # Clear cache
        service.clear_cache()
        assert service.get_prompt.cache_info().currsize == 0
    
    def test_get_default_prompt_service(self):
        """Test getting the default prompt service instance."""
        with patch("os.path.exists", return_value=True):
            service1 = get_default_prompt_service()
            service2 = get_default_prompt_service()
            
            # Should return the same instance
            assert service1 is service2
    
    def test_unicode_handling(self, temp_prompts_dir):
        """Test handling of unicode content in prompts."""
        unicode_content = "This prompt contains unicode: 🏠 ñ é ü 中文"
        
        with open(os.path.join(temp_prompts_dir, "unicode_prompt.txt"), "w", encoding="utf-8") as f:
            f.write(unicode_content)
        
        service = PromptService(prompts_dir=temp_prompts_dir)
        prompt = service.get_prompt("unicode_prompt")
        assert prompt == unicode_content