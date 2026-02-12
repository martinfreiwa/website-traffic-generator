#!/usr/bin/env python3
"""
Script to fix existing projects that are missing the 'targets' array in their settings.

This script:
1. Finds all projects with missing or empty targets
2. Attempts to reconstruct targets from legacy fields (targetUrl, ga4Tid, entryUrls, gaId)
3. Updates the project settings with the correct targets array
"""

import sqlite3
import json
import sys

def fix_project_settings(db_path: str = "traffic_nexus.db", dry_run: bool = True):
    """
    Fix project settings by adding targets array where missing.
    
    Args:
        db_path: Path to the SQLite database
        dry_run: If True, only print what would be changed without making changes
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all projects
    cursor.execute('SELECT id, name, settings FROM projects')
    projects = cursor.fetchall()
    
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    print(f"{'='*80}")
    print(f"Scanning {len(projects)} projects for missing targets...")
    print(f"{'='*80}\n")
    
    for project_id, name, settings_json in projects:
        try:
            settings = json.loads(settings_json) if settings_json else {}
            
            # Check if targets already exists and is not empty
            targets = settings.get("targets", [])
            if targets and len(targets) > 0:
                print(f"[SKIP] Project '{name}' ({project_id[:8]}...) - Already has {len(targets)} target(s)")
                skipped_count += 1
                continue
            
            # Try to reconstruct targets from various possible fields
            target_url = None
            tid = None
            
            # Priority 1: Legacy fields targetUrl and ga4Tid
            if settings.get("targetUrl"):
                target_url = settings.get("targetUrl")
                tid = settings.get("ga4Tid", "G-XXXXXXXXXX")
            
            # Priority 2: entryUrls field (used by AddProject.tsx)
            elif settings.get("entryUrls"):
                target_url = settings.get("entryUrls")
                tid = settings.get("gaId", "G-XXXXXXXXXX")
            
            # Priority 3: Use project name as a hint (for demo/testing)
            else:
                print(f"[WARN] Project '{name}' ({project_id[:8]}...) - No URL found in settings")
                print(f"       Settings keys: {list(settings.keys())}")
                error_count += 1
                continue
            
            # Create the targets array
            new_targets = [{
                "url": target_url,
                "tid": tid or "G-XXXXXXXXXX",
                "funnel": []
            }]
            
            # Update settings
            settings["targets"] = new_targets
            # Also add legacy fields for backward compatibility
            settings["targetUrl"] = target_url
            settings["ga4Tid"] = tid or "G-XXXXXXXXXX"
            
            if dry_run:
                print(f"[DRY-RUN] Would fix project '{name}' ({project_id[:8]}...)")
                print(f"          URL: {target_url}")
                print(f"          TID: {tid}")
            else:
                # Update the database
                cursor.execute(
                    'UPDATE projects SET settings = ? WHERE id = ?',
                    (json.dumps(settings), project_id)
                )
                print(f"[FIXED] Project '{name}' ({project_id[:8]}...)")
                print(f"        URL: {target_url}")
                print(f"        TID: {tid}")
            
            fixed_count += 1
            
        except Exception as e:
            print(f"[ERROR] Project '{name}' ({project_id[:8]}...) - {e}")
            error_count += 1
    
    if not dry_run:
        conn.commit()
    
    conn.close()
    
    print(f"\n{'='*80}")
    print(f"Summary:")
    print(f"  - Total projects: {len(projects)}")
    print(f"  - Fixed: {fixed_count}")
    print(f"  - Skipped (already has targets): {skipped_count}")
    print(f"  - Errors: {error_count}")
    print(f"{'='*80}")
    
    if dry_run:
        print("\nThis was a DRY RUN. No changes were made.")
        print("To apply changes, run: python fix_project_settings.py --apply")
    
    return fixed_count, skipped_count, error_count


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Fix project settings by adding targets array where missing"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually apply the fixes (default is dry-run)"
    )
    parser.add_argument(
        "--db",
        default="traffic_nexus.db",
        help="Path to the SQLite database (default: traffic_nexus.db)"
    )
    
    args = parser.parse_args()
    
    # Change to backend directory if running from project root
    import os
    if os.path.exists("backend/traffic_nexus.db") and not os.path.exists(args.db):
        os.chdir("backend")
        print(f"Changed to backend directory")
    
    dry_run = not args.apply
    
    if dry_run:
        print("\n*** DRY RUN MODE ***")
        print("No changes will be made. Use --apply to apply fixes.\n")
    else:
        print("\n*** APPLY MODE ***")
        print("Changes will be committed to the database.\n")
        confirm = input("Are you sure? (yes/no): ")
        if confirm.lower() != "yes":
            print("Aborted.")
            sys.exit(0)
    
    fix_project_settings(db_path=args.db, dry_run=dry_run)
