/**
 * Secure CORS Handler Middleware
 * Centralized CORS configuration with whitelist-based origin validation
 *
 * Usage:
 * const { handleCORS, corsMiddleware } = require('../middleware/cors-handler');
 *
 * // In serverless functions:
 * if (handleCORS(req, res)) return;
 *
 * // In Express routes:
 * router.use(corsMiddleware);
 */

const { allowedOrigins } = require('../security/cors-whitelist');

/**
 * Secure CORS handler for serverless functions
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {boolean} - Returns true if request was handled (OPTIONS), false otherwise
 */
function handleCORS(req, res) {
  const origin = req.headers.origin;

  // Check if origin is allowed
  const isAllowed = !origin ||
                    allowedOrigins.includes(origin) ||
                    origin.match(/^https:\/\/ailydian-.*\.vercel\.app$/);

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || 'https://www.ailydian.com');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

/**
 * Express middleware version
 */
function corsMiddleware(req, res, next) {
  if (!handleCORS(req, res)) {
    next();
  }
}

/**
 * Legacy wildcard CORS (DEPRECATED - For backward compatibility only)
 * @deprecated Use handleCORS() instead
 */
function insecureCORS(req, res) {
  console.warn('⚠️  DEPRECATED: Using insecure wildcard CORS. Please migrate to handleCORS()');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

module.exports = {
  handleCORS,
  corsMiddleware,
  insecureCORS // For backward compatibility
};
