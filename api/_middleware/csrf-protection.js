// ============================================
// 🔒 CSRF PROTECTION MIDDLEWARE
// Beyaz Şapkalı Güvenlik - CSRF Token Validation
// Version: 1.0.0
// ============================================

const crypto = require('crypto');

/**
 * Simple CSRF Token Generator
 * For API-based apps without traditional sessions
 */
class CSRFProtection {
  constructor(options = {}) {
    if (!options.secret && !process.env.CSRF_SECRET) {
      console.error('CSRF_SECRET environment variable not set');
    }
    this.secret =
      options.secret ||
      process.env.CSRF_SECRET ||
      require('crypto').randomBytes(32).toString('hex');
    this.tokenExpiry = options.tokenExpiry || 3600000; // 1 hour default
    this.headerName = options.headerName || 'x-csrf-token';
  }

  /**
   * Generate CSRF token
   * @param {string} sessionId - Unique session identifier (can be IP + User-Agent)
   * @returns {string} CSRF token
   */
  generateToken(sessionId) {
    const timestamp = Date.now();
    const payload = `${sessionId}:${timestamp}`;
    const signature = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');

    // Base64 encode: payload:signature
    return Buffer.from(`${payload}:${signature}`).toString('base64');
  }

  /**
   * Validate CSRF token
   * @param {string} token - CSRF token to validate
   * @param {string} sessionId - Session identifier to validate against
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateToken(token, sessionId) {
    if (!token) {
      return { valid: false, error: 'CSRF token missing' };
    }

    try {
      // Decode token
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [tokenSessionId, timestamp, signature] = decoded.split(':');

      // Validate session ID
      if (tokenSessionId !== sessionId) {
        console.warn('[CSRF] Session ID mismatch');
        return { valid: false, error: 'Invalid CSRF token' };
      }

      // Validate timestamp (not expired)
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > this.tokenExpiry) {
        console.warn('[CSRF] Token expired:', tokenAge, 'ms');
        return { valid: false, error: 'CSRF token expired' };
      }

      // Validate signature
      const expectedPayload = `${tokenSessionId}:${timestamp}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(expectedPayload)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('[CSRF] Signature mismatch');
        return { valid: false, error: 'Invalid CSRF token' };
      }

      return { valid: true };
    } catch (error) {
      console.error('[CSRF] Token validation error:', error.message);
      return { valid: false, error: 'Invalid CSRF token format' };
    }
  }

  /**
   * Get session identifier from request
   * @param {Object} req - Request object
   * @returns {string} Session identifier
   */
  getSessionId(req) {
    // Use IP + User-Agent as session identifier
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      'unknown';

    const userAgent = req.headers['user-agent'] || 'unknown';

    // Hash to create consistent session ID
    return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex').substring(0, 32);
  }
}

// Create singleton instance
const csrfProtection = new CSRFProtection();

/**
 * CSRF Protection Middleware
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function csrfMiddleware(req, res, next) {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // 🔧 TRUSTED ORIGINS: Skip CSRF for trusted domains
  const trustedOrigins = [
    'www.ailydian.com',
    'ailydian.com',
    'ailydian-ultra-pro.vercel.app',
    'ailydian.vercel.app',
  ];

  const isTrustedOrigin = trustedOrigins.some(
    origin =>
      req.headers.host?.includes(origin) ||
      req.headers.origin?.includes(origin) ||
      req.headers.referer?.includes(origin)
  );

  if (isTrustedOrigin) {
    console.log('[CSRF] 🔓 Trusted origin detected - CSRF check skipped');
    return next();
  }

  // Get session ID
  const sessionId = csrfProtection.getSessionId(req);

  // Check for CSRF token in headers or body
  const token =
    req.headers[csrfProtection.headerName] || req.body?.csrfToken || req.query?.csrfToken;

  // Validate token
  const validation = csrfProtection.validateToken(token, sessionId);

  if (!validation.valid) {
    console.error(`[CSRF] 🚨 CSRF validation failed: ${validation.error}`);

    // ✅ PRODUCTION MODE ACTIVE - Blocking invalid requests
    return res.status(403).json({
      success: false,
      error: 'CSRF validation failed',
      message: 'İstek doğrulanamadı. Lütfen sayfayı yenileyin.',
      code: 'CSRF_VALIDATION_FAILED',
    });
  }

  console.log(`[CSRF] ✅ Request validated (session: ${sessionId.substring(0, 8)}...)`);
  next();
}

/**
 * Generate token endpoint helper
 * Usage: Add GET /api/csrf-token endpoint that calls this
 */
function generateTokenEndpoint(req, res) {
  const sessionId = csrfProtection.getSessionId(req);
  const token = csrfProtection.generateToken(sessionId);

  res.status(200).json({
    success: true,
    csrfToken: token,
    expiresIn: csrfProtection.tokenExpiry,
  });
}

// Export for use in API routes
module.exports = {
  csrfMiddleware,
  csrfProtection,
  generateTokenEndpoint,
};
