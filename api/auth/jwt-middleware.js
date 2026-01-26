/**
 * JWT AUTHENTICATION MIDDLEWARE
 * Secure token-based authentication for Medical LyDian
 *
 * Features:
 * - JWT token generation and verification
 * - Role-based access control (RBAC)
 * - Token refresh mechanism
 * - Session management
 * - Security headers
 *
 * @version 2.0.0
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

// User roles and permissions
const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  NURSE: 'nurse',
  STAFF: 'staff',
};

const PERMISSIONS = {
  // File permissions
  'file:read:own': ['patient', 'doctor', 'nurse', 'staff', 'admin'],
  'file:read:all': ['doctor', 'admin'],
  'file:write': ['patient', 'doctor', 'nurse', 'admin'],
  'file:delete': ['patient', 'doctor', 'admin'],

  // Analysis permissions
  'analysis:run': ['doctor', 'nurse', 'admin'],
  'analysis:read:own': ['patient', 'doctor', 'nurse', 'admin'],
  'analysis:read:all': ['doctor', 'admin'],

  // User management
  'user:read:own': ['patient', 'doctor', 'nurse', 'staff', 'admin'],
  'user:read:all': ['admin'],
  'user:update:own': ['patient', 'doctor', 'nurse', 'staff', 'admin'],
  'user:update:all': ['admin'],

  // Admin permissions
  'admin:dashboard': ['admin'],
  'admin:logs': ['admin'],
  'admin:settings': ['admin'],
};

/**
 * Generate JWT access token
 */
function generateAccessToken(userId, email, role = 'patient', metadata = {}) {
  const payload = {
    userId,
    email,
    role,
    type: 'access',
    metadata,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
    issuer: 'medical-lydian',
    audience: 'medical-lydian-api',
  });
}

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(userId, email) {
  const payload = {
    userId,
    email,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION,
    issuer: 'medical-lydian',
    audience: 'medical-lydian-api',
  });
}

/**
 * Verify JWT access token
 */
function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'medical-lydian',
      audience: 'medical-lydian-api',
    });

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw error;
    }
  }
}

/**
 * Verify JWT refresh token
 */
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'medical-lydian',
      audience: 'medical-lydian-api',
    });

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    } else {
      throw error;
    }
  }
}

/**
 * Check if user has permission
 */
function hasPermission(userRole, permission) {
  // eslint-disable-next-line security/detect-object-injection
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    return false;
  }
  return allowedRoles.includes(userRole);
}

/**
 * Extract token from request
 * 🔒 PRIORITY: httpOnly cookie > Authorization header > query param (legacy)
 */
function extractToken(req) {
  // 1. Check httpOnly cookie (NEW SECURE METHOD - PRIORITY)
  const { getAccessToken } = require('../_lib/cookie-utils');
  const cookieToken = getAccessToken(req);
  if (cookieToken) {
    return cookieToken;
  }

  // 2. Check Authorization header (for API clients)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 3. Check legacy cookie name (backwards compatibility)
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }

  // 4. Check query parameter (testing/compatibility only - NOT RECOMMENDED)
  if (req.query.token) {
    return req.query.token;
  }

  return null;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
function authenticate(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
    }

    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      metadata: decoded.metadata || {},
    };

    // Continue to next middleware
    next();
  } catch (error) {
    if (error.message === 'Token expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        hint: 'Use refresh token to get new access token',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
      details: error.message,
    });
  }
}

/**
 * Authorization middleware factory
 * Creates middleware that checks for specific permissions
 */
function authorize(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const userRole = req.user.role;
    const hasAccess = permissions.some(permission => hasPermission(userRole, permission));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN',
        details: `Role '${userRole}' does not have required permissions`,
      });
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't fail if not
 */
function optionalAuthenticate(req, res, next) {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        metadata: decoded.metadata || {},
      };
    }
  } catch (error) {
    // Silent fail for optional auth - eslint-disable-line no-unused-vars
    // Token verification failed, continue without user context
  }

  next();
}

/**
 * Legacy compatibility middleware
 * Falls back to userId query parameter if no token present
 * SHOULD BE REMOVED IN PRODUCTION
 */
function legacyCompatibility(req, res, next) {
  if (!req.user && req.query.userId) {
    console.warn(
      '[SECURITY] Using legacy userId query parameter - this should be removed in production'
    );
    req.user = {
      userId: req.query.userId,
      email: 'legacy@user.com',
      role: 'patient',
      legacy: true,
    };
  }
  next();
}

// Export all functions
module.exports = {
  // Token generation
  generateAccessToken,
  generateRefreshToken,

  // Token verification
  verifyAccessToken,
  verifyRefreshToken,

  // Middleware
  authenticate,
  authorize,
  optionalAuthenticate,
  legacyCompatibility,

  // Utilities
  extractToken,
  hasPermission,

  // Constants
  ROLES,
  PERMISSIONS,
  JWT_SECRET,
  JWT_EXPIRATION,
};
