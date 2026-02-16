#!/usr/bin/env python3
"""
Create a new admin user with a known password for testing.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./traffic_nexus.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def create_admin_user():
    db = SessionLocal()
    
    try:
        # Import models
        from models import User
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == "admin@traffic.com").first()
        if existing_user:
            print("User admin@traffic.com already exists!")
            print(f"Role: {existing_user.role}")
            return
        
        # Create new admin user
        admin_user = User(
            id=str(uuid.uuid4()),
            email="admin@traffic.com",
            password_hash=pwd_context.hash("admin123"),
            role="admin",
            balance=1000.0,
            api_key=None,
            affiliate_code=None,
            token_version=1
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("=" * 60)
        print("ADMIN USER CREATED SUCCESSFULLY!")
        print("=" * 60)
        print(f"Email: admin@traffic.com")
        print(f"Password: admin123")
        print(f"Role: {admin_user.role}")
        print(f"ID: {admin_user.id}")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
