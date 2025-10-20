/**
 * SHARD_4.1 - Redis Client Setup
 * Store-and-forward message delivery using Redis
 *
 * Security: Redis passwords, TLS connections in production
 * White Hat: Connection pooling, error handling, graceful shutdown
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

/**
 * Redis configuration
 * In production: Use Upstash Redis or Redis Cloud with TLS
 */
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: false,
};

/**
 * Get Redis client (singleton)
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_CONFIG);

    redisClient.on('connect', () => {
      console.log('[REDIS] ✅ Connected');
    });

    redisClient.on('error', (err) => {
      console.error('[REDIS] ❌ Error:', err.message);
    });

    redisClient.on('close', () => {
      console.log('[REDIS] ⚠️ Connection closed');
    });
  }

  return redisClient;
}

/**
 * Get Redis subscriber (separate connection for pub/sub)
 */
export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    redisSubscriber = new Redis(REDIS_CONFIG);

    redisSubscriber.on('connect', () => {
      console.log('[REDIS-SUB] ✅ Subscriber connected');
    });

    redisSubscriber.on('error', (err) => {
      console.error('[REDIS-SUB] ❌ Error:', err.message);
    });
  }

  return redisSubscriber;
}

/**
 * Check Redis connection health
 */
export async function checkRedisHealth(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const client = getRedisClient();
    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;

    return {
      connected: true,
      latency
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * Close Redis connections (graceful shutdown)
 */
export async function closeRedisConnections(): Promise<void> {
  const promises: Promise<void>[] = [];

  if (redisClient) {
    promises.push(
      redisClient.quit().then(() => {
        console.log('[REDIS] ✅ Client closed');
        redisClient = null;
      })
    );
  }

  if (redisSubscriber) {
    promises.push(
      redisSubscriber.quit().then(() => {
        console.log('[REDIS-SUB] ✅ Subscriber closed');
        redisSubscriber = null;
      })
    );
  }

  await Promise.all(promises);
}

/**
 * Key prefixes for different queue types
 */
export const REDIS_KEYS = {
  MESSAGE_QUEUE: (recipientId: string) => `msg:queue:${recipientId}`,
  MESSAGE_ENVELOPE: (messageId: string) => `msg:envelope:${messageId}`,
  DELIVERY_RECEIPT: (messageId: string) => `msg:receipt:${messageId}`,
  DEVICE_PRESENCE: (deviceId: string) => `device:presence:${deviceId}`,
  TYPING_INDICATOR: (chatId: string) => `typing:${chatId}`,
  RATE_LIMIT: (userId: string) => `ratelimit:${userId}`,
} as const;

/**
 * Set value with TTL
 */
export async function setWithTTL(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  const client = getRedisClient();
  await client.setex(key, ttlSeconds, value);
}

/**
 * Get value
 */
export async function get(key: string): Promise<string | null> {
  const client = getRedisClient();
  return await client.get(key);
}

/**
 * Delete key
 */
export async function del(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.del(key);
}

/**
 * Check if key exists
 */
export async function exists(key: string): Promise<boolean> {
  const client = getRedisClient();
  const result = await client.exists(key);
  return result === 1;
}

/**
 * Get remaining TTL
 */
export async function ttl(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.ttl(key);
}
