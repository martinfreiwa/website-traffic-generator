import httpx
import time
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_phase2():
    # 0. Setup Referrer
    ref_email = f"referrer_{uuid.uuid4()}@example.com"
    print(f"Creating Referrer: {ref_email}")
    httpx.post(f"{BASE_URL}/auth/register", json={"email": ref_email, "password": "password", "name": "Referrer"})
    
    # Get referrer code
    resp = httpx.post(f"{BASE_URL}/auth/token", data={"username": ref_email, "password": "password"})
    token = resp.json()["access_token"]
    user_me = httpx.get(f"{BASE_URL}/users/me", headers={"Authorization": f"Bearer {token}"}).json()
    ref_code = user_me["affiliate_code"]
    print(f"   Referrer Code: {ref_code}")

    # 1. Register Referee
    referee_email = f"referee_{uuid.uuid4()}@example.com"
    print(f"1. Registering Referee: {referee_email}")
    resp = httpx.post(f"{BASE_URL}/auth/register", json={
        "email": referee_email,
        "password": "password",
        "name": "Referee",
        "ref_code": ref_code
    })
    referee_data = resp.json()
    print(f"   Success! Referred by ID: {referee_data.get('referred_by')}")

    # 2. Test Pricing Engine
    print("2. Testing Pricing Engine (Quote API)...")
    amounts = [50, 200, 500, 1000, 1500, 3000]
    for amt in amounts:
        resp = httpx.get(f"{BASE_URL}/billing/quote?amount={amt}")
        data = resp.json()
        print(f"   €{amt} -> Rate: {data['rate']:.6f} -> Est. Visits: {data['estimated_visits']}")

    # 3. Test Deposit & Affiliate Cut
    print(f"3. Simulating Deposit of €1000 for {referee_email}...")
    resp = httpx.post(f"{BASE_URL}/webhooks/deposit", json={
        "user_email": referee_email,
        "amount": 1000,
        "description": "Enterprise Topup"
    })
    print(f"   Status: {resp.json()['status']}, New Referee Balance: {resp.json()['new_balance']}")

    # Check Referrer Balance (should have €200 = 20% of €1000)
    user_me_updated = httpx.get(f"{BASE_URL}/users/me", headers={"Authorization": f"Bearer {token}"}).json()
    print(f"   Referrer Balance after commission: €{user_me_updated['balance']}")
    
    if user_me_updated['balance'] == 200:
        print("   VERIFIED: 20% Affiliate commission credited correctly.")
    else:
        print(f"   FAILED: Commission mismatch. Expected 200, got {user_me_updated['balance']}")

    # 4. Test Project Controls
    print("4. Testing Project Controls (Start/Stop)...")
    resp_login = httpx.post(f"{BASE_URL}/auth/token", data={"username": referee_email, "password": "password"})
    ref_token = resp_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {ref_token}"}
    
    # Create a project first
    p_resp = httpx.post(f"{BASE_URL}/projects", json={
        "name": "Live Toggle Test",
        "settings": {"target": "google.com"}
    }, headers=headers)
    p_id = p_resp.json()["id"]
    print(f"   Project Created: {p_id}")

    # Stop it
    resp = httpx.post(f"{BASE_URL}/projects/{p_id}/stop", headers=headers)
    print(f"   Action: Stop -> Status: {resp.json()['status']}")

    # Start it
    resp = httpx.post(f"{BASE_URL}/projects/{p_id}/start", headers=headers)
    print(f"   Action: Start -> Status: {resp.json()['status']}")

if __name__ == "__main__":
    try:
        test_phase2()
    except Exception as e:
        print(f"Error during test: {e}")
