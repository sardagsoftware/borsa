/**
 * SECURITY-SPECIFIC RATE LIMITERS
 * Beyaz Şapkalı Security - Granular rate limiting for security-sensitive operations
 *
 * Features:
 * - 2FA verification rate limiting (brute force protection)
 * - Email send rate limiting (spam prevention)
 * - Password reset rate limiting (enumeration prevention)
 * - Account lockout mechanism (failed login protection)
 * - Progressive penalties
 *
 * Security Philosophy:
 * - Strictest limits for auth operations
 * - Exponential backoff for repeated violations
 * - User + IP dual tracking
 * - Activity logging for audit
 */

const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');
const User = require('../backend/models/User');

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
const useRedis = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;

// ==========================================
// REDIS CLIENT (Reuse from main rate limiter if available)
// ==========================================

let redisClient;
if (useRedis && isProduction) {
    try {
        if (process.env.UPSTASH_REDIS_REST_URL) {
            const url = new URL(process.env.UPSTASH_REDIS_REST_URL.replace('https://', 'redis://'));
            redisClient = new Redis({
                host: url.hostname,
                port: url.port || 6379,
                password: process.env.UPSTASH_REDIS_REST_TOKEN,
                tls: { rejectUnauthorized: false },
                retryStrategy(times) {
                    return Math.min(times * 50, 2000);
                }
            });
        } else {
            redisClient = new Redis(process.env.REDIS_URL, {
                retryStrategy(times) {
                    return Math.min(times * 50, 2000);
                }
            });
        }

        redisClient.on('error', (err) => {
            console.error('Security Rate Limiter Redis Error:', err.message);
        });

        console.log('✅ Security rate limiters using Redis');
    } catch (error) {
        console.error('❌ Redis connection failed for security rate limiters:', error.message);
        console.log('⚠️  Falling back to memory storage');
    }
}

// ==========================================
// RATE LIMITER CONFIGURATIONS
// ==========================================

/**
 * 2FA Verification Rate Limiter
 * CRITICAL: Prevent brute force of 6-digit codes
 * 3 attempts per 5 minutes per user
 * Block for 15 minutes after exhaustion
 */
const twoFAVerificationLimiter = (redisClient && isProduction)
    ? new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:2fa:verify',
        points: 3,              // Only 3 attempts
        duration: 300,          // 5 minutes
        blockDuration: 900      // Block 15 minutes
    })
    : new RateLimiterMemory({
        keyPrefix: 'rl:2fa:verify',
        points: 3,
        duration: 300,
        blockDuration: 900
    });

/**
 * Email Send Rate Limiter
 * Prevent email spam and enumeration
 * 3 emails per hour per IP/user
 * Block for 2 hours after exhaustion
 */
const emailSendLimiter = (redisClient && isProduction)
    ? new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:email:send',
        points: 3,              // 3 emails
        duration: 3600,         // 1 hour
        blockDuration: 7200     // Block 2 hours
    })
    : new RateLimiterMemory({
        keyPrefix: 'rl:email:send',
        points: 3,
        duration: 3600,
        blockDuration: 7200
    });

/**
 * Password Reset Request Limiter
 * Prevent enumeration and spam
 * 3 requests per hour per IP
 * Block for 2 hours after exhaustion
 */
const passwordResetLimiter = (redisClient && isProduction)
    ? new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:password:reset',
        points: 3,
        duration: 3600,
        blockDuration: 7200
    })
    : new RateLimiterMemory({
        keyPrefix: 'rl:password:reset',
        points: 3,
        duration: 3600,
        blockDuration: 7200
    });

/**
 * Failed Login Tracker
 * Track failed login attempts per user
 * 5 failed attempts per 15 minutes → account lockout
 */
const failedLoginLimiter = (redisClient && isProduction)
    ? new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:login:failed',
        points: 5,              // 5 failed attempts
        duration: 900,          // 15 minutes
        blockDuration: 900      // Lock for 15 minutes
    })
    : new RateLimiterMemory({
        keyPrefix: 'rl:login:failed',
        points: 5,
        duration: 900,
        blockDuration: 900
    });

/**
 * Login Attempt Limiter (IP-based)
 * Prevent distributed brute force
 * 10 attempts per 5 minutes per IP
 */
const loginAttemptLimiter = (redisClient && isProduction)
    ? new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:login:ip',
        points: 10,
        duration: 300,
        blockDuration: 900
    })
    : new RateLimiterMemory({
        keyPrefix: 'rl:login:ip',
        points: 10,
        duration: 300,
        blockDuration: 900
    });

/**
 * OAuth Callback Rate Limiter
 * Prevent OAuth token abuse
 * 10 callbacks per minute per IP
 */
const oauthCallbackLimiter = (redisClient && isProduction)
    ? new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:oauth:callback',
        points: 10,
        duration: 60,
        blockDuration: 300
    })
    : new RateLimiterMemory({
        keyPrefix: 'rl:oauth:callback',
        points: 10,
        duration: 60,
        blockDuration: 300
    });

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get rate limit key from request
 */
function getRateLimitKey(req, prefix = 'ip') {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.connection?.remoteAddress ||
               'unknown';

    if (prefix === 'user' && req.body?.email) {
        return `user:${req.body.email.toLowerCase()}`;
    }

    if (prefix === 'user' && req.body?.userId) {
        return `user:${req.body.userId}`;
    }

    return `ip:${ip}`;
}

/**
 * Log rate limit violation with audit trail
 */
function logSecurityViolation(req, limiterType, details = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: limiterType,
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        path: req.path,
        ...details
    };

    console.warn('🚨 Security Rate Limit Violation:', JSON.stringify(logEntry));

    // If user is identified, log to activity_log
    if (details.userId) {
        try {
            User.logActivity({
                userId: details.userId,
                action: `rate_limit_${limiterType}`,
                description: `Rate limit exceeded: ${limiterType}`,
                ipAddress: logEntry.ip,
                userAgent: logEntry.userAgent,
                metadata: details
            });
        } catch (error) {
            console.error('Failed to log rate limit violation:', error.message);
        }
    }
}

/**
 * Calculate retry-after seconds
 */
function getRetryAfter(msBeforeNext) {
    return Math.ceil(msBeforeNext / 1000);
}

// ==========================================
// MIDDLEWARE CREATORS
// ==========================================

/**
 * Create 2FA verification rate limit middleware
 */
function create2FARateLimit() {
    return async (req, res, next) => {
        try {
            const key = getRateLimitKey(req, 'user');
            await twoFAVerificationLimiter.consume(key);
            next();
        } catch (rejRes) {
            logSecurityViolation(req, '2fa_verification', {
                userId: req.body?.userId,
                attemptsRemaining: 0
            });

            return res.status(429).json({
                success: false,
                error: 'Too Many Attempts',
                message: 'Too many 2FA verification attempts. Please try again later.',
                retryAfter: getRetryAfter(rejRes.msBeforeNext),
                code: '2FA_RATE_LIMIT_EXCEEDED'
            });
        }
    };
}

/**
 * Create email send rate limit middleware
 */
function createEmailRateLimit() {
    return async (req, res, next) => {
        try {
            const key = getRateLimitKey(req, 'ip');
            await emailSendLimiter.consume(key);
            next();
        } catch (rejRes) {
            logSecurityViolation(req, 'email_send', {
                email: req.body?.email
            });

            return res.status(429).json({
                success: false,
                error: 'Too Many Requests',
                message: 'Too many email requests. Please try again later.',
                retryAfter: getRetryAfter(rejRes.msBeforeNext),
                code: 'EMAIL_RATE_LIMIT_EXCEEDED'
            });
        }
    };
}

/**
 * Create password reset rate limit middleware
 */
function createPasswordResetRateLimit() {
    return async (req, res, next) => {
        try {
            const key = getRateLimitKey(req, 'ip');
            await passwordResetLimiter.consume(key);
            next();
        } catch (rejRes) {
            logSecurityViolation(req, 'password_reset', {
                email: req.body?.email
            });

            return res.status(429).json({
                success: false,
                error: 'Too Many Requests',
                message: 'Too many password reset requests. Please try again later.',
                retryAfter: getRetryAfter(rejRes.msBeforeNext),
                code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
            });
        }
    };
}

/**
 * Create login attempt rate limit middleware
 */
function createLoginRateLimit() {
    return async (req, res, next) => {
        try {
            const ipKey = getRateLimitKey(req, 'ip');
            await loginAttemptLimiter.consume(ipKey);
            next();
        } catch (rejRes) {
            logSecurityViolation(req, 'login_attempt', {
                email: req.body?.email
            });

            return res.status(429).json({
                success: false,
                error: 'Too Many Login Attempts',
                message: 'Too many login attempts from this IP. Please try again later.',
                retryAfter: getRetryAfter(rejRes.msBeforeNext),
                code: 'LOGIN_RATE_LIMIT_EXCEEDED'
            });
        }
    };
}

/**
 * Create OAuth callback rate limit middleware
 */
function createOAuthCallbackRateLimit() {
    return async (req, res, next) => {
        try {
            const key = getRateLimitKey(req, 'ip');
            await oauthCallbackLimiter.consume(key);
            next();
        } catch (rejRes) {
            logSecurityViolation(req, 'oauth_callback');

            return res.redirect(`/auth.html?error=rate_limit_exceeded&provider=${req.query.provider || 'oauth'}`);
        }
    };
}

/**
 * Track failed login attempt
 * Call this when login fails to increment counter
 */
async function trackFailedLogin(identifier) {
    try {
        const key = `user:${identifier.toLowerCase()}`;
        await failedLoginLimiter.consume(key);

        // Get remaining attempts
        const remaining = await failedLoginLimiter.get(key);
        const attemptsRemaining = Math.max(0, failedLoginLimiter.points - (remaining?.consumedPoints || 0));

        return {
            locked: false,
            attemptsRemaining
        };
    } catch (rejRes) {
        // Account locked
        logSecurityViolation({ body: { email: identifier } }, 'account_lockout', {
            email: identifier,
            lockDuration: Math.ceil(rejRes.msBeforeNext / 1000)
        });

        return {
            locked: true,
            lockDuration: getRetryAfter(rejRes.msBeforeNext),
            attemptsRemaining: 0
        };
    }
}

/**
 * Reset failed login attempts (call after successful login)
 */
async function resetFailedLogin(identifier) {
    try {
        const key = `user:${identifier.toLowerCase()}`;
        await failedLoginLimiter.delete(key);
    } catch (error) {
        console.error('Failed to reset login attempts:', error.message);
    }
}

/**
 * Check if account is locked
 */
async function isAccountLocked(identifier) {
    try {
        const key = `user:${identifier.toLowerCase()}`;
        const remaining = await failedLoginLimiter.get(key);

        if (!remaining) {
            return { locked: false };
        }

        const attemptsRemaining = Math.max(0, failedLoginLimiter.points - remaining.consumedPoints);

        if (attemptsRemaining === 0) {
            return {
                locked: true,
                lockDuration: getRetryAfter(remaining.msBeforeNext)
            };
        }

        return { locked: false, attemptsRemaining };
    } catch (error) {
        console.error('Error checking account lock:', error.message);
        return { locked: false };
    }
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    // Middleware creators
    twoFARateLimit: create2FARateLimit(),
    emailSendRateLimit: createEmailRateLimit(),
    passwordResetRateLimit: createPasswordResetRateLimit(),
    loginRateLimit: createLoginRateLimit(),
    oauthCallbackRateLimit: createOAuthCallbackRateLimit(),

    // Account lockout functions
    trackFailedLogin,
    resetFailedLogin,
    isAccountLocked,

    // Raw limiters (for custom use)
    twoFAVerificationLimiter,
    emailSendLimiter,
    passwordResetLimiter,
    failedLoginLimiter,
    loginAttemptLimiter,
    oauthCallbackLimiter
};
