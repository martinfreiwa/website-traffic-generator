import requests
import time
import json

BASE_URL = "http://localhost:8001"
EMAIL = "support@traffic-creator.com"
PASSWORD = "1234"
TARGET_URL = "https://ladiscussione.com/"

def run_simulation_test():
    print(f"=== Starting Simulation Test ===")
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

    # 2. Find TID (now unauthenticated in backend, but we need it for payload)
    print("\n2. Scanning for Tracking ID...")
    tid = "G-XXXXXXXXXX" # Default
    try:
        # User removed auth from this endpoint, so no headers needed, but keeping them doesn't hurt usually
        # unless user logic explicitly rejects specific headers (unlikely with FastAPI Depends removal)
        res = requests.get(f"{BASE_URL}/find-tid", params={"url": TARGET_URL})
        if res.status_code == 200:
            data = res.json()
            if data.get("tid"):
                tid = data.get("tid")
                print(f"✅ Found TID: {tid}")
            else:
                print("⚠️ No TID returned, using placeholder.")
        else:
            print(f"⚠️ TID Scan Failed: {res.status_code} {res.text}")
    except Exception as e:
        print(f"⚠️ Error scanning TID: {e}")

    # 3. Start Simulation
    print("\n3. Launching Simulation...")
    payload = {
        "targets": [
            {
                "url": TARGET_URL,
                "tid": tid,
                "title": "Test Simulation"
            }
        ],
        "visitors_per_min": 100,
        "duration_mins": 1,
        "mode": "direct_hit",
        "device_distribution": {"desktop": 50, "mobile": 50},
        "traffic_source_preset": "organic"
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

    # 4. Monitor Loop
    print("\n4. Monitoring Engine Status (5 seconds)...")
    for i in range(5):
        try:
            res = requests.get(f"{BASE_URL}/admin/simulator/status", headers=headers)
            if res.status_code == 200:
                data = res.json()
                is_running = data.get("is_running")
                logs = data.get("logs", [])
                
                print(f"   [{i+1}/5] Running: {is_running} | Logs: {len(logs)}")
                if logs:
                    latest = logs[0]
                    print(f"      Latest: [{latest.get('timestamp')}] {latest.get('message')}")
            else:
                print(f"   [{i+1}/5] Status Check Failed: {res.status_code}")
        except Exception as e:
            print(f"   Error: {e}")
        time.sleep(1)

if __name__ == "__main__":
    run_simulation_test()
