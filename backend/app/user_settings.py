"""User settings API endpoints."""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .database import get_session_dependency, User as UserModel
from .database.models import User
from .models import UserSettings, UserSettingsUpdate
from .auth import get_current_user
from .locale_detection import set_user_locale_preference, detect_locale_and_metadata

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user-settings", tags=["user-settings"])


@router.get("/me", response_model=UserSettings)
async def get_user_settings(
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_session_dependency),
    accept_language: Optional[str] = Header(None, alias="Accept-Language"),
):
    """
    Get user settings including locale preference.

    Args:
        user_id: User ID
        db: Database session
        accept_language: Accept-Language header for locale detection

    Returns:
        User settings including current locale preference
    """
    try:
        # Get user from database
        result = await db.execute(select(User).where(User.id == current_user.id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get locale detection metadata for logging
        _, locale_metadata = await detect_locale_and_metadata(
            db, current_user.id, accept_language
        )

        logger.info(
            f"Retrieved user settings for {current_user.id}",
            extra={
                "user_id": str(current_user.id),
                "locale_preference": user.locale_preference,
                "detected_locale": locale_metadata.get("locale"),
                "locale_source": locale_metadata.get("source"),
            },
        )

        return UserSettings(
            user_id=user.id,
            locale_preference=user.locale_preference,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/me", response_model=UserSettings)
async def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_session_dependency),
    accept_language: Optional[str] = Header(None, alias="Accept-Language"),
):
    """
    Update user settings including locale preference.

    Args:
        user_id: User ID
        settings_update: Settings to update
        db: Database session
        accept_language: Accept-Language header for locale detection

    Returns:
        Updated user settings
    """
    try:
        # Get user from database
        result = await db.execute(select(User).where(User.id == current_user.id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Store old locale preference for logging
        old_locale_preference = user.locale_preference

        # Update locale preference (handles both setting and clearing)
        # set_user_locale_preference validates the locale internally
        success = await set_user_locale_preference(
            db, current_user.id, settings_update.locale_preference
        )

        if not success:
            raise HTTPException(
                status_code=500, detail="Failed to update locale preference"
            )

        # Commit the transaction
        await db.commit()

        # Refresh user data
        await db.refresh(user)

        # Get locale detection metadata for logging
        _, locale_metadata = await detect_locale_and_metadata(
            db, current_user.id, accept_language
        )

        logger.info(
            f"Updated user settings for {current_user.id}",
            extra={
                "user_id": str(current_user.id),
                "old_locale_preference": old_locale_preference,
                "new_locale_preference": settings_update.locale_preference,
                "detected_locale": locale_metadata.get("locale"),
                "locale_source": locale_metadata.get("source"),
            },
        )

        return UserSettings(
            user_id=user.id,
            locale_preference=user.locale_preference,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update user settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
