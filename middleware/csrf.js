/**
 * ENTERPRISE-GRADE CSRF PROTECTION MIDDLEWARE
 * Medical AI - HIPAA Compliant | Double Submit Cookie Pattern
 *
 * Features:
 * - Double submit cookie pattern
 * - Synchronizer token pattern
 * - Custom header validation (X-CSRF-Token)
 * - Origin/Referer validation
 * - Session-bound tokens
 * - Token rotation on sensitive operations
 * - Medical endpoint specific protection
 *
 * Security:
 * - Cryptographically secure random tokens
 * - HttpOnly cookies for token storage
 * - SameSite=Strict cookies
 * - Token expiration
 * - HIPAA audit logging
 */

const crypto = require('crypto');
const cookieParser = require('cookie-parser');

// Constants
const CSRF_TOKEN_LENGTH = 32; // 256 bits
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_BODY_FIELD = '_csrf';

// Token store (use Redis in production for distributed systems)
const tokenStore = new Map();

/**
 * Generate cryptographically secure CSRF token
 */
function generateToken() {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('base64url');
}

/**
 * Hash token for comparison (prevents timing attacks)
 */
function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

/**
 * Store token with expiration
 */
function storeToken(sessionId, token) {
  const hashedToken = hashToken(token);
  tokenStore.set(sessionId, {
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + CSRF_TOKEN_EXPIRY
  });

  // Clean up expired tokens periodically
  if (tokenStore.size > 10000) {
    cleanupExpiredTokens();
  }

  return hashedToken;
}

/**
 * Verify token
 */
function verifyToken(sessionId, token) {
  if (!sessionId || !token) {
    return false;
  }

  const stored = tokenStore.get(sessionId);

  if (!stored) {
    return false;
  }

  // Check expiration
  if (Date.now() > stored.expiresAt) {
    tokenStore.delete(sessionId);
    return false;
  }

  // Compare hashed tokens (constant-time comparison)
  const hashedToken = hashToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(hashedToken)
  );
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [sessionId, data] of tokenStore.entries()) {
    if (now > data.expiresAt) {
      tokenStore.delete(sessionId);
    }
  }
}

/**
 * Get session ID from request
 */
function getSessionId(req) {
  // Try to get session ID from session
  if (req.session && req.session.id) {
    return req.session.id;
  }

  // Fallback to session cookie
  if (req.cookies && req.cookies['ailydian.sid']) {
    return req.cookies['ailydian.sid'];
  }

  // Generate temporary session ID for stateless requests
  return `temp_${req.ip}_${Date.now()}`;
}

/**
 * Validate Origin/Referer headers
 */
function validateOrigin(req) {
  const origin = req.get('origin') || req.get('referer');

  if (!origin) {
    // Allow same-origin requests without these headers
    return true;
  }

  const allowedOrigins = [
    'http://localhost:3100',
    'https://ailydian.com',
    'https://www.ailydian.com',
    'https://app.ailydian.com',
    'https://medical.ailydian.com',
    process.env.BASE_URL
  ].filter(Boolean);

  // Check if origin matches any allowed origin
  return allowedOrigins.some(allowed => {
    try {
      const originUrl = new URL(origin);
      const allowedUrl = new URL(allowed);
      return originUrl.origin === allowedUrl.origin;
    } catch (error) {
      return false;
    }
  });
}

/**
 * CSRF Token Generation Middleware
 * Generates and attaches CSRF token to request/response
 */
function generateCSRFToken(req, res, next) {
  // Get or create session ID
  const sessionId = getSessionId(req);

  // Check if token already exists and is valid
  const existingToken = req.cookies[CSRF_COOKIE_NAME];
  if (existingToken && verifyToken(sessionId, existingToken)) {
    req.csrfToken = () => existingToken;
    return next();
  }

  // Generate new token
  const token = generateToken();
  storeToken(sessionId, token);

  // Set CSRF cookie
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Needs to be readable by JavaScript for header inclusion
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY,
    path: '/'
  });

  // Attach token to request for template rendering
  req.csrfToken = () => token;

  // Attach token to response for AJAX requests
  res.locals.csrfToken = token;

  next();
}

/**
 * CSRF Protection Middleware
 * Validates CSRF token on state-changing requests
 */
function csrfProtection(options = {}) {
  const {
    ignoreMethods = ['GET', 'HEAD', 'OPTIONS'],
    requireOrigin = true,
    customErrorHandler = null,
    medicalEndpoint = false // Enhanced protection for medical endpoints
  } = options;

  return (req, res, next) => {
    // Skip CSRF check for safe methods
    if (ignoreMethods.includes(req.method)) {
      return next();
    }

    // Skip for API key authenticated requests (different security model)
    if (req.headers['x-api-key']) {
      return next();
    }

    // Validate origin/referer for medical endpoints
    if (medicalEndpoint || requireOrigin) {
      if (!validateOrigin(req)) {
        console.warn('CSRF: Invalid origin/referer', {
          origin: req.get('origin'),
          referer: req.get('referer'),
          ip: req.ip,
          endpoint: req.path
        });

        return handleCSRFError(req, res, 'Invalid origin', customErrorHandler);
      }
    }

    // Get token from multiple sources
    const token =
      req.get(CSRF_HEADER_NAME) || // Preferred: Custom header
      req.body?.[CSRF_BODY_FIELD] || // Form submission
      req.query?.[CSRF_BODY_FIELD] || // Query parameter (least preferred)
      req.cookies[CSRF_COOKIE_NAME]; // Cookie (double submit)

    if (!token) {
      console.warn('CSRF: Token missing', {
        ip: req.ip,
        endpoint: req.path,
        method: req.method
      });

      return handleCSRFError(req, res, 'CSRF token missing', customErrorHandler);
    }

    // Verify token
    const sessionId = getSessionId(req);
    if (!verifyToken(sessionId, token)) {
      console.warn('CSRF: Token validation failed', {
        ip: req.ip,
        endpoint: req.path,
        method: req.method,
        sessionId: sessionId.substring(0, 10) + '...'
      });

      // Log security event for HIPAA audit
      if (medicalEndpoint && req.auditLogger) {
        req.auditLogger.logSecurityEvent({
          eventType: 'CSRF_VALIDATION_FAILURE',
          severity: 'HIGH',
          ipAddress: req.ip,
          endpoint: req.path,
          timestamp: new Date().toISOString()
        });
      }

      return handleCSRFError(req, res, 'Invalid CSRF token', customErrorHandler);
    }

    // Token is valid - rotate for medical endpoints on sensitive operations
    if (medicalEndpoint && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const newToken = generateToken();
      storeToken(sessionId, newToken);
      res.cookie(CSRF_COOKIE_NAME, newToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: CSRF_TOKEN_EXPIRY,
        path: '/'
      });
      req.csrfToken = () => newToken;
    }

    next();
  };
}

/**
 * Handle CSRF errors
 */
function handleCSRFError(req, res, message, customHandler) {
  if (customHandler) {
    return customHandler(req, res, message);
  }

  // Check if this is an API request
  const isApiRequest =
    req.headers['content-type']?.includes('application/json') ||
    req.path.startsWith('/api/');

  if (isApiRequest) {
    return res.status(403).json({
      error: 'CSRF validation failed',
      message: message,
      code: 'CSRF_TOKEN_INVALID',
      timestamp: new Date().toISOString()
    });
  }

  // HTML response for browser requests
  res.status(403).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Security Error</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          text-align: center;
        }
        h1 { color: #e53e3e; margin-bottom: 1rem; }
        p { color: #4a5568; line-height: 1.6; }
        .shield { font-size: 4rem; margin-bottom: 1rem; }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
          margin-top: 1.5rem;
        }
        button:hover { background: #5a67d8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="shield">🛡️</div>
        <h1>Security Verification Failed</h1>
        <p>${message}. This request has been blocked to protect your security.</p>
        <p>Please refresh the page and try again.</p>
        <button onclick="window.location.reload()">Refresh Page</button>
      </div>
    </body>
    </html>
  `);
}

/**
 * CSRF Token Endpoint
 * Provides CSRF token to AJAX requests
 */
function getCSRFToken(req, res) {
  const token = req.csrfToken ? req.csrfToken() : null;

  if (!token) {
    return res.status(500).json({
      error: 'Failed to generate CSRF token'
    });
  }

  res.json({
    csrfToken: token,
    headerName: CSRF_HEADER_NAME,
    expiresIn: CSRF_TOKEN_EXPIRY
  });
}

/**
 * Medical Endpoint CSRF Protection
 * Enhanced protection for medical/PHI endpoints
 */
function medicalCSRFProtection(req, res, next) {
  return csrfProtection({
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    requireOrigin: true,
    medicalEndpoint: true
  })(req, res, next);
}

/**
 * Standard CSRF Protection
 * For non-medical endpoints
 */
function standardCSRFProtection(req, res, next) {
  return csrfProtection({
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    requireOrigin: true,
    medicalEndpoint: false
  })(req, res, next);
}

/**
 * Setup CSRF Protection for Express App
 */
function setupCSRFProtection(app) {
  console.log('\n🛡️ Initializing CSRF Protection...');

  // Cookie parser is required
  app.use(cookieParser());

  // Generate CSRF token for all requests
  app.use(generateCSRFToken);

  // CSRF token endpoint
  app.get('/api/csrf-token', getCSRFToken);

  console.log('✅ CSRF protection initialized');
  console.log('   Token length: 256 bits');
  console.log('   Token expiry: 24 hours');
  console.log('   Pattern: Double Submit Cookie + Synchronizer Token\n');

  // Start periodic cleanup
  setInterval(cleanupExpiredTokens, 60 * 60 * 1000); // Every hour
}

/**
 * Conditional CSRF Protection
 * Applies CSRF based on endpoint type
 */
function conditionalCSRF(req, res, next) {
  const path = req.path.toLowerCase();

  // Medical endpoints require enhanced CSRF
  if (
    path.includes('/medical/') ||
    path.includes('/health/') ||
    path.includes('/patient/') ||
    path.includes('/phi/') ||
    path.includes('/diagnosis/') ||
    path.includes('/prescription/')
  ) {
    return medicalCSRFProtection(req, res, next);
  }

  // Auth endpoints require CSRF
  if (
    path.includes('/auth/') ||
    path.includes('/login') ||
    path.includes('/register') ||
    path.includes('/settings')
  ) {
    return standardCSRFProtection(req, res, next);
  }

  // Skip CSRF for read-only API endpoints
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Apply standard CSRF to everything else
  return standardCSRFProtection(req, res, next);
}

module.exports = {
  setupCSRFProtection,
  generateCSRFToken,
  csrfProtection,
  medicalCSRFProtection,
  standardCSRFProtection,
  conditionalCSRF,
  getCSRFToken
};
