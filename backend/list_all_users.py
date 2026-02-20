
from database import SessionLocal
import models

def list_all_users():
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"User: {u.email}")
    finally:
        db.close()

if __name__ == "__main__":
    list_all_users()
