
file_path = "/Users/martin/ab/frontend/components/blog/Blog.tsx"

current_id = None
has_image = False
missing_image_articles = []

with open(file_path, "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    line = line.strip()
    
    # Check for ID (start of an article usually)
    if line.startswith("id:"):
        # If we were tracking a previous article and it didn't have an image, record it
        if current_id is not None and not has_image:
             missing_image_articles.append(current_id)
        
        # Start new article tracking
        try:
            current_id = line.split(":")[1].strip().rstrip(",")
        except:
            current_id = "unknown"
        has_image = False

    # Check for image property
    if line.startswith("image:"):
        has_image = True
        
    # ambiguous end of object or array
    if line.startswith("},") or line.startswith("};") or line.startswith("];"):
        if current_id is not None and not has_image:
             missing_image_articles.append(current_id)
             current_id = None # Reset so we don't count it again or carry over
             has_image = False # Reset

# Last check if file ends abruptly
if current_id is not None and not has_image:
    missing_image_articles.append(current_id)

print(f"Articles missing image property: {len(missing_image_articles)}")
for article_id in missing_image_articles:
    print(f"- Article ID: {article_id}")

