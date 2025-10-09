// ============================================
// 🚨 ERROR TRACKING ENDPOINT
// Store and retrieve error tracking data
// Phase P - Performance Monitoring
// ============================================

const Redis = require('ioredis');

// Redis client
let redis = null;

function getRedisClient() {
    if (redis) return redis;

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        console.warn('[Error Tracking] Redis not configured');
        return null;
    }

    redis = new Redis({
        host: new URL(redisUrl).hostname,
        port: new URL(redisUrl).port || 6379,
        password: redisToken,
        tls: redisUrl.startsWith('https') ? {} : undefined
    });

    return redis;
}

/**
 * Store error in Redis
 */
async function storeError(error) {
    const redisClient = getRedisClient();
    if (!redisClient) {
        console.log('[Error Tracking] Error received but not stored (Redis unavailable):', error.type);
        return false;
    }

    try {
        const timestamp = Date.now();
        const key = `errors:${error.sessionId}:${timestamp}`;

        // Store individual error
        await redisClient.setex(
            key,
            30 * 24 * 60 * 60, // 30 days TTL
            JSON.stringify(error)
        );

        // Add to recent errors sorted set (sorted by timestamp)
        const recentKey = 'errors:recent';
        await redisClient.zadd(recentKey, timestamp, key);

        // Keep only last 1000 errors
        await redisClient.zremrangebyrank(recentKey, 0, -1001);

        // Update error statistics
        await updateErrorStats(error);

        return true;
    } catch (error) {
        console.error('[Error Tracking] Store error:', error.message);
        return false;
    }
}

/**
 * Update error statistics
 */
async function updateErrorStats(error) {
    const redisClient = getRedisClient();
    if (!redisClient) return;

    try {
        const today = new Date().toISOString().split('T')[0];
        const statsKey = `errors:stats:${today}`;

        // Increment total errors
        await redisClient.hincrby(statsKey, 'total_errors', 1);

        // Increment errors by type
        await redisClient.hincrby(statsKey, `type:${error.type}`, 1);

        // Track by URL
        if (error.pathname) {
            const urlKey = `errors:by_url:${today}`;
            await redisClient.zincrby(urlKey, 1, error.pathname);
            await redisClient.expire(urlKey, 30 * 24 * 60 * 60);
        }

        // Track by message (for grouping similar errors)
        if (error.message) {
            const messageHash = this.hashString(error.message);
            await redisClient.hincrby(statsKey, `message:${messageHash}`, 1);
        }

        // Set TTL
        await redisClient.expire(statsKey, 30 * 24 * 60 * 60); // 30 days

    } catch (error) {
        console.error('[Error Tracking] Stats update error:', error.message);
    }
}

/**
 * Simple string hash function
 */
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < Math.min(str.length, 100); i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Get error statistics
 */
async function getErrorStats(days = 7) {
    const redisClient = getRedisClient();
    if (!redisClient) return null;

    try {
        const stats = {
            totalErrors: 0,
            javascriptErrors: 0,
            apiErrors: 0,
            resourceErrors: 0,
            unhandledRejections: 0,
            errorsByUrl: {},
            recentErrors: [],
            daily: []
        };

        // Get stats for last N days
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const statsKey = `errors:stats:${dateStr}`;
            const dayStats = await redisClient.hgetall(statsKey);

            const dayData = {
                date: dateStr,
                total: parseInt(dayStats.total_errors || 0),
                javascript: parseInt(dayStats['type:javascript'] || 0),
                api: parseInt(dayStats['type:api'] || 0),
                resource: parseInt(dayStats['type:resource'] || 0),
                unhandledRejection: parseInt(dayStats['type:unhandled_rejection'] || 0)
            };

            stats.daily.push(dayData);

            // Aggregate totals
            stats.totalErrors += dayData.total;
            stats.javascriptErrors += dayData.javascript;
            stats.apiErrors += dayData.api;
            stats.resourceErrors += dayData.resource;
            stats.unhandledRejections += dayData.unhandledRejection;
        }

        // Get recent errors (last 20)
        const recentKey = 'errors:recent';
        const recentKeys = await redisClient.zrevrange(recentKey, 0, 19);

        for (const key of recentKeys) {
            try {
                const errorData = await redisClient.get(key);
                if (errorData) {
                    const error = JSON.parse(errorData);

                    // Sanitize error for display (remove sensitive data)
                    stats.recentErrors.push({
                        type: error.type,
                        message: error.message?.substring(0, 200) || 'Unknown error',
                        pathname: error.pathname,
                        timestamp: error.timestamp,
                        userAgent: error.userAgent?.substring(0, 100)
                    });
                }
            } catch (e) {
                // Skip invalid error data
            }
        }

        return stats;

    } catch (error) {
        console.error('[Error Tracking] Get stats error:', error.message);
        return null;
    }
}

/**
 * Get error details by ID
 */
async function getErrorDetails(errorId) {
    const redisClient = getRedisClient();
    if (!redisClient) return null;

    try {
        const errorData = await redisClient.get(`errors:${errorId}`);

        if (!errorData) {
            return null;
        }

        return JSON.parse(errorData);

    } catch (error) {
        console.error('[Error Tracking] Get error details error:', error.message);
        return null;
    }
}

module.exports = async (req, res) => {
    // CORS
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

    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // POST: Store errors
    if (req.method === 'POST') {
        try {
            const { errors, sessionInfo } = req.body;

            if (!errors || !Array.isArray(errors)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid errors format'
                });
            }

            // Store each error
            const results = [];
            for (const error of errors) {
                // Validate required fields
                if (!error.type || !error.message) {
                    results.push({ success: false, error: 'Missing required fields' });
                    continue;
                }

                const stored = await storeError(error);
                results.push({ success: stored });
            }

            return res.status(200).json({
                success: true,
                stored: results.filter(r => r.success).length,
                total: results.length
            });

        } catch (error) {
            console.error('[Error Tracking] POST error:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to store errors'
            });
        }
    }

    // GET: Retrieve error statistics or specific error
    if (req.method === 'GET') {
        try {
            const { days = 7, errorId } = req.query;

            // Get specific error details
            if (errorId) {
                const error = await getErrorDetails(errorId);

                if (!error) {
                    return res.status(404).json({
                        success: false,
                        error: 'Error not found'
                    });
                }

                return res.status(200).json({
                    success: true,
                    error
                });
            }

            // Get error statistics
            const stats = await getErrorStats(parseInt(days));

            if (!stats) {
                return res.status(404).json({
                    success: false,
                    error: 'No error data available'
                });
            }

            return res.status(200).json({
                success: true,
                ...stats
            });

        } catch (error) {
            console.error('[Error Tracking] GET error:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve statistics'
            });
        }
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed'
    });
};
