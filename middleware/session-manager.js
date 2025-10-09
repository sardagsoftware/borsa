/**
 * SESSION MANAGEMENT MIDDLEWARE
 * Beyaz Şapkalı Güvenlik - Secure Session Handling
 * Version: 1.0.0
 *
 * Features:
 * - Redis-backed session storage (distributed)
 * - Secure cookie settings (httpOnly, secure, sameSite)
 * - Session expiry and renewal
 * - CSRF integration
 */

const session = require('express-session');
const Redis = require('ioredis');

// Environment check
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
const useRedis = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

/**
 * Custom Redis Session Store
 * Compatible with express-session
 */
class RedisSessionStore {
    constructor(client) {
        this.client = client;
        this.prefix = 'sess:';
        this.ttl = 86400; // 24 hours in seconds
    }

    /**
     * Get session from Redis
     */
    async get(sid, callback) {
        try {
            const key = this.prefix + sid;
            const data = await this.client.get(key);

            if (!data) {
                return callback(null, null);
            }

            const session = JSON.parse(data);
            callback(null, session);
        } catch (error) {
            console.error('[Session Store] Get error:', error);
            callback(error);
        }
    }

    /**
     * Set session in Redis
     */
    async set(sid, session, callback) {
        try {
            const key = this.prefix + sid;
            const data = JSON.stringify(session);

            // Calculate TTL from session expiry
            let ttl = this.ttl;
            if (session.cookie && session.cookie.maxAge) {
                ttl = Math.floor(session.cookie.maxAge / 1000);
            }

            await this.client.setex(key, ttl, data);
            callback(null);
        } catch (error) {
            console.error('[Session Store] Set error:', error);
            callback(error);
        }
    }

    /**
     * Destroy session in Redis
     */
    async destroy(sid, callback) {
        try {
            const key = this.prefix + sid;
            await this.client.del(key);
            callback(null);
        } catch (error) {
            console.error('[Session Store] Destroy error:', error);
            callback(error);
        }
    }

    /**
     * Touch session (renew expiry)
     */
    async touch(sid, session, callback) {
        try {
            const key = this.prefix + sid;

            // Calculate TTL
            let ttl = this.ttl;
            if (session.cookie && session.cookie.maxAge) {
                ttl = Math.floor(session.cookie.maxAge / 1000);
            }

            await this.client.expire(key, ttl);
            callback(null);
        } catch (error) {
            console.error('[Session Store] Touch error:', error);
            callback(error);
        }
    }
}

/**
 * Initialize Redis client for sessions
 */
let redisClient = null;
let sessionStore = null;

if (useRedis) {
    try {
        // Use Upstash Redis REST API or standard Redis URL
        if (process.env.UPSTASH_REDIS_REST_URL) {
            // For Upstash, use ioredis with regular connection
            const url = new URL(process.env.UPSTASH_REDIS_REST_URL.replace('https://', 'redis://'));
            redisClient = new Redis({
                host: url.hostname,
                port: url.port || 6379,
                password: process.env.UPSTASH_REDIS_REST_TOKEN,
                tls: {
                    rejectUnauthorized: false
                },
                retryStrategy(times) {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });
        } else if (process.env.REDIS_URL) {
            redisClient = new Redis(process.env.REDIS_URL, {
                retryStrategy(times) {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });
        }

        redisClient.on('error', (err) => {
            console.error('❌ Session Redis Error:', err.message);
        });

        redisClient.on('connect', () => {
            console.log('✅ Session Redis connected');
        });

        sessionStore = new RedisSessionStore(redisClient);
        console.log('✅ Redis session store initialized');
    } catch (error) {
        console.error('❌ Redis session store failed:', error.message);
        console.log('⚠️  Falling back to memory store (not suitable for production)');
    }
}

/**
 * Session Configuration
 */
const sessionConfig = {
    // Session store (Redis or Memory)
    store: sessionStore || undefined, // undefined = memory store

    // Session secret (use strong secret from env)
    secret: process.env.SESSION_SECRET || 'lydian-ai-session-secret-2025-change-me',

    // Session name (cookie name)
    name: 'lydian.sid',

    // Resave settings
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored

    // Cookie settings
    cookie: {
        // httpOnly: JavaScript cannot access cookie (XSS protection)
        httpOnly: true,

        // secure: Only send cookie over HTTPS (production only)
        secure: isProduction,

        // sameSite: CSRF protection
        sameSite: 'strict',

        // maxAge: Session expiry (24 hours)
        maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds

        // domain: Set if using subdomain
        domain: isProduction ? '.ailydian.com' : undefined
    }
};

/**
 * Create session middleware
 */
const sessionMiddleware = session(sessionConfig);

/**
 * Helper: Check if user is authenticated
 */
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }

    return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Lütfen giriş yapın',
        code: 'AUTHENTICATION_REQUIRED'
    });
}

/**
 * Helper: Check if user has specific role
 */
function hasRole(...roles) {
    return (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Lütfen giriş yapın'
            });
        }

        const userRole = req.session.role || 'USER';

        if (!roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Bu işlem için yetkiniz yok',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
}

/**
 * Helper: Create session for user
 */
function createSession(req, userId, userData = {}) {
    req.session.userId = userId;
    req.session.email = userData.email;
    req.session.name = userData.name;
    req.session.role = userData.role || 'USER';
    req.session.createdAt = new Date().toISOString();

    console.log(`✅ Session created for user: ${userId}`);
}

/**
 * Helper: Destroy session
 */
async function destroySession(req) {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return resolve();
        }

        req.session.destroy((err) => {
            if (err) {
                console.error('❌ Session destroy error:', err);
                return reject(err);
            }

            console.log('✅ Session destroyed');
            resolve();
        });
    });
}

/**
 * Setup session middleware in Express app
 */
function setupSessionManagement(app) {
    console.log('\n🔐 Initializing Session Management...');
    console.log(`   Storage: ${sessionStore ? 'Redis (distributed)' : 'Memory (single-instance)'}`);
    console.log(`   Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`   Secure Cookies: ${sessionConfig.cookie.secure ? 'Enabled' : 'Disabled (dev mode)'}`);

    // Apply session middleware
    app.use(sessionMiddleware);

    // Session info endpoint (for debugging - remove in production)
    if (!isProduction) {
        app.get('/api/session-info', (req, res) => {
            res.json({
                hasSession: !!req.session,
                sessionData: req.session ? {
                    userId: req.session.userId,
                    email: req.session.email,
                    role: req.session.role,
                    createdAt: req.session.createdAt
                } : null,
                cookieName: sessionConfig.name
            });
        });
    }

    console.log('✅ Session management active\n');
}

module.exports = {
    setupSessionManagement,
    sessionMiddleware,
    isAuthenticated,
    hasRole,
    createSession,
    destroySession
};
