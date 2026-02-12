import requests
import time
import json

BASE_URL = "http://localhost:8001"
# Using the admin credentials we verified earlier
EMAIL = "admin@trafficcreator.com" 
PASSWORD = "admin123"
TARGET_URL = "https://ladiscussione.com/"

def run_simulation_demo():
    print(f"=== Starting Demo Traffic ===")
    print(f"Target: {TARGET_URL}")
    print(f"Rate: 100 visitors/min")
    print(f"Duration: 1 minute")

    # 1. Login
    print("\n1. Logging in as Admin...")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/token",
            data={"username": EMAIL, "password": PASSWORD},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=5,
        )
        if response.status_code != 200:
            print(f"❌ Login Failed: {response.text}")
            return
        token = response.json().get("access_token")
        print("✅ Login Successful.")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    # 2. Start Simulation
    print("\n2. Launching Simulation...")
    payload = {
        "targets": [
            {
                "url": TARGET_URL,
                "title": "La Discussione Demo",
                # "tid": "G-XXXXXXXXXX" # Optional: Auto-fetch or Manual if needed
            }
        ],
        "visitors_per_min": 100,
        "duration_mins": 1,
        "mode": "direct_hit",
        "device_distribution": {"desktop": 50, "mobile": 50},
        "traffic_source_preset": "google" # Making it look a bit more realistic than direct
    }

    try:
        res = requests.post(f"{BASE_URL}/start", json=payload, headers=headers)
        if res.status_code == 200:
            data = res.json()
            print(f"✅ Simulation Started! Project ID: {data.get('project_id')}")
            print(f"✅ Status: {data.get('status')}")
        else:
            print(f"❌ Start Failed ({res.status_code}): {res.text}")
            return
    except Exception as e:
        print(f"❌ Error starting simulation: {e}")
        return

if __name__ == "__main__":
    run_simulation_demo()
