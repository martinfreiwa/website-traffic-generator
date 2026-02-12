import requests

BASE_URL = "http://127.0.0.1:8000"
EMAIL = "support@traffic-creator.com"
PASSWORD = "1234"


def test_login_flow():
    print(f"=== Testing Login Flow for {EMAIL} on {BASE_URL} ===")

    form_data = {"username": EMAIL, "password": PASSWORD}

    try:
        print(f"1. Attempting login with password: {PASSWORD}")
        response = requests.post(
            f"{BASE_URL}/auth/token",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=5,
        )

        print(f"   Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"   FAILED: {response.text}")
            return False

        token_data = response.json()
        access_token = token_data.get("access_token")
        print(f"   SUCCESS: Token received.")

        print(f"2. Fetching user profile...")
        profile_res = requests.get(
            f"{BASE_URL}/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5,
        )

        print(f"   Status Code: {profile_res.status_code}")
        if profile_res.status_code == 200:
            user_info = profile_res.json()
            print(
                f"   SUCCESS: Logged in as {user_info.get('email')} with role: {user_info.get('role')}"
            )
            return True
        else:
            print(f"   FAILED: {profile_res.text}")
            return False

    except Exception as e:
        print(f"   ERROR during test: {e}")
        return False


if __name__ == "__main__":
    success = test_login_flow()
    if success:
        print("\n✅ LOGIN TEST PASSED")
    else:
        print("\n❌ LOGIN TEST FAILED")
