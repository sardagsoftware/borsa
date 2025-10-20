// ============================================
// 🧪 TEST: Redis Import Test
// Tests if @upstash/redis can be imported
// ============================================

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

    const results = {
        success: true,
        tests: []
    };

    // Test 1: Can we import @upstash/redis?
    try {
        const { Redis } = require('@upstash/redis');
        results.tests.push({
            test: 'Import @upstash/redis',
            status: 'PASS',
            message: 'Module imported successfully'
        });

        // Test 2: Are environment variables set?
        const hasUrl = !!process.env.UPSTASH_REDIS_REST_URL;
        const hasToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;

        results.tests.push({
            test: 'Environment variables',
            status: (hasUrl && hasToken) ? 'PASS' : 'FAIL',
            hasUrl: hasUrl,
            hasToken: hasToken,
            urlPrefix: hasUrl ? process.env.UPSTASH_REDIS_REST_URL.substring(0, 20) + '...' : 'NOT SET',
            tokenPrefix: hasToken ? process.env.UPSTASH_REDIS_REST_TOKEN.substring(0, 10) + '...' : 'NOT SET'
        });

        // Test 3: Can we create a Redis instance?
        try {
            const redis = new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN
            });

            results.tests.push({
                test: 'Create Redis instance',
                status: 'PASS',
                message: 'Redis instance created successfully'
            });

            // Test 4: Can we perform a simple operation?
            try {
                const testKey = 'test:' + Date.now();
                await redis.set(testKey, 'Hello from Vercel!', { ex: 60 });
                const value = await redis.get(testKey);

                results.tests.push({
                    test: 'Redis SET/GET operation',
                    status: value === 'Hello from Vercel!' ? 'PASS' : 'FAIL',
                    testKey: testKey,
                    setValue: 'Hello from Vercel!',
                    getValue: value
                });

                // Clean up
                await redis.del(testKey);

            } catch (operationError) {
                results.tests.push({
                    test: 'Redis SET/GET operation',
                    status: 'FAIL',
                    error: operationError.message,
                    stack: operationError.stack
                });
            }

        } catch (instanceError) {
            results.tests.push({
                test: 'Create Redis instance',
                status: 'FAIL',
                error: instanceError.message,
                stack: instanceError.stack
            });
        }

    } catch (importError) {
        results.tests.push({
            test: 'Import @upstash/redis',
            status: 'FAIL',
            error: importError.message,
            stack: importError.stack
        });
    }

    // Test 5: Can we import the redis-cache module?
    try {
        const redisCacheModule = require('../lib/cache/redis-cache');
        const redisCache = redisCacheModule.redisCache;

        results.tests.push({
            test: 'Import redis-cache module',
            status: 'PASS',
            enabled: redisCache.enabled,
            message: 'Redis cache module imported successfully'
        });

        // Test 6: Can we get stats?
        try {
            const stats = await redisCache.getStats();
            results.tests.push({
                test: 'Get cache stats',
                status: 'PASS',
                stats: stats
            });
        } catch (statsError) {
            results.tests.push({
                test: 'Get cache stats',
                status: 'FAIL',
                error: statsError.message,
                stack: statsError.stack
            });
        }

    } catch (moduleError) {
        results.tests.push({
            test: 'Import redis-cache module',
            status: 'FAIL',
            error: moduleError.message,
            stack: moduleError.stack
        });
    }

    return res.status(200).json(results);
};
