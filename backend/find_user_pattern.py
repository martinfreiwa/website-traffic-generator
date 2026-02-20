
from database import SessionLocal
import models

def find_user(pattern):
    db = SessionLocal()
    try:
        users = db.query(models.User).filter(models.User.email.ilike(f"%{pattern}%")).all()
        for u in users:
            print(f"Found: {u.email}, ID: {u.id}")
    finally:
        db.close()

if __name__ == "__main__":
    find_user("review")
