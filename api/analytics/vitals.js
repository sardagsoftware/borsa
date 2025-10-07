// ============================================
// 📊 CORE WEB VITALS COLLECTOR
// Real User Monitoring (RUM) endpoint
// Phase 1 - Performance Baseline
// ============================================

const Redis = require('ioredis');

// Redis client for storing metrics
let redis = null;

function getRedisClient() {
    if (redis) return redis;

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        console.warn('[Vitals] Redis not configured');
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
 * Store metric in Redis with TTL
 */
async function storeMetric(metric) {
    const redisClient = getRedisClient();
    if (!redisClient) {
        console.log('[Vitals] Metric received but not stored (Redis unavailable):', metric.name, metric.value);
        return false;
    }

    try {
        const timestamp = Date.now();
        const key = `vitals:${metric.name}:${timestamp}`;

        // Store individual metric
        await redisClient.setex(
            key,
            7 * 24 * 60 * 60, // 7 days TTL
            JSON.stringify(metric)
        );

        // Add to time-series sorted set for aggregation
        const tsKey = `vitals:timeseries:${metric.name}`;
        await redisClient.zadd(tsKey, timestamp, key);
        await redisClient.expire(tsKey, 7 * 24 * 60 * 60);

        // Update aggregated stats
        await updateAggregatedStats(metric);

        return true;
    } catch (error) {
        console.error('[Vitals] Store error:', error.message);
        return false;
    }
}

/**
 * Update aggregated statistics (p50, p75, p95, p99)
 */
async function updateAggregatedStats(metric) {
    const redisClient = getRedisClient();
    if (!redisClient) return;

    try {
        const statsKey = `vitals:stats:${metric.name}:${metric.pathname || 'global'}`;

        // Store value in sorted set for percentile calculation
        await redisClient.zadd(statsKey, metric.value, `${Date.now()}:${metric.value}`);

        // Keep only last 1000 samples
        await redisClient.zremrangebyrank(statsKey, 0, -1001);

        // Set TTL
        await redisClient.expire(statsKey, 7 * 24 * 60 * 60);
    } catch (error) {
        console.error('[Vitals] Aggregation error:', error.message);
    }
}

/**
 * Calculate percentiles from stored metrics
 */
async function calculatePercentiles(metricName, pathname = 'global') {
    const redisClient = getRedisClient();
    if (!redisClient) return null;

    try {
        const statsKey = `vitals:stats:${metricName}:${pathname}`;

        // Get all values
        const values = await redisClient.zrange(statsKey, 0, -1);

        if (values.length === 0) {
            return null;
        }

        // Extract numeric values
        const numericValues = values.map(v => {
            const parts = v.split(':');
            return parseFloat(parts[parts.length - 1]);
        }).sort((a, b) => a - b);

        const count = numericValues.length;

        return {
            count,
            min: numericValues[0],
            p50: numericValues[Math.floor(count * 0.50)],
            p75: numericValues[Math.floor(count * 0.75)],
            p95: numericValues[Math.floor(count * 0.95)],
            p99: numericValues[Math.floor(count * 0.99)],
            max: numericValues[count - 1]
        };
    } catch (error) {
        console.error('[Vitals] Percentile calculation error:', error.message);
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

    // POST: Store metrics
    if (req.method === 'POST') {
        try {
            const { metrics } = req.body;

            if (!metrics || !Array.isArray(metrics)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid metrics format'
                });
            }

            // Validate and store each metric
            const results = [];
            for (const metric of metrics) {
                // Validate required fields
                if (!metric.name || typeof metric.value !== 'number') {
                    results.push({ success: false, error: 'Missing required fields' });
                    continue;
                }

                // Validate metric name
                const validMetrics = ['LCP', 'CLS', 'INP', 'FCP', 'TTFB'];
                if (!validMetrics.includes(metric.name)) {
                    results.push({ success: false, error: 'Invalid metric name' });
                    continue;
                }

                // Store metric
                const stored = await storeMetric(metric);
                results.push({ success: stored });
            }

            return res.status(200).json({
                success: true,
                stored: results.filter(r => r.success).length,
                total: results.length
            });

        } catch (error) {
            console.error('[Vitals] POST error:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to store metrics'
            });
        }
    }

    // GET: Retrieve aggregated statistics
    if (req.method === 'GET') {
        try {
            const { metric, pathname } = req.query;

            if (!metric) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing metric parameter'
                });
            }

            const stats = await calculatePercentiles(metric, pathname);

            if (!stats) {
                return res.status(404).json({
                    success: false,
                    error: 'No data available for this metric'
                });
            }

            return res.status(200).json({
                success: true,
                metric,
                pathname: pathname || 'global',
                stats
            });

        } catch (error) {
            console.error('[Vitals] GET error:', error.message);
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
