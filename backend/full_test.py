import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_url_reachability():
    print("\n--- Testing URL Reachability ---")
    data = {"url": "https://www.google.com"}
    response = requests.post(f"{BASE_URL}/test-url", json=data)
    print(f"Status: {response.status_code}, Response: {response.json()}")
    assert response.status_code == 200
    assert response.json()["reachable"] == True

def test_find_tid():
    print("\n--- Testing GA4 TID Discovery ---")
    # Using a known site with GA4
    url = "https://www.betips.win/"
    response = requests.get(f"{BASE_URL}/find-tid?url={url}")
    print(f"Status: {response.status_code}, Response: {response.json()}")
    assert response.status_code == 200
    assert "G-" in response.json()["tid"]

def test_project_crud():
    print("\n--- Testing Project CRUD ---")
    # Create
    project_data = {
        "name": "Test Project",
        "description": "Integration Test",
        "visitors_per_min": 50,
        "targets": [{"url": "https://example.com", "tid": "G-TEST", "title": "Example"}]
    }
    response = requests.post(f"{BASE_URL}/projects", json=project_data)
    project = response.json()
    print(f"Created: {project}")
    project_id = project["id"]
    
    # List
    response = requests.get(f"{BASE_URL}/projects")
    projects = response.json()
    print(f"Total Projects: {len(projects)}")
    
    # Delete
    response = requests.delete(f"{BASE_URL}/projects/{project_id}")
    print(f"Deleted: {response.json()}")
    assert response.status_code == 200

def test_proxy_management():
    print("\n--- Testing Proxy Management ---")
    # Single Add
    proxy_data = {"url": "http://user:pass@1.2.3.4:5678", "country": "US"}
    response = requests.post(f"{BASE_URL}/proxies", json=proxy_data)
    proxy = response.json()
    print(f"Added Single: {proxy}")
    proxy_id = proxy["id"]

    # Bulk Add (Custom Format)
    bulk_data = {
        "proxies": [
            "92.204.164.15:9000@geonode_d0HRbZWDCV-type-residential-country-fr:92a8dcc4-52fe-445d-989c-5158a5f5ca09"
        ]
    }
    response = requests.post(f"{BASE_URL}/proxies/bulk", json=bulk_data)
    print(f"Bulk Add: {response.json()}")

    # Test Proxy (Fail case expected for 1.2.3.4)
    response = requests.post(f"{BASE_URL}/proxies/{proxy_id}/test")
    print(f"Test Result: {response.json()}")

    # Geonode Test
    geonode_data = {
        "username": "geonode_user",
        "password": "password123",
        "countries": ["FR", "DE"]
    }
    response = requests.post(f"{BASE_URL}/proxies/geonode", json=geonode_data)
    print(f"Geonode Result: {response.json()}")

    # Delete
    requests.delete(f"{BASE_URL}/proxies/{proxy_id}")
    print("Cleaned up single proxy")

def test_traffic_simulation():
    print("\n--- Testing Traffic Simulation ---")
    start_data = {
        "targets": [{"url": "https://www.betips.win/", "tid": "G-7R4BTC3HXH", "title": "Test Site"}],
        "visitors_per_min": 100,
        "duration_mins": 1,
        "mode": "direct_hit",
        "is_dry_run": True
    }
    response = requests.post(f"{BASE_URL}/start", json=start_data)
    print(f"Start: {response.json()}")
    
    time.sleep(3)
    
    # Check Stats
    response = requests.get(f"{BASE_URL}/stats")
    stats = response.json()
    print(f"Stats (Internal Counter): {stats.get('hit_stats')}")
    assert stats["is_running"] == True

    # Stop
    response = requests.post(f"{BASE_URL}/stop")
    print(f"Stop: {response.json()}")
    
    time.sleep(1)
    response = requests.get(f"{BASE_URL}/stats")
    assert response.json()["is_running"] == False

if __name__ == "__main__":
    try:
        test_url_reachability()
        test_find_tid()
        test_project_crud()
        test_proxy_management()
        test_traffic_simulation()
        print("\n✅ ALL TESTS PASSED!")
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
