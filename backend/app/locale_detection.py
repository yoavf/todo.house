"""Locale detection utilities for API endpoints."""

from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# Supported locales - should match frontend configuration
SUPPORTED_LOCALES = ["en", "he"]
DEFAULT_LOCALE = "en"


def parse_accept_language_header(accept_language: str) -> List[Tuple[str, float]]:
    """
    Parse Accept-Language header and extract locale preferences with quality values.
    
    Format: "en-US,en;q=0.9,he;q=0.8,fr;q=0.7"
    
    Args:
        accept_language: Accept-Language header value
        
    Returns:
        List of (locale, quality) tuples sorted by quality (highest first)
    """
    locales = []
    
    for lang in accept_language.split(","):
        lang = lang.strip()
        
        # Handle quality values with flexible whitespace around semicolon
        if ";" in lang:
            # Split on semicolon and handle whitespace
            parts = lang.split(";", 1)
            locale = parts[0].strip()
            quality_part = parts[1].strip()
            
            # Extract quality value if it starts with q=
            if quality_part.startswith("q="):
                try:
                    quality = float(quality_part[2:].strip())
                except ValueError:
                    quality = 1.0
            else:
                quality = 1.0
        else:
            locale = lang
            quality = 1.0
            
        locales.append((locale.lower(), quality))
    
    # Sort by quality (highest first)
    return sorted(locales, key=lambda x: x[1], reverse=True)


def extract_language_code(locale: str) -> str:
    """
    Extract the primary language code from a locale string.
    
    Examples: "en-US" -> "en", "he-IL" -> "he", "en" -> "en"
    
    Args:
        locale: Locale string
        
    Returns:
        Primary language code
    """
    return locale.split("-")[0]


def is_supported_locale(locale: str) -> bool:
    """
    Check if a locale is supported.
    
    Args:
        locale: Locale string to check
        
    Returns:
        True if locale is supported, False otherwise
    """
    return locale.lower() in SUPPORTED_LOCALES


def detect_locale_from_header(accept_language_header: Optional[str]) -> str:
    """
    Detect the best supported locale from Accept-Language header.
    
    Falls back to default locale if no supported locale is found.
    
    Args:
        accept_language_header: Accept-Language header value
        
    Returns:
        Best supported locale or default locale
    """
    if not accept_language_header:
        return DEFAULT_LOCALE
    
    try:
        parsed_locales = parse_accept_language_header(accept_language_header)
        
        # First, try to find exact matches (including region codes)
        for locale, _ in parsed_locales:
            normalized_locale = locale.lower()
            if is_supported_locale(normalized_locale):
                logger.debug(f"Found exact locale match: {normalized_locale}")
                return normalized_locale
        
        # Then, try to match by language code only
        for locale, _ in parsed_locales:
            language_code = extract_language_code(locale)
            if is_supported_locale(language_code):
                logger.debug(f"Found language code match: {language_code}")
                return language_code
                
    except Exception as e:
        logger.warning(f"Failed to parse Accept-Language header: {e}")
    
    logger.debug(f"No supported locale found, using default: {DEFAULT_LOCALE}")
    return DEFAULT_LOCALE


def detect_locale_with_metadata(accept_language_header: Optional[str]) -> dict:
    """
    Enhanced locale detection with detailed result information.
    
    Args:
        accept_language_header: Accept-Language header value
        
    Returns:
        Dictionary with locale, source, and original header information
    """
    if not accept_language_header:
        return {
            "locale": DEFAULT_LOCALE,
            "source": "default"
        }
    
    try:
        parsed_locales = parse_accept_language_header(accept_language_header)
        
        # First, try to find exact matches
        for locale, quality in parsed_locales:
            normalized_locale = locale.lower()
            if is_supported_locale(normalized_locale):
                return {
                    "locale": normalized_locale,
                    "source": "header",
                    "original_header": accept_language_header,
                    "quality": quality,
                    "match_type": "exact"
                }
        
        # Then, try to match by language code only
        for locale, quality in parsed_locales:
            language_code = extract_language_code(locale)
            if is_supported_locale(language_code):
                return {
                    "locale": language_code,
                    "source": "header",
                    "original_header": accept_language_header,
                    "quality": quality,
                    "match_type": "language_code"
                }
                
    except Exception as e:
        logger.warning(f"Failed to parse Accept-Language header: {e}")
    
    return {
        "locale": DEFAULT_LOCALE,
        "source": "default",
        "original_header": accept_language_header
    }


def get_locale_string(locale_code: str) -> str:
    """
    Convert a locale code to a full locale string with region.
    
    This function maps locale codes to their full locale strings with regions
    as expected by services like the snooze service that use babel.Locale.
    
    Args:
        locale_code: Short locale code (e.g., 'en', 'he')
        
    Returns:
        Full locale string with region (e.g., 'en_US', 'he_IL')
        Defaults to 'en_US' if locale is not found.
    """
    # Mapping of locale codes to full locale strings with regions
    LOCALE_MAPPING = {
        "en": "en_US",
        "he": "he_IL",
    }
    
    return LOCALE_MAPPING.get(locale_code, "en_US")