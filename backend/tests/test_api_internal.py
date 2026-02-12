import os
import sys
import pytest
from unittest.mock import MagicMock, patch, AsyncMock

# Set env var before importing database to use file-based DB for persistence
TEST_DB = "test_traffic_nexus.db"
if os.path.exists(TEST_DB):
    os.remove(TEST_DB)
os.environ["DATABASE_URL"] = f"sqlite:///./{TEST_DB}"
os.environ["JWT_SECRET_KEY"] = "test_secret"

# Import modules
import enhanced_scheduler
import enhanced_hit_emulator

# Patch scheduler and emulator
with patch("enhanced_scheduler.scheduler") as mock_scheduler, \
     patch("enhanced_hit_emulator.ga_emu_engine") as mock_emulator:
    
    mock_scheduler.start = AsyncMock()
    mock_scheduler.stop = AsyncMock()
    mock_scheduler.check_and_run = AsyncMock()
    
    mock_emulator.stats = {}
    mock_emulator.is_running = False
    mock_emulator.engine_logs = []

    from database import Base, engine, get_db, SessionLocal
    from main import app
    import models

    # Create tables
    Base.metadata.create_all(bind=engine)

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Dependency override
def override_get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_db():
    yield
    # Close engine connections to allow deletion
    engine.dispose()
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)

# Helper to get auth headers
def get_auth_header(email="test@example.com", password="password", role="user"):
    # Register
    client.post("/auth/register", json=    {
        "email": email,
        "password": password,
        "name": "Test User"
    })
    
    # Login
    response = client.post("/auth/token", data=    {
        "username": email,
        "password": password
    })
    if response.status_code != 200:
        # Fallback if already registered
        response = client.post("/auth/token", data=    {
            "username": email,
            "password": password
        })
    
    token = response.json().get("access_token")
    if not token:
        raise ValueError(f"Could not get token for {email}")
    
    # If admin needed, update in DB
    if role == "admin":
        with SessionLocal() as db:
            user = db.query(models.User).filter(models.User.email == email).first()
            if user:
                user.role = "admin"
                db.commit()
            
    return {"Authorization": f"Bearer {token}"}

class TestAPIs:
    def test_health(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_auth_flow(self):
        email = "auth_flow@example.com"
        password = "password123"
        
        # Register
        resp = client.post("/auth/register", json=    {
            "email": email,
            "password": password,
            "name": "Flow User"
        })
        assert resp.status_code == 200
        assert resp.json()["email"] == email

        # Login
        resp = client.post("/auth/token", data=    {
            "username": email,
            "password": password
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

        # Me
        token = resp.json()["access_token"]
        resp = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["email"] == email

    def test_projects_crud(self):
        headers = get_auth_header(email="project@example.com")
        
        # Create
        project_data = {
            "name": "Test Project",
            "plan_type": "Growth",
            "daily_limit": 1000,
            "total_target": 5000,
            "settings": {"test": "data"}
        }
        resp = client.post("/projects", json=project_data, headers=headers)
        assert resp.status_code == 200
        pid = resp.json()["id"]
        
        # List
        resp = client.get("/projects", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1
        
        # Get Detail
        resp = client.get(f"/projects/{pid}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Project"
        
        # Update
        resp = client.put(f"/projects/{pid}", json={"name": "Updated Name"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Name"
        
        # Start
        resp = client.post(f"/projects/{pid}/start", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "active"
        
        # Stop
        resp = client.post(f"/projects/{pid}/stop", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "stopped"

    def test_admin_endpoints(self):
        # Create admin user
        headers = get_auth_header(email="admin@example.com", role="admin")
        
        # Stats
        resp = client.get("/admin/stats", headers=headers)
        assert resp.status_code == 200
        assert "active_users" in resp.json()
        
        # Users
        resp = client.get("/admin/users", headers=headers)
        assert resp.status_code == 200
        
        # Proxies (Admin only)
        resp = client.post("/proxies", json={"url": "http://proxy:8080", "country": "US"}, headers=headers)
        assert resp.status_code == 200
        
        resp = client.get("/proxies")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_adhoc_traffic(self):
        headers = get_auth_header(email="adhoc@example.com")
        
        payload = {
            "targets": [{"url": "http://example.com"}],
            "visitors_per_min": 10,
            "duration_mins": 5,
            "mode": "direct_hit"
        }
        resp = client.post("/start", json=payload, headers=headers)
        assert resp.status_code == 200
        
        resp = client.post("/stop", headers=headers)
        assert resp.status_code == 200

    def test_billing_quote(self):
        resp = client.get("/billing/quote?amount=1000")
        assert resp.status_code == 200
        assert "estimated_visits" in resp.json()

    def test_find_tid(self):
        # Mock external call or expect error since we don't mock aiohttp here easily
        # Should now work without auth headers
        resp = client.get("/find-tid?url=invalid")
        # Should be 400 or 404 (likely 400 because aiohttp error)
        assert resp.status_code in [400, 404]

    def test_settings(self):
        # Settings is public read? Check main.py. Yes: @app.get("/settings") no depends
        resp = client.get("/settings")
        assert resp.status_code == 200
        
        headers = get_auth_header(email="settings@example.com", role="admin")
        resp = client.put("/settings", json={"settings": {"maintenance": True}}, headers=headers)
        assert resp.status_code == 200
        
        resp = client.get("/settings")
        assert resp.json()["settings"]["maintenance"] == True

if __name__ == "__main__":
    # Manually run tests if executed as script
    t = TestAPIs()
    t.test_health()
    t.test_auth_flow()
    t.test_projects_crud()
    t.test_admin_endpoints()
    t.test_adhoc_traffic()
    t.test_billing_quote()
    t.test_find_tid()
    t.test_settings()
    print("All tests passed!")