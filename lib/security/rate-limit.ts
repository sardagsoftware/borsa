import { NextRequest } from 'next/server';
import { Redis } from 'ioredis';

// Redis client for production rate limiting
let redis: Redis | null = null;

try {
  if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    redis = new Redis(process.env.REDIS_URL);
    redis.on('error', (err) => {
      console.warn('Redis connection error:', err);
      redis = null;
    });
  }
} catch (error) {
  console.warn('Redis initialization failed, using memory-based rate limiting:', error);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
  onLimitReached?: (key: string, request: NextRequest) => void;
}

class MemoryStore {
  private hits = new Map<string, { count: number; resetTime: Date }>();
  private timers = new Map<string, NodeJS.Timeout>();

  increment(key: string, windowMs: number): { totalHits: number; resetTime: Date } {
    const now = new Date();
    const resetTime = new Date(now.getTime() + windowMs);
    
    // Clean up expired entries
    this.cleanup();
    
    // Get or create entry
    let entry = this.hits.get(key);
    if (!entry || entry.resetTime <= now) {
      // Create new entry
      entry = { count: 1, resetTime };
      this.hits.set(key, entry);
      
      // Set cleanup timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
      }
      
      this.timers.set(key, setTimeout(() => {
        this.hits.delete(key);
        this.timers.delete(key);
      }, windowMs));
      
      return { totalHits: 1, resetTime };
    }
    
    // Increment existing entry
    entry.count++;
    return { totalHits: entry.count, resetTime: entry.resetTime };
  }
  
  private cleanup() {
    const now = new Date();
    for (const [key, entry] of this.hits.entries()) {
      if (entry.resetTime <= now) {
        this.hits.delete(key);
        if (this.timers.has(key)) {
          clearTimeout(this.timers.get(key)!);
          this.timers.delete(key);
        }
      }
    }
  }
  
  reset(key: string) {
    this.hits.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
  }
}

class RedisStore {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  async increment(key: string, windowMs: number): Promise<{ totalHits: number; resetTime: Date }> {
    const now = Date.now();
    const resetTime = new Date(now + windowMs);
    const windowStart = now - windowMs;

    try {
      const pipeline = this.redis.pipeline();
      
      // Remove expired entries and add current request
      pipeline.zremrangebyscore(key, '-inf', windowStart);
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      pipeline.zcard(key);
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      const totalHits = (results?.[2]?.[1] as number) || 1;
      
      return { totalHits, resetTime };
    } catch (error) {
      console.warn('Redis increment failed:', error);
      throw error;
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.warn('Redis reset failed:', error);
    }
  }
}

const memoryStore = new MemoryStore();
let redisStore: RedisStore | null = null;

if (redis) {
  redisStore = new RedisStore(redis);
}

function defaultKeyGenerator(request: NextRequest): string {
  // Combine IP and User-Agent for better fingerprinting
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Simple hash to create consistent key
  const combined = `${ip}:${userAgent}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `ratelimit:${Math.abs(hash)}`;
}

export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
    onLimitReached
  } = config;

  return async function rateLimiter(request: NextRequest): Promise<RateLimitResult> {
    const key = keyGenerator(request);
    
    try {
      // Try Redis first for production
      let totalHits: number;
      let resetTime: Date;
      
      if (redisStore) {
        const result = await redisStore.increment(key, windowMs);
        totalHits = result.totalHits;
        resetTime = result.resetTime;
      } else {
        // Fallback to memory store
        const result = memoryStore.increment(key, windowMs);
        totalHits = result.totalHits;
        resetTime = result.resetTime;
      }
      
      const isLimitExceeded = totalHits > maxRequests;
      const remaining = Math.max(0, maxRequests - totalHits);
      
      if (isLimitExceeded) {
        onLimitReached?.(key, request);
        
        // Calculate retry-after in seconds
        const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
        
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          resetTime,
          retryAfter
        };
      }
      
      return {
        success: true,
        limit: maxRequests,
        remaining,
        resetTime
      };
    } catch (error) {
      console.warn('Rate limiter error, falling back to memory store:', error);
      
      // Fallback to memory store on Redis failure
      const { totalHits, resetTime } = memoryStore.increment(key, windowMs);
      const isLimitExceeded = totalHits > maxRequests;
      const remaining = Math.max(0, maxRequests - totalHits);
      
      if (isLimitExceeded) {
        onLimitReached?.(key, request);
        const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
        
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          resetTime,
          retryAfter
        };
      }
      
      return {
        success: true,
        limit: maxRequests,
        remaining,
        resetTime
      };
    }
  };
}

// Pre-configured rate limiters
export const captchaRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // Max 10 captcha attempts per minute per user
  onLimitReached: (key, request) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    console.warn(`CAPTCHA rate limit exceeded for key: ${key.slice(0, 20)}..., IP: ${ip}`);
  }
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Max 5 login attempts per 15 minutes
  onLimitReached: (key, request) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    console.warn(`Auth rate limit exceeded for key: ${key.slice(0, 20)}..., IP: ${ip}`);
  }
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute  
  maxRequests: 100, // Max 100 API requests per minute
  onLimitReached: (key, request) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    console.warn(`API rate limit exceeded for key: ${key.slice(0, 20)}..., IP: ${ip}`);
  }
});

// DDOS Protection Rate Limiter
export const ddosRateLimiter = createRateLimiter({
  windowMs: 10 * 1000, // 10 seconds
  maxRequests: 20, // Max 20 requests per 10 seconds
  onLimitReached: (key, request) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    console.error(`DDOS protection triggered for key: ${key.slice(0, 20)}..., IP: ${ip}`);
  }
});

// Strict Rate Limiter for sensitive endpoints
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3, // Max 3 requests per minute
  onLimitReached: (key, request) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    console.warn(`Strict rate limit exceeded for key: ${key.slice(0, 20)}..., IP: ${ip}`);
  }
});

// Adaptive rate limiter class
export class AdaptiveRateLimiter {
  private baseConfig: RateLimitConfig;
  private suspiciousIPs = new Set<string>();
  private attackPatterns = new Map<string, number>();
  
  constructor(baseConfig: RateLimitConfig) {
    this.baseConfig = baseConfig;
  }

  async limit(request: NextRequest): Promise<RateLimitResult> {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown';

    // Detect attack patterns
    this.detectAttackPattern(ip);
    
    // Adjust limits based on IP reputation
    let config = { ...this.baseConfig };
    
    if (this.suspiciousIPs.has(ip)) {
      config.maxRequests = Math.max(1, Math.floor(config.maxRequests * 0.3)); // 70% reduction
      config.windowMs = config.windowMs * 3; // Triple the window
    }

    const limiter = createRateLimiter(config);
    const result = await limiter(request);

    // Mark IP as suspicious if rate limited multiple times
    if (!result.success) {
      const count = this.attackPatterns.get(ip) || 0;
      this.attackPatterns.set(ip, count + 1);
      
      if (count >= 3) {
        this.suspiciousIPs.add(ip);
        console.warn(`IP ${ip} marked as suspicious after ${count + 1} rate limit violations`);
        
        // Remove from suspicious list after 2 hours
        setTimeout(() => {
          this.suspiciousIPs.delete(ip);
          this.attackPatterns.delete(ip);
        }, 2 * 60 * 60 * 1000);
      }
    }

    return result;
  }

  private detectAttackPattern(ip: string): void {
    // Clean up old attack patterns (older than 1 hour)
    const cleanupInterval = 60 * 60 * 1000; // 1 hour
    setTimeout(() => {
      if (this.attackPatterns.has(ip)) {
        const count = this.attackPatterns.get(ip) || 0;
        if (count > 0) {
          this.attackPatterns.set(ip, Math.max(0, count - 1));
        }
      }
    }, cleanupInterval);
  }

  isSuspicious(ip: string): boolean {
    return this.suspiciousIPs.has(ip);
  }

  getAttackCount(ip: string): number {
    return this.attackPatterns.get(ip) || 0;
  }
}

// Create adaptive rate limiter instances
export const adaptiveAuthLimiter = new AdaptiveRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
});

export const adaptiveApiLimiter = new AdaptiveRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
});

// Utility function to apply rate limiter and return appropriate headers
export function withRateLimit<T>(rateLimiter: (request: NextRequest) => Promise<RateLimitResult>) {
  return async function middleware(
    request: NextRequest, 
    handler: (request: NextRequest) => Promise<T>
  ): Promise<{ result?: T; rateLimitResult: RateLimitResult }> {
    const rateLimitResult = await rateLimiter(request);
    
    if (!rateLimitResult.success) {
      return { rateLimitResult };
    }
    
    const result = await handler(request);
    return { result, rateLimitResult };
  };
}
