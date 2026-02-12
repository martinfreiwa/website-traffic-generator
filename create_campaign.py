import os
import sys
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import json

# Setup Database Connection
SQLALCHEMY_DATABASE_URL = "postgresql://localhost/trafficnexus"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Get Admin User
db = SessionLocal()
admin = db.execute(
    text("SELECT id FROM users WHERE email = 'admin@modus.com'")
).fetchone()

if not admin:
    print("Admin user not found")
    sys.exit(1)

admin_id = admin[0]

# Define Project Data
project_name = "La Discussione - GA Test"
target_url = "https://ladiscussione.com/"
ga_id = "G-C5LL2KW5H4"
total_visitors = 1000
cost = 10.00

settings = {
    "trafficSpeed": 80,
    "bounceRate": 15,
    "returnRate": 10,
    "deviceSplit": 70,
    "deviceSpecific": "All",
    "timeOnPage": "3 minutes",
    "timezone": "UTC",
    "language": "en-US",
    "languages": ["en-US"],
    "gaId": ga_id,
    "entryUrls": target_url,
    "innerUrls": "",
    "exitUrls": "",
    "autoCrawlEntry": True,
    "autoCrawlInner": False,
    "autoCrawlExit": False,
    "innerUrlCount": 0,
    "countries": ["US"],
    "geoTargets": [{"id": "geo-1", "country": "US", "percent": 100}],
    "trafficSource": "Organic, Google Search",
    "keywords": "attualità, politica, economia",
    "referralUrls": "",
    "sitemap": "",
    "shortener": "",
    "autoRenew": False,
    "cacheWebsite": False,
    "minimizeCpu": False,
    "randomizeSession": True,
    "antiFingerprint": True,
    "pageViewsWithScroll": 20,
    "clickExternal": 0,
    "clickInternal": 2,
}

expires_at = datetime.utcnow() + timedelta(days=30)

# Insert Project
project_id = str(uuid.uuid4())
insert_project_query = text("""
INSERT INTO projects (id, user_id, name, plan_type, status, expires_at, settings, daily_limit, total_target, created_at)
VALUES (:id, :user_id, :name, :plan_type, :status, :expires_at, :settings, :daily_limit, :total_target, :now);
""")

db.execute(
    insert_project_query,
    {
        "id": project_id,
        "user_id": admin_id,
        "name": project_name,
        "plan_type": "Custom",
        "status": "active",
        "expires_at": expires_at,
        "settings": json.dumps(settings),
        "daily_limit": 100,
        "total_target": total_visitors,
        "now": datetime.utcnow(),
    },
)

# Add Transaction
trx_id = str(uuid.uuid4())
insert_trx_query = text("""
INSERT INTO transactions (id, user_id, type, amount, description, status, created_at)
VALUES (:id, :user_id, :type, :amount, :description, :status, :now);
""")

db.execute(
    insert_trx_query,
    {
        "id": trx_id,
        "user_id": admin_id,
        "type": "debit",
        "amount": cost,
        "description": f"Campaign Setup: {project_name} (1000 Visitors)",
        "status": "completed",
        "now": datetime.utcnow(),
    },
)

# Update Balance
db.execute(
    text("UPDATE users SET balance = balance - :amount WHERE id = :user_id"),
    {"amount": cost, "user_id": admin_id},
)

db.commit()

print(f"Project created successfully with ID: {project_id}")
print(f"Target: {target_url}")
print(f"GA Tag: {ga_id}")
print(f"Visitors: {total_visitors}")

db.close()
