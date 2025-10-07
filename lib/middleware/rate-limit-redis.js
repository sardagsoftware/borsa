// ============================================
// 🛡️ REDIS-BASED RATE LIMITING MIDDLEWARE
// Phase 1 - White Hat Security
// ============================================

const Redis = require('ioredis');

// Redis client initialization
let redis = null;

function getRedisClient() {
    if (redis) return redis;

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        console.warn('[Rate Limit] Redis not configured, rate limiting disabled');
        return null;
    }

    redis = new Redis({
        host: new URL(redisUrl).hostname,
        port: new URL(redisUrl).port || 6379,
        password: redisToken,
        tls: redisUrl.startsWith('https') ? {} : undefined,
        retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 50, 2000);
        }
    });

    redis.on('error', (err) => {
        console.error('[Rate Limit] Redis error:', err.message);
    });

    return redis;
}

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    perIP: {
        windowMs: 60000, // 1 minute
        maxRequests: parseInt(process.env.RATE_LIMIT_PER_IP_PER_MINUTE) || 10
    },
    perUser: {
        windowMs: 3600000, // 1 hour
        maxRequests: parseInt(process.env.RATE_LIMIT_PER_USER_PER_HOUR) || 100
    },
    perEndpoint: {
        '/api/chat': { windowMs: 60000, maxRequests: 5 },
        '/api/lydian-iq/solve': { windowMs: 60000, maxRequests: 3 },
        '/api/image/generate': { windowMs: 60000, maxRequests: 2 },
        '/api/medical/analyze': { windowMs: 60000, maxRequests: 10 }
    }
};

/**
 * Get client identifier from request
 */
function getClientIdentifier(req) {
    // Try to get IP from various headers (Vercel, Cloudflare, etc.)
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               'unknown';

    return ip;
}

/**
 * Get user identifier from session
 */
async function getUserIdentifier(req) {
    try {
        const cookies = req.headers.cookie || '';
        const sessionIdMatch = cookies.match(/sessionId=([^;]+)/);

        if (!sessionIdMatch) return null;

        const sessionId = sessionIdMatch[1];

        // Simple session check (should use proper session store)
        // This is a placeholder - in production, query Redis for session
        return `user:${sessionId}`;
    } catch (error) {
        return null;
    }
}

/**
 * Check rate limit using sliding window algorithm
 */
async function checkRateLimit(key, config) {
    const redisClient = getRedisClient();

    if (!redisClient) {
        // Redis not available, allow request
        return {
            allowed: true,
            remaining: config.maxRequests,
            resetTime: Date.now() + config.windowMs
        };
    }

    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
        // Sliding window rate limiting using sorted set
        const multi = redisClient.multi();

        // Remove old entries
        multi.zremrangebyscore(key, 0, windowStart);

        // Count current requests in window
        multi.zcard(key);

        // Add current request
        multi.zadd(key, now, `${now}:${Math.random()}`);

        // Set expiry
        multi.expire(key, Math.ceil(config.windowMs / 1000));

        const results = await multi.exec();

        // Get count (result of zcard command)
        const count = results[1][1];

        const allowed = count < config.maxRequests;
        const remaining = Math.max(0, config.maxRequests - count - 1);

        // Calculate reset time (when the oldest request in window expires)
        let resetTime = now + config.windowMs;
        if (count > 0) {
            const oldest = await redisClient.zrange(key, 0, 0, 'WITHSCORES');
            if (oldest.length >= 2) {
                resetTime = parseInt(oldest[1]) + config.windowMs;
            }
        }

        return {
            allowed,
            remaining,
            resetTime,
            limit: config.maxRequests
        };
    } catch (error) {
        console.error('[Rate Limit] Check error:', error.message);
        // On error, allow request to avoid blocking legitimate traffic
        return {
            allowed: true,
            remaining: config.maxRequests,
            resetTime: now + config.windowMs
        };
    }
}

/**
 * Rate limiting middleware
 */
async function rateLimitMiddleware(req, res, next) {
    // Skip if rate limiting is disabled
    if (!RATE_LIMIT_CONFIG.enabled) {
        return next ? next() : { allowed: true };
    }

    const clientIp = getClientIdentifier(req);
    const userId = await getUserIdentifier(req);
    const endpoint = req.url?.split('?')[0] || req.path || '/';

    // Check IP-based rate limit
    const ipKey = `ratelimit:ip:${clientIp}`;
    const ipLimit = await checkRateLimit(ipKey, RATE_LIMIT_CONFIG.perIP);

    if (!ipLimit.allowed) {
        const retryAfter = Math.ceil((ipLimit.resetTime - Date.now()) / 1000);

        if (res) {
            res.setHeader('X-RateLimit-Limit', ipLimit.limit);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', ipLimit.resetTime);
            res.setHeader('Retry-After', retryAfter);

            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded for your IP address',
                retryAfter: retryAfter
            });
        }

        return { allowed: false, retryAfter };
    }

    // Check user-based rate limit (if authenticated)
    if (userId) {
        const userKey = `ratelimit:user:${userId}`;
        const userLimit = await checkRateLimit(userKey, RATE_LIMIT_CONFIG.perUser);

        if (!userLimit.allowed) {
            const retryAfter = Math.ceil((userLimit.resetTime - Date.now()) / 1000);

            if (res) {
                res.setHeader('X-RateLimit-Limit', userLimit.limit);
                res.setHeader('X-RateLimit-Remaining', 0);
                res.setHeader('X-RateLimit-Reset', userLimit.resetTime);
                res.setHeader('Retry-After', retryAfter);

                return res.status(429).json({
                    error: 'Too Many Requests',
                    message: 'Rate limit exceeded for your account',
                    retryAfter: retryAfter
                });
            }

            return { allowed: false, retryAfter };
        }
    }

    // Check endpoint-specific rate limit
    const endpointConfig = RATE_LIMIT_CONFIG.perEndpoint[endpoint];
    if (endpointConfig) {
        const endpointKey = `ratelimit:endpoint:${endpoint}:${userId || clientIp}`;
        const endpointLimit = await checkRateLimit(endpointKey, endpointConfig);

        if (!endpointLimit.allowed) {
            const retryAfter = Math.ceil((endpointLimit.resetTime - Date.now()) / 1000);

            if (res) {
                res.setHeader('X-RateLimit-Limit', endpointLimit.limit);
                res.setHeader('X-RateLimit-Remaining', 0);
                res.setHeader('X-RateLimit-Reset', endpointLimit.resetTime);
                res.setHeader('Retry-After', retryAfter);

                return res.status(429).json({
                    error: 'Too Many Requests',
                    message: `Rate limit exceeded for ${endpoint}`,
                    retryAfter: retryAfter
                });
            }

            return { allowed: false, retryAfter };
        }

        // Set rate limit headers for successful requests
        if (res) {
            res.setHeader('X-RateLimit-Limit', endpointLimit.limit);
            res.setHeader('X-RateLimit-Remaining', endpointLimit.remaining);
            res.setHeader('X-RateLimit-Reset', endpointLimit.resetTime);
        }
    } else {
        // Set IP-based headers for endpoints without specific limits
        if (res) {
            res.setHeader('X-RateLimit-Limit', ipLimit.limit);
            res.setHeader('X-RateLimit-Remaining', ipLimit.remaining);
            res.setHeader('X-RateLimit-Reset', ipLimit.resetTime);
        }
    }

    // Allow request
    return next ? next() : { allowed: true };
}

/**
 * Standalone rate limit checker (for use in serverless functions)
 */
async function checkRateLimitForRequest(req) {
    return await rateLimitMiddleware(req, null, null);
}

/**
 * Reset rate limit for a specific key (admin function)
 */
async function resetRateLimit(key) {
    const redisClient = getRedisClient();
    if (!redisClient) return false;

    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.error('[Rate Limit] Reset error:', error.message);
        return false;
    }
}

module.exports = {
    rateLimitMiddleware,
    checkRateLimitForRequest,
    resetRateLimit,
    RATE_LIMIT_CONFIG
};
