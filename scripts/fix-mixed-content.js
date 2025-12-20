#!/usr/bin/env node
/**
 * 🔒 FIX MIXED CONTENT - HTTPS ENFORCEMENT
 * =========================================
 *
 * Converts all HTTP references to HTTPS in HTML files
 * Specifically targets:
 * - External resources (CDN, fonts, images)
 * - API endpoints (localhost -> production HTTPS)
 * - Third-party scripts
 *
 * BEYAZ ŞAPKA - WHITE HAT SEO
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');

// Patterns to fix
const FIXES = [
  // External CDNs - ensure HTTPS
  {
    pattern: /http:\/\/cdn\./gi,
    replacement: 'https://cdn.',
    description: 'CDN resources to HTTPS'
  },
  {
    pattern: /http:\/\/fonts\./gi,
    replacement: 'https://fonts.',
    description: 'Google Fonts to HTTPS'
  },
  {
    pattern: /http:\/\/ajax\./gi,
    replacement: 'https://ajax.',
    description: 'AJAX libraries to HTTPS'
  },
  {
    pattern: /http:\/\/code\./gi,
    replacement: 'https://code.',
    description: 'Code libraries to HTTPS'
  },
  {
    pattern: /http:\/\/stackpath\./gi,
    replacement: 'https://stackpath.',
    description: 'StackPath CDN to HTTPS'
  },
  {
    pattern: /http:\/\/cdnjs\./gi,
    replacement: 'https://cdnjs.',
    description: 'CDNJS to HTTPS'
  },
  {
    pattern: /http:\/\/unpkg\./gi,
    replacement: 'https://unpkg.',
    description: 'unpkg CDN to HTTPS'
  },
  {
    pattern: /http:\/\/maxcdn\./gi,
    replacement: 'https://maxcdn.',
    description: 'MaxCDN to HTTPS'
  },
  // External images
  {
    pattern: /http:\/\/images\./gi,
    replacement: 'https://images.',
    description: 'Image resources to HTTPS'
  },
  {
    pattern: /http:\/\/img\./gi,
    replacement: 'https://img.',
    description: 'Image resources to HTTPS'
  },
  // Videos
  {
    pattern: /http:\/\/videos\./gi,
    replacement: 'https://videos.',
    description: 'Video resources to HTTPS'
  },
  {
    pattern: /http:\/\/assets\./gi,
    replacement: 'https://assets.',
    description: 'Asset resources to HTTPS'
  }
];

// Localhost patterns - will be handled by relative URLs or environment detection
const LOCALHOST_PATTERNS = [
  /http:\/\/localhost:\d+/gi
];

/**
 * Find all HTML files
 */
function findHtmlFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findHtmlFiles(filePath));
    } else if (file.endsWith('.html') && !file.includes('backup') && !file.includes('BACKUP')) {
      results.push(filePath);
    }
  });

  return results;
}

/**
 * Check for mixed content
 */
function checkMixedContent(content) {
  const issues = [];

  // Check for HTTP in src, href, url() attributes
  const httpMatches = content.match(/(?:src|href|url\()\s*=?\s*["']http:\/\/[^"']+["']/gi);
  if (httpMatches) {
    httpMatches.forEach(match => {
      // Skip localhost and standard namespaces
      if (!match.includes('localhost') &&
          !match.includes('www.w3.org') &&
          !match.includes('schema.org')) {
        issues.push(match);
      }
    });
  }

  return issues;
}

/**
 * Fix mixed content in file
 */
function fixMixedContent(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const fixes = [];

  // Apply all FIXES
  FIXES.forEach(fix => {
    if (fix.pattern.test(content)) {
      const before = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== before) {
        modified = true;
        fixes.push(fix.description);
      }
    }
  });

  // Check for remaining mixed content (excluding localhost)
  const remainingIssues = checkMixedContent(content);
  const nonLocalhostIssues = remainingIssues.filter(issue => !issue.includes('localhost'));

  if (modified) {
    // Backup original
    const backupPath = filePath + '.backup-mixed-content';
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, fs.readFileSync(filePath), 'utf8');
    }

    // Write fixed content
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return {
    file: filePath,
    modified,
    fixes,
    remainingIssues: nonLocalhostIssues.length,
    issues: nonLocalhostIssues
  };
}

/**
 * Add environment-based API URL handling
 */
function addApiUrlHelper(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if file has localhost API calls
  if (!content.includes('localhost:3100')) {
    return { modified: false };
  }

  // Check if API_BASE is already defined
  if (content.includes('API_BASE')) {
    return { modified: false };
  }

  // Add environment detection for API endpoints
  const apiHelper = `
        // 🔒 HTTPS Enforcement - Auto-detect environment
        const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3100/api'
            : 'https://www.ailydian.com/api';
`;

  // Find a good place to insert (before first fetch or in first script tag)
  const scriptMatch = content.match(/<script[^>]*>/i);
  if (scriptMatch) {
    const insertIndex = content.indexOf(scriptMatch[0]) + scriptMatch[0].length;
    content = content.slice(0, insertIndex) + apiHelper + content.slice(insertIndex);

    // Replace localhost URLs with API_BASE
    content = content.replace(/['"]http:\/\/localhost:3100\/api/g, '`${API_BASE}');
    content = content.replace(/\/api\//g, '/');  // Clean up double /api/api/

    fs.writeFileSync(filePath, content, 'utf8');
    return { modified: true };
  }

  return { modified: false };
}

/**
 * Main execution
 */
async function main() {
  console.log('🔒 MIXED CONTENT FIX - HTTPS Enforcement');
  console.log('========================================\n');

  const htmlFiles = findHtmlFiles(PUBLIC_DIR);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  const results = {
    total: htmlFiles.length,
    modified: 0,
    clean: 0,
    issues: []
  };

  htmlFiles.forEach(file => {
    const result = fixMixedContent(file);

    if (result.modified) {
      results.modified++;
      console.log(`✅ Fixed: ${path.basename(file)}`);
      result.fixes.forEach(fix => {
        console.log(`   - ${fix}`);
      });
    } else if (result.remainingIssues > 0) {
      results.issues.push(result);
      console.log(`⚠️  Issues: ${path.basename(file)} (${result.remainingIssues} mixed content)`);
    } else {
      results.clean++;
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log('📊 MIXED CONTENT FIX SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Files: ${results.total}`);
  console.log(`✅ Modified: ${results.modified}`);
  console.log(`✅ Clean: ${results.clean}`);
  console.log(`⚠️  With Issues: ${results.issues.length}`);

  if (results.issues.length > 0) {
    console.log('\n⚠️  Files with Remaining Mixed Content:');
    results.issues.forEach(issue => {
      console.log(`\n${path.basename(issue.file)}:`);
      issue.issues.forEach(i => console.log(`  - ${i}`));
    });
  }

  // Save report
  const reportPath = path.join(__dirname, '../MIXED-CONTENT-FIX-REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n✅ Report saved: ${reportPath}`);

  return results;
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { fixMixedContent, checkMixedContent, findHtmlFiles };
