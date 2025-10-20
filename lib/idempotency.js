/**
 * ═══════════════════════════════════════════════════════════════════════════
 * IDEMPOTENCY SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Prevents duplicate request processing using idempotency keys
 *
 * Features:
 * - UUID v4 validation
 * - Redis-backed cache (7 day TTL per KVKK)
 * - Automatic replay detection
 * - Request fingerprinting
 *
 * Usage:
 * Client sends: Idempotency-Key: <uuid-v4>
 * If duplicate detected, returns cached response with X-Idempotent-Replay: true
 *
 * @module lib/idempotency
 */

const crypto = require('crypto');
const { cacheGet, cacheSet } = require('./cache/redis-cache');

// UUID v4 regex validation
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Cache TTL: 7 days (KVKK retention policy)
const IDEMPOTENCY_TTL = 7 * 24 * 60 * 60;

/**
 * Validate idempotency key format
 * @param {string} key Idempotency key
 * @returns {Object} { valid: boolean, reason?: string }
 */
function validateIdempotencyKey(key) {
  if (!key || typeof key !== 'string') {
    return {
      valid: false,
      reason: 'Idempotency key must be a non-empty string',
    };
  }

  if (!UUID_V4_REGEX.test(key)) {
    return {
      valid: false,
      reason: 'Idempotency key must be a valid UUID v4',
    };
  }

  return { valid: true };
}

/**
 * Generate idempotency key (client-side helper)
 * @returns {string} UUID v4
 */
function generateIdempotencyKey() {
  return crypto.randomUUID();
}

/**
 * Check if request was already processed (cache lookup)
 * @param {string} key Idempotency key
 * @returns {Promise<Object|null>} Cached response or null
 */
async function checkIdempotencyCache(key) {
  try {
    const cacheKey = `idempotency:${key}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      console.log(`[Idempotency] Cache hit for key: ${key}`);
      return cached;
    }

    return null;
  } catch (error) {
    console.error('[Idempotency] Cache check failed:', error);
    // On cache failure, proceed with request (fail-open)
    return null;
  }
}

/**
 * Store response in idempotency cache
 * @param {string} key Idempotency key
 * @param {Object} response Response to cache
 * @param {number} ttl TTL in seconds (default: 7 days)
 * @returns {Promise<boolean>} Success
 */
async function storeIdempotentResponse(key, response, ttl = IDEMPOTENCY_TTL) {
  try {
    const cacheKey = `idempotency:${key}`;
    await cacheSet(cacheKey, response, ttl);

    console.log(`[Idempotency] Stored response for key: ${key}`);
    return true;
  } catch (error) {
    console.error('[Idempotency] Cache store failed:', error);
    // Non-blocking - request already completed
    return false;
  }
}

/**
 * Generate request fingerprint (for advanced duplicate detection)
 * @param {Object} req Express request object
 * @returns {string} SHA-256 fingerprint
 */
function generateRequestFingerprint(req) {
  const components = [
    req.method,
    req.path,
    JSON.stringify(req.body || {}),
    JSON.stringify(req.query || {}),
    req.user?.id || 'anonymous',
  ];

  const data = components.join('::');
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Check for duplicate requests using fingerprint (secondary check)
 * @param {Object} req Express request object
 * @returns {Promise<Object|null>} Cached response or null
 */
async function checkFingerprintCache(req) {
  try {
    const fingerprint = generateRequestFingerprint(req);
    const cacheKey = `fingerprint:${fingerprint}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      console.log(`[Idempotency] Fingerprint match: ${fingerprint}`);
      return cached;
    }

    return null;
  } catch (error) {
    console.error('[Idempotency] Fingerprint check failed:', error);
    return null;
  }
}

/**
 * Store response by fingerprint
 * @param {Object} req Express request object
 * @param {Object} response Response to cache
 * @param {number} ttl TTL in seconds (default: 5 minutes)
 * @returns {Promise<boolean>} Success
 */
async function storeFingerprintResponse(req, response, ttl = 5 * 60) {
  try {
    const fingerprint = generateRequestFingerprint(req);
    const cacheKey = `fingerprint:${fingerprint}`;
    await cacheSet(cacheKey, response, ttl);

    console.log(`[Idempotency] Stored fingerprint: ${fingerprint}`);
    return true;
  } catch (error) {
    console.error('[Idempotency] Fingerprint store failed:', error);
    return false;
  }
}

/**
 * Middleware to enforce idempotency for POST/PUT/PATCH
 * @param {Object} options Options { required: boolean }
 * @returns {Function} Express middleware
 */
function idempotencyMiddleware(options = {}) {
  const { required = false } = options;

  return async (req, res, next) => {
    // Only apply to mutation methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'];

    // If required but missing, reject
    if (required && !idempotencyKey) {
      return res.status(400).json({
        success: false,
        error: 'IDEMPOTENCY_KEY_REQUIRED',
        errorTR: 'Idempotency-Key başlığı gereklidir',
        errorEN: 'Idempotency-Key header is required',
      });
    }

    // If provided, validate
    if (idempotencyKey) {
      const validation = validateIdempotencyKey(idempotencyKey);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_IDEMPOTENCY_KEY',
          errorTR: 'Geçersiz Idempotency-Key formatı (UUID v4 gereklidir)',
          errorEN: 'Invalid Idempotency-Key format (UUID v4 required)',
          reason: validation.reason,
        });
      }

      // Check cache
      const cached = await checkIdempotencyCache(idempotencyKey);
      if (cached) {
        res.set('X-Idempotent-Replay', 'true');
        return res.status(200).json(cached);
      }
    }

    // Not a duplicate - proceed
    next();
  };
}

module.exports = {
  validateIdempotencyKey,
  generateIdempotencyKey,
  checkIdempotencyCache,
  storeIdempotentResponse,
  generateRequestFingerprint,
  checkFingerprintCache,
  storeFingerprintResponse,
  idempotencyMiddleware,
  IDEMPOTENCY_TTL,
};
