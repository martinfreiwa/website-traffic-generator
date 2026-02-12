
import requests
import json
import uuid
import sys
import os

# Add backend path to sys.path to import models
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models # type: ignore

# Configuration
API_BASE_URL = "http://127.0.0.1:8000"
ADMIN_EMAIL = "admin_traffic@test.com"
ADMIN_PASS = "pass"
TARGET_URL = "https://ladiscussione.com/"
PROJECT_NAME = "La Discussione Verification"

# DB Setup for Role Promotion
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost/traffic_generator" # Assumptions based on context, or use sqlite if test mode. 
# actually, let's look at verify_admin_features.py again, it used sqlite test db, but here we are hitting a running server which likely uses a real DB or file.
# The running server is using main:app. Let's assume standard local connection or try to rely on "first user is admin" logic if feasible.
# BETTER: Use the same technique as verify_admin_features.py but we need to know WHERE the running server DB is. 
# If simpler, I will just use the 'create_admin.py' logic or similar.
# Let's try to just run a quick script to promote the user.

def promote_user(email):
    # Connect to the SAME db the backend is using.
    # Matching backend/database.py default
    database_url = os.getenv("DATABASE_URL", "postgresql://localhost/trafficnexus")
    print(f"Connecting to DB: {database_url}")
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            user.role = "admin"
            db.commit()
            print(f"✓ Promoted {email} to admin")
        else:
            print(f"⚠️ User {email} not found for promotion")
    except Exception as e:
        print(f"⚠️ DB Promotion failed: {e}")
    finally:
        db.close()

def verify_flow():
    print("--- Starting TrafficCreator Flow Verification ---")
    
    # 1. Start session
    session = requests.Session()

    # 2. Register/Login Admin
    print(f"1. Authenticating Admin ({ADMIN_EMAIL})...")
    # Try register first
    try:
        session.post(f"{API_BASE_URL}/auth/register", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASS, "name": "Admin Tester"
        })
    except: 
        pass # Might exist
        
    # Login
    login_res = session.post(f"{API_BASE_URL}/auth/token", data={
        "username": ADMIN_EMAIL, "password": ADMIN_PASS
    })
    
    if login_res.status_code != 200:
        print(f"❌ Login failed: {login_res.text}")
        exit(1)
        
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Admin Logged In")

    # 3. Register Target User
    target_email = f"user_{uuid.uuid4().hex[:6]}@test.com"
    print(f"2. Creating Target User ({target_email})...")
    user_res = session.post(f"{API_BASE_URL}/auth/register", json={
        "email": target_email, "password": "pass", "name": "Target User"
    })
    if user_res.status_code != 200:
        print(f"❌ User creation failed: {user_res.text}")
        exit(1)
    
    # Needs to be found by ID for the admin call
    # In real app Admin searches, here we login as user to get ID or search.
    # We can fetch all users as admin to find the ID.
    
    # Ensure current user is admin role (hacky for test env if not set)
    # Note: In real env, first user is admin or pre-configured. 
    # This script assumes the logged in user HAS admin rights.
    # If not, this step checks.
    me_res = session.get(f"{API_BASE_URL}/users/me", headers=headers)
    me_data = me_res.json()
    if me_data["role"] != "admin":
        print("⚠️ Current user is not admin. Attempting to force role...")
        promote_user(ADMIN_EMAIL)
        # Login again to refresh token claims if needed (though role check is usually DB based on request)
        # But let's just proceed, next request will check DB.

    users_res = session.get(f"{API_BASE_URL}/admin/users", headers=headers)
    if users_res.status_code != 200:
        print(f"❌ Failed to fetch users (Permissions?): {users_res.text}")
        exit(1)
        
    all_users = users_res.json()
    target_user = next((u for u in all_users if u["email"] == target_email), None)
    if not target_user:
        print("❌ Target user not found in admin list")
        exit(1)
        
    target_user_id = target_user["id"]
    print(f"✓ Target User Found: {target_user_id}")
    
    # 4. Create Project for Target User
    print(f"3. Creating Project for {TARGET_URL}...")
    project_payload = {
        "user_id": target_user_id,
        "name": PROJECT_NAME,
        "visitors_per_min": 50,
        "mode": "visit",
        "settings": {
            "mode": "visit",
            "targets": [{
                "url": TARGET_URL,
                "title": "La Discussione",
                "tid": "G-TEST",
                "funnel": []
            }]
        }
    }
    
    create_res = session.post(f"{API_BASE_URL}/admin/projects", json=project_payload, headers=headers)
    if create_res.status_code != 200:
        print(f"❌ Project creation failed: {create_res.text}")
        exit(1)
        
    project_data = create_res.json()
    project_id = project_data["id"]
    print(f"✓ Project Created: {project_id}")
    
    # 5. Verify Project in Database
    # We can list projects for that user? Or simpler, list all projects if admin.
    print("4. Verifying Project Existence...")
    # Just checking the boolean 'active' essentially or presence
    if project_data["name"] != PROJECT_NAME:
        print("❌ Project Name Mismatch")
        exit(1)
        
    print("✓ Project Verified")
    
    # 6. Verify Error Logs (Optional, but part of feature)
    print("5. Testing Error Logging...")
    err_payload = {"level": "WARNING", "message": "Verification Script Error Log", "context": {}}
    session.post(f"{API_BASE_URL}/admin/errors/log", json=err_payload, headers=headers)
    
    err_res = session.get(f"{API_BASE_URL}/admin/errors?limit=5", headers=headers)
    logs = err_res.json()
    if not any(l["message"] == "Verification Script Error Log" for l in logs):
        print("❌ Error Log verification failed")
        exit(1)
        
    print("✓ Error Logging Verified")
    print("--- SUCCESS: TrafficCreator Admin Flow Verified ---")

if __name__ == "__main__":
    verify_flow()
