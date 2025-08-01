#!/usr/bin/env python3
"""
Seed test data for screenshot generation.
Uses SQLAlchemy to directly insert test data.
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy import select
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


def create_task_with_timestamps(user_id, title, description, completed, priority, status, created_delta=None):
    """Helper to create a task with proper timestamps for SQLite."""
    created = datetime.now(timezone.utc)
    if created_delta:
        created = created - created_delta
    
    return Task(
        user_id=uuid.UUID(user_id),
        title=title,
        description=description,
        completed=completed,
        priority=priority,
        status=status,
        created_at=created,
        updated_at=created
    )


async def seed_data():
    """Seed test data for screenshots"""
    print(f"🌱 Seeding test data...")
    # Handle different database URL formats
    if "@" in ASYNC_DATABASE_URL:
        db_info = ASYNC_DATABASE_URL.split('@')[1]
    else:
        db_info = ASYNC_DATABASE_URL.split('://')[1] if '://' in ASYNC_DATABASE_URL else ASYNC_DATABASE_URL
    print(f"📊 Database: {db_info}")
    print(f"👤 Test user: {TEST_USER_ID}")
    
    # Create engine and session
    engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Check if user exists
            existing_user = await session.get(User, uuid.UUID(TEST_USER_ID))
            if not existing_user:
                # Create test user
                test_user = User(
                    id=uuid.UUID(TEST_USER_ID),
                    email="test@todohouse.app",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                session.add(test_user)
                print("✅ Created test user")
            else:
                print("✅ Test user already exists")
                # Clear existing tasks for clean screenshots
                existing_tasks = await session.execute(
                    select(Task).where(Task.user_id == existing_user.id)
                )
                for task in existing_tasks.scalars():
                    await session.delete(task)
                print("🧹 Cleared existing tasks")
            
            # Create sample tasks
            tasks = [
                create_task_with_timestamps(
                    TEST_USER_ID,
                    "Fix leaky kitchen faucet",
                    "The kitchen faucet has been dripping - need to replace the washer or cartridge",
                    False,
                    "high",
                    "active",
                    timedelta(hours=2)
                ),
                create_task_with_timestamps(
                    TEST_USER_ID,
                    "Clean gutters before winter",
                    "Remove leaves and debris from gutters and downspouts to prevent ice dams",
                    False,
                    "medium",
                    "active",
                    timedelta(hours=4)
                ),
                create_task_with_timestamps(
                    TEST_USER_ID,
                    "Schedule HVAC annual maintenance",
                    "Call HVAC company to schedule yearly inspection and filter replacement",
                    False,
                    "high",
                    "active",
                    timedelta(hours=6)
                ),
                create_task_with_timestamps(
                    TEST_USER_ID,
                    "Replace smoke detector batteries",
                    "Test all smoke detectors and replace batteries in hallway and bedroom units",
                    True,
                    "medium",
                    "completed",
                    timedelta(days=1)
                ),
                create_task_with_timestamps(
                    TEST_USER_ID,
                    "Reseal bathroom caulk",
                    "Remove old caulk around tub and reseal to prevent water damage",
                    True,
                    "low",
                    "completed",
                    timedelta(days=2)
                ),
                create_task_with_timestamps(
                    TEST_USER_ID,
                    "Organize garage storage",
                    "Install wall hooks and shelving to better organize tools and seasonal items",
                    False,
                    "low",
                    "active",
                    timedelta(days=3)
                ),
            ]
            
            # Add all tasks
            for task in tasks:
                session.add(task)
            
            await session.commit()
            print(f"✅ Created {len(tasks)} sample tasks")
            
            # Verify data
            task_count = await session.execute(
                select(Task).where(Task.user_id == uuid.UUID(TEST_USER_ID))
            )
            print(f"📋 Total tasks in database: {len(task_count.scalars().all())}")
            
        except Exception as e:
            print(f"❌ Error seeding data: {e}")
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_data())