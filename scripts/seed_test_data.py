#!/usr/bin/env python3
"""
Seed test data for screenshot generation.
Uses SQLAlchemy to directly insert test data.
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database import User, Task, Base

# Configuration
TEST_USER_ID = os.getenv("NEXT_PUBLIC_TEST_USER_ID", "550e8400-e29b-41d4-a716-446655440000")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/todohouse_test")

# Convert sync URL to async
if DATABASE_URL.startswith("postgresql://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
else:
    ASYNC_DATABASE_URL = DATABASE_URL


async def seed_data():
    """Seed test data for screenshots"""
    print(f"🌱 Seeding test data...")
    print(f"📊 Database: {ASYNC_DATABASE_URL.split('@')[1]}")
    print(f"👤 Test user: {TEST_USER_ID}")
    
    # Create engine and session
    engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Check if user exists
            existing_user = await session.get(User, TEST_USER_ID)
            if not existing_user:
                # Create test user
                test_user = User(
                    id=TEST_USER_ID,
                    email="test@todohouse.app",
                    created_at=datetime.utcnow()
                )
                session.add(test_user)
                print("✅ Created test user")
            else:
                print("✅ Test user already exists")
                # Clear existing tasks for clean screenshots
                for task in existing_user.tasks:
                    await session.delete(task)
                print("🧹 Cleared existing tasks")
            
            # Create sample tasks
            tasks = [
                Task(
                    user_id=TEST_USER_ID,
                    title="Review pull request #42",
                    description="Review the new authentication feature implementation and provide feedback",
                    completed=False,
                    priority="high",
                    status="active",
                    created_at=datetime.utcnow() - timedelta(hours=2)
                ),
                Task(
                    user_id=TEST_USER_ID,
                    title="Update API documentation",
                    description="Add the new endpoints to the Swagger documentation",
                    completed=False,
                    priority="medium",
                    status="active",
                    created_at=datetime.utcnow() - timedelta(hours=4)
                ),
                Task(
                    user_id=TEST_USER_ID,
                    title="Fix database migration issue",
                    description="Investigate and fix the failing migration in the CI pipeline",
                    completed=False,
                    priority="high",
                    status="active",
                    created_at=datetime.utcnow() - timedelta(hours=6)
                ),
                Task(
                    user_id=TEST_USER_ID,
                    title="Write unit tests for auth module",
                    description="Add comprehensive unit tests for the authentication module",
                    completed=True,
                    priority="medium",
                    status="completed",
                    created_at=datetime.utcnow() - timedelta(days=1),
                    completed_at=datetime.utcnow() - timedelta(hours=8)
                ),
                Task(
                    user_id=TEST_USER_ID,
                    title="Deploy to staging environment",
                    description="Deploy the latest changes to the staging environment for QA testing",
                    completed=True,
                    priority="low",
                    status="completed",
                    created_at=datetime.utcnow() - timedelta(days=2),
                    completed_at=datetime.utcnow() - timedelta(days=1)
                ),
                Task(
                    user_id=TEST_USER_ID,
                    title="Research new UI component library",
                    description="Evaluate different component libraries for the upcoming redesign",
                    completed=False,
                    priority="low",
                    status="active",
                    created_at=datetime.utcnow() - timedelta(days=3)
                ),
            ]
            
            # Add all tasks
            for task in tasks:
                session.add(task)
            
            # Commit changes
            await session.commit()
            print(f"✅ Created {len(tasks)} sample tasks")
            
            # Verify data
            user = await session.get(User, TEST_USER_ID)
            if user:
                task_count = len([t for t in user.tasks])
                print(f"✅ Verified: User has {task_count} tasks")
            
        except Exception as e:
            print(f"❌ Error seeding data: {e}")
            await session.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_data())