#!/usr/bin/env python3
"""
Seed data by bypassing RLS - create user via service role or just focus on tasks
"""
import os
import sys
from datetime import datetime
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from supabase import create_client, Client

# Use environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
TEST_USER_ID = os.getenv("TEST_USER_ID", "550e8400-e29b-41d4-a716-446655440000")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_KEY")
    sys.exit(1)

# Create client
print(f"🔌 Connecting to Supabase...")
print(f"🔑 Key type: {'SERVICE' if 'service_role' in SUPABASE_KEY else 'ANON' if 'anon' in SUPABASE_KEY else 'UNKNOWN'}")
print(f"🌐 URL: {SUPABASE_URL}")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def ensure_user_exists():
    """Ensure test user exists by directly inserting if needed"""
    print(f"👤 Ensuring user {TEST_USER_ID} exists...")
    
    # First check if user exists
    try:
        existing = supabase.table("users").select("*").eq("id", TEST_USER_ID).execute()
        if existing.data:
            print(f"✅ User already exists: {existing.data[0]}")
            return True
    except Exception as e:
        print(f"⚠️  Error checking user: {e}")
    
    # Try to create user
    try:
        user_data = {
            "id": TEST_USER_ID,
            "email": "test-user@todo.house",
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("users").insert(user_data).execute()
        print(f"✅ User created: {result.data}")
        return True
    except Exception as e:
        print(f"❌ Failed to create user: {e}")
        
        # Let's see what users exist
        try:
            all_users = supabase.table("users").select("id").execute()
            print(f"🔍 Found {len(all_users.data)} users in database")
            for u in all_users.data[:3]:
                print(f"   - {u['id']}")
        except:
            pass
            
        return False

def create_tasks():
    """Create sample tasks"""
    print(f"📝 Creating tasks...")
    
    # First clear existing tasks for clean screenshots
    try:
        supabase.table("tasks").delete().eq("user_id", TEST_USER_ID).execute()
        print("🧹 Cleared existing tasks")
    except:
        pass
    
    tasks = [
        {
            "title": "Review pull request #42",
            "description": "Review the new authentication feature implementation",
            "completed": False,
            "user_id": TEST_USER_ID,
            "priority": "high",
            "status": "active"
        },
        {
            "title": "Update API documentation", 
            "description": "Add the new endpoints to the Swagger documentation",
            "completed": False,
            "user_id": TEST_USER_ID,
            "priority": "medium",
            "status": "active"
        },
        {
            "title": "Fix database migration",
            "description": "Investigate and fix the failing migration issue",
            "completed": False,
            "user_id": TEST_USER_ID,
            "priority": "high",
            "status": "active"
        },
        {
            "title": "Deploy hotfix to production",
            "description": "Deploy the authentication bug fix after QA approval",
            "completed": True,
            "user_id": TEST_USER_ID,
            "priority": "low",
            "status": "completed"
        }
    ]
    
    success_count = 0
    for task in tasks:
        try:
            result = supabase.table("tasks").insert(task).execute()
            print(f"✅ Created: {task['title']}")
            success_count += 1
        except Exception as e:
            print(f"❌ Failed '{task['title']}': {e}")
    
    return success_count

if __name__ == "__main__":
    print("🚀 Seeding data with RLS bypass...")
    
    # Ensure user exists
    ensure_user_exists()
    
    # Create tasks
    count = create_tasks()
    
    print(f"✨ Done! Created {count} tasks")