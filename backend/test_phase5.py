import httpx
import time
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_phase5():
    print("--- Phase 5 Verification: Production Readiness ---")
    
    # 1. Setup User
    email = f"prod_{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"
    print(f"1. Registering User: {email}")
    httpx.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    
    resp = httpx.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    token = resp.json()["access_token"]
    jwt_headers = {"Authorization": f"Bearer {token}"}

    # 2. Test Admin Promotion (First User Bootstrap)
    print("2. Promoting User to Admin (Bootstrap)...")
    promote_resp = httpx.post(f"{BASE_URL}/admin/promote?target_email={email}", headers=jwt_headers)
    print(f"   Result: {promote_resp.json()}")
    assert "promoted" in promote_resp.json().get("status", "")

    # 3. Test API Key Generation
    print("3. Generating API Key...")
    key_resp = httpx.post(f"{BASE_URL}/auth/api-key", headers=jwt_headers)
    api_key = key_resp.json()["api_key"]
    print(f"   Success! Key: {api_key[:10]}...")

    # 4. Test Hybrid Auth (Access /users/me via API Key)
    print("4. Testing Hybrid Auth (X-API-KEY pulse)...")
    api_headers = {"X-API-KEY": api_key}
    me_resp = httpx.get(f"{BASE_URL}/users/me", headers=api_headers)
    if me_resp.status_code != 200:
        print(f"   FAILED: {me_resp.status_code} - {me_resp.text}")
        return
    print(f"   Access via Key: {me_resp.json()['email']}")
    assert me_resp.json()["email"] == email

    # 5. Test Admin Stats Access (Now as Admin)
    print("5. Testing Admin Stats Access...")
    stats_resp = httpx.get(f"{BASE_URL}/admin/stats", headers=jwt_headers)
    print(f"   Admin Stats: {stats_resp.json()['active_users']} users tracked.")
    assert "total_revenue" in stats_resp.json()

    # 6. Test Key Revocation
    print("6. Revoking API Key...")
    httpx.delete(f"{BASE_URL}/auth/api-key", headers=jwt_headers)
    revoked_resp = httpx.get(f"{BASE_URL}/users/me", headers=api_headers)
    print(f"   Access after revocation: {revoked_resp.status_code} (Expected 401)")
    assert revoked_resp.status_code == 401

    print("\n✅ PHASE 5 VERIFIED!")

if __name__ == "__main__":
    test_phase5()
