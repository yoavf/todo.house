"""Locale detection utilities for API endpoints."""

from typing import List, Tuple, Optional
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .database.models import User
import uuid

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





async def get_user_locale_preference(db: AsyncSession, user_id: uuid.UUID) -> Optional[str]:
    """
    Get user's locale preference from database.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        User's locale preference or None if not set
    """
    try:
        result = await db.execute(
            select(User.locale_preference).where(User.id == user_id)
        )
        preference = result.scalar_one_or_none()
        
        if preference and is_supported_locale(preference):
            logger.debug(f"Found user locale preference: {preference}")
            return preference
        elif preference:
            logger.warning(f"User has unsupported locale preference: {preference}")
            
    except Exception as e:
        logger.error(f"Failed to get user locale preference: {e}")
    
    return None





async def detect_locale_with_metadata_and_user_preference(
    db: AsyncSession,
    user_id: uuid.UUID,
    accept_language_header: Optional[str]
) -> dict:
    """
    Enhanced locale detection with user preference and detailed result information.
    
    Args:
        db: Database session
        user_id: User ID
        accept_language_header: Accept-Language header value
        
    Returns:
        Dictionary with locale, source, and metadata
    """
    # First check user preference
    user_preference = await get_user_locale_preference(db, user_id)
    if user_preference:
        return {
            "locale": user_preference,
            "source": "user_preference",
            "user_id": str(user_id)
        }
    
    # Fall back to header detection with metadata
    if not accept_language_header:
        return {
            "locale": DEFAULT_LOCALE,
            "source": "default",
            "user_id": str(user_id)
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
                    "match_type": "exact",
                    "user_id": str(user_id)
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
                    "match_type": "language_code",
                    "user_id": str(user_id)
                }
                
    except Exception as e:
        logger.warning(f"Failed to parse Accept-Language header: {e}")
    
    return {
        "locale": DEFAULT_LOCALE,
        "source": "default",
        "original_header": accept_language_header,
        "user_id": str(user_id)
    }


async def detect_locale_with_user_preference(
    db: AsyncSession, 
    user_id: uuid.UUID, 
    accept_language_header: Optional[str]
) -> str:
    """
    Detect locale with user preference override.
    
    Priority order:
    1. User's saved locale preference
    2. Accept-Language header
    3. Default locale
    
    Args:
        db: Database session
        user_id: User ID
        accept_language_header: Accept-Language header value
        
    Returns:
        Best supported locale
    """
    # Get the full metadata and extract just the locale
    metadata = await detect_locale_with_metadata_and_user_preference(
        db, user_id, accept_language_header
    )
    return metadata["locale"]


async def set_user_locale_preference(
    db: AsyncSession, 
    user_id: uuid.UUID, 
    locale: Optional[str]
) -> bool:
    """
    Set or clear user's locale preference.
    
    Args:
        db: Database session
        user_id: User ID
        locale: Locale to set, or None to clear preference
        
    Returns:
        True if successful, False otherwise
    """
    # Only validate non-None locales
    if locale is not None and not is_supported_locale(locale):
        logger.warning(f"Attempted to set unsupported locale: {locale}")
        return False
    
    try:
        # Get user and update locale preference
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            logger.error(f"User not found: {user_id}")
            return False
        
        user.locale_preference = locale
        await db.commit()
        
        if locale is None:
            logger.info(f"Cleared locale preference for user {user_id}")
        else:
            logger.info(f"Set locale preference for user {user_id}: {locale}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to set user locale preference: {e}")
        await db.rollback()
        return False


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