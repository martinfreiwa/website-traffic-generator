import sqlite3
import os

# Define the database path
DB_PATH = "traffic_nexus.db"

def add_column_if_not_exists(cursor, table, column, definition):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        print(f"✅ Added column '{column}' to '{table}'")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"ℹ️  Column '{column}' already exists in '{table}'")
        else:
            print(f"❌ Error adding '{column}': {e}")

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        return

    print(f"🔌 Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # List of new columns to add to the 'users' table
    # Format: (column_name, sql_definition)
    new_columns = [
        # Extended Profile Fields
        ("phone", "VARCHAR"),
        ("company", "VARCHAR"),
        ("vat_id", "VARCHAR"),
        ("address", "VARCHAR"),
        ("city", "VARCHAR"),
        ("country", "VARCHAR"),
        ("zip", "VARCHAR"),
        ("website", "VARCHAR"),
        
        # Profile & Bio
        ("display_name", "VARCHAR"),
        ("bio", "VARCHAR"),
        ("job_title", "VARCHAR"),
        ("avatar_url", "VARCHAR"),
        ("public_profile", "BOOLEAN DEFAULT 0"),
        ("social_links", "JSON DEFAULT '{}'"),

        # Settings & Preferences
        ("two_factor_enabled", "BOOLEAN DEFAULT 0"),
        ("email_frequency", "VARCHAR DEFAULT 'instant'"),
        ("login_notification_enabled", "BOOLEAN DEFAULT 0"),
        ("newsletter_sub", "BOOLEAN DEFAULT 1"), # Default True
        ("sound_effects", "BOOLEAN DEFAULT 1"),  # Default True
        ("developer_mode", "BOOLEAN DEFAULT 0"),
        ("api_whitelist", "JSON DEFAULT '[]'"),
        ("webhook_secret", "VARCHAR"),
        ("accessibility", "JSON DEFAULT '{}'"),
        
        # Localization & Formats
        ("timezone", "VARCHAR DEFAULT 'UTC'"),
        ("language", "VARCHAR DEFAULT 'en'"),
        ("theme_accent_color", "VARCHAR"),
        ("date_format", "VARCHAR DEFAULT 'DD/MM/YYYY'"),
        ("number_format", "VARCHAR DEFAULT '1.000,00'"),

        # Security
        ("require_password_reset", "BOOLEAN DEFAULT 0"),
        ("recovery_email", "VARCHAR"),
    ]

    print("🚀 Starting User Profile Schema Migration...")
    
    for col_name, col_def in new_columns:
        add_column_if_not_exists(cursor, "users", col_name, col_def)

    conn.commit()
    conn.close()
    print("✨ Migration completed successfully!")

if __name__ == "__main__":
    migrate()
