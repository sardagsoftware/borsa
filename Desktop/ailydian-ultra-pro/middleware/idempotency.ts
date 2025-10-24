/**
 * ============================================================================
 * IDEMPOTENCY MIDDLEWARE
 * ============================================================================
 * Purpose: Prevent duplicate writes during Azure migration
 * Features:
 * - Idempotency key validation (UUID v4)
 * - Redis-based deduplication
 * - 24-hour key retention
 * - Automatic retry detection
 * White-Hat: Zero data loss, zero duplicate writes
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';
import crypto from 'crypto';

interface IdempotencyConfig {
  redisUrl: string;
  keyPrefix: string;
  ttlSeconds: number;
  requiredMethods: string[];
}

interface IdempotentRequest extends Request {
  idempotencyKey?: string;
  isRetry?: boolean;
}

class IdempotencyMiddleware {
  private redisClient: RedisClientType | null = null;
  private config: IdempotencyConfig;
  private memoryStore: Map<string, { response: any; timestamp: number }>;

  constructor(config: Partial<IdempotencyConfig> = {}) {
    this.config = {
      redisUrl: config.redisUrl || process.env.REDIS_URL || '',
      keyPrefix: config.keyPrefix || 'idempotency:',
      ttlSeconds: config.ttlSeconds || 86400, // 24 hours
      requiredMethods: config.requiredMethods || ['POST', 'PUT', 'PATCH', 'DELETE']
    };

    this.memoryStore = new Map();
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    if (!this.config.redisUrl) {
      console.warn('⚠️  Idempotency: Redis URL not configured, using memory store');
      return;
    }

    try {
      this.redisClient = createClient({ url: this.config.redisUrl });

      this.redisClient.on('error', (err) => {
        console.error('❌ Idempotency Redis error:', err);
        this.redisClient = null;
      });

      this.redisClient.on('connect', () => {
        console.log('✅ Idempotency: Redis connected');
      });

      await this.redisClient.connect();
    } catch (error) {
      console.error('❌ Idempotency: Failed to connect to Redis:', error);
      this.redisClient = null;
    }
  }

  /**
   * Express middleware function
   */
  public middleware() {
    return async (req: IdempotentRequest, res: Response, next: NextFunction): Promise<void> => {
      // Skip if method doesn't require idempotency
      if (!this.config.requiredMethods.includes(req.method)) {
        return next();
      }

      // Extract idempotency key from header
      const idempotencyKey = req.headers['idempotency-key'] as string;

      if (!idempotencyKey) {
        res.status(400).json({
          error: 'Idempotency-Key header required for this operation',
          code: 'IDEMPOTENCY_KEY_REQUIRED'
        });
        return;
      }

      // Validate idempotency key format (UUID v4)
      if (!this.isValidUUID(idempotencyKey)) {
        res.status(400).json({
          error: 'Idempotency-Key must be a valid UUID v4',
          code: 'INVALID_IDEMPOTENCY_KEY'
        });
        return;
      }

      req.idempotencyKey = idempotencyKey;

      // Check if this request was already processed
      const cachedResponse = await this.getCachedResponse(idempotencyKey);

      if (cachedResponse) {
        console.log(`🔄 Idempotency: Returning cached response for key ${idempotencyKey}`);
        req.isRetry = true;

        // Return the exact same response as before
        res.status(cachedResponse.statusCode).json(cachedResponse.body);
        return;
      }

      // Intercept response to cache it
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      res.json = (body: any) => {
        this.cacheResponse(idempotencyKey, res.statusCode, body);
        return originalJson(body);
      };

      res.send = (body: any) => {
        this.cacheResponse(idempotencyKey, res.statusCode, body);
        return originalSend(body);
      };

      next();
    };
  }

  /**
   * Generate a new idempotency key (UUID v4)
   */
  public static generateKey(): string {
    return crypto.randomUUID();
  }

  /**
   * Validate UUID v4 format
   */
  private isValidUUID(key: string): boolean {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Regex.test(key);
  }

  /**
   * Get cached response from Redis or memory
   */
  private async getCachedResponse(key: string): Promise<any> {
    const redisKey = `${this.config.keyPrefix}${key}`;

    // Try Redis first
    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(redisKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.error('❌ Idempotency: Redis get error:', error);
      }
    }

    // Fallback to memory store
    const memCached = this.memoryStore.get(redisKey);
    if (memCached) {
      // Check if expired (24 hours)
      const isExpired = Date.now() - memCached.timestamp > this.config.ttlSeconds * 1000;
      if (!isExpired) {
        return memCached.response;
      } else {
        this.memoryStore.delete(redisKey);
      }
    }

    return null;
  }

  /**
   * Cache response in Redis or memory
   */
  private async cacheResponse(key: string, statusCode: number, body: any): Promise<void> {
    const redisKey = `${this.config.keyPrefix}${key}`;
    const response = {
      statusCode,
      body,
      timestamp: Date.now()
    };

    // Try Redis first
    if (this.redisClient) {
      try {
        await this.redisClient.setEx(
          redisKey,
          this.config.ttlSeconds,
          JSON.stringify(response)
        );
        return;
      } catch (error) {
        console.error('❌ Idempotency: Redis set error:', error);
      }
    }

    // Fallback to memory store
    this.memoryStore.set(redisKey, response);

    // Cleanup old entries from memory (every 100 entries)
    if (this.memoryStore.size % 100 === 0) {
      this.cleanupMemoryStore();
    }
  }

  /**
   * Cleanup expired entries from memory store
   */
  private cleanupMemoryStore(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, value] of this.memoryStore.entries()) {
      if (now - value.timestamp > this.config.ttlSeconds * 1000) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.memoryStore.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`🧹 Idempotency: Cleaned up ${expiredKeys.length} expired keys from memory`);
    }
  }

  /**
   * Disconnect Redis client
   */
  public async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

// Export singleton instance
export const idempotency = new IdempotencyMiddleware();

// Export class for custom configurations
export { IdempotencyMiddleware };

// Export helper functions
export function generateIdempotencyKey(): string {
  return IdempotencyMiddleware.generateKey();
}

// Example usage:
// app.post('/api/critical-operation', idempotency.middleware(), handler);
