
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import secrets

def setup_guide_api_key():
    db = SessionLocal()
    try:
        # The key from the guide
        GUIDE_KEY = "tgp_k7Y2j_JTvu1irFcrMkQeWCrihceaRC_He_UPKqoSh1c"
        
        # Check if any user has this key
        user = db.query(models.User).filter(models.User.api_key == GUIDE_KEY).first()
        if user:
            print(f"User with guide key already exists: {user.email}")
            return

        # If not, find an admin user to assign it to, or create a default user
        admin = db.query(models.User).filter(models.User.role == "admin").first()
        if admin:
            print(f"Assigning guide key to admin: {admin.email}")
            admin.api_key = GUIDE_KEY
            db.commit()
        else:
            # Create a default user if none exists
            print("No admin user found. Creating a default admin user with guide key.")
            new_user = models.User(
                email="support@traffic-creator.com",
                password_hash="$2b$12$gpOelYnKPw1njgFLPMKCFujEChVcLR/NoMY0OhSwfKQbVcIQdirMu", # Hash for '1234'
                role="admin",
                api_key=GUIDE_KEY,
                affiliate_code="REF-ADMIN-BASE"
            )
            db.add(new_user)
            db.commit()
            print("Created default admin user with guide key (support@traffic-creator.com / 1234).")
    finally:
        db.close()

if __name__ == "__main__":
    setup_guide_api_key()
