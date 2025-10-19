#!/usr/bin/env node
/**
 * Generate OG Image Placeholders
 * Creates professional placeholder images for social media sharing
 */

const fs = require('fs');
const path = require('path');

const OG_IMAGES_DIR = path.join(__dirname, '..', 'public', 'og-images');

// OG Image specifications (1200x630px - Facebook/Twitter standard)
const OG_SPECS = {
  width: 1200,
  height: 630
};

// Page configurations with Turkish titles
const PAGES = {
  'homepage-preview.jpg': {
    title: 'LyDian AI',
    subtitle: 'Yapay Zeka Ekosistemi',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  'chat-preview.jpg': {
    title: 'LyDian Chat',
    subtitle: 'Çok Modelli AI Sohbet',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  'ai-chat-preview.jpg': {
    title: 'LyDian AI Chat',
    subtitle: 'Akıllı Sohbet Platformu',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  'lydian-iq-preview.jpg': {
    title: 'LyDian IQ',
    subtitle: 'AI Destekli Zeka Testi',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
  'medical-expert-preview.jpg': {
    title: 'Medical Expert',
    subtitle: 'Tıbbi AI Asistanı',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  'legal-ai-preview.jpg': {
    title: 'LyDian Legal AI',
    subtitle: 'Hukuki AI Danışman',
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
  },
  'advisor-hub-preview.jpg': {
    title: 'Advisor Hub',
    subtitle: '8 Uzman AI Danışman',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  },
  'legal-chat-preview.jpg': {
    title: 'Legal Chat',
    subtitle: 'Hukuki AI Sohbet',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  }
};

function generateSVGPlaceholder(config) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${OG_SPECS.width}" height="${OG_SPECS.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#grad)"/>

  <!-- Overlay for depth -->
  <rect width="100%" height="100%" fill="rgba(0,0,0,0.1)"/>

  <!-- Main content container -->
  <g>
    <!-- Title -->
    <text x="600" y="280"
          font-family="Arial, sans-serif"
          font-size="72"
          font-weight="bold"
          fill="white"
          text-anchor="middle">
      ${config.title}
    </text>

    <!-- Subtitle -->
    <text x="600" y="350"
          font-family="Arial, sans-serif"
          font-size="36"
          fill="rgba(255,255,255,0.9)"
          text-anchor="middle">
      ${config.subtitle}
    </text>

    <!-- Brand footer -->
    <text x="600" y="550"
          font-family="Arial, sans-serif"
          font-size="24"
          fill="rgba(255,255,255,0.7)"
          text-anchor="middle">
      www.ailydian.com
    </text>
  </g>

  <!-- Decorative elements -->
  <circle cx="150" cy="150" r="80" fill="rgba(255,255,255,0.1)"/>
  <circle cx="1050" cy="480" r="100" fill="rgba(255,255,255,0.1)"/>
</svg>`;
}

console.log('🎨 Generating OG Image Placeholders...\n');

Object.entries(PAGES).forEach(([filename, config]) => {
  const svgContent = generateSVGPlaceholder(config);
  const outputPath = path.join(OG_IMAGES_DIR, filename.replace('.jpg', '.svg'));

  fs.writeFileSync(outputPath, svgContent, 'utf8');
  console.log(`✅ Created ${filename.replace('.jpg', '.svg')}`);
});

console.log('\n🎉 OG Image Placeholders Generated!');
console.log('📊 Total:', Object.keys(PAGES).length, 'images');
console.log('📁 Location: public/og-images/');
console.log('\n💡 Note: Replace .svg with .jpg/.png for production use');
