#!/usr/bin/env python3
"""
Diagnostic script for dashboard traffic display issues.
Run this on the production server to diagnose why traffic isn't showing.

Usage:
    python3 diagnose_dashboard.py <user_email>
    python3 diagnose_dashboard.py nucularreview@gmail.com
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./traffic_nexus.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def diagnose_user(email: str):
    db = SessionLocal()

    try:
        from models import User, Project, TrafficLog, Transaction

        print("=" * 80)
        print(f"DIAGNOSTIC REPORT FOR: {email}")
        print(f"Generated at: {datetime.utcnow().isoformat()}")
        print("=" * 80)

        # 1. Check user exists
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print("\n[ERROR] User not found in database!")
            print("Possible causes:")
            print("  - User email is misspelled")
            print("  - User was deleted")
            print("  - Database connection is wrong")
            return

        print(f"\n[USER FOUND]")
        print(f"  ID: {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Role: {user.role}")
        print(f"  Verified: {user.is_verified}")
        print(f"  Balance Economy: {user.balance_economy}")
        print(f"  Balance Professional: {user.balance_professional}")
        print(f"  Balance Expert: {user.balance_expert}")

        # 2. Check projects
        projects = db.query(Project).filter(Project.user_id == user.id).all()
        print(f"\n[PROJECTS] Found {len(projects)} project(s)")

        if not projects:
            print("  [WARNING] No projects found for this user!")
            print("  This explains why Total Hits Sent = 0")
            return

        for i, project in enumerate(projects, 1):
            print(f"\n  Project #{i}: {project.name or 'Unnamed'}")
            print(f"    ID: {project.id}")
            print(f"    Status: {project.status}")
            print(f"    Tier: {project.tier}")
            print(f"    Daily Limit: {project.daily_limit}")
            print(f"    Hits Today: {project.hits_today}")
            print(f"    Total Hits: {project.total_hits}")
            print(f"    Total Target: {project.total_target}")
            print(f"    Created: {project.created_at}")

            settings = project.settings or {}
            print(f"    Target URL: {settings.get('targetUrl', 'NOT SET')}")
            print(f"    GA4 TID: {settings.get('ga4Tid', 'NOT SET')}")
            print(f"    Geo Targets: {settings.get('geoTargets', [])}")

            # Check TrafficLog entries
            log_count = (
                db.query(TrafficLog).filter(TrafficLog.project_id == project.id).count()
            )
            success_count = (
                db.query(TrafficLog)
                .filter(
                    TrafficLog.project_id == project.id,
                    TrafficLog.status == "success",
                )
                .count()
            )
            failure_count = (
                db.query(TrafficLog)
                .filter(
                    TrafficLog.project_id == project.id,
                    TrafficLog.status != "success",
                )
                .count()
            )

            print(f"\n    [TRAFFIC LOGS]")
            print(f"      Total logs: {log_count}")
            print(f"      Success: {success_count}")
            print(f"      Failure/Error: {failure_count}")

            # Recent logs
            recent_logs = (
                db.query(TrafficLog)
                .filter(TrafficLog.project_id == project.id)
                .order_by(TrafficLog.timestamp.desc())
                .limit(5)
                .all()
            )

            if recent_logs:
                print(f"\n    [RECENT LOGS] (last 5)")
                for log in recent_logs:
                    print(
                        f"      {log.timestamp} | {log.event_type} | {log.status} | {log.country or 'N/A'}"
                    )
            else:
                print("    [WARNING] No traffic logs found for this project!")

            # Stats for last 30 days
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            stats = (
                db.query(
                    func.date(TrafficLog.timestamp).label("date"),
                    func.count().label("pageviews"),
                    func.count(
                        func.distinct(func.coalesce(TrafficLog.ip, TrafficLog.id))
                    ).label("visitors"),
                )
                .filter(
                    TrafficLog.project_id == project.id,
                    TrafficLog.timestamp >= thirty_days_ago,
                    TrafficLog.status == "success",
                )
                .group_by(func.date(TrafficLog.timestamp))
                .order_by(func.date(TrafficLog.timestamp).desc())
                .all()
            )

            print(f"\n    [DAILY STATS] (last 30 days)")
            if stats:
                total_visitors = sum(s.visitors for s in stats)
                print(f"      Total visitors (30d): {total_visitors}")
                print(f"      Days with traffic: {len(stats)}")
                print(f"      Last 5 days:")
                for s in stats[:5]:
                    print(
                        f"        {s.date}: {s.visitors} visitors, {s.pageviews} pageviews"
                    )
            else:
                print("      [WARNING] No stats found for last 30 days!")
                print("      This explains why the dashboard shows 0 traffic")

            # Diagnosis
            print(f"\n    [DIAGNOSIS]")
            issues = []

            if project.status != "active":
                issues.append(f"Project status is '{project.status}', not 'active'")

            if project.daily_limit <= 0:
                issues.append("Daily limit is 0 or not set")

            if project.hits_today >= project.daily_limit and project.daily_limit > 0:
                issues.append("Daily limit reached for today")

            if project.total_target > 0 and project.total_hits >= project.total_target:
                issues.append("Total target reached")

            tier = (project.tier or "economy").lower()
            balance = getattr(user, f"balance_{tier}", user.balance_economy) or 0
            if balance <= 0:
                issues.append(f"No {tier} balance available ({balance})")

            if not settings.get("targetUrl"):
                issues.append("No target URL configured")

            if not settings.get("ga4Tid"):
                issues.append("No GA4 Tracking ID configured")

            if log_count == 0:
                issues.append("No traffic logs exist for this project")

            if issues:
                print("      ISSUES FOUND:")
                for issue in issues:
                    print(f"        - {issue}")
            else:
                print("      [OK] Project appears correctly configured")

            if project.status == "active" and log_count == 0:
                print("\n      [CRITICAL] Project is ACTIVE but has NO traffic logs!")
                print("      This means the scheduler is not generating traffic.")
                print("      Check:")
                print("        1. Is the scheduler process running?")
                print("        2. Are there any errors in the scheduler logs?")
                print("        3. Is the proxy configuration correct?")

        # 3. Check transactions
        print(f"\n[TRANSACTIONS]")
        transactions = (
            db.query(Transaction)
            .filter(Transaction.user_id == user.id)
            .order_by(Transaction.created_at.desc())
            .limit(10)
            .all()
        )

        if transactions:
            print(f"  Found {len(transactions)} recent transactions")
            for t in transactions[:5]:
                print(
                    f"    {t.created_at} | {t.type} | {t.hits} hits | {t.tier} | {t.description}"
                )
        else:
            print("  No transactions found")

        # 4. Summary
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)

        total_project_hits = sum(p.total_hits or 0 for p in projects)
        total_logs = (
            db.query(TrafficLog)
            .filter(TrafficLog.project_id.in_([p.id for p in projects]))
            .count()
        )

        print(f"  Total Projects: {len(projects)}")
        print(
            f"  Active Projects: {len([p for p in projects if p.status == 'active'])}"
        )
        print(f"  Total Hits (project.total_hits sum): {total_project_hits}")
        print(f"  Total Traffic Logs: {total_logs}")

        if total_logs == 0:
            print("\n  [ROOT CAUSE] No traffic logs exist!")
            print("  The scheduler is not generating traffic for this user's projects.")
            print("  Check if the scheduler process is running and check for errors.")

        print("\n" + "=" * 80)

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "nucularreview@gmail.com"
    diagnose_user(email)
