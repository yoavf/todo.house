"""User settings API endpoints."""

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .database import get_session_dependency
from .database.models import User
from .models import UserSettings, UserSettingsUpdate
from .locale_detection import (
    set_user_locale_preference,
    is_supported_locale,
    detect_locale_with_metadata_and_user_preference
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user-settings", tags=["user-settings"])


@router.get("/{user_id}", response_model=UserSettings)
async def get_user_settings(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_session_dependency),
    accept_language: Optional[str] = Header(None, alias="Accept-Language")
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
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get locale detection metadata for logging
        locale_metadata = await detect_locale_with_metadata_and_user_preference(
            db, user_id, accept_language
        )
        
        logger.info(
            f"Retrieved user settings for {user_id}",
            extra={
                "user_id": str(user_id),
                "locale_preference": user.locale_preference,
                "detected_locale": locale_metadata.get("locale"),
                "locale_source": locale_metadata.get("source")
            }
        )
        
        return UserSettings(
            user_id=user.id,
            locale_preference=user.locale_preference,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/{user_id}", response_model=UserSettings)
async def update_user_settings(
    user_id: uuid.UUID,
    settings_update: UserSettingsUpdate,
    db: AsyncSession = Depends(get_session_dependency),
    accept_language: Optional[str] = Header(None, alias="Accept-Language")
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
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Store old locale preference for logging
        old_locale_preference = user.locale_preference
        
        # Handle locale preference update
        if settings_update.locale_preference is not None:
            # Validate non-null locale preference
            if not is_supported_locale(settings_update.locale_preference):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported locale: {settings_update.locale_preference}"
                )
        
        # Update locale preference (handles both setting and clearing)
        success = await set_user_locale_preference(
            db, user_id, settings_update.locale_preference
        )
        
        if not success:
            raise HTTPException(
                status_code=500, 
                detail="Failed to update locale preference"
            )
        
        # Refresh user data
        await db.refresh(user)
        
        # Get locale detection metadata for logging
        locale_metadata = await detect_locale_with_metadata_and_user_preference(
            db, user_id, accept_language
        )
        
        logger.info(
            f"Updated user settings for {user_id}",
            extra={
                "user_id": str(user_id),
                "old_locale_preference": old_locale_preference,
                "new_locale_preference": settings_update.locale_preference,
                "detected_locale": locale_metadata.get("locale"),
                "locale_source": locale_metadata.get("source")
            }
        )
        
        return UserSettings(
            user_id=user.id,
            locale_preference=user.locale_preference,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


