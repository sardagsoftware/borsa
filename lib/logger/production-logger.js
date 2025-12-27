/**
 * Production-Safe Logger
 * 🔐 Security: P0-4 Fix - 2025-10-26
 *
 * Features:
 * - PII/Secret redaction
 * - Structured logging (JSON)
 * - Log levels (error, warn, info, debug)
 * - File rotation
 * - Performance tracking
 * - GDPR compliant
 *
 * Usage:
 *   const logger = require('./lib/logger/production-logger');
 *   logger.info('User logged in', { userId: 123 });
 *   logger.error('Database error', { error: err });
 */

const winston = require('winston');
const path = require('path');
const { AzureApplicationInsightsTransport } = require('./azure-insights-transport');

// Sensitive fields that should NEVER be logged
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'secret',
  'privateKey',
  'private_key',
  'sessionToken',
  'session_token',
  'authorization',
  'cookie',
  'ssn',
  'social_security',
  'credit_card',
  'creditCard',
  'cvv',
  'pin',
  'otp',
  'twoFactorSecret',
  'two_factor_secret',
  'backup_codes',
  'backupCodes'
];

// Patterns to redact in strings
const SENSITIVE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,  // Bearer tokens
  /sk-[A-Za-z0-9]{20,}/gi,  // OpenAI-style keys
  /sk-ant-[A-Za-z0-9\-]{20,}/gi,  // Anthropic keys
  /\b[A-Z0-9]{32,}\b/g,  // Generic long hex strings
  /\b\d{13,19}\b/g,  // Credit card numbers
  /\b\d{3}-\d{2}-\d{4}\b/g,  // SSN format
];

/**
 * Redact sensitive information from objects
 */
function redactSensitiveData(obj, depth = 0) {
  if (depth > 10) return '[MAX_DEPTH_EXCEEDED]';  // Prevent infinite recursion

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Redact sensitive patterns
    let redacted = obj;
    for (const pattern of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
    return redacted;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const redacted = {};

    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();

      // Check if key is sensitive
      const isSensitive = SENSITIVE_FIELDS.some(field =>
        keyLower.includes(field.toLowerCase())
      );

      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        redacted[key] = redactSensitiveData(value, depth + 1);
      } else if (typeof value === 'string') {
        redacted[key] = redactSensitiveData(value, depth + 1);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  return obj;
}

/**
 * Custom format for redacting sensitive data
 */
const redactionFormat = winston.format((info) => {
  // Redact the main message if it's an object
  if (typeof info.message === 'object') {
    info.message = redactSensitiveData(info.message);
  }

  // Redact all metadata
  const redacted = redactSensitiveData(info);

  return redacted;
})();

/**
 * Create production logger instance
 */
function createLogger() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

  // Console format for development
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta, null, 2)}`;
      }
      return msg;
    })
  );

  // JSON format for production
  const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    redactionFormat,
    winston.format.json()
  );

  const transports = [];

  // Console transport
  if (!isProduction || process.env.LOG_TO_CONSOLE === 'true') {
    transports.push(
      new winston.transports.Console({
        format: isProduction ? jsonFormat : consoleFormat,
        level: logLevel
      })
    );
  }

  // File transports (only in non-Vercel environments)
  if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
    transports.push(
      // Error logs
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/error.log'),
        level: 'error',
        format: jsonFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5
      }),
      // Combined logs
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/combined.log'),
        format: jsonFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5
      })
    );
  }

  // Azure Application Insights transport (production only)
  if (isProduction && (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || process.env.APPINSIGHTS_INSTRUMENTATIONKEY)) {
    transports.push(
      new AzureApplicationInsightsTransport({
        level: logLevel,
        format: jsonFormat
      })
    );
  }

  // Exception/rejection handlers config (only for non-Vercel)
  const loggerConfig = {
    level: logLevel,
    format: jsonFormat,
    defaultMeta: {
      service: 'ailydian-ultra-pro',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    },
    transports
  };

  // Add file-based exception/rejection handlers only in non-Vercel environments
  if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
    loggerConfig.exceptionHandlers = [
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/exceptions.log')
      })
    ];
    loggerConfig.rejectionHandlers = [
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/rejections.log')
      })
    ];
  } else {
    // In Vercel, use console for exceptions/rejections
    loggerConfig.exceptionHandlers = [
      new winston.transports.Console({ format: jsonFormat })
    ];
    loggerConfig.rejectionHandlers = [
      new winston.transports.Console({ format: jsonFormat })
    ];
  }

  const logger = winston.createLogger(loggerConfig);

  // Add performance timing helper
  logger.time = (label) => {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      logger.debug(`Timer: ${label}`, { duration_ms: duration });
      return duration;
    };
  };

  // Add request logger helper
  logger.request = (req, meta = {}) => {
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers?.['user-agent'],
      userId: req.user?.id,
      ...meta
    });
  };

  // Add response logger helper
  logger.response = (req, res, duration, meta = {}) => {
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger.log(level, 'HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration_ms: duration,
      userId: req.user?.id,
      ...meta
    });
  };

  return logger;
}

// Create and export logger instance
const logger = createLogger();

// Replace console methods in production
if (process.env.NODE_ENV === 'production') {
  // Save original console methods for emergency use
  console._log = console.log;
  console._warn = console.warn;
  console._error = console.error;

  // Override console methods
  console.log = (...args) => logger.info(args.join(' '));
  console.warn = (...args) => logger.warn(args.join(' '));
  console.error = (...args) => logger.error(args.join(' '));
  console.info = (...args) => logger.info(args.join(' '));
  console.debug = (...args) => logger.debug(args.join(' '));

  logger.info('✅ Production logger initialized - console methods overridden');
}

module.exports = logger;
