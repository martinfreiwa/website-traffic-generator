#!/usr/bin/env python3
"""Send traffic to ladiscussione.com from Vietnam"""

import asyncio
import sys
import time

sys.path.insert(0, "/Users/martin/ab/backend")

from database import SessionLocal
import models
from hit_emulator import ga_emu_engine
import uuid

TARGET_URL = "https://ladiscussione.com/"
GA4_TID = "G-C5LL2KW5H4"
TARGET_COUNTRY = "Vietnam"

VISITORS = 200  # Send 200 visitors


def update_project():
    db = SessionLocal()

    user = db.query(models.User).first()
    if not user:
        print("No users found.")
        return None

    print(f"Using user: {user.email}")

    # Delete old project if exists
    old = (
        db.query(models.Project)
        .filter(models.Project.name == "Vietnam Traffic - ladiscussione.com")
        .first()
    )
    if old:
        db.delete(old)
        db.commit()

    # Create new project with Vietnam targeting
    project = models.Project(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="Vietnam Traffic - ladiscussione.com",
        status="active",
        daily_limit=10000,
        total_target=100000,
        settings={
            "targetUrl": TARGET_URL,
            "target_url": TARGET_URL,  # Both keys for compatibility
            "ga4Tid": GA4_TID,
            "ga4_id": GA4_TID,
            "trafficSource": "organic",
            "traffic_type": "organic",
            "deviceSplit": 50,
            "returningVisitorPct": 0,
            "trafficSpeed": 100,
            "geoTargets": [{"country": "VN", "percent": 100}],
            "geo_targeting": {"countries": ["VN"]},
            "funnel": [],
        },
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    print(f"Created project: {project.id}")
    print(f"Target: {TARGET_URL}")
    print(f"Country: {TARGET_COUNTRY} (VN)")

    db.close()
    return project.id


async def send_traffic(project_id: str, visitors: int):
    print(f"\nSending {visitors} visitors...")

    # Send in batches of 10
    batch_size = 10
    for i in range(0, visitors, batch_size):
        await ga_emu_engine.run_for_project(project_id, batch_size)
        print(f"Sent {min(i + batch_size, visitors)}/{visitors}...")
        await asyncio.sleep(1)  # Brief pause between batches

    print(f"\n=== COMPLETE ===")
    stats = ga_emu_engine.stats.get(project_id, {})
    print(f"Success: {stats.get('success', 0)}")
    print(f"Failure: {stats.get('failure', 0)}")
    print(f"Total:   {stats.get('total', 0)}")


if __name__ == "__main__":
    project_id = update_project()
    if project_id:
        asyncio.run(send_traffic(project_id, VISITORS))
