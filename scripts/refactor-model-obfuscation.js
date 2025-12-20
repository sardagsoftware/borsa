#!/usr/bin/env node

/**
 * 🔐 AI MODEL OBFUSCATION REFACTORING SCRIPT
 * ===========================================
 * Automatically refactor code to use obfuscated model codes
 *
 * SECURITY: Removes all AI model name references
 * Replaces with LX/VX/QX/NX codes
 */

const fs = require('fs');
const path = require('path');

// Patterns to detect model names (case-insensitive)
const MODEL_PATTERNS = {
  // Provider names
  AX9F7E2B: /AX9F7E2B[\s-]*(3|2)?[\s-]*(sonnet|opus|haiku)?[\s-]*[\w-]*/gi,
  gpt: /gpt[\s-]*[0-9.]*[\s-]*(turbo|preview|vision)?[\s-]*[\w-]*/gi,
  gemini: /gemini[\s-]*(pro|ultra|nano)?[\s-]*[\w-]*/gi,
  groq: /groq[\s-]*[\w-]*/gi,
  mixtral: /mixtral[\s-]*[\w-]*/gi,
  llama: /llama[\s-]*[0-9]*[\s-]*[\w-]*/gi,
  anthropic: /anthropic/gi,
  openai: /openai/gi,
  google: /google[\s-]*ai/gi,

  // Model-specific patterns
  'OX1D4A7F': /gpt-3\.5-turbo/gi,
  'OX7A3F8D': /OX7A3F8D/gi,
  'OX5C9E2B-vision-preview': /OX5C9E2B-vision-preview/gi,
  'AX9F7E2B-3-sonnet': /AX9F7E2B-3-sonnet-\d+/gi,
  'GX4B7F3C': /GX4B7F3C-\d+/gi,
  'llama2-70b': /llama2-70b-\d+/gi,
  'GE6D8A4F': /GE6D8A4F/gi
};

// Replacement mappings (what to replace model references with)
const REPLACEMENT_MAP = {
  // Generic replacements for frontend
  'AX9F7E2B': 'LyDian AI Engine',
  'gpt': 'LyDian AI Engine',
  'gemini': 'LyDian AI Engine',
  'lydian-velocity': 'LyDian AI Engine',
  'mixtral': 'LyDian AI Engine',
  'llama': 'LyDian AI Engine',
  'lydian-research': 'LyDian',
  'lydian-labs': 'LyDian',
  'google ai': 'LyDian'
};

/**
 * Scan a file for model name references
 * @param {string} filePath - Path to file
 * @returns {object} - Detection results
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const detections = {};
    let totalMatches = 0;

    Object.entries(MODEL_PATTERNS).forEach(([modelName, pattern]) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        detections[modelName] = matches.length;
        totalMatches += matches.length;
      }
    });

    return {
      file: filePath,
      detections,
      totalMatches,
      hasDetections: totalMatches > 0
    };
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Scan directory recursively
 * @param {string} dir - Directory path
 * @param {array} extensions - File extensions to scan
 */
function scanDirectory(dir, extensions = ['.js', '.html', '.jsx', '.ts', '.tsx']) {
  const results = [];

  function scan(currentDir) {
    const files = fs.readdirSync(currentDir);

    files.forEach(file => {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules, .git, dist, build
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(file)) {
          scan(fullPath);
        }
      } else {
        const ext = path.extname(file);
        if (extensions.includes(ext)) {
          const result = scanFile(fullPath);
          if (result && result.hasDetections) {
            results.push(result);
          }
        }
      }
    });
  }

  scan(dir);
  return results;
}

/**
 * Generate scan report
 * @param {array} results - Scan results
 */
function generateReport(results) {
  console.log('\n🔍 AI MODEL OBFUSCATION SCAN REPORT');
  console.log('===================================\n');

  if (results.length === 0) {
    console.log('✅ No model name references found!\n');
    return;
  }

  console.log(`❌ Found ${results.length} files with model references:\n`);

  // Sort by total matches (most first)
  results.sort((a, b) => b.totalMatches - a.totalMatches);

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.file}`);
    console.log(`   Total matches: ${result.totalMatches}`);
    console.log('   Detections:');
    Object.entries(result.detections).forEach(([model, count]) => {
      console.log(`     - ${model}: ${count}`);
    });
    console.log('');
  });

  // Summary statistics
  const totalFiles = results.length;
  const totalMatches = results.reduce((sum, r) => sum + r.totalMatches, 0);

  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log(`Total files affected: ${totalFiles}`);
  console.log(`Total model references: ${totalMatches}`);
  console.log('');

  // Model breakdown
  const modelBreakdown = {};
  results.forEach(result => {
    Object.entries(result.detections).forEach(([model, count]) => {
      modelBreakdown[model] = (modelBreakdown[model] || 0) + count;
    });
  });

  console.log('Model breakdown:');
  Object.entries(modelBreakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([model, count]) => {
      console.log(`  - ${model}: ${count} occurrences`);
    });

  console.log('');
}

/**
 * Refactor a single file (DRY RUN)
 * @param {string} filePath - Path to file
 * @param {boolean} applyChanges - Whether to actually apply changes
 */
function refactorFile(filePath, applyChanges = false) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let changesMade = 0;

    // Apply replacements
    Object.entries(MODEL_PATTERNS).forEach(([modelName, pattern]) => {
      const replacement = REPLACEMENT_MAP[modelName] || '[AI_ENGINE]';
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        changesMade += matches.length;
      }
    });

    if (changesMade > 0) {
      if (applyChanges) {
        // Create backup
        const backupPath = `${filePath}.bak-obfuscation`;
        fs.writeFileSync(backupPath, originalContent, 'utf8');

        // Write changes
        fs.writeFileSync(filePath, content, 'utf8');

        console.log(`✅ Refactored ${filePath} (${changesMade} changes) - Backup: ${backupPath}`);
      } else {
        console.log(`📝 Would refactor ${filePath} (${changesMade} changes) - DRY RUN`);
      }
    }

    return changesMade;
  } catch (error) {
    console.error(`Error refactoring ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'scan';
  const targetDir = args[1] || process.cwd();

  console.log(`\n🔐 AI Model Obfuscation Tool`);
  console.log(`Command: ${command}`);
  console.log(`Target: ${targetDir}\n`);

  switch (command) {
    case 'scan':
      console.log('Scanning for model references...\n');
      const scanResults = scanDirectory(targetDir);
      generateReport(scanResults);

      // Save report to file
      const reportPath = path.join(targetDir, 'MODEL-OBFUSCATION-SCAN-REPORT.json');
      fs.writeFileSync(reportPath, JSON.stringify(scanResults, null, 2), 'utf8');
      console.log(`📄 Detailed report saved to: ${reportPath}\n`);
      break;

    case 'scan-api':
      console.log('Scanning API directory...\n');
      const apiDir = path.join(targetDir, 'api');
      const apiResults = scanDirectory(apiDir);
      generateReport(apiResults);
      break;

    case 'scan-public':
      console.log('Scanning public directory...\n');
      const publicDir = path.join(targetDir, 'public');
      const publicResults = scanDirectory(publicDir, ['.html', '.js']);
      generateReport(publicResults);
      break;

    case 'refactor-dry-run':
      console.log('🧪 DRY RUN: Testing refactoring (no changes will be made)...\n');
      const dryRunResults = scanDirectory(targetDir);
      dryRunResults.forEach(result => {
        refactorFile(result.file, false);
      });
      console.log('\n⚠️  This was a DRY RUN. To apply changes, use: refactor-apply\n');
      break;

    case 'refactor-apply':
      console.log('⚠️  APPLYING REFACTORING (files will be modified)...\n');
      console.log('Creating backups with .bak-obfuscation extension\n');

      const applyResults = scanDirectory(targetDir);
      let totalChanges = 0;

      applyResults.forEach(result => {
        const changes = refactorFile(result.file, true);
        totalChanges += changes;
      });

      console.log(`\n✅ Refactoring complete! Total changes: ${totalChanges}\n`);
      console.log('⚠️  Review the changes and test before deploying!\n');
      break;

    default:
      console.log('Unknown command. Available commands:');
      console.log('  scan               - Scan all files for model references');
      console.log('  scan-api           - Scan API directory only');
      console.log('  scan-public        - Scan public directory only');
      console.log('  refactor-dry-run   - Test refactoring without making changes');
      console.log('  refactor-apply     - Apply refactoring (creates backups)');
      console.log('\nUsage: node refactor-model-obfuscation.js [command] [directory]\n');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  scanFile,
  scanDirectory,
  generateReport,
  refactorFile
};
