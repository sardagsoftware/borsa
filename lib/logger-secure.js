/**
 * SECURE LOGGING UTILITY
 * Prevents sensitive data from being logged
 * White-Hat Security Implementation
 */

/**
 * Sensitive field patterns to redact
 */
const SENSITIVE_PATTERNS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apikey',
  'api_key',
  'apiKey',
  'authorization',
  'auth',
  'bearer',
  'cookie',
  'session',
  'ssn',
  'social_security',
  'credit_card',
  'card_number',
  'cvv',
  'pin',
  'private_key',
  'privateKey',
  'access_token',
  'refresh_token',
  'jwt',
  'otp',
  'mfa',
  '2fa'
];

/**
 * Check if a key is sensitive
 */
function isSensitiveKey(key) {
  const lowerKey = String(key).toLowerCase();
  return SENSITIVE_PATTERNS.some(pattern =>
    lowerKey.includes(pattern.toLowerCase())
  );
}

/**
 * Redact sensitive data from object
 */
function redactSensitiveData(obj, maxDepth = 10, currentDepth = 0) {
  // Prevent infinite recursion
  if (currentDepth > maxDepth) {
    return '[MAX_DEPTH_REACHED]';
  }

  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, maxDepth, currentDepth + 1));
  }

  // Handle objects
  const redacted = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (isSensitiveKey(key)) {
        // Redact sensitive fields
        const value = obj[key];
        if (typeof value === 'string' && value.length > 0) {
          // Show first 3 chars only
          redacted[key] = value.substring(0, 3) + '***REDACTED***';
        } else {
          redacted[key] = '***REDACTED***';
        }
      } else {
        // Recursively redact nested objects
        redacted[key] = redactSensitiveData(obj[key], maxDepth, currentDepth + 1);
      }
    }
  }

  return redacted;
}

/**
 * Secure console.log replacement
 */
function secureLog(...args) {
  const sanitized = args.map(arg => {
    if (typeof arg === 'object') {
      return redactSensitiveData(arg);
    }
    return arg;
  });

  console.log('[SECURE]', ...sanitized);
}

/**
 * Secure console.error replacement
 */
function secureError(...args) {
  const sanitized = args.map(arg => {
    if (typeof arg === 'object') {
      return redactSensitiveData(arg);
    }
    return arg;
  });

  console.error('[SECURE ERROR]', ...sanitized);
}

/**
 * Secure console.warn replacement
 */
function secureWarn(...args) {
  const sanitized = args.map(arg => {
    if (typeof arg === 'object') {
      return redactSensitiveData(arg);
    }
    return arg;
  });

  console.warn('[SECURE WARN]', ...sanitized);
}

/**
 * Log user activity securely
 * Redacts sensitive data automatically
 */
function logUserActivity(userId, action, data = {}) {
  const sanitizedData = redactSensitiveData(data);

  console.log('[USER_ACTIVITY]', {
    userId: userId,
    action: action,
    data: sanitizedData,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}

/**
 * Log API request securely
 * Redacts sensitive headers and body
 */
function logAPIRequest(req, additionalInfo = {}) {
  const sanitizedHeaders = redactSensitiveData(req.headers);
  const sanitizedBody = redactSensitiveData(req.body);

  console.log('[API_REQUEST]', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent')?.substring(0, 100),
    headers: sanitizedHeaders,
    body: sanitizedBody,
    ...redactSensitiveData(additionalInfo),
    timestamp: new Date().toISOString()
  });
}

/**
 * Log error securely
 * Includes stack trace but redacts sensitive data
 */
function logError(error, context = {}) {
  const sanitizedContext = redactSensitiveData(context);

  console.error('[ERROR]', {
    message: error.message,
    name: error.name,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    context: sanitizedContext,
    timestamp: new Date().toISOString()
  });
}

/**
 * Production-safe logger
 * Disables verbose logging in production
 */
const logger = {
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      secureLog('[DEBUG]', ...args);
    }
  },

  info: (...args) => {
    secureLog('[INFO]', ...args);
  },

  warn: (...args) => {
    secureWarn('[WARN]', ...args);
  },

  error: (...args) => {
    secureError('[ERROR]', ...args);
  },

  userActivity: logUserActivity,
  apiRequest: logAPIRequest,
  logError: logError
};

module.exports = {
  redactSensitiveData,
  secureLog,
  secureError,
  secureWarn,
  logUserActivity,
  logAPIRequest,
  logError,
  logger,
  SENSITIVE_PATTERNS
};

/**
 * USAGE:
 *
 * // Instead of:
 * console.log('User data:', { email, password }); // ❌ DANGEROUS
 *
 * // Use:
 * const { logger } = require('./lib/logger-secure');
 * logger.info('User data:', { email, password }); // ✅ SECURE (password redacted)
 *
 * // Or:
 * const { secureLog } = require('./lib/logger-secure');
 * secureLog('User data:', { email, password }); // ✅ SECURE
 */
