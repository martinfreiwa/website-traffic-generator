#!/usr/bin/env python3
"""
Fast traffic generator for a specific project - bypasses scheduler pacing
Sends 5000 hits within 2 hours (approximately 42 hits per minute)
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import psycopg2

CLOUD_SQL_HOST = "localhost"
CLOUD_SQL_PORT = "5433"
DB_NAME = "trafficgen"
DB_USER = "trafficgen_user"
DB_PASSWORD = "TrafficGen2026!"

PROJECT_ID = "979c9589-a92f-4f45-9cc1-4f4d5f1bafb5"
TARGET_VISITORS = 5000
CONCURRENT_BURST = 10


def get_db_connection():
    return psycopg2.connect(
        host=CLOUD_SQL_HOST,
        port=CLOUD_SQL_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )


async def send_traffic_fast():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, name, settings, status, daily_limit, total_target
        FROM projects WHERE id = %s
    """,
        (PROJECT_ID,),
    )

    project = cur.fetchone()
    if not project:
        print(f"Project {PROJECT_ID} not found!")
        return

    project_id, project_name, settings, status, daily_limit, total_target = project

    print(f"Project: {project_name}")
    print(f"Status: {status}")
    print(f"Settings: {settings}")

    from enhanced_hit_emulator import ga_emu_engine

    print(f"\n{'=' * 60}")
    print(f"Starting fast traffic: {TARGET_VISITORS} visitors")
    print(f"{'=' * 60}\n")

    cur.execute(
        """
        UPDATE projects 
        SET hits_today = 0, total_hits = 0, status = 'active'
        WHERE id = %s
    """,
        (PROJECT_ID,),
    )
    conn.commit()

    sent = 0
    batch_size = CONCURRENT_BURST

    while sent < TARGET_VISITORS:
        remaining = TARGET_VISITORS - sent
        current_batch = min(batch_size, remaining)

        print(f"[{sent}/{TARGET_VISITORS}] Sending {current_batch} visitors...")

        await ga_emu_engine.run_for_project(project_id, current_batch)

        sent += current_batch

        cur.execute(
            """
            UPDATE projects 
            SET hits_today = %s, total_hits = %s
            WHERE id = %s
        """,
            (sent, sent, PROJECT_ID),
        )
        conn.commit()

        await asyncio.sleep(1.0)

    print(f"\n{'=' * 60}")
    print(f"COMPLETED: Sent {sent} visitors")
    print(f"{'=' * 60}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    asyncio.run(send_traffic_fast())
