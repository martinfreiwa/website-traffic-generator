const fs = require('fs');
console.log("Script starting...");
try {
  const path = 'frontend/components/blog/blogContent.ts';
  if (!fs.existsSync(path)) {
    console.error("File not found: " + path);
    process.exit(1);
  }
  const content = fs.readFileSync(path, 'utf8');
  console.log("File read successfully, length: " + content.length);
  
  const regex = /"([\w-]+)":\s*`([\s\S]*?)`/g;
  let match;
  let matchesFound = 0;
  
  while ((match = regex.exec(content)) !== null) {
    if (matchesFound < 3) console.log("Found key: " + match[1]);
    matchesFound++;
  }
  console.log("Total matches found: " + matchesFound);
  
} catch (e) {
  console.error("Error: " + e.message);
}
