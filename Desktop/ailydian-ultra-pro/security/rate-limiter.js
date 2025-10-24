/**
 * Rate Limiting Middleware
 * Fixes: HIGH - No rate limiting detected
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Redis client for distributed rate limiting
let redisClient;
try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6380,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => Math.min(times * 50, 2000)
  });
} catch (error) {
  console.warn('Redis not available for rate limiting, using memory store');
}

// General API rate limiter
const apiLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  }) : undefined,
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
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  }) : undefined,
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
