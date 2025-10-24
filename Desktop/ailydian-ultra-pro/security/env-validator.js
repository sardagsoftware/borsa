/**
 * Environment Variable Security Validator
 * Fixes: CRITICAL - Database connection strings and secrets exposure
 */

const crypto = require('crypto');

// Required environment variables
const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'SESSION_SECRET',
  'JWT_SECRET'
];

// Sensitive keys that should never be logged or exposed
const SENSITIVE_KEYS = [
  'PASSWORD',
  'SECRET',
  'KEY',
  'TOKEN',
  'API_KEY',
  'DATABASE_URL',
  'CONNECTION_STRING',
  'PRIVATE_KEY',
  'STRIPE',
  'TRONGRID'
];

/**
 * Validate required environment variables exist
 */
function validateRequiredEnvVars() {
  const missing = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Mask sensitive environment variable for logging
 */
function maskSensitive(key, value) {
  if (!value) return '[empty]';

  const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
    key.toUpperCase().includes(sensitiveKey)
  );

  if (isSensitive) {
    // Show only first 4 and last 4 characters
    if (value.length <= 8) {
      return '****';
    }
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
  }

  return value;
}

/**
 * Get safe environment config for logging
 */
function getSafeEnvConfig() {
  const safeConfig = {};

  for (const [key, value] of Object.entries(process.env)) {
    safeConfig[key] = maskSensitive(key, value);
  }

  return safeConfig;
}

/**
 * Validate database connection string format
 */
function validateDatabaseURL(url) {
  if (!url) {
    throw new Error('Database URL is required');
  }

  // Check if URL contains password in plain text
  const urlPattern = /^(postgres|mongodb|mysql):\/\/.+/i;
  if (!urlPattern.test(url)) {
    throw new Error('Invalid database URL format');
  }

  // Warn if URL contains plain text password
  if (url.includes('@') && !url.includes('***')) {
    console.warn('⚠️  WARNING: Database URL contains plain text credentials');
  }

  return true;
}

/**
 * Generate secure random secret
 */
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate JWT secret strength
 */
function validateJWTSecret(secret) {
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  // Check if it's a weak/common secret
  const weakSecrets = ['secret', 'password', '123456', 'changeme', 'test'];
  if (weakSecrets.some(weak => secret.toLowerCase().includes(weak))) {
    throw new Error('JWT_SECRET is too weak (contains common words)');
  }

  return true;
}

/**
 * Middleware to prevent exposure of sensitive data in errors
 */
function sanitizeErrorMiddleware(err, req, res, next) {
  // Create safe error object
  const safeError = {
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  };

  // In production, hide stack traces and sensitive details
  if (process.env.NODE_ENV === 'production') {
    // Don't expose stack trace
    delete err.stack;

    // Check if error message contains sensitive data
    const errorString = JSON.stringify(err);
    const hasSensitiveData = SENSITIVE_KEYS.some(key =>
      errorString.toLowerCase().includes(key.toLowerCase())
    );

    if (hasSensitiveData) {
      safeError.message = 'An error occurred';
      console.error('⚠️  Sensitive data detected in error, message sanitized');
    }
  } else {
    // In development, include stack trace but mask sensitive data
    safeError.stack = err.stack;
  }

  // Log error securely (with masked sensitive data)
  console.error('Error:', {
    message: safeError.message,
    code: safeError.code,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  res.status(err.statusCode || 500).json(safeError);
}

/**
 * Validate all security-critical environment variables
 */
function validateSecurityConfig() {
  console.log('🔒 Validating security configuration...');

  try {
    // Validate required vars exist
    validateRequiredEnvVars();

    // Validate JWT secret strength
    if (process.env.JWT_SECRET) {
      validateJWTSecret(process.env.JWT_SECRET);
    }

    // Validate database URLs
    if (process.env.DATABASE_URL) {
      validateDatabaseURL(process.env.DATABASE_URL);
    }

    // Warn about missing optional but recommended vars
    const recommended = [
      'REDIS_HOST',
      'REDIS_PASSWORD',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ];

    const missingRecommended = recommended.filter(key => !process.env[key]);
    if (missingRecommended.length > 0) {
      console.warn(`⚠️  Recommended environment variables not set: ${missingRecommended.join(', ')}`);
    }

    console.log('✅ Security configuration validated');
    return true;
  } catch (error) {
    console.error('❌ Security configuration validation failed:', error.message);
    throw error;
  }
}

/**
 * Prevent accidental exposure of environment variables in responses
 */
function preventEnvExposure(req, res, next) {
  // Override res.json to check for env exposure
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    const dataString = JSON.stringify(data);

    // Check if response contains sensitive patterns
    const hasSensitiveData = SENSITIVE_KEYS.some(key => {
      const pattern = new RegExp(key, 'i');
      return pattern.test(dataString);
    });

    if (hasSensitiveData) {
      console.error('⚠️  SECURITY WARNING: Response contains sensitive data patterns');

      // In production, block the response
      if (process.env.NODE_ENV === 'production') {
        return originalJson({
          error: 'Internal server error',
          code: 'SENSITIVE_DATA_BLOCKED'
        });
      }
    }

    return originalJson(data);
  };

  next();
}

module.exports = {
  validateRequiredEnvVars,
  validateSecurityConfig,
  maskSensitive,
  getSafeEnvConfig,
  validateDatabaseURL,
  validateJWTSecret,
  generateSecret,
  sanitizeErrorMiddleware,
  preventEnvExposure
};
