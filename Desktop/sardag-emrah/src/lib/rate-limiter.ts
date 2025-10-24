/**
 * RATE LIMITER
 *
 * Simple in-memory rate limiter using sliding window algorithm
 * Tracks requests per IP address
 */

interface RateLimitConfig {
  interval: number; // milliseconds
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

class RateLimiter {
  private requests: Map<string, number[]>;
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.requests = new Map();

    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Check if request is allowed
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Filter out old requests (outside the time window)
    const validRequests = requests.filter(
      time => now - time < this.config.interval
    );

    const allowed = validRequests.length < this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - validRequests.length);

    // Calculate reset time (when oldest request expires)
    const resetAt = validRequests.length > 0
      ? validRequests[0] + this.config.interval
      : now + this.config.interval;

    const retryAfter = allowed ? undefined : Math.ceil((resetAt - now) / 1000);

    // If allowed, add this request
    if (allowed) {
      validRequests.push(now);
      this.requests.set(key, validRequests);
    }

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter
    };
  }

  /**
   * Clear rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, requests] of this.requests.entries()) {
      // If all requests are older than the interval, delete the key
      const hasValidRequests = requests.some(
        time => now - time < this.config.interval
      );

      if (!hasValidRequests) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.requests.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`[Rate Limiter] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Destroy the rate limiter and cleanup intervals
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requests.clear();
  }
}

// Singleton instances
let scannerLimiterInstance: RateLimiter | null = null;
let binanceLimiterInstance: RateLimiter | null = null;

/**
 * Get Scanner API rate limiter
 * 10 requests per 5 minutes per IP
 */
export function getScannerLimiter(): RateLimiter {
  if (!scannerLimiterInstance) {
    scannerLimiterInstance = new RateLimiter({
      interval: 5 * 60 * 1000, // 5 minutes
      maxRequests: 10
    });
  }
  return scannerLimiterInstance;
}

/**
 * Get Binance API rate limiter
 * Respect Binance's limit: 1200 req/min
 */
export function getBinanceLimiter(): RateLimiter {
  if (!binanceLimiterInstance) {
    binanceLimiterInstance = new RateLimiter({
      interval: 60 * 1000, // 1 minute
      maxRequests: 1200
    });
  }
  return binanceLimiterInstance;
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Try various headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;

  // Fallback
  return 'unknown';
}
