"""Unit tests for user settings endpoints."""

import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_settings import get_user_settings, update_user_settings
from app.models import UserSettingsUpdate
from app.database.models import User
from app.database import User as UserModel
from datetime import datetime, timezone


@pytest.mark.asyncio
class TestGetUserSettings:
    """Unit tests for get_user_settings endpoint."""

    async def test_get_user_settings_success(self):
        """Test successful retrieval of user settings."""
        # Mock dependencies
        user_id = uuid.uuid4()
        mock_current_user = MagicMock(spec=UserModel)
        mock_current_user.id = user_id

        mock_user = MagicMock(spec=User)
        mock_user.id = user_id
        mock_user.locale_preference = "he"
        mock_user.created_at = datetime.now(timezone.utc)
        mock_user.updated_at = datetime.now(timezone.utc)

        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result

        with patch("app.user_settings.detect_locale_and_metadata") as mock_detect:
            mock_detect.return_value = (
                "he",
                {"locale": "he", "source": "user_preference"},
            )

            # Call the function with new signature
            result = await get_user_settings(
                current_user=mock_current_user, db=mock_db, accept_language="en-US"
            )

            # Verify result
            assert result.user_id == user_id
            assert result.locale_preference == "he"
            assert result.created_at == mock_user.created_at
            assert result.updated_at == mock_user.updated_at

    async def test_get_user_settings_user_not_found(self):
        """Test when user is not found."""
        user_id = uuid.uuid4()
        mock_current_user = MagicMock(spec=UserModel)
        mock_current_user.id = user_id

        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        # Should raise 404
        with pytest.raises(HTTPException) as exc_info:
            await get_user_settings(
                current_user=mock_current_user, db=mock_db, accept_language=None
            )

        assert exc_info.value.status_code == 404
        assert exc_info.value.detail == "User not found"

    async def test_get_user_settings_database_error(self):
        """Test handling of database errors."""
        user_id = uuid.uuid4()
        mock_current_user = MagicMock(spec=UserModel)
        mock_current_user.id = user_id

        mock_db = AsyncMock(spec=AsyncSession)
        mock_db.execute.side_effect = Exception("Database connection failed")

        # Should raise 500
        with pytest.raises(HTTPException) as exc_info:
            await get_user_settings(
                current_user=mock_current_user, db=mock_db, accept_language=None
            )

        assert exc_info.value.status_code == 500
        assert exc_info.value.detail == "Internal server error"


@pytest.mark.asyncio
class TestUpdateUserSettings:
    """Unit tests for update_user_settings endpoint."""

    async def test_update_user_settings_success(self):
        """Test successful update of user settings."""
        user_id = uuid.uuid4()
        mock_current_user = MagicMock(spec=UserModel)
        mock_current_user.id = user_id

        mock_user = MagicMock(spec=User)
        mock_user.id = user_id
        mock_user.locale_preference = "en"
        mock_user.created_at = datetime.now(timezone.utc)
        mock_user.updated_at = datetime.now(timezone.utc)

        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result
        mock_db.refresh = AsyncMock()
        mock_db.commit = AsyncMock()

        settings_update = UserSettingsUpdate(locale_preference="he")

        with patch("app.user_settings.set_user_locale_preference") as mock_set_locale:
            mock_set_locale.return_value = True

            with patch("app.user_settings.detect_locale_and_metadata") as mock_detect:
                mock_detect.return_value = (
                    "he",
                    {"locale": "he", "source": "user_preference"},
                )

                # Call the function with new signature
                result = await update_user_settings(
                    settings_update=settings_update,
                    current_user=mock_current_user,
                    db=mock_db,
                    accept_language="en-US",
                )

                # Verify result
                assert result.user_id == user_id
                mock_set_locale.assert_called_once_with(mock_db, user_id, "he")
                mock_db.refresh.assert_called_once_with(mock_user)

    async def test_update_user_settings_user_not_found(self):
        """Test when user is not found during update."""
        user_id = uuid.uuid4()
        mock_current_user = MagicMock(spec=UserModel)
        mock_current_user.id = user_id

        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        mock_db.rollback = AsyncMock()

        settings_update = UserSettingsUpdate(locale_preference="he")

        # Should raise 404
        with pytest.raises(HTTPException) as exc_info:
            await update_user_settings(
                settings_update=settings_update,
                current_user=mock_current_user,
                db=mock_db,
                accept_language=None,
            )

        assert exc_info.value.status_code == 404
        assert exc_info.value.detail == "User not found"

    async def test_update_user_settings_update_failed(self):
        """Test when locale preference update fails."""
        user_id = uuid.uuid4()
        mock_current_user = MagicMock(spec=UserModel)
        mock_current_user.id = user_id

        mock_user = MagicMock(spec=User)
        mock_user.id = user_id
        mock_user.locale_preference = "en"

        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result
        mock_db.rollback = AsyncMock()

        settings_update = UserSettingsUpdate(locale_preference="he")

        with patch("app.user_settings.set_user_locale_preference") as mock_set_locale:
            mock_set_locale.return_value = False  # Update fails

            # Should raise 500
            with pytest.raises(HTTPException) as exc_info:
                await update_user_settings(
                    settings_update=settings_update,
                    current_user=mock_current_user,
                    db=mock_db,
                    accept_language=None,
                )

            assert exc_info.value.status_code == 500
            assert exc_info.value.detail == "Failed to update locale preference"

    async def test_update_user_settings_clear_preference(self):
        """Test clearing locale preference."""
        user_id = uuid.uuid4()
        mock_current_user = MagicMock(spec=UserModel)
        mock_current_user.id = user_id

        mock_user = MagicMock(spec=User)
        mock_user.id = user_id
        mock_user.locale_preference = "he"
        mock_user.created_at = datetime.now(timezone.utc)
        mock_user.updated_at = datetime.now(timezone.utc)

        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result
        mock_db.refresh = AsyncMock()
        mock_db.commit = AsyncMock()

        settings_update = UserSettingsUpdate(locale_preference=None)

        with patch("app.user_settings.set_user_locale_preference") as mock_set_locale:
            mock_set_locale.return_value = True

            with patch("app.user_settings.detect_locale_and_metadata") as mock_detect:
                mock_detect.return_value = ("en", {"locale": "en", "source": "default"})

                # Call the function with new signature
                await update_user_settings(
                    settings_update=settings_update,
                    current_user=mock_current_user,
                    db=mock_db,
                    accept_language="en-US",
                )

                # Verify locale was cleared
                mock_set_locale.assert_called_once_with(mock_db, user_id, None)

    async def test_update_user_settings_database_error(self):
        """Test handling of database errors during update."""
        user_id = uuid.uuid4()
        mock_current_user = MagicMock(spec=UserModel)
        mock_current_user.id = user_id

        mock_db = AsyncMock(spec=AsyncSession)
        mock_db.execute.side_effect = Exception("Database connection failed")
        mock_db.rollback = AsyncMock()

        settings_update = UserSettingsUpdate(locale_preference="he")

        # Should raise 500
        with pytest.raises(HTTPException) as exc_info:
            await update_user_settings(
                settings_update=settings_update,
                current_user=mock_current_user,
                db=mock_db,
                accept_language=None,
            )

        assert exc_info.value.status_code == 500
        assert exc_info.value.detail == "Internal server error"
