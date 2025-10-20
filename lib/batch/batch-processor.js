/**
 * Batch Processing System
 */

const { getPool } = require('../db/connection-pool');

class BatchProcessor {
  constructor(options = {}) {
    this.pool = getPool();
    this.batchSize = options.batchSize || 100;
    this.parallelBatches = options.parallelBatches || 3;
  }

  async batchInsert(tableName, items, columns) {
    const batches = this.createBatches(items);
    const results = { total: items.length, successful: 0, failed: 0, errors: [], duration: 0 };
    const startTime = Date.now();

    try {
      for (let i = 0; i < batches.length; i += this.parallelBatches) {
        const parallelBatches = batches.slice(i, i + this.parallelBatches);
        const promises = parallelBatches.map(batch => 
          this.insertBatch(tableName, batch, columns).catch(error => ({ error, batch }))
        );
        const batchResults = await Promise.all(promises);
        batchResults.forEach(result => {
          if (result.error) {
            results.failed += result.batch.length;
            results.errors.push({ batch: result.batch, error: result.error.message });
          } else {
            results.successful += result.inserted;
          }
        });
      }
      results.duration = Date.now() - startTime;
      return results;
    } catch (error) {
      results.errors.push({ error: error.message });
      results.duration = Date.now() - startTime;
      return results;
    }
  }

  async insertBatch(tableName, items, columns) {
    return await this.pool.withTransaction(async (db) => {
      const placeholders = columns.map(() => '?').join(',');
      const columnNames = columns.join(',');
      const sql = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`;
      const stmt = db.prepare(sql);
      let inserted = 0;
      for (const item of items) {
        const values = columns.map(col => item[col]);
        stmt.run(...values);
        inserted++;
      }
      return { inserted };
    });
  }

  createBatches(items) {
    const batches = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }
    return batches;
  }

  async batchWithProgress(operation, items, onProgress) {
    const batches = this.createBatches(items);
    const totalBatches = batches.length;
    let completedBatches = 0;
    const results = { total: items.length, successful: 0, failed: 0, errors: [] };

    for (const batch of batches) {
      try {
        await operation(batch);
        results.successful += batch.length;
      } catch (error) {
        results.failed += batch.length;
        results.errors.push(error);
      }
      completedBatches++;
      if (onProgress) {
        onProgress({
          completed: completedBatches,
          total: totalBatches,
          percent: ((completedBatches / totalBatches) * 100).toFixed(2),
          processed: results.successful + results.failed,
          totalItems: items.length
        });
      }
    }
    return results;
  }
}

module.exports = BatchProcessor;
