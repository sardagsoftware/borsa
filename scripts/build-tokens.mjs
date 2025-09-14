#!/usr/bin/env node

const StyleDictionary = require('style-dictionary');
const fs = require('fs');
const path = require('path');

console.log('🎨 Building AILYDIAN Design Tokens...');

// Create output directories if they don't exist
const tokensDir = './public/tokens';
const themesDir = './public/tokens/themes';

if (!fs.existsSync(tokensDir)) {
  fs.mkdirSync(tokensDir, { recursive: true });
}

if (!fs.existsSync(themesDir)) {
  fs.mkdirSync(themesDir, { recursive: true });
}

// Load and extend configuration
const config = require(path.resolve('./style-dictionary.config.cjs'));
const sd = new StyleDictionary(config);

// Build all platforms
await sd.buildAllPlatforms();

console.log('✅ Design tokens built successfully!');
console.log('📁 Generated files:');
console.log('   • public/tokens/variables.css - Core CSS variables');
console.log('   • public/tokens/tailwind.json - Tailwind theme data');
console.log('   • public/tokens/themes/calm.css - Calm theme CSS');
console.log('   • public/tokens/themes/elevated.css - Elevated theme CSS');
console.log('   • public/tokens/themes/shock.css - Shock theme CSS');
console.log('');
console.log('🔗 Import in your CSS: @import url("/tokens/variables.css");');
console.log('🎯 Theme switching: document.documentElement.dataset.regime = "calm"');