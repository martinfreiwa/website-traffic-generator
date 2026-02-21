import sys
import os
from sqlalchemy import func
from database import SessionLocal
import models

def test():
    db = SessionLocal()
    project_id = "541576d4-fc92-45ff-a091-407b103d13cc"
    
    try:
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        if not project:
            print("Project not found")
            return
            
        print(f"Project ID: {project.id}")
        print(f"User ID: {project.user_id}")
        print(f"Status: {project.status}")
        print(f"Daily Limit: {project.daily_limit}")
        print(f"Hits Today: {project.hits_today}")
        print(f"Tier: {project.tier}")
        
        user = db.query(models.User).filter(models.User.id == project.user_id).first()
        if not user:
            print("User not found!")
            return
            
        print("\n--- User ---")
        print(f"Email: {user.email}")
        print(f"Status: {user.status}")
        
        # Check tier balance
        balance_field = "balance"
        if project.tier == "economy":
            balance_field = "balance_economy"
        elif project.tier == "professional":
            balance_field = "balance_professional"
        elif project.tier == "expert":
            balance_field = "balance_expert"
            
        balance = getattr(user, balance_field, 0)
        print(f"{balance_field}: {balance}")
        
        # Has hits today exceeded limit?
        if project.hits_today >= project.daily_limit:
            print("WARNING: hits_today >= daily_limit")
            
        if balance <= 0:
            print("WARNING: User is out of balance for this tier!")
            
        print("\n--- Project Settings ---")
        print(project.settings)
            
    except Exception as e:
        print(e)

test()
