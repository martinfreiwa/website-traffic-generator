
import sys
import os
import re
import json

# Add current directory to path
sys.path.append(os.getcwd())

from database import SessionLocal
from models import BlogArticle

BLOG_TSX_PATH = "/Users/martin/ab/frontend/components/blog/Blog.tsx"
BLOG_CONTENT_PATH = "/Users/martin/ab/frontend/components/blog/blogContent.ts"

def parse_tsx_articles():
    with open(BLOG_TSX_PATH, 'r') as f:
        content = f.read()
    
    # Extract the articles array
    match = re.search(r"const articles = \[(.*?)\];", content, re.DOTALL)
    if not match:
        print("Could not find articles array in TSX")
        return []
    
    articles_raw = match.group(1)
    
    articles = []
    depth = 0
    start = -1
    for i, char in enumerate(articles_raw):
        if char == '{':
            if depth == 0:
                start = i
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0 and start != -1:
                obj_text = articles_raw[start:i+1]
                articles.append(obj_text)
                start = -1
    
    parsed_articles = []
    for art in articles:
        data = {}
        keys = ['id', 'title', 'slug', 'excerpt', 'date', 'author', 'role', 'readTime', 'image', 'category', 'seoDescription']
        for key in keys:
            # Handle potential multi-line values or escaped quotes
            m = re.search(rf'{key}:\s*["\'](.*?)["\']', art, re.DOTALL)
            if m:
                data[key] = m.group(1).strip()
        
        # Tags array
        tag_match = re.search(r'tags:\s*\[(.*?)\]', art, re.DOTALL)
        if tag_match:
            tags_str = tag_match.group(1)
            data['tags'] = [t.strip().strip('"').strip("'") for t in tags_str.split(',') if t.strip()]
        else:
            data['tags'] = []
            
        parsed_articles.append(data)
    
    return parsed_articles

def parse_content():
    if not os.path.exists(BLOG_CONTENT_PATH):
        print(f"Content file not found: {BLOG_CONTENT_PATH}")
        return {}
        
    with open(BLOG_CONTENT_PATH, 'r') as f:
        content = f.read()
    
    # Try multiple patterns for articleContents
    match = re.search(r"articleContents.* = \{(.*?)\};", content, re.DOTALL)
    if not match:
        print("Could not find articleContents in TS")
        return {}
    
    contents_raw = match.group(1)
    
    # Use a more robust split for content items
    # They are in format "slug": `html`,
    items = re.findall(r'["\']([a-zA-Z0-9-]+)["\']:\s*`(.*?)`', contents_raw, re.DOTALL)
    
    return {k: v.strip() for k, v in items}

def run():
    articles = parse_tsx_articles()
    content_map = parse_content()
    
    print(f"Found {len(articles)} articles in metadata.")
    print(f"Found {len(content_map)} articles with content.")
    
    db = SessionLocal()
    try:
        # Clear existing
        db.query(BlogArticle).delete()
        
        for art in articles:
            slug = art.get('slug')
            if not slug: 
                print(f"Skipping article with missing slug: {art.get('title')}")
                continue
            
            body = content_map.get(slug, "")
            
            new_art = BlogArticle(
                slug=slug,
                title=art.get('title', 'Untitled'),
                excerpt=art.get('excerpt', ''),
                content=body,
                author=art.get('author', 'Martin Freiwald'),
                role=art.get('role', 'Traffic Expert'),
                date=art.get('date', ''),
                read_time=art.get('readTime', ''),
                image=art.get('image', ''),
                category=art.get('category', 'General'),
                tags=art.get('tags', []),
                seo_description=art.get('seoDescription', ''),
                is_published=True
            )
            db.add(new_art)
        
        db.commit()
        print(f"Successfully imported {len(articles)} articles into database.")
    except Exception as e:
        print(f"Error during import: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run()
