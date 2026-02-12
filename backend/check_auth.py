import models
import database
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

db = database.SessionLocal()
user = db.query(models.User).filter(models.User.email == "sarah@skynet.com").first()

if user:
    print(f"User found: {user.email}")
    is_valid = verify_password("password123", user.password_hash)
    print(f"Password 'password123' valid: {is_valid}")
else:
    print("User 'sarah@skynet.com' NOT found.")
