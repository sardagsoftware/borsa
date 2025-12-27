/**
 * Redis Cache Manager Test Script
 * Tests caching functionality with both sync and async APIs
 */

const cacheManager = require('./lib/cache/redis-cache-manager');

async function runTests() {
  console.log('=== REDIS CACHE MANAGER TEST ===\n');

  // Test 1: Health Check
  console.log('Test 1: Health Check');
  const health = await cacheManager.healthCheck();
  console.log('Health:', health);
  console.log(`Status: ${health.healthy ? '✅ HEALTHY' : '⚠️ FALLBACK MODE'}\n`);

  // Test 2: Synchronous API (backwards compatible)
  console.log('Test 2: Synchronous API (Memory Fallback)');
  cacheManager.set('memory', 'sync-key', { data: 'sync-value' }, 60);
  const syncValue = cacheManager.get('memory', 'sync-key');
  console.log('Sync Get:', syncValue);
  console.log(syncValue.data === 'sync-value' ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Test 3: Async API (Redis)
  console.log('Test 3: Async API (Redis)');
  await cacheManager.setAsync('aiResponse', 'async-key', { ai: 'response', model: 'gpt-4' }, 120);
  const asyncValue = await cacheManager.getAsync('aiResponse', 'async-key');
  console.log('Async Get:', asyncValue);
  console.log(asyncValue && asyncValue.ai === 'response' ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Test 4: Cache Miss
  console.log('Test 4: Cache Miss');
  const missingValue = await cacheManager.getAsync('memory', 'non-existent-key');
  console.log('Missing Value:', missingValue);
  console.log(missingValue === null ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Test 5: All Cache Types
  console.log('Test 5: All Cache Types');
  const testData = { test: true, timestamp: Date.now() };

  await cacheManager.setAsync('memory', 'test-1', testData, 60);
  await cacheManager.setAsync('session', 'test-2', testData, 60);
  await cacheManager.setAsync('aiResponse', 'test-3', testData, 60);
  await cacheManager.setAsync('static', 'test-4', testData, 60);

  const v1 = await cacheManager.getAsync('memory', 'test-1');
  const v2 = await cacheManager.getAsync('session', 'test-2');
  const v3 = await cacheManager.getAsync('aiResponse', 'test-3');
  const v4 = await cacheManager.getAsync('static', 'test-4');

  console.log('All cache types working:', v1 && v2 && v3 && v4 ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Test 6: Delete
  console.log('Test 6: Delete Operation');
  await cacheManager.setAsync('memory', 'delete-test', { value: 'to-delete' }, 60);
  await cacheManager.deleteAsync('memory', 'delete-test');
  const deletedValue = await cacheManager.getAsync('memory', 'delete-test');
  console.log('Delete successful:', deletedValue === null ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Test 7: Performance Test
  console.log('Test 7: Performance Test (100 operations)');
  const perfStart = Date.now();

  for (let i = 0; i < 100; i++) {
    await cacheManager.setAsync('memory', `perf-${i}`, { index: i }, 60);
  }

  for (let i = 0; i < 100; i++) {
    await cacheManager.getAsync('memory', `perf-${i}`);
  }

  const perfDuration = Date.now() - perfStart;
  console.log(`100 writes + 100 reads: ${perfDuration}ms`);
  console.log(perfDuration < 1000 ? '✅ PASS' : '⚠️ SLOW');
  console.log('');

  // Test 8: Statistics
  console.log('Test 8: Cache Statistics');
  const stats = cacheManager.getStats();
  console.log('Stats:', stats);
  console.log('');

  // Test 9: Flush
  console.log('Test 9: Flush Cache');
  await cacheManager.setAsync('memory', 'flush-test', { value: 'test' }, 60);
  await cacheManager.flushAsync('memory');
  const flushedValue = await cacheManager.getAsync('memory', 'flush-test');
  console.log('Flush successful:', flushedValue === null ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Final Summary
  console.log('=== TEST SUMMARY ===');
  console.log(`Mode: ${stats.mode.toUpperCase()}`);
  console.log(`Connected: ${stats.connected ? 'Yes' : 'No (using memory fallback)'}`);
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Hit Rates:`, stats.hitRates);
  console.log('');

  console.log('=== TEST COMPLETE ===');

  // Shutdown
  await cacheManager.shutdown();
  process.exit(0);
}

// Run tests
runTests().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
