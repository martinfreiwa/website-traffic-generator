
from database import SessionLocal
import models

def list_users():
    db = SessionLocal()
    try:
        users = db.query(models.User).limit(10).all()
        for u in users:
            print(f"User: {u.email}, ID: {u.id}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
