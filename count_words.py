import re

file_path = 'frontend/components/blog/blogContent.ts'

with open(file_path, 'r') as f:
    content = f.read()

keys = [
  "traffic-creator-coinmarketcap-rankings",
  "useviral-review",
  "organic-vs-paid-traffic",
  "paid-traffic-coingecko-rankings",
  "seo-strategies",
  "best-traffic-bot-software",
  "introducing-youtube-views-service",
  "optimize-traffic-conversion",
  "content-marketing-beginners",
  "seo-traffic",
  "sparktraffic-alternatives",
  "improve-crypto-rankings-website-traffic",
  "enhance-your-website-performance"
]

print("Article Word Counts:")
print("-" * 30)

for key in keys:
    # Regex to find the key and its content in backticks
    # We look for "key": 
    pattern = f'"{key}": '
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        article_html = match.group(1)
        # Strip HTML tags
        clean_text = re.sub(r'<[^>]+>', ' ', article_html)
        # Collapse multiple spaces
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        word_count = len(clean_text.split())
        print(f"{key}: {word_count} words")
    else:
        print(f"{key}: Not found")

