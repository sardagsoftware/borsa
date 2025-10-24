#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// Define branding patterns to standardize
const brandingReplacements = [
  // Replace various "ailydian" spellings with "LyDian"
  { pattern: /\bailydian\b(?!\.com|\.vercel|@)/gi, replacement: 'LyDian', context: 'Display text' },
  { pattern: /\bAilydian\b(?!\.com|\.vercel|@)/g, replacement: 'LyDian', context: 'Display text' },
  { pattern: /\bAILYDIAN\b(?!\.com|\.vercel|@)/g, replacement: 'LyDian', context: 'Display text' },

  // Keep "ailydian" in URLs, domains, and email addresses
  // These won't be replaced due to the negative lookahead in patterns above
];

function shouldSkipFile(filename) {
  const skipPatterns = [
    /backup/i,
    /old/i,
    /-BACKUP-/,
    /\.min\./,
    /node_modules/,
    /\.git/,
  ];

  return skipPatterns.some(pattern => pattern.test(filename));
}

function standardizeBranding(content, filename) {
  let modified = content;
  let changes = [];

  brandingReplacements.forEach(({ pattern, replacement, context }) => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      const beforeReplace = modified;
      modified = modified.replace(pattern, replacement);
      if (beforeReplace !== modified) {
        changes.push(`${context}: ${matches.length} replacements`);
      }
    }
  });

  return { modified, changes };
}

function processHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  const results = {
    processed: 0,
    modified: 0,
    skipped: 0,
    errors: [],
    changes: {}
  };

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !shouldSkipFile(file)) {
      // Recursively process subdirectories
      const subResults = processHtmlFiles(fullPath);
      results.processed += subResults.processed;
      results.modified += subResults.modified;
      results.skipped += subResults.skipped;
      results.errors.push(...subResults.errors);
      Object.assign(results.changes, subResults.changes);
      return;
    }

    if (!file.endsWith('.html')) {
      return;
    }

    if (shouldSkipFile(file)) {
      results.skipped++;
      return;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const { modified, changes } = standardizeBranding(content, file);

      results.processed++;

      if (content !== modified) {
        fs.writeFileSync(fullPath, modified, 'utf8');
        results.modified++;
        results.changes[file] = changes;
      }
    } catch (error) {
      results.errors.push({ file, error: error.message });
    }
  });

  return results;
}

console.log('🔧 Starting LyDian Branding Standardization...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const results = processHtmlFiles(publicDir);

console.log('\n📊 Results:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Files processed: ${results.processed}`);
console.log(`📝 Files modified: ${results.modified}`);
console.log(`⏭️  Files skipped: ${results.skipped}`);

if (results.modified > 0) {
  console.log('\n📋 Changes made:');
  Object.entries(results.changes).forEach(([file, changes]) => {
    console.log(`\n  📄 ${file}:`);
    changes.forEach(change => console.log(`     - ${change}`));
  });
}

if (results.errors.length > 0) {
  console.log('\n❌ Errors:');
  results.errors.forEach(({ file, error }) => {
    console.log(`  - ${file}: ${error}`);
  });
}

console.log('\n✨ Branding standardization complete!\n');
