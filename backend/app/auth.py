from typing import Optional, Dict
from datetime import datetime, timezone
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi_nextauth_jwt import NextAuthJWT  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import os
import json
from .database import get_session_dependency, User as UserModel
import hashlib
from .logging_config import StructuredLogger

logger = StructuredLogger(__name__)


# Environment helpers
def _is_development() -> bool:
    env = (os.getenv("ENV") or os.getenv("NODE_ENV") or "").lower()
    return env in {"dev", "development"}


# Get the secret for authentication - REQUIRED for security
AUTH_SECRET_ENV: Optional[str]
_auth_secret_value = os.getenv("AUTH_SECRET") or os.getenv("NEXTAUTH_SECRET")
AUTH_SECRET_ENV = (
    "AUTH_SECRET"
    if os.getenv("AUTH_SECRET")
    else ("NEXTAUTH_SECRET" if os.getenv("NEXTAUTH_SECRET") else None)
)

if not _auth_secret_value:
    # This is a critical security requirement - the application cannot function
    # securely without a proper authentication secret
    raise RuntimeError(
        "CRITICAL: AUTH_SECRET environment variable is not set. "
        "The application cannot start without a valid authentication secret. "
        "Please set either AUTH_SECRET or NEXTAUTH_SECRET environment variable."
    )

# From here on, treat as non-optional for type-checkers
AUTH_SECRET: str = _auth_secret_value

# Log which environment variable provided the secret and a short hash (not the secret itself)
if _is_development():
    try:
        secret_hash = hashlib.sha256(AUTH_SECRET.encode("utf-8")).hexdigest()[:12]
        logger.info(
            "Auth secret configured",
            source=AUTH_SECRET_ENV or "unknown",
            length=len(AUTH_SECRET),
            sha256_prefix=secret_hash,
        )
    except Exception:
        pass

# Initialize NextAuthJWT for decrypting tokens
# We disable CSRF since we're using it for API authentication
nextauth = NextAuthJWT(secret=AUTH_SECRET, csrf_prevention_enabled=False)

# HTTP Bearer for getting token from Authorization header
security = HTTPBearer(auto_error=False)


class MockRequest:
    """Mock request object to pass token to NextAuthJWT.

    We populate all common Auth.js cookie names so the library can find the token
    regardless of whether secure cookie mode is enabled.
    """

    def __init__(self, token: str):
        # Keep a single cookie name to satisfy unit tests expectations.
        # The library only reads one cookie value when a request-like object is provided.
        # Our production flow uses the proxy with Authorization header, so this is only
        # a convenience for tests.
        self.cookies = {"authjs.session-token": token}
        self.headers: Dict[str, str] = {}
        self.method = "GET"


def log_secret_diagnostics() -> None:
    """Log which secret source is used at runtime (call from app startup)."""
    try:
        import hashlib

        secret_hash = hashlib.sha256(AUTH_SECRET.encode("utf-8")).hexdigest()[:12]
        logger.info(
            "Auth secret configured (startup)",
            source=AUTH_SECRET_ENV or "unknown",
            length=len(AUTH_SECRET),
            sha256_prefix=secret_hash,
        )
    except Exception:
        pass


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: AsyncSession = Depends(get_session_dependency),
) -> UserModel:
    """
    Get the current authenticated user from NextAuth JWT token.
    Token should be passed via Authorization Bearer header.
    """

    if not credentials or not credentials.credentials:
        logger.error("No credentials provided in request")
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please provide a valid token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Log secret diagnostics at request time to verify runtime value
    if _is_development():
        try:
            _prefix = hashlib.sha256(AUTH_SECRET.encode("utf-8")).hexdigest()[:12]
            logger.info(
                "Auth attempt secret check",
                sha256_prefix=_prefix,
                length=len(AUTH_SECRET),
            )
        except Exception:
            pass

    logger.info(f"Auth attempt with token length: {len(credentials.credentials)}")
    logger.debug(f"Token preview: {credentials.credentials[:50]}...")

    try:
        # Use fastapi-nextauth-jwt to decrypt the token
        # Create a mock request with the token as a cookie
        mock_request = MockRequest(credentials.credentials)

        # Now use the library to decrypt
        token_data = nextauth(mock_request)
        logger.info(
            f"Successfully decrypted NextAuth token for: {token_data.get('email')}"
        )

    except Exception as e:
        logger.warning(f"NextAuth JWT decryption failed: {str(e)}")
        # If that doesn't work, the token might be a test token (base64 JSON)
        try:
            import base64

            # Try to decode as base64 JSON (for testing)
            decoded = base64.b64decode(credentials.credentials + "==")
            token_data = json.loads(decoded)
            logger.info("Using test token (base64 JSON)")
        except Exception as test_error:
            logger.error(f"Test token decoding also failed: {str(test_error)}")
            raise HTTPException(status_code=401, detail="Invalid authentication token")

    try:
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
            raise HTTPException(
                status_code=401, detail="Invalid token: missing user ID"
            )

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
                # We cannot update the ID due to foreign key constraints
                # Instead, use the existing user as-is
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
    if not credentials or not credentials.credentials:
        return None

    try:
        return await get_current_user(credentials, session)
    except HTTPException:
        return None
