/**
 * LyDian API Authentication & Authorization Middleware
 *
 * Features:
 * - JWT-based authentication
 * - API key validation
 * - Role-based access control (RBAC)
 * - Multi-tenant isolation
 * - Token refresh mechanism
 *
 * @version 2.1.0
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuration - JWT_SECRET is validated by middleware/security.js
if (!process.env.JWT_SECRET) {
  throw new Error('🚨 CRITICAL: JWT_SECRET must be set in environment variables!');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const API_KEY_HEADER = 'X-LyDian-API-Key';

// Role hierarchy (higher number = more permissions)
const ROLES = {
  GUEST: 0,
  USER: 10,
  DEVELOPER: 20,
  PREMIUM: 30,
  ENTERPRISE: 40,
  ADMIN: 100
};

// Rate limit buckets per role
const RATE_LIMITS = {
  GUEST: { requests: 100, window: '1h' },
  USER: { requests: 1000, window: '1h' },
  DEVELOPER: { requests: 5000, window: '1h' },
  PREMIUM: { requests: 50000, window: '1h' },
  ENTERPRISE: { requests: 500000, window: '1h' },
  ADMIN: { requests: 1000000, window: '1h' }
};

/**
 * Generate JWT token for authenticated user
 */
function generateToken(user, options = {}) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role || 'USER',
    tenant: user.tenantId,
    permissions: user.permissions || [],
    ...options.extraClaims
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: options.expiresIn || JWT_EXPIRY,
    issuer: 'LyDian-Platform',
    audience: 'LyDian-API'
  });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'LyDian-Platform',
      audience: 'LyDian-API'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * API Key validation
 */
async function validateApiKey(apiKey) {
  // In production, this would query your database
  // For now, using environment variable or in-memory cache

  if (!apiKey || apiKey.length < 32) {
    return null;
  }

  // Hash the API key for lookup
  const hashedKey = crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');

  // Mock validation - replace with actual DB query
  // Example: const user = await db.users.findByApiKey(hashedKey);

  // For demo purposes, accepting any key with proper format
  return {
    id: 'demo-user',
    email: 'demo@lydian.com',
    role: 'DEVELOPER',
    tenantId: 'default',
    apiKeyHash: hashedKey,
    permissions: ['smart-cities:read', 'insan-iq:read', 'lydian-iq:read']
  };
}

/**
 * Main authentication middleware
 */
async function authenticate(req, res, next) {
  try {
    let user = null;

    // Check for Bearer token (JWT)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        tenantId: decoded.tenant,
        permissions: decoded.permissions,
        authMethod: 'jwt'
      };
    }

    // Check for API Key
    else if (req.headers[API_KEY_HEADER.toLowerCase()]) {
      const apiKey = req.headers[API_KEY_HEADER.toLowerCase()];
      user = await validateApiKey(apiKey);

      if (user) {
        user.authMethod = 'apikey';
      }
    }

    // If no authentication provided, set as guest
    if (!user) {
      user = {
        id: 'guest',
        role: 'GUEST',
        tenantId: 'public',
        permissions: [],
        authMethod: 'guest'
      };
    }

    // Attach user to request
    req.user = user;
    req.rateLimit = RATE_LIMITS[user.role];

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
      code: 'AUTH_FAILED'
    });
  }
}

/**
 * Authorization middleware - check if user has required role
 */
function requireRole(minimumRole) {
  return (req, res, next) => {
    const userRole = req.user?.role || 'GUEST';
    const userRoleLevel = ROLES[userRole] || 0;
    const requiredLevel = ROLES[minimumRole] || 0;

    if (userRoleLevel >= requiredLevel) {
      return next();
    }

    res.status(403).json({
      error: 'Insufficient permissions',
      message: `This endpoint requires ${minimumRole} role or higher`,
      code: 'FORBIDDEN',
      currentRole: userRole,
      requiredRole: minimumRole
    });
  };
}

/**
 * Permission-based authorization
 */
function requirePermission(permission) {
  return (req, res, next) => {
    const userPermissions = req.user?.permissions || [];

    // Admin bypass
    if (req.user?.role === 'ADMIN') {
      return next();
    }

    // Check exact permission
    if (userPermissions.includes(permission)) {
      return next();
    }

    // Check wildcard permissions
    const permissionParts = permission.split(':');
    const wildcardPermission = `${permissionParts[0]}:*`;

    if (userPermissions.includes(wildcardPermission)) {
      return next();
    }

    res.status(403).json({
      error: 'Insufficient permissions',
      message: `Missing required permission: ${permission}`,
      code: 'PERMISSION_DENIED',
      requiredPermission: permission,
      userPermissions: userPermissions
    });
  };
}

/**
 * Tenant isolation middleware
 */
function enforceTenantIsolation(req, res, next) {
  // Extract tenant ID from request
  const requestTenantId = req.params.tenantId || req.query.tenantId || req.body?.tenantId;

  // If no tenant specified in request, use user's tenant
  if (!requestTenantId) {
    req.tenantId = req.user.tenantId;
    return next();
  }

  // Admin can access any tenant
  if (req.user.role === 'ADMIN') {
    req.tenantId = requestTenantId;
    return next();
  }

  // Regular users can only access their own tenant
  if (requestTenantId !== req.user.tenantId) {
    return res.status(403).json({
      error: 'Tenant access denied',
      message: 'You can only access resources in your own tenant',
      code: 'TENANT_ISOLATION_VIOLATION'
    });
  }

  req.tenantId = requestTenantId;
  next();
}

/**
 * Token refresh endpoint handler
 */
function handleTokenRefresh(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    // Verify refresh token (should be stored securely in production)
    const decoded = verifyToken(refreshToken);

    // Generate new access token
    const newToken = generateToken({
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenant,
      permissions: decoded.permissions
    }, {
      expiresIn: '1h' // Shorter expiry for access token
    });

    res.json({
      accessToken: newToken,
      expiresIn: 3600,
      tokenType: 'Bearer'
    });
  } catch (error) {
    res.status(401).json({
      error: 'Token refresh failed',
      message: error.message,
      code: 'REFRESH_FAILED'
    });
  }
}

/**
 * Generate API key for user
 */
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Security headers middleware
 */
function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}

module.exports = {
  authenticate,
  requireRole,
  requirePermission,
  enforceTenantIsolation,
  generateToken,
  verifyToken,
  generateApiKey,
  handleTokenRefresh,
  securityHeaders,
  ROLES,
  RATE_LIMITS
};
