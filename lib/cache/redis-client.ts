/**
 * Redis Cache Client
 * High-performance caching layer using Upstash Redis
 */

import { Redis } from '@upstash/redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
}

export class RedisCache {
  private redis: Redis;
  private defaultTTL: number = 300; // 5 minutes default

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error('Redis configuration missing: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
    }

    this.redis = new Redis({
      url,
      token,
      automaticDeserialization: true,
    });
  }

  /**
   * Generate cache key with optional prefix
   */
  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.redis.get<T>(fullKey);
      return value;
    } catch (error) {
      console.error('[Redis] Get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const ttl = options?.ttl || this.defaultTTL;

      await this.redis.setex(fullKey, ttl, value);
      return true;
    } catch (error) {
      console.error('[Redis] Set error:', error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      await this.redis.del(fullKey);
      return true;
    } catch (error) {
      console.error('[Redis] Delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async invalidatePattern(pattern: string, options?: CacheOptions): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern, options?.prefix);
      const keys = await this.redis.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      await this.redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('[Redis] Invalidate pattern error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('[Redis] Exists error:', error);
      return false;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string, options?: CacheOptions): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.redis.incr(fullKey);
    } catch (error) {
      console.error('[Redis] Increment error:', error);
      return 0;
    }
  }

  /**
   * Set expiration time for existing key
   */
  async expire(key: string, seconds: number, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      await this.redis.expire(fullKey, seconds);
      return true;
    } catch (error) {
      console.error('[Redis] Expire error:', error);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T = any>(keys: string[], options?: CacheOptions): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map(key => this.buildKey(key, options?.prefix));
      return await this.redis.mget<T>(...fullKeys);
    } catch (error) {
      console.error('[Redis] Mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset(entries: Record<string, any>, options?: CacheOptions): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      const ttl = options?.ttl || this.defaultTTL;

      for (const [key, value] of Object.entries(entries)) {
        const fullKey = this.buildKey(key, options?.prefix);
        pipeline.setex(fullKey, ttl, value);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('[Redis] Mset error:', error);
      return false;
    }
  }

  /**
   * Get cache stats (for monitoring)
   */
  async getStats(): Promise<{ hits: number; misses: number; keys: number } | null> {
    try {
      const info = await this.redis.info();
      // Parse Redis INFO output for stats
      return {
        hits: 0, // Would need to track this separately
        misses: 0,
        keys: (await this.redis.dbsize()) || 0,
      };
    } catch (error) {
      console.error('[Redis] Stats error:', error);
      return null;
    }
  }

  /**
   * Flush all keys (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      console.error('[Redis] Flush error:', error);
      return false;
    }
  }

  /**
   * Ping Redis server
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('[Redis] Ping error:', error);
      return false;
    }
  }
}

// Singleton instance
let cacheInstance: RedisCache | null = null;

/**
 * Get or create cache instance
 */
export function getCache(): RedisCache {
  if (!cacheInstance) {
    cacheInstance = new RedisCache();
  }
  return cacheInstance;
}

// Export default instance
export const cache = getCache();
