#!/usr/bin/env python3
"""Update project geo-targeting to NL (Netherlands)"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
PROJECT_IDS = [
    "bbcf46cf-6566-4389-a25a-be37ff43dfd4",
    "d29b2a19-4a5d-44d7-9ae1-a35a51b6f21f",
]

# New geo-targeting configuration for Netherlands
GEO_TARGETS_NL = [{"id": "geo-nl", "country": "NL", "percent": 100}]


def update_project_geo(token, project_id):
    """Update a project's geo-targeting to NL"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # First, get current project to preserve other settings
    get_url = f"{BASE_URL}/projects/{project_id}"
    response = requests.get(get_url, headers=headers)

    if response.status_code != 200:
        print(f"Failed to get project {project_id}: {response.status_code}")
        return False

    project = response.json()
    current_settings = project.get("settings", {})

    # Update geoTargets while preserving other settings
    current_settings["geoTargets"] = GEO_TARGETS_NL

    # Update the project
    update_url = f"{BASE_URL}/projects/{project_id}"
    payload = {"settings": current_settings}

    response = requests.put(update_url, headers=headers, json=payload)

    if response.status_code == 200:
        print(f"Updated project {project_id}: geo-targeting set to NL (Netherlands)")
        return True
    else:
        print(
            f"Failed to update project {project_id}: {response.status_code} - {response.text}"
        )
        return False


def main():
    # You'll need to provide a valid JWT token
    token = input("Enter your JWT token: ").strip()

    if not token:
        print("JWT token is required")
        return

    print(f"\nUpdating {len(PROJECT_IDS)} projects to NL geo-targeting...\n")

    success_count = 0
    for project_id in PROJECT_IDS:
        if update_project_geo(token, project_id):
            success_count += 1

    print(
        f"\nCompleted: {success_count}/{len(PROJECT_IDS)} projects updated successfully"
    )


if __name__ == "__main__":
    main()
