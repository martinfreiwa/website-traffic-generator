
import re

file_path = "/Users/martin/ab/frontend/components/blog/Blog.tsx"

titles_without_thumbnail = []
current_article = {}
in_articles_array = False
brace_depth = 0

with open(file_path, 'r') as f:
    lines = f.readlines()

for line in lines:
    line = line.strip()
    
    if "const articles = [" in line:
        in_articles_array = True
        continue
    
    if not in_articles_array:
        continue
        
    if line.startswith("{"):
        brace_depth += 1
        current_article = {}
        continue
        
    if line.startswith("}"):
        brace_depth -= 1
        if brace_depth == 0: # End of an article object
            # check the article
            title = current_article.get('title', 'Unknown Title')
            image = current_article.get('image', None)
            
            if not image or image.strip() == "" or image == '""' or image == "''":
                titles_without_thumbnail.append(title)
        
        if line == "];": # End of array
            break
        continue

    # inside an object
    if brace_depth > 0:
        # Extract key-value pairs
        # Assume format: key: "value", or key: 'value',
        match = re.search(r'(\w+):\s*["\'](.*?)["\']', line)
        if match:
            key = match.group(1)
            value = match.group(2)
            current_article[key] = value

print(f"Count: {len(titles_without_thumbnail)}")
for t in titles_without_thumbnail:
    print(f"- {t}")
