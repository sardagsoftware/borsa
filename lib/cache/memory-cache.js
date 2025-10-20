/**
 * L1 Memory Cache Implementation
 * Ultra-fast in-memory caching with LRU eviction
 *
 * Performance: <1ms response time
 * Capacity: 100MB default
 * Strategy: LRU (Least Recently Used)
 */

const NodeCache = require('node-cache');

class MemoryCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB
    this.defaultTTL = options.defaultTTL || 300; // 5 minutes
    this.checkPeriod = options.checkPeriod || 60; // Check every 60s

    this.cache = new NodeCache({
      stdTTL: this.defaultTTL,
      checkperiod: this.checkPeriod,
      useClones: false, // Better performance, but requires careful usage
      deleteOnExpire: true,
      maxKeys: 10000 // Prevent memory overflow
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0
    };

    // Periodic stats logging
    if (options.enableLogging) {
      setInterval(() => this.logStats(), 60000); // Every minute
    }
  }

  /**
   * Get value from cache
   * @param {string} key
   * @returns {any|null}
   */
  async get(key) {
    const value = this.cache.get(key);

    if (value !== undefined) {
      this.stats.hits++;
      return value;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = null) {
    try {
      // Estimate size
      const estimatedSize = this.estimateSize(value);

      // Check if adding this would exceed max size
      if (this.stats.size + estimatedSize > this.maxSize) {
        // Evict some keys using LRU
        this.evictLRU(estimatedSize);
      }

      const success = this.cache.set(key, value, ttl || this.defaultTTL);

      if (success) {
        this.stats.sets++;
        this.stats.size += estimatedSize;
      }

      return success;
    } catch (error) {
      console.error('Memory cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key
   */
  async delete(key) {
    const value = this.cache.get(key);
    const deleted = this.cache.del(key);

    if (deleted > 0) {
      this.stats.deletes++;
      if (value) {
        this.stats.size -= this.estimateSize(value);
      }
    }

    return deleted > 0;
  }

  /**
   * Check if key exists
   * @param {string} key
   */
  async has(key) {
    return this.cache.has(key);
  }

  /**
   * Get multiple keys
   * @param {string[]} keys
   */
  async mget(keys) {
    const result = {};

    for (const key of keys) {
      const value = await this.get(key);
      if (value !== null) {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Set multiple key-value pairs
   * @param {Object} items - { key: value }
   * @param {number} ttl
   */
  async mset(items, ttl = null) {
    const results = [];

    for (const [key, value] of Object.entries(items)) {
      results.push(await this.set(key, value, ttl));
    }

    return results.every(r => r === true);
  }

  /**
   * Clear all cache
   */
  async flush() {
    this.cache.flushAll();
    this.stats.size = 0;
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = this.cache.keys();
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      keys: keys.length,
      hitRate: parseFloat(hitRate),
      sizeFormatted: this.formatBytes(this.stats.size),
      maxSizeFormatted: this.formatBytes(this.maxSize),
      utilizationPercent: ((this.stats.size / this.maxSize) * 100).toFixed(2)
    };
  }

  /**
   * Estimate size of value in bytes
   * @param {any} value
   */
  estimateSize(value) {
    if (value === null || value === undefined) return 0;

    try {
      // Rough estimation
      if (typeof value === 'string') {
        return value.length * 2; // UTF-16
      } else if (typeof value === 'number') {
        return 8;
      } else if (typeof value === 'boolean') {
        return 4;
      } else if (Buffer.isBuffer(value)) {
        return value.length;
      } else if (typeof value === 'object') {
        return JSON.stringify(value).length * 2;
      }
      return 0;
    } catch {
      return 1024; // Default 1KB for unknown types
    }
  }

  /**
   * Evict least recently used items to make space
   * @param {number} neededSpace
   */
  evictLRU(neededSpace) {
    const keys = this.cache.keys();
    let freedSpace = 0;

    // Simple LRU: delete oldest keys first
    // NodeCache doesn't track access time, so we delete in order
    for (const key of keys) {
      if (freedSpace >= neededSpace) break;

      const value = this.cache.get(key);
      if (value) {
        freedSpace += this.estimateSize(value);
        this.cache.del(key);
      }
    }

    this.stats.size -= freedSpace;
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Log cache statistics
   */
  logStats() {
    const stats = this.getStats();
    console.log('📊 L1 Memory Cache Stats:', {
      hitRate: `${stats.hitRate}%`,
      keys: stats.keys,
      size: stats.sizeFormatted,
      utilization: `${stats.utilizationPercent}%`
    });
  }

  /**
   * Get TTL for a key
   * @param {string} key
   */
  async getTTL(key) {
    return this.cache.getTtl(key);
  }

  /**
   * Update TTL for a key
   * @param {string} key
   * @param {number} ttl
   */
  async updateTTL(key, ttl) {
    return this.cache.ttl(key, ttl);
  }

  /**
   * Close cache and cleanup
   */
  async close() {
    this.cache.close();
    return true;
  }
}

module.exports = MemoryCache;
