/**
 * 🔐 MODEL SECURITY MIDDLEWARE
 * ============================
 * Express middleware for AI model obfuscation
 * Intercepts all API requests/responses to sanitize model identifiers
 *
 * SECURITY FEATURES:
 * - Request payload sanitization
 * - Response payload sanitization
 * - Model code validation
 * - Error message filtering
 * - Logging sanitization
 */

const { getObfuscator } = require('../../security/model-obfuscation');

/**
 * Main security middleware
 * Wraps all API endpoints to ensure no model names leak
 */
function modelSecurityMiddleware(req, res, next) {
  const obfuscator = getObfuscator();

  // 1. Sanitize incoming request body
  if (req.body && typeof req.body === 'object') {
    req.body = obfuscator.sanitizeLog(req.body);
  }

  // 2. Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = obfuscator.sanitizeLog(req.query);
  }

  // 3. Intercept response.json() to sanitize outgoing data
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const sanitized = obfuscator.sanitizeLog(data);
    return originalJson(sanitized);
  };

  // 4. Intercept response.send() for non-JSON responses
  const originalSend = res.send.bind(res);
  res.send = function(data) {
    if (typeof data === 'string') {
      // Sanitize string responses
      data = obfuscator.sanitizeError({ message: data });
    } else if (typeof data === 'object') {
      data = obfuscator.sanitizeLog(data);
    }
    return originalSend(data);
  };

  next();
}

/**
 * Model code validator middleware
 * Ensures only valid LX/VX/QX/NX codes are accepted
 */
function validateModelCode(req, res, next) {
  const modelCode = req.body?.modelCode || req.query?.modelCode || req.params?.modelCode;

  if (!modelCode) {
    return next(); // No model code specified, skip validation
  }

  const obfuscator = getObfuscator();
  const validCodes = ['LX01', 'LX02', 'LX03', 'LX04', 'VX01', 'QX01', 'NX01'];

  if (!validCodes.includes(modelCode)) {
    return res.status(400).json({
      error: 'INVALID_MODEL_CODE',
      message: 'Invalid AI engine identifier'
    });
  }

  // Attach safe model info to request
  req.modelInfo = obfuscator.getSafeModelInfo(modelCode);

  next();
}

/**
 * Error handler middleware
 * Sanitizes all error messages before sending to client
 */
function errorSanitizerMiddleware(err, req, res, next) {
  const obfuscator = getObfuscator();

  // Sanitize error message
  const sanitizedMessage = obfuscator.sanitizeError(err);

  // Log sanitized error (for internal debugging)
  if (process.env.NODE_ENV !== 'production') {
    console.error('[SANITIZED ERROR]:', sanitizedMessage);
  }

  // Send generic error to client
  res.status(err.status || 500).json({
    error: 'AI_ENGINE_ERROR',
    message: sanitizedMessage,
    code: err.code || 'INTERNAL_ERROR'
  });
}

/**
 * Request logger middleware (sanitized)
 * Logs API requests without exposing sensitive model info
 */
function sanitizedLogger(req, res, next) {
  const obfuscator = getObfuscator();

  if (process.env.NODE_ENV !== 'production') {
    const logData = {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      timestamp: new Date().toISOString()
    };

    const sanitized = obfuscator.sanitizeLog(logData);
    console.log('[API REQUEST]:', JSON.stringify(sanitized, null, 2));
  }

  next();
}

/**
 * Production-only middleware
 * Completely removes all console.log in production
 */
function productionSecurityEnforcement(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    // Override console methods to sanitize everything
    const obfuscator = getObfuscator();

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      const sanitized = args.map(arg => obfuscator.sanitizeLog(arg));
      originalLog(...sanitized);
    };

    console.error = (...args) => {
      const sanitized = args.map(arg => obfuscator.sanitizeLog(arg));
      originalError(...sanitized);
    };

    console.warn = (...args) => {
      const sanitized = args.map(arg => obfuscator.sanitizeLog(arg));
      originalWarn(...sanitized);
    };
  }

  next();
}

/**
 * Response headers sanitization
 * Removes any headers that might leak model information
 */
function sanitizeResponseHeaders(req, res, next) {
  // Remove potentially leaky headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('X-Model-Provider');
  res.removeHeader('X-AI-Model');

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  next();
}

module.exports = {
  modelSecurityMiddleware,
  validateModelCode,
  errorSanitizerMiddleware,
  sanitizedLogger,
  productionSecurityEnforcement,
  sanitizeResponseHeaders
};
