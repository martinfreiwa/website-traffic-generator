"""
Migration script to add priority, type, and messages columns to tickets table.
Run this script if you have an existing database that needs updating.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "traffic_nexus.db")


def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found at", DB_PATH)
        print("New databases will auto-create with correct schema.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("ALTER TABLE tickets ADD COLUMN priority VARCHAR DEFAULT 'low'")
        print("Added 'priority' column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("Column 'priority' already exists")
        else:
            raise

    try:
        cursor.execute("ALTER TABLE tickets ADD COLUMN type VARCHAR DEFAULT 'ticket'")
        print("Added 'type' column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("Column 'type' already exists")
        else:
            raise

    try:
        cursor.execute("ALTER TABLE tickets ADD COLUMN messages JSON DEFAULT '[]'")
        print("Added 'messages' column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("Column 'messages' already exists")
        else:
            raise

    conn.commit()
    conn.close()
    print("Migration complete!")


if __name__ == "__main__":
    migrate()
