import uuid
import pytest
import pytest_asyncio
from dotenv import load_dotenv
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from jose import jwt
from datetime import datetime, timezone, timedelta
import os

# Load test environment variables before importing app
load_dotenv(".env.test", override=True)

from app.database import get_session_dependency, Base, User as UserModel  # noqa: E402
from app.main import app  # noqa: E402

# Test database configuration
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
        echo=False,
    )

    yield engine

    # Cleanup
    await engine.dispose()


@pytest_asyncio.fixture
async def test_session_factory(test_engine):
    """Create a test session factory."""
    return async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


@pytest_asyncio.fixture
async def db_session(test_session_factory, test_engine):
    """Create a test database session."""
    # Create tables for each test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_session_factory() as session:
        yield session
        await session.rollback()

    # Drop tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def test_user_id():
    """Generate a unique user ID for each test."""
    return str(uuid.uuid4())


@pytest_asyncio.fixture
async def setup_test_user(test_user_id, db_session):
    """
    Create a test user in the database and clean up after test.
    This fixture ensures tests can create tasks without foreign key errors.
    """
    # Create test user using SQLAlchemy
    db_user = UserModel(
        id=uuid.UUID(test_user_id),
        email=f"test-{test_user_id}@example.com",
    )

    db_session.add(db_user)
    await db_session.commit()
    await db_session.refresh(db_user)

    yield test_user_id

    # Cleanup is handled by session rollback in db_session fixture


@pytest_asyncio.fixture
async def client(db_session):
    """
    Create an async test client for testing FastAPI endpoints.

    This fixture creates a new AsyncClient instance for each test,
    ensuring test isolation. The 'async with' statement ensures
    proper cleanup after each test.
    """

    # Override the database session dependency
    def override_get_db():
        return db_session

    app.dependency_overrides[get_session_dependency] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    # Clean up the override
    app.dependency_overrides.clear()


@pytest.fixture
def sample_todo():
    """
    Provide sample todo data for testing.

    Fixtures like this help keep test data consistent and
    make tests more readable by avoiding repetition.
    """
    return {
        "title": "Test Todo",
        "description": "This is a test todo item",
        "completed": False,
    }


@pytest.fixture
def test_jwt_token(test_user_id: str) -> str:
    """
    Generate a valid JWT token for testing.
    
    This mimics the JWT tokens that NextAuth creates.
    """
    # Get the secret from environment, matching what auth.py expects
    secret = os.getenv("JWT_SECRET") or os.getenv("NEXTAUTH_SECRET") or "test-secret-key-for-jwt-encoding"
    
    # Create a token payload similar to NextAuth
    payload = {
        "sub": str(test_user_id),  # Subject (user ID)
        "email": f"test-{test_user_id}@example.com",
        "name": "Test User",
        "picture": None,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    
    # Encode the token
    token = jwt.encode(payload, secret, algorithm="HS256")
    return token


@pytest.fixture
def auth_headers(test_jwt_token: str) -> dict:
    """
    Generate authorization headers with a valid JWT token.
    """
    return {
        "Authorization": f"Bearer {test_jwt_token}"
    }


@pytest.fixture
def sample_image_bytes():
    """
    Provide sample image bytes for testing image upload endpoints.
    
    This creates a minimal valid JPEG image for testing purposes.
    """
    # Create a simple 1x1 pixel JPEG image using PIL if available, otherwise use a mock
    try:
        from PIL import Image
        import io
        
        # Create a 1x1 pixel RGB image
        img = Image.new('RGB', (1, 1), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        return img_bytes.getvalue()
    except ImportError:
        # Fallback to a more complete JPEG structure if PIL is not available
        # This is a minimal but valid JPEG file
        return (
            b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00'
            b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t'
            b'\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a'
            b'\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342'
            b'\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01'
            b'\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa'
            b'\xff\xd9'
        )
