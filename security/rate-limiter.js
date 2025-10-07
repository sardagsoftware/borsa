/**
 * Rate Limiting Middleware
 * Fixes: HIGH - No rate limiting detected
 */

const rateLimit = require('express-rate-limit');

// Redis is optional - use memory store for now
// TODO: Re-enable Redis when properly configured
let redisClient = null;

// General API rate limiter
const apiLimiter = rateLimit({
  // Using memory store (default) instead of Redis
  // store: undefined means use default MemoryStore
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health' || req.path === '/health';
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  // Using memory store (default)
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true
});

// Payment endpoint rate limiter
const paymentLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:payment:'
  }) : undefined,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 payment attempts per hour
  message: {
    error: 'Too many payment attempts, please try again later.',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  }
});

// AI/Chat endpoint rate limiter (more generous)
const aiLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:ai:'
  }) : undefined,
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 AI requests per minute
  message: {
    error: 'Too many AI requests, please slow down.',
    code: 'AI_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  }
});

// Admin endpoint rate limiter
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: 'Too many admin requests.',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  aiLimiter,
  adminLimiter
};
