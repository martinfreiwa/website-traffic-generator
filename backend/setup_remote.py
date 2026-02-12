#!/usr/bin/env python3
"""
Setup User and Project on REMOTE Cloud Run instance via API.
"""
import requests
import time

REMOTE_URL = "https://traffic-gen-pro-203810083226.us-central1.run.app"
# REMOTE_URL = "http://localhost:8001" # Switch to this to test locally

USER_EMAIL = "testuser@traffic.com"
USER_PASS = "password123"

def setup_remote():
    print(f"Targeting: {REMOTE_URL}")
    
    # 1. Register User (or check if exists by trying login)
    print("Step 1: Creating User...")
    register_url = f"{REMOTE_URL}/auth/register"
    reg_data = {
        "email": USER_EMAIL,
        "password": USER_PASS,
        "name": "Test User",
        "confirm_password": USER_PASS # Add if API requires it, but current API schema used UserCreate which just has email/pass usually?
    }
    
    # Check current API schema for register:
    # class UserCreate(BaseModel): email, password, ref_code
    
    reg_payload = {
        "email": USER_EMAIL,
        "password": USER_PASS
    }
    
    res = requests.post(register_url, json=reg_payload)
    if res.status_code == 200:
        print("User registered successfully.")
    elif res.status_code == 400 and "already registered" in res.text:
        print("User already exists.")
    else:
        print(f"Registration failed: {res.status_code} {res.text}")
        
    # 2. Login to get Token
    print("Step 2: Logging in...")
    login_url = f"{REMOTE_URL}/auth/token"
    login_data = {
        "username": USER_EMAIL,
        "password": USER_PASS
    }
    res_login = requests.post(login_url, data=login_data)
    if res_login.status_code != 200:
        print(f"Login failed: {res_login.text}")
        return
        
    token = res_login.json()["access_token"]
    print("Login successful.")
    
    # 3. Create Project
    print("Step 3: Creating Project...")
    projects_url = f"{REMOTE_URL}/projects"
    headers = {"Authorization": f"Bearer {token}"}
    
    # Calculated flat hours for 24h
    flat_hours = {str(i): 4.16 for i in range(24)}
    
    project_payload = {
        "name": "La Discussione Sample (Cloud)",
        "plan_type": "pro",
        "daily_limit": 14400,
        "total_target": 100000,
        "settings": {
            "url": "https://ladiscussione.com/",
            "trafficSource": "google",
            "device_distribution": {"desktop": 60, "mobile": 40},
            "hours": flat_hours,
            "browser_preference": ["chrome", "safari"],
            "customSubpages": [
                "https://ladiscussione.com/category/politica/",
                "https://ladiscussione.com/category/economia/",
                "https://ladiscussione.com/category/cultura/"
            ],
            "pagesPerVisitor": 3,
            "timeOnSite": "30-90",
            "trafficSpeed": 80
        }
    }
    
    res_proj = requests.post(projects_url, json=project_payload, headers=headers)
    if res_proj.status_code == 200:
        p = res_proj.json()
        print(f"Project created: {p['name']} (ID: {p['id']})")
    else:
        print(f"Project creation failed: {res_proj.text}")

if __name__ == "__main__":
    setup_remote()
