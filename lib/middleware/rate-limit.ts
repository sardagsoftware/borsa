import { NextRequest } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimit {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    const pathname = request.nextUrl.pathname;
    return `${ip}:${pathname}`;
  }

  check(request: NextRequest): { 
    allowed: boolean; 
    remaining: number; 
    resetTime: number;
    headers: Record<string, string>;
  } {
    const key = this.getKey(request);
    const now = Date.now();
    
    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: this.store[key].resetTime,
        headers: this.getHeaders(this.config.maxRequests - 1, this.store[key].resetTime)
      };
    }

    this.store[key].count++;
    const remaining = Math.max(0, this.config.maxRequests - this.store[key].count);
    const allowed = this.store[key].count <= this.config.maxRequests;

    return {
      allowed,
      remaining,
      resetTime: this.store[key].resetTime,
      headers: this.getHeaders(remaining, this.store[key].resetTime)
    };
  }

  private getHeaders(remaining: number, resetTime: number): Record<string, string> {
    return {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
      'X-RateLimit-Window': Math.ceil(this.config.windowMs / 1000).toString()
    };
  }
}

// Pre-configured rate limiters for different endpoints
export const apiRateLimit = new RateLimit({
  maxRequests: 100, // 100 requests
  windowMs: 15 * 60 * 1000, // per 15 minutes
});

export const aiRateLimit = new RateLimit({
  maxRequests: 30, // 30 AI requests
  windowMs: 5 * 60 * 1000, // per 5 minutes
});

export const tradeRateLimit = new RateLimit({
  maxRequests: 50, // 50 trade operations
  windowMs: 10 * 60 * 1000, // per 10 minutes
});

export const authRateLimit = new RateLimit({
  maxRequests: 10, // 10 auth attempts
  windowMs: 15 * 60 * 1000, // per 15 minutes
});

export { RateLimit, type RateLimitConfig };
