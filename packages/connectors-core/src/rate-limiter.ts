// ========================================
// RATE LIMITER - TOKEN BUCKET ALGORITHM
// Per-vendor rate limiting with burst support
// White-Hat: Respect vendor rate limits
// ========================================

import type { TokenBucket } from './types';

/**
 * Token Bucket Rate Limiter
 * Implements token bucket algorithm for smooth rate limiting
 */
export class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();

  constructor(
    private maxRequests: number = 8,          // Default: 8 rps
    private windowMs: number = 1000,          // Default: 1 second
    private burstSize?: number                 // Default: maxRequests * 2
  ) {
    this.burstSize = burstSize || maxRequests * 2;
  }

  /**
   * Get or create bucket for a resource
   */
  private getBucket(key: string): TokenBucket {
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: this.burstSize!,
        lastRefill: Date.now(),
        capacity: this.burstSize!,
        refillRate: this.maxRequests / this.windowMs, // tokens per ms
      };
      this.buckets.set(key, bucket);
    }

    return bucket;
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refillTokens(bucket: TokenBucket): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;

    if (elapsed > 0) {
      const tokensToAdd = elapsed * bucket.refillRate;
      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  /**
   * Attempt to acquire a token
   * Returns true if allowed, false if rate limited
   */
  async acquire(key: string, tokens: number = 1): Promise<boolean> {
    const bucket = this.getBucket(key);

    // Refill tokens
    this.refillTokens(bucket);

    // Check if enough tokens available
    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return true;
    }

    // Rate limited
    console.warn(`[RateLimiter] Rate limit exceeded for key: ${key} (tokens: ${bucket.tokens.toFixed(2)}/${bucket.capacity})`);
    return false;
  }

  /**
   * Wait until token is available (blocking)
   */
  async acquireBlocking(key: string, tokens: number = 1, maxWaitMs: number = 10000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      if (await this.acquire(key, tokens)) {
        return true;
      }

      // Calculate wait time
      const bucket = this.getBucket(key);
      const tokensNeeded = tokens - bucket.tokens;
      const waitMs = Math.min(
        tokensNeeded / bucket.refillRate,
        maxWaitMs - (Date.now() - startTime)
      );

      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }

    console.error(`[RateLimiter] Timeout waiting for token: ${key}`);
    return false;
  }

  /**
   * Get remaining tokens
   */
  getRemaining(key: string): number {
    const bucket = this.getBucket(key);
    this.refillTokens(bucket);
    return Math.floor(bucket.tokens);
  }

  /**
   * Get time until next token available (ms)
   */
  getTimeUntilReset(key: string): number {
    const bucket = this.getBucket(key);
    this.refillTokens(bucket);

    if (bucket.tokens >= 1) {
      return 0;
    }

    const tokensNeeded = 1 - bucket.tokens;
    return tokensNeeded / bucket.refillRate;
  }

  /**
   * Reset bucket (clear rate limit)
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Clear all buckets
   */
  clear(): void {
    this.buckets.clear();
  }

  /**
   * Get stats for monitoring
   */
  getStats(): {
    totalBuckets: number;
    buckets: Array<{
      key: string;
      tokens: number;
      capacity: number;
      utilizationPercent: number;
    }>;
  } {
    const buckets: Array<{
      key: string;
      tokens: number;
      capacity: number;
      utilizationPercent: number;
    }> = [];

    for (const [key, bucket] of this.buckets.entries()) {
      this.refillTokens(bucket);

      buckets.push({
        key,
        tokens: bucket.tokens,
        capacity: bucket.capacity,
        utilizationPercent: ((bucket.capacity - bucket.tokens) / bucket.capacity) * 100,
      });
    }

    return {
      totalBuckets: this.buckets.size,
      buckets,
    };
  }
}

/**
 * Rate Limiter Manager
 * Manages rate limiters for multiple vendors
 */
export class RateLimiterManager {
  private limiters: Map<string, RateLimiter> = new Map();

  /**
   * Create rate limiter for a vendor
   */
  createLimiter(vendorId: string, maxRequests: number, windowMs: number, burstSize?: number): void {
    const limiter = new RateLimiter(maxRequests, windowMs, burstSize);
    this.limiters.set(vendorId, limiter);
    console.log(`🚦 Rate limiter created for ${vendorId}: ${maxRequests} req/${windowMs}ms (burst: ${burstSize || maxRequests * 2})`);
  }

  /**
   * Get rate limiter for vendor
   */
  getLimiter(vendorId: string): RateLimiter | undefined {
    return this.limiters.get(vendorId);
  }

  /**
   * Acquire token for vendor
   */
  async acquire(vendorId: string, tokens: number = 1): Promise<boolean> {
    const limiter = this.getLimiter(vendorId);

    if (!limiter) {
      console.warn(`[RateLimiterManager] No rate limiter found for vendor: ${vendorId}`);
      return true; // Allow by default
    }

    return await limiter.acquire(vendorId, tokens);
  }

  /**
   * Get all stats
   */
  getAllStats(): Record<string, ReturnType<RateLimiter['getStats']>> {
    const stats: Record<string, ReturnType<RateLimiter['getStats']>> = {};

    for (const [vendorId, limiter] of this.limiters.entries()) {
      stats[vendorId] = limiter.getStats();
    }

    return stats;
  }

  /**
   * Clear all limiters
   */
  clear(): void {
    for (const limiter of this.limiters.values()) {
      limiter.clear();
    }
    this.limiters.clear();
  }
}

// Singleton instance
export const rateLimiterManager = new RateLimiterManager();
