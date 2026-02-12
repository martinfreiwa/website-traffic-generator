from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app, get_db
import models
import os

# Setup Test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_admin_features.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

models.Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_admin_features():
    print("--- Starting Admin Features Verification ---")
    
    # 1. Create Admin User
    admin_data = {"email": "admin@test.com", "password": "pass"}
    client.post("/auth/register", json=admin_data)
    
    # Promote to admin manually (since first user bootstrapping might be taken or conditional)
    db = TestingSessionLocal()
    user = db.query(models.User).filter(models.User.email == "admin@test.com").first()
    if user:
        user.role = "admin"
        db.commit()
    db.close()
    
    # Login Admin
    login_res = client.post("/auth/token", data={"username": "admin@test.com", "password": "pass"})
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.text}")
        exit(1)
        
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Admin Logged In")

    # 2. Create Target User
    user_data = {"email": "target@test.com", "password": "pass"}
    client.post("/auth/register", json=user_data)
    
    # Get Target User ID
    db = TestingSessionLocal()
    target_user = db.query(models.User).filter(models.User.email == "target@test.com").first()
    target_user_id = target_user.id
    db.close()
    print(f"✓ Target User Created: {target_user_id}")

    # 3. Create Project as Admin
    project_payload = {
        "user_id": target_user_id,
        "name": "Admin Created Project",
        "plan_type": "Custom",
        "daily_limit": 500,
        "total_target": 1000,
        "settings": {"mode": "visit", "targets": [{"url": "http://example.com"}]}
    }
    
    res = client.post("/admin/projects", json=project_payload, headers=headers)
    if res.status_code != 200:
        print(f"❌ Failed to create project: {res.text}")
        exit(1)
        
    project_data = res.json()
    assert project_data["name"] == "Admin Created Project"
    print("✓ Project Created via Admin API")

    # 4. Verify Project Ownership
    # Login as Target User
    login_res_user = client.post("/auth/token", data={"username": "target@test.com", "password": "pass"})
    token_user = login_res_user.json()["access_token"]
    headers_user = {"Authorization": f"Bearer {token_user}"}
    
    projects_res = client.get("/projects", headers=headers_user)
    user_projects = projects_res.json()
    # Check if we have the project. Note: user might have other projects if logic changes, but here clean DB.
    found = any(p["name"] == "Admin Created Project" for p in user_projects)
    assert found
    print("✓ Project Ownership Verified")

    # 5. Test Error Logging
    # Log an error
    error_payload = {
        "level": "ERROR",
        "message": "Test Frontend Crash",
        "context": {"browser": "Chrome"}
    }
    client.post("/admin/errors/log", json=error_payload, headers=headers) 
    
    # Fetch as Admin
    errors_res = client.get("/admin/errors", headers=headers)
    errors = errors_res.json()
    assert len(errors) >= 1
    assert errors[0]["message"] == "Test Frontend Crash"
    print("✓ Error Logging Verified")
    
    # Cleanup
    if os.path.exists("./test_admin_features.db"):
        os.remove("./test_admin_features.db")
    print("--- Verification Complete: SUCCESS ---")

if __name__ == "__main__":
    test_admin_features()
