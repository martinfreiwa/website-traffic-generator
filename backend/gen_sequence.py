
import sqlite3
import json

def get_template(slug, category):
    slug = slug.lower()
    cat = category.lower()
    if 'review' in slug or 'review' in cat:
        return 'img/blog/clean_review.png'
    if any(k in slug for k in ['top-', 'best-', 'guide', 'tools', 'strategies']):
        return 'img/blog/clean_guide.png'
    return 'img/blog/clean_comparison.png'

def main():
    db_path = '/Users/martin/ab/backend/traffic_nexus.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT slug, title, category FROM blog_articles WHERE is_published = 1")
    rows = cursor.fetchall()
    
    sequence = []
    for slug, title, category in rows:
        sequence.append({
            "slug": slug,
            "title": title,
            "template": get_template(slug, category)
        })
        
    with open('/Users/martin/ab/backend/thumb_sequence.json', 'w') as f:
        json.dump(sequence, f, indent=2)
    
    print(f"Generated sequence for {len(sequence)} articles.")
    conn.close()

if __name__ == "__main__":
    main()
