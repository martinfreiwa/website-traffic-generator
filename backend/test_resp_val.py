from database import SessionLocal
import models
from sqlalchemy.orm import Session
from fastapi import Depends
from main import get_projects, get_current_user

db = SessionLocal()
user = db.query(models.User).filter(models.User.email == 'support@traffic-creator.com').first()

# Mocking Depends
class MockUser:
    id = user.id
    role = user.role

projects = db.query(models.Project).filter(models.Project.user_id == user.id).all()
print(f"Projects found: {len(projects)}")
print(f"Type of projects: {type(projects)}")

from pydantic import ValidationError
from main import ProjectResponse
from typing import List

try:
    # This is what FastAPI does
    validated = [ProjectResponse.model_validate(p) for p in projects]
    print("Validation OK")
except Exception as e:
    print(f"Validation FAILED: {e}")
