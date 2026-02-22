from database import SessionLocal
import models
from main import ProjectResponse
from typing import List

db = SessionLocal()
users = db.query(models.User).all()

for user in users:
    projects = db.query(models.Project).filter(models.Project.user_id == user.id).all()
    try:
        validated = [ProjectResponse.model_validate(p) for p in projects]
        # print(f"User {user.email} OK ({len(projects)} projects)")
    except Exception as e:
        print(f"User {user.email} FAILED: {e}")
        for p in projects:
            try:
                ProjectResponse.model_validate(p)
            except Exception as pe:
                print(f"  Project {p.id} validation error: {pe}")
