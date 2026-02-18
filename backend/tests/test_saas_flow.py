import pytest
import httpx
import uuid

BASE_URL = "http://localhost:8001"
TEST_EMAIL = "admin@traffic.com"
TEST_PASSWORD = "admin123"


@pytest.fixture
def auth_header():
    login_resp = httpx.post(
        f"{BASE_URL}/auth/token",
        data={"username": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health_check():
    resp = httpx.get(f"{BASE_URL}/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_user_profile(auth_header):
    unique_id = str(uuid.uuid4())[:8]

    resp = httpx.get(f"{BASE_URL}/users/me", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert "id" in data
    assert "balance" in data

    update_data = {
        "display_name": f"TestUser_{unique_id}",
        "country": f"Germany_{unique_id}",
        "city": f"Berlin_{unique_id}",
        "company": f"TestCorp_{unique_id}",
        "job_title": "Test Engineer",
        "bio": f"Test bio {unique_id}",
    }

    update_resp = httpx.put(
        f"{BASE_URL}/users/me", json=update_data, headers=auth_header
    )
    assert update_resp.status_code == 200, f"Profile update failed: {update_resp.text}"

    updated = update_resp.json()
    assert updated["country"] == update_data["country"], "Country not saved correctly"
    assert updated["city"] == update_data["city"], "City not saved correctly"
    assert updated["company"] == update_data["company"], "Company not saved correctly"

    verify_resp = httpx.get(f"{BASE_URL}/users/me", headers=auth_header)
    verified = verify_resp.json()
    assert verified["country"] == update_data["country"], (
        "Country not persisted correctly"
    )

    assert "email" in verified, "Email should be in response"
    assert isinstance(verified.get("balance"), (int, float)), (
        "Balance should be a number"
    )


def test_project_lifecycle(auth_header):
    # Create
    payload = {
        "name": "Integration Test Project",
        "plan_type": "Growth",
        "daily_limit": 1000,
        "total_target": 5000,
        "settings": {
            "bounceRate": 35,
            "geoTargets": [{"country": "FR", "percent": 100}],
        },
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
        "mode": "direct_hit",
    }
    start_resp = httpx.post(f"{BASE_URL}/start", json=payload, headers=auth_header)
    assert start_resp.status_code == 200
    assert "project_id" in start_resp.json()

    # Global Stop
    stop_resp = httpx.post(f"{BASE_URL}/stop", headers=auth_header)
    assert stop_resp.status_code == 200
    # Should stop at least 1 (the one we just started) or more if parallel tests running
    assert stop_resp.json()["count"] >= 1
