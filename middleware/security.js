// ==========================================
// SECURITY MIDDLEWARE
// CSRF Protection, Helmet, and Security Headers
// ==========================================

const helmet = require('helmet');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// Production environment check
const isProduction = process.env.NODE_ENV === 'production';
const allowLegacyInlineScripts = process.env.ALLOW_LEGACY_INLINE !== 'false';

if (!allowLegacyInlineScripts) {
    console.log('🔒 Inline script izinleri kapalı. CSP nonce/hash gerekecek.');
} else {
    console.log('⚠️ Inline script desteği aktif (ALLOW_LEGACY_INLINE !== "false").');
}

const helmetScriptSrc = allowLegacyInlineScripts
    ? ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://d3js.org"]
    : ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://d3js.org"];

const helmetScriptSrcAttr = allowLegacyInlineScripts
    ? ["'unsafe-inline'", "'unsafe-hashes'"]
    : ["'unsafe-hashes'"];

// ==========================================
// HELMET SECURITY HEADERS - ENHANCED (CRITICAL FIX)
// ==========================================
function setupHelmet(app) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                // ✅ FIXED: Removed 'unsafe-eval' (critical security risk)
                scriptSrc: helmetScriptSrc,
                scriptSrcAttr: helmetScriptSrcAttr,
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                // ✅ Added AI API endpoints
                connectSrc: ["'self'", "http://localhost:3200", "https://api.openai.com", "https://api.anthropic.com", "https://api.groq.com", "https://generativelanguage.googleapis.com", "wss:", "ws:"],
                mediaSrc: ["'self'", "https://videos.pexels.com", "https:", "data:", "blob:"],
                frameSrc: ["'self'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
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
// CSRF PROTECTION
// ==========================================
function setupCSRF(app) {
    // Cookie parser is required for CSRF
    app.use(cookieParser());

    // CSRF protection middleware
    const csrfProtection = csrf({
        cookie: {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict'
        }
    });

    // Apply CSRF to specific routes (not to API endpoints for now)
    app.use('/api/auth/login', csrfProtection);
    app.use('/api/auth/register', csrfProtection);
    app.use('/api/auth/reset-password', csrfProtection);
    app.use('/api/settings', csrfProtection);

    // CSRF token endpoint for frontend
    app.get('/api/csrf-token', csrfProtection, (req, res) => {
        res.json({ csrfToken: req.csrfToken() });
    });

    console.log('🛡️ CSRF protection active for auth and settings routes');
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
// JWT SECRET VALIDATION (CRITICAL SECURITY FIX)
// ==========================================
function validateJWTSecrets() {
    // JWT_SECRET is MANDATORY in ALL environments (dev + production)
    if (!process.env.JWT_SECRET) {
        throw new Error('🚨 CRITICAL: JWT_SECRET must be set in environment variables!');
    }

    // Minimum length validation (256-bit = 32 bytes = 44 base64 chars)
    if (process.env.JWT_SECRET.length < 32) {
        throw new Error('🚨 CRITICAL: JWT_SECRET must be at least 32 characters long (256-bit security)!');
    }

    // Forbidden default values
    const forbiddenSecrets = [
        'your-secret-key',
        'your-secret-key-change-this',
        'ailydian-ultra-pro-secret-key-change-in-production',
        'change-me',
        'secret',
        'password'
    ];

    if (forbiddenSecrets.some(forbidden => process.env.JWT_SECRET.includes(forbidden))) {
        throw new Error('🚨 CRITICAL: JWT_SECRET cannot contain default/weak values!');
    }

    if (isProduction) {
        // Additional production checks
        if (!process.env.SESSION_SECRET) {
            throw new Error('🚨 CRITICAL: SESSION_SECRET must be set in production!');
        }

        if (process.env.SESSION_SECRET.length < 32) {
            throw new Error('🚨 CRITICAL: SESSION_SECRET must be at least 32 characters long!');
        }

        console.log('✅ JWT and session secrets validated for production');
    } else {
        console.log('✅ JWT secret validated for development');
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
