import sqlite3
import os
import json
import datetime

DB_PATH = "traffic_nexus.db"

def create_table():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        return

    print(f"🔌 Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY,
        settings JSON DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Check if empty, insert default
    cursor.execute("SELECT count(*) FROM system_settings")
    count = cursor.fetchone()[0]
    
    if count == 0:
        print("📝 Inserting default settings...")
        default_settings = {
            "siteName": "Traffic Creator",
            "maintenanceMode": False, 
            "allowRegistrations": True, 
            "supportEmail": "support@traffic.com", 
            "minDeposit": 10,
            "pricingPlans": []
        }
        cursor.execute(
            "INSERT INTO system_settings (id, settings, updated_at) VALUES (?, ?, ?)",
            (1, json.dumps(default_settings), datetime.datetime.utcnow())
        )
        print("✅ Default settings created.")
    else:
        print("ℹ️  Settings already exist.")

    conn.commit()
    conn.close()
    print("✨ System Settings table ready!")

if __name__ == "__main__":
    create_table()
