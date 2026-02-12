#!/usr/bin/env python3
"""
Verify API access for testuser@traffic.com
"""
import requests
import json

BASE_URL = "http://localhost:8001"

def verify():
    # 1. Login
    login_url = f"{BASE_URL}/auth/token"
    data = {
        "username": "testuser@traffic.com",
        "password": "password123" 
    }
    
    print(f"Logging in as {data['username']}...")
    try:
        res = requests.post(login_url, data=data)
        if res.status_code != 200:
            print(f"Login failed: {res.text}")
            return
            
        token = res.json()["access_token"]
        print("Login successful! Token acquired.")
        
        # 2. Get Projects
        projects_url = f"{BASE_URL}/projects"
        headers = {"Authorization": f"Bearer {token}"}
        
        print("Fetching projects...")
        res_p = requests.get(projects_url, headers=headers)
        
        if res_p.status_code == 200:
            projects = res_p.json()
            print(f"Projects found: {len(projects)}")
            for p in projects:
                print(f" - {p['name']} (ID: {p['id']})")
        else:
            print(f"Failed to fetch projects: {res_p.text}")

    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    verify()
