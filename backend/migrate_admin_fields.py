import sqlite3
import os

db_path = '/Users/martin/ab/backend/traffic_nexus.db'

def update_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Update Users Table
    cursor.execute("PRAGMA table_info(users)")
    user_columns = [row[1] for row in cursor.fetchall()]
    
    user_new_columns = [
        ("plan", "TEXT DEFAULT 'free'"),
        ("shadow_banned", "BOOLEAN DEFAULT 0"),
        ("is_verified", "BOOLEAN DEFAULT 0"),
        ("notes", "TEXT"),
        ("tags", "JSON DEFAULT '[]'"),
        ("ban_reason", "TEXT"),
        ("last_ip", "TEXT"),
        ("last_active", "DATETIME")
    ]
    
    for col_name, col_def in user_new_columns:
        if col_name not in user_columns:
            print(f"Adding column {col_name} to users table...")
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists in users.")

    # 2. Update Projects Table
    cursor.execute("PRAGMA table_info(projects)")
    project_columns = [row[1] for row in cursor.fetchall()]

    project_new_columns = [
        ("priority", "INTEGER DEFAULT 0"),
        ("force_stop_reason", "TEXT"),
        ("is_hidden", "BOOLEAN DEFAULT 0"),
        ("internal_tags", "JSON DEFAULT '[]'"),
        ("notes", "TEXT"),
        ("is_flagged", "BOOLEAN DEFAULT 0")
    ]

    for col_name, col_def in project_new_columns:
        if col_name not in project_columns:
            print(f"Adding column {col_name} to projects table...")
            try:
                cursor.execute(f"ALTER TABLE projects ADD COLUMN {col_name} {col_def}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists in projects.")
            
    conn.commit()
    conn.close()
    print("Database update complete.")

if __name__ == "__main__":
    update_db()
