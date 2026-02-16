import requests
import json
import sys

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@traffic.com"
# Note: Password might need to be reset if not known, but assuming default/known for now.
# Attempting with known test user credentials if admin fails, but admin is required for this endpoint.
ADMIN_PASSWORD = "admin123" 

def login(email, password):
    print(f"🔑 Logging in as {email}...")
    try:
        response = requests.post(f"{BASE_URL}/auth/token", data={
            "username": email,
            "password": password
        })
        if response.status_code != 200:
            print(f"❌ Login failed: {response.text}")
            return None
        return response.json()["access_token"]
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return None

def update_pricing(token):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Payload matching SystemSettingsUpdate model
    # We need to fetch existing settings first to not overwrite other things?
    # The endpoint updates the whole dictionary.
    
    # First, get current settings
    print("🔍 Fetching current settings...")
    try:
        get_res = requests.get(f"{BASE_URL}/settings", headers=headers)
        if get_res.status_code == 200:
            current_settings = get_res.json()["settings"]
        else:
            print("⚠️ Could not fetch settings, starting fresh.")
            current_settings = {}
    except:
        current_settings = {}

    # Define new pricing plan
    new_pricing = [
        {
            "id": "ecom-test",
            "name": "Economy Test",
            "hourlyRate": 0.50,
            "baseFee": 10.0,
            "examFee": 5.0
        }
    ]
    
    current_settings["pricingPlans"] = new_pricing
    
    payload = {"settings": current_settings}

    print("📝 Updating settings with new pricing...")
    response = requests.put(f"{BASE_URL}/settings", headers=headers, json=payload)
    
    if response.status_code == 200:
        print("✅ Update request successful")
        return new_pricing
    else:
        print(f"❌ Update failed: {response.status_code} - {response.text}")
        return None

def verify_pricing(token, expected_pricing):
    headers = {"Authorization": f"Bearer {token}"}
    
    print("🔍 Fetching settings to verify persistence...")
    response = requests.get(f"{BASE_URL}/settings", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Fetch failed: {response.status_code}")
        return False
        
    data = response.json()
    saved_plans = data.get("settings", {}).get("pricingPlans", [])
    
    if len(saved_plans) > 0 and saved_plans[0]["id"] == expected_pricing[0]["id"]:
        print(f"✅ Verified Pricing Plan: {saved_plans[0]['name']}")
        return True
    else:
        print(f"❌ Mismatch. Expected {expected_pricing}, got {saved_plans}")
        return False

if __name__ == "__main__":
    # We need an admin user.
    # If admin@traffic.com doesn't exist, we might fail.
    token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    
    if not token:
        print("⚠️  Admin login failed. Checking if we can use the generic test user (must be promoted to admin).")
        # Ensure test user is admin
        # This part requires direct DB manipulation if not already admin.
        # Check create_admin_user.py or similar.
        sys.exit(1)

    if token:
        expected = update_pricing(token)
        if expected:
            if verify_pricing(token, expected):
                print("\n🎉 GLOBAL PRICING PERSISTENCE TEST PASSED!")
            else:
                print("\n💥 PERSISTENCE TEST FAILED!")
