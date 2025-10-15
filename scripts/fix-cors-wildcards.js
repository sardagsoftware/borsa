#!/usr/bin/env node
/**
 * Automated CORS Wildcard Security Fix
 * Replaces insecure wildcard CORS with secure handleCORS()
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const API_DIR = path.join(__dirname, '../api');
const BACKUP_DIR = path.join(__dirname, '../.cors-backups-' + Date.now());
const MIDDLEWARE_PATH = '../middleware/cors-handler';

// Statistics
const stats = {
  fixed: 0,
  skipped: 0,
  errors: 0,
  files: []
};

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

console.log('🔧 CORS Wildcard Security Fix');
console.log('====================================\n');
console.log(`📦 Backups: ${BACKUP_DIR}\n`);

// Find all files with wildcard CORS
function findFilesWithWildcardCORS(dir) {
  const files = [];

  function walk(directory) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (item.endsWith('.js') || item.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes("'Access-Control-Allow-Origin'") && content.includes("'*'")) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

// Calculate relative path for require()
function getRelativePath(from, to) {
  const relative = path.relative(path.dirname(from), to).replace(/\\/g, '/');
  return relative.startsWith('.') ? relative : `./${relative}`;
}

// Fix a single file
function fixFile(filePath) {
  console.log(`Processing: ${path.relative(API_DIR, filePath)}`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already uses handleCORS
    if (content.includes('handleCORS')) {
      console.log('  ⊙ Already uses secure CORS - SKIPPED\n');
      stats.skipped++;
      return;
    }

    // Create backup
    const backupPath = path.join(BACKUP_DIR, path.basename(filePath) + '.bak');
    fs.writeFileSync(backupPath, content);

    // Calculate correct import path
    const middlewarePath = path.join(__dirname, MIDDLEWARE_PATH);
    const relativePath = getRelativePath(filePath, middlewarePath);

    // Add import if not present
    if (!content.includes('cors-handler')) {
      // Find where to insert (after last require)
      const requireRegex = /const .+ = require\(.+\);?\n/g;
      const matches = [...content.matchAll(requireRegex)];

      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        const insertPos = lastMatch.index + lastMatch[0].length;
        const importStatement = `const { handleCORS } = require('${relativePath}');\n`;

        content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
      }
    }

    // Remove old CORS headers and replace with handleCORS
    const oldCorsPattern = /  \/\/ (Set )?CORS headers\n  res\.setHeader\('Access-Control-Allow-Origin',.*?\n  res\.setHeader\('Access-Control-Allow-Methods',.*?\n  res\.setHeader\('Access-Control-Allow-Headers',.*?\n(  res\.setHeader\('Access-Control-Allow-Credentials',.*?\n)?\n  (\/\/ Handle OPTIONS request\n  )?if \(req\.method === 'OPTIONS'\) \{\n    return res\.status\((200|204)\)\.end\(\);\n  \}/gs;

    if (oldCorsPattern.test(content)) {
      content = content.replace(oldCorsPattern, '  // Apply secure CORS\n  if (handleCORS(req, res)) return;');
    } else {
      // Try simpler pattern
      const simplePattern = /  res\.setHeader\('Access-Control-Allow-Origin', '\*'\);[\s\S]*?if \(req\.method === 'OPTIONS'\) \{\n    return res\.status\(\d+\)\.end\(\);\n  \}/;

      if (simplePattern.test(content)) {
        content = content.replace(simplePattern, '  // Apply secure CORS\n  if (handleCORS(req, res)) return;');
      } else {
        console.log('  ⚠ Pattern not matched - SKIPPED\n');
        stats.skipped++;
        return;
      }
    }

    // Write fixed content
    fs.writeFileSync(filePath, content);

    console.log('  ✓ FIXED\n');
    stats.fixed++;
    stats.files.push(path.relative(API_DIR, filePath));

  } catch (error) {
    console.log(`  ✗ ERROR: ${error.message}\n`);
    stats.errors++;
  }
}

// Main execution
try {
  const files = findFilesWithWildcardCORS(API_DIR);

  if (files.length === 0) {
    console.log('✓ No CORS wildcards found! System is secure.\n');
    process.exit(0);
  }

  console.log(`Found ${files.length} files with wildcard CORS\n`);

  // Process each file
  for (const file of files) {
    fixFile(file);
  }

  // Summary
  console.log('====================================');
  console.log('📊 SUMMARY');
  console.log('====================================');
  console.log(`✓ Fixed:   ${stats.fixed} files`);
  console.log(`⊙ Skipped: ${stats.skipped} files`);
  console.log(`✗ Errors:  ${stats.errors} files`);
  console.log(`\n📦 Backups: ${BACKUP_DIR}\n`);

  if (stats.fixed > 0) {
    console.log('✓ CORS security fixes applied successfully!\n');
    console.log('Next steps:');
    console.log('1. Review changes: git diff');
    console.log('2. Test endpoints: npm test');
    console.log('3. Commit: git add . && git commit -m "security: Fix CORS wildcard vulnerabilities"');
    console.log('4. Deploy to production\n');

    // Show fixed files
    if (stats.files.length <= 10) {
      console.log('Fixed files:');
      stats.files.forEach(f => console.log(`  - ${f}`));
    } else {
      console.log(`Fixed ${stats.files.length} files (use git diff to see all changes)`);
    }
  }

} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}
