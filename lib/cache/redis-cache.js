/**
 * L2 Redis Cache Implementation
 * Distributed caching with Redis (Upstash)
 */

const { Redis } = require('@upstash/redis');

class RedisCache {
  constructor(options = {}) {
    this.redis = options.client || new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN
    });

    this.defaultTTL = options.defaultTTL || 3600;
    this.keyPrefix = options.keyPrefix || 'ailydian:';

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  getKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  async get(key) {
    try {
      const fullKey = this.getKey(key);
      const value = await this.redis.get(fullKey);

      if (value !== null) {
        this.stats.hits++;
        return this.deserialize(value);
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const fullKey = this.getKey(key);
      const serialized = this.serialize(value);
      const expiresIn = ttl || this.defaultTTL;

      await this.redis.setex(fullKey, expiresIn, serialized);

      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      const fullKey = this.getKey(key);
      const result = await this.redis.del(fullKey);

      this.stats.deletes++;
      return result > 0;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async has(key) {
    try {
      const fullKey = this.getKey(key);
      const exists = await this.redis.exists(fullKey);
      return exists === 1;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: parseFloat(hitRate)
    };
  }

  serialize(value) {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }

  deserialize(value) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async ping() {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping error:', error);
      return false;
    }
  }

  async close() {
    return true;
  }
}

module.exports = RedisCache;
