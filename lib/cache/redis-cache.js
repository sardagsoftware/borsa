// ============================================
// ⚡ REDIS CACHE SERVICE
// Upstash Redis - Serverless Cache for LyDian IQ
// Version: 1.0.0
// ============================================

const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

/**
 * Redis Cache Service for LyDian IQ
 * Uses Upstash Redis (serverless-friendly)
 */
class RedisCache {
    constructor() {
        // Initialize Upstash Redis
        this.enabled = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

        if (this.enabled) {
            this.redis = new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN
            });
            console.log('✅ Redis Cache: Enabled (Upstash)');
        } else {
            console.warn('⚠️ Redis Cache: Disabled (missing env variables)');
            console.warn('   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable');
        }

        // Cache configuration
        this.defaultTTL = 3600; // 1 hour (in seconds)
        this.keyPrefix = 'lydian-iq:';
    }

    /**
     * Generate cache key from problem
     * @param {string} problem - User's problem/question
     * @param {string} domain - Domain (mathematics, coding, etc.)
     * @param {string} language - Language code (tr-TR, en-US, etc.)
     * @returns {string} Cache key
     */
    generateKey(problem, domain = 'general', language = 'tr-TR') {
        // Create hash of problem (case-insensitive, trimmed)
        const normalizedProblem = problem.toLowerCase().trim();
        const hash = crypto
            .createHash('md5')
            .update(normalizedProblem)
            .digest('hex')
            .substring(0, 16); // First 16 chars

        // Format: lydian-iq:{hash}:{domain}:{language}
        return `${this.keyPrefix}${hash}:${domain}:${language}`;
    }

    /**
     * Get cached response
     * @param {string} problem - User's problem
     * @param {string} domain - Domain
     * @param {string} language - Language
     * @returns {Promise<Object|null>} Cached response or null
     */
    async get(problem, domain, language) {
        if (!this.enabled) {
            return null;
        }

        try {
            const key = this.generateKey(problem, domain, language);
            const startTime = Date.now();

            const cached = await this.redis.get(key);

            if (cached) {
                const duration = Date.now() - startTime;
                console.log(`[Redis Cache] ✅ HIT - ${key.substring(0, 40)}... (${duration}ms)`);

                // Parse and add cache metadata
                const result = typeof cached === 'string' ? JSON.parse(cached) : cached;
                result.metadata = result.metadata || {};
                result.metadata.cached = true;
                result.metadata.cacheHit = true;

                return result;
            } else {
                console.log(`[Redis Cache] ❌ MISS - ${key.substring(0, 40)}...`);
                return null;
            }
        } catch (error) {
            console.error('[Redis Cache] Error getting cache:', error.message);
            return null;
        }
    }

    /**
     * Set cached response
     * @param {string} problem - User's problem
     * @param {string} domain - Domain
     * @param {string} language - Language
     * @param {Object} response - Response to cache
     * @param {number} ttl - Time to live in seconds (default: 1 hour)
     * @returns {Promise<boolean>} Success status
     */
    async set(problem, domain, language, response, ttl = this.defaultTTL) {
        if (!this.enabled) {
            return false;
        }

        try {
            const key = this.generateKey(problem, domain, language);

            // Add cache metadata
            const cacheData = {
                ...response,
                metadata: {
                    ...(response.metadata || {}),
                    cachedAt: new Date().toISOString(),
                    cacheTTL: ttl
                }
            };

            // Set with TTL (EX = seconds)
            await this.redis.setex(key, ttl, JSON.stringify(cacheData));

            console.log(`[Redis Cache] ✅ SET - ${key.substring(0, 40)}... (TTL: ${ttl}s)`);
            return true;
        } catch (error) {
            console.error('[Redis Cache] Error setting cache:', error.message);
            return false;
        }
    }

    /**
     * Delete cached response (cache invalidation)
     * @param {string} problem - User's problem
     * @param {string} domain - Domain
     * @param {string} language - Language
     * @returns {Promise<boolean>} Success status
     */
    async delete(problem, domain, language) {
        if (!this.enabled) {
            return false;
        }

        try {
            const key = this.generateKey(problem, domain, language);
            await this.redis.del(key);

            console.log(`[Redis Cache] 🗑️ DELETE - ${key.substring(0, 40)}...`);
            return true;
        } catch (error) {
            console.error('[Redis Cache] Error deleting cache:', error.message);
            return false;
        }
    }

    /**
     * Clear all LyDian IQ cache entries
     * WARNING: Use with caution!
     * @returns {Promise<number>} Number of keys deleted
     */
    async clearAll() {
        if (!this.enabled) {
            return 0;
        }

        try {
            // Scan for all keys with our prefix
            const keys = await this.redis.keys(`${this.keyPrefix}*`);

            if (!keys || !Array.isArray(keys) || keys.length === 0) {
                console.log('[Redis Cache] No keys to clear');
                return 0;
            }

            // Delete all keys
            for (const key of keys) {
                await this.redis.del(key);
            }

            console.log(`[Redis Cache] 🗑️ CLEARED ${keys.length} keys`);
            return keys.length;
        } catch (error) {
            console.error('[Redis Cache] Error clearing cache:', error.message);
            return 0;
        }
    }

    /**
     * Get cache statistics
     * @returns {Promise<Object>} Cache stats
     */
    async getStats() {
        if (!this.enabled) {
            return {
                enabled: false,
                message: 'Redis cache is disabled'
            };
        }

        try {
            // Use SCAN instead of KEYS for better performance
            // Note: Upstash REST API may have limitations on KEYS command
            let totalKeys = 0;

            try {
                const keys = await this.redis.keys(`${this.keyPrefix}*`);
                totalKeys = Array.isArray(keys) ? keys.length : 0;
            } catch (keysError) {
                // If KEYS fails, return stats without key count
                console.warn('[Redis Cache] KEYS command failed, returning basic stats');
                totalKeys = 'N/A (SCAN not supported in REST API)';
            }

            return {
                enabled: true,
                totalKeys: totalKeys,
                keyPrefix: this.keyPrefix,
                defaultTTL: this.defaultTTL,
                provider: 'Upstash Redis'
            };
        } catch (error) {
            console.error('[Redis Cache] Error getting stats:', error.message);
            return {
                enabled: true,
                error: error.message
            };
        }
    }
}

// Create singleton instance
const redisCache = new RedisCache();

// Export for use in API routes
module.exports = {
    redisCache,
    RedisCache
};
