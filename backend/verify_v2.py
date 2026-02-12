
import requests
import time
import sys
import logging

BASE_URL = "http://localhost:8000"
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verifier")

def run():
    # 1. Register/Login
    email = f"test_{int(time.time())}@example.com"
    password = "password123"
    
    logger.info(f"Registering user {email}...")
    res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    if res.status_code != 200:
        logger.error(f"Registration failed: {res.text}")
        return
    
    # Login
    res = requests.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Create Project
    # Daily Limit 86400 => 1 hit per second
    project_payload = {
        "name": "Verify V2 Project",
        "daily_limit": 86400,
        "settings": {
            "targets": [
                {"url": "https://example.com/page1", "tid": "UA-123", "funnel": []},
                {"url": "https://example.com/page2", "tid": "UA-123", "funnel": []}
            ],
            "utm_tags": {"source": "verify_script", "medium": "test"},
            "device_distribution": {"desktop": 0, "mobile": 100, "tablet": 0},
            "traffic_source_preset": "direct"
        }
    }
    
    logger.info("Creating project...")
    res = requests.post(f"{BASE_URL}/projects", json=project_payload, headers=headers)
    if res.status_code != 200:
        logger.error(f"Create project failed: {res.text}")
        return
    
    project_id = res.json()["id"]
    logger.info(f"Project created: {project_id}")
    
    # 3. Start Project
    res = requests.post(f"{BASE_URL}/projects/{project_id}/start", headers=headers)
    logger.info("Project started. Waiting 15 seconds for scheduler to pick it up...")
    
    # Scheduler runs every 60s. We might miss the window or have to wait.
    # But hit_emulator needs trigger. Scheduler triggers it.
    # To test immediately, we might need to wait up to 60s. 
    # Or we can trigger the ad-hoc start endpoint? No that's for "TrafficStart" model.
    # We'll wait 65 seconds to be safe.
    
    for i in range(65):
        time.sleep(1)
        if i % 10 == 0: logger.info(f"Waiting... {i}s")
    
    # 4. Check Logs
    res = requests.get(f"{BASE_URL}/projects/{project_id}", headers=headers)
    p_data = res.json()
    hits = p_data.get("hits_today", 0)
    
    logger.info(f"Hits reported by API: {hits}")
    
    if hits > 0:
        logger.info("SUCCESS: Traffic generated!")
    else:
        logger.error("FAILURE: No traffic generated. (Scheduler might not have fired yet or daily_limit logic issue)")

if __name__ == "__main__":
    run()
