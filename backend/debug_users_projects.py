#!/usr/bin/env python3
"""
Debug script to list users and their projects to verify associations.
"""

import sys
import os
# Ensure we can import from local directory (backend)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./traffic_nexus.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def debug_data():
    db = SessionLocal()
    
    try:
        from models import User, Project
        
        users = db.query(User).all()
        print(f"Total Users: {len(users)}")
        print("-" * 60)
        
        for user in users:
            print(f"User: {user.email} (ID: {user.id}, Role: {user.role})")
            projects = db.query(Project).filter(Project.user_id == user.id).all()
            if projects:
                for p in projects:
                    print(f"  - Project: {p.name} (ID: {p.id})")
            else:
                print("  - No projects")
            print("-" * 60)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_data()
