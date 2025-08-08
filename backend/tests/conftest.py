import uuid
import pytest
import pytest_asyncio
from dotenv import load_dotenv
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import select
from datetime import datetime, timezone

# Load test environment variables before importing app
load_dotenv(".env.test", override=True)

from app.database import get_session_dependency, Base, User as UserModel  # noqa: E402
from app.main import app  # noqa: E402
from app.auth import get_current_user  # noqa: E402

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
    # Check if user already exists (might be created by mock_user)
    result = await db_session.execute(
        select(UserModel).where(UserModel.id == uuid.UUID(test_user_id))
    )
    existing_user = result.scalar_one_or_none()

    if not existing_user:
        # Create test user using SQLAlchemy
        db_user = UserModel(
            id=uuid.UUID(test_user_id),
            email=f"test-{test_user_id}@example.com",
            name="Test User",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        db_session.add(db_user)
        await db_session.commit()
        await db_session.refresh(db_user)

    yield test_user_id

    # Cleanup is handled by session rollback in db_session fixture


@pytest_asyncio.fixture
async def mock_user(test_user_id, db_session):
    """
    Create a mock user for testing that will be returned by get_current_user.
    Only creates the user if it doesn't already exist.
    """
    # Check if user already exists
    result = await db_session.execute(
        select(UserModel).where(UserModel.id == uuid.UUID(test_user_id))
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        return existing_user

    # Create test user in database
    db_user = UserModel(
        id=uuid.UUID(test_user_id),
        email=f"test-{test_user_id}@example.com",
        name="Test User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(db_user)
    await db_session.commit()
    await db_session.refresh(db_user)

    return db_user


@pytest_asyncio.fixture
async def client(db_session, mock_user):
    """
    Create an async test client for testing FastAPI endpoints.

    This fixture creates a new AsyncClient instance for each test,
    ensuring test isolation. The 'async with' statement ensures
    proper cleanup after each test.
    """

    # Override the database session dependency
    def override_get_db():
        return db_session

    # Mock the get_current_user dependency to return our test user
    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_session_dependency] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    # Clean up the overrides
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def unauthenticated_client(db_session):
    """
    Create an unauthenticated test client for testing auth requirements.

    This client only overrides the database session, not authentication,
    allowing us to test endpoints that require authentication.
    """

    # Override only the database session dependency
    def override_get_db():
        return db_session

    app.dependency_overrides[get_session_dependency] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    # Clean up the overrides
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def other_user(db_session):
    """Create another test user for isolation tests."""
    other_user_id = str(uuid.uuid4())
    other_user = UserModel(
        id=uuid.UUID(other_user_id),
        email=f"other-{other_user_id}@example.com",
        name="Other User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(other_user)
    await db_session.commit()
    await db_session.refresh(other_user)
    return other_user


@pytest_asyncio.fixture
async def other_user_client(db_session, other_user):
    """
    Create a test client authenticated as a different user.
    Used for testing user isolation.
    """

    # Create a client for the other user
    def override_get_db():
        return db_session

    async def override_get_current_user():
        return other_user

    # We need a separate app instance to avoid conflicts
    from app.main import app

    # Store and clear existing overrides
    original_overrides = app.dependency_overrides.copy()
    app.dependency_overrides.clear()

    # Set new overrides
    app.dependency_overrides[get_session_dependency] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    # Restore original overrides
    app.dependency_overrides = original_overrides


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
def auth_headers() -> dict:
    """
    Generate authorization headers for testing.

    Since we're mocking the get_current_user dependency in tests,
    the actual header value doesn't matter.
    """
    return {"Authorization": "Bearer test-token"}


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
        img = Image.new("RGB", (1, 1), color="red")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="JPEG")
        return img_bytes.getvalue()
    except ImportError:
        # Fallback to a more complete JPEG structure if PIL is not available
        # This is a minimal but valid JPEG file
        return (
            b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00"
            b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
            b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
            b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342"
            b"\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01"
            b"\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00"
            b"\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00"
            b"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
            b"\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa"
            b"\xff\xd9"
        )
