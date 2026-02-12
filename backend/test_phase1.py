import httpx
import time
import uuid

BASE_URL = "http://localhost:8000"

def test_phase1():
    unique_email = f"test_{uuid.uuid4()}@example.com"
    password = "password123"
    
    print(f"Testing with email: {unique_email}")
    
    # 1. Register
    print("1. Registering User...")
    resp = httpx.post(f"{BASE_URL}/auth/register", json={
        "email": unique_email,
        "password": password,
        "name": "Test User"
    })
    if resp.status_code != 200:
        print(f"Failed to register: {resp.text}")
        return
    user_data = resp.json()
    print(f"   Success! ID: {user_data['id']}, Balance: {user_data['balance']}")
    
    # 2. Login
    print("2. Logging in...")
    resp = httpx.post(f"{BASE_URL}/auth/token", data={
        "username": unique_email,
        "password": password
    })
    if resp.status_code != 200:
        print(f"Failed to login: {resp.text}")
        return
    token_data = resp.json()
    token = token_data["access_token"]
    print(f"   Success! Token received.")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create Project
    print("3. Creating Project with JSONB Settings...")
    project_payload = {
        "name": "Test Campaign 1",
        "plan_type": "Agency",
        "settings": {
            "trafficSpeed": 80,
            "geoTargets": [{"country": "US", "percent": 50}, {"country": "DE", "percent": 50}],
            "deviceSplit": 70,
            "complex_nested_field": {"foo": "bar", "baz": [1, 2, 3]}
        },
        "daily_limit": 5000,
        "total_target": 100000
    }
    
    resp = httpx.post(f"{BASE_URL}/projects", json=project_payload, headers=headers)
    if resp.status_code != 200:
        print(f"Failed to create project: {resp.text}")
        return
    project_data = resp.json()
    print(f"   Success! Project ID: {project_data['id']}")
    print(f"   Retrieved Settings (Verify JSON): {project_data['settings']}")
    
    # 4. List Projects
    print("4. Listing Projects...")
    resp = httpx.get(f"{BASE_URL}/projects", headers=headers)
    projects = resp.json()
    print(f"   Success! Found {len(projects)} projects.")
    
    # Verify Content
    retrieved_project = projects[0]
    if retrieved_project["settings"]["geoTargets"][0]["country"] == "US":
        print("   VERIFIED: JSONB data integrity preserved.")
    else:
        print("   FAILED: JSONB data mismatch.")

if __name__ == "__main__":
    # Ensure server is running before executing this
    try:
        # Simple health check
        httpx.get(f"{BASE_URL}/health")
        test_phase1()
    except Exception as e:
        print(f"Server not running or error: {e}")
