#!/usr/bin/env python3
"""
Fast traffic generator - sends 5000 hits to project gad
"""

import asyncio
import os
import sys

os.environ["DB_HOST"] = "localhost"
os.environ["DB_PORT"] = "5433"
os.environ["DB_USER"] = "trafficgen_user"
os.environ["DB_PASSWORD"] = "TrafficGen2026!"
os.environ["DB_NAME"] = "trafficgen"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from enhanced_hit_emulator import ga_emu_engine
from database import SessionLocal
import models

PROJECT_ID = "979c9589-a92f-4f45-9cc1-4f4d5f1bafb5"
TARGET_VISITORS = 5000
BATCH_SIZE = 10


async def send_traffic():
    print(f"Starting fast traffic generation: {TARGET_VISITORS} visitors")
    print("-" * 50)

    db = SessionLocal()
    project = db.query(models.Project).filter(models.Project.id == PROJECT_ID).first()
    if project:
        project.hits_today = 0
        project.total_hits = 0
        project.status = "active"
        db.commit()
    db.close()

    sent = 0
    while sent < TARGET_VISITORS:
        remaining = TARGET_VISITORS - sent
        batch = min(BATCH_SIZE, remaining)

        print(f"[{sent}/{TARGET_VISITORS}] Sending {batch} visitors...")
        await ga_emu_engine.run_for_project(PROJECT_ID, batch)

        sent += batch

        db = SessionLocal()
        project = (
            db.query(models.Project).filter(models.Project.id == PROJECT_ID).first()
        )
        if project:
            project.hits_today = sent
            project.total_hits = sent
            db.commit()
        db.close()

        asyncio.sleep(1)

    print("-" * 50)
    print(f"COMPLETED: Sent {sent} visitors!")


if __name__ == "__main__":
    asyncio.run(send_traffic())
