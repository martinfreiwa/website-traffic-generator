import requests
import json
import os
import datetime

# Configuration
BASE_URL = "https://traffic-gen-pro-203810083226.us-central1.run.app"
ADMIN_EMAIL = "admin@trafficcreator.com"
ADMIN_PASSWORD = "admin123" 
OUTPUT_FILE = f"cloud_data_export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

def flatten_dict(d):
    return {k: str(v) for k, v in d.items()}

def run_export():
    print(f"Targeting: {BASE_URL}")
    print("Authenticating...")
    
    # 1. Login
    try:
        resp = requests.post(f"{BASE_URL}/auth/token", data={
            "username": ADMIN_EMAIL, 
            "password": ADMIN_PASSWORD
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            print("Please update ADMIN_EMAIL and ADMIN_PASSWORD in the script if these are incorrect.")
            return
            
        token = resp.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print("Authentication successful.")
    except Exception as e:
        print(f"Connection error: {e}")
        return

    full_dump = {
        "export_date": datetime.datetime.now().isoformat(),
        "source": BASE_URL,
        "data": {}
    }

    # 2. Fetch Data
    endpoints = {
        "users": "/admin/users",
        "projects": "/projects",
        "transactions": "/admin/transactions",
        "proxies": "/proxies",
        "tickets": "/tickets",
        # "notifications": "/notifications" # This is user-specific, might not get all as admin unless there's an admin endpoint
    }

    for name, path in endpoints.items():
        print(f"Exporting {name}...", end=" ")
        try:
            r = requests.get(f"{BASE_URL}{path}", headers=headers)
            if r.status_code == 200:
                data = r.json()
                full_dump["data"][name] = data
                print(f"OK ({len(data)} records)")
            else:
                print(f"Failed ({r.status_code})")
        except Exception as e:
            print(f"Error: {e}")

    # 3. Save to File
    try:
        with open(OUTPUT_FILE, "w") as f:
            json.dump(full_dump, f, indent=2)
        print(f"\nSUCCESS! Data exported to: {OUTPUT_FILE}")
        print(f"Size: {os.path.getsize(OUTPUT_FILE) / 1024:.2f} KB")
    except Exception as e:
        print(f"Failed to write file: {e}")

if __name__ == "__main__":
    run_export()
