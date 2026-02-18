"""
Migration script to add new columns to tickets table for enhanced support functionality.
"""

import sqlite3
import os


def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "traffic_nexus.db")

    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(tickets)")
        columns = [col[1] for col in cursor.fetchall()]

        if "category" not in columns:
            print("Adding category column...")
            cursor.execute(
                "ALTER TABLE tickets ADD COLUMN category VARCHAR DEFAULT 'general'"
            )
        else:
            print("category column already exists")

        if "project_id" not in columns:
            print("Adding project_id column...")
            cursor.execute("ALTER TABLE tickets ADD COLUMN project_id VARCHAR")
        else:
            print("project_id column already exists")

        if "attachment_urls" not in columns:
            print("Adding attachment_urls column...")
            cursor.execute(
                "ALTER TABLE tickets ADD COLUMN attachment_urls JSON DEFAULT '[]'"
            )
        else:
            print("attachment_urls column already exists")

        if "updated_at" not in columns:
            print("Adding updated_at column...")
            cursor.execute("ALTER TABLE tickets ADD COLUMN updated_at DATETIME")
        else:
            print("updated_at column already exists")

        conn.commit()
        print("Migration completed successfully!")

    except Exception as e:
        print(f"Migration error: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
