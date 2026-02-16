import requests
import json
import uuid
import sys

BASE_URL = "http://localhost:8000"
TEST_EMAIL = "admin@traffic.com"
TEST_PASSWORD = "admin123"

def login():
    try:
        res = requests.post(f"{BASE_URL}/auth/token", data={"username": TEST_EMAIL, "password": TEST_PASSWORD})
        if res.status_code == 200:
            return res.json()["access_token"]
        print(f"Login failed: {res.text}")
        return None
    except Exception as e:
        print(f"Connection error: {e}")
        return None

def test_persistence(token):
    print("🚀 Starting User Profile Persistence Test")
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Generate random test data
    unique_id = str(uuid.uuid4())[:8]
    test_data = {
        "display_name": f"TestUser_{unique_id}",
        "bio": f"Bio for {unique_id}. Persistence check.",
        "phone": "+1-555-0199",
        "company": f"Corp {unique_id}",
        "vat_id": f"VAT-{unique_id}",
        "address": "123 Test Lane",
        "city": "Testville",
        "zip": "90210",
        "country": "United States",
        "website": f"https://example.com/{unique_id}",
        "job_title": "Chief Tester",
        "public_profile": True,
        "email_frequency": "daily",
        "login_notification_enabled": True,
        "newsletter_sub": False,
        "sound_effects": False,
        "accessibility": {
            "reduceMotion": True,
            "fontSize": "large",
            "compactMode": True,
            "colorBlindMode": True
        }
    }

    print(f"📝 Sending Update Payload for {TEST_EMAIL}...")
    print(json.dumps(test_data, indent=2))

    # Send Update
    update_res = requests.put(f"{BASE_URL}/users/me", headers=headers, json=test_data)
    
    if update_res.status_code != 200:
        print(f"❌ Update Request Failed: {update_res.status_code} - {update_res.text}")
        return False

    print("✅ Update Request Successful")

    # Fetch Data to Verify Persistence
    print("🔍 Fetching Profile to Verify...")
    get_res = requests.get(f"{BASE_URL}/users/me", headers=headers)
    
    if get_res.status_code != 200:
        print(f"❌ Fetch Request Failed: {get_res.status_code}")
        return False

    saved_data = get_res.json()
    
    # Compare Fields
    errors = []
    for key, expected_value in test_data.items():
        saved_value = saved_data.get(key)
        
        # Special handling for JSON fields if needed, but requests.json() handles dicts well
        if saved_value != expected_value:
            errors.append(f"Mismatch for '{key}': Expected '{expected_value}', Got '{saved_value}'")

    if errors:
        print("💥 Persistence Verification Failed:")
        for e in errors:
            print(f"   - {e}")
        return False
    else:
        print("🎉 All Profile Fields Persisted Successfully!")
        return True

if __name__ == "__main__":
    token = login()
    if token:
        if test_persistence(token):
            sys.exit(0)
        else:
            sys.exit(1)
    else:
        sys.exit(1)
