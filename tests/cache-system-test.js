/**
 * Cache System Test
 * L1, L2, Cache Manager ve Middleware testleri
 */

const MemoryCache = require('../lib/cache/memory-cache');
const CacheManager = require('../lib/cache/cache-manager');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║  Cache System Test Suite                  ║', 'blue');
  log('╚════════════════════════════════════════════╝\n', 'blue');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: L1 Memory Cache
  log('Test 1: L1 Memory Cache', 'cyan');
  try {
    const l1 = new MemoryCache({ maxSize: 10 * 1024 * 1024 }); // 10MB

    // Set
    await l1.set('test-key', 'test-value', 60);
    log('  ✓ Set işlemi başarılı', 'green');

    // Get
    const value = await l1.get('test-key');
    if (value === 'test-value') {
      log('  ✓ Get işlemi başarılı', 'green');
    } else {
      throw new Error('Get değer uyuşmazlığı');
    }

    // Delete
    await l1.delete('test-key');
    const deletedValue = await l1.get('test-key');
    if (deletedValue === null) {
      log('  ✓ Delete işlemi başarılı', 'green');
    } else {
      throw new Error('Delete başarısız');
    }

    // Stats
    const stats = l1.getStats();
    log(`  ✓ İstatistikler: ${stats.hits} hit, ${stats.misses} miss`, 'green');

    passedTests++;
  } catch (error) {
    log(`  ✗ Test başarısız: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 2: Cache Manager (L1 only)
  log('\nTest 2: Cache Manager', 'cyan');
  try {
    const cacheManager = new CacheManager({
      l1Enabled: true,
      l2Enabled: false // Redis olmadan test
    });

    // Set ve get
    await cacheManager.set('manager-test', { data: 'test' }, 30);
    const cached = await cacheManager.get('manager-test');

    if (cached && cached.data === 'test') {
      log('  ✓ Cache Manager set/get başarılı', 'green');
    } else {
      throw new Error('Cache Manager değer uyuşmazlığı');
    }

    // Health check
    const health = await cacheManager.healthCheck();
    log(`  ✓ Health check: L1=${health.l1.healthy}`, 'green');

    // Stats
    const stats = await cacheManager.getStats();
    log(`  ✓ Overall hit rate: ${stats.overall.hitRate}%`, 'green');

    await cacheManager.close();
    passedTests++;
  } catch (error) {
    log(`  ✗ Test başarısız: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 3: Cache with fetch function
  log('\nTest 3: Cache with Fetch Function', 'cyan');
  try {
    const cacheManager = new CacheManager({
      l1Enabled: true,
      l2Enabled: false
    });

    let fetchCalled = false;
    const fetchFunction = async () => {
      fetchCalled = true;
      return { data: 'fetched from source' };
    };

    // İlk çağrı - fetch'ten gelecek
    const result1 = await cacheManager.get('fetch-test', fetchFunction);
    if (!fetchCalled || !result1.data) {
      throw new Error('Fetch function çağrılmadı');
    }
    log('  ✓ İlk çağrı fetch function\'dan geldi', 'green');

    // İkinci çağrı - cache'ten gelecek
    fetchCalled = false;
    const result2 = await cacheManager.get('fetch-test', fetchFunction);
    if (fetchCalled) {
      throw new Error('Cache çalışmıyor, fetch tekrar çağrıldı');
    }
    log('  ✓ İkinci çağrı cache\'ten geldi', 'green');

    await cacheManager.close();
    passedTests++;
  } catch (error) {
    log(`  ✗ Test başarısız: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 4: Cache eviction (LRU)
  log('\nTest 4: Cache Eviction', 'cyan');
  try {
    const l1 = new MemoryCache({
      maxSize: 1024, // Çok küçük (1KB)
      defaultTTL: 300
    });

    // Büyük değerler ekle
    for (let i = 0; i < 10; i++) {
      await l1.set(`key-${i}`, 'x'.repeat(200)); // Her biri ~200 byte
    }

    const stats = l1.getStats();
    log(`  ✓ Eviction çalıştı: ${stats.keys} anahtar kaldı`, 'green');

    if (stats.keys < 10) {
      log('  ✓ LRU eviction başarılı', 'green');
    } else {
      throw new Error('Eviction çalışmadı');
    }

    passedTests++;
  } catch (error) {
    log(`  ✗ Test başarısız: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 5: TTL expiration
  log('\nTest 5: TTL Expiration', 'cyan');
  try {
    const l1 = new MemoryCache();

    // 2 saniyelik TTL
    await l1.set('ttl-test', 'will expire', 2);

    // Hemen al
    const value1 = await l1.get('ttl-test');
    if (value1 !== 'will expire') {
      throw new Error('TTL değer okunamadı');
    }
    log('  ✓ TTL değer set edildi', 'green');

    // 3 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Expire olmalı
    const value2 = await l1.get('ttl-test');
    if (value2 === null) {
      log('  ✓ TTL expiration çalıştı', 'green');
    } else {
      throw new Error('TTL expiration çalışmadı');
    }

    passedTests++;
  } catch (error) {
    log(`  ✗ Test başarısız: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 6: Multiple keys (mget/mset)
  log('\nTest 6: Multiple Keys', 'cyan');
  try {
    const l1 = new MemoryCache();

    // mset
    await l1.mset({
      'multi-1': 'value-1',
      'multi-2': 'value-2',
      'multi-3': 'value-3'
    }, 60);
    log('  ✓ mset başarılı', 'green');

    // mget
    const values = await l1.mget(['multi-1', 'multi-2', 'multi-3']);
    if (Object.keys(values).length === 3) {
      log('  ✓ mget başarılı (3 değer)', 'green');
    } else {
      throw new Error('mget eksik değer döndü');
    }

    passedTests++;
  } catch (error) {
    log(`  ✗ Test başarısız: ${error.message}`, 'red');
    failedTests++;
  }

  // Summary
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║  Test Özeti                                ║', 'blue');
  log('╚════════════════════════════════════════════╝\n', 'blue');

  const totalTests = passedTests + failedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  log(`Toplam Test: ${totalTests}`, 'cyan');
  log(`Başarılı: ${passedTests}`, 'green');
  log(`Başarısız: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Başarı Oranı: ${successRate}%\n`, successRate >= 90 ? 'green' : 'yellow');

  if (failedTests === 0) {
    log('╔════════════════════════════════════════════╗', 'green');
    log('║  ✅ TÜM TESTLER BAŞARILI                   ║', 'green');
    log('║  Cache Sistemi Kullanıma Hazır            ║', 'green');
    log('╚════════════════════════════════════════════╝\n', 'green');
    process.exit(0);
  } else {
    log('╔════════════════════════════════════════════╗', 'red');
    log('║  ✗ BAZI TESTLER BAŞARISIZ                  ║', 'red');
    log('║  Hataları gözden geçirin                   ║', 'red');
    log('╚════════════════════════════════════════════╝\n', 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
