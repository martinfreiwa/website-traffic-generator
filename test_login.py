#!/usr/bin/env python3
"""
Test script to verify login functionality via the API.
This script tests the authentication endpoints directly.
"""

import requests
import sys

# Configuration
BASE_URL = "http://127.0.0.1:8001"
# Available admin users from database:
# - admin@trafficcreator.com (role: admin) - NEWLY CREATED
# - support@traffic-creator.com (role: admin)
# - admin@modus.com (role: admin)
# - prod_c2654e@example.com (role: admin)
# - prod_4c0a31@example.com (role: admin)

TEST_EMAIL = "admin@trafficcreator.com"
TEST_PASSWORD = "admin123"

def test_health_check():
    """Test if the backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✓ Health check: {response.status_code}")
        print(f"  Response: {response.json()}")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False

def test_login():
    """Test login endpoint"""
    try:
        # Login using form data (OAuth2PasswordRequestForm format)
        form_data = {
            "username": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        print(f"\n[TEST] Attempting login with email: {TEST_EMAIL}")
        response = requests.post(
            f"{BASE_URL}/auth/token",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )
        
        print(f"[TEST] Login response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"✓ Login successful!")
            print(f"  Token received: {token[:20]}..." if token else "  No token!")
            
            # Test fetching user details
            print(f"\n[TEST] Fetching user details...")
            user_response = requests.get(
                f"{BASE_URL}/users/me",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5
            )
            print(f"[TEST] User details response: {user_response.status_code}")
            
            if user_response.status_code == 200:
                user_data = user_response.json()
                print(f"✓ User details fetched successfully!")
                print(f"  User ID: {user_data.get('id')}")
                print(f"  Email: {user_data.get('email')}")
                print(f"  Role: {user_data.get('role')}")
                return True
            else:
                print(f"✗ Failed to fetch user details: {user_response.text}")
                return False
        else:
            print(f"✗ Login failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError as e:
        print(f"✗ Connection error: Cannot connect to {BASE_URL}")
        print(f"  Error: {e}")
        return False
    except Exception as e:
        print(f"✗ Login test failed: {e}")
        return False

def test_register():
    """Test registration endpoint"""
    try:
        new_user = {
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "testpassword123"
        }
        
        print(f"\n[TEST] Attempting to register new user: {new_user['email']}")
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json=new_user,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"[TEST] Register response status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✓ Registration successful!")
            print(f"  Response: {response.json()}")
            return True
        elif response.status_code == 400:
            print(f"⚠ User may already exist: {response.text}")
            return True  # Not a failure, user exists
        else:
            print(f"✗ Registration failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Registration test failed: {e}")
        return False

def main():
    print("=" * 60)
    print("TRAFFIC CREATOR - LOGIN API TEST")
    print("=" * 60)
    print(f"\nBase URL: {BASE_URL}")
    print(f"Test Email: {TEST_EMAIL}")
    
    # Run tests
    results = []
    
    print("\n" + "-" * 40)
    print("1. Health Check")
    print("-" * 40)
    results.append(("Health Check", test_health_check()))
    
    print("\n" + "-" * 40)
    print("2. Login Test")
    print("-" * 40)
    results.append(("Login", test_login()))
    
    print("\n" + "-" * 40)
    print("3. Registration Test")
    print("-" * 40)
    results.append(("Registration", test_register()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{name:.<40} {status}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    print(f"\nTotal: {passed}/{total} tests passed")
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
