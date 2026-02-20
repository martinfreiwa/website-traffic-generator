import sys
import os
sys.path.insert(0, os.path.abspath('backend'))
from database import SessionLocal
from models import User, Transaction, Project, SystemSettings

db = SessionLocal()
u = db.query(User).filter(User.email == 'alaminn729@gmail.com').first()
if getattr(u, 'id', None):
    print(f"User Balance: {u.balance}")
    print(f"Created At: {u.created_at}")
    print(f"Role: {u.role}")

    txs = db.query(Transaction).filter(Transaction.user_id == u.id).all()
    for tx in txs:
        print(f"TX: {tx.type}, {tx.amount}, {tx.description}, {tx.created_at}")

    sys_settings = db.query(SystemSettings).first()
    if sys_settings:
        print(f"System settings: {sys_settings.settings}")
else:
    print("User not found in DB")
db.close()
