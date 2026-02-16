import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./traffic_nexus.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def debug_update():
    db = SessionLocal()
    try:
        # Import models
        try:
            from models import User
        except ImportError:
            import models
            User = models.User
        
        email = "testuser@traffic.com"
        print(f"🔍 Fetching user {email}...")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print("❌ User not found!")
            return

        print(f"👤 Found user: {user.id}")
        print(f"   Current company: {user.company}")
        print(f"   Current bio: {user.bio}")
        
        # Try to update
        print("📝 Attempting update...")
        user.company = "Debug Inc."
        user.bio = "Updated via debug script at " + str(datetime.datetime.now())
        
        db.commit()
        db.refresh(user)
        
        print("✅ Update successful!")
        print(f"   New company: {user.company}")
        print(f"   New bio: {user.bio}")

    except Exception as e:
        print(f"💥 Error during update: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    debug_update()
