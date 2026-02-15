import os
import uuid
from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
sys.path.append(os.getcwd())
import models

DATABASE_URL = "sqlite:///./traffic_nexus.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()
pwd_context = CryptContext(schemes=["argon2"])

email = "admin@trafficcreator.com"
user = db.query(models.User).filter(models.User.email == email).first()
if not user:
    user = models.User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=pwd_context.hash("admin123"),
        role="admin",
        status="active"
    )
    db.add(user)
    db.commit()
    print("User admin@trafficcreator.com created with password admin123")
else:
    print("User admin@trafficcreator.com already exists")
db.close()
