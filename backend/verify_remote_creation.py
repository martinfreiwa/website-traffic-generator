#!/usr/bin/env python3
"""
Diagnostic script to verify project creation on REMOTE env.
"""
import requests
import json
import uuid

REMOTE_URL = "https://traffic-gen-pro-203810083226.us-central1.run.app"
USER_EMAIL = "testuser@traffic.com"
USER_PASS = "password123"

def test_remote_create():
    print(f"Testing against: {REMOTE_URL}")
    
    # 1. Login
    print("\n[Authenticating]...")
    login_url = f"{REMOTE_URL}/auth/token"
    res = requests.post(login_url, data={"username": USER_EMAIL, "password": USER_PASS})
    
    if res.status_code != 200:
        print(f"❌ Login Failed: {res.status_code}")
        print(res.text)
        return
        
    token = res.json()["access_token"]
    print("✅ Login Successful. Token obtained.")
    
    # 2. Create Project
    print("\n[Creating Project]...")
    create_url = f"{REMOTE_URL}/projects"
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "name": f"Debug Project {uuid.uuid4().hex[:6]}",
        "plan_type": "basic",
        "daily_limit": 1000,
        "total_target": 5000,
        "settings": {
            "url": "https://example.com",
            "device_distribution": {"desktop": 100}
        }
    }
    
    res_create = requests.post(create_url, json=payload, headers=headers)
    
    if res_create.status_code == 200:
        print("✅ Project Created Successfully!")
        print(json.dumps(res_create.json(), indent=2))
    else:
        print(f"❌ Creation Failed: {res_create.status_code}")
        print(res_create.text)
        if res_create.status_code == 401:
            print("!!! AUTH ERROR DETECTED !!!")

if __name__ == "__main__":
    test_remote_create()
