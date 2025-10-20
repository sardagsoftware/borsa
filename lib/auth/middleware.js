/**
 * LYDIAN-IQ v3.0 - Authentication Middleware
 *
 * Express middleware for JWT authentication and RBAC/ABAC authorization
 */

const jwtManager = require('./jwt-manager');
const tenantManager = require('./tenant-manager');

/**
 * Require authentication middleware
 * Verifies JWT token and attaches tenant info to req.tenant
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Missing or invalid Authorization header',
      details: 'Expected format: Authorization: Bearer <token>',
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  try {
    const payload = jwtManager.verify(token, {
      issuer: 'http://localhost:3100',
      audience: 'lydian-iq-api',
    });

    // Get full tenant info
    const tenant = tenantManager.getTenant(payload.tenant_id);

    if (!tenant) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Tenant not found',
      });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Tenant account is not active',
      });
    }

    // Attach tenant and token payload to request
    req.tenant = tenant;
    req.tokenPayload = payload;

    next();
  } catch (error) {
    let statusCode = 401;
    let message = 'Invalid token';

    if (error.message.includes('expired')) {
      message = 'Token expired';
    } else if (error.message.includes('signature')) {
      message = 'Invalid token signature';
    } else if (error.message.includes('revoked')) {
      message = 'Token has been revoked';
    }

    return res.status(statusCode).json({
      error: 'unauthorized',
      message,
      details: error.message,
    });
  }
}

/**
 * Require specific scope middleware
 * Usage: requireScope('marketplace.read')
 */
function requireScope(requiredScope) {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const hasScope = tenantManager.hasScope(req.tenant, requiredScope);

    if (!hasScope) {
      return res.status(403).json({
        error: 'forbidden',
        message: `Missing required scope: ${requiredScope}`,
        tenant_scopes: req.tenant.scopes,
      });
    }

    next();
  };
}

/**
 * Require specific role middleware
 * Usage: requireRole('admin')
 */
function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const hasRole = tenantManager.hasRole(req.tenant, requiredRole);

    if (!hasRole) {
      return res.status(403).json({
        error: 'forbidden',
        message: `Missing required role: ${requiredRole}`,
        tenant_roles: req.tenant.roles,
      });
    }

    next();
  };
}

/**
 * Require any of the specified scopes
 * Usage: requireAnyScope(['marketplace.read', 'marketplace.install'])
 */
function requireAnyScope(scopes) {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const hasAnyScope = scopes.some(scope => tenantManager.hasScope(req.tenant, scope));

    if (!hasAnyScope) {
      return res.status(403).json({
        error: 'forbidden',
        message: `Missing required scopes. Need one of: ${scopes.join(', ')}`,
        tenant_scopes: req.tenant.scopes,
      });
    }

    next();
  };
}

/**
 * Require all of the specified scopes
 * Usage: requireAllScopes(['marketplace.read', 'esg.read'])
 */
function requireAllScopes(scopes) {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const hasAllScopes = scopes.every(scope => tenantManager.hasScope(req.tenant, scope));

    if (!hasAllScopes) {
      return res.status(403).json({
        error: 'forbidden',
        message: `Missing required scopes. Need all of: ${scopes.join(', ')}`,
        tenant_scopes: req.tenant.scopes,
      });
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * Attaches tenant if token is provided, but doesn't require it
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth provided, continue without tenant
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwtManager.verify(token, {
      issuer: 'http://localhost:3100',
      audience: 'lydian-iq-api',
    });

    const tenant = tenantManager.getTenant(payload.tenant_id);

    if (tenant && tenant.status === 'active') {
      req.tenant = tenant;
      req.tokenPayload = payload;
    }
  } catch (error) {
    // Invalid token, but we don't fail - just continue without tenant
    console.warn('[Auth] Invalid optional token:', error.message);
  }

  next();
}

module.exports = {
  requireAuth,
  requireScope,
  requireRole,
  requireAnyScope,
  requireAllScopes,
  optionalAuth,
};
