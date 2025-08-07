from typing import Optional, Dict, Any
from datetime import datetime, timezone
from jose import jwt, JWTError
from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import os
from .database import get_session_dependency, User as UserModel
from .logging_config import StructuredLogger

logger = StructuredLogger(__name__)

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", os.getenv("NEXTAUTH_SECRET", ""))
JWT_ALGORITHM = "HS256"

# HTTP Bearer for Authorization header
security = HTTPBearer(auto_error=False)


async def decode_nextauth_jwt(token: str) -> Dict[str, Any]:
    """Decode a NextAuth JWT token"""
    try:
        if not JWT_SECRET:
            raise ValueError("JWT_SECRET or NEXTAUTH_SECRET not configured")
            
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError as e:
        logger.error("JWT decode error", error=str(e))
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception as e:
        logger.error("Unexpected auth error", error=str(e))
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
    session: AsyncSession = Depends(get_session_dependency),
) -> UserModel:
    """
    Get the current authenticated user.
    
    This function supports two authentication methods:
    1. JWT token from NextAuth (preferred)
    2. Legacy x-user-id header (for backward compatibility)
    """
    
    # Try JWT authentication first
    if credentials and credentials.credentials:
        try:
            payload = await decode_nextauth_jwt(credentials.credentials)
            
            # Extract user info from JWT
            # Extract user info from JWT
            user_email = payload.get("email")
            user_id = payload.get("sub")  # NextAuth uses 'sub' for user ID
            user_name = payload.get("name")
            user_picture = payload.get("picture")
            
            if not user_email or not user_id:
                raise HTTPException(status_code=401, detail="Invalid token payload")
            
            # Validate user_id is a valid UUID
            try:
                user_uuid = uuid.UUID(user_id)
            except (ValueError, TypeError):
                raise HTTPException(status_code=401, detail="Invalid user ID in token")
            
            # Try to find user in database
            result = await session.execute(
                select(UserModel).where(UserModel.id == user_uuid)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                # Create new user if doesn't exist
                user = UserModel(
                    id=uuid.UUID(user_id),
                    email=user_email,
                    name=user_name,
                    avatar_url=user_picture,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
                session.add(user)
                await session.commit()
                await session.refresh(user)
                logger.info("Created new user from JWT", user_id=str(user.id))
            
            return user
            
        except HTTPException:
            # If JWT auth fails and no x-user-id, raise the error
            if not x_user_id:
                raise
    
    # Fall back to x-user-id header (legacy support)
    if x_user_id:
        try:
            user_uuid = uuid.UUID(x_user_id)
            
            # Check if user exists
            result = await session.execute(
                select(UserModel).where(UserModel.id == user_uuid)
            )
            user = result.scalar_one_or_none()
            
            if user:
                return user
            
            # For legacy support, create a placeholder user
            user = UserModel(
                id=user_uuid,
                email=f"legacy-{user_uuid}@todohouse.app",
                name="Legacy User",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            logger.info("Created legacy user", user_id=str(user.id))
            
            return user
            
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    # No valid authentication method provided
    raise HTTPException(
        status_code=401, 
        detail="Authentication required. Please provide a valid JWT token or x-user-id header."
    )


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
    session: AsyncSession = Depends(get_session_dependency),
) -> Optional[UserModel]:
    """
    Get the current user if authenticated, otherwise return None.
    Useful for endpoints that have optional authentication.
    """
    try:
        return await get_current_user(credentials, x_user_id, session)
    except HTTPException:
        return None