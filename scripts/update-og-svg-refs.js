#!/usr/bin/env node
/**
 * Update OG Image References to SVG
 * Changes .jpg references to .svg in HTML files
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const HTML_FILES = [
  'index.html',
  'chat.html',
  'ai-chat.html',
  'lydian-iq.html',
  'medical-expert.html',
  'legal-expert.html',
  'ai-advisor-hub.html',
  'lydian-legal-chat.html'
];

console.log('🔄 Updating OG Image References to SVG...\n');

HTML_FILES.forEach(fileName => {
  const filePath = path.join(PUBLIC_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${fileName} not found, skipping`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace .jpg with .svg in og-images paths
  const updated = content.replace(
    /\/og-images\/([\w-]+)\.jpg/g,
    '/og-images/$1.svg'
  );

  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`✅ Updated ${fileName}`);
});

console.log('\n🎉 All OG Image References Updated to SVG!');
