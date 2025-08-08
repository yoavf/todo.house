"""Unit tests for PromptService locale support."""

import os
import tempfile
import pytest

from app.ai.prompt_service import PromptService, PromptNotFoundError


class TestPromptServiceLocale:
    """Test locale-aware functionality of PromptService."""

    @pytest.fixture
    def temp_prompts_dir(self):
        """Create a temporary directory with test prompts."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create directory structure
            os.makedirs(os.path.join(temp_dir, "locales", "en"))
            os.makedirs(os.path.join(temp_dir, "locales", "he"))

            # Create fallback prompt
            with open(
                os.path.join(temp_dir, "test_prompt.txt"), "w", encoding="utf-8"
            ) as f:
                f.write("Fallback prompt content")

            # Create English prompt
            with open(
                os.path.join(temp_dir, "locales", "en", "test_prompt.txt"),
                "w",
                encoding="utf-8",
            ) as f:
                f.write("English prompt content")

            # Create Hebrew prompt
            with open(
                os.path.join(temp_dir, "locales", "he", "test_prompt.txt"),
                "w",
                encoding="utf-8",
            ) as f:
                f.write("Hebrew prompt content - תוכן בעברית")

            # Create prompt that only exists in English
            with open(
                os.path.join(temp_dir, "locales", "en", "english_only.txt"),
                "w",
                encoding="utf-8",
            ) as f:
                f.write("English only prompt")

            # Create prompt that only exists as fallback
            with open(
                os.path.join(temp_dir, "fallback_only.txt"), "w", encoding="utf-8"
            ) as f:
                f.write("Fallback only prompt")

            yield temp_dir

    @pytest.mark.unit
    def test_get_prompt_with_locale_specific(self, temp_prompts_dir):
        """Test loading locale-specific prompt."""
        service = PromptService(prompts_dir=temp_prompts_dir)

        # Test Hebrew prompt
        prompt = service.get_prompt("test_prompt", locale="he")
        assert prompt == "Hebrew prompt content - תוכן בעברית"

        # Test English prompt
        prompt = service.get_prompt("test_prompt", locale="en")
        assert prompt == "English prompt content"

    @pytest.mark.unit
    def test_get_prompt_fallback_to_english(self, temp_prompts_dir):
        """Test fallback to English when locale-specific prompt doesn't exist."""
        service = PromptService(prompts_dir=temp_prompts_dir)

        # Request Hebrew for English-only prompt - should fallback to English
        prompt = service.get_prompt("english_only", locale="he")
        assert prompt == "English only prompt"

    @pytest.mark.unit
    def test_get_prompt_fallback_to_root(self, temp_prompts_dir):
        """Test fallback to root directory when no locale-specific prompt exists."""
        service = PromptService(prompts_dir=temp_prompts_dir)

        # Request Hebrew for fallback-only prompt - should fallback to root
        prompt = service.get_prompt("fallback_only", locale="he")
        assert prompt == "Fallback only prompt"

    @pytest.mark.unit
    def test_get_prompt_default_locale(self, temp_prompts_dir):
        """Test default locale behavior."""
        service = PromptService(prompts_dir=temp_prompts_dir)

        # No locale specified should default to English
        prompt = service.get_prompt("test_prompt")
        assert prompt == "English prompt content"

    @pytest.mark.unit
    def test_get_prompt_nonexistent_locale(self, temp_prompts_dir):
        """Test behavior with unsupported locale."""
        service = PromptService(prompts_dir=temp_prompts_dir)

        # Unsupported locale should fallback through the chain
        prompt = service.get_prompt("test_prompt", locale="fr")
        assert prompt == "English prompt content"

    @pytest.mark.unit
    def test_get_prompt_not_found_any_locale(self, temp_prompts_dir):
        """Test error when prompt doesn't exist in any locale."""
        service = PromptService(prompts_dir=temp_prompts_dir)

        with pytest.raises(PromptNotFoundError) as exc_info:
            service.get_prompt("nonexistent", locale="he")

        error_msg = str(exc_info.value)
        assert "Prompt 'nonexistent' not found for locale 'he'" in error_msg
        assert "Searched paths:" in error_msg

    @pytest.mark.unit
    def test_get_prompt_paths_order(self, temp_prompts_dir):
        """Test the order of paths tried for prompt resolution."""
        service = PromptService(prompts_dir=temp_prompts_dir)

        # Test Hebrew locale paths
        paths = service._get_prompt_paths("test_prompt", "he")
        expected_paths = [
            os.path.join(temp_prompts_dir, "locales", "he", "test_prompt.txt"),
            os.path.join(temp_prompts_dir, "locales", "en", "test_prompt.txt"),
            os.path.join(temp_prompts_dir, "test_prompt.txt"),
        ]
        assert paths == expected_paths

        # Test English locale paths (should skip duplicate English path)
        paths = service._get_prompt_paths("test_prompt", "en")
        expected_paths = [
            os.path.join(temp_prompts_dir, "locales", "en", "test_prompt.txt"),
            os.path.join(temp_prompts_dir, "test_prompt.txt"),
        ]
        assert paths == expected_paths

    @pytest.mark.unit
    def test_cache_with_locale(self, temp_prompts_dir):
        """Test that caching works correctly with locale parameter."""
        service = PromptService(prompts_dir=temp_prompts_dir)

        # Load Hebrew prompt
        prompt1 = service.get_prompt("test_prompt", locale="he")
        assert prompt1 == "Hebrew prompt content - תוכן בעברית"

        # Load English prompt (should be cached separately)
        prompt2 = service.get_prompt("test_prompt", locale="en")
        assert prompt2 == "English prompt content"

        # Load Hebrew again (should come from cache)
        prompt3 = service.get_prompt("test_prompt", locale="he")
        assert prompt3 == "Hebrew prompt content - תוכן בעברית"

        # Verify cache has entries
        cache_info = service.get_prompt.cache_info()
        assert cache_info.currsize >= 2

    @pytest.mark.unit
    def test_list_available_prompts_with_locale(self, temp_prompts_dir):
        """Test listing prompts filtered by locale."""
        service = PromptService(prompts_dir=temp_prompts_dir)

        # List all prompts
        all_prompts = service.list_available_prompts()
        assert "test_prompt" in all_prompts  # fallback
        assert "fallback_only" in all_prompts  # fallback only
        assert "test_prompt_en" in all_prompts  # English locale
        assert "test_prompt_he" in all_prompts  # Hebrew locale
        assert "english_only_en" in all_prompts  # English only

        # List Hebrew prompts only
        he_prompts = service.list_available_prompts(locale="he")
        assert "test_prompt_he" in he_prompts
        assert "english_only_he" not in he_prompts  # Doesn't exist in Hebrew

        # List English prompts only
        en_prompts = service.list_available_prompts(locale="en")
        assert "test_prompt_en" in en_prompts
        assert "english_only_en" in en_prompts

    @pytest.mark.unit
    def test_unicode_handling_in_hebrew_prompts(self, temp_prompts_dir):
        """Test proper Unicode handling for Hebrew prompts."""
        service = PromptService(prompts_dir=temp_prompts_dir)

        # Hebrew prompt should contain Hebrew characters
        prompt = service.get_prompt("test_prompt", locale="he")
        assert "תוכן בעברית" in prompt
        assert isinstance(prompt, str)

    @pytest.mark.unit
    def test_clear_cache_with_locale(self, temp_prompts_dir):
        """Test cache clearing works with locale-aware prompts."""
        service = PromptService(prompts_dir=temp_prompts_dir)

        # Load prompts to populate cache
        service.get_prompt("test_prompt", locale="he")
        service.get_prompt("test_prompt", locale="en")

        # Verify cache has entries
        assert service.get_prompt.cache_info().currsize > 0

        # Clear cache
        service.clear_cache()

        # Verify cache is empty
        assert service.get_prompt.cache_info().currsize == 0

    @pytest.mark.unit
    def test_error_handling_with_file_permissions(self, temp_prompts_dir):
        """Test error handling when file permissions prevent reading."""
        service = PromptService(prompts_dir=temp_prompts_dir)

        # Create a file with restricted permissions
        restricted_file = os.path.join(
            temp_prompts_dir, "locales", "he", "restricted.txt"
        )
        with open(restricted_file, "w", encoding="utf-8") as f:
            f.write("Restricted content")

        # Make file unreadable (skip on Windows where this doesn't work the same way)
        if os.name != "nt":
            os.chmod(restricted_file, 0o000)

            try:
                # Should fallback to English or root prompt
                with pytest.raises(PromptNotFoundError):
                    service.get_prompt("restricted", locale="he")
            finally:
                # Restore permissions for cleanup
                os.chmod(restricted_file, 0o644)

    @pytest.mark.unit
    def test_prompt_service_with_missing_locales_directory(self):
        """Test PromptService behavior when locales directory doesn't exist."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create only fallback prompt, no locales directory
            with open(
                os.path.join(temp_dir, "test_prompt.txt"), "w", encoding="utf-8"
            ) as f:
                f.write("Fallback only")

            service = PromptService(prompts_dir=temp_dir)

            # Should fallback to root prompt
            prompt = service.get_prompt("test_prompt", locale="he")
            assert prompt == "Fallback only"

    @pytest.mark.unit
    def test_empty_locale_directory(self, temp_prompts_dir):
        """Test behavior with empty locale directory."""
        # Create empty French locale directory
        os.makedirs(os.path.join(temp_prompts_dir, "locales", "fr"))

        service = PromptService(prompts_dir=temp_prompts_dir)

        # Should fallback through the chain
        prompt = service.get_prompt("test_prompt", locale="fr")
        assert prompt == "English prompt content"
