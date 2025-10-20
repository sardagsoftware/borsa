/**
 * Query Optimization Analyzer
 * Yavaş query'leri tespit et ve optimize et
 */

const { getPool } = require('../lib/db/connection-pool');

class QueryAnalyzer {
  constructor() {
    this.pool = getPool();
    this.slowQueryThreshold = 100; // 100ms
  }

  async analyzeQuery(sql, params = []) {
    const db = await this.pool.acquire();

    try {
      // Query plan al
      const plan = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params);

      // Timing
      const start = Date.now();
      db.prepare(sql).all(...params);
      const duration = Date.now() - start;

      await this.pool.release(db);

      return {
        sql: sql,
        duration: duration,
        slow: duration > this.slowQueryThreshold,
        plan: plan,
        recommendation: this.getRecommendation(plan, duration)
      };

    } catch (error) {
      await this.pool.release(db);
      throw error;
    }
  }

  getRecommendation(plan, duration) {
    const recommendations = [];

    // SCAN tespit et (index yok)
    const hasTableScan = plan.some(p => p.detail && p.detail.includes('SCAN TABLE'));
    if (hasTableScan) {
      recommendations.push('⚠️ Table SCAN tespit edildi. Index eklemeyi düşünün.');
    }

    // Yavaş query
    if (duration > this.slowQueryThreshold) {
      recommendations.push(`⚠️ Query yavaş: ${duration}ms (hedef: <${this.slowQueryThreshold}ms)`);
    }

    // Optimize edilmiş
    if (recommendations.length === 0) {
      recommendations.push('✅ Query optimize edilmiş görünüyor.');
    }

    return recommendations;
  }

  async suggestIndexes() {
    const db = await this.pool.acquire();

    try {
      // Mevcut index'leri al
      const indexes = db.prepare(`
        SELECT name, tbl_name, sql 
        FROM sqlite_master 
        WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
      `).all();

      await this.pool.release(db);

      console.log('
📊 Mevcut Index\'ler:');
      console.log('═══════════════════════════════════════');
      indexes.forEach(idx => {
        console.log(`✓ ${idx.name} (table: ${idx.tbl_name})`);
      });

      return indexes;

    } catch (error) {
      await this.pool.release(db);
      throw error;
    }
  }
}

// CLI kullanımı
if (require.main === module) {
  const analyzer = new QueryAnalyzer();

  // Test query'leri
  const testQueries = [
    { 
      sql: 'SELECT * FROM users WHERE email = ?',
      params: ['test@example.com'],
      name: 'User by email'
    },
    {
      sql: 'SELECT * FROM sessions WHERE userId = ? AND expiresAt > ?',
      params: [1, new Date().toISOString()],
      name: 'Active sessions'
    },
    {
      sql: 'SELECT * FROM activity_log WHERE userId = ? ORDER BY createdAt DESC LIMIT 10',
      params: [1],
      name: 'Recent activity'
    }
  ];

  console.log('
🔍 Query Optimization Analysis
');
  console.log('═══════════════════════════════════════
');

  Promise.all(testQueries.map(async (q) => {
    try {
      console.log(`Test: ${q.name}`);
      const result = await analyzer.analyzeQuery(q.sql, q.params);
      console.log(`  Duration: ${result.duration}ms`);
      result.recommendation.forEach(r => console.log(`  ${r}`));
      console.log('');
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}
`);
    }
  }))
  .then(() => analyzer.suggestIndexes())
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = QueryAnalyzer;
