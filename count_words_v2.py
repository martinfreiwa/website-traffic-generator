import re

with open('frontend/components/blog/blogContent.ts', 'r') as f:
    content = f.read()

pattern = r'"([\w-]+)": `(.*?)`'
matches = re.finditer(pattern, content, re.DOTALL)

word_counts = {}

for match in matches:
    key = match.group(1)
    html_content = match.group(2)
    
    # Strip HTML tags more aggressively
    text = re.sub(r'<[^>]+>', ' ', html_content)
    # Remove CSS/Inline styles if any remain (though stripped by tag removal usually)
    # Convert to single spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Simple word count
    words = [w for w in text.split(' ') if w]
    word_counts[key] = len(words)

target_articles = [
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
for key in target_articles:
    if key in word_counts:
        print(f"{key}: {word_counts[key]}")
    else:
        print(f"{key}: Not Found (keys found: {list(word_counts.keys())[:3]}...)")

