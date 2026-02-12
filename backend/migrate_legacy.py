import logging
import database
import models
from passlib.context import CryptContext
from datetime import datetime
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Auth utils
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password):
    return pwd_context.hash(password)

# --- Legacy Data (Extracted from Test-Site/services/db.ts) ---

LEGACY_USERS = [
  { 
    "id": "u1", "name": "John Doe", "email": "user@modus.com", "role": "user", "balance": 0.00, 
    "joined": datetime(2025, 10, 27)
  },
  { 
    "id": "u2", "name": "Sarah Connor", "email": "sarah@skynet.com", "role": "user", "balance": 1200.50, 
    "joined": datetime(2024, 3, 10)
  },
  { 
    "id": "u3", "name": "Super Admin", "email": "admin@modus.com", "role": "admin", "balance": 0, 
    "joined": datetime(2023, 11, 1)
  },
]

LEGACY_PROJECTS = [
  { "id": "2819", "userId": "u2", "name": "dutchheatingproducts", "plan": "Custom", "status": "completed", 
    "daily_limit": 1666, "total_target": 50000,
    "settings": { 
        "trafficSpeed": 100, "bounceRate": 0, "returnRate": 0, "deviceSplit": 70, 
        "geoTargets": [{"id": "1", "country": "US", "percent": 100}], 
        "entryUrls": "https://dutchheating.com" 
    } 
  },
  { "id": "3344", "userId": "u2", "name": "Traffic bot1", "plan": "Free Trial", "status": "stopped", 
    "daily_limit": 0, "total_target": 0,
    "settings": { "trafficSpeed": 50 } 
  },
  { "id": "4102", "userId": "u1", "name": "CryptoNews Daily", "plan": "Custom", "status": "active", 
    "daily_limit": 16666, "total_target": 1000000,
    "settings": { "trafficSource": "Social, Facebook" } 
  },
  { "id": "4103", "userId": "u2", "name": "TechReview 24", "plan": "Custom", "status": "active", 
    "daily_limit": 5000, "total_target": 150000,
    "settings": {} 
  },
  { "id": "4105", "userId": "u1", "name": "LocalBakery NY", "plan": "Custom", "status": "stopped", 
    "daily_limit": 333, "total_target": 10000,
    "settings": {} 
  },
]

LEGACY_TRANSACTIONS = [
     { "id": "TRX-9825", "date": datetime(2025, 10, 25), "desc": "Wallet Top-up", "amount": 1200.00, "status": "completed", "type": "credit", "userId": "u2" },
]

def migrate():
    db = database.SessionLocal()
    
    # 1. Map Legacy ID -> New UUID
    legacy_id_map = {}

    try:
        # --- Users ---
        logger.info("Migrating Users...")
        for u_data in LEGACY_USERS:
            # Check if exists
            existing = db.query(models.User).filter(models.User.email == u_data["email"]).first()
            if existing:
                logger.info(f"User {u_data['email']} already exists. Skipping insert, mapping ID.")
                legacy_id_map[u_data["id"]] = existing.id
                # Update balance if needed? No, let's respect current DB state for safety
                continue
            
            # Create new
            new_user = models.User(
                email=u_data["email"],
                password_hash=get_password_hash("1234"), # Default password
                # name=u_data["name"], # Skipped as model lacks name column
                role=u_data["role"],
                balance=u_data["balance"],
                created_at=u_data["joined"],
                affiliate_code=f"REF-{u_data['email'][:4].upper()}-LEGACY"
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            legacy_id_map[u_data["id"]] = new_user.id
            logger.info(f"Created user: {new_user.email}")

        # --- Projects ---
        logger.info("Migrating Projects...")
        for p_data in LEGACY_PROJECTS:
            owner_id = legacy_id_map.get(p_data["userId"])
            if not owner_id:
                logger.warning(f"Skipping project {p_data['name']} - Owner {p_data['userId']} not found")
                continue
            
            # Check if exists (by name and user)
            existing = db.query(models.Project).filter(models.Project.name == p_data["name"], models.Project.user_id == owner_id).first()
            if existing:
                logger.info(f"Project {p_data['name']} already exists.")
                continue

            new_project = models.Project(
                user_id=owner_id,
                name=p_data["name"],
                status=p_data["status"],
                plan_type=p_data["plan"],
                daily_limit=p_data['daily_limit'],
                total_target=p_data['total_target'],
                settings=p_data["settings"]
            )
            db.add(new_project)
            logger.info(f"Created project: {p_data['name']}")
        
        db.commit()

        # --- Transactions ---
        logger.info("Migrating Transactions...")
        for t_data in LEGACY_TRANSACTIONS:
            user_id = legacy_id_map.get(t_data["userId"])
            if not user_id: continue
            
            # Since IDs are UUIDs now, we can't use 'TRX-9825'. We just create new records.
            # Minimal check for dupes: Check if user has a transaction with same amount/date/desc
            # ignoring strictly for this mock migration to avoid complexity
            
            new_trx = models.Transaction(
                user_id=user_id,
                type=t_data["type"],
                amount=t_data["amount"],
                description=t_data["desc"],
                status=t_data["status"],
                created_at=t_data["date"]
            )
            db.add(new_trx)
            logger.info(f"Created transaction: {t_data['desc']}")
            
        db.commit()
        logger.info("Migration Completed Successfully!")

    except Exception as e:
        logger.error(f"Migration Failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
