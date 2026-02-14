/**
 * AILYDIAN Admin Dashboard - Triple-Layer Authentication Middleware
 *
 * Layer 1: API Key validation (X-Admin-API-Key header vs DASHBOARD_ADMIN_API_KEY env)
 * Layer 2: HMAC-SHA256 request signing (X-Timestamp + X-Signature headers)
 *          Payload: method + path + timestamp + bodyHash
 *          Secret: DASHBOARD_SIGNING_SECRET env
 *          Replay window: 5 minutes (unix ms)
 * Layer 3: Admin JWT (Authorization: Bearer <token>, ADMIN_JWT_SECRET env)
 *
 * Rate limiting: 30 requests/minute per IP (in-memory Map with periodic cleanup)
 * CORS: Only https://dashboard.ailydian.com and https://seo.ailydian.com
 *
 * Exports:
 *   validateAdminRequest(req, res) -> { valid, admin, error }
 *   withAdminAuth(handler) -> wrapped Vercel serverless handler
 *
 * Usage:
 *   const { withAdminAuth } = require('./_middleware');
 *   module.exports = withAdminAuth(async (req, res) => { ... });
 *
 *   // Or standalone validation:
 *   const { validateAdminRequest } = require('./_middleware');
 *   const result = await validateAdminRequest(req, res);
 *   if (!result.valid) return res.status(401).json({ success: false, error: result.error });
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// ---------------------------------------------------------------------------
// CORS - Admin dashboard origins only
// ---------------------------------------------------------------------------

const ADMIN_ALLOWED_ORIGINS = ['https://dashboard.ailydian.com', 'https://seo.ailydian.com'];

/**
 * Get the allowed CORS origin for this request.
 * Returns the origin if it matches the allowlist, null otherwise.
 */
function getAdminCorsOrigin(req) {
  const origin = req.headers.origin;
  if (origin && ADMIN_ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return null;
}

/**
 * Set CORS headers for admin dashboard endpoints.
 * Only allows dashboard.ailydian.com and seo.ailydian.com.
 */
function setAdminCorsHeaders(req, res) {
  const origin = getAdminCorsOrigin(req);

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // If origin is not in allowlist, do NOT set Access-Control-Allow-Origin at all.
  // The browser will block the request on the client side.

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Admin-API-Key, X-Signature, X-Timestamp, X-Requested-With'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
}

// ---------------------------------------------------------------------------
// Rate Limiter - In-memory, 30 requests per minute per IP
// ---------------------------------------------------------------------------

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30;

// Cleanup stale entries every 5 minutes to prevent memory leaks in long-lived containers
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Extract client IP from request headers (Vercel / reverse proxy compatible).
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/**
 * Check rate limit for a given IP address.
 * Returns { allowed: boolean, remaining: number }
 */
function checkRateLimit(ip) {
  cleanupRateLimitMap();

  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { windowStart: now, count: 1 };
    rateLimitMap.set(ip, entry);
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  entry.count += 1;

  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// ---------------------------------------------------------------------------
// Layer 1 - API Key Validation
// ---------------------------------------------------------------------------

/**
 * Validate the X-Admin-API-Key header against DASHBOARD_ADMIN_API_KEY env var.
 * Uses constant-time comparison to prevent timing attacks.
 */
function validateApiKey(req) {
  const apiKey = req.headers['x-admin-api-key'];
  const expectedKey = process.env.DASHBOARD_ADMIN_API_KEY;

  if (!apiKey || !expectedKey) {
    return false;
  }

  // Constant-time comparison requires equal-length buffers
  const apiKeyBuf = Buffer.from(apiKey, 'utf-8');
  const expectedBuf = Buffer.from(expectedKey, 'utf-8');

  if (apiKeyBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(apiKeyBuf, expectedBuf);
}

// ---------------------------------------------------------------------------
// Layer 2 - HMAC-SHA256 Request Signature Validation
// ---------------------------------------------------------------------------

/**
 * Validate the HMAC-SHA256 signature.
 *
 * Client must send:
 *   X-Timestamp: unix milliseconds (e.g. Date.now())
 *   X-Signature: hex-encoded HMAC-SHA256 of (method + path + timestamp + bodyHash)
 *
 * bodyHash = SHA-256 hex of the raw request body (or empty string if no body).
 * Signing secret: DASHBOARD_SIGNING_SECRET env var.
 *
 * Replay protection: reject if timestamp is more than 5 minutes old.
 */
function validateSignature(req) {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const signingSecret = process.env.DASHBOARD_SIGNING_SECRET;

  if (!signature || !timestamp || !signingSecret) {
    return false;
  }

  // Parse timestamp as unix milliseconds
  const requestTimeMs = parseInt(timestamp, 10);
  if (isNaN(requestTimeMs)) {
    return false;
  }

  // Replay protection: reject requests older than 5 minutes
  const nowMs = Date.now();
  const MAX_DRIFT_MS = 5 * 60 * 1000;

  if (Math.abs(nowMs - requestTimeMs) > MAX_DRIFT_MS) {
    return false;
  }

  // Build the signing payload: method + path + timestamp + bodyHash
  const method = req.method.toUpperCase();
  const path = req.url || '/';

  // Compute SHA-256 hash of the request body
  const bodyStr = req.body
    ? typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body)
    : '';
  const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex');

  const payload = method + path + timestamp + bodyHash;
  const expectedSignature = crypto
    .createHmac('sha256', signingSecret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison
  const sigBuf = Buffer.from(signature, 'utf-8');
  const expectedBuf = Buffer.from(expectedSignature, 'utf-8');

  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

// ---------------------------------------------------------------------------
// Layer 3 - Admin JWT Validation
// ---------------------------------------------------------------------------

const ALLOWED_ROLES = ['super_admin', 'moderator'];

/**
 * Validate the Authorization: Bearer <token> header.
 * JWT is verified using ADMIN_JWT_SECRET env var with HS256.
 * Token must contain a valid `role` claim from ALLOWED_ROLES.
 *
 * Returns { valid: boolean, admin: object|null }
 */
function validateAdminJwt(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, admin: null };
  }

  const token = authHeader.slice(7);
  const jwtSecret = process.env.ADMIN_JWT_SECRET;

  if (!token || !jwtSecret) {
    return { valid: false, admin: null };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
    });

    // Validate role claim
    if (!decoded.role || !ALLOWED_ROLES.includes(decoded.role)) {
      return { valid: false, admin: null };
    }

    return {
      valid: true,
      admin: {
        sub: decoded.sub || null,
        role: decoded.role,
        email: decoded.email || null,
        iat: decoded.iat || null,
        exp: decoded.exp || null,
      },
    };
  } catch (_err) {
    // NEVER expose error.message - use generic Turkish message
    return { valid: false, admin: null };
  }
}

// ---------------------------------------------------------------------------
// Exported: validateAdminRequest
// ---------------------------------------------------------------------------

/**
 * Validate an admin request through all three security layers + rate limiting.
 * Does NOT set CORS headers or handle OPTIONS - caller is responsible.
 *
 * @param {object} req - Vercel/Express request object
 * @param {object} res - Vercel/Express response object (used for rate limit headers)
 * @returns {{ valid: boolean, admin: object|null, error: string|null }}
 */
function validateAdminRequest(req, res) {
  // --- Rate Limit Check (keyed by IP) ---
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp);

  if (!rateCheck.allowed) {
    if (res) {
      res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('Retry-After', '60');
    }
    return {
      valid: false,
      admin: null,
      error: 'Cok fazla istek. Lutfen bekleyin.',
    };
  }

  // Set rate limit headers
  if (res) {
    res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
    res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining));
  }

  // --- Layer 1: API Key ---
  const apiKeyValid = validateApiKey(req);
  if (!apiKeyValid) {
    return {
      valid: false,
      admin: null,
      error: 'Yetkilendirme hatasi',
    };
  }

  // --- Layer 2: HMAC-SHA256 Signature ---
  const signatureValid = validateSignature(req);
  if (!signatureValid) {
    return {
      valid: false,
      admin: null,
      error: 'Yetkilendirme hatasi',
    };
  }

  // --- Layer 3: Admin JWT ---
  const { valid: jwtValid, admin } = validateAdminJwt(req);
  if (!jwtValid) {
    return {
      valid: false,
      admin: null,
      error: 'Erisim reddedildi',
    };
  }

  return {
    valid: true,
    admin: admin,
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Exported: withAdminAuth (handler wrapper)
// ---------------------------------------------------------------------------

/**
 * Wraps an admin API handler with triple-layer authentication.
 * Handles CORS, OPTIONS preflight, rate limiting, and all three auth layers.
 *
 * On success, attaches req.adminUser with decoded JWT claims.
 *
 * @param {Function} handler - The actual API handler function(req, res)
 * @returns {Function} - Vercel serverless handler with auth checks
 */
function withAdminAuth(handler) {
  return async function adminAuthHandler(req, res) {
    // Set CORS headers on every response
    setAdminCorsHeaders(req, res);

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Run all validation layers
    const result = validateAdminRequest(req, res);

    if (!result.valid) {
      // Determine appropriate status code
      const statusCode =
        result.error === 'Cok fazla istek. Lutfen bekleyin.'
          ? 429
          : result.error === 'Erisim reddedildi'
            ? 403
            : 401;

      console.warn(`[ADMIN_AUTH] Rejected: ${statusCode}`);
      return res.status(statusCode).json({
        success: false,
        error: result.error,
      });
    }

    // Attach admin user info to request for downstream handlers
    req.adminUser = result.admin;

    // All layers passed - call the handler
    try {
      return await handler(req, res);
    } catch (_err) {
      // NEVER expose error.message in responses
      console.error('[ADMIN_DASHBOARD_ERROR]', _err.message);
      return res.status(500).json({
        success: false,
        error: 'Sunucu hatasi olustu',
      });
    }
  };
}

// ---------------------------------------------------------------------------
// Module Exports
// ---------------------------------------------------------------------------

module.exports = {
  validateAdminRequest,
  withAdminAuth,
  setAdminCorsHeaders,
  ADMIN_ALLOWED_ORIGINS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
};
