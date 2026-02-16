/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BASE API HANDLER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Unified API handler for all Lydian-IQ connector endpoints
 *
 * Features:
 * - RBAC/ABAC scope validation
 * - Legal Gate enforcement (white-hat only)
 * - Rate limiting with 429 Retry-After
 * - Idempotency key support
 * - Request sanitization
 * - Response formatting
 * - Error handling with i18n
 * - Telemetry emission
 * - KVKK/GDPR compliance
 *
 * @module api/v1/_base/api-handler
 */

const { verifyScopes } = require('../../../lib/auth/rbac');
const { checkLegalGate } = require('../../../lib/auth/legal-gate');
const { rateLimitCheck } = require('../../../middleware/security-rate-limiters');
const { validateIdempotencyKey, checkIdempotencyCache } = require('../../../lib/idempotency');
const { sanitizeInput } = require('../../../security/input-sanitizer');
const { emitTelemetry } = require('../../../lib/monitoring/telemetry');
const { getVaultSecret } = require('../../../lib/vault/secrets');
const { applySanitization } = require('../../_middleware/sanitize');
const { getCorsOrigin } = require('../../_middleware/cors');

/**
 * Create a standardized API handler
 * @param {Object} config Handler configuration
 * @param {string[]} config.requiredScopes RBAC scopes required
 * @param {string} config.connector Connector name (e.g., 'trendyol', 'aras')
 * @param {string} config.action Action name (e.g., 'track', 'sync', 'compare')
 * @param {Function} config.handler Actual business logic handler
 * @param {Object} config.rateLimit Rate limit config { window: '1m', max: 30 }
 * @param {boolean} config.idempotent Whether to support idempotency (default: true)
 * @param {boolean} config.streaming Whether to support SSE streaming (default: false)
 * @returns {Function} Express middleware
 */
function createApiHandler(config) {
  const {
    requiredScopes = [],
    connector,
    action,
    handler,
    rateLimit = { window: '1m', max: 30 },
    idempotent = true,
    streaming = false,
  } = config;

  return async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Idempotency-Key, X-CSRF-Token'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(200).end();

    applySanitization(req, res);
    const startTime = Date.now();
    const telemetryData = {
      connector,
      action,
      locale: req.headers['accept-language']?.split(',')[0] || 'tr',
      userId: req.user?.id || 'anonymous',
      success: false,
      error: null,
      latency: 0,
    };

    try {
      // ═══════════════════════════════════════════════════════════════
      // 1. RBAC/ABAC Scope Validation
      // ═══════════════════════════════════════════════════════════════
      if (requiredScopes.length > 0) {
        const scopeCheck = await verifyScopes(req.user, requiredScopes);
        if (!scopeCheck.valid) {
          telemetryData.error = 'INSUFFICIENT_SCOPES';
          await emitTelemetry('api.request', telemetryData);

          return res.status(403).json({
            success: false,
            error: 'INSUFFICIENT_SCOPES',
            errorTR: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz yok',
            errorEN: 'Insufficient permissions to execute this action',
            requiredScopes,
            userScopes: req.user?.scopes || [],
          });
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // 2. Legal Gate (white-hat only, partner status check)
      // ═══════════════════════════════════════════════════════════════
      const legalGate = await checkLegalGate(connector);
      if (!legalGate.allowed) {
        telemetryData.error = 'LEGAL_GATE_BLOCKED';
        await emitTelemetry('api.request', telemetryData);

        return res.status(403).json({
          success: false,
          error: 'LEGAL_GATE_BLOCKED',
          errorTR: legalGate.reasonTR,
          errorEN: legalGate.reasonEN,
          status: legalGate.status,
          partnerRequired: legalGate.partnerRequired,
          applyUrl: legalGate.applyUrl,
        });
      }

      // ═══════════════════════════════════════════════════════════════
      // 3. Rate Limiting (429 with Retry-After)
      // ═══════════════════════════════════════════════════════════════
      const rateLimitResult = await rateLimitCheck(req, `${connector}:${action}`, rateLimit);

      if (!rateLimitResult.allowed) {
        telemetryData.error = 'RATE_LIMIT_EXCEEDED';
        await emitTelemetry('api.request', telemetryData);

        res.set('Retry-After', rateLimitResult.retryAfter);
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          errorTR: 'Hız limiti aşıldı, lütfen daha sonra tekrar deneyin',
          errorEN: 'Rate limit exceeded, please try again later',
          retryAfter: rateLimitResult.retryAfter,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
        });
      }

      // ═══════════════════════════════════════════════════════════════
      // 4. Idempotency Check
      // ═══════════════════════════════════════════════════════════════
      if (idempotent) {
        const idempotencyKey = req.headers['idempotency-key'];
        if (idempotencyKey) {
          const validation = validateIdempotencyKey(idempotencyKey);
          if (!validation.valid) {
            return res.status(400).json({
              success: false,
              error: 'INVALID_IDEMPOTENCY_KEY',
              errorTR: 'Geçersiz idempotency anahtarı',
              errorEN: 'Invalid idempotency key',
              reason: validation.reason,
            });
          }

          // Check cache for duplicate request
          const cached = await checkIdempotencyCache(idempotencyKey);
          if (cached) {
            telemetryData.idempotent = true;
            telemetryData.success = true;
            await emitTelemetry('api.request', telemetryData);

            res.set('X-Idempotent-Replay', 'true');
            return res.status(200).json(cached);
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // 5. Input Sanitization (XSS, SQLi, Path Traversal prevention)
      // ═══════════════════════════════════════════════════════════════
      const sanitizedBody = sanitizeInput(req.body);
      const sanitizedQuery = sanitizeInput(req.query);

      // ═══════════════════════════════════════════════════════════════
      // 6. Fetch Vault Secrets (connector API credentials)
      // ═══════════════════════════════════════════════════════════════
      const secrets = await getVaultSecret(`connector/${connector}`);
      if (!secrets) {
        telemetryData.error = 'VAULT_SECRET_NOT_FOUND';
        await emitTelemetry('api.request', telemetryData);

        return res.status(500).json({
          success: false,
          error: 'CONNECTOR_NOT_CONFIGURED',
          errorTR: 'Bağlayıcı yapılandırılmamış',
          errorEN: 'Connector not configured',
        });
      }

      // ═══════════════════════════════════════════════════════════════
      // 7. Execute Business Logic
      // ═══════════════════════════════════════════════════════════════
      const handlerContext = {
        user: req.user,
        locale: telemetryData.locale,
        secrets,
        sanitizedBody,
        sanitizedQuery,
        connector,
        action,
        streaming,
      };

      const result = await handler(handlerContext, req, res);

      // If streaming, handler manages response
      if (streaming && res.headersSent) {
        telemetryData.success = true;
        telemetryData.streaming = true;
        telemetryData.latency = Date.now() - startTime;
        await emitTelemetry('api.request', telemetryData);
        return;
      }

      // ═══════════════════════════════════════════════════════════════
      // 8. Cache Response for Idempotency (if applicable)
      // ═══════════════════════════════════════════════════════════════
      if (idempotent && req.headers['idempotency-key']) {
        await cacheIdempotentResponse(req.headers['idempotency-key'], result);
      }

      // ═══════════════════════════════════════════════════════════════
      // 9. Return Success Response
      // ═══════════════════════════════════════════════════════════════
      telemetryData.success = true;
      telemetryData.latency = Date.now() - startTime;
      await emitTelemetry('api.request', telemetryData);

      return res.status(200).json({
        success: true,
        data: result.data,
        metadata: {
          connector,
          action,
          executionTime: telemetryData.latency,
          timestamp: new Date().toISOString(),
          retries: result.retries || 0,
        },
      });
    } catch (error) {
      // ═══════════════════════════════════════════════════════════════
      // 10. Error Handling
      // ═══════════════════════════════════════════════════════════════
      console.error(`[API Handler] ${connector}.${action} error:`, error.message);

      telemetryData.error = error.code || 'EXECUTION_ERROR';
      telemetryData.latency = Date.now() - startTime;
      await emitTelemetry('api.request', telemetryData);

      // Don't expose internal errors to client
      const sanitizedError = sanitizeError(error, telemetryData.locale);

      return res.status(error.statusCode || 500).json({
        success: false,
        error: sanitizedError.code,
        errorTR: sanitizedError.messageTR,
        errorEN: sanitizedError.messageEN,
        metadata: {
          connector,
          action,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

/**
 * Sanitize error for client response (KVKK/GDPR)
 */
function sanitizeError(error, locale = 'tr') {
  const errorMap = {
    TIMEOUT: {
      code: 'TIMEOUT',
      messageTR: 'İstek zaman aşımına uğradı',
      messageEN: 'Request timeout',
    },
    NETWORK_ERROR: {
      code: 'NETWORK_ERROR',
      messageTR: 'Ağ bağlantı hatası',
      messageEN: 'Network connection error',
    },
    VENDOR_ERROR: {
      code: 'VENDOR_ERROR',
      messageTR: 'Üçüncü parti hizmet hatası',
      messageEN: 'Third-party service error',
    },
    INVALID_INPUT: {
      code: 'INVALID_INPUT',
      messageTR: 'Geçersiz girdi',
      messageEN: 'Invalid input',
    },
  };

  return (
    errorMap[error.code] || {
      code: 'EXECUTION_ERROR',
      messageTR: 'İşlem sırasında bir hata oluştu',
      messageEN: 'An error occurred during execution',
    }
  );
}

/**
 * Cache idempotent response (7 day TTL per KVKK)
 */
async function cacheIdempotentResponse(key, response) {
  const { cacheSet } = require('../../../lib/cache/redis-cache');
  await cacheSet(`idempotency:${key}`, response, 7 * 24 * 60 * 60); // 7 days
}

module.exports = {
  createApiHandler,
  sanitizeError,
};
