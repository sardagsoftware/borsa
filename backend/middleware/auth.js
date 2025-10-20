/**
 * Authentication Middleware
 * Handles JWT verification and route protection
 */

const User = require('../models/User');
const { getDatabase } = require('../../database/init-db');

/**
 * Extract token from request
 */
const extractToken = (req) => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // Check query parameter (less secure, use only for specific cases)
  if (req.query && req.query.token) {
    return req.query.token;
  }

  return null;
};

/**
 * Authenticate Token Middleware
 * Verifies JWT and attaches user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify token
    const decoded = User.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check if session exists and is valid
    const db = getDatabase();
    try {
      const session = db.prepare(`
        SELECT * FROM sessions
        WHERE token = ? AND userId = ? AND expiresAt > datetime('now')
      `).get(token, decoded.id);

      if (!session) {
        return res.status(401).json({
          success: false,
          error: 'Session expired or invalid'
        });
      }

      // Update last activity
      db.prepare(`
        UPDATE sessions SET lastActivity = CURRENT_TIMESTAMP WHERE id = ?
      `).run(session.id);

    } finally {
      db.close();
    }

    // Get full user data
    const user = User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Require Authentication
 * Redirect to login if not authenticated (for HTML pages)
 */
const requireAuth = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.redirect('/login.html');
  }

  const decoded = User.verifyToken(token);
  if (!decoded) {
    return res.redirect('/login.html');
  }

  next();
};

/**
 * Check Subscription Level
 * Ensures user has required subscription tier
 */
const checkSubscription = (requiredLevel = 'free') => {
  const subscriptionLevels = {
    'free': 0,
    'basic': 1,
    'pro': 2,
    'enterprise': 3
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userLevel = subscriptionLevels[req.user.subscription] || 0;
    const required = subscriptionLevels[requiredLevel] || 0;

    if (userLevel < required) {
      return res.status(403).json({
        success: false,
        error: `This feature requires ${requiredLevel} subscription or higher`,
        requiredSubscription: requiredLevel,
        currentSubscription: req.user.subscription
      });
    }

    next();
  };
};

/**
 * Check Credits
 * Ensures user has enough credits for operation
 */
const checkCredits = (requiredCredits = 1) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (req.user.credits < requiredCredits) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient credits',
        required: requiredCredits,
        available: req.user.credits
      });
    }

    next();
  };
};

/**
 * Rate Limiting Middleware
 * Basic rate limiting by user ID
 */
const rateLimitByUser = (maxRequests = 100, windowMs = 60000) => {
  const requestCounts = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();

    if (!requestCounts.has(userId)) {
      requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userLimit = requestCounts.get(userId);

    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + windowMs;
      return next();
    }

    if (userLimit.count >= maxRequests) {
      const resetIn = Math.ceil((userLimit.resetTime - now) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: resetIn
      });
    }

    userLimit.count++;
    next();
  };
};

/**
 * Admin Only Middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.subscription !== 'admin' && req.user.subscription !== 'enterprise') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

/**
 * Optional Authentication
 * Attaches user if authenticated, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    const decoded = User.verifyToken(token);
    if (decoded) {
      const user = User.findById(decoded.id);
      if (user) {
        req.user = user;
        req.token = token;
      }
    }

    next();

  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAuth,
  checkSubscription,
  checkCredits,
  rateLimitByUser,
  requireAdmin,
  optionalAuth,
  extractToken
};
