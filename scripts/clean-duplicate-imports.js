#!/usr/bin/env node

/**
 * Clean Duplicate handleCORS Imports
 * Removes duplicate require() statements
 */

const fs = require('fs');
const path = require('path');

// Files with known duplicates
const FILES_TO_CLEAN = [
  'api/chat-with-auth.js',
  'api/enterprise/all-features.js',
  'api/translate.js',
  'api/knowledge/search.js',
  'api/voice-tts.js',
  'api/imagen-photo.js',
  'api/medical/multimodal-data-fusion.js',
  'api/medical/maternal-fetal-health.js',
  'api/medical/mental-health-triage.js'
];

let totalCleaned = 0;

FILES_TO_CLEAN.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  ${file} - Not found`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalLength = content.length;

  // Find all handleCORS imports
  const handleCORSPattern = /const\s+\{\s*handleCORS\s*\}\s*=\s*require\([^)]+\);?\n?/g;
  const matches = content.match(handleCORSPattern);

  if (!matches || matches.length <= 1) {
    console.log(`✓  ${file} - Already clean (${matches ? matches.length : 0} import)`);
    return;
  }

  // Keep only the first import, remove the rest
  const firstImport = matches[0];
  content = content.replace(handleCORSPattern, (match, offset) => {
    // Keep first occurrence, remove others
    return content.indexOf(match) === content.indexOf(firstImport) ? match : '';
  });

  fs.writeFileSync(filePath, content);

  const duplicatesRemoved = matches.length - 1;
  totalCleaned += duplicatesRemoved;

  console.log(`✅ ${file} - Removed ${duplicatesRemoved} duplicate(s)`);
});

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Total duplicates cleaned: ${totalCleaned}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
