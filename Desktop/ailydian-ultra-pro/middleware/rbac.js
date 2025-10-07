/**
 * 🔐 Role-Based Access Control (RBAC) Middleware
 * Medical AI - HIPAA Compliant Authorization System
 *
 * Roles Hierarchy:
 * - SUPER_ADMIN: Full system access (God mode)
 * - ADMIN: System administration
 * - DOCTOR: Medical professional with PHI access
 * - NURSE: Healthcare provider with limited PHI access
 * - LAB_TECHNICIAN: Lab results and diagnostics access
 * - PATIENT: Personal health data access only
 * - DEVELOPER: API and development access
 * - MANAGER: Analytics and reporting
 * - USER: Standard features
 * - GUEST: Limited read-only access
 */

const insightsService = require('../azure-services/application-insights');

// Role definitions with permissions
const ROLES = {
  SUPER_ADMIN: {
    level: 100,
    name: 'Super Administrator',
    permissions: ['*'], // All permissions
    canAccessPHI: true,
    canPrescribe: true,
    canDiagnose: true
  },
  ADMIN: {
    level: 80,
    name: 'Administrator',
    permissions: [
      'users:read', 'users:write', 'users:delete',
      'settings:read', 'settings:write',
      'analytics:read', 'analytics:write',
      'api:read', 'api:write',
      'logs:read', 'logs:write',
      'audit:read', 'audit:export'
    ],
    canAccessPHI: false, // Admins don't automatically get PHI access
    canPrescribe: false,
    canDiagnose: false
  },
  DOCTOR: {
    level: 75,
    name: 'Doctor / Physician',
    permissions: [
      'patients:read', 'patients:write',
      'medical:diagnose', 'medical:prescribe',
      'medical:read', 'medical:write',
      'phi:read', 'phi:write',
      'labs:read', 'labs:order',
      'imaging:read', 'imaging:order',
      'chat:medical',
      'referrals:read', 'referrals:write',
      'analytics:medical'
    ],
    canAccessPHI: true,
    canPrescribe: true,
    canDiagnose: true
  },
  NURSE: {
    level: 65,
    name: 'Nurse / Healthcare Provider',
    permissions: [
      'patients:read', 'patients:update',
      'medical:read', 'medical:update',
      'phi:read', 'phi:update',
      'labs:read', 'labs:update',
      'imaging:read',
      'vitals:read', 'vitals:write',
      'chat:medical',
      'triage:perform'
    ],
    canAccessPHI: true,
    canPrescribe: false,
    canDiagnose: false
  },
  LAB_TECHNICIAN: {
    level: 55,
    name: 'Lab Technician',
    permissions: [
      'labs:read', 'labs:write', 'labs:report',
      'patients:read',
      'phi:limited',
      'imaging:read', 'imaging:report'
    ],
    canAccessPHI: true, // Limited PHI access
    canPrescribe: false,
    canDiagnose: false
  },
  PATIENT: {
    level: 40,
    name: 'Patient',
    permissions: [
      'medical:self:read',
      'phi:self:read',
      'appointments:read', 'appointments:book',
      'prescriptions:self:read',
      'labs:self:read',
      'imaging:self:read',
      'chat:medical',
      'profile:read', 'profile:write',
      'consent:manage'
    ],
    canAccessPHI: true, // Only own PHI
    canPrescribe: false,
    canDiagnose: false,
    selfOnly: true // Can only access own data
  },
  DEVELOPER: {
    level: 60,
    name: 'Developer',
    permissions: [
      'api:read', 'api:write', 'api:test',
      'logs:read',
      'analytics:read',
      'docs:read', 'docs:write'
    ],
    canAccessPHI: false,
    canPrescribe: false,
    canDiagnose: false
  },
  MANAGER: {
    level: 50,
    name: 'Manager',
    permissions: [
      'analytics:read', 'analytics:export',
      'reports:read', 'reports:generate',
      'users:read'
    ],
    canAccessPHI: false,
    canPrescribe: false,
    canDiagnose: false
  },
  USER: {
    level: 30,
    name: 'User',
    permissions: [
      'chat:read', 'chat:write',
      'models:read', 'models:use',
      'profile:read', 'profile:write',
      'files:read', 'files:upload'
    ],
    canAccessPHI: false,
    canPrescribe: false,
    canDiagnose: false
  },
  GUEST: {
    level: 10,
    name: 'Guest',
    permissions: [
      'models:read',
      'docs:read'
    ],
    canAccessPHI: false,
    canPrescribe: false,
    canDiagnose: false
  }
};

// Permission groups for easier management
const PERMISSION_GROUPS = {
  FULL_ACCESS: ['*'],
  USER_MANAGEMENT: ['users:read', 'users:write', 'users:delete'],
  CONTENT_MANAGEMENT: ['content:read', 'content:write', 'content:delete'],
  ANALYTICS_ACCESS: ['analytics:read', 'analytics:write', 'analytics:export'],
  API_ACCESS: ['api:read', 'api:write', 'api:delete'],
  SYSTEM_ACCESS: ['system:read', 'system:write', 'system:restart'],

  // Medical-specific permission groups
  PHI_ACCESS: ['phi:read', 'phi:write', 'phi:update'],
  MEDICAL_PROFESSIONAL: ['medical:read', 'medical:write', 'medical:diagnose', 'medical:prescribe'],
  PATIENT_MANAGEMENT: ['patients:read', 'patients:write', 'patients:update'],
  LABORATORY_ACCESS: ['labs:read', 'labs:write', 'labs:order', 'labs:report'],
  IMAGING_ACCESS: ['imaging:read', 'imaging:write', 'imaging:order', 'imaging:report'],
  PRESCRIPTION_RIGHTS: ['medical:prescribe', 'prescriptions:write'],
  DIAGNOSIS_RIGHTS: ['medical:diagnose', 'diagnosis:write']
};

/**
 * Check if user has required role
 */
function requireRole(requiredRoles) {
  // Convert string to array
  if (typeof requiredRoles === 'string') {
    requiredRoles = [requiredRoles];
  }

  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        insightsService.trackEvent('RBAC_Unauthorized', {
          endpoint: req.path,
          reason: 'No user session'
        });

        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Get user role (default to GUEST if not set)
      const userRole = req.user.role || 'GUEST';

      // Check if user has required role
      const hasRole = requiredRoles.some(role =>
        userRole === role || userRole === 'SUPER_ADMIN'
      );

      if (!hasRole) {
        insightsService.trackEvent('RBAC_Forbidden', {
          userId: req.user.id,
          userRole,
          requiredRoles: requiredRoles.join(','),
          endpoint: req.path
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required role: ${requiredRoles.join(' or ')}`,
          userRole,
          requiredRoles
        });
      }

      // Track successful authorization
      insightsService.trackEvent('RBAC_Authorized', {
        userId: req.user.id,
        userRole,
        endpoint: req.path
      });

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      insightsService.trackException(error, {
        middleware: 'RBAC',
        endpoint: req.path
      });

      res.status(500).json({
        error: 'Authorization error',
        message: 'Failed to check permissions'
      });
    }
  };
}

/**
 * Check if user has specific permission
 */
function requirePermission(requiredPermissions) {
  // Convert string to array
  if (typeof requiredPermissions === 'string') {
    requiredPermissions = [requiredPermissions];
  }

  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Get user role and permissions
      const userRole = req.user.role || 'GUEST';
      const roleConfig = ROLES[userRole];

      if (!roleConfig) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Invalid user role'
        });
      }

      // Super admin has all permissions
      if (userRole === 'SUPER_ADMIN') {
        return next();
      }

      // Check permissions
      const userPermissions = roleConfig.permissions;
      const hasPermission = requiredPermissions.every(permission =>
        userPermissions.includes('*') || userPermissions.includes(permission)
      );

      if (!hasPermission) {
        insightsService.trackEvent('RBAC_Permission_Denied', {
          userId: req.user.id,
          userRole,
          requiredPermissions: requiredPermissions.join(','),
          endpoint: req.path
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
          requiredPermissions
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        error: 'Authorization error'
      });
    }
  };
}

/**
 * Check if user role level is high enough
 */
function requireLevel(minimumLevel) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      const userRole = req.user.role || 'GUEST';
      const roleConfig = ROLES[userRole];

      if (!roleConfig || roleConfig.level < minimumLevel) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient access level',
          currentLevel: roleConfig?.level || 0,
          requiredLevel: minimumLevel
        });
      }

      next();
    } catch (error) {
      console.error('Level check error:', error);
      res.status(500).json({
        error: 'Authorization error'
      });
    }
  };
}

/**
 * Check if user owns the resource
 */
function requireOwnership(resourceUserIdField = 'userId') {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      // Super admin and admin can access any resource
      if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
        return next();
      }

      // Get resource user ID from request (params, body, or query)
      const resourceUserId =
        req.params[resourceUserIdField] ||
        req.body[resourceUserIdField] ||
        req.query[resourceUserIdField];

      if (!resourceUserId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Resource owner information missing'
        });
      }

      // Check ownership
      if (resourceUserId.toString() !== req.user.id.toString()) {
        insightsService.trackEvent('RBAC_Ownership_Denied', {
          userId: req.user.id,
          resourceUserId,
          endpoint: req.path
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only access your own resources'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        error: 'Authorization error'
      });
    }
  };
}

/**
 * Assign default role to new users
 */
function assignDefaultRole(user) {
  if (!user.role) {
    user.role = 'USER';
  }
  return user;
}

/**
 * Check if role can be assigned by current user
 */
function canAssignRole(currentUserRole, targetRole) {
  const currentLevel = ROLES[currentUserRole]?.level || 0;
  const targetLevel = ROLES[targetRole]?.level || 0;

  // Can only assign roles with lower or equal level
  return currentLevel >= targetLevel;
}

/**
 * Get all available roles
 */
function getAvailableRoles() {
  return Object.entries(ROLES).map(([key, value]) => ({
    id: key,
    ...value
  }));
}

/**
 * Get permissions for a role
 */
function getRolePermissions(role) {
  return ROLES[role]?.permissions || [];
}

/**
 * Check if user has permission
 */
function hasPermission(user, permission) {
  const userRole = user.role || 'GUEST';
  const roleConfig = ROLES[userRole];

  if (!roleConfig) return false;
  if (roleConfig.permissions.includes('*')) return true;

  return roleConfig.permissions.includes(permission);
}

/**
 * Check if user can access PHI
 */
function requirePHIAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required for PHI access'
    });
  }

  const userRole = req.user.role || 'GUEST';
  const roleConfig = ROLES[userRole];

  if (!roleConfig || !roleConfig.canAccessPHI) {
    insightsService.trackEvent('RBAC_PHI_Access_Denied', {
      userId: req.user.id,
      userRole,
      endpoint: req.path
    });

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions to access Protected Health Information'
    });
  }

  // Log PHI access for HIPAA audit
  if (req.auditLogger) {
    req.auditLogger.logPHIAccess({
      userId: req.user.id,
      userRole,
      action: 'PHI_ACCESS_GRANTED',
      endpoint: req.path,
      ipAddress: req.ip,
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * Check if user can prescribe medications
 */
function requirePrescriptionRights(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  const userRole = req.user.role || 'GUEST';
  const roleConfig = ROLES[userRole];

  if (!roleConfig || !roleConfig.canPrescribe) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only licensed medical professionals can prescribe medications'
    });
  }

  next();
}

/**
 * Check if user can make diagnoses
 */
function requireDiagnosisRights(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  const userRole = req.user.role || 'GUEST';
  const roleConfig = ROLES[userRole];

  if (!roleConfig || !roleConfig.canDiagnose) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only licensed medical professionals can make diagnoses'
    });
  }

  next();
}

/**
 * Check if user is a medical professional
 */
function requireMedicalProfessional(req, res, next) {
  const medicalRoles = ['DOCTOR', 'NURSE', 'LAB_TECHNICIAN'];
  return requireRole(medicalRoles)(req, res, next);
}

/**
 * Get user's medical role capabilities
 */
function getMedicalCapabilities(user) {
  if (!user || !user.role) {
    return {
      canAccessPHI: false,
      canPrescribe: false,
      canDiagnose: false,
      selfOnly: false
    };
  }

  const roleConfig = ROLES[user.role];
  if (!roleConfig) {
    return {
      canAccessPHI: false,
      canPrescribe: false,
      canDiagnose: false,
      selfOnly: false
    };
  }

  return {
    canAccessPHI: roleConfig.canAccessPHI || false,
    canPrescribe: roleConfig.canPrescribe || false,
    canDiagnose: roleConfig.canDiagnose || false,
    selfOnly: roleConfig.selfOnly || false
  };
}

// Export middleware and utilities
module.exports = {
  // Middleware
  requireRole,
  requirePermission,
  requireLevel,
  requireOwnership,

  // Medical-specific middleware
  requirePHIAccess,
  requirePrescriptionRights,
  requireDiagnosisRights,
  requireMedicalProfessional,

  // Utilities
  assignDefaultRole,
  canAssignRole,
  getAvailableRoles,
  getRolePermissions,
  hasPermission,
  getMedicalCapabilities,

  // Constants
  ROLES,
  PERMISSION_GROUPS
};
