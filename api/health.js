/**
 * Vercel Serverless Health Check API
 * Minimal, fast health endpoint
 * ⚡ CACHED: 10 seconds TTL
 */

const { handleCORS } = require('../security/cors-config');

// Initialize Redis (singleton pattern) - OPTIONAL
let redisCache = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = require('@upstash/redis');
    redisCache = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      automaticDeserialization: true,
    });
  }
} catch (err) {
  console.warn('Redis not available, caching disabled:', err.message);
}

module.exports = async (req, res) => {
  // 🔒 SECURE CORS - Whitelist-based, NO WILDCARD
  if (handleCORS(req, res)) return; // Handle OPTIONS preflight

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cacheKey = 'api:health:vercel';
  const cacheTTL = 10; // 10 seconds

  try {
    // Try Redis cache first
    if (redisCache) {
      try {
        const cached = await redisCache.get(cacheKey);
        if (cached) {
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-Key', cacheKey);
          return res.status(200).json(cached);
        }
      } catch (cacheError) {
        console.error('[Cache Error]', cacheError);
      }
    }

    // Cache MISS - generate response
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'production',
      platform: 'vercel-serverless',
      models_count: 23,
      features: {
        chat: true,
        translation: true,
        multimodel: true,
        i18n: true
      }
    };

    // Store in Redis cache
    if (redisCache) {
      try {
        await redisCache.setex(cacheKey, cacheTTL, response);
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
      } catch (cacheError) {
        console.error('[Cache Error]', cacheError);
      }
    }

    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    res.status(200).json(response);
  } catch (error) {
    console.error('Health check error:', error);
    // Still return 200 if just cache failed
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'production',
      platform: 'vercel-serverless',
      cache: 'disabled',
      error: error.message
    });
  }
};
