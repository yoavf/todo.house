#!/usr/bin/env python3
"""
Seed data script that uses the same Supabase client as the backend
"""
import os
import sys
from datetime import datetime
from pathlib import Path

# Add backend to path so we can import the database module
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.database import supabase

TEST_USER_ID = os.getenv("TEST_USER_ID", "550e8400-e29b-41d4-a716-446655440000")
TEST_USER_EMAIL = "test-user@todo.house"

def create_user():
    """Create test user if it doesn't exist"""
    print(f"👤 Creating user {TEST_USER_ID}...")
    
    try:
        # Check if user exists
        existing = supabase.table("users").select("*").eq("id", TEST_USER_ID).execute()
        
        if existing.data:
            print("ℹ️  User already exists")
            return True
            
        # Create user
        user_data = {
            "id": TEST_USER_ID,
            "email": TEST_USER_EMAIL,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("users").insert(user_data).execute()
        print("✅ User created successfully")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create user: {e}")
        # Try to continue anyway
        return False

def create_tasks():
    """Create sample tasks"""
    print(f"📝 Creating tasks for user {TEST_USER_ID}...")
    
    tasks = [
        {
            "title": "Review pull request #42",
            "description": "Review the new authentication feature implementation",
            "completed": False,
            "user_id": TEST_USER_ID
        },
        {
            "title": "Update API documentation",
            "description": "Add the new endpoints to the Swagger documentation",
            "completed": False,
            "user_id": TEST_USER_ID
        },
        {
            "title": "Fix database migration",
            "description": "Investigate and fix the failing migration issue",
            "completed": False,
            "user_id": TEST_USER_ID
        },
        {
            "title": "Deploy hotfix to production",
            "description": "Deploy the authentication bug fix after QA approval",
            "completed": True,
            "user_id": TEST_USER_ID
        }
    ]
    
    success_count = 0
    for task in tasks:
        try:
            result = supabase.table("tasks").insert(task).execute()
            print(f"✅ Created: {task['title']}")
            success_count += 1
        except Exception as e:
            print(f"❌ Failed to create '{task['title']}': {e}")
    
    print(f"🎉 Created {success_count}/{len(tasks)} tasks!")
    return success_count > 0

def verify_data():
    """Verify the data was created"""
    print("📊 Verifying data...")
    
    try:
        tasks = supabase.table("tasks").select("*").eq("user_id", TEST_USER_ID).execute()
        print(f"✅ Found {len(tasks.data)} tasks for user")
        return True
    except Exception as e:
        print(f"❌ Failed to verify: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting seed data script...")
    print(f"📍 Using Supabase URL: {os.getenv('SUPABASE_URL', 'NOT SET')}")
    
    # Create user
    create_user()
    
    # Create tasks
    create_tasks()
    
    # Verify
    verify_data()
    
    print("✨ Done!")