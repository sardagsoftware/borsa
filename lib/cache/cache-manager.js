/**
 * Cache Manager - Multi-tier Cache Orchestrator
 * L1: Memory (node-cache) <1ms
 * L2: Redis (Upstash) <10ms  
 * L3: Source (Database/API)
 */

const MemoryCache = require('./memory-cache');
const RedisCache = require('./redis-cache');

class CacheManager {
  constructor(options = {}) {
    this.l1Enabled = options.l1Enabled !== false;
    this.l2Enabled = options.l2Enabled !== false;

    // Initialize L1 (Memory Cache)
    this.l1 = this.l1Enabled ? new MemoryCache({
      maxSize: options.l1MaxSize || 100 * 1024 * 1024, // 100MB
      defaultTTL: options.l1TTL || 300, // 5 dakika
      enableLogging: options.enableLogging || false
    }) : null;

    // Initialize L2 (Redis Cache)
    this.l2 = this.l2Enabled ? new RedisCache({
      defaultTTL: options.l2TTL || 3600, // 1 saat
      keyPrefix: options.keyPrefix || 'ailydian:'
    }) : null;

    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      totalRequests: 0
    };
  }

  /**
   * Get value from cache (L1 → L2 → L3)
   */
  async get(key, fetchFunction = null) {
    this.stats.totalRequests++;

    // L1: Memory cache check
    if (this.l1) {
      const l1Value = await this.l1.get(key);
      if (l1Value !== null) {
        this.stats.l1Hits++;
        return l1Value;
      }
    }

    // L2: Redis cache check
    if (this.l2) {
      const l2Value = await this.l2.get(key);
      if (l2Value !== null) {
        this.stats.l2Hits++;
        
        // Populate L1 for faster access
        if (this.l1) {
          await this.l1.set(key, l2Value);
        }
        
        return l2Value;
      }
    }

    // L3: Fetch from source
    if (fetchFunction && typeof fetchFunction === 'function') {
      this.stats.l3Hits++;
      const sourceValue = await fetchFunction();
      
      if (sourceValue !== null && sourceValue !== undefined) {
        // Populate both cache levels
        await this.set(key, sourceValue);
      }
      
      return sourceValue;
    }

    return null;
  }

  /**
   * Set value in all cache levels
   */
  async set(key, value, ttl = null) {
    const results = [];

    // L1: Memory cache
    if (this.l1) {
      results.push(await this.l1.set(key, value, ttl));
    }

    // L2: Redis cache
    if (this.l2) {
      results.push(await this.l2.set(key, value, ttl));
    }

    return results.every(r => r === true);
  }

  /**
   * Delete from all cache levels
   */
  async delete(key) {
    const results = [];

    if (this.l1) {
      results.push(await this.l1.delete(key));
    }

    if (this.l2) {
      results.push(await this.l2.delete(key));
    }

    return results.some(r => r === true);
  }

  /**
   * Check if key exists in any cache level
   */
  async has(key) {
    if (this.l1 && await this.l1.has(key)) return true;
    if (this.l2 && await this.l2.has(key)) return true;
    return false;
  }

  /**
   * Get comprehensive cache statistics
   */
  async getStats() {
    const l1Stats = this.l1 ? this.l1.getStats() : null;
    const l2Stats = this.l2 ? await this.l2.getStats() : null;

    const totalHits = this.stats.l1Hits + this.stats.l2Hits;
    const overallHitRate = this.stats.totalRequests > 0
      ? ((totalHits / this.stats.totalRequests) * 100).toFixed(2)
      : 0;

    return {
      overall: {
        totalRequests: this.stats.totalRequests,
        l1Hits: this.stats.l1Hits,
        l2Hits: this.stats.l2Hits,
        l3Hits: this.stats.l3Hits,
        cacheHits: totalHits,
        hitRate: parseFloat(overallHitRate)
      },
      l1: l1Stats,
      l2: l2Stats
    };
  }

  /**
   * Flush all cache levels
   */
  async flush() {
    const results = [];

    if (this.l1) {
      results.push(await this.l1.flush());
    }

    if (this.l2) {
      results.push(await this.l2.flush());
    }

    // Reset stats
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      totalRequests: 0
    };

    return results.every(r => r === true);
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warm(keys, fetchFunction) {
    const results = [];

    for (const key of keys) {
      try {
        const value = await fetchFunction(key);
        if (value !== null) {
          await this.set(key, value);
          results.push({ key, success: true });
        }
      } catch (error) {
        results.push({ key, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const health = {
      l1: { healthy: false },
      l2: { healthy: false }
    };

    // L1 health
    if (this.l1) {
      try {
        await this.l1.set('__health__', 'ok', 10);
        const value = await this.l1.get('__health__');
        health.l1.healthy = value === 'ok';
        await this.l1.delete('__health__');
      } catch (error) {
        health.l1.error = error.message;
      }
    }

    // L2 health
    if (this.l2) {
      try {
        health.l2.healthy = await this.l2.ping();
      } catch (error) {
        health.l2.error = error.message;
      }
    }

    return health;
  }

  /**
   * Close all cache connections
   */
  async close() {
    if (this.l1) await this.l1.close();
    if (this.l2) await this.l2.close();
  }
}

module.exports = CacheManager;
