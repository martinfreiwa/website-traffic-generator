from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from passlib.context import CryptContext
import os

# Define the same pwd_context as in main.py
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Database setup
DB_URL = "sqlite:///traffic_nexus.db"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

email = "martin.freiwald.work@gmail.com"
password = "123456"
hashed = pwd_context.hash(password)

user = db.query(models.User).filter(models.User.email == email).first()
if user:
    print(f"Updating password for {email} using Argon2")
    user.password_hash = hashed
    db.commit()
    print(f"New hash: {user.password_hash}")
    print("Done.")
else:
    print("User not found.")
db.close()
