import uuid
import pytest
import pytest_asyncio
from dotenv import load_dotenv
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

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
        id=test_user_id,
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
