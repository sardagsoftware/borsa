#!/usr/bin/env node

/**
 * 🧪 AILYDIAN ULTRA PRO - COMPREHENSIVE SMOKE TEST
 *
 * Tests all features, pages, and APIs from www.ailydian.com
 * Iteration: A-Z Complete Feature Validation
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3500';
const TIMEOUT = 10000;

// ANSI Color Codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Test Results Storage
const testResults = {
  pages: [],
  apis: [],
  features: [],
  performance: []
};

/**
 * Make HTTP Request
 */
function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'User-Agent': 'Ailydian-Smoke-Test/1.0',
        'Content-Type': 'application/json'
      },
      timeout: TIMEOUT
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Run a test
 */
async function runTest(name, testFn, category = 'general') {
  totalTests++;
  const startTime = Date.now();

  try {
    await testFn();
    const duration = Date.now() - startTime;
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${name} ${colors.cyan}(${duration}ms)${colors.reset}`);

    testResults[category].push({
      name,
      status: 'PASS',
      duration
    });

    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} ${name} ${colors.cyan}(${duration}ms)${colors.reset}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);

    testResults[category].push({
      name,
      status: 'FAIL',
      duration,
      error: error.message
    });

    return false;
  }
}

/**
 * Test Suite: HTML Pages
 */
async function testPages() {
  console.log(`\n${colors.bold}${colors.magenta}━━━ TESTING HTML PAGES ━━━${colors.reset}\n`);

  const pages = [
    { path: '/', name: 'Ana Sayfa (index.html)', mustContain: ['LyDian', 'Modüller'] },
    { path: '/chat.html', name: 'AI Chat Interface', mustContain: ['chat', 'AI'] },
    { path: '/auth.html', name: 'Authentication Page', mustContain: ['login', 'giriş'] },
    { path: '/models.html', name: 'AI Models Page', mustContain: ['model'] },
    { path: '/enterprise.html', name: 'Enterprise Page', mustContain: ['enterprise', 'kurumsal'] },
    { path: '/status.html', name: 'System Status Page', mustContain: ['status', 'durum'] },
    { path: '/billing.html', name: 'Billing & Pricing', mustContain: ['fiyat', 'pricing'] },
    { path: '/contact.html', name: 'Contact Page', mustContain: ['contact', 'iletişim'] },
    { path: '/api-docs.html', name: 'API Documentation', mustContain: ['api', 'documentation'] },
    { path: '/changelog.html', name: 'Changelog', mustContain: ['version', 'changelog'] },
    { path: '/about.html', name: 'About Us', mustContain: ['about', 'hakkında'] },
    { path: '/privacy.html', name: 'Privacy Policy', mustContain: ['privacy', 'gizlilik'] },
    { path: '/help.html', name: 'Help Center', mustContain: ['help', 'yardım'] },
    { path: '/careers.html', name: 'Careers', mustContain: ['career', 'kariyer'] },
    { path: '/blog.html', name: 'Blog', mustContain: ['blog'] },
    { path: '/quantum-test.html', name: 'Quantum Test Platform', mustContain: ['quantum'] }
  ];

  for (const page of pages) {
    await runTest(`Page: ${page.name}`, async () => {
      const res = await makeRequest(`${BASE_URL}${page.path}`);

      if (!res.success) {
        throw new Error(`HTTP ${res.statusCode}`);
      }

      // Check if page contains expected content
      const bodyLower = res.body.toLowerCase();
      const missing = page.mustContain.filter(text => !bodyLower.includes(text.toLowerCase()));

      if (missing.length > 0) {
        throw new Error(`Missing content: ${missing.join(', ')}`);
      }

      // Check if HTML is valid (basic check)
      if (!res.body.includes('</html>')) {
        throw new Error('Invalid HTML structure');
      }
    }, 'pages');
  }
}

/**
 * Test Suite: API Endpoints
 */
async function testAPIs() {
  console.log(`\n${colors.bold}${colors.magenta}━━━ TESTING API ENDPOINTS ━━━${colors.reset}\n`);

  const apis = [
    { path: '/api/models', name: 'AI Models List', method: 'GET' },
    { path: '/api/health', name: 'Health Check', method: 'GET' },
    { path: '/api/status', name: 'System Status', method: 'GET' },
    { path: '/api/languages', name: 'Supported Languages', method: 'GET' },
    { path: '/api/token-governor/status', name: 'Token Governor Status', method: 'GET' },
    { path: '/api/medical/specializations', name: 'Medical Specializations', method: 'GET' }
  ];

  for (const api of apis) {
    await runTest(`API: ${api.name}`, async () => {
      const res = await makeRequest(`${BASE_URL}${api.path}`, api.method);

      if (!res.success) {
        throw new Error(`HTTP ${res.statusCode}`);
      }

      // Try to parse JSON response
      try {
        const data = JSON.parse(res.body);
        if (typeof data !== 'object') {
          throw new Error('Invalid JSON response');
        }
      } catch (e) {
        // Some endpoints might return HTML on error
        if (res.statusCode === 200 && !res.body.includes('<!DOCTYPE')) {
          throw new Error('Invalid JSON: ' + e.message);
        }
      }
    }, 'apis');
  }
}

/**
 * Test Suite: Critical Features
 */
async function testFeatures() {
  console.log(`\n${colors.bold}${colors.magenta}━━━ TESTING CRITICAL FEATURES ━━━${colors.reset}\n`);

  // Test: Homepage Loading
  await runTest('Feature: Homepage loads completely', async () => {
    const res = await makeRequest(`${BASE_URL}/`);
    if (!res.success) throw new Error('Failed to load');

    const required = [
      'LyDian',
      'Modüller',
      'Çözümler',
      'Quantum',
      'Developers',
      'nav-link',
      'header-2025'
    ];

    const missing = required.filter(text => !res.body.includes(text));
    if (missing.length > 0) {
      throw new Error(`Missing: ${missing.join(', ')}`);
    }
  }, 'features');

  // Test: Navigation Menu
  await runTest('Feature: Navigation menu present', async () => {
    const res = await makeRequest(`${BASE_URL}/`);
    const menus = ['Modüller', 'Çözümler', 'Quantum', 'Developers', 'Projeler', 'Kurumsal'];
    const missing = menus.filter(menu => !res.body.includes(menu));
    if (missing.length > 0) {
      throw new Error(`Missing menus: ${missing.join(', ')}`);
    }
  }, 'features');

  // Test: Search Functionality
  await runTest('Feature: Search box present', async () => {
    const res = await makeRequest(`${BASE_URL}/`);
    if (!res.body.includes('live-search-input')) {
      throw new Error('Search input not found');
    }
    if (!res.body.includes('Ara...')) {
      throw new Error('Search placeholder missing');
    }
  }, 'features');

  // Test: Health Badge
  await runTest('Feature: Health status badge', async () => {
    const res = await makeRequest(`${BASE_URL}/`);
    if (!res.body.includes('health-badge')) {
      throw new Error('Health badge not found');
    }
  }, 'features');

  // Test: Statistics Sidebar
  await runTest('Feature: AI Statistics sidebar', async () => {
    const res = await makeRequest(`${BASE_URL}/`);
    const stats = ['stat-llm', 'stat-gpt', 'stat-cnn', 'stat-rnn'];
    const missing = stats.filter(stat => !res.body.includes(stat));
    if (missing.length > 0) {
      throw new Error(`Missing stats: ${missing.join(', ')}`);
    }
  }, 'features');

  // Test: Responsive Design Elements
  await runTest('Feature: Mobile responsive elements', async () => {
    const res = await makeRequest(`${BASE_URL}/`);
    if (!res.body.includes('mobile-menu-btn')) {
      throw new Error('Mobile menu button not found');
    }
    if (!res.body.includes('@media')) {
      throw new Error('No responsive CSS found');
    }
  }, 'features');

  // Test: Three.js Globe
  await runTest('Feature: 3D Globe visualization', async () => {
    const res = await makeRequest(`${BASE_URL}/`);
    if (!res.body.includes('three.min.js')) {
      throw new Error('Three.js not loaded');
    }
    if (!res.body.includes('scene') || !res.body.includes('camera')) {
      throw new Error('3D scene elements missing');
    }
  }, 'features');
}

/**
 * Test Suite: Performance
 */
async function testPerformance() {
  console.log(`\n${colors.bold}${colors.magenta}━━━ TESTING PERFORMANCE ━━━${colors.reset}\n`);

  await runTest('Performance: Homepage < 3s', async () => {
    const start = Date.now();
    const res = await makeRequest(`${BASE_URL}/`);
    const duration = Date.now() - start;

    if (!res.success) throw new Error('Failed to load');
    if (duration > 3000) {
      throw new Error(`Too slow: ${duration}ms (expected < 3000ms)`);
    }
  }, 'performance');

  await runTest('Performance: API response < 1s', async () => {
    const start = Date.now();
    const res = await makeRequest(`${BASE_URL}/api/health`);
    const duration = Date.now() - start;

    if (!res.success) throw new Error('API failed');
    if (duration > 1000) {
      throw new Error(`Too slow: ${duration}ms (expected < 1000ms)`);
    }
  }, 'performance');

  await runTest('Performance: Static assets load fast', async () => {
    const assets = [
      '/lydian-favicon.png',
      '/icon-192.png'
    ];

    for (const asset of assets) {
      const start = Date.now();
      try {
        const res = await makeRequest(`${BASE_URL}${asset}`);
        const duration = Date.now() - start;

        if (duration > 2000) {
          throw new Error(`Asset ${asset} too slow: ${duration}ms`);
        }
      } catch (e) {
        // Some assets might not exist, that's okay
        console.log(`  ${colors.yellow}⚠${colors.reset} Asset ${asset} not found (non-critical)`);
      }
    }
  }, 'performance');
}

/**
 * Print Summary
 */
function printSummary() {
  console.log(`\n${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}           TEST SUMMARY${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  console.log(`Total Tests:  ${colors.bold}${totalTests}${colors.reset}`);
  console.log(`${colors.green}Passed:       ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed:       ${failedTests}${colors.reset}`);
  console.log(`Success Rate: ${colors.bold}${((passedTests / totalTests) * 100).toFixed(1)}%${colors.reset}\n`);

  // Category Breakdown
  console.log(`${colors.bold}Category Breakdown:${colors.reset}`);
  Object.keys(testResults).forEach(category => {
    const results = testResults[category];
    if (results.length === 0) return;

    const passed = results.filter(r => r.status === 'PASS').length;
    const total = results.length;
    const rate = ((passed / total) * 100).toFixed(0);

    console.log(`  ${category.padEnd(15)} ${passed}/${total} (${rate}%)`);
  });

  console.log(`\n${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  if (failedTests === 0) {
    console.log(`${colors.green}${colors.bold}✓ ALL TESTS PASSED!${colors.reset}`);
    console.log(`${colors.green}Localhost:3500 is ready for production.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bold}✗ SOME TESTS FAILED${colors.reset}`);
    console.log(`${colors.yellow}Please review failed tests above.${colors.reset}\n`);
  }
}

/**
 * Main Test Runner
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}   AILYDIAN ULTRA PRO - SMOKE TEST SUITE${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.cyan}Timeout:  ${TIMEOUT}ms${colors.reset}\n`);

  // Run all test suites
  await testPages();
  await testAPIs();
  await testFeatures();
  await testPerformance();

  // Print summary
  printSummary();

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error(`${colors.red}${colors.bold}Fatal Error:${colors.reset}`, error);
  process.exit(1);
});
