import httpx
import time
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_phase3_e2e():
    print("--- Phase 3 E2E Verification ---")
    
    # 1. Setup User
    email = f"e2e_{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"
    print(f"1. Registering User: {email}")
    httpx.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    
    resp = httpx.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Add Balance
    print(f"2. Adding Balance (€500)...")
    httpx.post(f"{BASE_URL}/webhooks/deposit", json={"user_email": email, "amount": 500})

    # 3. Add a Proxy
    print("3. Adding a Local-test Proxy...")
    # Using a fake proxy for logging purposes, the engine might fail actual hits but should log the attempt
    httpx.post(f"{BASE_URL}/proxies", json={"url": "http://1.2.3.4:8080", "country": "US"}, headers=headers)

    # 4. Create Project with complex JSON settings
    print("4. Creating Project with SaaS settings...")
    project_payload = {
        "name": "E2E Bridge Test",
        "settings": {
            "targetUrl": "https://www.betips.win/",
            "ga4Tid": "G-7R4BTC3HXH",
            "trafficSpeed": 100, # Max speed for test
            "deviceSplit": 70, # 70% mobile
            "geoTargets": [{"country": "US", "percent": 100}],
            "funnel": [
                {"url": "https://www.betips.win/about", "title": "About Page"},
                {"url": "https://www.betips.win/contact", "title": "Contact Page"}
            ]
        }
    }
    resp = httpx.post(f"{BASE_URL}/projects", json=project_payload, headers=headers)
    project_id = resp.json()["id"]
    print(f"   Success! Project ID: {project_id}")

    # 5. Wait for Scheduler
    print("5. Waiting for Scheduler to trigger burst (approx 65s)...")
    # The scheduler runs every 60s. We wait long enough to ensure it cycles once.
    time.sleep(70)

    # 6. Verify Traffic Logs
    print("6. Verifying Traffic Logs...")
    # We check logs in the DB via a simple query (we can add an endpoint for this or just check the pulses)
    # For testing, we'll check the count of logs for this project
    # Since we don't have a direct logs endpoint for users yet (part of Phase 4), we use the health or pulse check
    # Or just check the count via a new debug endpoint if needed.
    # Let's add a quick check via the project details if we were to expose it, 
    # but for now let's just assume if it worked, logs exist in the DB.
    
    # Let's try to read from the SSE pulse for a few seconds
    print("   Reading from Live Pulse...")
    try:
        with httpx.stream("GET", f"{BASE_URL}/admin/live-pulse", timeout=10) as response:
            for line in response.iter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    logs = json.loads(data)
                    if any(log["project_id"] == project_id for log in logs):
                        print("   VERIFIED: Live Pulse contains logs for this project!")
                        print("   Sample Log:", logs[0])
                        return
    except Exception as e:
        print(f"   Pulse check error: {e}")

    print("   FAILED: No logs found for this project in the expected timeframe.")

if __name__ == "__main__":
    import json
    try:
        test_phase3_e2e()
    except Exception as e:
        print(f"Error: {e}")
