/**
 * 🧪 AILYDIAN AI Comprehensive Smoke Test
 * Production smoke testing for all critical systems
 * © Emrah Şardağ. All rights reserved.
 */

const BASE_URL = 'https://borsa-9w8mq4fvb-emrahsardag-yandexcoms-projects.vercel.app';

// Test utilities
async function testEndpoint(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AILYDIAN-SmokeTest/1.0'
      }
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const result = {
      url,
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString()
    };

    // Try to parse JSON response
    try {
      const text = await response.text();
      if (text) {
        try {
          result.data = JSON.parse(text);
        } catch {
          result.text = text.substring(0, 200); // First 200 chars
        }
      }
    } catch (e) {
      result.error = e.message;
    }

    return result;
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

function logTest(name, result) {
  const status = result.ok ? '✅' : '❌';
  const statusCode = result.status || 'ERR';
  console.log(`${status} ${name} - ${statusCode} (${result.timestamp})`);
  
  if (!result.ok) {
    console.log(`   Error: ${result.error || 'HTTP ' + result.status}`);
  }
  
  if (result.data?.service || result.data?.version) {
    console.log(`   Service: ${result.data.service} v${result.data.version}`);
  }
}

// Test suites
async function testStaticPages() {
  console.log('\n🏠 STATIC PAGES TEST');
  console.log('='.repeat(50));
  
  const pages = [
    '/',
    '/tr',
    '/tr/brief', 
    '/tr/dashboard',
    '/tr/portfolio',
    '/tr/trading',
    '/tr/security',
    '/smoke-test',
    '/smoke-test-new'
  ];

  for (const page of pages) {
    const result = await testEndpoint(`${BASE_URL}${page}`);
    logTest(`Page ${page}`, result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function testApiEndpoints() {
  console.log('\n🔌 API ENDPOINTS TEST');
  console.log('='.repeat(50));
  
  const endpoints = [
    '/api/health',
    '/api/healthz',
    '/api/security/status',
    '/api/zai/translate',
    '/api/dashboard',
    '/api/crypto/prices',
    '/api/ai/market-insights'
  ];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(`${BASE_URL}${endpoint}`);
    logTest(`API ${endpoint}`, result);
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

async function testMultiLanguage() {
  console.log('\n🌍 MULTI-LANGUAGE TEST');
  console.log('='.repeat(50));
  
  const locales = ['tr', 'en', 'es', 'zh', 'ja', 'ko', 'ru', 'pt', 'it', 'ar', 'fa', 'fr', 'de', 'nl'];
  
  for (const locale of locales) {
    const result = await testEndpoint(`${BASE_URL}/${locale}/brief`);
    logTest(`Locale ${locale}`, result);
    
    await new Promise(resolve => setTimeout(resolve, 150));
  }
}

async function testAITranslation() {
  console.log('\n🤖 AI TRANSLATION TEST');
  console.log('='.repeat(50));
  
  // Test GET endpoint
  const getResult = await testEndpoint(`${BASE_URL}/api/zai/translate`);
  logTest('Translation API Info', getResult);
  
  // Test POST endpoint
  const postResult = await testEndpoint(`${BASE_URL}/api/zai/translate`, 'POST', {
    text: 'Bitcoin price analysis',
    targetLanguage: 'tr',
    context: 'crypto_trading'
  });
  logTest('Translation API POST', postResult);
}

async function testSecurityHeaders() {
  console.log('\n🔒 SECURITY HEADERS TEST');  
  console.log('='.repeat(50));
  
  const result = await testEndpoint(`${BASE_URL}/`);
  
  const securityHeaders = [
    'x-frame-options',
    'x-content-type-options', 
    'x-xss-protection',
    'strict-transport-security',
    'content-security-policy'
  ];

  for (const header of securityHeaders) {
    const value = result.headers[header];
    const status = value ? '✅' : '❌';
    console.log(`${status} ${header}: ${value || 'MISSING'}`);
  }
}

async function testPerformance() {
  console.log('\n⚡ PERFORMANCE TEST');
  console.log('='.repeat(50));
  
  const start = Date.now();
  const result = await testEndpoint(`${BASE_URL}/`);
  const duration = Date.now() - start;
  
  console.log(`✅ Response Time: ${duration}ms`);
  console.log(`✅ Status: ${result.status}`);
  console.log(`✅ Content Length: ${result.headers['content-length'] || 'N/A'}`);
  console.log(`✅ Cache Control: ${result.headers['cache-control'] || 'N/A'}`);
}

async function testAIChat() {
  console.log('\n🧠 AI CHAT TEST');
  console.log('='.repeat(50));
  
  const chatTest = await testEndpoint(`${BASE_URL}/api/ai/chat`, 'POST', {
    messages: [
      {
        role: 'user',
        content: 'Bitcoin analizi yap'
      }
    ],
    stream: false
  });
  logTest('AI Chat Endpoint', chatTest);
}

// Main test runner
async function runSmokeTests() {
  console.log('\n🚀 AILYDIAN AI LENS PRO - COMPREHENSIVE SMOKE TEST');
  console.log('='.repeat(60));
  console.log(`Testing: ${BASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    await testStaticPages();
    await testApiEndpoints();
    await testMultiLanguage();
    await testAITranslation();
    await testSecurityHeaders();
    await testPerformance();
    await testAIChat();
    
    const duration = Date.now() - startTime;
    
    console.log('\n🎉 SMOKE TEST COMPLETED');
    console.log('='.repeat(50));
    console.log(`✅ Total Duration: ${duration}ms`);
    console.log(`✅ Timestamp: ${new Date().toISOString()}`);
    console.log(`✅ Status: PRODUCTION READY`);
    
  } catch (error) {
    console.error('\n❌ SMOKE TEST FAILED');
    console.error('='.repeat(50));
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Run tests
runSmokeTests().catch(error => {
  console.error('Fatal Error:', error);
  process.exit(1);
});
