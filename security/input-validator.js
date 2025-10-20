/**
 * Input Validation & Sanitization Middleware
 * Fixes: MEDIUM - Language parameter injection, XSS, SQL injection
 */

const validator = require('validator');

// Whitelist of allowed languages
const ALLOWED_LANGUAGES = ['en', 'tr', 'de', 'fr', 'ru', 'zh', 'ja', 'es', 'ar'];

// Whitelist of allowed currencies
const ALLOWED_CURRENCIES = ['USD', 'EUR', 'TRY', 'USDT'];

/**
 * Sanitize language parameter
 */
function sanitizeLanguage(lang) {
  if (!lang) {
    return 'en'; // Default
  }

  // Remove any non-alphanumeric characters
  const cleaned = lang.replace(/[^a-z]/gi, '').toLowerCase().substring(0, 2);

  // Validate against whitelist
  if (!ALLOWED_LANGUAGES.includes(cleaned)) {
    return 'en'; // Fallback to English
  }

  return cleaned;
}

/**
 * Sanitize user input (prevent XSS)
 */
function sanitizeString(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags and limit length
  return validator.escape(input.trim()).substring(0, maxLength);
}

/**
 * Validate email
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  return validator.isEmail(email) && email.length <= 254;
}

/**
 * Validate UUID
 */
function validateUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  return validator.isUUID(uuid);
}

/**
 * Sanitize SQL input (prevent SQL injection)
 */
function sanitizeSQL(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove dangerous SQL characters
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .substring(0, 1000);
}

/**
 * Validate and sanitize chat message
 */
function sanitizeChatMessage(message) {
  if (!message || typeof message !== 'string') {
    throw new Error('Invalid message');
  }

  // Limit message length
  if (message.length > 10000) {
    throw new Error('Message too long (max 10000 characters)');
  }

  // Allow HTML but escape dangerous tags
  const cleaned = message
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers

  return cleaned.trim();
}

/**
 * Validate model name
 */
function validateModelName(model) {
  if (!model || typeof model !== 'string') {
    return false;
  }

  // Allow only alphanumeric, dash, underscore, colon
  const validPattern = /^[a-zA-Z0-9\-_:]+$/;
  return validPattern.test(model) && model.length <= 100;
}

/**
 * Middleware: Validate language parameter
 */
function validateLanguageParam(req, res, next) {
  if (req.query.lang) {
    req.query.lang = sanitizeLanguage(req.query.lang);
  }

  if (req.params.lang) {
    req.params.lang = sanitizeLanguage(req.params.lang);
  }

  if (req.body?.lang) {
    req.body.lang = sanitizeLanguage(req.body.lang);
  }

  next();
}

/**
 * Middleware: Validate chat request
 */
function validateChatRequest(req, res, next) {
  const { message, model, systemPrompt } = req.body;

  // Validate message
  try {
    req.body.message = sanitizeChatMessage(message);
  } catch (error) {
    return res.status(400).json({
      error: error.message,
      code: 'INVALID_MESSAGE'
    });
  }

  // Validate model
  if (model && !validateModelName(model)) {
    return res.status(400).json({
      error: 'Invalid model name',
      code: 'INVALID_MODEL'
    });
  }

  // Validate system prompt
  if (systemPrompt && systemPrompt.length > 5000) {
    return res.status(400).json({
      error: 'System prompt too long (max 5000 characters)',
      code: 'SYSTEM_PROMPT_TOO_LONG'
    });
  }

  next();
}

/**
 * Middleware: Validate user registration
 */
function validateUserRegistration(req, res, next) {
  const { email, username, password } = req.body;

  // Validate email
  if (!validateEmail(email)) {
    return res.status(400).json({
      error: 'Invalid email address',
      code: 'INVALID_EMAIL'
    });
  }

  // Validate username
  if (!username || username.length < 3 || username.length > 50) {
    return res.status(400).json({
      error: 'Username must be between 3-50 characters',
      code: 'INVALID_USERNAME'
    });
  }

  // Validate password strength
  if (!password || password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters',
      code: 'WEAK_PASSWORD'
    });
  }

  // Sanitize username (prevent injection)
  req.body.username = sanitizeString(username, 50);
  req.body.email = email.toLowerCase().trim();

  next();
}

/**
 * Middleware: Prevent NoSQL injection
 */
function preventNoSQLInjection(req, res, next) {
  const checkObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Block MongoDB operators
        if (key.startsWith('$')) {
          return false;
        }
        if (!checkObject(obj[key])) {
          return false;
        }
      }
    }
    return true;
  };

  if (req.body && !checkObject(req.body)) {
    return res.status(400).json({
      error: 'Invalid request format',
      code: 'NOSQL_INJECTION_DETECTED'
    });
  }

  if (req.query && !checkObject(req.query)) {
    return res.status(400).json({
      error: 'Invalid query format',
      code: 'NOSQL_INJECTION_DETECTED'
    });
  }

  next();
}

module.exports = {
  sanitizeLanguage,
  sanitizeString,
  sanitizeSQL,
  sanitizeChatMessage,
  validateEmail,
  validateUUID,
  validateModelName,
  validateLanguageParam,
  validateChatRequest,
  validateUserRegistration,
  preventNoSQLInjection
};
