import sys
import os

sys.path.insert(0, os.path.abspath('backend'))
from database import SessionLocal
from models import Project
from sqlalchemy import cast, String

db = SessionLocal()
try:
    domain = "ladiscussione.com"
    # SQLAlchemy way to search in JSON column as string
    proj = db.query(Project).filter(cast(Project.settings, String).like(f"%{domain}%")).first()
    if proj:
        print(f"Found project {proj.id} with domain {domain}")
    else:
        print("Not found")
finally:
    db.close()
