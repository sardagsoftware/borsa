/**
 * Redis Adapter - Token Governor Phase E
 * Distributed state management for token buckets and job queues
 * Compatible with Upstash Redis for serverless environments
 */

const Redis = require('ioredis');
const tokenBudget = require('../../configs/token-budget.json');

class RedisAdapter {
    constructor(options = {}) {
        this.redisUrl = options.redisUrl || process.env.REDIS_URL || tokenBudget.governor.redis_url;

        if (!this.redisUrl || this.redisUrl === '${REDIS_URL}') {
            console.warn('[RedisAdapter] REDIS_URL not configured, using in-memory fallback');
            this.useFallback = true;
            this.memoryStore = new Map();
        } else {
            this.client = new Redis(this.redisUrl, {
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });

            this.client.on('error', (error) => {
                console.error('[RedisAdapter] Connection error:', error);
            });

            this.client.on('connect', () => {
                console.log('[RedisAdapter] Connected to Redis');
            });

            this.useFallback = false;
        }

        this.keyPrefix = options.keyPrefix || 'token-governor:';
    }

    /**
     * Get value from Redis or fallback
     */
    async get(key) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            return this.memoryStore.get(fullKey) || null;
        }

        try {
            return await this.client.get(fullKey);
        } catch (error) {
            console.error(`[RedisAdapter] GET failed for ${fullKey}:`, error);
            return null;
        }
    }

    /**
     * Set value in Redis or fallback
     */
    async set(key, value, ttlSeconds = null) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            this.memoryStore.set(fullKey, value);
            if (ttlSeconds) {
                setTimeout(() => this.memoryStore.delete(fullKey), ttlSeconds * 1000);
            }
            return 'OK';
        }

        try {
            if (ttlSeconds) {
                return await this.client.setex(fullKey, ttlSeconds, value);
            } else {
                return await this.client.set(fullKey, value);
            }
        } catch (error) {
            console.error(`[RedisAdapter] SET failed for ${fullKey}:`, error);
            return null;
        }
    }

    /**
     * Increment value (atomic)
     */
    async incr(key) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            const current = parseInt(this.memoryStore.get(fullKey) || '0');
            const newValue = current + 1;
            this.memoryStore.set(fullKey, newValue.toString());
            return newValue;
        }

        try {
            return await this.client.incr(fullKey);
        } catch (error) {
            console.error(`[RedisAdapter] INCR failed for ${fullKey}:`, error);
            return null;
        }
    }

    /**
     * Decrement value (atomic)
     */
    async decr(key) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            const current = parseInt(this.memoryStore.get(fullKey) || '0');
            const newValue = Math.max(0, current - 1);
            this.memoryStore.set(fullKey, newValue.toString());
            return newValue;
        }

        try {
            return await this.client.decr(fullKey);
        } catch (error) {
            console.error(`[RedisAdapter] DECR failed for ${fullKey}:`, error);
            return null;
        }
    }

    /**
     * Increment by specific amount (atomic)
     */
    async incrBy(key, amount) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            const current = parseInt(this.memoryStore.get(fullKey) || '0');
            const newValue = current + amount;
            this.memoryStore.set(fullKey, newValue.toString());
            return newValue;
        }

        try {
            return await this.client.incrby(fullKey, amount);
        } catch (error) {
            console.error(`[RedisAdapter] INCRBY failed for ${fullKey}:`, error);
            return null;
        }
    }

    /**
     * Decrement by specific amount (atomic)
     */
    async decrBy(key, amount) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            const current = parseInt(this.memoryStore.get(fullKey) || '0');
            const newValue = Math.max(0, current - amount);
            this.memoryStore.set(fullKey, newValue.toString());
            return newValue;
        }

        try {
            return await this.client.decrby(fullKey, amount);
        } catch (error) {
            console.error(`[RedisAdapter] DECRBY failed for ${fullKey}:`, error);
            return null;
        }
    }

    /**
     * Delete key
     */
    async del(key) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            return this.memoryStore.delete(fullKey) ? 1 : 0;
        }

        try {
            return await this.client.del(fullKey);
        } catch (error) {
            console.error(`[RedisAdapter] DEL failed for ${fullKey}:`, error);
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            return this.memoryStore.has(fullKey) ? 1 : 0;
        }

        try {
            return await this.client.exists(fullKey);
        } catch (error) {
            console.error(`[RedisAdapter] EXISTS failed for ${fullKey}:`, error);
            return 0;
        }
    }

    /**
     * Set expiration on key
     */
    async expire(key, ttlSeconds) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            setTimeout(() => this.memoryStore.delete(fullKey), ttlSeconds * 1000);
            return 1;
        }

        try {
            return await this.client.expire(fullKey, ttlSeconds);
        } catch (error) {
            console.error(`[RedisAdapter] EXPIRE failed for ${fullKey}:`, error);
            return 0;
        }
    }

    /**
     * Get multiple keys
     */
    async mget(keys) {
        const fullKeys = keys.map(k => this.keyPrefix + k);

        if (this.useFallback) {
            return fullKeys.map(k => this.memoryStore.get(k) || null);
        }

        try {
            return await this.client.mget(fullKeys);
        } catch (error) {
            console.error('[RedisAdapter] MGET failed:', error);
            return keys.map(() => null);
        }
    }

    /**
     * Push to list (queue)
     */
    async rpush(key, value) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            const list = JSON.parse(this.memoryStore.get(fullKey) || '[]');
            list.push(value);
            this.memoryStore.set(fullKey, JSON.stringify(list));
            return list.length;
        }

        try {
            return await this.client.rpush(fullKey, value);
        } catch (error) {
            console.error(`[RedisAdapter] RPUSH failed for ${fullKey}:`, error);
            return 0;
        }
    }

    /**
     * Pop from list (queue)
     */
    async lpop(key) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            const list = JSON.parse(this.memoryStore.get(fullKey) || '[]');
            if (list.length === 0) return null;
            const value = list.shift();
            this.memoryStore.set(fullKey, JSON.stringify(list));
            return value;
        }

        try {
            return await this.client.lpop(fullKey);
        } catch (error) {
            console.error(`[RedisAdapter] LPOP failed for ${fullKey}:`, error);
            return null;
        }
    }

    /**
     * Blocking pop from list (wait for job)
     */
    async blpop(key, timeoutSeconds = 0) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            // Fallback doesn't support blocking, use simple lpop
            return await this.lpop(key);
        }

        try {
            const result = await this.client.blpop(fullKey, timeoutSeconds);
            return result ? result[1] : null; // blpop returns [key, value]
        } catch (error) {
            console.error(`[RedisAdapter] BLPOP failed for ${fullKey}:`, error);
            return null;
        }
    }

    /**
     * Get list length
     */
    async llen(key) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            const list = JSON.parse(this.memoryStore.get(fullKey) || '[]');
            return list.length;
        }

        try {
            return await this.client.llen(fullKey);
        } catch (error) {
            console.error(`[RedisAdapter] LLEN failed for ${fullKey}:`, error);
            return 0;
        }
    }

    /**
     * Get hash field
     */
    async hget(key, field) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            const hash = JSON.parse(this.memoryStore.get(fullKey) || '{}');
            return hash[field] || null;
        }

        try {
            return await this.client.hget(fullKey, field);
        } catch (error) {
            console.error(`[RedisAdapter] HGET failed for ${fullKey}:`, error);
            return null;
        }
    }

    /**
     * Set hash field
     */
    async hset(key, field, value) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            const hash = JSON.parse(this.memoryStore.get(fullKey) || '{}');
            hash[field] = value;
            this.memoryStore.set(fullKey, JSON.stringify(hash));
            return 1;
        }

        try {
            return await this.client.hset(fullKey, field, value);
        } catch (error) {
            console.error(`[RedisAdapter] HSET failed for ${fullKey}:`, error);
            return 0;
        }
    }

    /**
     * Get all hash fields
     */
    async hgetall(key) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            return JSON.parse(this.memoryStore.get(fullKey) || '{}');
        }

        try {
            return await this.client.hgetall(fullKey);
        } catch (error) {
            console.error(`[RedisAdapter] HGETALL failed for ${fullKey}:`, error);
            return {};
        }
    }

    /**
     * Increment hash field
     */
    async hincrby(key, field, amount) {
        const fullKey = this.keyPrefix + key;

        if (this.useFallback) {
            const hash = JSON.parse(this.memoryStore.get(fullKey) || '{}');
            hash[field] = (parseInt(hash[field] || 0)) + amount;
            this.memoryStore.set(fullKey, JSON.stringify(hash));
            return hash[field];
        }

        try {
            return await this.client.hincrby(fullKey, field, amount);
        } catch (error) {
            console.error(`[RedisAdapter] HINCRBY failed for ${fullKey}:`, error);
            return null;
        }
    }

    /**
     * Close connection
     */
    async close() {
        if (!this.useFallback && this.client) {
            await this.client.quit();
            console.log('[RedisAdapter] Connection closed');
        }
    }

    /**
     * Ping server
     */
    async ping() {
        if (this.useFallback) {
            return 'PONG (in-memory fallback)';
        }

        try {
            return await this.client.ping();
        } catch (error) {
            console.error('[RedisAdapter] PING failed:', error);
            return null;
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            useFallback: this.useFallback,
            connected: this.useFallback ? true : (this.client?.status === 'ready'),
            redisUrl: this.useFallback ? 'IN_MEMORY_FALLBACK' : this.redisUrl?.replace(/:[^:]*@/, ':****@'), // Mask password
            keyPrefix: this.keyPrefix
        };
    }
}

module.exports = RedisAdapter;
