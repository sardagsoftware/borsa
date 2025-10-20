#!/usr/bin/env node

/**
 * AI Provider Obfuscation Validation Script
 * Scans codebase for AI provider name leaks
 * WHITE-HAT SECURITY - Zero Tolerance for Provider Exposure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Sensitive AI provider terms to detect
const SENSITIVE_TERMS = [
  'claude-3',
  'claude-2',
  'gpt-4',
  'gpt-3.5',
  'gpt-3',
  'anthropic.com',
  'openai.com',
  'api.anthropic',
  'api.openai',
  'gemini-pro',
  'text-davinci',
  'text-curie',
  'perplexity-sonar',
  'claude-instant',
  'claude-opus',
  'claude-sonnet',
  'claude-haiku'
];

// Directories to scan
const SCAN_DIRS = [
  'api',
  'public',
  'lib',
  'middleware'
];

// Files to exclude from scan
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'validate-ai-obfuscation.js', // This file itself
  'ai-obfuscator.js', // The obfuscator contains mappings
  '.md', // Documentation files
  'BACKUP',
  'backup'
];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

let totalViolations = 0;
let filesScanned = 0;

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
}

/**
 * Scan file for sensitive terms
 */
function scanFile(filePath) {
  if (shouldExclude(filePath)) {
    return [];
  }

  filesScanned++;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];

    SENSITIVE_TERMS.forEach(term => {
      const regex = new RegExp(term, 'gi');
      let match;
      let lineNumber = 1;
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (regex.test(line)) {
          violations.push({
            term,
            line: index + 1,
            content: line.trim().substring(0, 100)
          });
        }
      });
    });

    return violations;
  } catch (error) {
    console.error(`${colors.red}Error reading ${filePath}: ${error.message}${colors.reset}`);
    return [];
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir) {
  const results = [];

  try {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);

      if (shouldExclude(fullPath)) {
        return;
      }

      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        results.push(...scanDirectory(fullPath));
      } else if (stat.isFile()) {
        const violations = scanFile(fullPath);
        if (violations.length > 0) {
          results.push({
            file: fullPath,
            violations
          });
        }
      }
    });
  } catch (error) {
    console.error(`${colors.red}Error scanning directory ${dir}: ${error.message}${colors.reset}`);
  }

  return results;
}

/**
 * Main validation function
 */
function validateObfuscation() {
  console.log(`${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════╗
║  AI PROVIDER OBFUSCATION VALIDATION                   ║
║  White-Hat Security - Zero Tolerance Policy           ║
╚═══════════════════════════════════════════════════════╝
${colors.reset}`);

  const projectRoot = process.cwd();
  console.log(`\n${colors.cyan}Scanning project: ${projectRoot}${colors.reset}\n`);

  const allResults = [];

  // Scan each directory
  SCAN_DIRS.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`${colors.cyan}📁 Scanning ${dir}...${colors.reset}`);
      const results = scanDirectory(dirPath);
      allResults.push(...results);
    }
  });

  // Print results
  console.log(`\n${colors.bold}═══════════════════════════════════════${colors.reset}\n`);

  if (allResults.length === 0) {
    console.log(`${colors.green}${colors.bold}✅ SUCCESS: No AI provider leaks detected!${colors.reset}`);
    console.log(`${colors.green}✅ Files scanned: ${filesScanned}${colors.reset}`);
    console.log(`${colors.green}✅ Obfuscation validation: PASSED${colors.reset}\n`);
    return 0;
  }

  // Print violations
  console.log(`${colors.red}${colors.bold}❌ VIOLATIONS DETECTED: ${allResults.length} files${colors.reset}\n`);

  allResults.forEach(result => {
    console.log(`${colors.yellow}📄 ${result.file}${colors.reset}`);
    result.violations.forEach(violation => {
      console.log(`   ${colors.red}Line ${violation.line}: ${colors.reset}${violation.term}`);
      console.log(`   ${colors.reset}${violation.content}${colors.reset}`);
      totalViolations++;
    });
    console.log('');
  });

  console.log(`${colors.red}${colors.bold}Total Violations: ${totalViolations}${colors.reset}`);
  console.log(`${colors.yellow}Files Scanned: ${filesScanned}${colors.reset}\n`);

  return 1;
}

/**
 * Generate report
 */
function generateReport(results) {
  const reportPath = path.join(process.cwd(), 'ops/reports/ai-obfuscation-validation.json');

  const report = {
    timestamp: new Date().toISOString(),
    filesScanned,
    totalViolations,
    violations: results,
    passed: results.length === 0
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`${colors.cyan}📄 Report saved: ${reportPath}${colors.reset}\n`);
}

// Run validation
const exitCode = validateObfuscation();
process.exit(exitCode);
