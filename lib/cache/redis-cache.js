/**
 * Redis Cache - Simple in-memory fallback with Class interface
 */

class RedisCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.keyPrefix = options.keyPrefix || '';
    this.enabled = true;
    console.log(`✅ Redis cache initialized (in-memory fallback) with prefix: ${this.keyPrefix}`);
  }

  async get(key) {
    const fullKey = this.keyPrefix + key;
    return this.cache.get(fullKey) || null;
  }

  async set(key, value, ttl = 3600) {
    const fullKey = this.keyPrefix + key;
    this.cache.set(fullKey, value);
    setTimeout(() => this.cache.delete(fullKey), ttl * 1000);
    return true;
  }

  async del(key) {
    const fullKey = this.keyPrefix + key;
    this.cache.delete(fullKey);
    return true;
  }

  async getStats() {
    return {
      enabled: this.enabled,
      keys: this.cache.size,
      mode: 'in-memory',
      message: 'Using in-memory cache (Redis not connected)'
    };
  }
}

// Export both class and legacy functions for compatibility
module.exports = RedisCache;

// Also export legacy functions for backward compatibility
module.exports.cacheGet = async function(key) {
  const cache = new Map();
  return cache.get(key) || null;
};

module.exports.cacheSet = async function(key, value, ttl = 3600) {
  const cache = new Map();
  cache.set(key, value);
  setTimeout(() => cache.delete(key), ttl * 1000);
  return true;
};

module.exports.cacheDel = async function(key) {
  const cache = new Map();
  cache.delete(key);
  return true;
};
