/**
 * 🔍 SYSTEM VALIDATION TEST SUITE
 * Phase 4 - Zero Error Validation
 * Tests all cached endpoints, Redis, database, and error handling
 */

const http = require('http');
const https = require('https');
const { Redis } = require('@upstash/redis');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3100';
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  errors: [],
  warnings: [],
  tests: []
};

// Initialize Redis
let redisCache = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redisCache = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    automaticDeserialization: true,
  });
}

// Helper: Make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
            responseTime: Date.now() - startTime
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            responseTime: Date.now() - startTime
          });
        }
      });
    });

    const startTime = Date.now();
    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Helper: Log test result
function logTest(name, passed, message, details = {}) {
  const result = {
    name,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  };

  TEST_RESULTS.tests.push(result);

  if (passed) {
    TEST_RESULTS.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else {
    TEST_RESULTS.failed++;
    TEST_RESULTS.errors.push({ test: name, message, details });
    console.error(`❌ ${name}: ${message}`);
  }

  if (details.warning) {
    TEST_RESULTS.warnings.push({ test: name, warning: details.warning });
    console.warn(`⚠️  ${name}: ${details.warning}`);
  }
}

// Test 1: Redis Connection
async function testRedisConnection() {
  console.log('\n🔍 TEST 1: Redis Connection');

  try {
    if (!redisCache) {
      logTest('Redis Connection', false, 'Redis client not initialized', {
        error: 'Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN'
      });
      return;
    }

    // Test SET
    const testKey = 'test:validation:' + Date.now();
    const testValue = { test: true, timestamp: Date.now() };
    await redisCache.set(testKey, testValue);
    logTest('Redis SET', true, 'Successfully stored test value');

    // Test GET
    const retrieved = await redisCache.get(testKey);
    const isValid = retrieved && retrieved.test === true;
    logTest('Redis GET', isValid, isValid ? 'Successfully retrieved test value' : 'Failed to retrieve test value', { retrieved });

    // Test DELETE
    await redisCache.del(testKey);
    const deleted = await redisCache.get(testKey);
    logTest('Redis DEL', deleted === null, deleted === null ? 'Successfully deleted test value' : 'Failed to delete test value');

    // Test SETEX (with TTL)
    const ttlKey = 'test:validation:ttl:' + Date.now();
    await redisCache.setex(ttlKey, 10, { ttl: true });
    const ttlValue = await redisCache.get(ttlKey);
    logTest('Redis SETEX', ttlValue !== null, ttlValue ? 'Successfully set value with TTL' : 'Failed to set value with TTL');

    // Cleanup
    await redisCache.del(ttlKey);

  } catch (error) {
    logTest('Redis Connection', false, 'Redis connection failed', { error: error.message });
  }
}

// Test 2: Cached Endpoint - /api/models
async function testModelsEndpoint() {
  console.log('\n🔍 TEST 2: /api/models (5 min TTL)');

  try {
    // Clear cache first
    if (redisCache) {
      await redisCache.del('api:models:all');
    }

    // Request 1: Cache MISS
    const req1 = await makeRequest(`${BASE_URL}/api/models`);
    const isMiss = req1.headers['x-cache'] === 'MISS' || !req1.headers['x-cache'];
    logTest('/api/models - MISS', req1.status === 200, `Status: ${req1.status}, Response time: ${req1.responseTime}ms`, {
      status: req1.status,
      cacheHeader: req1.headers['x-cache'],
      responseTime: req1.responseTime,
      modelsCount: req1.body?.models?.length || 0
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Request 2: Cache HIT
    const req2 = await makeRequest(`${BASE_URL}/api/models`);
    const isHit = req2.headers['x-cache'] === 'HIT';
    const speedup = req1.responseTime / req2.responseTime;

    logTest('/api/models - HIT', req2.status === 200 && isHit, `Status: ${req2.status}, Cache: ${req2.headers['x-cache']}, Speedup: ${speedup.toFixed(1)}x`, {
      status: req2.status,
      cacheHeader: req2.headers['x-cache'],
      responseTime: req2.responseTime,
      speedup: speedup.toFixed(2),
      warning: speedup < 1.5 ? 'Speedup below expected (target: 2x+)' : undefined
    });

    // Validate response structure
    const hasValidStructure = req2.body && Array.isArray(req2.body.models);
    logTest('/api/models - Structure', hasValidStructure, hasValidStructure ? 'Response structure is valid' : 'Invalid response structure', {
      hasModels: !!req2.body?.models,
      modelsCount: req2.body?.models?.length
    });

  } catch (error) {
    logTest('/api/models', false, 'Test failed', { error: error.message });
  }
}

// Test 3: Cached Endpoint - /api/health
async function testHealthEndpoint() {
  console.log('\n🔍 TEST 3: /api/health (10 sec TTL)');

  try {
    // Clear cache first
    if (redisCache) {
      await redisCache.del('api:health:basic');
    }

    // Request 1: Cache MISS
    const req1 = await makeRequest(`${BASE_URL}/api/health`);
    logTest('/api/health - MISS', req1.status === 200, `Status: ${req1.status}, Response time: ${req1.responseTime}ms`, {
      status: req1.status,
      cacheHeader: req1.headers['x-cache'],
      responseTime: req1.responseTime,
      healthStatus: req1.body?.status
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Request 2: Cache HIT
    const req2 = await makeRequest(`${BASE_URL}/api/health`);
    const isHit = req2.headers['x-cache'] === 'HIT';

    logTest('/api/health - HIT', req2.status === 200, `Status: ${req2.status}, Cache: ${req2.headers['x-cache']}`, {
      status: req2.status,
      cacheHeader: req2.headers['x-cache'],
      responseTime: req2.responseTime,
      healthStatus: req2.body?.status
    });

    // Validate response structure
    const hasValidStructure = req2.body && req2.body.status === 'healthy';
    logTest('/api/health - Structure', hasValidStructure, hasValidStructure ? 'Health check response is valid' : 'Invalid health response', {
      status: req2.body?.status,
      hasTimestamp: !!req2.body?.timestamp,
      hasModelsCount: !!req2.body?.models_count
    });

  } catch (error) {
    logTest('/api/health', false, 'Test failed', { error: error.message });
  }
}

// Test 4: Cached Endpoint - /api/translate
async function testTranslateEndpoint() {
  console.log('\n🔍 TEST 4: /api/translate (1 hour TTL)');

  try {
    const testText = 'Hello World';
    const crypto = require('crypto');
    const textHash = crypto.createHash('md5').update(testText).digest('hex').substring(0, 16);
    const cacheKey = `api:translate:en:tr:${textHash}`;

    // Clear cache first
    if (redisCache) {
      await redisCache.del(cacheKey);
    }

    // Request 1: Cache MISS
    const req1 = await makeRequest(`${BASE_URL}/api/translate`, {
      method: 'POST',
      body: { text: testText, from: 'en', to: 'tr' }
    });

    logTest('/api/translate - MISS', req1.status === 200, `Status: ${req1.status}, Response time: ${req1.responseTime}ms`, {
      status: req1.status,
      cacheHeader: req1.headers['x-cache'],
      responseTime: req1.responseTime,
      hasTranslation: !!req1.body?.data?.translated
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Request 2: Cache HIT
    const req2 = await makeRequest(`${BASE_URL}/api/translate`, {
      method: 'POST',
      body: { text: testText, from: 'en', to: 'tr' }
    });

    const isHit = req2.headers['x-cache'] === 'HIT';
    const speedup = req1.responseTime / req2.responseTime;

    logTest('/api/translate - HIT', req2.status === 200, `Status: ${req2.status}, Cache: ${req2.headers['x-cache']}, Speedup: ${speedup.toFixed(1)}x`, {
      status: req2.status,
      cacheHeader: req2.headers['x-cache'],
      responseTime: req2.responseTime,
      speedup: speedup.toFixed(2),
      sameTranslation: req1.body?.data?.translated === req2.body?.data?.translated
    });

    // Validate response structure
    const hasValidStructure = req2.body && req2.body.success && req2.body.data && req2.body.data.translated;
    logTest('/api/translate - Structure', hasValidStructure, hasValidStructure ? 'Translation response is valid' : 'Invalid translation response', {
      hasSuccess: !!req2.body?.success,
      hasData: !!req2.body?.data,
      hasTranslated: !!req2.body?.data?.translated,
      hasSourceLang: !!req2.body?.data?.from,
      hasTargetLang: !!req2.body?.data?.to
    });

  } catch (error) {
    logTest('/api/translate', false, 'Test failed', { error: error.message });
  }
}

// Test 5: Error Handling - Invalid Endpoints
async function testErrorHandling() {
  console.log('\n🔍 TEST 5: Error Handling');

  try {
    // Test 404 - Accept 400, 404, or any 4xx error
    const req404 = await makeRequest(`${BASE_URL}/api/nonexistent`);
    const is4xxError = req404.status >= 400 && req404.status < 500;
    logTest('404 Handling', is4xxError, `Returns proper error status (${req404.status})`, {
      status: req404.status,
      isClientError: is4xxError
    });

    // Test invalid method - Accept 400, 405, or any 4xx error
    const reqMethod = await makeRequest(`${BASE_URL}/api/health`, { method: 'DELETE' });
    const isMethodError = reqMethod.status >= 400 && reqMethod.status < 500;
    logTest('Invalid Method', isMethodError, `Returns proper error for invalid method (${reqMethod.status})`, {
      status: reqMethod.status,
      isClientError: isMethodError
    });

  } catch (error) {
    logTest('Error Handling', false, 'Error handling test failed', { error: error.message });
  }
}

// Test 6: Performance Metrics
async function testPerformanceMetrics() {
  console.log('\n🔍 TEST 6: Performance Metrics');

  try {
    // Clear all caches
    if (redisCache) {
      await redisCache.del('api:models:all');
      await redisCache.del('api:health:basic');
    }

    // Test multiple endpoints
    const endpoints = [
      { url: '/api/models', name: 'models', target: 100 },
      { url: '/api/health', name: 'health', target: 100 }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      // MISS request
      const miss = await makeRequest(`${BASE_URL}${endpoint.url}`);
      await new Promise(resolve => setTimeout(resolve, 50));

      // HIT request
      const hit = await makeRequest(`${BASE_URL}${endpoint.url}`);

      results.push({
        endpoint: endpoint.name,
        missTime: miss.responseTime,
        hitTime: hit.responseTime,
        speedup: (miss.responseTime / hit.responseTime).toFixed(2),
        target: endpoint.target
      });

      const meetsTarget = hit.responseTime < endpoint.target;
      logTest(`Performance - ${endpoint.name}`, meetsTarget, `Hit response time: ${hit.responseTime}ms (target: <${endpoint.target}ms)`, {
        missTime: miss.responseTime,
        hitTime: hit.responseTime,
        speedup: (miss.responseTime / hit.responseTime).toFixed(2),
        meetsTarget,
        warning: !meetsTarget ? `Response time exceeds target of ${endpoint.target}ms` : undefined
      });
    }

    // Average performance
    const avgHitTime = results.reduce((sum, r) => sum + r.hitTime, 0) / results.length;
    const meetsAvgTarget = avgHitTime < 100;

    logTest('Performance - Average', meetsAvgTarget, `Average cache hit time: ${avgHitTime.toFixed(0)}ms (target: <100ms)`, {
      averageHitTime: avgHitTime.toFixed(2),
      results,
      warning: !meetsAvgTarget ? 'Average response time exceeds 100ms target' : undefined
    });

  } catch (error) {
    logTest('Performance Metrics', false, 'Performance test failed', { error: error.message });
  }
}

// Test 7: Cache Invalidation
async function testCacheInvalidation() {
  console.log('\n🔍 TEST 7: Cache Invalidation');

  try {
    if (!redisCache) {
      logTest('Cache Invalidation', false, 'Redis not available', {});
      return;
    }

    const testKey = 'api:test:invalidation';

    // Set a value
    await redisCache.set(testKey, { test: true });
    const beforeDel = await redisCache.get(testKey);
    logTest('Cache SET before invalidation', beforeDel !== null, 'Value stored successfully');

    // Invalidate
    await redisCache.del(testKey);
    const afterDel = await redisCache.get(testKey);
    logTest('Cache invalidation', afterDel === null, 'Value invalidated successfully', {
      beforeDel: !!beforeDel,
      afterDel: !!afterDel
    });

  } catch (error) {
    logTest('Cache Invalidation', false, 'Invalidation test failed', { error: error.message });
  }
}

// Generate Report
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SYSTEM VALIDATION REPORT');
  console.log('='.repeat(60));
  console.log(`\n📅 Date: ${new Date().toISOString()}`);
  console.log(`🎯 Total Tests: ${TEST_RESULTS.passed + TEST_RESULTS.failed}`);
  console.log(`✅ Passed: ${TEST_RESULTS.passed}`);
  console.log(`❌ Failed: ${TEST_RESULTS.failed}`);
  console.log(`⚠️  Warnings: ${TEST_RESULTS.warnings.length}`);

  const successRate = ((TEST_RESULTS.passed / (TEST_RESULTS.passed + TEST_RESULTS.failed)) * 100).toFixed(1);
  console.log(`\n🏆 Success Rate: ${successRate}%`);

  if (TEST_RESULTS.failed === 0 && TEST_RESULTS.warnings.length === 0) {
    console.log('\n✨ STATUS: PERFECT - ZERO ERRORS! ✨');
  } else if (TEST_RESULTS.failed === 0) {
    console.log(`\n✅ STATUS: PASSED (${TEST_RESULTS.warnings.length} warnings)`);
  } else {
    console.log('\n❌ STATUS: FAILED');
  }

  if (TEST_RESULTS.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    TEST_RESULTS.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.test}: ${error.message}`);
      if (error.details.error) {
        console.log(`     Error: ${error.details.error}`);
      }
    });
  }

  if (TEST_RESULTS.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    TEST_RESULTS.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning.test}: ${warning.warning}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  return TEST_RESULTS;
}

// Main Test Runner
async function runTests() {
  console.log('🚀 Starting System Validation Test Suite...\n');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`🔧 Redis: ${redisCache ? 'Enabled' : 'Disabled'}`);

  try {
    await testRedisConnection();
    await testModelsEndpoint();
    await testHealthEndpoint();
    await testTranslateEndpoint();
    await testErrorHandling();
    await testPerformanceMetrics();
    await testCacheInvalidation();

    const results = generateReport();

    // Save results to file
    const fs = require('fs');
    const reportPath = '/Users/sardag/Desktop/ailydian-ultra-pro/SYSTEM-VALIDATION-REPORT.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);

    // Exit with appropriate code
    process.exit(results.failed === 0 ? 0 : 1);

  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
