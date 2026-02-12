import requests
import os
from datetime import datetime, timedelta
from jose import jwt

# Port 8000 process environment
SECRET_KEY = "dev"
ALGORITHM = "HS256"
BASE_URL = "http://127.0.0.1:8000"
EMAIL = "support@traffic-creator.com"


def generate_token(email):
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode = {"sub": email, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def test_bypass_login():
    print(f"=== Testing Manual Token Access for {EMAIL} on {BASE_URL} ===")

    token = generate_token(EMAIL)
    print(f"1. Generated manual token using SECRET_KEY='{SECRET_KEY}'")

    try:
        print(f"2. Fetching user profile with manual token...")
        profile_res = requests.get(
            f"{BASE_URL}/users/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,
        )

        print(f"   Status Code: {profile_res.status_code}")
        if profile_res.status_code == 200:
            user_info = profile_res.json()
            print(
                f"   SUCCESS: Identity confirmed as {user_info.get('email')} (Role: {user_info.get('role')})"
            )
            return True
        else:
            print(f"   FAILED: {profile_res.text}")
            return False

    except Exception as e:
        print(f"   ERROR: {e}")
        return False


if __name__ == "__main__":
    success = test_bypass_login()
    if success:
        print("\n✅ LOGIN BYPASS TEST PASSED (Backend accepts identity)")
    else:
        print("\n❌ LOGIN BYPASS TEST FAILED")
