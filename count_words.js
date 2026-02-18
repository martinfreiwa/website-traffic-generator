const { articleContents } = require('./frontend/components/blog/blogContent.ts');

const keys = [
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

keys.forEach(key => {
  const content = articleContents[key];
  if (content) {
    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, ' ');
    // Count words (split by whitespace and filter empty strings)
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    console.log(`${key}: ${wordCount}`);
  } else {
    console.log(`${key}: Not found`);
  }
});
