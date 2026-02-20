import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
from models import User, Transaction, SystemSettings

db = SessionLocal()
try:
    u = db.query(User).filter(User.email == 'alaminn729@gmail.com').first()
    if u:
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
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
