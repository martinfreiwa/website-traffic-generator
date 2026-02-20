import os
import re
import glob

# Configuration
SOURCE_DIR = "/Users/martin/ab/content/old_content"
IMG_SOURCE_ROOT = "/Users/martin/ab/content/old_content/assets/img"
OUTPUT_FILE = "/Users/martin/ab/missing_images.md"

# Build an index of ALL available images to be helpful
params = {}
available_images = {}
for root, dirs, files in os.walk(IMG_SOURCE_ROOT):
    for file in files:
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            # Store lower case filename -> full path
            available_images[file.lower()] = os.path.join(root, file)

def check_image_exists(img_ref):
    # img_ref is like "assets/img/blog/traffic-bots-reviews/fiverr.webp"
    basename = os.path.basename(img_ref).lower()
    
    if basename in available_images:
        return True, available_images[basename]
    return False, None

files = glob.glob(os.path.join(SOURCE_DIR, "blog-article-review-*-2023.md"))
files.sort()

report_lines = []
report_lines.append("# Missing Images Report")
report_lines.append(f"Generated on {os.popen('date').read().strip()}")
report_lines.append("")

total_missing = 0

for filepath in files:
    filename = os.path.basename(filepath)
    article_title = filename.replace("blog-article-review-", "").replace("-2023.md", "").replace("-", " ").title()
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find all images
    # Matches ![alt](url)
    matches = re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', content)
    
    missing_in_article = []
    
    for alt, img_path in matches:
        if img_path.startswith("http"): continue # Skip external
        
        exists, _ = check_image_exists(img_path)
        if not exists:
            missing_in_article.append((alt, img_path))
            
    if missing_in_article:
        report_lines.append(f"## {article_title} (`{filename}`)")
        for alt, path in missing_in_article:
            report_lines.append(f"- **Missing**: `{path}`")
            report_lines.append(f"  - Alt: *{alt}*")
        report_lines.append("")
        total_missing += len(missing_in_article)

report_lines.append("---")
report_lines.append(f"**Total Missing Images: {total_missing}**")

with open(OUTPUT_FILE, 'w') as f:
    f.write("\n".join(report_lines))

print(f"Report generated at {OUTPUT_FILE}")
