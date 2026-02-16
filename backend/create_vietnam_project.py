#!/usr/bin/env python3
"""Create Vietnam traffic project for ladiscussione.com using Enhanced Emulator"""

import sys
import uuid
import requests

sys.path.insert(0, "/Users/martin/ab/backend")

BASE_URL = "http://localhost:8000"

TARGET_URL = "https://ladiscussione.com/"
GA4_TID = "GT-M3K8Z5S"
DAILY_LIMIT = 10000
TOTAL_TARGET = 100000


def login():
    """Login as test1@example.com and return auth token"""
    resp = requests.post(
        f"{BASE_URL}/auth/token",
        data={"username": "test1@example.com", "password": "password123"},
    )
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return None
    return resp.json()["access_token"]


def delete_existing_project(token: str):
    """Delete existing Vietnam traffic project if it exists"""
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/projects", headers=headers)
    if resp.status_code != 200:
        return

    projects = resp.json()
    for p in projects:
        if "Vietnam Traffic" in p.get("name", ""):
            print(f"Deleting existing project: {p['id']}")
            requests.delete(f"{BASE_URL}/projects/{p['id']}", headers=headers)


def create_project(token: str):
    """Create the Vietnam traffic project"""
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "name": "Vietnam Traffic - ladiscussione.com",
        "plan_type": "Professional",
        "tier": "professional",
        "daily_limit": DAILY_LIMIT,
        "total_target": TOTAL_TARGET,
        "settings": {
            "targets": [{"url": TARGET_URL, "tid": GA4_TID, "funnel": []}],
            "targetUrl": TARGET_URL,
            "target_url": TARGET_URL,
            "ga4Tid": GA4_TID,
            "ga4_id": GA4_TID,
            "trafficSource": "organic",
            "traffic_source_preset": "organic",
            "deviceSplit": 50,
            "device_distribution": {"desktop": 50, "mobile": 50, "tablet": 0},
            "returningVisitorPct": 0,
            "returning_visitor_pct": 10,
            "trafficSpeed": 100,
            "geoTargets": [{"country": "VN", "percent": 100}],
            "geo_targeting": {"countries": ["VN"]},
            "funnel": [],
            "bounce_rate_pct": 30,
            "timeOnPage": "2 minutes",
            "pagesPerVisitor": 3,
            "languages": ["vi-VN"],
        },
    }

    resp = requests.post(f"{BASE_URL}/projects", json=payload, headers=headers)

    if resp.status_code != 200:
        print(f"Failed to create project: {resp.text}")
        return None

    project = resp.json()
    print(f"\n{'=' * 50}")
    print(f"Project Created Successfully!")
    print(f"{'=' * 50}")
    print(f"  ID:           {project['id']}")
    print(f"  Name:         {project['name']}")
    print(f"  Status:       {project['status']}")
    print(f"  Daily Limit:  {project['daily_limit']:,}")
    print(f"  Total Target: {project['total_target']:,}")
    print(f"  Target URL:   {TARGET_URL}")
    print(f"  GA4 TID:      {GA4_TID}")
    print(f"{'=' * 50}\n")

    return project


def verify_scheduler_running():
    """Check if the backend server is running"""
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        if resp.status_code == 200:
            print("✓ Backend server is running")
            return True
    except:
        pass

    print("✗ Backend server is NOT running")
    print("\nPlease start the server with:")
    print("  cd /Users/martin/ab/backend")
    print("  uvicorn main:app --reload --port 8000")
    return False


def main():
    print("\n" + "=" * 50)
    print("  VIETNAM TRAFFIC PROJECT CREATOR")
    print("=" * 50 + "\n")

    if not verify_scheduler_running():
        sys.exit(1)

    token = login()
    if not token:
        print("Failed to login. Make sure test1@example.com exists.")
        sys.exit(1)

    print("✓ Logged in as test1@example.com")

    delete_existing_project(token)

    project = create_project(token)
    if not project:
        sys.exit(1)

    print("The enhanced scheduler will now deliver traffic automatically.")
    print("\nMonitor with:")
    print(f"  - GA4 Real-Time: https://analytics.google.com/")
    print(
        f"  - DB Query: sqlite3 backend/traffic_nexus.db \"SELECT COUNT(*) FROM traffic_log WHERE project_id='{project['id']}';\""
    )
    print(
        f"\nExpected: ~{DAILY_LIMIT // 1440} visitors/minute (varies by circadian pattern)"
    )


if __name__ == "__main__":
    main()
