"""Unit tests for user locale preference functionality."""

import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.locale_detection import (
    get_user_locale_preference,
    detect_locale_with_user_preference,
    detect_locale_with_metadata_and_user_preference,
    set_user_locale_preference,
    is_supported_locale,
)
from app.database.models import User
from sqlalchemy.exc import SQLAlchemyError


@pytest.mark.unit
class TestUserLocalePreference:
    """Unit tests for user locale preference functions."""

    async def test_get_user_locale_preference_success(self):
        """Test getting user locale preference successfully."""
        # Mock database session and result
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = "he"
        mock_session.execute.return_value = mock_result

        user_id = uuid.uuid4()

        result = await get_user_locale_preference(mock_session, user_id)

        assert result == "he"
        mock_session.execute.assert_called_once()

    async def test_get_user_locale_preference_none(self):
        """Test getting user locale preference when none is set."""
        # Mock database session and result
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        user_id = uuid.uuid4()

        result = await get_user_locale_preference(mock_session, user_id)

        assert result is None
        mock_session.execute.assert_called_once()

    async def test_get_user_locale_preference_unsupported(self):
        """Test getting user locale preference when unsupported locale is stored."""
        # Mock database session and result
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = "fr"  # Unsupported
        mock_session.execute.return_value = mock_result

        user_id = uuid.uuid4()

        result = await get_user_locale_preference(mock_session, user_id)

        assert result is None  # Should return None for unsupported locales
        mock_session.execute.assert_called_once()

    async def test_get_user_locale_preference_database_error(self):
        """Test handling database errors when getting user locale preference."""
        # Mock database session to raise exception
        mock_session = AsyncMock(spec=AsyncSession)
        mock_session.execute.side_effect = SQLAlchemyError("Database error")

        user_id = uuid.uuid4()

        result = await get_user_locale_preference(mock_session, user_id)

        assert result is None  # Should return None on error
        mock_session.execute.assert_called_once()

    async def test_detect_locale_with_user_preference_uses_preference(self):
        """Test that locale detection uses user preference when available."""
        # Mock database session and result
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = "he"
        mock_session.execute.return_value = mock_result

        user_id = uuid.uuid4()
        accept_language = "en-US,en;q=0.9"

        result = await detect_locale_with_user_preference(
            mock_session, user_id, accept_language
        )

        assert result == "he"  # Should use preference, not header
        mock_session.execute.assert_called_once()

    async def test_detect_locale_with_user_preference_fallback_to_header(self):
        """Test that locale detection falls back to header when no preference."""
        # Mock database session and result
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        user_id = uuid.uuid4()
        accept_language = "he-IL,he;q=0.9,en;q=0.8"

        result = await detect_locale_with_user_preference(
            mock_session, user_id, accept_language
        )

        assert result == "he"  # Should detect from header
        mock_session.execute.assert_called_once()

    async def test_detect_locale_with_metadata_and_user_preference_uses_preference(
        self,
    ):
        """Test that metadata detection uses user preference when available."""
        # Mock database session and result
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = "he"
        mock_session.execute.return_value = mock_result

        user_id = uuid.uuid4()
        accept_language = "en-US,en;q=0.9"

        result = await detect_locale_with_metadata_and_user_preference(
            mock_session, user_id, accept_language
        )

        assert result["locale"] == "he"
        assert result["source"] == "user_preference"
        assert result["user_id"] == str(user_id)
        mock_session.execute.assert_called_once()

    async def test_detect_locale_with_metadata_fallback_to_header(self):
        """Test that metadata detection falls back to header when no preference."""
        # Mock database session and result
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        user_id = uuid.uuid4()
        accept_language = "he-IL,he;q=0.9,en;q=0.8"

        result = await detect_locale_with_metadata_and_user_preference(
            mock_session, user_id, accept_language
        )

        assert result["locale"] == "he"
        assert result["source"] == "header"
        assert result["user_id"] == str(user_id)
        assert "original_header" in result
        mock_session.execute.assert_called_once()

    async def test_set_user_locale_preference_success(self):
        """Test setting user locale preference successfully."""
        # Mock database session and user
        mock_session = AsyncMock(spec=AsyncSession)
        mock_user = MagicMock(spec=User)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_session.execute.return_value = mock_result

        user_id = uuid.uuid4()
        locale = "he"

        result = await set_user_locale_preference(mock_session, user_id, locale)

        assert result is True
        assert mock_user.locale_preference == "he"
        # Commit should not be called - caller handles transaction
        mock_session.commit.assert_not_called()

    async def test_set_user_locale_preference_invalid_locale(self):
        """Test setting invalid locale preference."""
        mock_session = AsyncMock(spec=AsyncSession)
        user_id = uuid.uuid4()
        locale = "invalid"

        result = await set_user_locale_preference(mock_session, user_id, locale)

        assert result is False
        mock_session.execute.assert_not_called()

    async def test_set_user_locale_preference_user_not_found(self):
        """Test setting locale preference for non-existent user."""
        # Mock database session with no user found
        mock_session = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        user_id = uuid.uuid4()
        locale = "he"

        result = await set_user_locale_preference(mock_session, user_id, locale)

        assert result is False
        mock_session.commit.assert_not_called()

    async def test_set_user_locale_preference_database_error(self):
        """Test handling database errors when setting locale preference."""
        # Mock database session to raise exception
        mock_session = AsyncMock(spec=AsyncSession)
        mock_session.execute.side_effect = SQLAlchemyError("Database error")

        user_id = uuid.uuid4()
        locale = "he"

        result = await set_user_locale_preference(mock_session, user_id, locale)

        assert result is False
        # Rollback should not be called - caller handles transaction
        mock_session.rollback.assert_not_called()

    def test_is_supported_locale_valid(self):
        """Test is_supported_locale with valid locales."""
        assert is_supported_locale("en") is True
        assert is_supported_locale("he") is True
        assert is_supported_locale("EN") is True  # Case insensitive
        assert is_supported_locale("HE") is True

    def test_is_supported_locale_invalid(self):
        """Test is_supported_locale with invalid locales."""
        assert is_supported_locale("fr") is False
        assert is_supported_locale("de") is False
        assert is_supported_locale("") is False
        assert is_supported_locale("invalid") is False
