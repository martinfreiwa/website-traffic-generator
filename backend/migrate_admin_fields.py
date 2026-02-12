import sqlite3
import os

db_path = '/Users/martin/ab/backend/traffic_nexus.db'

def update_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check existing columns
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]
    
    new_columns = [
        ("plan", "TEXT DEFAULT 'free'"),
        ("shadow_banned", "BOOLEAN DEFAULT 0"),
        ("is_verified", "BOOLEAN DEFAULT 0"),
        ("notes", "TEXT"),
        ("tags", "JSON DEFAULT '[]'"),
        ("ban_reason", "TEXT"),
        ("last_ip", "TEXT"),
        ("last_active", "DATETIME")
    ]
    
    for col_name, col_def in new_columns:
        if col_name not in columns:
            print(f"Adding column {col_name} to users table...")
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")
            
    conn.commit()
    conn.close()
    print("Database update complete.")

if __name__ == "__main__":
    update_db()
