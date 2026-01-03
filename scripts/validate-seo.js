#!/usr/bin/env node

/**
 * AILYDIAN SEO Validation Script
 * Checks if all SEO elements are properly configured
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║   AILYDIAN SEO VALIDATION                             ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;
let warnings = 0;

// Test 1: Check sitemap.xml exists
console.log('📋 Test 1: Sitemap.xml exists');
const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemapSize = fs.statSync(sitemapPath).size;
  console.log(`  ✅ PASS - Sitemap found (${(sitemapSize / 1024).toFixed(2)} KB)`);
  passed++;
} else {
  console.log('  ❌ FAIL - Sitemap not found');
  failed++;
}

// Test 2: Check robots.txt exists
console.log('\n📋 Test 2: Robots.txt exists');
const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
if (fs.existsSync(robotsPath)) {
  const robotsContent = fs.readFileSync(robotsPath, 'utf-8');

  // Check if it includes AI crawlers
  const hasAICrawlers =
    robotsContent.includes('GPTBot') &&
    robotsContent.includes('Claude') &&
    robotsContent.includes('PerplexityBot');

  if (hasAICrawlers) {
    console.log('  ✅ PASS - Robots.txt found with AI crawler support');
    passed++;
  } else {
    console.log('  ⚠️  WARNING - Robots.txt found but missing AI crawler rules');
    warnings++;
  }
} else {
  console.log('  ❌ FAIL - Robots.txt not found');
  failed++;
}

// Test 3: Check HTML files for SEO tags
console.log('\n📋 Test 3: HTML files have SEO meta tags');
const htmlFiles = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html'));
let filesWithSEO = 0;
let filesWithoutSEO = 0;

htmlFiles.slice(0, 10).forEach(file => {
  const filePath = path.join(PUBLIC_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  const hasSEOTags = content.includes('AILYDIAN SEO META TAGS');
  const hasTitle = content.includes('<title>');
  const hasDescription = content.includes('name="description"');
  const hasOG = content.includes('og:title');
  const hasSchema = content.includes('application/ld+json');
  const hasHreflang = content.includes('hreflang');

  if (hasSEOTags && hasTitle && hasDescription && hasOG && hasSchema && hasHreflang) {
    filesWithSEO++;
  } else {
    filesWithoutSEO++;
  }
});

console.log(`  ✅ Sampled ${htmlFiles.slice(0, 10).length} files:`);
console.log(`     - ${filesWithSEO} with complete SEO tags`);
console.log(`     - ${filesWithoutSEO} missing some SEO elements`);

if (filesWithSEO >= 8) {
  console.log('  ✅ PASS - Majority of files have SEO tags');
  passed++;
} else {
  console.log('  ❌ FAIL - Too many files missing SEO tags');
  failed++;
}

// Test 4: Check index.html specifically
console.log('\n📋 Test 4: Index.html has complete SEO');
const indexPath = path.join(PUBLIC_DIR, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');

  const checks = [
    { name: 'Title tag', test: indexContent.includes('<title>AILYDIAN') },
    { name: 'Meta description', test: indexContent.includes('name="description"') },
    { name: 'Open Graph tags', test: indexContent.includes('og:title') },
    { name: 'Twitter Cards', test: indexContent.includes('twitter:card') },
    { name: 'AI context meta', test: indexContent.includes('ai:context') },
    { name: 'Schema.org', test: indexContent.includes('@type') },
    { name: 'Hreflang tags', test: indexContent.includes('hreflang="tr"') },
    { name: 'Canonical URL', test: indexContent.includes('rel="canonical"') },
  ];

  const passedChecks = checks.filter(c => c.test).length;

  checks.forEach(check => {
    console.log(`     ${check.test ? '✅' : '❌'} ${check.name}`);
  });

  if (passedChecks === checks.length) {
    console.log('  ✅ PASS - Index.html has all SEO elements');
    passed++;
  } else {
    console.log(`  ⚠️  WARNING - Index.html missing ${checks.length - passedChecks} elements`);
    warnings++;
  }
} else {
  console.log('  ❌ FAIL - Index.html not found');
  failed++;
}

// Test 5: Check sitemap references in robots.txt
console.log('\n📋 Test 5: Robots.txt references sitemap');
if (fs.existsSync(robotsPath)) {
  const robotsContent = fs.readFileSync(robotsPath, 'utf-8');

  if (robotsContent.includes('Sitemap: https://www.ailydian.com/sitemap.xml')) {
    console.log('  ✅ PASS - Sitemap URL found in robots.txt');
    passed++;
  } else {
    console.log('  ❌ FAIL - Sitemap URL not found in robots.txt');
    failed++;
  }
}

// Summary
console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║   VALIDATION SUMMARY                                  ║');
console.log('╚════════════════════════════════════════════════════════╝\n');
console.log(`  ✅ Passed: ${passed} tests`);
console.log(`  ⚠️  Warnings: ${warnings} tests`);
console.log(`  ❌ Failed: ${failed} tests`);

const totalTests = passed + warnings + failed;
const score = (((passed + warnings * 0.5) / totalTests) * 100).toFixed(1);

console.log(`\n  📊 Overall Score: ${score}%`);

if (score >= 90) {
  console.log('  🏆 EXCELLENT - SEO is production-ready!');
} else if (score >= 70) {
  console.log('  ✅ GOOD - Minor improvements needed');
} else {
  console.log('  ⚠️  NEEDS WORK - Fix failed tests before deployment');
}

console.log('\n🎯 Next Steps:');
console.log('  1. Test with Google Rich Results: https://search.google.com/test/rich-results');
console.log('  2. Validate sitemap: https://www.xml-sitemaps.com/validate-xml-sitemap.html');
console.log('  3. Test robots.txt: https://www.google.com/webmasters/tools/robots-testing-tool');
console.log('  4. Run Lighthouse audit: npm run lighthouse');
console.log('  5. Submit to Google Search Console\n');
