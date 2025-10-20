#!/usr/bin/env node
/**
 * ⚡ CACHE PERFORMANCE TEST
 * Tests Redis cache implementation and measures performance improvements
 *
 * Phase 4 Performance Optimization
 */

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const isHttps = BASE_URL.startsWith('https');
const httpModule = isHttps ? https : http;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

/**
 * Make HTTP request
 */
function request(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const startTime = Date.now();

    const req = httpModule.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;

        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            responseTime,
            headers: res.headers
          });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Format milliseconds with color coding
 */
function formatResponseTime(ms) {
  const color = ms < 50 ? colors.green : ms < 100 ? colors.yellow : colors.red;
  return `${color}${ms}ms${colors.reset}`;
}

/**
 * Print section header
 */
function printHeader(title) {
  console.log('\n' + colors.bold + colors.cyan + '═'.repeat(70) + colors.reset);
  console.log(colors.bold + colors.cyan + `  ${title}` + colors.reset);
  console.log(colors.bold + colors.cyan + '═'.repeat(70) + colors.reset + '\n');
}

/**
 * Test 1: Check Redis connectivity via stats endpoint
 */
async function testRedisConnectivity() {
  printHeader('TEST 1: Redis Connectivity');

  try {
    const result = await request('/api/cache-stats');

    if (result.statusCode === 200) {
      const { cache, configuration, totalCachedKeys, keyDistribution } = result.data;

      console.log(`${colors.green}✅ Cache Stats Endpoint: Working${colors.reset}`);
      console.log(`   • Redis Configured: ${configuration.configured ? '✅' : '❌'}`);
      console.log(`   • Redis Healthy: ${cache.healthy ? '✅' : '❌'}`);
      console.log(`   • Total Keys: ${totalCachedKeys || 0}`);

      if (keyDistribution) {
        console.log(`   • Key Distribution:`);
        Object.entries(keyDistribution).forEach(([prefix, count]) => {
          console.log(`     - ${prefix}: ${count} keys`);
        });
      }

      console.log(`   • Response Time: ${formatResponseTime(result.responseTime)}`);

      if (!cache.healthy) {
        console.log(`\n${colors.yellow}⚠️  Redis not healthy - tests may fail${colors.reset}`);
        return false;
      }

      return true;
    } else {
      console.log(`${colors.red}❌ Cache Stats Endpoint: Failed (${result.statusCode})${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Cache Stats Endpoint: Error${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Cache MISS (first request)
 */
async function testCacheMiss() {
  printHeader('TEST 2: Cache MISS (First Request)');

  try {
    // Add random query param to ensure cache miss
    const result = await request(`/api/models?t=${Date.now()}`);

    if (result.statusCode === 200) {
      const cacheHeader = result.headers['x-cache'];
      const cacheKey = result.headers['x-cache-key'];

      console.log(`${colors.green}✅ Models Endpoint: Working${colors.reset}`);
      console.log(`   • Cache Status: ${cacheHeader || 'N/A'}`);
      console.log(`   • Cache Key: ${cacheKey || 'N/A'}`);
      console.log(`   • Response Time: ${formatResponseTime(result.responseTime)}`);
      console.log(`   • Models Count: ${result.data.total || 0}`);

      if (cacheHeader === 'MISS' || cacheHeader === 'SKIP') {
        console.log(`\n${colors.green}✅ Cache MISS detected (expected for first request)${colors.reset}`);
        return { success: true, responseTime: result.responseTime };
      } else {
        console.log(`\n${colors.yellow}⚠️  Expected MISS but got: ${cacheHeader}${colors.reset}`);
        return { success: true, responseTime: result.responseTime };
      }
    } else {
      console.log(`${colors.red}❌ Models Endpoint: Failed (${result.statusCode})${colors.reset}`);
      return { success: false, responseTime: result.responseTime };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Models Endpoint: Error${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    return { success: false, responseTime: 0 };
  }
}

/**
 * Test 3: Cache HIT (second request)
 */
async function testCacheHit() {
  printHeader('TEST 3: Cache HIT (Second Request)');

  try {
    // Same request without query param to test cache
    const result = await request('/api/models');

    if (result.statusCode === 200) {
      const cacheHeader = result.headers['x-cache'];
      const cacheKey = result.headers['x-cache-key'];

      console.log(`${colors.green}✅ Models Endpoint: Working${colors.reset}`);
      console.log(`   • Cache Status: ${cacheHeader || 'N/A'}`);
      console.log(`   • Cache Key: ${cacheKey || 'N/A'}`);
      console.log(`   • Response Time: ${formatResponseTime(result.responseTime)}`);
      console.log(`   • Models Count: ${result.data.total || 0}`);

      if (cacheHeader === 'HIT') {
        console.log(`\n${colors.green}✅ Cache HIT detected (cache working!)${colors.reset}`);
        return { success: true, responseTime: result.responseTime };
      } else {
        console.log(`\n${colors.yellow}⚠️  Expected HIT but got: ${cacheHeader}${colors.reset}`);
        return { success: false, responseTime: result.responseTime };
      }
    } else {
      console.log(`${colors.red}❌ Models Endpoint: Failed (${result.statusCode})${colors.reset}`);
      return { success: false, responseTime: result.responseTime };
    }
  } catch (error) {
    console.log(`${colors.red}❌ Models Endpoint: Error${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    return { success: false, responseTime: 0 };
  }
}

/**
 * Test 4: Performance benchmark (10 requests)
 */
async function testPerformanceBenchmark() {
  printHeader('TEST 4: Performance Benchmark (10 Requests)');

  const results = [];

  for (let i = 1; i <= 10; i++) {
    try {
      const result = await request('/api/models');
      results.push({
        request: i,
        responseTime: result.responseTime,
        cacheStatus: result.headers['x-cache'] || 'N/A'
      });

      console.log(
        `   Request ${i.toString().padStart(2)}: ${formatResponseTime(result.responseTime).padEnd(15)} ` +
        `Cache: ${result.headers['x-cache'] || 'N/A'}`
      );
    } catch (error) {
      console.log(`   Request ${i}: ${colors.red}Error - ${error.message}${colors.reset}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Calculate statistics
  const responseTimes = results.map(r => r.responseTime);
  const cacheHits = results.filter(r => r.cacheStatus === 'HIT').length;
  const cacheMisses = results.filter(r => r.cacheStatus === 'MISS').length;

  const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const min = Math.min(...responseTimes);
  const max = Math.max(...responseTimes);
  const hitRate = (cacheHits / results.length * 100).toFixed(1);

  console.log('\n' + colors.bold + '📊 Statistics:' + colors.reset);
  console.log(`   • Average Response Time: ${formatResponseTime(Math.round(avg))}`);
  console.log(`   • Min Response Time: ${formatResponseTime(min)}`);
  console.log(`   • Max Response Time: ${formatResponseTime(max)}`);
  console.log(`   • Cache Hit Rate: ${hitRate}% (${cacheHits}/${results.length})`);
  console.log(`   • Cache Hits: ${colors.green}${cacheHits}${colors.reset}`);
  console.log(`   • Cache Misses: ${colors.yellow}${cacheMisses}${colors.reset}`);

  // Performance verdict
  if (avg < 50) {
    console.log(`\n${colors.green}🚀 EXCELLENT PERFORMANCE! Target achieved (<50ms avg)${colors.reset}`);
  } else if (avg < 100) {
    console.log(`\n${colors.yellow}⚡ Good performance (<100ms avg)${colors.reset}`);
  } else {
    console.log(`\n${colors.red}⚠️  Performance needs improvement (>100ms avg)${colors.reset}`);
  }

  return { avg, min, max, hitRate, cacheHits, cacheMisses };
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(colors.bold + colors.blue);
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                 ⚡ CACHE PERFORMANCE TEST SUITE                   ║');
  console.log('║                  Phase 4 Performance Optimization                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  console.log(`\n🎯 Testing: ${colors.cyan}${BASE_URL}${colors.reset}`);
  console.log(`📅 Date: ${new Date().toISOString()}\n`);

  try {
    // Test 1: Redis connectivity
    const redisOk = await testRedisConnectivity();

    if (!redisOk) {
      console.log(`\n${colors.red}❌ Redis not available - skipping cache tests${colors.reset}\n`);
      process.exit(1);
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Cache MISS
    const missResult = await testCacheMiss();

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: Cache HIT
    const hitResult = await testCacheHit();

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 4: Performance benchmark
    const benchmarkResult = await testPerformanceBenchmark();

    // Final summary
    printHeader('🎉 TEST SUMMARY');

    console.log('✅ All tests completed!\n');
    console.log(`${colors.bold}Performance Targets:${colors.reset}`);
    console.log(`   • API Response Time: <50ms (current: ${Math.round(benchmarkResult.avg)}ms)`);
    console.log(`   • Cache Hit Rate: >80% (current: ${benchmarkResult.hitRate}%)`);

    const targetsMet = benchmarkResult.avg < 50 && parseFloat(benchmarkResult.hitRate) > 80;

    if (targetsMet) {
      console.log(`\n${colors.green}${colors.bold}🎯 ALL PERFORMANCE TARGETS MET! 🚀${colors.reset}\n`);
    } else {
      console.log(`\n${colors.yellow}⚡ Working towards performance targets...${colors.reset}\n`);
    }

    console.log(`${colors.cyan}Next Steps:${colors.reset}`);
    console.log(`   1. Apply caching to more API endpoints`);
    console.log(`   2. Optimize cache TTL settings`);
    console.log(`   3. Monitor cache hit rate in production`);
    console.log(`   4. Set up automated performance alerts\n`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Test suite failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
