#!/usr/bin/env python3
"""
Create a sample project for 'testuser@traffic.com' with 10 visitors/min rate (approx 14,400 daily).
"""

import sys
import os
# Ensure we can import from local directory (backend)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
import json
import random

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./traffic_nexus.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_sample_project():
    db = SessionLocal()
    
    email = "testuser@traffic.com"
    target_url = "https://ladiscussione.com/"
    
    try:
        # Import models
        try:
            from models import User, Project
        except ImportError:
            import models
            User = models.User
            Project = models.Project
        
        # 1. Get User
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Error: User {email} not found! Please run create_generic_user.py first.")
            return

        # 2. Daily Limit Calculation
        # 10 visitors per minute * 60 min * 24 hours = 14,400 visitors/day
        daily_limit = 14400 
        
        # 3. Create Project
        # We use a flat hourly distribution for consistent traffic
        # Each hour gets roughly equal weight (100 / 24 ~= 4.16)
        flat_hours = {str(i): 4.16 for i in range(24)}
        
        new_project = Project(
            id=str(uuid.uuid4()),
            user_id=user.id,
            name="La Discussione Sample",
            status="active",
            daily_limit=daily_limit,
            total_target=100000, # Run for a week roughly
            hits_today=0,
            total_hits=0,
            settings={
                "url": target_url,
                "trafficSource": "google", # Default source
                "device_distribution": {"desktop": 60, "mobile": 40},
                "hours": flat_hours, # Custom flat curve
                "browser_preference": ["chrome", "safari"],
                "customSubpages": [
                    "https://ladiscussione.com/category/politica/",
                    "https://ladiscussione.com/category/economia/",
                    "https://ladiscussione.com/category/cultura/"
                ],
                "pagesPerVisitor": 3,
                "timeOnSite": "30-90",
                # Special flag for 10/min logic if we had it, but daily_limit + flat curve works
            }
        )
        
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        
        print("=" * 60)
        print("SAMPLE PROJECT CREATED SUCCESSFULLY!")
        print("=" * 60)
        print(f"Project ID: {new_project.id}")
        print(f"Name: {new_project.name}")
        print(f"Owner: {user.email}")
        print(f"Target: {target_url}")
        print(f"Rate: ~10 visitors/minute (Daily Limit: {daily_limit})")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error creating project: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_project()
