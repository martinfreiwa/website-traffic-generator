
import re
import os

blog_file_path = "/Users/martin/ab/frontend/components/blog/Blog.tsx"
public_dir = "/Users/martin/ab/frontend/public"

if not os.path.exists(public_dir):
    # Fallback to verify if public is somewhere else
    # But based on list_dir, it is there.
    print(f"Public dir not found at {public_dir}")

with open(blog_file_path, "r") as f:
    text = f.read()

# Extract objects
# We can regex for image: "..."
# But we need to know the article title to report it.

# Let's iterate objects as we did before.
start_index = text.find("const articles = [")
end_index = text.find("];", start_index)
array_content = text[start_index:end_index]
objects = array_content.split("},")

missing_file_count = 0
missing_prop_count = 0

print("Checking thumbnails...")

for obj in objects:
    if not obj.strip():
        continue
    
    if "title:" not in obj:
        continue
        
    obj = obj.replace("\n", " ")
    
    title_match = re.search(r'title:\s*["\'](.*?)["\']', obj)
    title = title_match.group(1) if title_match else "Unknown Title"
    
    image_match = re.search(r'image:\s*["\'](.*?)["\']', obj)
    
    if not image_match:
        print(f"[MISSING PROP] {title}")
        missing_prop_count += 1
        continue
        
    image_path = image_match.group(1)
    if not image_path.strip():
        print(f"[EMPTY PROP] {title}")
        missing_prop_count += 1
        continue
        
    # Check if file exists
    # image_path starts with /img/...
    # local path = public_dir + image_path
    full_path = os.path.join(public_dir, image_path.lstrip("/"))
    
    if not os.path.exists(full_path):
        print(f"[MISSING FILE] {title} -> {image_path}")
        missing_file_count += 1

print(f"\nSummary:")
print(f"Articles with missing image property or empty: {missing_prop_count}")
print(f"Articles with missing image file: {missing_file_count}")
