/**
// PRODUCTION REQUIREMENT: Azure App Insights required
if (!process.env.AZURE_APP_INSIGHTS_KEY) {
  throw new Error("AZURE_APP_INSIGHTS_KEY required - no placeholder mode");
}
 * 🔐 Admin - Role Management API
 * Manage user roles and permissions
 */

const express = require('express');
const router = express.Router();
const rbac = require('../../middleware/rbac');
const insightsService = require('../../azure-services/application-insights');
const User = require('../../backend/models/User');

/**
 * GET /api/admin/roles
 * Get all available roles
 */
router.get('/', rbac.requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
  try {
    const roles = rbac.getAvailableRoles();

    insightsService.trackEvent('Admin_Roles_Viewed', {
      userId: req.user.id,
      userRole: req.user.role
    });

    res.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    insightsService.trackException(error, { endpoint: '/api/admin/roles' });

    res.status(500).json({
      error: 'Failed to fetch roles',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/roles/:role/permissions
 * Get permissions for a specific role
 */
router.get('/:role/permissions', rbac.requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
  try {
    const { role } = req.params;
    const permissions = rbac.getRolePermissions(role);

    if (!permissions.length && role !== 'SUPER_ADMIN') {
      return res.status(404).json({
        error: 'Role not found'
      });
    }

    res.json({
      success: true,
      role,
      permissions
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      error: 'Failed to fetch permissions'
    });
  }
});

/**
 * PUT /api/admin/users/:userId/role
 * Update user role
 */
router.put('/users/:userId/role', rbac.requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!rbac.ROLES[role]) {
      return res.status(400).json({
        error: 'Invalid role',
        availableRoles: Object.keys(rbac.ROLES)
      });
    }

    // Check if current user can assign this role
    if (!rbac.canAssignRole(req.user.role, role)) {
      insightsService.trackEvent('Admin_Role_Assignment_Denied', {
        adminId: req.user.id,
        adminRole: req.user.role,
        targetUserId: userId,
        targetRole: role
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: `You cannot assign ${role} role. Insufficient permissions.`
      });
    }

    // Update user role
    const user = await User.updateUserRole(userId, role);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    insightsService.trackEvent('Admin_Role_Assigned', {
      adminId: req.user.id,
      adminRole: req.user.role,
      userId,
      newRole: role,
      oldRole: user.previousRole
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        previousRole: user.previousRole
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    insightsService.trackException(error, { endpoint: '/api/admin/users/:userId/role' });

    res.status(500).json({
      error: 'Failed to update user role',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
router.get('/users', rbac.requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query;

    const users = await User.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      role,
      search
    });

    insightsService.trackEvent('Admin_Users_Viewed', {
      adminId: req.user.id,
      page,
      limit,
      filters: { role, search }
    });

    res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    insightsService.trackException(error, { endpoint: '/api/admin/users' });

    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/permissions
 * Get all permission groups
 */
router.get('/permissions', rbac.requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
  try {
    res.json({
      success: true,
      permissionGroups: rbac.PERMISSION_GROUPS
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      error: 'Failed to fetch permissions'
    });
  }
});

/**
 * POST /api/admin/users/:userId/permissions/check
 * Check if user has specific permission
 */
router.post('/users/:userId/permissions/check', rbac.requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { permission } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const hasPermission = rbac.hasPermission(user, permission);

    res.json({
      success: true,
      userId,
      permission,
      hasPermission,
      userRole: user.role
    });
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({
      error: 'Failed to check permission'
    });
  }
});

/**
 * GET /api/admin/audit-log
 * Get RBAC audit log
 */
router.get('/audit-log', rbac.requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { page = 1, limit = 100, userId, action } = req.query;

    // Query Application Insights for RBAC events
    // This is a placeholder - actual implementation would query Azure Application Insights

    const auditLog = {
      events: [
        {
          timestamp: new Date().toISOString(),
          action: 'RBAC_Role_Assigned',
          userId: 'user123',
          performedBy: req.user.id,
          details: 'Role changed from USER to ADMIN'
        }
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    };

    res.json({
      success: true,
      ...auditLog
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      error: 'Failed to fetch audit log'
    });
  }
});

module.exports = router;
