
import re

file_path = "/Users/martin/ab/frontend/components/blog/Blog.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Extract the articles array content
# Find the start of the array
start_index = content.find("const articles = [")
if start_index == -1:
    print("Could not find articles array start")
    exit(1)

# Find end of array - matching bracket logic needed because nested brackets might exist?
# But here objects are simple { ... }, so finding first `];` after start might work if no nested arrays.
end_index = content.find("];", start_index)
if end_index == -1:
    print("Could not find articles array end")
    exit(1)

array_content = content[start_index:end_index]

# Split into object strings
# We can split by `},`
objects = array_content.split("},")

missing_count = 0

for obj in objects:
    if not obj.strip():
        continue
    
    # Check if this looks like an object (contains title)
    if "title:" not in obj:
        continue
        
    obj = obj.replace("\n", " ").strip()
    
    # Extract Title
    title_match = re.search(r'title:\s*["\'](.*?)["\']', obj)
    title = title_match.group(1) if title_match else "Unknown Title"
    
    # Check for image property
    if "image:" not in obj:
        print(f"MISSING IMAGE PROPERTY: {title}")
        missing_count += 1
    else:
        # Check if empty string
        image_match = re.search(r'image:\s*["\'](.*?)["\']', obj)
        if image_match:
            img_val = image_match.group(1)
            if not img_val.strip():
                print(f"EMPTY IMAGE VALUE: {title}")
                missing_count += 1

print(f"Total missing: {missing_count}")
