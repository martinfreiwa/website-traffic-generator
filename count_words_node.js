const fs = require('fs');

try {
  const fileContent = fs.readFileSync('frontend/components/blog/blogContent.ts', 'utf8');
  // Regex to match "key": `content`
  // We use [\w-]+ for key which matches alphanumeric and dashes
  // We use [\s\S]*? for content inside backticks (lazy match across newlines)
  const regex = /"([\w-]+)":\s*`([\s\S]*?)`/g;
  let match;
  
  const targetArticles = [
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
  ];

  const counts = {};

  while ((match = regex.exec(fileContent)) !== null) {
    const key = match[1];
    const html = match[2];
    
    // Strip HTML tags: replace <...> with space
    let text = html.replace(/<[^>]*>/g, ' ');
    // Remove inline styles if they leak (unlikely with simple stripping but safe)
    // Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Count words
    const words = text.split(' ').filter(w => w.length > 0).length;
    counts[key] = words;
  }

  console.log("Word Counts:");
  targetArticles.forEach(key => {
    console.log(`${key}: ${counts[key] !== undefined ? counts[key] : 'Not Found'}`);
  });

} catch (err) {
  console.error(err);
}
