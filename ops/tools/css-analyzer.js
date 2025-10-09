#!/usr/bin/env node
/**
 * CSS Bundle Analyzer - Phase M
 *
 * Analyzes CSS files, their usage across HTML pages, and provides optimization recommendations.
 *
 * Usage:
 *   node ops/tools/css-analyzer.js
 */

const fs = require('fs').promises;
const path = require('path');

const PUBLIC_DIR = './public';
const CSS_DIR = './public/css';

/**
 * Format bytes to human readable
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Get file size
 */
async function getFileSize(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Find all files with extension
 */
async function findFiles(dir, extension) {
  const files = [];

  async function walk(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (!['node_modules', 'dist', '.git', 'ops'].includes(entry.name)) {
            await walk(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  await walk(dir);
  return files;
}

/**
 * Extract CSS links from HTML
 */
function extractCSSLinks(html) {
  const cssRegex = /<link[^>]*href=["']([^"']*\.css)["'][^>]*>/g;
  const links = [];
  let match;

  while ((match = cssRegex.exec(html)) !== null) {
    links.push(match[1]);
  }

  return links;
}

/**
 * Analyze CSS usage across HTML files
 */
async function analyzeCSSUsage() {
  console.log('🎨 CSS Bundle Analyzer - Phase M\n');
  console.log('Analyzing CSS usage across HTML files...\n');

  // Find all CSS files
  const cssFiles = await findFiles(CSS_DIR, '.css');
  const cssData = [];

  for (const cssFile of cssFiles) {
    const size = await getFileSize(cssFile);
    const relativePath = path.relative(PUBLIC_DIR, cssFile);

    cssData.push({
      path: cssFile,
      relativePath,
      name: path.basename(cssFile),
      size,
      usedBy: []
    });
  }

  // Sort by size
  cssData.sort((a, b) => b.size - a.size);

  // Find all HTML files
  const htmlFiles = await findFiles(PUBLIC_DIR, '.html');
  const htmlCSSMap = {};

  for (const htmlFile of htmlFiles) {
    const html = await fs.readFile(htmlFile, 'utf-8');
    const cssLinks = extractCSSLinks(html);
    const htmlName = path.basename(htmlFile);

    htmlCSSMap[htmlName] = cssLinks;

    // Map CSS to HTML files
    for (const link of cssLinks) {
      const cssName = path.basename(link);
      const css = cssData.find(c => c.name === cssName);
      if (css) {
        css.usedBy.push(htmlName);
      }
    }
  }

  return { cssData, htmlCSSMap, htmlFiles };
}

/**
 * Generate CSS analysis report
 */
function generateReport(cssData, htmlCSSMap, htmlFiles) {
  const totalSize = cssData.reduce((sum, css) => sum + css.size, 0);
  const budget = 100 * 1024; // 100 KB
  const overBudget = totalSize > budget;
  const excess = totalSize - budget;

  console.log('═══════════════════════════════════════════');
  console.log('📊 CSS BUNDLE ANALYSIS REPORT');
  console.log('═══════════════════════════════════════════\n');

  // Summary
  console.log('📦 CSS Summary');
  console.log('───────────────────────────────────────────');
  console.log(`Total CSS Files: ${cssData.length}`);
  console.log(`Total Size: ${formatSize(totalSize)}`);
  console.log(`Budget: ${formatSize(budget)}`);

  if (overBudget) {
    console.log(`⚠️  OVER BUDGET by ${formatSize(excess)} (${((excess / budget) * 100).toFixed(0)}%)`);
  } else {
    console.log(`✅ Within budget`);
  }

  // Top CSS files
  console.log('\n📈 CSS Files by Size:');
  console.log('───────────────────────────────────────────');
  cssData.forEach((css, i) => {
    const percentage = ((css.size / totalSize) * 100).toFixed(1);
    const usageInfo = css.usedBy.length > 0
      ? `Used by ${css.usedBy.length} page(s)`
      : '⚠️  Not used by any HTML';

    console.log(`${(i + 1).toString().padStart(2)}. ${css.name.padEnd(35)} ${formatSize(css.size).padStart(10)} (${percentage.padStart(5)}%) - ${usageInfo}`);
  });

  // CSS usage patterns
  console.log('\n\n📄 CSS Usage by Page:');
  console.log('═══════════════════════════════════════════\n');

  for (const [htmlName, cssLinks] of Object.entries(htmlCSSMap)) {
    if (cssLinks.length === 0) continue;

    let pageSize = 0;
    cssLinks.forEach(link => {
      const cssName = path.basename(link);
      const css = cssData.find(c => c.name === cssName);
      if (css) pageSize += css.size;
    });

    console.log(`📄 ${htmlName}`);
    console.log(`   Total CSS: ${formatSize(pageSize)}`);
    console.log(`   Files (${cssLinks.length}):`);

    cssLinks.forEach(link => {
      const cssName = path.basename(link);
      const css = cssData.find(c => c.name === cssName);
      if (css) {
        console.log(`     • ${cssName.padEnd(30)} ${formatSize(css.size).padStart(10)}`);
      }
    });
    console.log('');
  }

  // Identify page-specific CSS
  console.log('\n💡 OPTIMIZATION OPPORTUNITIES');
  console.log('═══════════════════════════════════════════\n');

  // Page-specific CSS that should be lazy loaded
  const pageSpecificCSS = cssData.filter(css =>
    css.usedBy.length === 1 && css.size > 10 * 1024 // > 10KB used by only 1 page
  );

  if (pageSpecificCSS.length > 0) {
    console.log(`🎯 Page-Specific CSS (${pageSpecificCSS.length} files, ${formatSize(pageSpecificCSS.reduce((s, c) => s + c.size, 0))}):`);
    console.log('   These files are used by only ONE page and should be lazy loaded:\n');

    pageSpecificCSS.forEach(css => {
      console.log(`   • ${css.name.padEnd(30)} ${formatSize(css.size).padStart(10)} → Used by ${css.usedBy[0]}`);
      console.log(`     → Recommendation: Load only when ${css.usedBy[0]} is accessed`);
    });
    console.log('');
  }

  // Unused CSS
  const unusedCSS = cssData.filter(css => css.usedBy.length === 0);
  if (unusedCSS.length > 0) {
    console.log(`⚠️  Unused CSS Files (${unusedCSS.length} files, ${formatSize(unusedCSS.reduce((s, c) => s + c.size, 0))}):`);
    console.log('   These files are not referenced by any HTML:\n');

    unusedCSS.forEach(css => {
      console.log(`   • ${css.name.padEnd(30)} ${formatSize(css.size).padStart(10)}`);
      console.log(`     → Recommendation: Remove or add to HTML if needed`);
    });
    console.log('');
  }

  // Common CSS loaded on multiple pages
  const commonCSS = cssData.filter(css => css.usedBy.length > 3);
  if (commonCSS.length > 0) {
    console.log(`🌍 Common CSS (${commonCSS.length} files, ${formatSize(commonCSS.reduce((s, c) => s + c.size, 0))}):`);
    console.log('   These files are used across multiple pages:\n');

    commonCSS.forEach(css => {
      console.log(`   • ${css.name.padEnd(30)} ${formatSize(css.size).padStart(10)} → ${css.usedBy.length} pages`);
      console.log(`     → Good for caching (shared across pages)`);
    });
    console.log('');
  }

  // Optimization recommendations
  console.log('\n⚡ OPTIMIZATION RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════\n');

  const recommendations = [];

  if (pageSpecificCSS.length > 0) {
    const savings = pageSpecificCSS.reduce((s, c) => s + c.size, 0);
    recommendations.push({
      priority: 'HIGH',
      savings,
      title: 'Implement route-based CSS loading',
      description: `Load page-specific CSS only when needed (${pageSpecificCSS.length} files, ${formatSize(savings)} savings)`
    });
  }

  if (unusedCSS.length > 0) {
    const savings = unusedCSS.reduce((s, c) => s + c.size, 0);
    recommendations.push({
      priority: 'MEDIUM',
      savings,
      title: 'Remove unused CSS files',
      description: `${unusedCSS.length} files are not used (${formatSize(savings)} potential savings)`
    });
  }

  // Large files that could benefit from minification
  const largeCSS = cssData.filter(css => css.size > 20 * 1024);
  if (largeCSS.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      savings: largeCSS.reduce((s, c) => s + c.size, 0) * 0.3, // Assume 30% reduction
      title: 'Minify large CSS files',
      description: `${largeCSS.length} files > 20KB could be minified (est. 30% reduction)`
    });
  }

  recommendations.push({
    priority: 'HIGH',
    savings: totalSize * 0.4, // Assume 40% unused
    title: 'Run PurgeCSS to remove unused styles',
    description: 'Remove unused CSS selectors and rules (est. 40% reduction)'
  });

  recommendations.push({
    priority: 'HIGH',
    savings: 0,
    title: 'Extract critical CSS',
    description: 'Extract above-the-fold CSS (<14KB) and inline it'
  });

  // Sort by savings
  recommendations.sort((a, b) => b.savings - a.savings);

  recommendations.forEach((rec, i) => {
    const savingsText = rec.savings > 0 ? ` (Save ${formatSize(rec.savings)})` : '';
    console.log(`${i + 1}. [${rec.priority}] ${rec.title}${savingsText}`);
    console.log(`   ${rec.description}`);
    console.log('');
  });

  // Expected outcomes
  const totalPotentialSavings = recommendations.reduce((s, r) => s + r.savings, 0);
  const afterOptimization = totalSize - totalPotentialSavings;

  console.log('\n📊 EXPECTED OUTCOMES');
  console.log('═══════════════════════════════════════════');
  console.log(`Current Size:          ${formatSize(totalSize)}`);
  console.log(`Potential Savings:     ${formatSize(totalPotentialSavings)}`);
  console.log(`After Optimization:    ${formatSize(afterOptimization)}`);
  console.log(`Budget:                ${formatSize(budget)}`);

  if (afterOptimization <= budget) {
    console.log(`✅ Would be within budget!`);
  } else {
    console.log(`⚠️  Still over budget by ${formatSize(afterOptimization - budget)}`);
  }

  console.log('\n');

  return {
    totalSize,
    budget,
    overBudget,
    cssFiles: cssData.length,
    pageSpecificCSS: pageSpecificCSS.length,
    unusedCSS: unusedCSS.length,
    commonCSS: commonCSS.length,
    potentialSavings: totalPotentialSavings,
    recommendations
  };
}

/**
 * Main
 */
async function main() {
  try {
    const { cssData, htmlCSSMap, htmlFiles } = await analyzeCSSUsage();
    const summary = generateReport(cssData, htmlCSSMap, htmlFiles);

    // Export results
    const results = {
      summary,
      cssData,
      htmlCSSMap,
      timestamp: new Date().toISOString()
    };

    await fs.writeFile(
      './ops/reports/css-analysis.json',
      JSON.stringify(results, null, 2)
    );

    console.log('📄 Full analysis saved to: ops/reports/css-analysis.json\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeCSSUsage, generateReport };
