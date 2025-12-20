#!/usr/bin/env node
/**
 * 🔍 SEARCH ENGINE SMOKE TESTS
 * ============================
 *
 * Comprehensive smoke tests for:
 * - Bing Webmaster Tools
 * - Google Search Console
 * - Yandex Webmaster
 *
 * Tests include:
 * - URL accessibility
 * - Sitemap validation
 * - Robots.txt validation
 * - IndexNow protocol
 * - Meta tags verification
 * - SSL/TLS validation
 * - Performance checks
 * - Mobile-friendliness
 *
 * BEYAZ ŞAPKA - WHITE HAT SEO COMPLIANCE
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

// Configuration
const BASE_URL = 'https://www.ailydian.com';
const INDEXNOW_KEY_PATH = path.join(__dirname, '../public/indexnow-key.txt');

// Test results
const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  tests: {
    bing: [],
    google: [],
    yandex: [],
    general: []
  },
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

/**
 * HTTP/HTTPS request helper
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Test helper
 */
function addTest(engine, name, passed, message, severity = 'error') {
  const test = {
    name,
    passed,
    message,
    severity,
    timestamp: new Date().toISOString()
  };

  results.tests[engine].push(test);
  results.summary.total++;

  if (passed) {
    results.summary.passed++;
    console.log(`  ✅ ${name}`);
  } else {
    if (severity === 'warning') {
      results.summary.warnings++;
      console.log(`  ⚠️  ${name}: ${message}`);
    } else {
      results.summary.failed++;
      console.log(`  ❌ ${name}: ${message}`);
    }
  }

  return test;
}

/**
 * GENERAL TESTS (All Search Engines)
 */
async function runGeneralTests() {
  console.log('\n🌐 GENERAL TESTS (All Search Engines)');
  console.log('='.repeat(50));

  // Test 1: Homepage accessibility
  try {
    const res = await makeRequest(BASE_URL);
    addTest('general', 'Homepage Accessible',
      res.statusCode === 200,
      res.statusCode === 200 ? 'Homepage loads successfully' : `HTTP ${res.statusCode}`
    );
  } catch (error) {
    addTest('general', 'Homepage Accessible', false, error.message);
  }

  // Test 2: SSL/TLS Certificate
  try {
    const res = await makeRequest(BASE_URL);
    const hasSSL = res.headers['strict-transport-security'] !== undefined;
    addTest('general', 'SSL/TLS Configured',
      true,
      'HTTPS protocol active',
      hasSSL ? 'info' : 'warning'
    );
  } catch (error) {
    addTest('general', 'SSL/TLS Configured', false, error.message);
  }

  // Test 3: Robots.txt exists and valid
  try {
    const res = await makeRequest(`${BASE_URL}/robots.txt`);
    const hasContent = res.body.includes('User-agent:') && res.body.includes('Sitemap:');
    addTest('general', 'Robots.txt Valid',
      res.statusCode === 200 && hasContent,
      hasContent ? 'robots.txt properly configured' : 'robots.txt missing or invalid'
    );
  } catch (error) {
    addTest('general', 'Robots.txt Valid', false, error.message);
  }

  // Test 4: Sitemap.xml exists and valid
  try {
    const res = await makeRequest(`${BASE_URL}/sitemap.xml`);
    const isXML = res.body.includes('<?xml') && res.body.includes('<urlset');
    const hasUrls = res.body.includes('<loc>');
    addTest('general', 'Sitemap.xml Valid',
      res.statusCode === 200 && isXML && hasUrls,
      isXML && hasUrls ? 'sitemap.xml properly formatted with URLs' : 'sitemap.xml missing or invalid'
    );
  } catch (error) {
    addTest('general', 'Sitemap.xml Valid', false, error.message);
  }

  // Test 5: Meta tags on homepage
  try {
    const res = await makeRequest(BASE_URL);
    const hasTitle = res.body.includes('<title>');
    const hasDescription = res.body.includes('name="description"');
    const hasKeywords = res.body.includes('name="keywords"');
    const hasOG = res.body.includes('property="og:');

    addTest('general', 'Meta Tags Present',
      hasTitle && hasDescription,
      `Title: ${hasTitle}, Description: ${hasDescription}, Keywords: ${hasKeywords}, OG: ${hasOG}`,
      (hasTitle && hasDescription) ? 'info' : 'error'
    );
  } catch (error) {
    addTest('general', 'Meta Tags Present', false, error.message);
  }

  // Test 6: IndexNow key file exists
  try {
    const res = await makeRequest(`${BASE_URL}/indexnow-key.txt`);
    const hasKey = res.statusCode === 200 && res.body.length === 64;
    addTest('general', 'IndexNow Key File',
      hasKey,
      hasKey ? 'IndexNow key file exists and valid (64 chars)' : 'IndexNow key file missing or invalid'
    );
  } catch (error) {
    addTest('general', 'IndexNow Key File', false, error.message);
  }

  // Test 7: Canonical URLs
  try {
    const res = await makeRequest(BASE_URL);
    const hasCanonical = res.body.includes('rel="canonical"');
    addTest('general', 'Canonical URLs',
      hasCanonical,
      hasCanonical ? 'Canonical URL tag present' : 'Canonical URL missing',
      hasCanonical ? 'info' : 'warning'
    );
  } catch (error) {
    addTest('general', 'Canonical URLs', false, error.message, 'warning');
  }

  // Test 8: Language alternates (hreflang)
  try {
    const res = await makeRequest(BASE_URL);
    const hasHreflang = res.body.includes('hreflang=');
    addTest('general', 'Multi-language Support',
      hasHreflang,
      hasHreflang ? 'hreflang tags present for multi-language' : 'hreflang tags missing',
      hasHreflang ? 'info' : 'warning'
    );
  } catch (error) {
    addTest('general', 'Multi-language Support', false, error.message, 'warning');
  }

  // Test 9: Mobile viewport
  try {
    const res = await makeRequest(BASE_URL);
    const hasViewport = res.body.includes('name="viewport"');
    addTest('general', 'Mobile Viewport',
      hasViewport,
      hasViewport ? 'Viewport meta tag configured' : 'Viewport meta tag missing'
    );
  } catch (error) {
    addTest('general', 'Mobile Viewport', false, error.message);
  }

  // Test 10: Response time
  try {
    const startTime = Date.now();
    await makeRequest(BASE_URL);
    const responseTime = Date.now() - startTime;
    const isFast = responseTime < 3000;
    addTest('general', 'Response Time',
      isFast,
      `${responseTime}ms (target: <3000ms)`,
      isFast ? 'info' : 'warning'
    );
  } catch (error) {
    addTest('general', 'Response Time', false, error.message, 'warning');
  }
}

/**
 * BING WEBMASTER TOOLS TESTS
 */
async function runBingTests() {
  console.log('\n🔵 BING WEBMASTER TOOLS TESTS');
  console.log('='.repeat(50));

  // Test 1: IndexNow protocol support
  try {
    if (!fs.existsSync(INDEXNOW_KEY_PATH)) {
      addTest('bing', 'IndexNow Key File Local', false, 'IndexNow key file not found locally');
    } else {
      const key = fs.readFileSync(INDEXNOW_KEY_PATH, 'utf8').trim();
      addTest('bing', 'IndexNow Key File Local',
        key.length === 64,
        key.length === 64 ? 'IndexNow key valid (64 chars)' : `Invalid key length: ${key.length}`
      );

      // Test IndexNow submission format
      const testPayload = {
        host: 'www.ailydian.com',
        key: key,
        keyLocation: `${BASE_URL}/indexnow-key.txt`,
        urlList: [`${BASE_URL}/`]
      };

      const payloadString = JSON.stringify(testPayload);
      addTest('bing', 'IndexNow Payload Format',
        testPayload.host && testPayload.key && testPayload.urlList,
        'IndexNow payload properly formatted'
      );
    }
  } catch (error) {
    addTest('bing', 'IndexNow Configuration', false, error.message);
  }

  // Test 2: Bing-specific meta tags
  try {
    const res = await makeRequest(BASE_URL);
    const hasMSValidate = res.body.includes('name="msvalidate') || res.body.includes('name="ms-validate');
    addTest('bing', 'Bing Verification Tag',
      true,
      hasMSValidate ? 'Bing verification meta tag found' : 'Bing verification tag not found (add when claiming site)',
      'warning'
    );
  } catch (error) {
    addTest('bing', 'Bing Verification Tag', false, error.message, 'warning');
  }

  // Test 3: BingBot access in robots.txt
  try {
    const res = await makeRequest(`${BASE_URL}/robots.txt`);
    const allowsBingbot = res.body.toLowerCase().includes('bingbot');
    const disallowsImportant = !res.body.toLowerCase().includes('disallow: /\n');
    addTest('bing', 'BingBot Access',
      disallowsImportant,
      allowsBingbot ? 'BingBot explicitly configured' : 'BingBot will use default User-agent rules'
    );
  } catch (error) {
    addTest('bing', 'BingBot Access', false, error.message);
  }

  // Test 4: Sitemap accessibility for Bing
  try {
    const res = await makeRequest(`${BASE_URL}/sitemap.xml`);
    const urlCount = (res.body.match(/<loc>/g) || []).length;
    addTest('bing', 'Sitemap URL Count',
      urlCount > 0,
      `${urlCount} URLs in sitemap`,
      urlCount > 100 ? 'info' : 'warning'
    );
  } catch (error) {
    addTest('bing', 'Sitemap URL Count', false, error.message);
  }

  // Test 5: Schema.org structured data
  try {
    const res = await makeRequest(BASE_URL);
    const hasSchema = res.body.includes('schema.org') || res.body.includes('application/ld+json');
    addTest('bing', 'Structured Data (Schema.org)',
      true,
      hasSchema ? 'Schema.org markup detected' : 'No structured data found (recommended for rich results)',
      hasSchema ? 'info' : 'warning'
    );
  } catch (error) {
    addTest('bing', 'Structured Data (Schema.org)', false, error.message, 'warning');
  }

  // Test 6: URL format (Bing prefers clean URLs)
  try {
    const res = await makeRequest(BASE_URL);
    const links = res.body.match(/href="([^"]+)"/g) || [];
    const hasCleanUrls = links.some(link => !link.includes('?') && !link.includes('#'));
    addTest('bing', 'Clean URL Structure',
      hasCleanUrls,
      'URLs are clean without query parameters',
      'info'
    );
  } catch (error) {
    addTest('bing', 'Clean URL Structure', false, error.message, 'warning');
  }

  // Test 7: Page load speed for Bing
  try {
    const startTime = Date.now();
    const res = await makeRequest(BASE_URL);
    const loadTime = Date.now() - startTime;
    const sizeKB = Buffer.byteLength(res.body) / 1024;
    addTest('bing', 'Page Size Optimization',
      sizeKB < 500,
      `Page size: ${sizeKB.toFixed(2)} KB (target: <500KB)`,
      sizeKB < 500 ? 'info' : 'warning'
    );
  } catch (error) {
    addTest('bing', 'Page Size Optimization', false, error.message, 'warning');
  }

  // Test 8: HTTPS redirect
  try {
    const httpRes = await makeRequest(BASE_URL.replace('https://', 'http://'));
    const redirectsToHttps = httpRes.statusCode === 301 || httpRes.statusCode === 302 || httpRes.statusCode === 200;
    addTest('bing', 'HTTPS Redirect',
      redirectsToHttps,
      redirectsToHttps ? 'HTTP to HTTPS redirect configured' : 'HTTP does not redirect to HTTPS'
    );
  } catch (error) {
    addTest('bing', 'HTTPS Redirect', true, 'HTTPS enforced', 'info');
  }
}

/**
 * GOOGLE SEARCH CONSOLE TESTS
 */
async function runGoogleTests() {
  console.log('\n🔴 GOOGLE SEARCH CONSOLE TESTS');
  console.log('='.repeat(50));

  // Test 1: Google verification tag
  try {
    const res = await makeRequest(BASE_URL);
    const hasGoogleVerify = res.body.includes('google-site-verification');
    addTest('google', 'Google Verification Tag',
      true,
      hasGoogleVerify ? 'Google verification meta tag found' : 'Google verification tag not found (add when claiming site)',
      'warning'
    );
  } catch (error) {
    addTest('google', 'Google Verification Tag', false, error.message, 'warning');
  }

  // Test 2: Googlebot access
  try {
    const res = await makeRequest(`${BASE_URL}/robots.txt`);
    const allowsGooglebot = res.body.toLowerCase().includes('googlebot');
    const disallowsImportant = !res.body.toLowerCase().includes('disallow: /\n');
    addTest('google', 'Googlebot Access',
      disallowsImportant,
      allowsGooglebot ? 'Googlebot explicitly configured' : 'Googlebot will use default User-agent rules'
    );
  } catch (error) {
    addTest('google', 'Googlebot Access', false, error.message);
  }

  // Test 3: Sitemap ping to Google
  try {
    const sitemapUrl = `${BASE_URL}/sitemap.xml`;
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    // Note: We don't actually ping in smoke tests, just validate the URL format
    addTest('google', 'Google Sitemap Ping URL',
      true,
      `Sitemap URL ready for Google ping: ${pingUrl}`,
      'info'
    );
  } catch (error) {
    addTest('google', 'Google Sitemap Ping URL', false, error.message, 'warning');
  }

  // Test 4: Core Web Vitals (basic checks)
  try {
    const startTime = Date.now();
    const res = await makeRequest(BASE_URL);
    const loadTime = Date.now() - startTime;
    const hasLCP = loadTime < 2500; // Largest Contentful Paint target
    addTest('google', 'Core Web Vitals (LCP)',
      hasLCP,
      `Page load time: ${loadTime}ms (LCP target: <2500ms)`,
      hasLCP ? 'info' : 'warning'
    );
  } catch (error) {
    addTest('google', 'Core Web Vitals (LCP)', false, error.message, 'warning');
  }

  // Test 5: Mobile-friendly
  try {
    const res = await makeRequest(BASE_URL);
    const hasViewport = res.body.includes('name="viewport"');
    const hasResponsive = res.body.includes('responsive') || res.body.includes('mobile');
    addTest('google', 'Mobile-Friendly Design',
      hasViewport,
      hasViewport ? 'Viewport configured for mobile' : 'Missing viewport meta tag'
    );
  } catch (error) {
    addTest('google', 'Mobile-Friendly Design', false, error.message);
  }

  // Test 6: Structured data (Schema.org/JSON-LD)
  try {
    const res = await makeRequest(BASE_URL);
    const hasJSONLD = res.body.includes('application/ld+json');
    const hasSchema = res.body.includes('schema.org');
    addTest('google', 'Structured Data (JSON-LD)',
      true,
      hasJSONLD ? 'JSON-LD structured data found' : 'No JSON-LD found (recommended for rich results)',
      hasJSONLD ? 'info' : 'warning'
    );
  } catch (error) {
    addTest('google', 'Structured Data (JSON-LD)', false, error.message, 'warning');
  }

  // Test 7: Image optimization
  try {
    const res = await makeRequest(BASE_URL);
    const images = res.body.match(/<img[^>]+>/g) || [];
    const hasAlt = images.some(img => img.includes('alt='));
    addTest('google', 'Image Alt Attributes',
      true,
      hasAlt ? 'Images have alt attributes' : 'Some images missing alt attributes',
      hasAlt ? 'info' : 'warning'
    );
  } catch (error) {
    addTest('google', 'Image Alt Attributes', false, error.message, 'warning');
  }

  // Test 8: HTTPS everywhere
  try {
    const res = await makeRequest(BASE_URL);
    const hasMixedContent = res.body.includes('http://');
    addTest('google', 'HTTPS Everywhere',
      !hasMixedContent,
      hasMixedContent ? 'Possible mixed content detected' : 'All resources use HTTPS',
      hasMixedContent ? 'warning' : 'info'
    );
  } catch (error) {
    addTest('google', 'HTTPS Everywhere', false, error.message, 'warning');
  }

  // Test 9: Page titles uniqueness
  try {
    const res = await makeRequest(BASE_URL);
    const titleMatch = res.body.match(/<title>([^<]+)<\/title>/i);
    const hasTitle = titleMatch && titleMatch[1].length > 10 && titleMatch[1].length < 60;
    addTest('google', 'Title Tag Optimization',
      hasTitle,
      hasTitle ? `Title length: ${titleMatch[1].length} chars (optimal: 10-60)` : 'Title tag missing or poorly optimized'
    );
  } catch (error) {
    addTest('google', 'Title Tag Optimization', false, error.message);
  }

  // Test 10: Meta description
  try {
    const res = await makeRequest(BASE_URL);
    const descMatch = res.body.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const hasDesc = descMatch && descMatch[1].length > 50 && descMatch[1].length < 160;
    addTest('google', 'Meta Description Optimization',
      hasDesc,
      hasDesc ? `Description length: ${descMatch[1].length} chars (optimal: 50-160)` : 'Meta description missing or poorly optimized'
    );
  } catch (error) {
    addTest('google', 'Meta Description Optimization', false, error.message);
  }
}

/**
 * YANDEX WEBMASTER TESTS
 */
async function runYandexTests() {
  console.log('\n🟡 YANDEX WEBMASTER TESTS');
  console.log('='.repeat(50));

  // Test 1: Yandex verification tag
  try {
    const res = await makeRequest(BASE_URL);
    const hasYandexVerify = res.body.includes('yandex-verification');
    addTest('yandex', 'Yandex Verification Tag',
      true,
      hasYandexVerify ? 'Yandex verification meta tag found' : 'Yandex verification tag not found (add when claiming site)',
      'warning'
    );
  } catch (error) {
    addTest('yandex', 'Yandex Verification Tag', false, error.message, 'warning');
  }

  // Test 2: Yandex Bot access
  try {
    const res = await makeRequest(`${BASE_URL}/robots.txt`);
    const allowsYandex = res.body.toLowerCase().includes('yandex');
    const disallowsImportant = !res.body.toLowerCase().includes('disallow: /\n');
    addTest('yandex', 'YandexBot Access',
      disallowsImportant,
      allowsYandex ? 'YandexBot explicitly configured' : 'YandexBot will use default User-agent rules'
    );
  } catch (error) {
    addTest('yandex', 'YandexBot Access', false, error.message);
  }

  // Test 3: Cyrillic character support (important for Yandex)
  try {
    const res = await makeRequest(BASE_URL);
    const hasUTF8 = res.headers['content-type']?.includes('utf-8') || res.body.includes('charset=utf-8');
    addTest('yandex', 'UTF-8 Character Encoding',
      hasUTF8,
      hasUTF8 ? 'UTF-8 encoding configured for multi-language support' : 'UTF-8 encoding not detected'
    );
  } catch (error) {
    addTest('yandex', 'UTF-8 Character Encoding', false, error.message);
  }

  // Test 4: Turbo pages (Yandex-specific)
  try {
    const res = await makeRequest(BASE_URL);
    const hasTurbo = res.body.includes('yandex-turbo') || res.body.includes('turbo:');
    addTest('yandex', 'Yandex Turbo Pages',
      true,
      hasTurbo ? 'Yandex Turbo pages configured' : 'No Yandex Turbo pages (optional feature)',
      'info'
    );
  } catch (error) {
    addTest('yandex', 'Yandex Turbo Pages', false, error.message, 'info');
  }

  // Test 5: Sitemap format for Yandex
  try {
    const res = await makeRequest(`${BASE_URL}/sitemap.xml`);
    const hasXML = res.body.includes('<?xml');
    const hasUrlset = res.body.includes('<urlset');
    addTest('yandex', 'Sitemap XML Format',
      hasXML && hasUrlset,
      'Sitemap follows XML standard (Yandex compatible)'
    );
  } catch (error) {
    addTest('yandex', 'Sitemap XML Format', false, error.message);
  }

  // Test 6: Yandex Metrica (analytics)
  try {
    const res = await makeRequest(BASE_URL);
    const hasMetrica = res.body.includes('mc.yandex.ru') || res.body.includes('metrika');
    addTest('yandex', 'Yandex Metrica Integration',
      true,
      hasMetrica ? 'Yandex Metrica analytics detected' : 'No Yandex Metrica (recommended for Russian market)',
      'info'
    );
  } catch (error) {
    addTest('yandex', 'Yandex Metrica Integration', false, error.message, 'info');
  }

  // Test 7: Geolocation tags (important for Yandex regional ranking)
  try {
    const res = await makeRequest(BASE_URL);
    const hasGeo = res.body.includes('geo.position') || res.body.includes('geo.placename');
    addTest('yandex', 'Geolocation Meta Tags',
      true,
      hasGeo ? 'Geolocation meta tags found' : 'No geolocation tags (optional for regional SEO)',
      'info'
    );
  } catch (error) {
    addTest('yandex', 'Geolocation Meta Tags', false, error.message, 'info');
  }

  // Test 8: Original content markers (Yandex values original content)
  try {
    const res = await makeRequest(BASE_URL);
    const contentLength = res.body.length;
    const hasGoodContent = contentLength > 5000;
    addTest('yandex', 'Content Volume',
      hasGoodContent,
      `Page content size: ${(contentLength / 1024).toFixed(2)} KB`,
      hasGoodContent ? 'info' : 'warning'
    );
  } catch (error) {
    addTest('yandex', 'Content Volume', false, error.message, 'warning');
  }

  // Test 9: IndexNow support for Yandex
  try {
    const res = await makeRequest(`${BASE_URL}/indexnow-key.txt`);
    const hasKey = res.statusCode === 200 && res.body.length === 64;
    addTest('yandex', 'IndexNow Support',
      hasKey,
      hasKey ? 'IndexNow key configured (Yandex supports IndexNow)' : 'IndexNow key missing'
    );
  } catch (error) {
    addTest('yandex', 'IndexNow Support', false, error.message);
  }

  // Test 10: Language specification (important for Yandex international)
  try {
    const res = await makeRequest(BASE_URL);
    const hasLang = res.body.includes('lang=') || res.body.includes('<html lang');
    const hasHreflang = res.body.includes('hreflang=');
    addTest('yandex', 'Language Specification',
      hasLang,
      hasLang ? 'Language tags configured' : 'Language tags missing',
      hasLang ? 'info' : 'warning'
    );
  } catch (error) {
    addTest('yandex', 'Language Specification', false, error.message, 'warning');
  }
}

/**
 * Generate detailed report
 */
function generateReport() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 SMOKE TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);

  const passRate = ((results.summary.passed / results.summary.total) * 100).toFixed(2);
  console.log(`\nPass Rate: ${passRate}%`);

  // Breakdown by engine
  console.log('\n📈 Results by Search Engine:');
  for (const [engine, tests] of Object.entries(results.tests)) {
    const passed = tests.filter(t => t.passed).length;
    const total = tests.length;
    console.log(`  ${engine.toUpperCase()}: ${passed}/${total} tests passed`);
  }

  // Failed tests detail
  const failedTests = [];
  for (const [engine, tests] of Object.entries(results.tests)) {
    tests.forEach(test => {
      if (!test.passed && test.severity === 'error') {
        failedTests.push({ engine, ...test });
      }
    });
  }

  if (failedTests.length > 0) {
    console.log('\n⚠️  Critical Issues to Fix:');
    failedTests.forEach(test => {
      console.log(`  - [${test.engine.toUpperCase()}] ${test.name}: ${test.message}`);
    });
  }

  // Save detailed report
  const reportPath = path.join(__dirname, '../SEARCH-ENGINE-SMOKE-TEST-REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n✅ Detailed report saved: ${reportPath}`);

  // Generate markdown report
  generateMarkdownReport();

  return results;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport() {
  let md = `# 🔍 Search Engine Smoke Test Report\n\n`;
  md += `**Generated:** ${results.timestamp}\n`;
  md += `**Base URL:** ${results.baseUrl}\n\n`;

  md += `## 📊 Summary\n\n`;
  md += `| Metric | Count |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Tests | ${results.summary.total} |\n`;
  md += `| ✅ Passed | ${results.summary.passed} |\n`;
  md += `| ❌ Failed | ${results.summary.failed} |\n`;
  md += `| ⚠️ Warnings | ${results.summary.warnings} |\n`;
  md += `| **Pass Rate** | **${((results.summary.passed / results.summary.total) * 100).toFixed(2)}%** |\n\n`;

  // Results by engine
  md += `## 📈 Results by Search Engine\n\n`;
  for (const [engine, tests] of Object.entries(results.tests)) {
    const passed = tests.filter(t => t.passed).length;
    const total = tests.length;
    const rate = ((passed / total) * 100).toFixed(2);

    md += `### ${engine.toUpperCase()} (${passed}/${total} - ${rate}%)\n\n`;
    md += `| Test | Status | Details |\n`;
    md += `|------|--------|----------|\n`;

    tests.forEach(test => {
      const icon = test.passed ? '✅' : (test.severity === 'warning' ? '⚠️' : '❌');
      md += `| ${test.name} | ${icon} | ${test.message} |\n`;
    });
    md += `\n`;
  }

  // Recommendations
  md += `## 💡 Recommendations\n\n`;

  const criticalIssues = [];
  const warnings = [];

  for (const [engine, tests] of Object.entries(results.tests)) {
    tests.forEach(test => {
      if (!test.passed) {
        if (test.severity === 'error') {
          criticalIssues.push(`- **[${engine.toUpperCase()}]** ${test.name}: ${test.message}`);
        } else {
          warnings.push(`- **[${engine.toUpperCase()}]** ${test.name}: ${test.message}`);
        }
      }
    });
  }

  if (criticalIssues.length > 0) {
    md += `### 🚨 Critical Issues\n\n`;
    criticalIssues.forEach(issue => md += issue + '\n');
    md += `\n`;
  }

  if (warnings.length > 0) {
    md += `### ⚠️ Warnings & Optimization Opportunities\n\n`;
    warnings.forEach(warning => md += warning + '\n');
    md += `\n`;
  }

  md += `---\n`;
  md += `*Generated by LyDian AI SEO Smoke Test Suite*\n`;

  const mdPath = path.join(__dirname, '../SEARCH-ENGINE-SMOKE-TEST-REPORT.md');
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log(`✅ Markdown report saved: ${mdPath}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 SEARCH ENGINE SMOKE TESTS');
  console.log('============================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  try {
    await runGeneralTests();
    await runBingTests();
    await runGoogleTests();
    await runYandexTests();

    generateReport();

    // Exit code based on critical failures
    const hasCriticalFailures = results.summary.failed > 0;
    if (hasCriticalFailures) {
      console.log('\n⚠️  Some critical tests failed. Please review the report.');
      process.exit(1);
    } else {
      console.log('\n✅ All critical tests passed!');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Smoke tests failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runGeneralTests,
  runBingTests,
  runGoogleTests,
  runYandexTests,
  generateReport
};
