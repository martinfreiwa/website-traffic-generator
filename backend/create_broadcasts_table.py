import sqlite3
import os
import datetime
import uuid

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
    CREATE TABLE IF NOT EXISTS broadcasts (
        id VARCHAR PRIMARY KEY,
        title VARCHAR NOT NULL,
        message VARCHAR NOT NULL,
        type VARCHAR DEFAULT 'info',
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        action_url VARCHAR NULL,
        action_text VARCHAR NULL
    )
    """)
    
    conn.commit()
    conn.close()
    print("✨ Broadcasts table ready!")

if __name__ == "__main__":
    create_table()
