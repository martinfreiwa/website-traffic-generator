
from database import SessionLocal
import models

def find_user(email):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email.ilike(email)).first()
        if user:
            print(f"Found: {user.email}, ID: {user.id}")
        else:
            print("Not found")
    finally:
        db.close()

if __name__ == "__main__":
    find_user("nucularreview@gmail.com")
