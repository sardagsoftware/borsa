// ============================================
// 🔒 RATE LIMITER MIDDLEWARE
// Beyaz Şapkalı Güvenlik - IP-based Rate Limiting
// Version: 1.0.0
// ============================================

/**
 * In-memory rate limiter (production'da Upstash Redis kullanılmalı)
 * Token Bucket Algorithm
 */
class RateLimiter {
    constructor(options = {}) {
        this.maxRequests = options.maxRequests || 10; // 10 requests
        this.windowMs = options.windowMs || 60000; // 1 minute
        this.store = new Map(); // IP -> { tokens, lastRefill }

        // Cleanup old entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Get client IP from request
     */
    getClientIP(req) {
        // Vercel provides x-forwarded-for header
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }

        // Fallback to x-real-ip
        const realIp = req.headers['x-real-ip'];
        if (realIp) {
            return realIp;
        }

        // Last resort - connection remote address
        return req.connection?.remoteAddress || 'unknown';
    }

    /**
     * Check if request should be allowed
     * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
     */
    checkLimit(clientIP) {
        const now = Date.now();

        // Get or create bucket for this IP
        let bucket = this.store.get(clientIP);

        if (!bucket) {
            // First request from this IP
            bucket = {
                tokens: this.maxRequests - 1, // Consume 1 token
                lastRefill: now,
                firstRequest: now
            };
            this.store.set(clientIP, bucket);

            return {
                allowed: true,
                remaining: bucket.tokens,
                resetTime: now + this.windowMs
            };
        }

        // Calculate how many tokens to refill based on time elapsed
        const timeElapsed = now - bucket.lastRefill;
        const tokensToAdd = Math.floor(timeElapsed / this.windowMs) * this.maxRequests;

        if (tokensToAdd > 0) {
            // Refill tokens (cap at max)
            bucket.tokens = Math.min(this.maxRequests, bucket.tokens + tokensToAdd);
            bucket.lastRefill = now;
        }

        // Check if we have tokens available
        if (bucket.tokens > 0) {
            bucket.tokens--;
            this.store.set(clientIP, bucket);

            return {
                allowed: true,
                remaining: bucket.tokens,
                resetTime: bucket.lastRefill + this.windowMs
            };
        }

        // Rate limit exceeded
        return {
            allowed: false,
            remaining: 0,
            resetTime: bucket.lastRefill + this.windowMs,
            retryAfter: Math.ceil((bucket.lastRefill + this.windowMs - now) / 1000) // seconds
        };
    }

    /**
     * Cleanup old entries to prevent memory leak
     */
    cleanup() {
        const now = Date.now();
        const threshold = this.windowMs * 2; // Keep entries for 2x window time

        for (const [ip, bucket] of this.store.entries()) {
            if (now - bucket.firstRequest > threshold) {
                this.store.delete(ip);
            }
        }

        console.log(`[Rate Limiter] Cleaned up old entries. Current size: ${this.store.size}`);
    }

    /**
     * Get current stats (for monitoring)
     */
    getStats() {
        return {
            activeIPs: this.store.size,
            maxRequests: this.maxRequests,
            windowMs: this.windowMs
        };
    }
}

// Create singleton instance
const rateLimiter = new RateLimiter({
    maxRequests: 10,  // 10 requests per minute
    windowMs: 60000   // 1 minute
});

/**
 * Rate limiting middleware
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function rateLimitMiddleware(req, res, next) {
    // Skip rate limiting for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
        return next();
    }

    const clientIP = rateLimiter.getClientIP(req);

    // 🔧 DEVELOPMENT MODE: Skip rate limiting for localhost
    const isLocalhost = clientIP === '::1' ||
                       clientIP === '127.0.0.1' ||
                       clientIP.includes('localhost') ||
                       req.headers.host?.includes('localhost') ||
                       req.headers.host?.includes('127.0.0.1');

    if (isLocalhost) {
        console.log('[Rate Limiter] 🔓 Localhost detected - Rate limit skipped for development');
        return next();
    }

    const result = rateLimiter.checkLimit(clientIP);

    // Add rate limit headers (standard headers)
    res.setHeader('X-RateLimit-Limit', rateLimiter.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetTime);

    if (!result.allowed) {
        // Rate limit exceeded
        res.setHeader('Retry-After', result.retryAfter);

        console.warn(`[Rate Limiter] ⚠️ Rate limit exceeded for IP: ${clientIP}`);

        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            message: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.',
            retryAfter: result.retryAfter,
            limit: rateLimiter.maxRequests,
            window: '1 minute'
        });
    }

    // Log successful request
    console.log(`[Rate Limiter] ✅ Request allowed for IP: ${clientIP} (${result.remaining} remaining)`);

    // Request allowed, proceed to next middleware
    next();
}

/**
 * Whitelist middleware (bypass rate limiting for trusted IPs)
 * Usage: Wrap your API handler with this if needed
 */
function whitelistMiddleware(whitelist = []) {
    return (req, res, next) => {
        const clientIP = rateLimiter.getClientIP(req);

        if (whitelist.includes(clientIP)) {
            console.log(`[Rate Limiter] 🎯 Whitelisted IP: ${clientIP}`);
            return next();
        }

        // Not whitelisted, apply rate limiting
        rateLimitMiddleware(req, res, next);
    };
}

// Export for use in API routes
module.exports = {
    rateLimitMiddleware,
    whitelistMiddleware,
    rateLimiter
};
