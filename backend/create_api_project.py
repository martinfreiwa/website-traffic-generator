import sys, os, requests, json
from pprint import pprint

sys.path.insert(0, '/Users/martin/ab/backend')
from database import SessionLocal
import models
from dependencies import create_access_token
from datetime import timedelta

# 1. Get an admin token
db = SessionLocal()
admin = db.query(models.User).filter(models.User.role == 'admin').first()
if not admin:
    print("No admin user found")
    sys.exit(1)

access_token = create_access_token(
    data={"sub": admin.email, "role": admin.role}
)

headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# 2. Call the API to create a project
payload = {
    "name": "API Test Project (ladiscussione)",
    "plan_type": "custom",
    "tier": "professional",
    "daily_limit": 6000,
    "total_target": 60000,
    "user_email": admin.email,
    "deduct_credits": False,
    "settings": {
        "ga4Tid": "G-C5LL2KW5H4",
        "gaId": "G-C5LL2KW5H4",
        "entryUrls": "https://ladiscussione.com/",
        "targetUrl": "https://ladiscussione.com/",
        "geoTargets": [{"id": "geo-1", "country": "United States", "countryCode": "US", "percent": 100}],
        "proxyMode": "auto",
        "bounceRate": 40,
        "timeOnPage": "30 seconds",
    },
    "status": "active"
}

print("Creating project via API...")
resp = requests.post("http://localhost:8000/admin/projects", json=payload, headers=headers)
print("Response:", resp.status_code)
try:
    data = resp.json()
    pprint(data)
except:
    print(resp.text)
