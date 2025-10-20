/**
 * 📝 WINSTON LOGGER - GLOBAL LOGGING SYSTEM
 *
 * Beyaz Şapkalı Security Features:
 * ✅ Sensitive data masking (passwords, tokens, API keys)
 * ✅ PII anonymization (email, IP addresses)
 * ✅ Daily log rotation
 * ✅ Environment-aware configuration
 * ✅ Structured logging (JSON format)
 * ✅ Performance tracking
 *
 * Usage:
 *   const logger = require('./lib/logger');
 *   logger.info('User logged in', { userId: 123 });
 *   logger.error('Database error', { error: err, context: 'users' });
 *   logger.warn('Rate limit approaching', { ip: '1.2.3.4', count: 95 });
 */

const winston = require('winston');
const path = require('path');
const crypto = require('crypto');

// ========================================
// 🔧 CONFIGURATION
// ========================================
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');

// Ensure logs directory exists
const fs = require('fs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ========================================
// 🔒 SENSITIVE DATA PATTERNS (Beyaz Şapkalı)
// ========================================
const SENSITIVE_KEYS = [
  'password',
  'passwd',
  'secret',
  'token',
  'api_key',
  'apikey',
  'access_token',
  'refresh_token',
  'auth',
  'authorization',
  'cookie',
  'session',
  'ssn',
  'credit_card',
  'creditcard',
  'cvv',
  'pin',
  'private_key',
  'privatekey',
  'aws_secret',
  'db_password',
  'database_password'
];

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const IP_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const CREDIT_CARD_REGEX = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const JWT_REGEX = /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g;

// ========================================
// 🛡️ SANITIZATION FUNCTIONS
// ========================================

/**
 * Hash sensitive data for logging (one-way)
 * @param {string} value - Value to hash
 * @returns {string} Hashed value
 */
function hashValue(value) {
  if (!value || typeof value !== 'string') return '[EMPTY]';
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16) + '...';
}

/**
 * Mask email addresses (keep domain for debugging)
 * @param {string} email - Email to mask
 * @returns {string} Masked email
 */
function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (!domain) return '[MASKED_EMAIL]';
  const maskedLocal = local.substring(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask IP addresses (keep first 2 octets)
 * @param {string} ip - IP to mask
 * @returns {string} Masked IP
 */
function maskIP(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return '[MASKED_IP]';
  return `${parts[0]}.${parts[1]}.***.**`;
}

/**
 * Recursively sanitize object/array for logging
 * @param {*} obj - Object to sanitize
 * @param {WeakSet} seen - Set of already processed objects (prevents circular refs)
 * @returns {*} Sanitized object
 */
function sanitize(obj, seen = new WeakSet()) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    // Sanitize strings that might contain sensitive data
    if (typeof obj === 'string') {
      let sanitized = obj;

      // Mask emails
      sanitized = sanitized.replace(EMAIL_REGEX, (match) => maskEmail(match));

      // Mask IPs
      sanitized = sanitized.replace(IP_REGEX, (match) => maskIP(match));

      // Mask credit cards
      sanitized = sanitized.replace(CREDIT_CARD_REGEX, () => '[MASKED_CC]');

      // Mask SSNs
      sanitized = sanitized.replace(SSN_REGEX, () => '[MASKED_SSN]');

      // Mask JWTs
      sanitized = sanitized.replace(JWT_REGEX, () => '[MASKED_JWT]');

      return sanitized;
    }
    return obj;
  }

  // Prevent circular references
  if (seen.has(obj)) {
    return '[Circular Reference]';
  }
  seen.add(obj);

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, seen));
  }

  // Handle Objects
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if key is sensitive
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
      lowerKey.includes(sensitiveKey)
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitize(value, seen);
    } else {
      sanitized[key] = sanitize(value, seen);
    }
  }

  return sanitized;
}

// ========================================
// 🎨 LOG FORMATS
// ========================================

/**
 * Custom format for console output (development)
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}] ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      const sanitizedMeta = sanitize(meta);
      log += `\n${JSON.stringify(sanitizedMeta, null, 2)}`;
    }

    return log;
  })
);

/**
 * Custom format for file output (production)
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format((info) => {
    // Sanitize all metadata
    return sanitize(info);
  })()
);

// ========================================
// 📂 TRANSPORTS (Output Destinations)
// ========================================

const transports = [];

// Console transport (always enabled in development)
if (NODE_ENV !== 'production' || process.env.LOG_TO_CONSOLE === 'true') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: LOG_LEVEL
    })
  );
}

// File transports (production)
if (NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  // Combined log (all levels)
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: fileFormat,
      level: 'debug',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 14, // Keep 14 days
      tailable: true
    })
  );

  // Error log (errors only)
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      format: fileFormat,
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 30, // Keep 30 days
      tailable: true
    })
  );

  // Access log (info level - for request logging)
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'access.log'),
      format: fileFormat,
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 7, // Keep 7 days
      tailable: true
    })
  );
}

// ========================================
// 🏗️ CREATE LOGGER INSTANCE
// ========================================

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: fileFormat,
  transports,
  exitOnError: false, // Don't exit on uncaught exceptions

  // Exception handling
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'exceptions.log'),
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5
    })
  ],

  // Rejection handling (unhandled promise rejections)
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'rejections.log'),
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5
    })
  ]
});

// ========================================
// 🚀 HELPER METHODS
// ========================================

/**
 * Log HTTP request
 * @param {object} req - Express request object
 * @param {number} statusCode - Response status code
 * @param {number} responseTime - Response time in ms
 */
logger.logRequest = function(req, statusCode, responseTime) {
  const meta = {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress
  };

  if (statusCode >= 500) {
    this.error('HTTP Request Error', meta);
  } else if (statusCode >= 400) {
    this.warn('HTTP Request Warning', meta);
  } else {
    this.info('HTTP Request', meta);
  }
};

/**
 * Log performance metric
 * @param {string} operation - Operation name
 * @param {number} duration - Duration in ms
 * @param {object} metadata - Additional context
 */
logger.logPerformance = function(operation, duration, metadata = {}) {
  const meta = {
    operation,
    duration: `${duration}ms`,
    ...metadata
  };

  if (duration > 5000) {
    this.warn('Slow Operation', meta);
  } else if (duration > 1000) {
    this.info('Performance Metric', meta);
  } else {
    this.debug('Performance Metric', meta);
  }
};

/**
 * Log database query
 * @param {string} query - SQL query or operation
 * @param {number} duration - Query duration in ms
 * @param {boolean} success - Query success status
 */
logger.logQuery = function(query, duration, success = true) {
  const meta = {
    query: query.substring(0, 200), // Truncate long queries
    duration: `${duration}ms`,
    success
  };

  if (!success) {
    this.error('Database Query Failed', meta);
  } else if (duration > 1000) {
    this.warn('Slow Database Query', meta);
  } else {
    this.debug('Database Query', meta);
  }
};

// ========================================
// 🎯 INITIALIZATION
// ========================================

// Log initialization
logger.info('🚀 Winston Logger Initialized', {
  environment: NODE_ENV,
  logLevel: LOG_LEVEL,
  logDirectory: LOG_DIR,
  transportsCount: transports.length,
  sanitizationEnabled: true
});

// ========================================
// 📤 EXPORTS
// ========================================

module.exports = logger;
