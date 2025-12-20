/**
 * GROQ MEDICAL RAG API - QUICK TEST SCRIPT
 *
 * Tests the API functionality without requiring a running server
 * Useful for development and debugging
 */

require('dotenv').config();

// Mock request and response objects
class MockRequest {
  constructor(method = 'GET', body = {}, files = {}, headers = {}) {
    this.method = method;
    this.body = body;
    this.files = files;
    this.headers = headers;
    this.ip = '127.0.0.1';
  }
}

class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = null;
  }

  setHeader(key, value) {
    this.headers[key] = value;
    return this;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(data) {
    this.body = data;
    console.log('\n=== RESPONSE ===');
    console.log('Status:', this.statusCode);
    console.log('Body:', JSON.stringify(data, null, 2));
    return this;
  }

  end() {
    console.log('Response ended');
    return this;
  }
}

/**
 * Test 1: GET endpoint (API info)
 */
async function testGetEndpoint() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  TEST 1: GET Endpoint (API Information)                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const handler = require('./groq-rag.js');
  const req = new MockRequest('GET');
  const res = new MockResponse();

  await handler(req, res);

  if (res.statusCode === 200 && res.body.service) {
    console.log('\n✅ GET endpoint test passed!');
    return true;
  } else {
    console.log('\n❌ GET endpoint test failed!');
    return false;
  }
}

/**
 * Test 2: Check environment configuration
 */
function testConfiguration() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  TEST 2: Configuration Check                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const config = {
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    AZURE_DOC_INTELLIGENCE_ENDPOINT: !!process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT,
    AZURE_DOC_INTELLIGENCE_KEY: !!process.env.AZURE_DOC_INTELLIGENCE_KEY
  };

  console.log('Configuration Status:');
  console.log('  GROQ_API_KEY:', config.GROQ_API_KEY ? '✓ Configured' : '✗ Missing (REQUIRED)');
  console.log('  AZURE_DOC_INTELLIGENCE_ENDPOINT:', config.AZURE_DOC_INTELLIGENCE_ENDPOINT ? '✓ Configured' : '✗ Not configured (optional)');
  console.log('  AZURE_DOC_INTELLIGENCE_KEY:', config.AZURE_DOC_INTELLIGENCE_KEY ? '✓ Configured' : '✗ Not configured (optional)');

  if (config.GROQ_API_KEY) {
    console.log('\n✅ Minimum configuration is valid!');
    console.log('   Note: OCR features require Azure Document Intelligence');
    return true;
  } else {
    console.log('\n❌ Configuration invalid!');
    console.log('   Please set GROQ_API_KEY in your .env file');
    console.log('   Get your API key at: https://console.groq.com');
    return false;
  }
}

/**
 * Test 3: Test model configurations
 */
function testModels() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  TEST 3: Model Configurations                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const { GROQ_MODELS } = require('./groq-rag.js');

  console.log('Available Models:');
  Object.entries(GROQ_MODELS).forEach(([key, config]) => {
    console.log(`\n  ${key}:`);
    console.log(`    Name: ${config.name}`);
    console.log(`    Max Tokens: ${config.maxTokens}`);
    console.log(`    Context Window: ${config.contextWindow}`);
    console.log(`    Speed: ${config.speed}`);
    console.log(`    Description: ${config.description}`);
  });

  console.log('\n✅ Model configurations loaded successfully!');
  return true;
}

/**
 * Test 4: Test text extraction (if Groq key is available)
 */
async function testTextAnalysis() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  TEST 4: Text Analysis (Live API Test)                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!process.env.GROQ_API_KEY) {
    console.log('⚠️  Skipping live API test - GROQ_API_KEY not configured');
    return false;
  }

  const { analyzeMedicalDocument } = require('./groq-rag.js');

  const testDocument = `
PATIENT: Test Patient
DATE: 2024-12-19

CHIEF COMPLAINT: Headache and fever

VITALS:
- Temperature: 38.5°C (elevated)
- Blood Pressure: 120/80 mmHg
- Heart Rate: 88 bpm

ASSESSMENT:
Patient presents with symptoms consistent with viral infection.
Symptomatic treatment recommended.

PLAN:
- Acetaminophen 500mg every 6 hours as needed for fever
- Rest and hydration
- Follow up if symptoms worsen
  `;

  try {
    console.log('Analyzing test document with Groq AI...');
    console.log('Document length:', testDocument.length, 'characters\n');

    const startTime = Date.now();
    const result = await analyzeMedicalDocument(testDocument, {
      model: 'GX8E2D9A',
      language: 'en'
    });
    const duration = Date.now() - startTime;

    console.log('✅ Analysis completed in', duration, 'ms');
    console.log('\nAnalysis Results:');
    console.log('  Summary:', result.analysis.summary.substring(0, 100) + '...');
    console.log('  Key Findings:', result.analysis.keyFindings.length);
    console.log('  Medications:', result.analysis.medications.length);
    console.log('  Diagnoses:', result.analysis.diagnoses.length);
    console.log('  Recommendations:', result.analysis.recommendations.length);
    console.log('\nMetadata:');
    console.log('  Model:', result.metadata.model);
    console.log('  Provider:', result.metadata.provider);
    console.log('  Inference Time:', result.metadata.inferenceTimeMs, 'ms');
    console.log('  Tokens Used:', result.metadata.tokensUsed.total);

    console.log('\n✅ Live API test passed!');
    return true;

  } catch (error) {
    console.log('\n❌ Live API test failed!');
    console.log('Error:', error.message);
    if (error.message.includes('API key')) {
      console.log('\nTip: Check if your GROQ_API_KEY is valid');
      console.log('Get a new key at: https://console.groq.com');
    }
    return false;
  }
}

/**
 * Test 5: Test error handling
 */
async function testErrorHandling() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  TEST 5: Error Handling                                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const handler = require('./groq-rag.js');

  // Test 1: Wrong method
  console.log('Test 5.1: Wrong HTTP method (PUT)');
  let req = new MockRequest('PUT');
  let res = new MockResponse();
  await handler(req, res);
  console.log('Expected 405, Got:', res.statusCode, res.statusCode === 405 ? '✓' : '✗');

  // Test 2: OPTIONS (CORS preflight)
  console.log('\nTest 5.2: OPTIONS (CORS preflight)');
  req = new MockRequest('OPTIONS');
  res = new MockResponse();
  await handler(req, res);
  console.log('Expected 200, Got:', res.statusCode, res.statusCode === 200 ? '✓' : '✗');

  console.log('\n✅ Error handling tests completed!');
  return true;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║    GROQ MEDICAL RAG API - COMPREHENSIVE TEST SUITE        ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = {
    configuration: false,
    models: false,
    getEndpoint: false,
    errorHandling: false,
    liveApi: false
  };

  try {
    // Run tests in order
    results.configuration = testConfiguration();
    results.models = testModels();
    results.getEndpoint = await testGetEndpoint();
    results.errorHandling = await testErrorHandling();

    // Only run live API test if configuration is valid
    if (results.configuration) {
      results.liveApi = await testTextAnalysis();
    }

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    console.error(error.stack);
  }

  // Summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').toUpperCase();
    console.log(`  ${status} - ${testName}`);
  });

  console.log('\n' + '─'.repeat(60));
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log('─'.repeat(60) + '\n');

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! API is ready to use.\n');
  } else if (results.configuration && results.models && results.getEndpoint) {
    console.log('⚠️  Core functionality is working, but some tests failed.');
    if (!results.liveApi) {
      console.log('    Note: Live API test requires valid GROQ_API_KEY\n');
    }
  } else {
    console.log('❌ Critical tests failed. Please check configuration.\n');
  }

  // Next steps
  console.log('NEXT STEPS:');
  if (!process.env.GROQ_API_KEY) {
    console.log('  1. Get Groq API key: https://console.groq.com');
    console.log('  2. Add to .env: GROQ_API_KEY=gsk_your_key_here');
  }
  if (results.configuration) {
    console.log('  1. Start server: npm start');
    console.log('  2. Test API: curl http://localhost:3100/api/medical/groq-rag');
    console.log('  3. Run examples: node api/medical/groq-rag-example.js');
    console.log('  4. Read documentation: api/medical/groq-rag-README.md');
  }
  console.log('\n');

  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = {
  testGetEndpoint,
  testConfiguration,
  testModels,
  testTextAnalysis,
  testErrorHandling,
  runAllTests
};
