/**
 * GLOBAL RATE LIMITING MIDDLEWARE
 * Protects against brute force and DDoS attacks
 * White-Hat Security Implementation
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 * DISABLED in development mode for testing
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting in development and test mode
    const isDevelopment = process.env.NODE_ENV === 'development' ||
                          process.env.NODE_ENV === 'test' ||
                          !process.env.NODE_ENV;

    // Also skip for localhost
    const isLocalhost = req.ip === '::1' ||
                        req.ip === '127.0.0.1' ||
                        req.ip === '::ffff:127.0.0.1';

    return isDevelopment || isLocalhost;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 * DISABLED in development mode for testing
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const isDevelopment = process.env.NODE_ENV === 'development' ||
                          process.env.NODE_ENV === 'test' ||
                          !process.env.NODE_ENV;
    const isLocalhost = req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1';
    return isDevelopment || isLocalhost;
  },
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again after 15 minutes',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * AI endpoint rate limiter
 * 30 requests per 15 minutes per IP (AI requests are expensive)
 * DISABLED in development mode for testing
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    error: 'Too many AI requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const isDevelopment = process.env.NODE_ENV === 'development' ||
                          process.env.NODE_ENV === 'test' ||
                          !process.env.NODE_ENV;
    const isLocalhost = req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1';
    return isDevelopment || isLocalhost;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'AI rate limit exceeded',
      message: 'Too many AI requests, please try again later',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * File upload rate limiter
 * 10 uploads per hour per IP
 * DISABLED in development mode for testing
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Too many file uploads from this IP',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const isDevelopment = process.env.NODE_ENV === 'development' ||
                          process.env.NODE_ENV === 'test' ||
                          !process.env.NODE_ENV;
    const isLocalhost = req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1';
    return isDevelopment || isLocalhost;
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter
};
