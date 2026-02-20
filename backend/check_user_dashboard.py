import models
from database import SessionLocal
from sqlalchemy import text

def check_user_data(email):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print(f"User {email} not found")
            return

        print(f"User: {user.email}")
        print(f"ID: {user.id}")
        print(f"Balance: {user.balance}")
        print(f"XP: {user.gamification_xp}")
        print(f"Level: {user.gamification_level}")
        print(f"Total Spent: {user.gamification_total_spent}")
        print(f"Streak Days: {user.streak_days}")
        print(f"Streak Best: {user.streak_best}")
        print(f"Last Daily Bonus: {user.last_daily_bonus}")
        print(f"Streak Last Date: {user.streak_last_date}")

        projects = db.query(models.Project).filter(models.Project.user_id == user.id).all()
        print(f"Projects: {len(projects)}")
        for p in projects:
            print(f"  - Project: {p.name} ({p.id})")
            print(f"    Status: {p.status}")
            print(f"    Total Hits: {p.total_hits}")
            print(f"    Hits Today: {p.hits_today}")
            
            # Check TrafficLog count
            log_count = db.query(models.TrafficLog).filter(models.TrafficLog.project_id == p.id).count()
            print(f"    TrafficLog count: {log_count}")

    finally:
        db.close()

if __name__ == "__main__":
    check_user_data("nucularreview@gmail.com")
