#!/usr/bin/env node
/**
 * Bundle Size Analyzer - Phase L
 *
 * Analyzes JavaScript and CSS bundle sizes and provides optimization recommendations.
 *
 * Usage:
 *   node ops/tools/bundle-analyzer.js [--dir=./public] [--json]
 */

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const zlib = require('zlib');
const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

// Configuration
const config = {
  dir: './public',
  outputJSON: process.argv.includes('--json'),
  budgets: {
    javascript: 300 * 1024,   // 300 KB
    css: 100 * 1024,          // 100 KB
    total: 2000 * 1024,       // 2 MB
  },
  largeFileThreshold: 100 * 1024, // 100 KB
};

// Parse args
process.argv.forEach(arg => {
  if (arg.startsWith('--dir=')) {
    config.dir = arg.split('=')[1];
  }
});

/**
 * Format bytes to human readable
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Get file size with compression estimates
 */
async function analyzeFile(filePath) {
  const content = await fs.readFile(filePath);
  const stat = await fs.stat(filePath);

  const gzipped = await gzip(content, { level: 6 });
  const brotlied = await brotli(content);

  return {
    path: filePath,
    size: stat.size,
    gzipSize: gzipped.length,
    brotliSize: brotlied.length,
    gzipRatio: ((stat.size - gzipped.length) / stat.size * 100).toFixed(1),
    brotliRatio: ((stat.size - brotlied.length) / stat.size * 100).toFixed(1),
  };
}

/**
 * Find all files of type
 */
async function findFiles(dir, extension) {
  const files = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, dist, etc.
        if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
          await walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

/**
 * Analyze all bundles
 */
async function analyzeBundles() {
  console.log('🔍 Bundle Size Analyzer - Phase L\n');
  console.log(`Analyzing directory: ${config.dir}\n`);

  const results = {
    javascript: [],
    css: [],
    timestamp: new Date().toISOString(),
  };

  // Analyze JavaScript
  console.log('📊 Analyzing JavaScript files...\n');
  const jsFiles = await findFiles(config.dir, '.js');

  for (const file of jsFiles) {
    const analysis = await analyzeFile(file);
    results.javascript.push(analysis);
  }

  results.javascript.sort((a, b) => b.size - a.size);

  // Analyze CSS
  console.log('📊 Analyzing CSS files...\n');
  const cssFiles = await findFiles(config.dir, '.css');

  for (const file of cssFiles) {
    const analysis = await analyzeFile(file);
    results.css.push(analysis);
  }

  results.css.sort((a, b) => b.size - a.size);

  return results;
}

/**
 * Generate report
 */
function generateReport(results) {
  const totalJS = results.javascript.reduce((sum, f) => sum + f.size, 0);
  const totalCSS = results.css.reduce((sum, f) => sum + f.size, 0);
  const totalGzipJS = results.javascript.reduce((sum, f) => sum + f.gzipSize, 0);
  const totalGzipCSS = results.css.reduce((sum, f) => sum + f.gzipSize, 0);

  console.log('═══════════════════════════════════════════');
  console.log('📊 BUNDLE SIZE ANALYSIS REPORT');
  console.log('═══════════════════════════════════════════\n');

  // JavaScript Summary
  console.log('📦 JavaScript Summary');
  console.log('───────────────────────────────────────────');
  console.log(`Files: ${results.javascript.length}`);
  console.log(`Total Size: ${formatSize(totalJS)}`);
  console.log(`Gzipped: ${formatSize(totalGzipJS)} (-${((totalJS - totalGzipJS) / totalJS * 100).toFixed(1)}%)`);
  console.log(`Budget: ${formatSize(config.budgets.javascript)}`);

  const jsOverBudget = totalJS > config.budgets.javascript;
  if (jsOverBudget) {
    const excess = totalJS - config.budgets.javascript;
    console.log(`⚠️  OVER BUDGET by ${formatSize(excess)} (${((excess / config.budgets.javascript) * 100).toFixed(0)}%)`);
  } else {
    console.log(`✅ Within budget`);
  }

  // Top 10 largest JS files
  console.log('\n📈 Top 10 Largest JavaScript Files:');
  console.log('───────────────────────────────────────────');
  results.javascript.slice(0, 10).forEach((file, i) => {
    const relPath = path.relative(config.dir, file.path);
    const sizeMB = file.size / (1024 * 1024);
    const bar = '█'.repeat(Math.min(40, Math.floor(sizeMB * 100)));

    console.log(`${i + 1}. ${relPath}`);
    console.log(`   ${formatSize(file.size)} → ${formatSize(file.gzipSize)} gzip (-${file.gzipRatio}%)`);
    console.log(`   ${bar}`);
  });

  // CSS Summary
  console.log('\n\n📦 CSS Summary');
  console.log('───────────────────────────────────────────');
  console.log(`Files: ${results.css.length}`);
  console.log(`Total Size: ${formatSize(totalCSS)}`);
  console.log(`Gzipped: ${formatSize(totalGzipCSS)} (-${((totalCSS - totalGzipCSS) / totalCSS * 100).toFixed(1)}%)`);
  console.log(`Budget: ${formatSize(config.budgets.css)}`);

  const cssOverBudget = totalCSS > config.budgets.css;
  if (cssOverBudget) {
    const excess = totalCSS - config.budgets.css;
    console.log(`⚠️  OVER BUDGET by ${formatSize(excess)} (${((excess / config.budgets.css) * 100).toFixed(0)}%)`);
  } else {
    console.log(`✅ Within budget`);
  }

  // Top 10 largest CSS files
  if (results.css.length > 0) {
    console.log('\n📈 Top 10 Largest CSS Files:');
    console.log('───────────────────────────────────────────');
    results.css.slice(0, 10).forEach((file, i) => {
      const relPath = path.relative(config.dir, file.path);
      console.log(`${i + 1}. ${relPath}`);
      console.log(`   ${formatSize(file.size)} → ${formatSize(file.gzipSize)} gzip (-${file.gzipRatio}%)`);
    });
  }

  // Recommendations
  console.log('\n\n💡 OPTIMIZATION RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════\n');

  const largeFiles = results.javascript.filter(f => f.size > config.largeFileThreshold);
  if (largeFiles.length > 0) {
    console.log(`🎯 ${largeFiles.length} files over ${formatSize(config.largeFileThreshold)}:`);
    largeFiles.forEach(file => {
      const relPath = path.relative(config.dir, file.path);
      console.log(`   • ${relPath} (${formatSize(file.size)})`);

      if (relPath.includes('three.min.js')) {
        console.log(`     → Implement lazy loading (defer until user interaction)`);
      }
      if (relPath.includes('chat')) {
        console.log(`     → Load only on chat pages`);
      }
    });
  }

  if (jsOverBudget) {
    console.log(`\n⚡ JavaScript bundle exceeds budget:`);
    console.log(`   • Implement code splitting`);
    console.log(`   • Use route-based loading`);
    console.log(`   • Lazy load heavy libraries`);
    console.log(`   • Tree-shake unused code`);
  }

  if (cssOverBudget) {
    console.log(`\n⚡ CSS bundle exceeds budget:`);
    console.log(`   • Remove unused CSS (PurgeCSS)`);
    console.log(`   • Extract critical CSS`);
    console.log(`   • Defer non-critical styles`);
  }

  // Overall status
  console.log('\n\n📊 OVERALL STATUS');
  console.log('═══════════════════════════════════════════');
  const totalSize = totalJS + totalCSS;
  console.log(`Total Bundle Size: ${formatSize(totalSize)}`);
  console.log(`Total Gzipped: ${formatSize(totalGzipJS + totalGzipCSS)}`);
  console.log(`Budget: ${formatSize(config.budgets.total)}`);

  if (totalSize > config.budgets.total) {
    console.log(`⚠️  OVER BUDGET by ${formatSize(totalSize - config.budgets.total)}`);
  } else {
    console.log(`✅ Within overall budget`);
  }

  console.log('\n');

  return {
    javascript: {
      count: results.javascript.length,
      totalSize: totalJS,
      gzippedSize: totalGzipJS,
      budget: config.budgets.javascript,
      overBudget: jsOverBudget,
    },
    css: {
      count: results.css.length,
      totalSize: totalCSS,
      gzippedSize: totalGzipCSS,
      budget: config.budgets.css,
      overBudget: cssOverBudget,
    },
    total: {
      size: totalSize,
      gzippedSize: totalGzipJS + totalGzipCSS,
      budget: config.budgets.total,
      overBudget: totalSize > config.budgets.total,
    },
  };
}

/**
 * Main
 */
async function main() {
  try {
    const results = await analyzeBundles();
    const summary = generateReport(results);

    if (config.outputJSON) {
      const output = {
        ...summary,
        files: results,
        timestamp: results.timestamp,
      };
      console.log(JSON.stringify(output, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeBundles, generateReport };
