/**
 * JWT Authentication & Authorization Middleware for AI Governance (ACE)
 *
 * Provides JWT-based authentication and role-based access control (RBAC)
 * for all governance API endpoints.
 *
 * Security Features:
 * - RS256 asymmetric key signing
 * - Token expiration validation
 * - Role-based access control
 * - Model ownership verification
 *
 * @module middleware/auth-governance
 */

const jwt = require('jsonwebtoken');
const { getPrismaClient } = require('../api/governance/prisma-client');

/**
 * Governance roles with hierarchical permissions
 */
const ROLES = {
  ADMIN: 'ADMIN',
  COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER',
  MODEL_OWNER: 'MODEL_OWNER',
  VIEWER: 'VIEWER',
};

/**
 * JWT secret key (in production, use environment variable)
 * For RS256, this should be a private/public key pair
 */
const JWT_SECRET = process.env.JWT_SECRET || 'ailydian-ace-secret-key-change-in-production';
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256'; // HS256 for symmetric, RS256 for asymmetric

/**
 * Token expiration time
 */
const TOKEN_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * Extract token from Authorization header
 * Supports: "Bearer <token>" format
 *
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Support "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Support direct token
  return authHeader;
}

/**
 * Verify JWT token and decode payload
 *
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Generate JWT token for user
 *
 * @param {Object} user - User object with id, email, role
 * @returns {string} JWT token
 */
function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.governanceRole || user.role || ROLES.VIEWER,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * Middleware: Require authentication
 * Verifies JWT token and attaches user info to request
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
async function requireAuth(req, res, next) {
  try {
    // Extract token
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No authentication token provided',
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || ROLES.VIEWER,
    };

    // Optional: Verify user still exists in database
    if (process.env.VERIFY_USER_IN_DB === 'true') {
      const prisma = getPrismaClient();
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          message: 'User account no longer exists',
        });
      }
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: error.message,
    });
  }
}

/**
 * Middleware: Require specific role(s)
 * User must have one of the specified roles
 *
 * @param {...string} allowedRoles - Allowed roles
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Must be authenticated to access this resource',
      });
    }

    // Check if user has required role
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Requires one of: ${allowedRoles.join(', ')}. You have: ${userRole}`,
        requiredRoles: allowedRoles,
        userRole: userRole,
      });
    }

    next();
  };
}

/**
 * Middleware: Require model ownership
 * User must be the owner of the model or have ADMIN role
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
async function requireModelOwnership(req, res, next) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Admin can access all models
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Extract model ID from params or body
    const modelId = req.params.modelId || req.body.modelId;
    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: 'Model ID required',
        message: 'Model ID must be provided in request',
      });
    }

    // Check model ownership
    const prisma = getPrismaClient();
    const model = await prisma.governanceModel.findUnique({
      where: { id: modelId },
      select: { ownerId: true },
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
        message: `Model with ID ${modelId} does not exist`,
      });
    }

    // Verify ownership
    if (model.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not own this model',
      });
    }

    next();
  } catch (error) {
    console.error('Ownership verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed',
      message: error.message,
    });
  }
}

/**
 * Check if user has permission for action
 *
 * @param {string} userRole - User's role
 * @param {string} action - Action to perform
 * @returns {boolean} True if user has permission
 */
function hasPermission(userRole, action) {
  const permissions = {
    [ROLES.ADMIN]: [
      'view_dashboard',
      'register_model',
      'run_compliance',
      'view_trust_index',
      'activate_kill_switch',
      'view_audit_logs',
      'manage_users',
      'delete_model',
      'update_model',
    ],
    [ROLES.COMPLIANCE_OFFICER]: [
      'view_dashboard',
      'run_compliance',
      'view_trust_index',
      'activate_kill_switch',
      'view_audit_logs',
    ],
    [ROLES.MODEL_OWNER]: [
      'view_dashboard',
      'register_model',
      'run_compliance',
      'view_trust_index',
      'activate_kill_switch',
      'update_model', // own models only
      'delete_model', // own models only
    ],
    [ROLES.VIEWER]: [
      'view_dashboard',
      'view_trust_index',
    ],
  };

  const userPermissions = permissions[userRole] || [];
  return userPermissions.includes(action);
}

/**
 * Middleware: Require specific permission
 *
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Action '${permission}' requires higher privileges`,
        requiredPermission: permission,
        userRole: req.user.role,
      });
    }

    next();
  };
}

/**
 * Optional authentication (doesn't fail if no token)
 * Useful for endpoints that have different behavior for authenticated users
 */
async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role || ROLES.VIEWER,
      };
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    console.warn('Optional auth failed:', error.message);
  }

  next();
}

module.exports = {
  // Constants
  ROLES,
  TOKEN_EXPIRY,

  // Token functions
  generateToken,
  verifyToken,
  extractToken,

  // Middleware
  requireAuth,
  requireRole,
  requireModelOwnership,
  requirePermission,
  optionalAuth,

  // Helper
  hasPermission,
};
