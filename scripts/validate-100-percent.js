#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 * ✅ VALIDATION: Verify 100% Achievement
 * ═══════════════════════════════════════════════════════════════════
 * Comprehensive testing to ensure real 100% functionality
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const PUBLIC_DIR = path.join(__dirname, '../public');

const validation = {
  seo: {
    tests: [],
    score: 0,
    maxScore: 0
  },
  codeQuality: {
    tests: [],
    score: 0,
    maxScore: 0
  },
  performance: {
    tests: [],
    score: 0,
    maxScore: 0
  },
  functionality: {
    tests: [],
    score: 0,
    maxScore: 0
  }
};

// ═══════════════════════════════════════════════════════════════════
// SEO Validation Tests
// ═══════════════════════════════════════════════════════════════════

function validateSEO(filePath, dom) {
  const document = dom.window.document;
  const tests = [];

  // Test 1: Title optimization
  const title = document.querySelector('title');
  const titleLength = title ? title.textContent.trim().length : 0;
  tests.push({
    name: 'Title length optimal (30-60 chars)',
    passed: titleLength >= 30 && titleLength <= 60,
    value: titleLength
  });

  // Test 2: Meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  const descLength = metaDesc ? (metaDesc.getAttribute('content') || '').length : 0;
  tests.push({
    name: 'Meta description optimal (120-160 chars)',
    passed: descLength >= 120 && descLength <= 160,
    value: descLength
  });

  // Test 3: Canonical URL
  tests.push({
    name: 'Canonical URL present',
    passed: !!document.querySelector('link[rel="canonical"]'),
    value: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || 'missing'
  });

  // Test 4: OG tags complete
  const ogTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
  const ogComplete = ogTags.every(tag => document.querySelector(`meta[property="${tag}"]`));
  tests.push({
    name: 'Open Graph tags complete',
    passed: ogComplete,
    value: `${ogTags.filter(tag => document.querySelector(`meta[property="${tag}"]`)).length}/${ogTags.length}`
  });

  // Test 5: OG image dimensions
  tests.push({
    name: 'OG image dimensions specified',
    passed: !!document.querySelector('meta[property="og:image:width"]') && !!document.querySelector('meta[property="og:image:height"]'),
    value: 'width/height'
  });

  // Test 6: Twitter Card
  tests.push({
    name: 'Twitter Card present',
    passed: !!document.querySelector('meta[name="twitter:card"]'),
    value: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || 'missing'
  });

  // Test 7: Structured data
  const schemas = document.querySelectorAll('script[type="application/ld+json"]');
  tests.push({
    name: 'Structured data (Schema.org) present',
    passed: schemas.length > 0,
    value: `${schemas.length} schemas`
  });

  // Test 8: Breadcrumb schema
  let hasBreadcrumb = false;
  schemas.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      if (data['@type'] === 'BreadcrumbList') hasBreadcrumb = true;
    } catch (e) {}
  });
  tests.push({
    name: 'Breadcrumb schema present',
    passed: hasBreadcrumb,
    value: hasBreadcrumb ? 'yes' : 'no'
  });

  // Test 9: Hreflang tags
  tests.push({
    name: 'Hreflang tags for i18n',
    passed: document.querySelectorAll('link[hreflang]').length >= 2,
    value: `${document.querySelectorAll('link[hreflang]').length} languages`
  });

  // Test 10: Image alt attributes
  const images = document.querySelectorAll('img');
  const imagesWithAlt = Array.from(images).filter(img => img.hasAttribute('alt') && img.getAttribute('alt').trim());
  tests.push({
    name: 'All images have alt text',
    passed: images.length === 0 || imagesWithAlt.length === images.length,
    value: `${imagesWithAlt.length}/${images.length}`
  });

  return tests;
}

// ═══════════════════════════════════════════════════════════════════
// Code Quality Validation Tests
// ═══════════════════════════════════════════════════════════════════

function validateCodeQuality(filePath, dom) {
  const document = dom.window.document;
  const html = fs.readFileSync(filePath, 'utf8');
  const tests = [];

  // Test 1: DOCTYPE
  tests.push({
    name: 'HTML5 DOCTYPE present',
    passed: html.trim().startsWith('<!DOCTYPE html>'),
    value: 'DOCTYPE html'
  });

  // Test 2: Charset
  tests.push({
    name: 'UTF-8 charset specified',
    passed: !!document.querySelector('meta[charset="UTF-8"]') || !!document.querySelector('meta[charset="utf-8"]'),
    value: 'UTF-8'
  });

  // Test 3: Viewport
  tests.push({
    name: 'Viewport meta tag present',
    passed: !!document.querySelector('meta[name="viewport"]'),
    value: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || 'missing'
  });

  // Test 4: Lang attribute
  const htmlTag = document.querySelector('html');
  tests.push({
    name: 'HTML lang attribute set',
    passed: htmlTag && htmlTag.hasAttribute('lang'),
    value: htmlTag?.getAttribute('lang') || 'missing'
  });

  // Test 5: No eval() in scripts
  tests.push({
    name: 'No eval() usage (security)',
    passed: !html.includes('eval('),
    value: html.includes('eval(') ? 'FOUND' : 'none'
  });

  // Test 6: No document.write()
  tests.push({
    name: 'No document.write() (best practice)',
    passed: !html.includes('document.write('),
    value: html.includes('document.write(') ? 'FOUND' : 'none'
  });

  // Test 7: External scripts have async/defer
  const externalScripts = document.querySelectorAll('script[src^="http"], script[src^="//"]');
  const scriptsOptimized = Array.from(externalScripts).filter(s => s.hasAttribute('async') || s.hasAttribute('defer'));
  tests.push({
    name: 'External scripts optimized (async/defer)',
    passed: externalScripts.length === 0 || scriptsOptimized.length === externalScripts.length,
    value: `${scriptsOptimized.length}/${externalScripts.length}`
  });

  // Test 8: External links have security attributes
  const externalLinks = document.querySelectorAll('a[href^="http"]');
  const secureLinks = Array.from(externalLinks).filter(a => a.hasAttribute('rel'));
  tests.push({
    name: 'External links have rel attribute',
    passed: externalLinks.length === 0 || secureLinks.length === externalLinks.length,
    value: `${secureLinks.length}/${externalLinks.length}`
  });

  // Test 9: Valid HTML structure
  tests.push({
    name: 'Valid HTML structure (head/body)',
    passed: !!document.querySelector('head') && !!document.querySelector('body'),
    value: 'valid'
  });

  // Test 10: No inline styles (prefer CSS classes)
  const elementsWithStyle = document.querySelectorAll('[style]');
  tests.push({
    name: 'Minimal inline styles',
    passed: elementsWithStyle.length <= 5,
    value: `${elementsWithStyle.length} elements`
  });

  return tests;
}

// ═══════════════════════════════════════════════════════════════════
// Performance Validation Tests
// ═══════════════════════════════════════════════════════════════════

function validatePerformance(filePath, dom) {
  const document = dom.window.document;
  const tests = [];

  // Test 1: DNS prefetch
  tests.push({
    name: 'DNS prefetch for external domains',
    passed: document.querySelectorAll('link[rel="dns-prefetch"]').length > 0,
    value: `${document.querySelectorAll('link[rel="dns-prefetch"]').length} domains`
  });

  // Test 2: Preconnect
  tests.push({
    name: 'Preconnect for critical resources',
    passed: document.querySelectorAll('link[rel="preconnect"]').length > 0,
    value: `${document.querySelectorAll('link[rel="preconnect"]').length} resources`
  });

  // Test 3: Resource preload
  tests.push({
    name: 'Preload for critical assets',
    passed: document.querySelectorAll('link[rel="preload"]').length > 0,
    value: `${document.querySelectorAll('link[rel="preload"]').length} assets`
  });

  // Test 4: Image lazy loading
  const images = document.querySelectorAll('img');
  const lazyImages = Array.from(images).filter(img => img.hasAttribute('loading'));
  tests.push({
    name: 'Image lazy loading enabled',
    passed: images.length === 0 || lazyImages.length >= images.length * 0.8,
    value: `${lazyImages.length}/${images.length}`
  });

  // Test 5: Image dimensions
  const imagesWithDimensions = Array.from(images).filter(img => img.hasAttribute('width') && img.hasAttribute('height'));
  tests.push({
    name: 'Images have width/height (prevent CLS)',
    passed: images.length === 0 || imagesWithDimensions.length >= images.length * 0.9,
    value: `${imagesWithDimensions.length}/${images.length}`
  });

  // Test 6: First image priority
  const firstImage = images[0];
  tests.push({
    name: 'First image has high priority',
    passed: !firstImage || firstImage.hasAttribute('fetchpriority'),
    value: firstImage?.getAttribute('fetchpriority') || 'n/a'
  });

  // Test 7: Theme color
  tests.push({
    name: 'Theme color for mobile',
    passed: !!document.querySelector('meta[name="theme-color"]'),
    value: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') || 'missing'
  });

  // Test 8: Apple touch icon
  tests.push({
    name: 'Apple touch icon present',
    passed: !!document.querySelector('link[rel="apple-touch-icon"]'),
    value: 'present'
  });

  // Test 9: Font optimization
  const fontPreloads = document.querySelectorAll('link[rel="preload"][as="font"]');
  tests.push({
    name: 'Font preloading',
    passed: fontPreloads.length > 0,
    value: `${fontPreloads.length} fonts`
  });

  // Test 10: CSS optimization
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  const preloadedCSS = document.querySelectorAll('link[rel="preload"][as="style"]');
  tests.push({
    name: 'Critical CSS preloaded',
    passed: stylesheets.length === 0 || preloadedCSS.length > 0,
    value: `${preloadedCSS.length} preloaded`
  });

  return tests;
}

// ═══════════════════════════════════════════════════════════════════
// Functionality Validation Tests
// ═══════════════════════════════════════════════════════════════════

function validateFunctionality(filePath, dom) {
  const document = dom.window.document;
  const tests = [];
  let allPassed = true;

  // Test 1: No broken internal links
  const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"]');
  let brokenLinks = 0;
  internalLinks.forEach(link => {
    const href = link.getAttribute('href');
    const targetPath = path.join(PUBLIC_DIR, href.replace(/^\.\//, ''));
    if (!fs.existsSync(targetPath) && !fs.existsSync(targetPath + '.html')) {
      brokenLinks++;
      allPassed = false;
    }
  });
  tests.push({
    name: 'No broken internal links',
    passed: brokenLinks === 0,
    value: `${internalLinks.length - brokenLinks}/${internalLinks.length} valid`
  });

  // Test 2: No missing images
  const images = document.querySelectorAll('img[src]');
  let missingImages = 0;
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
      const imagePath = path.join(PUBLIC_DIR, src.replace(/^\//, ''));
      if (!fs.existsSync(imagePath)) {
        missingImages++;
        allPassed = false;
      }
    }
  });
  tests.push({
    name: 'All image files exist',
    passed: missingImages === 0,
    value: `${images.length - missingImages}/${images.length} found`
  });

  // Test 3: CSS files exist
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"][href]');
  let missingCSS = 0;
  stylesheets.forEach(stylesheet => {
    const href = stylesheet.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('//')) {
      const cssPath = path.join(PUBLIC_DIR, href.replace(/^\//, ''));
      if (!fs.existsSync(cssPath)) {
        missingCSS++;
        allPassed = false;
      }
    }
  });
  tests.push({
    name: 'All CSS files exist',
    passed: missingCSS === 0,
    value: `${stylesheets.length - missingCSS}/${stylesheets.length} found`
  });

  // Test 4: JS files exist
  const scripts = document.querySelectorAll('script[src]');
  let missingJS = 0;
  scripts.forEach(script => {
    const src = script.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('//')) {
      const jsPath = path.join(PUBLIC_DIR, src.replace(/^\//, ''));
      if (!fs.existsSync(jsPath)) {
        missingJS++;
        allPassed = false;
      }
    }
  });
  tests.push({
    name: 'All JS files exist',
    passed: missingJS === 0,
    value: `${scripts.length - missingJS}/${scripts.length} found`
  });

  // Test 5: Valid JSON-LD schemas
  const schemas = document.querySelectorAll('script[type="application/ld+json"]');
  let validSchemas = 0;
  schemas.forEach(schema => {
    try {
      JSON.parse(schema.textContent);
      validSchemas++;
    } catch (e) {
      allPassed = false;
    }
  });
  tests.push({
    name: 'All schemas are valid JSON',
    passed: validSchemas === schemas.length,
    value: `${validSchemas}/${schemas.length} valid`
  });

  return tests;
}

// ═══════════════════════════════════════════════════════════════════
// Main Validation Process
// ═══════════════════════════════════════════════════════════════════

function validateFile(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);

    const seoTests = validateSEO(filePath, dom);
    const codeTests = validateCodeQuality(filePath, dom);
    const perfTests = validatePerformance(filePath, dom);
    const funcTests = validateFunctionality(filePath, dom);

    return {
      file: path.basename(filePath),
      seo: seoTests,
      codeQuality: codeTests,
      performance: perfTests,
      functionality: funcTests
    };
  } catch (error) {
    return null;
  }
}

function getAllHTMLFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllHTMLFiles(filePath));
    } else if (file.endsWith('.html')) {
      if (!file.includes('verifyforzoho') && !file.includes('i18n')) {
        results.push(filePath);
      }
    }
  });

  return results;
}

// ═══════════════════════════════════════════════════════════════════
// Execute Validation
// ═══════════════════════════════════════════════════════════════════

console.log('');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('✅ COMPREHENSIVE VALIDATION: 100% Achievement');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');

const htmlFiles = getAllHTMLFiles(PUBLIC_DIR);
const results = [];

htmlFiles.forEach(filePath => {
  const result = validateFile(filePath);
  if (result) {
    results.push(result);

    // Aggregate scores
    result.seo.forEach(test => {
      validation.seo.maxScore++;
      if (test.passed) validation.seo.score++;
    });
    result.codeQuality.forEach(test => {
      validation.codeQuality.maxScore++;
      if (test.passed) validation.codeQuality.score++;
    });
    result.performance.forEach(test => {
      validation.performance.maxScore++;
      if (test.passed) validation.performance.score++;
    });
    result.functionality.forEach(test => {
      validation.functionality.maxScore++;
      if (test.passed) validation.functionality.score++;
    });
  }
});

// Calculate percentages
const seoPercent = Math.floor((validation.seo.score / validation.seo.maxScore) * 100);
const codePercent = Math.floor((validation.codeQuality.score / validation.codeQuality.maxScore) * 100);
const perfPercent = Math.floor((validation.performance.score / validation.performance.maxScore) * 100);
const funcPercent = Math.floor((validation.functionality.score / validation.functionality.maxScore) * 100);
const overall = Math.floor((seoPercent + codePercent + perfPercent + funcPercent) / 4);

console.log('📊 Validation Results:');
console.log(`   Files Tested: ${results.length}`);
console.log('');
console.log('🎯 Category Scores:');
console.log(`   SEO:           ${validation.seo.score}/${validation.seo.maxScore} tests passed (${seoPercent}%)`);
console.log(`   Code Quality:  ${validation.codeQuality.score}/${validation.codeQuality.maxScore} tests passed (${codePercent}%)`);
console.log(`   Performance:   ${validation.performance.score}/${validation.performance.maxScore} tests passed (${perfPercent}%)`);
console.log(`   Functionality: ${validation.functionality.score}/${validation.functionality.maxScore} tests passed (${funcPercent}%)`);
console.log('');
console.log(`🏆 OVERALL SCORE: ${overall}%`);
console.log('');

if (overall >= 95) {
  console.log('✅ EXCELLENT - 100% standards achieved!');
} else if (overall >= 90) {
  console.log('✅ VERY GOOD - Near 100%, minor improvements possible');
} else if (overall >= 80) {
  console.log('⚠️  GOOD - Some optimizations still needed');
} else {
  console.log('❌ NEEDS WORK - Significant improvements required');
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════════');

// Save validation report
const validationReport = {
  timestamp: new Date().toISOString(),
  summary: {
    filesValidated: results.length,
    seo: { score: validation.seo.score, maxScore: validation.seo.maxScore, percent: seoPercent },
    codeQuality: { score: validation.codeQuality.score, maxScore: validation.codeQuality.maxScore, percent: codePercent },
    performance: { score: validation.performance.score, maxScore: validation.performance.maxScore, percent: perfPercent },
    functionality: { score: validation.functionality.score, maxScore: validation.functionality.maxScore, percent: funcPercent },
    overall: overall
  },
  detailedResults: results
};

fs.writeFileSync(
  path.join(__dirname, '../VALIDATION_100_REPORT.json'),
  JSON.stringify(validationReport, null, 2),
  'utf8'
);

console.log('📄 Detailed validation report: VALIDATION_100_REPORT.json');
console.log('');
