#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📱 Converting SVG to PNG using browser rendering...\n');

const svgPath = path.join(__dirname, '../public/icons/pwa-icon-with-text.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Create HTML file with SVG embedded
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; background: transparent; }
    svg { display: block; }
  </style>
</head>
<body>
${svgContent}
</body>
</html>`;

const htmlPath = '/tmp/pwa-icon-render.html';
fs.writeFileSync(htmlPath, htmlContent);

console.log('✅ Created HTML file:', htmlPath);
console.log('\n📸 Please take a screenshot manually or use the following command:\n');
console.log(`open "${htmlPath}"\n`);
console.log('Then take a screenshot and save it as public/icons/pwa-192.png and pwa-512.png\n');

// Try using sips (built-in macOS tool) as alternative
try {
  const { execSync } = require('child_process');

  // Create a temporary larger HTML for better quality
  const htmlLarge = htmlContent.replace('width="512" height="512"', 'width="2048" height="2048"');
  fs.writeFileSync('/tmp/pwa-large.html', htmlLarge);

  console.log('💡 Alternative: Install Puppeteer to automate this:\n');
  console.log('npm install puppeteer\n');

  // Open the HTML file
  execSync(`open "${htmlPath}"`);

} catch (err) {
  console.error('Error:', err.message);
}
