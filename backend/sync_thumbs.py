
import os
import sqlite3
import shutil
import glob

def main():
    brain_dir = '/Users/martin/.gemini/antigravity/brain/6cb5f9f1-92cb-4d3e-95bf-e42c0233ead9/'
    dest_dir = '/Users/martin/ab/backend/static/img/blog/'
    db_path = '/Users/martin/ab/backend/traffic_nexus.db'
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT slug, title FROM blog_articles")
    articles = cursor.fetchall()
    
    files = glob.glob(brain_dir + "*.png")
    print(f"Found {len(files)} screenshot files in brain.")
    
    updated_count = 0
    for slug, title in articles:
        # Match slug parts
        # e.g. best-traffic-bot-tools-2025 -> best_traffic_bot_tools_2025
        pattern = slug.replace('-', '_')
        matched_files = [f for f in files if pattern in os.path.basename(f).replace('-', '_')]
        
        if matched_files:
            latest_file = max(matched_files, key=os.path.getctime)
            new_name = f"{slug}.png"
            dest_path = os.path.join(dest_dir, new_name)
            
            try:
                shutil.copy2(latest_file, dest_path)
                db_val = f"/img/blog/{new_name}"
                cursor.execute("UPDATE blog_articles SET image = ? WHERE slug = ?", (db_val, slug))
                updated_count += 1
                print(f"SUCCESS: {slug} -> {new_name}")
            except Exception as e:
                print(f"ERROR copying {slug}: {e}")
                
    conn.commit()
    conn.close()
    
    # Also copy to frontend public just in case proxy isn't enough or dev is confused
    frontend_dir = '/Users/martin/ab/frontend/public/img/blog/'
    if os.path.exists(frontend_dir):
        for slug, title in articles:
            src = os.path.join(dest_dir, f"{slug}.png")
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(frontend_dir, f"{slug}.png"))
    
    print(f"Final verify: Successfully processed {updated_count} thumbnails.")

if __name__ == "__main__":
    main()
