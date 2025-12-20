#!/usr/bin/env node
/**
 * 🔐 STRING-GUARD - AI Provider/Model Name Detection Tool
 * ============================================================================
 * Purpose: Scan codebase for hardcoded AI provider, model, and technology names
 * Policy: White-Hat • Zero Mock • Audit-Ready
 *
 * Usage:
 *   node ops/tools/string-guard.js [--fix] [--report=json|md]
 *
 * Detects:
 * - AI Provider names (OpenAI, Anthropic, Google, etc.)
 * - Model names (GPT, AX9F7E2B, Gemini, etc.)
 * - API endpoints and keys
 * - Technology stack names (non-generic)
 *
 * Exit codes:
 *   0 - No violations found
 *   1 - Violations found (fails CI)
 *   2 - Error during scan
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  rootDir: process.cwd(),
  excludeDirs: [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    '.vercel',
    'playwright-report',
    'test-results',
    'coverage',
    'ops/tools' // Exclude this tool itself
  ],
  excludeFiles: [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.DS_Store'
  ],
  includeExtensions: [
    '.js', '.ts', '.jsx', '.tsx',
    '.json', '.md', '.html', '.css',
    '.yml', '.yaml', '.env.example'
  ]
};

// Forbidden strings (AI providers, models, technologies)
// Note: "Ailydian" is ALLOWED (our brand), "LyDian" is ALLOWED
const FORBIDDEN_PATTERNS = [
  // AI Providers
  { pattern: /\bOpenAI\b/gi, type: 'provider', name: 'lydian-labs', severity: 'critical' },
  { pattern: /\bAnthropic\b/gi, type: 'provider', name: 'lydian-research', severity: 'critical' },
  { pattern: /\bGoogle\s+(AI|Gemini|PaLM|Bard)\b/gi, type: 'provider', name: 'Google AI', severity: 'critical' },
  { pattern: /\bMicrosoft\s+(Azure|Cognitive)\b/gi, type: 'provider', name: 'Microsoft Azure AI', severity: 'critical' },
  { pattern: /\bCohere\b/gi, type: 'provider', name: 'Cohere', severity: 'critical' },
  { pattern: /\bHugging\s*Face\b/gi, type: 'provider', name: 'Hugging Face', severity: 'critical' },
  { pattern: /\bStability\s*AI\b/gi, type: 'provider', name: 'Stability AI', severity: 'critical' },
  { pattern: /\bMidjourney\b/gi, type: 'provider', name: 'Midjourney', severity: 'critical' },
  { pattern: /\bDALL-?E\b/gi, type: 'provider', name: 'DALL-E', severity: 'critical' },

  // Model Names
  { pattern: /\bGPT-?[0-9o]+(-turbo|-vision|-instruct)?\b/gi, type: 'model', name: 'GPT models', severity: 'critical' },
  { pattern: /\bAX9F7E2B(-\d+)?(-instant|-opus|-sonnet)?\b/gi, type: 'model', name: 'AX9F7E2B models', severity: 'critical' },
  { pattern: /\bGemini(-pro|-ultra|-nano)?\b/gi, type: 'model', name: 'Gemini models', severity: 'critical' },
  { pattern: /\bPaLM-?2?\b/gi, type: 'model', name: 'PaLM models', severity: 'critical' },
  { pattern: /\bBard\b/gi, type: 'model', name: 'Bard', severity: 'critical' },
  { pattern: /\bLlama-?\d*\b/gi, type: 'model', name: 'LLaMA models', severity: 'critical' },
  { pattern: /\bMistral(-\d+[bB])?\b/gi, type: 'model', name: 'Mistral models', severity: 'critical' },

  // API Endpoints (specific domains)
  { pattern: /api\.openai\.com/gi, type: 'endpoint', name: 'OpenAI API', severity: 'critical' },
  { pattern: /api\.anthropic\.com/gi, type: 'endpoint', name: 'Anthropic API', severity: 'critical' },
  { pattern: /generativelanguage\.googleapis\.com/gi, type: 'endpoint', name: 'Google AI API', severity: 'critical' },
  { pattern: /openai\.azure\.com/gi, type: 'endpoint', name: 'Azure OpenAI', severity: 'critical' },

  // API Keys (in non-example files)
  { pattern: /sk-[a-zA-Z0-9]{48}/g, type: 'secret', name: 'OpenAI API Key', severity: 'critical' },
  { pattern: /sk-ant-[a-zA-Z0-9-]{95}/g, type: 'secret', name: 'Anthropic API Key', severity: 'critical' },

  // Technology Stack (non-generic)
  { pattern: /\bLangChain\b/gi, type: 'tech', name: 'LangChain', severity: 'high' },
  { pattern: /\bLlamaIndex\b/gi, type: 'tech', name: 'LlamaIndex', severity: 'high' },
  { pattern: /\bVoyage\s*AI\b/gi, type: 'tech', name: 'Voyage AI', severity: 'high' }
];

// Allowlist (exceptions - e.g., in comments or docs explaining the system)
const ALLOWLIST_PATHS = [
  'ops/reports/',    // Reports can mention providers
  'README.md',       // Docs can explain
  'CHANGELOG.md',
  'ops/tools/string-guard.js'  // This file itself
];

// Scan results
const violations = [];
let filesScanned = 0;
let totalLines = 0;

/**
 * Check if path should be excluded
 */
function shouldExclude(filePath) {
  const relativePath = path.relative(CONFIG.rootDir, filePath);

  // Check allowlist first
  if (ALLOWLIST_PATHS.some(allowed => relativePath.includes(allowed))) {
    return true;
  }

  // Check excluded directories
  if (CONFIG.excludeDirs.some(dir => relativePath.includes(dir))) {
    return true;
  }

  // Check excluded files
  if (CONFIG.excludeFiles.includes(path.basename(filePath))) {
    return true;
  }

  // Check file extension
  const ext = path.extname(filePath);
  if (ext && !CONFIG.includeExtensions.includes(ext)) {
    return true;
  }

  return false;
}

/**
 * Scan a single file for violations
 */
function scanFile(filePath) {
  if (shouldExclude(filePath)) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    totalLines += lines.length;
    filesScanned++;

    lines.forEach((line, lineNum) => {
      FORBIDDEN_PATTERNS.forEach(({ pattern, type, name, severity }) => {
        const matches = line.match(pattern);
        if (matches) {
          const relativePath = path.relative(CONFIG.rootDir, filePath);

          violations.push({
            file: relativePath,
            line: lineNum + 1,
            content: line.trim().substring(0, 100),
            type,
            name,
            severity,
            match: matches[0]
          });
        }
      });
    });
  } catch (error) {
    // Ignore binary files and permission errors
    if (error.code !== 'EISDIR' && error.code !== 'EACCES') {
      console.error(`Error scanning ${filePath}: ${error.message}`);
    }
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile()) {
        scanFile(fullPath);
      }
    });
  } catch (error) {
    // Ignore permission errors
    if (error.code !== 'EACCES') {
      console.error(`Error reading directory ${dir}: ${error.message}`);
    }
  }
}

/**
 * Generate violation report
 */
function generateReport(format = 'console') {
  const criticalCount = violations.filter(v => v.severity === 'critical').length;
  const highCount = violations.filter(v => v.severity === 'high').length;
  const totalCount = violations.length;

  if (format === 'json') {
    return JSON.stringify({
      summary: {
        filesScanned,
        totalLines,
        violations: totalCount,
        critical: criticalCount,
        high: highCount
      },
      violations: violations.map(v => ({
        file: v.file,
        line: v.line,
        type: v.type,
        name: v.name,
        severity: v.severity,
        match: v.match
      }))
    }, null, 2);
  }

  if (format === 'md') {
    let md = '# 🔐 STRING-GUARD SCAN REPORT\n\n';
    md += `**Date:** ${new Date().toISOString()}\n\n`;
    md += '## Summary\n\n';
    md += `- **Files Scanned:** ${filesScanned}\n`;
    md += `- **Total Lines:** ${totalLines}\n`;
    md += `- **Violations Found:** ${totalCount}\n`;
    md += `  - Critical: ${criticalCount}\n`;
    md += `  - High: ${highCount}\n\n`;

    if (totalCount === 0) {
      md += '✅ **No violations found. Codebase is clean.**\n';
    } else {
      md += '## Violations\n\n';

      // Group by severity
      ['critical', 'high'].forEach(severity => {
        const sevViolations = violations.filter(v => v.severity === severity);
        if (sevViolations.length > 0) {
          md += `### ${severity.toUpperCase()} (${sevViolations.length})\n\n`;
          md += '| File | Line | Type | Name | Match |\n';
          md += '|------|------|------|------|-------|\n';

          sevViolations.forEach(v => {
            md += `| ${v.file} | ${v.line} | ${v.type} | ${v.name} | \`${v.match}\` |\n`;
          });
          md += '\n';
        }
      });
    }

    return md;
  }

  // Console format
  console.log('\n🔐 STRING-GUARD SCAN REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`Files Scanned: ${filesScanned}`);
  console.log(`Total Lines: ${totalLines}`);
  console.log(`Violations Found: ${totalCount}`);
  console.log(`  - Critical: ${criticalCount}`);
  console.log(`  - High: ${highCount}\n`);

  if (totalCount === 0) {
    console.log('✅ No violations found. Codebase is clean.\n');
    return;
  }

  console.log('VIOLATIONS:\n');

  violations.slice(0, 50).forEach((v, i) => {
    console.log(`${i + 1}. [${v.severity.toUpperCase()}] ${v.file}:${v.line}`);
    console.log(`   Type: ${v.type} | Name: ${v.name}`);
    console.log(`   Match: "${v.match}"`);
    console.log(`   Context: ${v.content}`);
    console.log('');
  });

  if (violations.length > 50) {
    console.log(`... and ${violations.length - 50} more violations\n`);
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const reportFormat = args.find(a => a.startsWith('--report='))?.split('=')[1] || 'console';
  const outputFile = args.find(a => a.startsWith('--output='))?.split('=')[1];

  console.log('🔍 Starting STRING-GUARD scan...\n');
  console.log(`Root directory: ${CONFIG.rootDir}`);
  console.log(`Excluded directories: ${CONFIG.excludeDirs.join(', ')}\n`);

  // Scan
  scanDirectory(CONFIG.rootDir);

  // Generate report
  const report = generateReport(reportFormat);

  // Save to file if requested
  if (outputFile) {
    fs.writeFileSync(outputFile, report);
    console.log(`Report saved to: ${outputFile}`);
  }

  // Exit with appropriate code
  const criticalCount = violations.filter(v => v.severity === 'critical').length;

  if (criticalCount > 0) {
    console.log(`\n❌ FAIL: ${criticalCount} critical violations found`);
    console.log('Codebase contains hardcoded AI provider/model names');
    process.exit(1);
  } else if (violations.length > 0) {
    console.log(`\n⚠️  WARNING: ${violations.length} high-severity violations found`);
    process.exit(0); // Warning only, don't fail CI
  } else {
    console.log('\n✅ SUCCESS: No violations found');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory, FORBIDDEN_PATTERNS };
