#!/usr/bin/env node
/**
 * 🔒 COMPLETE AI MODEL OBFUSCATION SCRIPT
 * ========================================
 *
 * Tüm AI model isimlerini (Claude, GPT, Gemini, Llama, vb.)
 * kod tabanından tamamen kaldırır ve LyDian kodları ile değiştirir.
 *
 * BEYAZ ŞAPKA GÜVENLİK KURALLARI:
 * - Sadece text replacement yapar
 * - Fonksiyonelliği korur
 * - Backup oluşturur
 * - Geri alınabilir
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Obfuscation mapping
const OBFUSCATION_MAP = {
  // === ANTHROPIC (CLAUDE) ===
  'claude-3-5-sonnet-20241022': 'AX9F7E2B',
  'claude-3-5-sonnet': 'AX9F7E2B',
  'claude-3.5-sonnet': 'AX9F7E2B',
  'claude-sonnet-3.5': 'AX9F7E2B',
  'claude-3-opus-20240229': 'AX4D8C1A',
  'claude-3-opus': 'AX4D8C1A',
  'claude-opus': 'AX4D8C1A',
  'claude-3-haiku-20240307': 'AX2B6E9F',
  'claude-3-haiku': 'AX2B6E9F',
  'claude-haiku': 'AX2B6E9F',
  'claude': 'AX9F7E2B', // Default to Sonnet

  // === OPENAI (GPT) ===
  'gpt-4-turbo-preview': 'OX7A3F8D',
  'gpt-4-turbo': 'OX7A3F8D',
  'gpt-4o': 'OX7A3F8D',
  'gpt-4': 'OX5C9E2B',
  'gpt-3.5-turbo': 'OX1D4A7F',
  'gpt-3.5': 'OX1D4A7F',

  // === GROQ (LLAMA) ===
  'llama-3.3-70b-versatile': 'GX8E2D9A',
  'llama-3.3-70b': 'GX8E2D9A',
  'llama-3.2-90b-vision': 'GX7F4B8C', // Llama Vision 90B
  'llama-3.2-11b-vision': 'GX2E9A4D', // Llama Vision 11B
  'llama-3.1-70b-versatile': 'GX9A5E1D',
  'llama-3.1-70b': 'GX9A5E1D',
  'llama-3.1-8b-instant': 'GX3C7D5F', // Llama Instant 8B
  'llama-3-70b': 'GX9A5E1D',
  'mixtral-8x7b-32768': 'GX4B7F3C',
  'mixtral-8x7b': 'GX4B7F3C',

  // === GOOGLE (GEMINI) ===
  'gemini-pro': 'GE6D8A4F',
  'gemini-1.5-pro': 'GE6D8A4F',
  'gemini-pro-vision': 'GE3F9B2E',
  'gemini-vision': 'GE3F9B2E',

  // === MISTRAL ===
  'mistral-large-latest': 'MX7C4E9A',
  'mistral-large': 'MX7C4E9A'
};

// Provider name mapping
const PROVIDER_MAP = {
  'anthropic': 'lydian-research',
  'openai': 'lydian-labs',
  'groq': 'lydian-velocity',
  'google': 'lydian-vision',
  'mistral': 'lydian-enterprise'
};

// Display name mapping
const DISPLAY_MAP = {
  'AX9F7E2B': 'LyDian Quantum Reasoning',
  'AX4D8C1A': 'LyDian Ultra Intelligence',
  'AX2B6E9F': 'LyDian FastTrack',
  'OX7A3F8D': 'LyDian Advanced Neural',
  'OX5C9E2B': 'LyDian Pro Intelligence',
  'OX1D4A7F': 'LyDian Rapid Response',
  'GX8E2D9A': 'LyDian Velocity Engine',
  'GX4B7F3C': 'LyDian Distributed Core',
  'GX9A5E1D': 'LyDian Performance',
  'GE6D8A4F': 'LyDian Multimodal Core',
  'GE3F9B2E': 'LyDian Vision Intelligence',
  'MX7C4E9A': 'LyDian Enterprise Core'
};

// Files/directories to skip
const SKIP_PATTERNS = [
  'node_modules',
  '.git',
  '.archive',
  'docs/archive',
  'package-lock.json',
  'pnpm-lock.yaml',
  '.env',
  '.env.example',
  'security/ultra-obfuscation-map.js',
  'scripts/complete-ai-obfuscation.js' // Skip self
];

// File extensions to process
const PROCESS_EXTENSIONS = [
  '.js', '.mjs', '.cjs',
  '.html', '.htm',
  '.md', '.txt',
  '.json' // Careful with JSON
];

let stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacements: 0,
  errors: []
};

/**
 * Check if path should be skipped
 */
function shouldSkip(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  return SKIP_PATTERNS.some(pattern => relativePath.includes(pattern));
}

/**
 * Check if file should be processed
 */
function shouldProcess(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return PROCESS_EXTENSIONS.includes(ext);
}

/**
 * Obfuscate content
 */
function obfuscateContent(content, filePath) {
  let modified = content;
  let changeCount = 0;
  const ext = path.extname(filePath);

  // === STEP 1: Obfuscate exact model names ===
  Object.entries(OBFUSCATION_MAP).forEach(([original, code]) => {
    const regex = new RegExp(original.replace(/\./g, '\\.'), 'gi');
    const before = modified;
    modified = modified.replace(regex, code);
    if (before !== modified) {
      changeCount++;
      console.log(`  ✓ Replaced "${original}" → "${code}"`);
    }
  });

  // === STEP 2: Obfuscate provider names (only in strings) ===
  if (ext === '.js' || ext === '.html') {
    Object.entries(PROVIDER_MAP).forEach(([original, replacement]) => {
      // Only replace in strings, not in URLs or imports
      const patterns = [
        new RegExp(`(['"\`])${original}(['"\`])`, 'gi'),
        new RegExp(`provider:\\s*(['"\`])${original}(['"\`])`, 'gi'),
        new RegExp(`"provider":\\s*"${original}"`, 'gi')
      ];

      patterns.forEach(pattern => {
        const before = modified;
        modified = modified.replace(pattern, (match, q1, q2) => {
          if (q1 && q2) {
            return `${q1}${replacement}${q2}`;
          } else {
            return match.replace(original, replacement);
          }
        });
        if (before !== modified) changeCount++;
      });
    });
  }

  // === STEP 3: Obfuscate in comments and markdown ===
  if (ext === '.md' || ext === '.txt' || ext === '.html') {
    // Claude variations
    modified = modified.replace(/Claude\s+(3\.5|3\.0|3|Opus|Sonnet|Haiku)/gi, 'LyDian Engine');
    modified = modified.replace(/\bClaude\b/g, 'LyDian Engine');
    modified = modified.replace(/\bAnthropic\b/g, 'LyDian Research');

    // GPT variations
    modified = modified.replace(/GPT[-\s]?(4o?|4|3\.5)/gi, 'LyDian Core');
    modified = modified.replace(/\bGPT\b/g, 'LyDian Core');
    modified = modified.replace(/\bOpenAI\b/g, 'LyDian Labs');

    // Gemini
    modified = modified.replace(/Gemini\s+(Pro|Vision|1\.5)/gi, 'LyDian Vision');
    modified = modified.replace(/\bGemini\b/g, 'LyDian Vision');

    // Llama
    modified = modified.replace(/Llama\s+(3\.3|3\.1|3)/gi, 'LyDian Velocity');
    modified = modified.replace(/\bLlama\b/g, 'LyDian Velocity');

    // Groq
    modified = modified.replace(/\bGroq\b/g, 'LyDian Acceleration');
  }

  stats.replacements += changeCount;
  return { content: modified, changed: changeCount > 0 };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    stats.filesProcessed++;

    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, changed } = obfuscateContent(content, filePath);

    if (changed) {
      // Create backup
      const backupPath = `${filePath}.pre-obfuscation`;
      fs.writeFileSync(backupPath, content, 'utf8');

      // Write obfuscated content
      fs.writeFileSync(filePath, newContent, 'utf8');
      stats.filesModified++;

      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`✅ Modified: ${relativePath}`);
    }
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (shouldSkip(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && shouldProcess(fullPath)) {
      processFile(fullPath);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔒 COMPLETE AI MODEL OBFUSCATION');
  console.log('==================================\n');

  const startTime = Date.now();
  const rootDir = process.cwd();

  console.log(`📂 Processing: ${rootDir}\n`);

  // Process all files
  processDirectory(rootDir);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 OBFUSCATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Files processed: ${stats.filesProcessed}`);
  console.log(`✏️  Files modified: ${stats.filesModified}`);
  console.log(`🔄 Total replacements: ${stats.replacements}`);
  console.log(`⏱️  Duration: ${duration}s`);

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors: ${stats.errors.length}`);
    stats.errors.forEach(err => {
      console.log(`   - ${err.file}: ${err.error}`);
    });
  }

  console.log('\n✅ OBFUSCATION COMPLETE!');
  console.log('💾 Backups saved with .pre-obfuscation extension');
  console.log('🔄 To rollback: find . -name "*.pre-obfuscation" -exec sh -c \'mv "$1" "${1%.pre-obfuscation}"\' _ {} \\;');
}

// Run
if (require.main === module) {
  main();
}

module.exports = { obfuscateContent, OBFUSCATION_MAP, DISPLAY_MAP };
