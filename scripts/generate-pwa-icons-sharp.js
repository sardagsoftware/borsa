#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('📱 Generating PWA icons from SVG...\n');

const svgPath = 'public/icons/pwa-icon-with-text.svg';
const sizes = [192, 512];

if (!fs.existsSync(svgPath)) {
  console.error('❌ SVG file not found:', svgPath);
  process.exit(1);
}

// Try using Safari to render SVG to PNG
try {
  console.log('🔄 Using ImageMagick with special rendering options...\n');

  for (const size of sizes) {
    const output = `public/icons/pwa-${size}.png`;

    try {
      // Try with rasterize flag
      execSync(
        `magick -background none -density 600 "${svgPath}" -resize ${size}x${size} -gravity center -extent ${size}x${size} "${output}"`,
        { stdio: 'inherit' }
      );
      console.log(`✅ Generated: ${output}`);
    } catch (err) {
      console.error(`❌ Failed to generate ${size}px icon:`, err.message);
    }
  }

  // Generate preview
  execSync(
    `magick -background none -density 600 "${svgPath}" -resize 512x512 "public/icons/pwa-preview.png"`,
    { stdio: 'inherit' }
  );

  console.log('\n✅ All icons generated!');
  console.log('\n📂 Generated files:');
  sizes.forEach(size => {
    const path = `public/icons/pwa-${size}.png`;
    if (fs.existsSync(path)) {
      const stats = fs.statSync(path);
      console.log(`   ${path} (${(stats.size / 1024).toFixed(1)} KB)`);
    }
  });

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
