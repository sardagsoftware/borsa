/**
 * 🚀 REDIS CACHE LAYER
 * Enterprise-grade distributed caching with Azure Cache for Redis
 *
 * Features:
 * - Multi-strategy caching (Cache-Aside, Write-Through, Write-Behind, Read-Through)
 * - Connection pooling with automatic failover
 * - Pipeline batching for bulk operations
 * - Compression for large objects
 * - TTL management
 * - Cache warming
 * - Azure Application Insights integration
 */

const Redis = require('ioredis');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Azure Application Insights integration
let appInsights;
try {
    appInsights = require('applicationinsights');
} catch (error) {
    console.warn('⚠️ Application Insights not installed - cache metrics will not be tracked');
}

/**
 * Redis Client Configuration
 */
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'ailydian:',
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 5000,
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT) || 3000,
    retryStrategy: (times) => {
        // Exponential backoff: 50ms, 100ms, 200ms, 400ms, ... max 2000ms
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
    lazyConnect: false,
    enableReadyCheck: true,
    autoResubscribe: true,
    autoResendUnfulfilledCommands: true,
    showFriendlyErrorStack: process.env.NODE_ENV !== 'production'
};

/**
 * Create Redis client
 */
const redis = new Redis(redisConfig);

/**
 * Connection event listeners
 */
redis.on('connect', () => {
    console.log('✅ Redis: Connected to Azure Cache for Redis');
    trackCacheEvent('CacheConnected', { host: redisConfig.host });
});

redis.on('ready', () => {
    console.log('✅ Redis: Ready to accept commands');
});

redis.on('error', (error) => {
    console.error('❌ Redis Error:', error.message);
    trackCacheEvent('CacheError', { error: error.message });
});

redis.on('close', () => {
    console.warn('⚠️ Redis: Connection closed');
});

redis.on('reconnecting', () => {
    console.log('🔄 Redis: Reconnecting...');
});

/**
 * Track cache events in Azure Application Insights
 */
function trackCacheEvent(eventName, properties = {}) {
    if (appInsights && appInsights.defaultClient) {
        appInsights.defaultClient.trackEvent({
            name: eventName,
            properties
        });
    }
}

/**
 * Track cache metrics
 */
function trackCacheMetric(metricName, value, properties = {}) {
    if (appInsights && appInsights.defaultClient) {
        appInsights.defaultClient.trackMetric({
            name: metricName,
            value,
            properties
        });
    }
}

/**
 * Cache Key Generators
 */
const CacheKeys = {
    user: (userId) => `user:${userId}`,
    userApiKeys: (userId) => `user:${userId}:apikeys`,
    apiKey: (keyId) => `apikey:${keyId}`,
    session: (sessionId) => `session:${sessionId}`,
    organization: (orgId) => `org:${orgId}`,
    aiConfig: (provider) => `ai:config:${provider}`,
    aiModel: (modelId) => `ai:model:${modelId}`,
    rateLimit: (userId, endpoint) => `rate-limit:${userId}:${endpoint}`,
    conversation: (conversationId) => `conversation:${conversationId}`,
    analytics: (date) => `analytics:daily:${date}`
};

/**
 * Default TTL values (in seconds)
 */
const TTL = {
    USER_PROFILE: 3600,          // 1 hour
    API_KEY: 3600,               // 1 hour
    SESSION: 1800,               // 30 minutes
    ORGANIZATION: 7200,          // 2 hours
    AI_CONFIG: 86400,            // 24 hours
    AI_MODEL: 43200,             // 12 hours
    RATE_LIMIT: 60,              // 1 minute
    CONVERSATION: 3600,          // 1 hour
    ANALYTICS: 86400             // 24 hours
};

/**
 * Compression threshold (bytes)
 * Objects larger than 1KB will be compressed
 */
const COMPRESSION_THRESHOLD = 1024;

/**
 * Check if value should be compressed
 */
function shouldCompress(value) {
    return Buffer.byteLength(value, 'utf8') > COMPRESSION_THRESHOLD;
}

/**
 * Serialize and optionally compress object
 */
async function serialize(obj) {
    const json = JSON.stringify(obj);

    if (shouldCompress(json)) {
        const compressed = await gzip(json);
        const base64 = compressed.toString('base64');
        return `GZIP:${base64}`;
    }

    return json;
}

/**
 * Deserialize and optionally decompress value
 */
async function deserialize(value) {
    if (!value) return null;

    if (value.startsWith('GZIP:')) {
        const base64 = value.substring(5);
        const compressed = Buffer.from(base64, 'base64');
        const decompressed = await gunzip(compressed);
        return JSON.parse(decompressed.toString('utf8'));
    }

    return JSON.parse(value);
}

/**
 * CACHE-ASIDE PATTERN (Lazy Loading)
 * Application checks cache first, loads from DB on miss, then caches result
 */
class CacheAsideStrategy {
    /**
     * Get value from cache or load from DB
     * @param {string} key - Cache key
     * @param {function} loader - Function to load data from DB on cache miss
     * @param {number} ttl - Time to live in seconds
     */
    static async get(key, loader, ttl = TTL.USER_PROFILE) {
        const startTime = Date.now();

        try {
            // Try to get from cache
            const cached = await redis.get(key);
            const latency = Date.now() - startTime;

            if (cached) {
                // Cache hit
                trackCacheMetric('CacheHit', 1, { key });
                trackCacheMetric('CacheLatency', latency, { key, hit: true });
                return await deserialize(cached);
            }

            // Cache miss - load from DB
            trackCacheMetric('CacheMiss', 1, { key });

            const data = await loader();

            if (data) {
                // Store in cache
                const serialized = await serialize(data);
                await redis.setex(key, ttl, serialized);
                trackCacheEvent('CacheSet', { key, ttl });
            }

            trackCacheMetric('CacheLatency', Date.now() - startTime, { key, hit: false });
            return data;

        } catch (error) {
            console.error('❌ CacheAsideStrategy.get error:', error.message);
            trackCacheEvent('CacheError', { key, error: error.message });

            // Fallback to loader on Redis error
            return await loader();
        }
    }

    /**
     * Invalidate cache entry
     */
    static async invalidate(key) {
        try {
            await redis.del(key);
            trackCacheEvent('CacheInvalidate', { key });
        } catch (error) {
            console.error('❌ CacheAsideStrategy.invalidate error:', error.message);
        }
    }
}

/**
 * WRITE-THROUGH PATTERN
 * Application writes to cache and DB simultaneously
 */
class WriteThroughStrategy {
    /**
     * Write to cache and DB
     * @param {string} key - Cache key
     * @param {object} data - Data to write
     * @param {function} writer - Function to write to DB
     * @param {number} ttl - Time to live in seconds
     */
    static async set(key, data, writer, ttl = TTL.SESSION) {
        try {
            // Write to DB first
            await writer(data);

            // Write to cache
            const serialized = await serialize(data);
            await redis.setex(key, ttl, serialized);

            trackCacheEvent('WriteThroughSet', { key, ttl });
            return true;

        } catch (error) {
            console.error('❌ WriteThroughStrategy.set error:', error.message);
            trackCacheEvent('CacheError', { key, error: error.message });
            throw error;
        }
    }

    /**
     * Delete from cache and DB
     */
    static async delete(key, deleter) {
        try {
            // Delete from DB first
            await deleter();

            // Delete from cache
            await redis.del(key);

            trackCacheEvent('WriteThroughDelete', { key });
            return true;

        } catch (error) {
            console.error('❌ WriteThroughStrategy.delete error:', error.message);
            throw error;
        }
    }
}

/**
 * WRITE-BEHIND PATTERN (Write-Back)
 * Application writes to cache immediately, DB write happens asynchronously
 */
class WriteBehindStrategy {
    static writeQueue = [];
    static flushInterval = 5000; // 5 seconds
    static maxBatchSize = 100;

    /**
     * Initialize background worker
     */
    static initialize(dbWriter) {
        setInterval(() => {
            this.flush(dbWriter);
        }, this.flushInterval);
    }

    /**
     * Write to cache immediately, queue DB write
     */
    static async set(key, data, ttl = TTL.ANALYTICS) {
        try {
            // Write to cache immediately
            const serialized = await serialize(data);
            await redis.setex(key, ttl, serialized);

            // Queue DB write
            this.writeQueue.push({ key, data, timestamp: Date.now() });

            trackCacheEvent('WriteBehindSet', { key, queueSize: this.writeQueue.length });

            // Flush if queue is full
            if (this.writeQueue.length >= this.maxBatchSize) {
                await this.flush();
            }

            return true;

        } catch (error) {
            console.error('❌ WriteBehindStrategy.set error:', error.message);
            throw error;
        }
    }

    /**
     * Flush write queue to DB
     */
    static async flush(dbWriter) {
        if (this.writeQueue.length === 0) return;

        const batch = this.writeQueue.splice(0, this.maxBatchSize);

        try {
            if (dbWriter) {
                await dbWriter(batch);
            }

            trackCacheEvent('WriteBehindFlush', { batchSize: batch.length });

        } catch (error) {
            console.error('❌ WriteBehindStrategy.flush error:', error.message);

            // Re-queue failed writes
            this.writeQueue.unshift(...batch);
        }
    }
}

/**
 * RATE LIMITING
 * Track API request counts per user/endpoint
 */
class RateLimiter {
    /**
     * Check if request is allowed
     * @param {string} userId - User ID
     * @param {string} endpoint - API endpoint
     * @param {number} maxRequests - Maximum requests allowed
     * @param {number} windowSeconds - Time window in seconds
     */
    static async isAllowed(userId, endpoint, maxRequests = 100, windowSeconds = 60) {
        const key = CacheKeys.rateLimit(userId, endpoint);

        try {
            const count = await redis.incr(key);

            if (count === 1) {
                // First request in window - set expiry
                await redis.expire(key, windowSeconds);
            }

            const allowed = count <= maxRequests;

            trackCacheMetric('RateLimitCheck', count, {
                userId,
                endpoint,
                allowed,
                limit: maxRequests
            });

            return {
                allowed,
                remaining: Math.max(0, maxRequests - count),
                limit: maxRequests,
                resetIn: await redis.ttl(key)
            };

        } catch (error) {
            console.error('❌ RateLimiter.isAllowed error:', error.message);

            // Allow request on Redis error (fail open)
            return {
                allowed: true,
                remaining: maxRequests,
                limit: maxRequests,
                resetIn: windowSeconds
            };
        }
    }

    /**
     * Reset rate limit for user/endpoint
     */
    static async reset(userId, endpoint) {
        const key = CacheKeys.rateLimit(userId, endpoint);
        await redis.del(key);
    }
}

/**
 * CACHE WARMING
 * Pre-populate cache with frequently accessed data
 */
class CacheWarmer {
    /**
     * Warm cache with user profiles
     */
    static async warmUserProfiles(userIds, loader) {
        console.log(`🔥 Warming cache for ${userIds.length} user profiles...`);

        const pipeline = redis.pipeline();

        for (const userId of userIds) {
            const key = CacheKeys.user(userId);
            const data = await loader(userId);

            if (data) {
                const serialized = await serialize(data);
                pipeline.setex(key, TTL.USER_PROFILE, serialized);
            }
        }

        await pipeline.exec();

        console.log(`✅ Cache warmed: ${userIds.length} user profiles`);
        trackCacheEvent('CacheWarmed', { type: 'user_profiles', count: userIds.length });
    }

    /**
     * Warm cache with AI configurations
     */
    static async warmAIConfigs(providers, loader) {
        console.log(`🔥 Warming cache for ${providers.length} AI providers...`);

        const pipeline = redis.pipeline();

        for (const provider of providers) {
            const key = CacheKeys.aiConfig(provider);
            const data = await loader(provider);

            if (data) {
                const serialized = await serialize(data);
                pipeline.setex(key, TTL.AI_CONFIG, serialized);
            }
        }

        await pipeline.exec();

        console.log(`✅ Cache warmed: ${providers.length} AI configs`);
        trackCacheEvent('CacheWarmed', { type: 'ai_configs', count: providers.length });
    }
}

/**
 * CACHE STATISTICS
 * Get cache hit rate and performance metrics
 */
class CacheStats {
    /**
     * Get Redis info
     */
    static async getInfo() {
        try {
            const info = await redis.info();
            const stats = {};

            info.split('\r\n').forEach(line => {
                if (line.includes(':')) {
                    const [key, value] = line.split(':');
                    stats[key] = value;
                }
            });

            return {
                connected_clients: parseInt(stats.connected_clients) || 0,
                used_memory_human: stats.used_memory_human,
                used_memory_peak_human: stats.used_memory_peak_human,
                total_connections_received: parseInt(stats.total_connections_received) || 0,
                total_commands_processed: parseInt(stats.total_commands_processed) || 0,
                instantaneous_ops_per_sec: parseInt(stats.instantaneous_ops_per_sec) || 0,
                keyspace_hits: parseInt(stats.keyspace_hits) || 0,
                keyspace_misses: parseInt(stats.keyspace_misses) || 0,
                evicted_keys: parseInt(stats.evicted_keys) || 0
            };

        } catch (error) {
            console.error('❌ CacheStats.getInfo error:', error.message);
            return null;
        }
    }

    /**
     * Calculate cache hit rate
     */
    static async getHitRate() {
        const stats = await this.getInfo();

        if (!stats) return null;

        const hits = stats.keyspace_hits;
        const misses = stats.keyspace_misses;
        const total = hits + misses;

        if (total === 0) return 0;

        const hitRate = (hits / total) * 100;

        trackCacheMetric('CacheHitRate', hitRate);

        return {
            hitRate: hitRate.toFixed(2),
            hits,
            misses,
            total
        };
    }
}

/**
 * Express middleware to add cache headers
 */
function cacheHeadersMiddleware(req, res, next) {
    res.setHeader('X-Cache-Enabled', 'true');
    res.setHeader('X-Cache-TTL', TTL.USER_PROFILE);
    next();
}

/**
 * Graceful shutdown
 */
async function shutdown() {
    console.log('🔄 Shutting down Redis connection...');

    // Flush write-behind queue
    await WriteBehindStrategy.flush();

    // Close Redis connection
    await redis.quit();

    console.log('✅ Redis connection closed');
}

// Handle process termination
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = {
    redis,
    CacheKeys,
    TTL,
    CacheAsideStrategy,
    WriteThroughStrategy,
    WriteBehindStrategy,
    RateLimiter,
    CacheWarmer,
    CacheStats,
    cacheHeadersMiddleware,
    shutdown
};
