import requests
import json
import sys
import time

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@traffic.com"
ADMIN_PASSWORD = "admin123" 

def login():
    print(f"🔑 Logging in as {ADMIN_EMAIL}...")
    try:
        response = requests.post(f"{BASE_URL}/auth/token", data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            print(f"❌ Login failed: {response.text}")
            return None
        return response.json()["access_token"]
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return None

def test_pricing(token):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("\n--- Testing Global Pricing ---")
    
    # 1. Update Pricing
    new_pricing = [
        {
            "id": "verify-test",
            "name": "Verification Plan",
            "hourlyRate": 1.25,
            "baseFee": 15.0,
            "examFee": 0.0
        }
    ]
    
    # Get current settings to preserve other fields
    try:
        current_settings = requests.get(f"{BASE_URL}/settings", headers=headers).json().get("settings", {})
    except:
        current_settings = {}
        
    current_settings["pricingPlans"] = new_pricing
    
    print("📝 Updating pricing...")
    res = requests.put(f"{BASE_URL}/settings", headers=headers, json={"settings": current_settings})
    if res.status_code != 200:
        print(f"❌ Update failed: {res.status_code} - {res.text}")
        return False
        
    # 2. Verify Persistence
    print("🔍 Verifying pricing persistence...")
    res = requests.get(f"{BASE_URL}/settings", headers=headers)
    if res.status_code != 200:
        print(f"❌ Fetch failed: {res.status_code}")
        return False
        
    plans = res.json().get("settings", {}).get("pricingPlans", [])
    if len(plans) > 0 and plans[0]["id"] == "verify-test":
        print("✅ Pricing verified!")
        return True
    else:
        print(f"❌ Pricing mismatch: {plans}")
        return False

def test_broadcasts(token):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("\n--- Testing Broadcasts ---")
    
    # 1. Create Broadcast
    payload = {
        "title": "Test Broadcast",
        "message": "This is a test",
        "type": "info",
        "is_active": True
    }
    
    print("📝 Creating broadcast...")
    res = requests.post(f"{BASE_URL}/admin/broadcasts", headers=headers, json=payload)
    if res.status_code != 200:
        print(f"❌ Create failed: {res.status_code} - {res.text}")
        return False
    
    b_id = res.json()["id"]
    print(f"✅ Created broadcast {b_id}")
    
    # 2. List Broadcasts
    print("🔍 Listing broadcasts...")
    res = requests.get(f"{BASE_URL}/admin/broadcasts", headers=headers)
    if res.status_code != 200:
        print(f"❌ List failed: {res.status_code}")
        return False
        
    data = res.json()
    found = any(b["id"] == b_id for b in data)
    if not found:
        print("❌ Broadcast not found in list")
        return False
    print("✅ Broadcast found in list")
    
    # 3. Delete Broadcast
    print("🗑️ Deleting broadcast...")
    res = requests.delete(f"{BASE_URL}/admin/broadcasts/{b_id}", headers=headers)
    if res.status_code != 200:
        print(f"❌ Delete failed: {res.status_code} - {res.text}")
        return False
    print("✅ Broadcast deleted")
    
    return True

if __name__ == "__main__":
    token = login()
    if not token:
        sys.exit(1)
        
    p_ok = test_pricing(token)
    b_ok = test_broadcasts(token)
    
    if p_ok and b_ok:
        print("\n🎉 ALL BACKEND FEATURES VERIFIED!")
        sys.exit(0)
    else:
        print("\n💥 SOME TESTS FAILED!")
        sys.exit(1)
