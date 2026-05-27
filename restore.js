const fs = require('fs');
const path = require('path');

// Read the XML file (make sure the filename matches exactly)
const xmlPath = './repomix-output (2).xml';
const xml = fs.readFileSync(xmlPath, 'utf8');

// Regex to find each file section
const fileRegex = /<file path="([^"]+)">\n([\s\S]*?)\n<\/file>/g;
let match;

while ((match = fileRegex.exec(xml)) !== null) {
  const filePath = match[1];
  let content = match[2];

  // Decode HTML entities (just in case)
  content = content
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Create directories if needed
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write the file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Restored: ${filePath}`);
}

console.log('\n🎉 All text files restored!');
console.log('⚠️ Missing binary images: public/dash.png, public/icon.png, public/logo.png');