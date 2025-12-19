/**
 * 🔥 AI REFERENCE ELIMINATOR
 * ==========================
 *
 * This script scans and eliminates ALL AI model/provider references
 * from the entire codebase, replacing them with obfuscated versions.
 *
 * SECURITY LEVEL: MAXIMUM
 * Created: 2025-12-19
 */

const fs = require('fs');
const path = require('path');
const { obfuscateText } = require('../security/ultra-obfuscation-v2');

// ========================================
// CONFIGURATION
// ========================================

const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  '.vercel',
  'dist',
  'build',
  '.next',
  'coverage',
  'ops/backups',
  'tests'
];

const EXCLUDE_FILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.env',
  '.env.local',
  '.env.production',
  'eliminate-ai-references.js',
  'ultra-obfuscation-v2.js',
  'ultra-obfuscation-map.js'
];

const TARGET_EXTENSIONS = [
  '.js', '.ts', '.jsx', '.tsx',
  '.html', '.css',
  '.json',
  '.md'
];

// Patterns to find and replace
const AI_PATTERNS = [
  // Provider names
  { pattern: /\banthropic\b/gi, replacement: 'LyDian-Research', type: 'provider' },
  { pattern: /\bopenai\b/gi, replacement: 'LyDian-Labs', type: 'provider' },
  { pattern: /\bgroq\b/gi, replacement: 'LyDian-Acceleration', type: 'provider' },
  { pattern: /\bgoogle\s+ai\b/gi, replacement: 'LyDian-Multimodal', type: 'provider' },
  { pattern: /\bmistral\s+ai\b/gi, replacement: 'LyDian-Enterprise', type: 'provider' },

  // Claude models
  { pattern: /claude-3\.5-sonnet-[\d-]+/gi, replacement: 'QR-SONNET-5', type: 'model' },
  { pattern: /claude-3-sonnet-[\d-]+/gi, replacement: 'QR-SONNET-3', type: 'model' },
  { pattern: /claude-3-opus-[\d-]+/gi, replacement: 'QR-OPUS-3', type: 'model' },
  { pattern: /claude-3-haiku-[\d-]+/gi, replacement: 'QR-HAIKU-3', type: 'model' },
  { pattern: /claude[-\s]?3\.5[-\s]?sonnet/gi, replacement: 'QR-SONNET-5', type: 'model' },
  { pattern: /claude[-\s]?3[-\s]?opus/gi, replacement: 'QR-OPUS-3', type: 'model' },
  { pattern: /claude[-\s]?3[-\s]?haiku/gi, replacement: 'QR-HAIKU-3', type: 'model' },
  { pattern: /\bclaude\b/gi, replacement: 'LyDian-Quantum', type: 'model' },

  // GPT models
  { pattern: /gpt-4-turbo-preview/gi, replacement: 'NC-TURBO-4', type: 'model' },
  { pattern: /gpt-4-turbo/gi, replacement: 'NC-TURBO-4', type: 'model' },
  { pattern: /gpt-4/gi, replacement: 'NC-PRIME-4', type: 'model' },
  { pattern: /gpt-3\.5-turbo/gi, replacement: 'NC-RAPID-35', type: 'model' },
  { pattern: /gpt-3\.5/gi, replacement: 'NC-RAPID-35', type: 'model' },

  // Llama models
  { pattern: /llama-3\.3-70b-versatile/gi, replacement: 'VE-LLAMA-33', type: 'model' },
  { pattern: /llama-3\.1-70b-versatile/gi, replacement: 'VE-LLAMA-31', type: 'model' },
  { pattern: /llama[-\s]?3\.3[-\s]?70b/gi, replacement: 'VE-LLAMA-33', type: 'model' },
  { pattern: /llama[-\s]?3\.1[-\s]?70b/gi, replacement: 'VE-LLAMA-31', type: 'model' },
  { pattern: /llama[-\s]?70b/gi, replacement: 'VE-LLAMA', type: 'model' },

  // Mixtral models
  { pattern: /mixtral-8x7b-32768/gi, replacement: 'VE-MIXTRAL-8X7', type: 'model' },
  { pattern: /mixtral[-\s]?8x7b/gi, replacement: 'VE-MIXTRAL-8X7', type: 'model' },

  // Gemini models
  { pattern: /gemini-pro-vision/gi, replacement: 'MM-GEMINI-VIS', type: 'model' },
  { pattern: /gemini-pro/gi, replacement: 'MM-GEMINI-PRO', type: 'model' },
  { pattern: /gemini/gi, replacement: 'LyDian-Multimodal', type: 'model' },

  // Mistral models
  { pattern: /mistral-large-latest/gi, replacement: 'EC-MISTRAL-LG', type: 'model' },
  { pattern: /mistral-large/gi, replacement: 'EC-MISTRAL-LG', type: 'model' }
];

// ========================================
// UTILITY FUNCTIONS
// ========================================

function shouldProcessFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);

  // Check if file is excluded
  if (EXCLUDE_FILES.includes(fileName)) {
    return false;
  }

  // Check if extension is target
  if (!TARGET_EXTENSIONS.includes(ext)) {
    return false;
  }

  // Check if in excluded directory
  for (const excludeDir of EXCLUDE_DIRS) {
    if (filePath.includes(`/${excludeDir}/`) || filePath.includes(`\\${excludeDir}\\`)) {
      return false;
    }
  }

  return true;
}

function processFile(filePath, dryRun = true) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changes = [];

    // Apply each pattern
    for (const { pattern, replacement, type } of AI_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        const uniqueMatches = [...new Set(matches)];
        content = content.replace(pattern, replacement);
        modified = true;
        changes.push({
          type,
          matches: uniqueMatches,
          replacement
        });
      }
    }

    if (modified) {
      if (!dryRun) {
        // Create backup
        const backupPath = `${filePath}.backup-${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);

        // Write modified content
        fs.writeFileSync(filePath, content, 'utf8');
      }

      return {
        file: filePath,
        modified: true,
        changes
      };
    }

    return null;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

function scanDirectory(dir, results = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip excluded directories
        if (!EXCLUDE_DIRS.includes(entry.name)) {
          scanDirectory(fullPath, results);
        }
      } else if (entry.isFile()) {
        if (shouldProcessFile(fullPath)) {
          results.push(fullPath);
        }
      }
    }

    return results;
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error.message);
    return results;
  }
}

// ========================================
// MAIN EXECUTION
// ========================================

function main() {
  console.log('🔥 AI REFERENCE ELIMINATOR');
  console.log('=========================\n');

  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const targetDir = args.find(arg => !arg.startsWith('--')) || process.cwd();

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No files will be modified');
    console.log('   Use --execute flag to apply changes\n');
  } else {
    console.log('🔧 EXECUTION MODE - Files will be modified\n');
  }

  console.log(`📁 Scanning directory: ${targetDir}\n`);

  // Scan for files
  const files = scanDirectory(targetDir);
  console.log(`📊 Found ${files.length} files to process\n`);

  // Process files
  const results = [];
  let processedCount = 0;

  for (const file of files) {
    const result = processFile(file, dryRun);
    if (result) {
      results.push(result);
      processedCount++;

      console.log(`✅ ${path.relative(targetDir, file)}`);
      for (const change of result.changes) {
        console.log(`   ${change.type}: ${change.matches.join(', ')} → ${change.replacement}`);
      }
      console.log('');
    }
  }

  // Summary
  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log(`Total files scanned: ${files.length}`);
  console.log(`Files with AI references: ${processedCount}`);
  console.log(`Total replacements: ${results.reduce((sum, r) => sum + r.changes.length, 0)}`);

  if (dryRun) {
    console.log('\n⚠️  This was a dry run. No files were modified.');
    console.log('   Run with --execute to apply changes.');
  } else {
    console.log('\n✅ All changes applied successfully!');
    console.log('   Backups created with .backup-[timestamp] extension');
  }

  // Save report
  const reportPath = path.join(targetDir, 'ai-elimination-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, scanDirectory, AI_PATTERNS };
