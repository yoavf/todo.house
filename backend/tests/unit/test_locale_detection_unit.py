"""Unit tests for locale detection utilities."""

import pytest
from app.locale_detection import (
    parse_accept_language_header,
    extract_language_code,
    is_supported_locale,
    detect_locale_from_header,
    detect_locale_with_metadata,
    get_locale_string,
    SUPPORTED_LOCALES,
    DEFAULT_LOCALE,
)


class TestParseAcceptLanguageHeader:
    """Test Accept-Language header parsing."""

    def test_simple_locale(self):
        """Test parsing simple locale without quality values."""
        result = parse_accept_language_header("en")
        assert result == [("en", 1.0)]

    def test_multiple_locales_with_quality(self):
        """Test parsing multiple locales with quality values."""
        result = parse_accept_language_header("en-US,en;q=0.9,he;q=0.8,fr;q=0.7")
        expected = [("en-us", 1.0), ("en", 0.9), ("he", 0.8), ("fr", 0.7)]
        assert result == expected

    def test_quality_sorting(self):
        """Test that locales are sorted by quality (highest first)."""
        result = parse_accept_language_header("fr;q=0.3,en;q=0.9,he;q=0.8")
        expected = [("en", 0.9), ("he", 0.8), ("fr", 0.3)]
        assert result == expected

    def test_invalid_quality_defaults_to_one(self):
        """Test that invalid quality values default to 1.0."""
        result = parse_accept_language_header("en;q=invalid,he")
        expected = [("en", 1.0), ("he", 1.0)]
        assert result == expected

    def test_whitespace_handling(self):
        """Test that whitespace is properly handled."""
        result = parse_accept_language_header(" en-US , en ; q=0.9 , he ; q=0.8 ")
        expected = [("en-us", 1.0), ("en", 0.9), ("he", 0.8)]
        assert result == expected


class TestExtractLanguageCode:
    """Test language code extraction."""

    def test_extract_from_locale_with_region(self):
        """Test extracting language code from locale with region."""
        assert extract_language_code("en-US") == "en"
        assert extract_language_code("he-IL") == "he"
        assert extract_language_code("fr-FR") == "fr"

    def test_extract_from_simple_locale(self):
        """Test extracting language code from simple locale."""
        assert extract_language_code("en") == "en"
        assert extract_language_code("he") == "he"
        assert extract_language_code("fr") == "fr"

    def test_case_handling(self):
        """Test that case is preserved."""
        assert extract_language_code("EN-US") == "EN"
        assert extract_language_code("He-IL") == "He"


class TestIsSupportedLocale:
    """Test locale support checking."""

    def test_supported_locales(self):
        """Test that supported locales are recognized."""
        for locale in SUPPORTED_LOCALES:
            assert is_supported_locale(locale)

    def test_unsupported_locales(self):
        """Test that unsupported locales are not recognized."""
        unsupported = ["fr", "es", "de", "ja", "zh"]
        for locale in unsupported:
            assert not is_supported_locale(locale)

    def test_case_insensitive(self):
        """Test that locale checking is case insensitive."""
        assert is_supported_locale("EN")
        assert is_supported_locale("He")
        assert is_supported_locale("HE")


class TestDetectLocaleFromHeader:
    """Test locale detection from Accept-Language header."""

    def test_no_header_returns_default(self):
        """Test that missing header returns default locale."""
        assert detect_locale_from_header(None) == DEFAULT_LOCALE
        assert detect_locale_from_header("") == DEFAULT_LOCALE

    def test_exact_match_preferred(self):
        """Test that exact locale matches are preferred."""
        assert detect_locale_from_header("en") == "en"
        assert detect_locale_from_header("he") == "he"

    def test_language_code_fallback(self):
        """Test fallback to language code when exact match not found."""
        assert detect_locale_from_header("en-US") == "en"
        assert detect_locale_from_header("he-IL") == "he"

    def test_quality_value_ordering(self):
        """Test that higher quality values are preferred."""
        assert detect_locale_from_header("fr;q=0.9,en;q=0.8") == "en"
        assert detect_locale_from_header("fr;q=0.9,he;q=0.8") == "he"

    def test_first_supported_locale_wins(self):
        """Test that first supported locale in quality order wins."""
        assert detect_locale_from_header("he;q=0.9,en;q=0.8") == "he"
        assert detect_locale_from_header("en;q=0.9,he;q=0.8") == "en"

    def test_unsupported_locales_fallback_to_default(self):
        """Test that unsupported locales fallback to default."""
        assert detect_locale_from_header("fr,es,de") == DEFAULT_LOCALE
        assert detect_locale_from_header("ja;q=0.9,zh;q=0.8") == DEFAULT_LOCALE

    def test_complex_header_parsing(self):
        """Test parsing complex real-world headers."""
        # Chrome-like header
        header = "en-US,en;q=0.9,he;q=0.8,fr;q=0.7"
        assert detect_locale_from_header(header) == "en"

        # Hebrew preferred
        header = "he-IL,he;q=0.9,en;q=0.8"
        assert detect_locale_from_header(header) == "he"

    def test_malformed_header_fallback(self):
        """Test that malformed headers fallback gracefully."""
        # This should not crash and should return default
        assert detect_locale_from_header("invalid;;;header") == DEFAULT_LOCALE


class TestDetectLocaleWithMetadata:
    """Test enhanced locale detection with metadata."""

    def test_no_header_metadata(self):
        """Test metadata when no header is provided."""
        result = detect_locale_with_metadata(None)
        expected = {
            "locale": DEFAULT_LOCALE,
            "source": "default"
        }
        assert result == expected

    def test_exact_match_metadata(self):
        """Test metadata for exact locale match."""
        result = detect_locale_with_metadata("en;q=0.9")
        expected = {
            "locale": "en",
            "source": "header",
            "original_header": "en;q=0.9",
            "quality": 0.9,
            "match_type": "exact"
        }
        assert result == expected

    def test_language_code_match_metadata(self):
        """Test metadata for language code match."""
        result = detect_locale_with_metadata("en-US;q=0.8")
        expected = {
            "locale": "en",
            "source": "header",
            "original_header": "en-US;q=0.8",
            "quality": 0.8,
            "match_type": "language_code"
        }
        assert result == expected

    def test_no_match_metadata(self):
        """Test metadata when no supported locale is found."""
        result = detect_locale_with_metadata("fr,es,de")
        expected = {
            "locale": DEFAULT_LOCALE,
            "source": "default",
            "original_header": "fr,es,de"
        }
        assert result == expected

    def test_hebrew_exact_match_metadata(self):
        """Test metadata for Hebrew exact match."""
        result = detect_locale_with_metadata("he;q=0.9")
        expected = {
            "locale": "he",
            "source": "header",
            "original_header": "he;q=0.9",
            "quality": 0.9,
            "match_type": "exact"
        }
        assert result == expected


class TestGetLocaleString:
    """Test locale string conversion helper function."""

    def test_supported_locales_mapping(self):
        """Test that supported locales are mapped correctly."""
        assert get_locale_string("en") == "en_US"
        assert get_locale_string("he") == "he_IL"

    def test_unsupported_locale_fallback(self):
        """Test that unsupported locales fallback to default."""
        assert get_locale_string("fr") == "en_US"
        assert get_locale_string("es") == "en_US"
        assert get_locale_string("de") == "en_US"
        assert get_locale_string("ja") == "en_US"

    def test_empty_and_none_input(self):
        """Test edge cases with empty or invalid input."""
        assert get_locale_string("") == "en_US"
        assert get_locale_string("unknown") == "en_US"

    def test_case_sensitivity(self):
        """Test that function handles different cases correctly."""
        # The function should handle lowercase input (which is what detect_locale_from_header returns)
        assert get_locale_string("en") == "en_US"
        assert get_locale_string("he") == "he_IL"
        
        # Test uppercase (though not expected in normal usage)
        assert get_locale_string("EN") == "en_US"  # Should fallback since mapping uses lowercase
        assert get_locale_string("HE") == "en_US"  # Should fallback since mapping uses lowercase

    def test_consistency_with_supported_locales(self):
        """Test that all supported locales have mappings."""
        for locale in SUPPORTED_LOCALES:
            result = get_locale_string(locale)
            assert result is not None
            assert "_" in result  # Should be in format like "en_US"
            assert len(result) >= 5  # Should be at least "xx_YY"


@pytest.mark.unit
class TestLocaleDetectionIntegration:
    """Integration tests for locale detection functionality."""

    def test_browser_like_headers(self):
        """Test with realistic browser Accept-Language headers."""
        test_cases = [
            # Chrome on English system
            ("en-US,en;q=0.9", "en"),
            # Chrome on Hebrew system
            ("he-IL,he;q=0.9,en;q=0.8", "he"),
            # Firefox with multiple languages
            ("he,en-US;q=0.7,en;q=0.3", "he"),
            # Safari with region codes
            ("en-us", "en"),
            ("he-il", "he"),
            # Edge cases
            ("", DEFAULT_LOCALE),
            ("*", DEFAULT_LOCALE),
            ("fr-FR,fr;q=0.9,en;q=0.8", "en"),  # French preferred but English supported
        ]

        for header, expected in test_cases:
            result = detect_locale_from_header(header)
            assert result == expected, f"Failed for header: {header}"

    def test_quality_value_edge_cases(self):
        """Test edge cases with quality values."""
        test_cases = [
            # Zero quality should be ignored
            ("en;q=0,he;q=0.8", "he"),
            # Very small quality values
            ("fr;q=0.001,en;q=0.002", "en"),
            # Quality value of 1.0 (explicit)
            ("he;q=1.0,en;q=0.9", "he"),
            # Missing quality defaults to 1.0
            ("he,en;q=0.9", "he"),
        ]

        for header, expected in test_cases:
            result = detect_locale_from_header(header)
            assert result == expected, f"Failed for header: {header}"

    def test_locale_detection_to_string_integration(self):
        """Test integration between locale detection and string conversion."""
        test_cases = [
            ("en-US,en;q=0.9", "en_US"),
            ("he-IL,he;q=0.9,en;q=0.8", "he_IL"),
            ("fr-FR,fr;q=0.9,en;q=0.8", "en_US"),  # Fallback to English
            ("", "en_US"),  # Default case
        ]

        for header, expected_locale_string in test_cases:
            detected_locale = detect_locale_from_header(header)
            locale_string = get_locale_string(detected_locale)
            assert locale_string == expected_locale_string, f"Failed for header: {header}"