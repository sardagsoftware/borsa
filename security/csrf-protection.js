/**
 * CSRF Protection Middleware
 * Fixes: MEDIUM - CSRF tokens not implemented
 */

const crypto = require('crypto');

// Token store (use Redis in production)
const tokenStore = new Map();

/**
 * Generate CSRF token for session
 */
function generateCSRFToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');

  tokenStore.set(sessionId, {
    token,
    createdAt: Date.now()
  });

  // Clean up old tokens after 1 hour
  setTimeout(() => {
    tokenStore.delete(sessionId);
  }, 60 * 60 * 1000);

  return token;
}

/**
 * Validate CSRF token
 */
function validateCSRFToken(sessionId, token) {
  const stored = tokenStore.get(sessionId);

  if (!stored) {
    return false;
  }

  // Check token age
  const age = Date.now() - stored.createdAt;
  if (age > 60 * 60 * 1000) { // 1 hour max
    tokenStore.delete(sessionId);
    return false;
  }

  return stored.token === token;
}

/**
 * CSRF protection middleware
 */
function csrfProtection(req, res, next) {
  // Skip for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for webhook endpoints (use signature validation instead)
  if (req.path.includes('/webhook')) {
    return next();
  }

  const sessionId = req.session?.id || req.cookies?.sessionId;
  const token = req.headers['x-csrf-token'] || req.body?._csrf;

  if (!sessionId || !token) {
    return res.status(403).json({
      error: 'CSRF token missing',
      code: 'CSRF_TOKEN_REQUIRED'
    });
  }

  if (!validateCSRFToken(sessionId, token)) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  next();
}

/**
 * Middleware to inject CSRF token into response
 */
function injectCSRFToken(req, res, next) {
  const sessionId = req.session?.id || req.cookies?.sessionId;

  if (sessionId) {
    const token = generateCSRFToken(sessionId);
    res.locals.csrfToken = token;
    res.setHeader('X-CSRF-Token', token);
  }

  next();
}

module.exports = {
  csrfProtection,
  injectCSRFToken,
  generateCSRFToken,
  validateCSRFToken
};
