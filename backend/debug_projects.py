from database import SessionLocal
import models
from datetime import datetime

db = SessionLocal()
projects = db.query(models.Project).all()
print(f"Checking {len(projects)} projects")

for p in projects:
    print(f"\nID: {p.id}")
    fields = [
        'id', 'user_id', 'name', 'status', 'plan_type', 'tier', 'settings', 
        'daily_limit', 'total_target', 'hits_today', 'total_hits', 
        'start_at', 'created_at', 'expires_at', 'priority', 
        'force_stop_reason', 'is_hidden', 'internal_tags', 'notes', 'is_flagged'
    ]
    for field in fields:
        try:
            val = getattr(p, field)
            print(f"  {field}: {type(val)} = {val}")
        except Exception as e:
            print(f"  {field}: ERROR {e}")
