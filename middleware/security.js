// ==========================================
// SECURITY MIDDLEWARE
// CSRF Protection, Helmet, and Security Headers
// ==========================================

const helmet = require('helmet');
// const csrf = require('csurf'); // ❌ DEPRECATED - Replaced with custom implementation
const { csrfProtection, injectCSRFToken, generateCSRFToken } = require('../security/csrf-protection');
const cookieParser = require('cookie-parser');

// Production environment check
const isProduction = process.env.NODE_ENV === 'production';

// ==========================================
// HELMET SECURITY HEADERS
// ==========================================
function setupHelmet(app) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                // 🔒 SECURITY FIX: Removed 'unsafe-eval' and 'unsafe-inline' - XSS protection
                scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
                scriptSrcAttr: ["'self'"], // Removed unsafe-inline - use event listeners instead
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                connectSrc: ["'self'", "http://localhost:3200", "https://api.openai.com", "https://api.anthropic.com", "https://api.groq.com", "https://generativelanguage.googleapis.com", "wss:", "ws:"],
                mediaSrc: ["'self'", "https://videos.pexels.com", "https:", "data:", "blob:"],
                frameSrc: ["'self'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: isProduction ? [] : null
            }
        },
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },
        frameguard: {
            action: 'deny'
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: {
            policy: 'strict-origin-when-cross-origin'
        }
    }));

    console.log('🛡️ Helmet security headers active');
}

// ==========================================
// CSRF PROTECTION - MODERN IMPLEMENTATION
// ==========================================
function setupCSRF(app) {
    // Cookie parser is required for CSRF
    app.use(cookieParser());

    // Inject CSRF token into all responses
    app.use(injectCSRFToken);

    // Apply CSRF protection to specific routes
    app.use('/api/auth/login', csrfProtection);
    app.use('/api/auth/register', csrfProtection);
    app.use('/api/auth/reset-password', csrfProtection);
    app.use('/api/settings', csrfProtection);
    app.use('/api/admin', csrfProtection);
    app.use('/api/payment', csrfProtection); // Protect payment endpoints

    // CSRF token endpoint for frontend
    app.get('/api/csrf-token', (req, res) => {
        const sessionId = req.session?.id || req.cookies?.sessionId || 'default';
        const token = generateCSRFToken(sessionId);
        res.json({ csrfToken: token });
    });

    console.log('🛡️ Modern CSRF protection active (csurf deprecated → custom implementation)');
}

// ==========================================
// SECURE COOKIE CONFIGURATION
// ==========================================
function getSecureCookieOptions() {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
    };
}

// ==========================================
// JWT SECRET VALIDATION
// ==========================================
function validateJWTSecrets() {
    if (isProduction) {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'ailydian-ultra-pro-secret-key-change-in-production') {
            throw new Error('🚨 CRITICAL: JWT_SECRET must be set in production and cannot be the default value!');
        }
        if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'ailydian-ultra-pro-refresh-secret') {
            throw new Error('🚨 CRITICAL: JWT_REFRESH_SECRET must be set in production and cannot be the default value!');
        }
        console.log('✅ JWT secrets validated for production');
    } else {
        if (!process.env.JWT_SECRET) {
            console.warn('⚠️ WARNING: JWT_SECRET not set, using default (development only)');
        }
    }
}

// ==========================================
// EMAIL SERVICE VALIDATION
// ==========================================
function validateEmailService() {
    if (isProduction) {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.error('🚨 CRITICAL: Email service not configured in production!');
            console.error('   Users will not be able to verify emails or reset passwords.');
            console.error('   Set EMAIL_USER and EMAIL_PASSWORD environment variables.');
            // Don't throw - let app start but log critical warning
        } else {
            console.log('✅ Email service configured for production');
        }
    }
}

// ==========================================
// INITIALIZE ALL SECURITY
// ==========================================
function initializeSecurity(app) {
    console.log('\n🔒 Initializing Security Middleware...');
    console.log(`   Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

    // 1. Helmet security headers
    setupHelmet(app);

    // 2. CSRF protection
    setupCSRF(app);
    console.log('✅ CSRF protection enabled');

    // 3. Validate secrets
    try {
        validateJWTSecrets();
    } catch (error) {
        console.error(error.message);
        if (isProduction) {
            process.exit(1); // Fail fast in production
        }
    }

    // 4. Validate email service
    validateEmailService();

    console.log('✅ Security middleware initialized\n');
}

module.exports = {
    initializeSecurity,
    setupHelmet,
    setupCSRF,
    getSecureCookieOptions,
    validateJWTSecrets,
    validateEmailService
};
