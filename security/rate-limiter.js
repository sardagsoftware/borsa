/**
 * Rate Limiting Middleware
 * Fixes: HIGH - No rate limiting detected
 */

const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');

// Redis client for distributed rate limiting
let redisClient = null;

const shouldUseRedis =
  process.env.REDIS_HOST &&
  process.env.REDIS_PORT &&
  process.env.REDIS_HOST.trim() !== '' &&
  process.env.REDIS_PORT.trim() !== '';

if (shouldUseRedis) {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD || undefined,
      username: process.env.REDIS_USERNAME || undefined,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      retryStrategy: (times) => Math.min(times * 100, 3000)
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis rate limiting aktif (distributed mode)');
    });

    redisClient.on('error', (error) => {
      console.error('⚠️ Redis bağlanma hatası, bellek içi rate limiting yedek olarak kullanılacak:', error.message);
    });
  } catch (error) {
    console.warn('⚠️ Redis bağlantısı oluşturulamadı, bellek içi rate limiting kullanılacak:', error.message);
    redisClient = null;
  }
} else {
  console.warn('⚠️ REDIS_HOST/REDIS_PORT tanımlı değil; rate limiting bellek içi çalışıyor.');
}

const createRedisStore = (prefix) =>
  redisClient
    ? new RedisStore({
        client: redisClient,
        prefix
      })
    : undefined;

// General API rate limiter
const apiLimiter = rateLimit({
  store: createRedisStore('rl:api:'),
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
  store: createRedisStore('rl:auth:'),
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
  store: createRedisStore('rl:payment:'),
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
  store: createRedisStore('rl:ai:'),
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
