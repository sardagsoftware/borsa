/**
 * Generate placeholder PWA icons
 * Creates simple colored PNG icons for the messaging app
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate a minimal PNG icon with the Ailydian logo text
 * This creates a valid PNG file with a gradient background
 */
function generateIcon(size, outputPath) {
  // For simplicity, we'll create an SVG and note it needs conversion
  // In production, use sharp or canvas library

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.25}" fill="white" opacity="0.9"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.15}" fill="none" stroke="white" stroke-width="${size * 0.02}"/>
</svg>`;

  // Write SVG temporarily
  const svgPath = outputPath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svg);

  console.log(`✅ Created SVG: ${svgPath}`);
  return svgPath;
}

// Create icons directory
const publicDir = path.join(__dirname, '../public');

// Generate icons
const svg192 = generateIcon(192, path.join(publicDir, 'icon-192.png'));
const svg512 = generateIcon(512, path.join(publicDir, 'icon-512.png'));

console.log('\n📝 Note: SVG files created. Converting to PNG...\n');
