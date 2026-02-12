"""
Database migration script for enhanced traffic generator features.
Run this to add new columns to TrafficLog and create ProjectStats table.
"""

import sqlite3
import os
import sys

def migrate_database(db_path="traffic_nexus.db"):
    """Apply migrations for enhanced features"""
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        # Try alternative paths
        alt_paths = ["sql_app.db", "traffic_gen.db", "./backend/traffic_nexus.db"]
        for alt in alt_paths:
            if os.path.exists(alt):
                db_path = alt
                print(f"Found database at {db_path}")
                break
        else:
            print("No database found. Please run the application first to create the database.")
            return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"Migrating database: {db_path}")
    
    # Check if TrafficLog table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='traffic_log'")
    if not cursor.fetchone():
        print("TrafficLog table doesn't exist yet. Skipping migration.")
        conn.close()
        return True
    
    # Get existing columns in TrafficLog
    cursor.execute("PRAGMA table_info(traffic_log)")
    existing_columns = {col[1] for col in cursor.fetchall()}
    
    # Add new columns to TrafficLog
    new_columns = [
        ("session_duration", "FLOAT"),
        ("pages_viewed", "INTEGER DEFAULT 1"),
        ("device_type", "VARCHAR"),
        ("traffic_source", "VARCHAR"),
        ("bounced", "BOOLEAN DEFAULT 0"),
    ]
    
    for col_name, col_type in new_columns:
        if col_name not in existing_columns:
            try:
                cursor.execute(f"ALTER TABLE traffic_log ADD COLUMN {col_name} {col_type}")
                print(f"  ✓ Added column: {col_name}")
            except sqlite3.OperationalError as e:
                print(f"  ✗ Error adding {col_name}: {e}")
        else:
            print(f"  • Column already exists: {col_name}")
    
    # Create ProjectStats table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='project_stats'")
    if not cursor.fetchone():
        try:
            cursor.execute("""
                CREATE TABLE project_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id VARCHAR NOT NULL,
                    hour DATETIME NOT NULL,
                    total_visitors INTEGER DEFAULT 0,
                    successful_hits INTEGER DEFAULT 0,
                    failed_hits INTEGER DEFAULT 0,
                    bounce_count INTEGER DEFAULT 0,
                    avg_session_duration FLOAT DEFAULT 0.0,
                    desktop_visitors INTEGER DEFAULT 0,
                    mobile_visitors INTEGER DEFAULT 0,
                    tablet_visitors INTEGER DEFAULT 0,
                    organic_visitors INTEGER DEFAULT 0,
                    social_visitors INTEGER DEFAULT 0,
                    direct_visitors INTEGER DEFAULT 0,
                    referral_visitors INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (project_id) REFERENCES projects (id)
                )
            """)
            # Create index for faster queries
            cursor.execute("CREATE INDEX idx_project_stats_project_hour ON project_stats(project_id, hour)")
            print("  ✓ Created table: project_stats")
        except sqlite3.OperationalError as e:
            print(f"  ✗ Error creating project_stats: {e}")
    else:
        print("  • Table already exists: project_stats")
    
    conn.commit()
    conn.close()
    
    print("\n✅ Migration completed successfully!")
    print("\nNew features available:")
    print("  • Enhanced TrafficLog with session duration, device type, traffic source, bounce tracking")
    print("  • ProjectStats table for hourly aggregated analytics")
    print("  • Precise pacing with active hours and circadian patterns")
    print("  • Bounce rate control")
    print("  • Expanded traffic sources (chatbots, messengers, news)")
    print("  • City/state-level geo-targeting")
    print("  • Browser diversity (Chrome, Firefox, Safari, Edge)")
    
    return True


if __name__ == "__main__":
    # Check for custom db path
    if len(sys.argv) > 1:
        db_path = sys.argv[1]
    else:
        db_path = "traffic_nexus.db"
    
    success = migrate_database(db_path)
    sys.exit(0 if success else 1)