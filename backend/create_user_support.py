#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
import models

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./traffic_nexus.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def create_user():
    db = SessionLocal()
    email = "support@traffic-creator.com"
    password = "1234"
    
    try:
        # Check if user already exists
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            print(f"User {email} already exists. Updating password...")
            user.password_hash = pwd_context.hash(password)
            user.role = "admin" # Set as admin
            db.commit()
            print("Password and role updated.")
        else:
            print(f"Creating user {email}...")
            new_user = models.User(
                id=str(uuid.uuid4()),
                email=email,
                password_hash=pwd_context.hash(password),
                role="admin",
                balance=1000.0,
                status="active"
            )
            db.add(new_user)
            db.commit()
            print("User created successfully.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_user()
