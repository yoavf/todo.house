"""
Simplified auth module using fastapi-nextauth-jwt directly as intended.
This follows the library documentation more closely.
"""
from typing import Optional, Annotated
from datetime import datetime, timezone
from fastapi import HTTPException, Depends, Header, Request
from fastapi_nextauth_jwt import NextAuthJWTv4  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import os
import json
from .database import get_session_dependency, User as UserModel
from .logging_config import StructuredLogger

logger = StructuredLogger(__name__)

# Get the secret for authentication
AUTH_SECRET = os.getenv("AUTH_SECRET") or os.getenv("NEXTAUTH_SECRET")
if not AUTH_SECRET:
    raise RuntimeError(
        "CRITICAL: AUTH_SECRET environment variable is not set. "
        "Please set either AUTH_SECRET or NEXTAUTH_SECRET environment variable."
    )

# Remove quotes if they were accidentally included
AUTH_SECRET = AUTH_SECRET.strip('"').strip("'")

# Initialize NextAuthJWTv4 as per documentation
JWT = NextAuthJWTv4(
    secret=AUTH_SECRET,
    csrf_prevention_enabled=False  # Disable for API usage
)


async def get_current_user_simple(
    request: Request,
    session: AsyncSession = Depends(get_session_dependency),
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
) -> UserModel:
    """
    Get the current authenticated user from NextAuth JWT token.
    This version follows the library documentation more closely.
    """
    
    # If we have X-Auth-Token, inject it as a cookie for the library
    if x_auth_token:
        logger.debug("Using X-Auth-Token header for authentication")
        # Create a new request with our token as a cookie
        # We can't modify the original request cookies directly
        setattr(request, "_cookies", {"next-auth.session-token": x_auth_token})
    
    # Try to get the JWT data using the library as a dependency
    try:
        token_data = JWT(request)
        logger.info(f"Successfully decrypted NextAuth token for: {token_data.get('email')}")
    except Exception as e:
        logger.error(f"Failed to decrypt token: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract user info from decrypted token
    user_email = token_data.get("email")
    user_id = token_data.get("sub") or token_data.get("id")
    user_name = token_data.get("name")
    user_picture = token_data.get("picture") or token_data.get("image")
    
    if not user_email:
        logger.error("No email in token", token_data=token_data)
        raise HTTPException(status_code=401, detail="Invalid token: missing email")
    
    if not user_id:
        logger.error("No user ID in token", token_data=token_data)
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
    
    # Validate user_id is a valid UUID or generate one
    try:
        user_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        # Generate UUID from email for non-UUID OAuth IDs
        namespace_uuid = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
        user_uuid = uuid.uuid5(namespace_uuid, user_email)
        logger.info(
            "Generated UUID for non-UUID user ID",
            original_id=user_id,
            uuid=str(user_uuid),
        )
    
    # Try to find user in database
    result = await session.execute(
        select(UserModel).where(UserModel.id == user_uuid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        # Check if user exists with this email
        result = await session.execute(
            select(UserModel).where(UserModel.email == user_email)
        )
        user = result.scalar_one_or_none()
        
        if user:
            # User exists with this email but different ID
            logger.info(
                "Found existing user with different ID, using existing",
                existing_id=str(user.id),
                token_id=str(user_uuid),
                email=user_email,
            )
            # Update metadata if needed
            if user.name != user_name:
                user.name = user_name
            if user.avatar_url != user_picture:
                user.avatar_url = user_picture
            user.updated_at = datetime.now(timezone.utc)
        else:
            # Create new user
            user = UserModel(
                id=user_uuid,
                email=user_email,
                name=user_name,
                avatar_url=user_picture,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(user)
            logger.info(
                "Created new user from JWT", user_id=str(user.id), email=user_email
            )
        
        await session.commit()
        await session.refresh(user)
    else:
        # Update user info if changed
        updated = False
        if user.name != user_name:
            user.name = user_name
            updated = True
        if user.avatar_url != user_picture:
            user.avatar_url = user_picture
            updated = True
        
        if updated:
            user.updated_at = datetime.now(timezone.utc)
            await session.commit()
            await session.refresh(user)
            logger.info("Updated user info from JWT", user_id=str(user.id))
    
    return user