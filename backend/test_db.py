from database import SessionLocal
import models
db = SessionLocal()
user = db.query(models.User).filter(models.User.email == 'support@traffic-creator.com').first()
print(user.role if user else "Not found")
