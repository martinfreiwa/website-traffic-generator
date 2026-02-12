
from database import SessionLocal, engine
import models
from sqlalchemy import text

def fix_null_hits():
    db = SessionLocal()
    try:
        # Update existing projects where hits_today or total_hits is NULL
        db.execute(text("UPDATE projects SET hits_today = 0 WHERE hits_today IS NULL"))
        db.execute(text("UPDATE projects SET total_hits = 0 WHERE total_hits IS NULL"))
        db.commit()
        print("Database fix complete: NULL hits values updated to 0.")
    except Exception as e:
        print(f"Error fixing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_null_hits()
