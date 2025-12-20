/**
 * API Response Sanitizer Middleware
 * ==================================
 *
 * CRITICAL SECURITY LAYER
 * Automatically sanitizes ALL API responses to prevent:
 * - AI model name leakage
 * - Provider name exposure
 * - API endpoint disclosure
 * - Sensitive metadata exposure
 *
 * Created: 2025-12-19
 */

const obfuscation = require('./ultra-obfuscation-map');

/**
 * Sanitize response body recursively
 * Removes all traces of AI provider/model names
 */
function sanitizeObject(obj, depth = 0) {
  // Prevent infinite recursion
  if (depth > 10) return obj;

  if (!obj || typeof obj !== 'object') {
    // Sanitize strings
    if (typeof obj === 'string') {
      return obfuscation.obfuscateText(obj);
    }
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  // Handle objects
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive keys entirely
    if (isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize values
    sanitized[key] = sanitizeObject(value, depth + 1);
  }

  return sanitized;
}

/**
 * Check if a key contains sensitive information
 */
function isSensitiveKey(key) {
  const sensitivePatterns = [
    /api[-_]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /private[-_]?key/i,
    /anthropic/i,
    /openai/i,
    /AX9F7E2B/i,
    /gpt/i,
    /model[-_]?name/i,
    /provider/i,
    /endpoint/i,
    /internal/i
  ];

  return sensitivePatterns.some(pattern => pattern.test(key));
}

/**
 * Sanitize HTTP headers
 */
function sanitizeHeaders(headers) {
  const sanitized = {};
  const headersToRemove = [
    'x-api-key',
    'authorization',
    'x-anthropic-version',
    'openai-organization',
    'x-model-id',
    'x-provider'
  ];

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    // Remove sensitive headers entirely
    if (headersToRemove.some(h => lowerKey.includes(h))) {
      continue;
    }

    // Sanitize header values
    if (typeof value === 'string') {
      sanitized[key] = obfuscation.obfuscateText(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Express middleware for response sanitization
 */
function sanitizeResponseMiddleware(req, res, next) {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override res.json
  res.json = function(data) {
    try {
      // Sanitize the response data
      const sanitized = sanitizeObject(data);

      // Log sanitization in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Response sanitized');
      }

      // Send sanitized response
      return originalJson(sanitized);
    } catch (error) {
      console.error('❌ Response sanitization error:', error);

      // In case of error, send generic error response
      return originalJson({
        success: false,
        error: 'Internal server error',
        code: 'SANITIZATION_ERROR'
      });
    }
  };

  // Also sanitize response headers
  const originalSet = res.set.bind(res);
  res.set = function(field, value) {
    if (typeof field === 'object') {
      const sanitizedHeaders = sanitizeHeaders(field);
      return originalSet(sanitizedHeaders);
    } else if (typeof field === 'string') {
      const sanitizedValue = typeof value === 'string'
        ? obfuscation.obfuscateText(value)
        : value;
      return originalSet(field, sanitizedValue);
    }
    return originalSet(field, value);
  };

  next();
}

/**
 * Sanitize error messages
 */
function sanitizeError(error) {
  if (!error) return error;

  const sanitized = {
    message: obfuscation.obfuscateText(error.message || 'An error occurred'),
    code: error.code || 'UNKNOWN_ERROR'
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    sanitized.stack = obfuscation.obfuscateText(error.stack);
  }

  return sanitized;
}

/**
 * Global error handler with sanitization
 */
function sanitizedErrorHandler(err, req, res, next) {
  console.error('❌ Error:', sanitizeError(err));

  const statusCode = err.statusCode || err.status || 500;
  const sanitizedError = sanitizeError(err);

  res.status(statusCode).json({
    success: false,
    error: sanitizedError.message,
    code: sanitizedError.code,
    ...(process.env.NODE_ENV === 'development' && { stack: sanitizedError.stack })
  });
}

/**
 * Sanitize log messages
 */
function sanitizeLog(...args) {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return obfuscation.obfuscateText(arg);
    }
    if (typeof arg === 'object') {
      return sanitizeObject(arg);
    }
    return arg;
  });
}

/**
 * Create sanitized console wrapper
 */
function createSanitizedConsole() {
  return {
    log: (...args) => console.log(...sanitizeLog(...args)),
    error: (...args) => console.error(...sanitizeLog(...args)),
    warn: (...args) => console.warn(...sanitizeLog(...args)),
    info: (...args) => console.info(...sanitizeLog(...args)),
    debug: (...args) => console.debug(...sanitizeLog(...args))
  };
}

module.exports = {
  sanitizeObject,
  sanitizeHeaders,
  sanitizeError,
  sanitizeLog,
  sanitizeResponseMiddleware,
  sanitizedErrorHandler,
  createSanitizedConsole,
  isSensitiveKey
};
