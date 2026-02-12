import requests

BASE_URL = "http://127.0.0.1:8001"
EMAIL = "support@traffic-creator.com"
PASSWORD = "1234"

def verify_fix():
    print(f"=== Verifying Fixes on {BASE_URL} ===")

    # 1. Login
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
        headers = {"Authorization": f"Bearer {token}"}
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    # 2. Check Simulator Status
    try:
        res = requests.get(f"{BASE_URL}/admin/simulator/status", headers=headers)
        if res.status_code == 200:
            data = res.json()
            is_running = data.get("is_running")
            print(f"✅ Simulator Status endpoint reachable.")
            print(f"   is_running: {is_running}")
            print(f"   Logs count: {len(data.get('logs', []))}")
            if is_running:
                print("   🎉 Engine is reporting as OPERATIONAL (Active).")
            else:
                print("   ⚠️ Engine is reporting as STOPPED.")
        else:
            print(f"❌ Failed to get status: {res.text}")
    except Exception as e:
        print(f"❌ Error checking status: {e}")

    # 3. Check TID Finder for ladiscussione.com
    target_url = "https://ladiscussione.com/"
    print(f"\nScanning {target_url} for TID...")
    try:
        res = requests.get(f"{BASE_URL}/find-tid", params={"url": target_url}, headers=headers)
        if res.status_code == 200:
            data = res.json()
            tid = data.get("tid")
            print(f"✅ TID Found: {tid}")
        else:
            print(f"❌ TID Scan Failed ({res.status_code}): {res.text}")
    except Exception as e:
        print(f"❌ Error scanning TID: {e}")

if __name__ == "__main__":
    verify_fix()
