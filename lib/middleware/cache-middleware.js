/**
 * Cache Middleware for Vercel Serverless Functions
 * Provides caching layer for API responses
 */

const { Redis } = require('@upstash/redis');

// Initialize Redis client (singleton)
let redisClient = null;

function getRedisClient() {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn('[Cache] Redis not configured - caching disabled');
      return null;
    }

    redisClient = new Redis({
      url,
      token,
      automaticDeserialization: true,
    });
  }
  return redisClient;
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req, prefix = 'api') {
  const url = req.url || '/';
  const method = req.method || 'GET';
  const query = new URLSearchParams(req.query || {}).toString();

  const key = query ? `${prefix}:${method}:${url}?${query}` : `${prefix}:${method}:${url}`;
  return key;
}

/**
 * Cache Middleware Factory
 *
 * @param {Object} options - Cache configuration
 * @param {number} options.ttl - Time to live in seconds (default: 300)
 * @param {string} options.keyPrefix - Cache key prefix (default: 'api')
 * @param {Function} options.keyGenerator - Custom key generator function
 * @param {boolean} options.debug - Enable debug logging (default: false)
 * @param {Function} options.shouldCache - Function to determine if response should be cached
 *
 * @returns {Function} Middleware function
 */
function withCache(options = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'api',
    keyGenerator = null,
    debug = false,
    shouldCache = (statusCode) => statusCode === 200,
  } = options;

  return async function cacheMiddleware(handler) {
    return async (req, res) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        if (debug) console.log('[Cache] Skipping non-GET request');
        return handler(req, res);
      }

      const redis = getRedisClient();

      // If Redis not available, skip caching
      if (!redis) {
        return handler(req, res);
      }

      try {
        // Generate cache key
        const cacheKey = keyGenerator
          ? keyGenerator(req)
          : generateCacheKey(req, keyPrefix);

        if (debug) console.log(`[Cache] Checking key: ${cacheKey}`);

        // Try to get from cache
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
          if (debug) console.log(`[Cache] HIT: ${cacheKey}`);

          // Add cache headers
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-Key', cacheKey);

          return res.status(200).json(cachedData);
        }

        if (debug) console.log(`[Cache] MISS: ${cacheKey}`);

        // Cache miss - intercept response
        const originalJson = res.json.bind(res);
        const originalStatus = res.status.bind(res);

        let statusCode = 200;
        let interceptedData = null;

        // Override res.status to capture status code
        res.status = function(code) {
          statusCode = code;
          return originalStatus(code);
        };

        // Override res.json to capture data
        res.json = async function(data) {
          interceptedData = data;

          // Should we cache this response?
          if (shouldCache(statusCode)) {
            try {
              await redis.setex(cacheKey, ttl, data);
              if (debug) console.log(`[Cache] STORED: ${cacheKey} (TTL: ${ttl}s)`);
              res.setHeader('X-Cache', 'MISS');
              res.setHeader('X-Cache-Key', cacheKey);
            } catch (cacheError) {
              console.error('[Cache] Failed to store:', cacheError.message);
            }
          } else {
            if (debug) console.log(`[Cache] NOT CACHED: ${cacheKey} (status: ${statusCode})`);
            res.setHeader('X-Cache', 'SKIP');
          }

          return originalJson(data);
        };

        // Execute handler
        return handler(req, res);

      } catch (error) {
        console.error('[Cache] Error:', error.message);
        // On error, fall back to handler without caching
        return handler(req, res);
      }
    };
  };
}

/**
 * Simple cache wrapper for serverless functions
 *
 * @param {Function} handler - The serverless function handler
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Wrapped handler
 */
async function cachedHandler(handler, ttl = 300) {
  const middleware = withCache({ ttl, debug: process.env.NODE_ENV !== 'production' });
  return middleware(handler);
}

/**
 * Invalidate cache by key pattern
 */
async function invalidateCache(pattern) {
  const redis = getRedisClient();
  if (!redis) {
    console.warn('[Cache] Redis not configured - cannot invalidate');
    return 0;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    await redis.del(...keys);
    console.log(`[Cache] Invalidated ${keys.length} keys matching: ${pattern}`);
    return keys.length;
  } catch (error) {
    console.error('[Cache] Invalidation error:', error.message);
    return 0;
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const redis = getRedisClient();
  if (!redis) {
    return { enabled: false, error: 'Redis not configured' };
  }

  try {
    const ping = await redis.ping();
    const dbsize = await redis.dbsize();

    return {
      enabled: true,
      healthy: ping === 'PONG',
      totalKeys: dbsize,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      enabled: true,
      healthy: false,
      error: error.message,
    };
  }
}

module.exports = {
  withCache,
  cachedHandler,
  invalidateCache,
  getCacheStats,
  generateCacheKey,
  getRedisClient,
};
