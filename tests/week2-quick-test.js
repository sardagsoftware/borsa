/**
 * Phase 2 Week 2 Quick Test
 */

const ConnectionPool = require('../lib/db/connection-pool');
const BatchProcessor = require('../lib/batch/batch-processor');

console.log('\n╔════════════════════════════════════════════╗');
console.log('║  Phase 2 Week 2 Quick Test                ║');
console.log('╚════════════════════════════════════════════╝\n');

async function test() {
  let passed = 0;
  let failed = 0;

  // Test 1: Connection Pool
  console.log('Test 1: Connection Pool');
  try {
    const pool = new ConnectionPool({ minConnections: 2, maxConnections: 5 });
    const db = await pool.acquire();
    const result = db.prepare('SELECT 1 as test').get();
    await pool.release(db);
    
    if (result.test === 1) {
      console.log('  ✓ Connection pool çalışıyor');
      passed++;
    }
    
    await pool.close();
  } catch (error) {
    console.log('  ✗ Başarısız:', error.message);
    failed++;
  }

  // Test 2: Batch Processor
  console.log('\nTest 2: Batch Processor');
  try {
    const processor = new BatchProcessor({ batchSize: 10 });
    const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
    const batches = processor.createBatches(items);
    
    if (batches.length === 3) {
      console.log('  ✓ Batch processor çalışıyor (25 item = 3 batch)');
      passed++;
    }
  } catch (error) {
    console.log('  ✗ Başarısız:', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(44));
  console.log(`Toplam: ${passed + failed}, Başarılı: ${passed}, Başarısız: ${failed}`);
  
  if (failed === 0) {
    console.log('\n✅ TÜM TESTLER BAŞARILI\n');
    process.exit(0);
  } else {
    console.log('\n❌ BAZI TESTLER BAŞARISIZ\n');
    process.exit(1);
  }
}

test().catch(error => {
  console.error('\n❌ Test hatası:', error.message);
  process.exit(1);
});
