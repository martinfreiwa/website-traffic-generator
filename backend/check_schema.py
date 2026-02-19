"""Compare models.py columns with production database"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database import engine, SessionLocal

def parse_models_columns():
    """Parse models.py to extract table/column definitions"""
    columns = {}
    current_table = None
    
    with open("models.py", "r") as f:
        for line in f:
            # Match table name
            table_match = re.search(r'__tablename__\s*=\s*["\']([^"\']+)["\']', line)
            if table_match:
                current_table = table_match.group(1)
                columns[current_table] = []
                continue
            
            # Match column definitions
            if current_table:
                col_match = re.search(r'^\s+(\w+)\s*=\s*Column\(', line)
                if col_match:
                    col_name = col_match.group(1)
                    if col_name not in ['id']:  # id is special
                        columns[current_table].append(col_name)
    
    return columns

def get_db_columns():
    """Get actual columns from database"""
    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, column_name
        """))
        
        columns = {}
        for row in result:
            table, col = row[0], row[1]
            if table not in columns:
                columns[table] = []
            columns[table].append(col)
        
        return columns
    except Exception as e:
        print(f"Database error: {e}")
        return None
    finally:
        db.close()

def get_db_tables():
    """Get actual tables from database"""
    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """))
        return [row[0] for row in result]
    except Exception as e:
        print(f"Database error: {e}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Checking Database Schema ===\n")
    
    # Parse expected columns from models.py
    expected = parse_models_columns()
    print(f"Expected tables from models.py: {len(expected)}")
    for t in sorted(expected.keys()):
        print(f"  - {t}: {len(expected[t])} columns")
    
    # Get actual from database
    actual_tables = get_db_tables()
    actual_columns = get_db_columns()
    
    if actual_tables is None:
        print("\nCannot connect to production database. Checking local SQLite...")
        sys.exit(1)
    
    print(f"\nActual tables in database: {len(actual_tables)}")
    
    # Check missing tables
    missing_tables = set(expected.keys()) - set(actual_tables)
    if missing_tables:
        print(f"\n❌ MISSING TABLES ({len(missing_tables)}):")
        for t in sorted(missing_tables):
            print(f"  - {t}")
    
    # Check extra tables (not in models)
    extra_tables = set(actual_tables) - set(expected.keys())
    if extra_tables:
        print(f"\n⚠️  EXTRA TABLES (not in models, {len(extra_tables)}):")
        for t in sorted(extra_tables):
            print(f"  - {t}")
    
    # Check missing columns per table
    missing_cols = {}
    for table, cols in expected.items():
        if table in actual_columns:
            actual = set(actual_columns[table])
            expected_set = set(cols)
            missing = expected_set - actual
            if missing:
                missing_cols[table] = missing
    
    if missing_cols:
        print(f"\n❌ MISSING COLUMNS ({sum(len(c) for c in missing_cols.values())} total):")
        for table in sorted(missing_cols.keys()):
            cols = missing_cols[table]
            print(f"  {table} ({len(cols)}): {sorted(cols)}")
    else:
        print("\n✅ All columns present!")
    
    # Summary
    total_missing = sum(len(c) for c in missing_cols.values())
    print(f"\n=== SUMMARY ===")
    print(f"Missing tables: {len(missing_tables)}")
    print(f"Missing columns: {total_missing}")
