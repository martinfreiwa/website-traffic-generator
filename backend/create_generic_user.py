#!/usr/bin/env python3
"""
Create a new generic user for testing.
"""

import sys
import os
# Ensure we can import from local directory (backend)
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
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_generic_user():
    db = SessionLocal()
    
    email = "testuser@traffic.com"
    password = "password123"
    
    try:
        # Import models
        try:
            from models import User
        except ImportError:
            # Fallback for direct run
            import models
            User = models.User
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User {email} already exists!")
            # Update password to be sure
            existing_user.password_hash = pwd_context.hash(password)
            db.commit()
            print(f"Password reset to: {password}")
            return
        
        # Create new user
        new_user = User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=pwd_context.hash(password),
            role="user",
            balance=100.0,
            status="active"
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print("=" * 60)
        print("GENERIC USER CREATED SUCCESSFULLY!")
        print("=" * 60)
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Role: {new_user.role}")
        print(f"Balance: {new_user.balance}")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error creating user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_generic_user()
