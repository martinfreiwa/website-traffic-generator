import sqlite3
import os

DB_PATH = "backend/traffic_nexus.db"

def add_column_if_not_exists(cursor, table, column, definition):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        print(f"Added column {column} to {table}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column {column} already exists in {table}")
        else:
            print(f"Error adding {column}: {e}")

def fix_db():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    add_column_if_not_exists(cursor, "users", "api_key_last_used", "DATETIME")
    add_column_if_not_exists(cursor, "users", "password_changed_at", "DATETIME")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    fix_db()
