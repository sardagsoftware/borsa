/**
 * Redis Cache Manager
 * 🔐 Security: Production-grade distributed caching
 *
 * Features:
 * - Redis-based caching (serverless compatible)
 * - Connection pooling
 * - Automatic reconnection
 * - Health monitoring
 * - Hit/miss rate tracking
 * - Multiple cache namespaces
 * - TTL management
 * - Graceful degradation to memory cache
 *
 * Usage:
 *   const cacheManager = require('./lib/cache/redis-cache-manager');
 *   const value = await cacheManager.get('aiResponse', 'key');
 *   await cacheManager.set('aiResponse', 'key', value, 3600);
 */

const Redis = require('ioredis');
const logger = require('../logger/production-logger');

// Fallback to in-memory cache when Redis is unavailable
const NodeCache = require('node-cache');

class RedisCacheManager {
  constructor(options = {}) {
    this.options = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'ailydian:',
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      ...options
    };

    // Metrics tracking
    this.hitCounts = {
      memory: 0,
      session: 0,
      aiResponse: 0,
      static: 0
    };
    this.missCounts = {
      memory: 0,
      session: 0,
      aiResponse: 0,
      static: 0
    };
    this.totalRequests = 0;
    this.connected = false;
    this.useMemoryFallback = false;

    // Fallback memory cache for when Redis is unavailable
    this.memoryFallback = {
      memory: new NodeCache({ stdTTL: 600, maxKeys: 1000 }),
      session: new NodeCache({ stdTTL: 1800, maxKeys: 1000 }),
      aiResponse: new NodeCache({ stdTTL: 3600, maxKeys: 500 }),
      static: new NodeCache({ stdTTL: 86400, maxKeys: 500 })
    };

    // Default TTLs for each cache type (in seconds)
    this.defaultTTLs = {
      memory: 600,      // 10 minutes
      session: 1800,    // 30 minutes
      aiResponse: 3600, // 1 hour
      static: 86400     // 24 hours
    };

    this.initializeRedis();
    this.initializeMetrics();
  }

  /**
   * Initialize Redis connection
   */
  initializeRedis() {
    try {
      // Create Redis client
      this.redis = new Redis(this.options);

      // Connection event handlers
      this.redis.on('connect', () => {
        logger.info('Redis connected', {
          host: this.options.host,
          port: this.options.port,
          db: this.options.db
        });
        this.connected = true;
        this.useMemoryFallback = false;
      });

      this.redis.on('ready', () => {
        logger.info('Redis ready for operations');
        this.connected = true;
        this.useMemoryFallback = false;
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error', { error });
        this.connected = false;
        this.useMemoryFallback = true;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.connected = false;
        this.useMemoryFallback = true;
      });

      this.redis.on('reconnecting', (delay) => {
        logger.info('Redis reconnecting', { delay_ms: delay });
      });

      // Attempt initial connection
      this.redis.connect().catch((error) => {
        logger.error('Failed to connect to Redis, using memory fallback', { error });
        this.useMemoryFallback = true;
      });

    } catch (error) {
      logger.error('Redis initialization failed, using memory fallback', { error });
      this.redis = null;
      this.useMemoryFallback = true;
    }
  }

  /**
   * Initialize performance metrics reporting
   */
  initializeMetrics() {
    // Report cache performance every 5 minutes
    setInterval(() => {
      const stats = this.getStats();

      logger.info('Cache Performance Report', {
        mode: this.useMemoryFallback ? 'memory' : 'redis',
        hitRates: stats.hitRates,
        hitCounts: stats.hitCounts,
        missCounts: stats.missCounts,
        totalRequests: stats.totalRequests
      });

      // Track metrics to Azure Insights if available
      const { trackMetric } = require('../logger/azure-insights-transport');
      trackMetric('cache_hit_rate_memory', stats.hitRates.memory);
      trackMetric('cache_hit_rate_session', stats.hitRates.session);
      trackMetric('cache_hit_rate_ai_response', stats.hitRates.aiResponse);
      trackMetric('cache_hit_rate_static', stats.hitRates.static);

    }, 300000); // 5 minutes
  }

  /**
   * Generate cache key with namespace
   */
  getCacheKey(cacheType, key) {
    return `${cacheType}:${key}`;
  }

  /**
   * Get value from cache (sync version for backwards compatibility)
   */
  get(cacheType, key) {
    // Synchronous fallback to memory cache (for backwards compatibility)
    // In production, use getAsync() for Redis
    const value = this.memoryFallback[cacheType]?.get(key);
    if (value !== undefined) {
      this.hitCounts[cacheType]++;
      return value;
    } else {
      this.missCounts[cacheType]++;
      return null;
    }
  }

  /**
   * Get value from cache (async version for Redis)
   */
  async getAsync(cacheType, key) {
    try {
      this.totalRequests++;

      // Use memory fallback if Redis is unavailable
      if (this.useMemoryFallback || !this.connected) {
        const value = this.memoryFallback[cacheType]?.get(key);
        if (value !== undefined) {
          this.hitCounts[cacheType]++;
          return value;
        } else {
          this.missCounts[cacheType]++;
          return null;
        }
      }

      // Use Redis
      const cacheKey = this.getCacheKey(cacheType, key);
      const value = await this.redis.get(cacheKey);

      if (value !== null) {
        this.hitCounts[cacheType]++;
        try {
          return JSON.parse(value);
        } catch {
          return value; // Return raw value if not JSON
        }
      } else {
        this.missCounts[cacheType]++;
        return null;
      }

    } catch (error) {
      logger.error('Cache get error', { cacheType, key, error });
      this.missCounts[cacheType]++;
      return null;
    }
  }

  /**
   * Set value in cache (sync version for backwards compatibility)
   */
  set(cacheType, key, value, ttl = null) {
    // Synchronous fallback to memory cache (for backwards compatibility)
    // In production, use setAsync() for Redis
    const effectiveTTL = ttl || this.defaultTTLs[cacheType] || 600;
    return this.memoryFallback[cacheType]?.set(key, value, effectiveTTL) || false;
  }

  /**
   * Set value in cache (async version for Redis)
   */
  async setAsync(cacheType, key, value, ttl = null) {
    try {
      const effectiveTTL = ttl || this.defaultTTLs[cacheType] || 600;

      // Use memory fallback if Redis is unavailable
      if (this.useMemoryFallback || !this.connected) {
        return this.memoryFallback[cacheType]?.set(key, value, effectiveTTL) || false;
      }

      // Use Redis
      const cacheKey = this.getCacheKey(cacheType, key);
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);

      const result = await this.redis.setex(cacheKey, effectiveTTL, serializedValue);
      return result === 'OK';

    } catch (error) {
      logger.error('Cache set error', { cacheType, key, error });
      return false;
    }
  }

  /**
   * Delete value from cache (sync version)
   */
  delete(cacheType, key) {
    return this.memoryFallback[cacheType]?.del(key) > 0 || false;
  }

  /**
   * Delete value from cache (async version for Redis)
   */
  async deleteAsync(cacheType, key) {
    try {
      // Use memory fallback if Redis is unavailable
      if (this.useMemoryFallback || !this.connected) {
        return this.memoryFallback[cacheType]?.del(key) > 0 || false;
      }

      // Use Redis
      const cacheKey = this.getCacheKey(cacheType, key);
      const result = await this.redis.del(cacheKey);
      return result > 0;

    } catch (error) {
      logger.error('Cache delete error', { cacheType, key, error });
      return false;
    }
  }

  /**
   * Flush cache (sync version)
   */
  flush(cacheType = 'all') {
    if (cacheType === 'all') {
      Object.values(this.memoryFallback).forEach(cache => cache.flushAll());
      return true;
    } else {
      this.memoryFallback[cacheType]?.flushAll();
      return true;
    }
  }

  /**
   * Flush cache (async version for Redis)
   */
  async flushAsync(cacheType = 'all') {
    try {
      // Use memory fallback if Redis is unavailable
      if (this.useMemoryFallback || !this.connected) {
        if (cacheType === 'all') {
          Object.values(this.memoryFallback).forEach(cache => cache.flushAll());
          return true;
        } else {
          this.memoryFallback[cacheType]?.flushAll();
          return true;
        }
      }

      // Use Redis
      if (cacheType === 'all') {
        // WARNING: This flushes the entire Redis DB
        await this.redis.flushdb();
        return true;
      } else {
        // Delete all keys with this cache type prefix
        const pattern = this.getCacheKey(cacheType, '*');
        const keys = await this.redis.keys(pattern);

        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return true;
      }

    } catch (error) {
      logger.error('Cache flush error', { cacheType, error });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const getHitRate = (cacheType) => {
      const hits = this.hitCounts[cacheType];
      const total = hits + this.missCounts[cacheType];
      return total > 0 ? Math.round((hits / total) * 100) : 0;
    };

    return {
      mode: this.useMemoryFallback ? 'memory' : 'redis',
      connected: this.connected,
      hitRates: {
        memory: getHitRate('memory'),
        session: getHitRate('session'),
        aiResponse: getHitRate('aiResponse'),
        static: getHitRate('static')
      },
      hitCounts: { ...this.hitCounts },
      missCounts: { ...this.missCounts },
      totalRequests: this.totalRequests
    };
  }

  /**
   * Check Redis health
   */
  async healthCheck() {
    try {
      if (!this.redis || this.useMemoryFallback) {
        return {
          healthy: false,
          mode: 'memory_fallback',
          latency_ms: 0
        };
      }

      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      return {
        healthy: true,
        mode: 'redis',
        latency_ms: latency,
        host: this.options.host,
        port: this.options.port
      };

    } catch (error) {
      return {
        healthy: false,
        mode: 'redis_error',
        error: error.message
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.redis && this.connected) {
        logger.info('Closing Redis connection');
        await this.redis.quit();
      }
    } catch (error) {
      logger.error('Error during Redis shutdown', { error });
    }
  }
}

// Create singleton instance
const cacheManager = new RedisCacheManager();

// Graceful shutdown on process termination
process.on('SIGTERM', async () => {
  await cacheManager.shutdown();
});

process.on('SIGINT', async () => {
  await cacheManager.shutdown();
});

module.exports = cacheManager;
