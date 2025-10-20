/**
 * Cache Statistics API
 * GET /api/cache/stats
 */

const CacheManager = require('../../lib/cache/cache-manager');

// Global cache instance
let globalCache = null;

function getCacheInstance() {
  if (!globalCache) {
    globalCache = new CacheManager({
      l1Enabled: true,
      l2Enabled: process.env.UPSTASH_REDIS_URL ? true : false
    });
  }
  return globalCache;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cache = getCacheInstance();
    const stats = await cache.getStats();
    const health = await cache.healthCheck();

    return res.status(200).json({
      success: true,
      data: {
        stats: stats,
        health: health,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Cache stats error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export cache instance
module.exports.getCacheInstance = getCacheInstance;
