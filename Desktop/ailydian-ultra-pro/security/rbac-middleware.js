/**
 * RBAC (Role-Based Access Control) Middleware
 * Fixes: CRITICAL - Admin endpoint unauthorized access
 */

const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
  PREMIUM: 'premium'
};

const ROLE_HIERARCHY = {
  admin: 4,
  premium: 3,
  user: 2,
  guest: 1
};

/**
 * Require specific role for route access
 */
function requireRole(requiredRole) {
  return (req, res, next) => {
    // Get user from session/JWT
    const user = req.user || req.session?.user;

    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = user.role || 'guest';
    const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 999;

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: requiredRole,
        current: userRole
      });
    }

    next();
  };
}

/**
 * Require admin role
 */
function requireAdmin(req, res, next) {
  return requireRole(ROLES.ADMIN)(req, res, next);
}

/**
 * Prevent role escalation in user updates
 */
function preventRoleEscalation(req, res, next) {
  const user = req.user || req.session?.user;
  const targetUserId = req.params.userId || req.params.id;
  const newRole = req.body?.role;

  // If trying to change role
  if (newRole) {
    // Only admins can change roles
    if (!user || user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        error: 'Only administrators can change user roles',
        code: 'ROLE_CHANGE_FORBIDDEN'
      });
    }

    // Prevent self-demotion
    if (user.id === targetUserId && newRole !== ROLES.ADMIN) {
      return res.status(403).json({
        error: 'Cannot change your own admin role',
        code: 'SELF_DEMOTION_FORBIDDEN'
      });
    }
  }

  next();
}

/**
 * Verify user can only access their own resources
 */
function verifyResourceOwnership(req, res, next) {
  const user = req.user || req.session?.user;
  const resourceUserId = req.params.userId || req.params.id;

  if (!user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Admin can access all resources
  if (user.role === ROLES.ADMIN) {
    return next();
  }

  // User can only access their own resources
  if (user.id !== resourceUserId && user.id !== parseInt(resourceUserId)) {
    return res.status(403).json({
      error: 'Access denied - resource ownership required',
      code: 'RESOURCE_ACCESS_DENIED'
    });
  }

  next();
}

module.exports = {
  ROLES,
  requireRole,
  requireAdmin,
  preventRoleEscalation,
  verifyResourceOwnership
};
