import pytest
import httpx
import uuid

# Configuration
BASE_URL = "http://localhost:8000"

@pytest.fixture
def unique_email():
    return f"test_{uuid.uuid4()}@example.com"

@pytest.fixture
def auth_header(unique_email):
    # 1. Register
    password = "password123"
    reg_resp = httpx.post(f"{BASE_URL}/auth/register", json={
        "email": unique_email,
        "password": password,
        "name": "Pytest User"
    })
    
    # Check if duplicate (might happen if uuid collision or reuse, unlikely) or success
    # If 400 email exists, try login (fallback for manual runs)
    if reg_resp.status_code == 400:
        pass
    else:
        assert reg_resp.status_code == 200

    # 2. Login
    login_resp = httpx.post(f"{BASE_URL}/auth/token", data={
        "username": unique_email,
        "password": password
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_check():
    resp = httpx.get(f"{BASE_URL}/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

def test_user_profile(auth_header):
    resp = httpx.get(f"{BASE_URL}/users/me", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert "id" in data
    assert data["balance"] == 0.0

def test_project_lifecycle(auth_header):
    # Create
    payload = {
        "name": "Integration Test Project",
        "plan_type": "Growth",
        "daily_limit": 1000,
        "total_target": 5000,
        "settings": {
            "trafficSpeed": 50,
            "geoTargets": [{"country": "FR", "percent": 100}]
        }
    }
    resp = httpx.post(f"{BASE_URL}/projects", json=payload, headers=auth_header)
    assert resp.status_code == 200
    p_id = resp.json()["id"]
    
    # List
    list_resp = httpx.get(f"{BASE_URL}/projects", headers=auth_header)
    assert list_resp.status_code == 200
    projects = list_resp.json()
    assert any(p["id"] == p_id for p in projects)
    
    # Start
    start_resp = httpx.post(f"{BASE_URL}/projects/{p_id}/start", headers=auth_header)
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "active"
    
    # Stop
    stop_resp = httpx.post(f"{BASE_URL}/projects/{p_id}/stop", headers=auth_header)
    assert stop_resp.status_code == 200
    assert stop_resp.json()["status"] == "stopped"

def test_adhoc_simulation(auth_header):
    # Test the global /start endpoint which implicitly creates a project
    payload = {
        "targets": [{"url": "http://example.com"}],
        "visitors_per_min": 10,
        "duration_mins": 5,
        "mode": "direct_hit"
    }
    start_resp = httpx.post(f"{BASE_URL}/start", json=payload, headers=auth_header)
    assert start_resp.status_code == 200
    assert "project_id" in start_resp.json()
    
    # Global Stop
    stop_resp = httpx.post(f"{BASE_URL}/stop", headers=auth_header)
    assert stop_resp.status_code == 200
    # Should stop at least 1 (the one we just started) or more if parallel tests running
    assert stop_resp.json()["count"] >= 1
