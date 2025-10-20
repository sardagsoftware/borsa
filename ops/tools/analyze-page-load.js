#!/usr/bin/env node
/**
 * Page Load Bundle Analyzer
 *
 * Analyzes what JavaScript is loaded on initial page load vs lazy loaded.
 * Calculates the bundle size reduction achieved by code splitting.
 *
 * Usage: node ops/tools/analyze-page-load.js [--url=http://localhost:3100]
 */

const fs = require('fs').promises;
const path = require('path');

const PUBLIC_DIR = './public';

/**
 * Format bytes to human readable
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Extract script sources from HTML
 */
function extractScripts(html) {
  const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/g;
  const scripts = [];
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
  }

  return scripts;
}

/**
 * Check if script is lazy-loaded based on route-loader config
 */
function isLazyLoaded(scriptPath) {
  // Based on route-loader.js configuration
  const lazyScripts = [
    '/js/three.min.js'
  ];

  return lazyScripts.some(lazy => scriptPath.includes(lazy));
}

/**
 * Get file size
 */
async function getFileSize(filePath) {
  try {
    const fullPath = path.join(PUBLIC_DIR, filePath);
    const stat = await fs.stat(fullPath);
    return stat.size;
  } catch (error) {
    console.warn(`Warning: Could not get size for ${filePath}`);
    return 0;
  }
}

/**
 * Analyze page load
 */
async function analyzePageLoad(htmlFile = 'index.html') {
  console.log('📊 Page Load Bundle Analyzer\n');
  console.log(`Analyzing: ${htmlFile}\n`);

  // Read HTML file
  const htmlPath = path.join(PUBLIC_DIR, htmlFile);
  const html = await fs.readFile(htmlPath, 'utf-8');

  // Extract all script tags
  const allScripts = extractScripts(html);
  console.log(`Found ${allScripts.length} script tags\n`);

  // Categorize scripts
  const initialScripts = [];
  const lazyScripts = [];

  for (const script of allScripts) {
    if (isLazyLoaded(script)) {
      lazyScripts.push(script);
    } else {
      initialScripts.push(script);
    }
  }

  // Calculate sizes
  let initialSize = 0;
  let lazySize = 0;

  console.log('📦 INITIAL BUNDLE (Loaded immediately)');
  console.log('═══════════════════════════════════════════\n');

  for (const script of initialScripts) {
    const size = await getFileSize(script);
    initialSize += size;
    console.log(`  ${script.padEnd(40)} ${formatSize(size).padStart(12)}`);
  }

  console.log('\n───────────────────────────────────────────');
  console.log(`Total Initial Bundle: ${formatSize(initialSize)}\n\n`);

  console.log('⏳ LAZY LOADED (Loaded on interaction)');
  console.log('═══════════════════════════════════════════\n');

  for (const script of lazyScripts) {
    const size = await getFileSize(script);
    lazySize += size;
    console.log(`  ${script.padEnd(40)} ${formatSize(size).padStart(12)}`);
  }

  console.log('\n───────────────────────────────────────────');
  console.log(`Total Lazy Loaded: ${formatSize(lazySize)}\n\n`);

  // Summary
  const totalSize = initialSize + lazySize;
  const reduction = (lazySize / totalSize * 100).toFixed(1);

  console.log('📈 BUNDLE SIZE ANALYSIS');
  console.log('═══════════════════════════════════════════\n');
  console.log(`Initial Bundle:        ${formatSize(initialSize)}`);
  console.log(`Lazy Loaded:           ${formatSize(lazySize)}`);
  console.log(`Total Scripts:         ${formatSize(totalSize)}`);
  console.log(`\n✅ Bundle Reduction:    ${reduction}% (${formatSize(lazySize)} saved from initial load)\n`);

  // Performance impact
  console.log('⚡ PERFORMANCE IMPACT');
  console.log('═══════════════════════════════════════════\n');

  // Estimate download time at different speeds (bytes per second)
  const speeds = {
    '3G': 750 * 1024,      // 750 KB/s
    '4G': 3 * 1024 * 1024,  // 3 MB/s
    'Wifi': 10 * 1024 * 1024 // 10 MB/s
  };

  console.log('Estimated download time savings:\n');

  for (const [name, speed] of Object.entries(speeds)) {
    const beforeTime = ((totalSize / speed) * 1000).toFixed(0);
    const afterTime = ((initialSize / speed) * 1000).toFixed(0);
    const saved = beforeTime - afterTime;

    console.log(`  ${name.padEnd(10)} Before: ${beforeTime}ms → After: ${afterTime}ms (Save ${saved}ms)`);
  }

  console.log('\n');

  // Recommendations
  console.log('💡 NEXT STEPS');
  console.log('═══════════════════════════════════════════\n');
  console.log('1. Test lazy loading behavior in browser:');
  console.log('   - Open http://localhost:3100/ in browser');
  console.log('   - Check Network tab (three.js should NOT load initially)');
  console.log('   - Scroll or click - three.js should load on interaction\n');
  console.log('2. Run Lighthouse audit to measure performance improvement\n');
  console.log('3. Apply same pattern to other heavy libraries\n');

  return {
    initialSize,
    lazySize,
    totalSize,
    reduction: parseFloat(reduction),
    initialScripts,
    lazyScripts
  };
}

// Main
if (require.main === module) {
  analyzePageLoad()
    .catch(error => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { analyzePageLoad };
