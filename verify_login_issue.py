import requests

BASE_URL = "http://127.0.0.1:8001"
EMAIL = "support@traffic-creator.com"
PASSWORD = "1234"


def test_login():
    form_data = {"username": EMAIL, "password": PASSWORD}

    print(f"Attempting login for {EMAIL} to {BASE_URL}...")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/token",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=5,
        )
        print(f"Login Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Login Failed: {response.text}")
            return

        token = response.json().get("access_token")
        print(f"Token received. Fetching /users/me...")

        me_response = requests.get(
            f"{BASE_URL}/users/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,
        )
        print(f"Me Status: {me_response.status_code}")
        print(f"Me Response: {me_response.text}")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    test_login()
