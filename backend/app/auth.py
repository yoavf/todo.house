from typing import Optional, Dict, Any
from datetime import datetime, timezone
from jose import jwt, JWTError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import os
from .database import get_session_dependency, User as UserModel
from .logging_config import StructuredLogger

logger = StructuredLogger(__name__)

# JWT configuration
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    """Get JWT secret from environment, checking at runtime."""
    secret = os.getenv("JWT_SECRET") or os.getenv("NEXTAUTH_SECRET") or ""
    if not secret:
        # In test environment, use the test secret
        if os.getenv("TESTING") == "true":
            secret = "test-secret-key-for-jwt-encoding"
    return secret

# HTTP Bearer for Authorization header
security = HTTPBearer(auto_error=False)


async def decode_nextauth_jwt(token: str) -> Dict[str, Any]:
    """Decode a NextAuth JWT token"""
    try:
        jwt_secret = get_jwt_secret()
        if not jwt_secret:
            raise ValueError("JWT_SECRET or NEXTAUTH_SECRET not configured")
            
        payload = jwt.decode(token, jwt_secret, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError as e:
        logger.error("JWT decode error", error=str(e))
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception as e:
        logger.error("Unexpected auth error", error=str(e))
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: AsyncSession = Depends(get_session_dependency),
) -> UserModel:
    """
    Get the current authenticated user from JWT token.
    
    Extracts user information from the NextAuth JWT token and either
    returns the existing user or creates a new user on first sign-in.
    """
    
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=401, 
            detail="Authentication required. Please provide a valid JWT token."
        )
    
    try:
        payload = await decode_nextauth_jwt(credentials.credentials)
        
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
                id=user_uuid,
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
        raise
    except Exception as e:
        logger.error("Unexpected error in get_current_user", error=str(e))
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: AsyncSession = Depends(get_session_dependency),
) -> Optional[UserModel]:
    """
    Get the current user if authenticated, otherwise return None.
    Useful for endpoints that have optional authentication.
    """
    try:
        return await get_current_user(credentials, session)
    except HTTPException:
        return None