// ============================================
// 📊 CACHE STATISTICS ENDPOINT
// Redis Cache Stats for monitoring
// ⚡ Phase 4 Performance Optimization
// ============================================

const { getCacheStats, getRedisClient } = require('../lib/middleware/cache-middleware');

module.exports = async (req, res) => {
    // CORS Headers
    const allowedOrigins = [
        'https://www.ailydian.com',
        'https://ailydian.com',
        'https://ailydian-ultra-pro.vercel.app',
        'http://localhost:3000',
        'http://localhost:3100'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // Get basic cache statistics
        const stats = await getCacheStats();

        // Get Redis client for additional info
        const redis = getRedisClient();

        // Enhanced stats with configuration info
        const enhancedStats = {
            success: true,
            cache: stats,
            configuration: {
                configured: redis !== null,
                environment: process.env.NODE_ENV || 'development',
                upstashUrl: process.env.UPSTASH_REDIS_REST_URL ? 'configured' : 'missing',
                upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN ? 'configured' : 'missing'
            },
            timestamp: new Date().toISOString()
        };

        // If Redis is available, get more detailed stats
        if (redis && stats.enabled) {
            try {
                // Get sample of cached keys
                const allKeys = await redis.keys('*');
                const keysByPrefix = {};

                allKeys.forEach(key => {
                    const prefix = key.split(':')[0] || 'unknown';
                    keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1;
                });

                enhancedStats.keyDistribution = keysByPrefix;
                enhancedStats.totalCachedKeys = allKeys.length;
            } catch (error) {
                console.warn('[Cache Stats] Could not get key distribution:', error.message);
            }
        }

        return res.status(200).json(enhancedStats);
    } catch (error) {
        console.error('[Cache Stats] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get cache statistics',
            message: error.message
        });
    }
};
