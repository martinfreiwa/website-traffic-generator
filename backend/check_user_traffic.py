#!/usr/bin/env python3
"""
Debug script to check a specific user's project and traffic status.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./traffic_nexus.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def check_user_project(user_id: str):
    db = SessionLocal()

    try:
        from models import User, Project, Transaction, TrafficLog, ProjectStats

        # 1. Check user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"ERROR: User not found with ID: {user_id}")
            return

        print("=" * 70)
        print(f"USER: {user.email}")
        print(f"User ID: {user.id}")
        print(f"Role: {user.role}")
        print(f"Balance Economy: {user.balance_economy}")
        print(f"Balance Professional: {user.balance_professional}")
        print(f"Balance Expert: {user.balance_expert}")
        print("-" * 70)

        # 2. Get user's projects
        projects = db.query(Project).filter(Project.user_id == user.id).all()

        if not projects:
            print("NO PROJECTS FOUND FOR THIS USER!")
            return

        print(f"Found {len(projects)} project(s)")
        print("-" * 70)

        for project in projects:
            print(f"\nPROJECT: {project.name}")
            print(f"  ID: {project.id}")
            print(f"  Status: {project.status}")
            print(f"  Tier: {project.tier}")
            print(f"  Daily Limit: {project.daily_limit}")
            print(f"  Hits Today: {project.hits_today}")
            print(f"  Total Target: {project.total_target}")
            print(f"  Total Hits: {project.total_hits}")
            print(f"  Created: {project.created_at}")
            print(f"  Start At: {project.start_at}")
            print(f"  Expires At: {project.expires_at}")

            # Project settings summary
            settings = project.settings or {}
            geo_targets = settings.get("geoTargets", [])
            target_url = settings.get("targetUrl", "N/A")
            print(f"  Target URL: {target_url}")
            print(f"  Geo Targets: {geo_targets}")

            # 3. Check transactions for this tier
            if project.tier:
                tier = project.tier.lower()
                credit_trans = (
                    db.query(Transaction)
                    .filter(
                        Transaction.user_id == user.id,
                        Transaction.type == "credit",
                        Transaction.tier == tier,
                    )
                    .all()
                )

                debit_trans = (
                    db.query(Transaction)
                    .filter(
                        Transaction.user_id == user.id,
                        Transaction.type == "debit",
                        Transaction.tier == tier,
                    )
                    .all()
                )

                total_purchased = sum(t.hits or 0 for t in credit_trans)
                total_used = sum(t.hits or 0 for t in debit_trans)
                available = total_purchased - total_used

                print(f"\n  TIER ANALYSIS ({tier}):")
                print(f"    Purchased: {total_purchased}")
                print(f"    Used: {total_used}")
                print(f"    Available: {available}")

            # 4. Check recent traffic logs
            recent_logs = (
                db.query(TrafficLog)
                .filter(TrafficLog.project_id == project.id)
                .order_by(TrafficLog.timestamp.desc())
                .limit(10)
                .all()
            )

            print(f"\n  RECENT TRAFFIC LOGS ({len(recent_logs)} recent):")
            if recent_logs:
                for log in recent_logs:
                    print(
                        f"    {log.timestamp} | {log.event_type} | {log.status} | {log.country or 'N/A'}"
                    )
            else:
                print("    NO TRAFFIC LOGS FOUND")

            # 5. Check project stats
            recent_stats = (
                db.query(ProjectStats)
                .filter(ProjectStats.project_id == project.id)
                .order_by(ProjectStats.hour.desc())
                .limit(5)
                .all()
            )

            print(f"\n  PROJECT STATS (recent):")
            if recent_stats:
                for stat in recent_stats:
                    print(
                        f"    {stat.hour} | Visitors: {stat.total_visitors} | Successful: {stat.successful_hits}"
                    )
            else:
                print("    NO STATS FOUND")

            # 6. Determine if traffic is being sent
            print("\n  DIAGNOSIS:")
            issues = []

            if project.status != "active":
                issues.append(f"Project status is '{project.status}', not 'active'")

            if project.daily_limit <= 0:
                issues.append("Daily limit is 0 or not set")

            if project.hits_today >= project.daily_limit and project.daily_limit > 0:
                issues.append("Daily limit reached")

            if project.total_target > 0 and project.total_hits >= project.total_target:
                issues.append("Total target reached")

            if project.tier:
                if available <= 0:
                    issues.append(f"No {tier} balance available")

            if not target_url or target_url == "N/A":
                issues.append("No target URL configured")

            if not geo_targets:
                issues.append("No geo targets configured")

            if issues:
                print("    ISSUES FOUND:")
                for issue in issues:
                    print(f"      - {issue}")
            else:
                print("    ✅ Project appears ready to send traffic")

                # Check if scheduler should be running
                if project.status == "active":
                    print(
                        "    ℹ️  Project is ACTIVE - scheduler should be sending traffic"
                    )
                    print("    ℹ️  Check if scheduler process is running on server")

            print("-" * 70)

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    user_id = (
        sys.argv[1] if len(sys.argv) > 1 else "3adf5aa0-640f-4773-8472-f85289655204"
    )
    check_user_project(user_id)
