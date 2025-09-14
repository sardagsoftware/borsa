#!/usr/bin/env node

const StyleDictionary = require('style-dictionary');
const fs = require('fs');

async function buildTokens() {
  console.log('🎨 Building AILYDIAN Design Tokens...');

  // Create output directories if they don't exist
  const tokensDir = './public/tokens';
  
  if (!fs.existsSync(tokensDir)) {
    fs.mkdirSync(tokensDir, { recursive: true });
  }

  // Simple configuration
  const config = {
    source: ['design-tokens/**/*.json'],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: 'public/tokens/',
        files: [{
          destination: 'variables.css',
          format: 'css/variables',
          options: { 
            outputReferences: true,
            selector: ':root'
          }
        }]
      }
    }
  };

  const sd = StyleDictionary.extend(config);
  sd.buildAllPlatforms();

  console.log('✅ Design tokens built successfully!');
  console.log('📁 Generated files:');
  console.log('   • public/tokens/variables.css - Core CSS variables');
  console.log('');
  console.log('🔗 Import in your CSS: @import url("/tokens/variables.css");');
}

buildTokens().catch(console.error);