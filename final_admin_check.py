import requests

# Port 8001 is where the active backend in /Users/martin/ab is running
BASE_URL = "http://127.0.0.1:8001"
EMAIL = "support@traffic-creator.com"
PASSWORD = "1234"


def test_admin_login():
    print(f"=== Final Admin Login Test ({BASE_URL}) ===")

    try:
        # 1. Get Token
        response = requests.post(
            f"{BASE_URL}/auth/token",
            data={"username": EMAIL, "password": PASSWORD},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=5,
        )

        if response.status_code != 200:
            print(f"❌ Login Failed (Status {response.status_code}): {response.text}")
            return

        token = response.json().get("access_token")
        print("✅ Login Successful. Token received.")

        # 2. Check Role
        me_res = requests.get(
            f"{BASE_URL}/users/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,
        )

        if me_res.status_code == 200:
            user = me_res.json()
            print(f"✅ User identified as: {user.get('email')}")
            print(f"✅ User role: {user.get('role')}")
            if user.get("role") == "admin":
                print("\n🎉 ADMIN ACCESS CONFIRMED")
            else:
                print("\n⚠️ User is not an admin.")
        else:
            print(f"❌ Failed to fetch user profile: {me_res.text}")

    except Exception as e:
        print(f"❌ Error during test: {e}")


if __name__ == "__main__":
    test_admin_login()
