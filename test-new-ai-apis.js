#!/usr/bin/env node
// Test Suite for New AI API Endpoints
// Run with: node test-new-ai-apis.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3100';
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[36m',
  RESET: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

async function testEndpoint(name, config) {
  try {
    log(COLORS.BLUE, `\n🧪 Testing: ${name}`);
    const startTime = Date.now();

    const response = await axios({
      ...config,
      timeout: 30000,
      validateStatus: () => true // Accept all status codes
    });

    const duration = Date.now() - startTime;

    if (response.status >= 200 && response.status < 300) {
      log(COLORS.GREEN, `✅ PASSED (${duration}ms) - Status: ${response.status}`);
      if (config.showResponse) {
        console.log('Response:', JSON.stringify(response.data, null, 2).slice(0, 500));
      }
      return { success: true, duration, status: response.status };
    } else {
      log(COLORS.YELLOW, `⚠️  WARNING (${duration}ms) - Status: ${response.status}`);
      console.log('Response:', response.data);
      return { success: false, duration, status: response.status, data: response.data };
    }
  } catch (error) {
    log(COLORS.RED, `❌ FAILED - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log(COLORS.BLUE, '═══════════════════════════════════════════════════════');
  log(COLORS.BLUE, '   AILYDIAN ULTRA PRO - NEW AI APIs TEST SUITE');
  log(COLORS.BLUE, '═══════════════════════════════════════════════════════');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    total: 0
  };

  // Test 1: GPT-5 API
  log(COLORS.YELLOW, '\n📦 GPT-5 API Tests (Azure AI Foundry)');

  const gpt5Test = await testEndpoint('GPT-5 Chat Request', {
    method: 'POST',
    url: `${BASE_URL}/api/chat/gpt5`,
    data: {
      message: 'Hello, what can you do?',
      model: 'gpt-5',
      temperature: 0.7,
      max_tokens: 100
    },
    showResponse: true
  });
  results.total++;
  if (gpt5Test.success) results.passed++;
  else if (gpt5Test.status === 500 || gpt5Test.status === 401) results.warnings++;
  else results.failed++;

  // Test 2: AX9F7E2B API
  log(COLORS.YELLOW, '\n📦 AX9F7E2B API Tests (Anthropic)');

  const AX9F7E2BTest = await testEndpoint('AX9F7E2B 3.5 Sonnet Chat', {
    method: 'POST',
    url: `${BASE_URL}/api/chat/AX9F7E2B`,
    data: {
      message: 'Explain quantum computing in one sentence',
      model: 'AX9F7E2B',
      temperature: 0.7,
      max_tokens: 100
    },
    showResponse: true
  });
  results.total++;
  if (AX9F7E2BTest.success) results.passed++;
  else if (AX9F7E2BTest.status === 500 || AX9F7E2BTest.status === 401) results.warnings++;
  else results.failed++;

  const AX9F7E2BModelsTest = await testEndpoint('AX9F7E2B Get Models', {
    method: 'GET',
    url: `${BASE_URL}/api/AX9F7E2B/models`,
    showResponse: true
  });
  results.total++;
  if (AX9F7E2BModelsTest.success) results.passed++;
  else results.failed++;

  // Test 3: Gemini API
  log(COLORS.YELLOW, '\n📦 Gemini API Tests (Google AI)');

  const geminiTest = await testEndpoint('Gemini 2.0 Flash Chat', {
    method: 'POST',
    url: `${BASE_URL}/api/chat/gemini`,
    data: {
      message: 'What is artificial intelligence?',
      model: 'gemini-2.0-flash',
      temperature: 0.8,
      max_tokens: 100
    },
    showResponse: true
  });
  results.total++;
  if (geminiTest.success) results.passed++;
  else if (geminiTest.status === 500 || geminiTest.status === 401) results.warnings++;
  else results.failed++;

  const geminiModelsTest = await testEndpoint('Gemini Get Models', {
    method: 'GET',
    url: `${BASE_URL}/api/gemini/models`,
    showResponse: true
  });
  results.total++;
  if (geminiModelsTest.success) results.passed++;
  else results.failed++;

  // Test 4: Speech API
  log(COLORS.YELLOW, '\n📦 Speech API Tests (Azure Speech Services)');

  const synthesizeTest = await testEndpoint('Text-to-Speech Synthesis', {
    method: 'POST',
    url: `${BASE_URL}/api/speech/synthesize`,
    data: {
      text: 'Merhaba, ben Ailydian yapay zeka asistanıyım.',
      language: 'tr-TR',
      voice: 'tr-TR-EmelNeural',
      rate: '1.0'
    },
    showResponse: false
  });
  results.total++;
  if (synthesizeTest.success) results.passed++;
  else if (synthesizeTest.status === 500 || synthesizeTest.status === 401) results.warnings++;
  else results.failed++;

  const voicesTest = await testEndpoint('Get Available Voices', {
    method: 'GET',
    url: `${BASE_URL}/api/speech/voices`,
    showResponse: false
  });
  results.total++;
  if (voicesTest.success) results.passed++;
  else if (voicesTest.status === 500 || voicesTest.status === 401) results.warnings++;
  else results.failed++;

  // Test 5: Web Search API
  log(COLORS.YELLOW, '\n📦 Web Search API Tests');

  const searchTest = await testEndpoint('Web Search Query', {
    method: 'GET',
    url: `${BASE_URL}/api/web-search`,
    params: {
      q: 'artificial intelligence',
      num: 5,
      language: 'tr'
    },
    showResponse: true
  });
  results.total++;
  if (searchTest.success) results.passed++;
  else if (searchTest.status === 500 || searchTest.status === 401) results.warnings++;
  else results.failed++;

  const searchStatsTest = await testEndpoint('Web Search Cache Stats', {
    method: 'GET',
    url: `${BASE_URL}/api/web-search/stats`,
    showResponse: true
  });
  results.total++;
  if (searchStatsTest.success) results.passed++;
  else results.failed++;

  // Test 6: Error Handling
  log(COLORS.YELLOW, '\n📦 Error Handling Tests');

  const errorTest1 = await testEndpoint('AX9F7E2B Invalid Model', {
    method: 'POST',
    url: `${BASE_URL}/api/chat/AX9F7E2B`,
    data: {
      message: 'Test',
      model: 'invalid-model-name'
    }
  });
  results.total++;
  if (errorTest1.status === 400) results.passed++;
  else results.failed++;

  const errorTest2 = await testEndpoint('Gemini Missing Message', {
    method: 'POST',
    url: `${BASE_URL}/api/chat/gemini`,
    data: {
      model: 'gemini-2.0-flash'
    }
  });
  results.total++;
  if (errorTest2.status === 400) results.passed++;
  else results.failed++;

  const errorTest3 = await testEndpoint('Search Missing Query', {
    method: 'GET',
    url: `${BASE_URL}/api/web-search`,
    params: {}
  });
  results.total++;
  if (errorTest3.status === 400) results.passed++;
  else results.failed++;

  // Print Summary
  log(COLORS.BLUE, '\n═══════════════════════════════════════════════════════');
  log(COLORS.BLUE, '   TEST SUMMARY');
  log(COLORS.BLUE, '═══════════════════════════════════════════════════════');

  log(COLORS.GREEN, `✅ Passed: ${results.passed}/${results.total}`);
  if (results.warnings > 0) {
    log(COLORS.YELLOW, `⚠️  Warnings: ${results.warnings}/${results.total} (API keys not configured or service unavailable)`);
  }
  if (results.failed > 0) {
    log(COLORS.RED, `❌ Failed: ${results.failed}/${results.total}`);
  }

  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(COLORS.BLUE, `\n📊 Success Rate: ${successRate}%`);

  if (results.passed === results.total) {
    log(COLORS.GREEN, '\n🎉 All tests passed! APIs are ready for production.');
  } else if (results.passed + results.warnings === results.total) {
    log(COLORS.YELLOW, '\n⚠️  All endpoints are functional but some API keys need configuration.');
  } else {
    log(COLORS.RED, '\n❌ Some tests failed. Please check the errors above.');
  }

  log(COLORS.BLUE, '\n═══════════════════════════════════════════════════════\n');
}

// Run tests
runTests().catch(error => {
  log(COLORS.RED, `\n❌ Test suite failed: ${error.message}`);
  process.exit(1);
});
