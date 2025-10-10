/**
 * LyDian Rate Limiting & DDoS Protection
 *
 * Features:
 * - Token bucket algorithm
 * - Role-based rate limits
 * - IP-based throttling
 * - Distributed rate limiting (Redis-ready)
 * - Adaptive throttling under attack
 * - Cost-based rate limiting for AI endpoints
 *
 * @version 2.1.0
 */

const crypto = require('crypto');

/**
 * In-memory rate limit store (use Redis in production)
 */
class RateLimitStore {
  constructor() {
    this.buckets = new Map();
    this.cleanup();
  }

  /**
   * Get or create bucket for key
   */
  getBucket(key, maxTokens, refillRate) {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: maxTokens,
        maxTokens,
        refillRate,
        lastRefill: Date.now()
      });
    }

    const bucket = this.buckets.get(key);

    // Refill tokens based on time elapsed
    const now = Date.now();
    const timePassed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * bucket.refillRate;

    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    return bucket;
  }

  /**
   * Try to consume tokens from bucket
   */
  tryConsume(key, tokens, maxTokens, refillRate) {
    const bucket = this.getBucket(key, maxTokens, refillRate);

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAt: new Date(bucket.lastRefill + ((bucket.maxTokens - bucket.tokens) / bucket.refillRate) * 1000)
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(bucket.lastRefill + ((bucket.maxTokens - bucket.tokens) / bucket.refillRate) * 1000),
      retryAfter: Math.ceil((tokens - bucket.tokens) / bucket.refillRate)
    };
  }

  /**
   * Cleanup old buckets periodically
   */
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      const maxAge = 3600000; // 1 hour

      for (const [key, bucket] of this.buckets.entries()) {
        if (now - bucket.lastRefill > maxAge && bucket.tokens >= bucket.maxTokens) {
          this.buckets.delete(key);
        }
      }
    }, 300000); // Clean every 5 minutes
  }
}

const store = new RateLimitStore();

/**
 * Rate limit configurations by role
 */
const RATE_LIMITS = {
  GUEST: {
    requests: 100,
    window: 3600, // 1 hour in seconds
    concurrent: 5
  },
  USER: {
    requests: 1000,
    window: 3600,
    concurrent: 10
  },
  DEVELOPER: {
    requests: 5000,
    window: 3600,
    concurrent: 20
  },
  PREMIUM: {
    requests: 50000,
    window: 3600,
    concurrent: 50
  },
  ENTERPRISE: {
    requests: 500000,
    window: 3600,
    concurrent: 100
  },
  ADMIN: {
    requests: 1000000,
    window: 3600,
    concurrent: 200
  }
};

/**
 * Cost-based rate limiting for AI endpoints
 * Different AI operations have different "costs"
 */
const AI_COSTS = {
  'smart-cities': {
    query: 1,
    analytics: 5,
    prediction: 10,
    training: 100
  },
  'insan-iq': {
    emotion: 2,
    empathy: 3,
    conversation: 5,
    crisis: 10
  },
  'lydian-iq': {
    document: 10,
    contract: 20,
    compliance: 15,
    research: 25
  }
};

/**
 * Main rate limiting middleware
 */
function rateLimiter(options = {}) {
  const {
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req, res, next) => {
    // Skip rate limiting in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    if (isDevelopment) {
      return next();
    }

    try {
      const user = req.user || { role: 'GUEST', id: 'anonymous' };
      const limits = RATE_LIMITS[user.role] || RATE_LIMITS.GUEST;

      // Generate unique key for this user/IP
      const key = keyGenerator(req);

      // Calculate refill rate (tokens per second)
      const refillRate = limits.requests / limits.window;

      // Try to consume 1 token
      const result = store.tryConsume(key, 1, limits.requests, refillRate);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limits.requests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter);
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
          limit: limits.requests,
          window: `${limits.window}s`,
          resetAt: result.resetAt,
          retryAfter: result.retryAfter
        });
      }

      // If skipSuccessfulRequests, refund token on success
      if (skipSuccessfulRequests) {
        const originalSend = res.send;
        res.send = function (data) {
          if (res.statusCode < 400) {
            const bucket = store.getBucket(key, limits.requests, refillRate);
            bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + 1);
          }
          return originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next(); // Fail open - allow request on error
    }
  };
}

/**
 * Default key generator (user ID + IP)
 */
function defaultKeyGenerator(req) {
  const userId = req.user?.id || 'anonymous';
  const ip = getClientIP(req);
  return `ratelimit:${userId}:${ip}`;
}

/**
 * Cost-based rate limiter for AI endpoints
 */
function aiRateLimiter(module, operation) {
  return async (req, res, next) => {
    try {
      const user = req.user || { role: 'GUEST', id: 'anonymous' };
      const limits = RATE_LIMITS[user.role] || RATE_LIMITS.GUEST;

      // Calculate AI operation cost
      const cost = AI_COSTS[module]?.[operation] || 1;

      const key = `ai:${user.id}:${module}`;
      const refillRate = limits.requests / limits.window;

      const result = store.tryConsume(key, cost, limits.requests * 10, refillRate);

      res.setHeader('X-AI-Cost', cost);
      res.setHeader('X-AI-Credits-Remaining', result.remaining);
      res.setHeader('X-AI-Credits-Reset', result.resetAt.toISOString());

      if (!result.allowed) {
        return res.status(429).json({
          error: 'AI credits exhausted',
          message: `Insufficient AI credits. This operation costs ${cost} credits. Please wait ${result.retryAfter}s.`,
          code: 'AI_RATE_LIMIT_EXCEEDED',
          cost,
          remaining: result.remaining,
          resetAt: result.resetAt,
          retryAfter: result.retryAfter
        });
      }

      next();
    } catch (error) {
      console.error('AI rate limiter error:', error);
      next();
    }
  };
}

/**
 * IP-based DDoS protection
 */
function ddosProtection(options = {}) {
  const {
    maxRequestsPerIP = 1000,
    windowSeconds = 60,
    banDuration = 3600 // 1 hour ban
  } = options;

  const ipBans = new Map();
  const ipCounts = new Map();

  // Cleanup old entries
  setInterval(() => {
    const now = Date.now();
    for (const [ip, banTime] of ipBans.entries()) {
      if (now - banTime > banDuration * 1000) {
        ipBans.delete(ip);
      }
    }
    ipCounts.clear();
  }, windowSeconds * 1000);

  return (req, res, next) => {
    const ip = getClientIP(req);

    // Check if IP is banned
    if (ipBans.has(ip)) {
      const bannedAt = ipBans.get(ip);
      const banRemaining = Math.ceil((banDuration * 1000 - (Date.now() - bannedAt)) / 1000);

      return res.status(403).json({
        error: 'IP banned',
        message: `Your IP has been temporarily banned due to suspicious activity. Ban expires in ${banRemaining}s.`,
        code: 'IP_BANNED',
        banExpiresIn: banRemaining
      });
    }

    // Count requests from this IP
    const count = (ipCounts.get(ip) || 0) + 1;
    ipCounts.set(ip, count);

    if (count > maxRequestsPerIP) {
      // Ban this IP
      ipBans.set(ip, Date.now());

      console.warn(`[SECURITY] IP ${ip} banned for ${banDuration}s (exceeded ${maxRequestsPerIP} requests in ${windowSeconds}s)`);

      return res.status(403).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from your IP. Temporarily banned.',
        code: 'DDOS_PROTECTION_TRIGGERED',
        banDuration: `${banDuration}s`
      });
    }

    next();
  };
}

/**
 * Concurrent request limiter
 */
function concurrentLimiter() {
  const activRequests = new Map();

  return (req, res, next) => {
    // Skip concurrent limiting in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    if (isDevelopment) {
      return next();
    }

    const user = req.user || { role: 'GUEST', id: 'anonymous' };
    const limits = RATE_LIMITS[user.role] || RATE_LIMITS.GUEST;
    const key = user.id;

    const current = activRequests.get(key) || 0;

    if (current >= limits.concurrent) {
      return res.status(429).json({
        error: 'Too many concurrent requests',
        message: `Maximum ${limits.concurrent} concurrent requests allowed for your plan.`,
        code: 'CONCURRENT_LIMIT_EXCEEDED',
        limit: limits.concurrent,
        current
      });
    }

    // Increment counter
    activRequests.set(key, current + 1);

    // Decrement on response
    res.on('finish', () => {
      const updated = activRequests.get(key) - 1;
      if (updated <= 0) {
        activRequests.delete(key);
      } else {
        activRequests.set(key, updated);
      }
    });

    next();
  };
}

/**
 * Adaptive throttling under suspected attack
 */
function adaptiveThrottling() {
  let attackMode = false;
  let requestCounts = [];
  const checkInterval = 10000; // 10 seconds
  const attackThreshold = 1000; // requests per 10s

  setInterval(() => {
    const total = requestCounts.reduce((a, b) => a + b, 0);

    if (total > attackThreshold && !attackMode) {
      attackMode = true;
      console.warn('[SECURITY] Attack detected! Enabling aggressive throttling.');
    } else if (total < attackThreshold / 2 && attackMode) {
      attackMode = false;
      console.info('[SECURITY] Attack subsided. Disabling aggressive throttling.');
    }

    requestCounts = [0];
  }, checkInterval);

  return (req, res, next) => {
    if (requestCounts.length === 0) {
      requestCounts.push(0);
    }

    requestCounts[0]++;

    if (attackMode && req.user?.role === 'GUEST') {
      // During attack, be more aggressive with guests
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Platform is under heavy load. Please try again shortly.',
        code: 'ADAPTIVE_THROTTLE',
        retryAfter: 30
      });
    }

    next();
  };
}

/**
 * Get client IP address (handles proxies)
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Endpoint-specific rate limiter
 */
function endpointRateLimit(maxRequests, windowSeconds) {
  return (req, res, next) => {
    const user = req.user || { id: 'anonymous' };
    const endpoint = `${req.method}:${req.path}`;
    const key = `endpoint:${user.id}:${endpoint}`;

    const refillRate = maxRequests / windowSeconds;
    const result = store.tryConsume(key, 1, maxRequests, refillRate);

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Endpoint rate limit exceeded',
        message: `Maximum ${maxRequests} requests per ${windowSeconds}s for this endpoint.`,
        code: 'ENDPOINT_RATE_LIMIT',
        resetAt: result.resetAt,
        retryAfter: result.retryAfter
      });
    }

    next();
  };
}

module.exports = {
  rateLimiter,
  aiRateLimiter,
  ddosProtection,
  concurrentLimiter,
  adaptiveThrottling,
  endpointRateLimit,
  RateLimitStore,
  RATE_LIMITS,
  AI_COSTS
};
