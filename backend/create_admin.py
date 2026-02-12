from passlib.context import CryptContext
from sqlalchemy.orm import Session
import models
from database import SessionLocal, engine

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_admin_user(email, password):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        hashed_password = get_password_hash(password)
        
        if user:
            print(f"User {email} already exists. Updating record...")
            user.password_hash = hashed_password
            user.role = "admin"
        else:
            print(f"Creating new admin user: {email}")
            user = models.User(
                email=email,
                password_hash=hashed_password,
                role="admin"
            )
            db.add(user)
        
        db.commit()
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user("support@traffic-creator.com", "1234")
