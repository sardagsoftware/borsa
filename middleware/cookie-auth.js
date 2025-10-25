/**
 * HTTP-Only Cookie Authentication Middleware
 *
 * Provides secure cookie-based authentication with:
 * - httpOnly flag (XSS protection)
 * - Secure flag (HTTPS only)
 * - SameSite=Strict (CSRF protection)
 * - CSRF token validation
 *
 * Usage:
 *   const { setCookie, getCookie, clearCookie, generateCSRFToken } = require('./middleware/cookie-auth');
 */

const crypto = require('crypto');

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours (milliseconds)
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Set authentication cookie
 * @param {Object} res - Express response object
 * @param {String} name - Cookie name
 * @param {String} value - Cookie value
 * @param {Object} options - Cookie options (optional)
 */
function setCookie(res, name, value, options = {}) {
  const opts = { ...COOKIE_OPTIONS, ...options };

  // Build cookie string
  const cookieParts = [`${name}=${value}`];

  if (opts.httpOnly) cookieParts.push('HttpOnly');
  if (opts.secure) cookieParts.push('Secure');
  if (opts.sameSite) cookieParts.push(`SameSite=${opts.sameSite}`);
  if (opts.path) cookieParts.push(`Path=${opts.path}`);
  if (opts.maxAge) cookieParts.push(`Max-Age=${Math.floor(opts.maxAge / 1000)}`);
  if (opts.domain) cookieParts.push(`Domain=${opts.domain}`);

  const cookieString = cookieParts.join('; ');

  // Set cookie header (append if exists)
  const existingCookies = res.getHeader('Set-Cookie') || [];
  const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies];
  cookies.push(cookieString);
  res.setHeader('Set-Cookie', cookies);

  return cookieString;
}

/**
 * Set authentication cookies (access + refresh tokens)
 * @param {Object} res - Express response object
 * @param {String} accessToken - JWT access token
 * @param {String} refreshToken - JWT refresh token (optional)
 */
function setAuthCookies(res, accessToken, refreshToken = null) {
  // Set access token cookie (15 min for better security)
  setCookie(res, 'auth_token', accessToken, {
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Set refresh token cookie (7 days, limited path)
  if (refreshToken) {
    setCookie(res, 'refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
  }

  console.log('✅ Authentication cookies set (httpOnly, secure, sameSite=strict)');
}

/**
 * Get cookie value from request
 * @param {Object} req - Express request object
 * @param {String} name - Cookie name
 * @returns {String|null} Cookie value or null
 */
function getCookie(req, name) {
  if (!req.headers.cookie) {
    return null;
  }

  const cookies = req.headers.cookie.split(';').map(c => c.trim());
  const cookie = cookies.find(c => c.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return cookie.split('=')[1];
}

/**
 * Clear authentication cookies (logout)
 * @param {Object} res - Express response object
 */
function clearAuthCookies(res) {
  // Set expired cookies
  setCookie(res, 'auth_token', '', { maxAge: 0 });
  setCookie(res, 'refresh_token', '', { maxAge: 0, path: '/api/auth/refresh' });
  setCookie(res, 'csrf_token', '', { maxAge: 0, httpOnly: false });

  console.log('✅ Authentication cookies cleared');
}

/**
 * Generate CSRF token
 * @returns {String} CSRF token (32 bytes hex)
 */
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Set CSRF token cookie (NOT httpOnly, needs to be readable by JavaScript)
 * @param {Object} res - Express response object
 * @param {String} csrfToken - CSRF token
 */
function setCSRFCookie(res, csrfToken) {
  setCookie(res, 'csrf_token', csrfToken, {
    httpOnly: false, // JavaScript needs to read this
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  console.log('✅ CSRF token cookie set');
}

/**
 * Validate CSRF token
 * @param {Object} req - Express request object
 * @returns {Boolean} Valid or not
 */
function validateCSRFToken(req) {
  const cookieToken = getCookie(req, 'csrf_token');
  const headerToken = req.headers['x-csrf-token'] || req.body.csrfToken;

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}

/**
 * CSRF protection middleware
 * Use this for POST/PUT/DELETE requests
 */
function csrfProtection(req, res, next) {
  // Skip CSRF for GET/HEAD/OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  if (!validateCSRFToken(req)) {
    console.log('❌ CSRF token validation failed');
    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token'
    });
  }

  next();
}

/**
 * Extract auth token from cookie (for JWT middleware)
 * @param {Object} req - Express request object
 * @returns {String|null} Auth token
 */
function getAuthToken(req) {
  // Try cookie first (httpOnly)
  const cookieToken = getCookie(req, 'auth_token');
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to Authorization header (for API clients)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

module.exports = {
  setCookie,
  setAuthCookies,
  getCookie,
  clearAuthCookies,
  generateCSRFToken,
  setCSRFCookie,
  validateCSRFToken,
  csrfProtection,
  getAuthToken,
  COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
};
