import requests
import json
import sys

BASE_URL = "http://localhost:8000"
USER_EMAIL = "testuser@traffic.com"
USER_PASSWORD = "password123"

def login():
    print(f"🔑 Logging in as {USER_EMAIL}...")
    try:
        response = requests.post(f"{BASE_URL}/auth/token", data={
            "username": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code != 200:
            print(f"❌ Login failed: {response.text}")
            return None
        return response.json()["access_token"]
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return None

def update_profile(token):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Random values to test
    update_data = {
        "job_title": "Senior Traffic Engineer",
        "company": "TrafficNexus Inc.",
        "bio": "Testing persistence.",
        "phone": "+1-555-0199",
        "public_profile": True,
        "developer_mode": True,
        "timezone": "Europe/Berlin",
        "language": "de"
    }

    print("📝 Updating profile with new values...")
    response = requests.put(f"{BASE_URL}/users/me", headers=headers, json=update_data)
    
    if response.status_code == 200:
        print("✅ Update request successful")
        return update_data
    else:
        print(f"❌ Update failed: {response.status_code} - {response.text}")
        return None

def verify_profile(token, expected_data):
    headers = {"Authorization": f"Bearer {token}"}
    
    print("🔍 Fetching profile to verify persistence...")
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Fetch failed: {response.status_code}")
        return False
        
    user_data = response.json()
    
    success = True
    for key, value in expected_data.items():
        actual_val = user_data.get(key)
        if actual_val == value:
            print(f"✅ {key}: {actual_val}")
        else:
            print(f"❌ {key}: Expected '{value}', got '{actual_val}'")
            success = False
            
    return success

if __name__ == "__main__":
    # Check if server is running
    try:
        requests.get(f"{BASE_URL}/health")
    except:
        print("⚠️  Backend server (localhost:8000) does not appear to be running.")
        print("Please start the server before running this test.")
        sys.exit(1)

    token = login()
    if token:
        expected = update_profile(token)
        if expected:
            if verify_profile(token, expected):
                print("\n🎉 PERSISTENCE TEST PASSED! DB and Models are in sync.")
            else:
                print("\n💥 PERSISTENCE TEST FAILED!")
