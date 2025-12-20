# 🔐 RBAC System Documentation
## Role-Based Access Control - Enterprise Implementation

**Created:** 2025-10-02
**Status:** ✅ COMPLETED
**Version:** 1.0.0

---

## 📋 Overview

Ailydian Ultra Pro implements a comprehensive Role-Based Access Control (RBAC) system with 6 hierarchical role levels, granular permission management, and full Application Insights integration.

---

## 🎯 Role Hierarchy

### 6-Level Role System

| Role | Level | Description | Use Case |
|------|-------|-------------|----------|
| **SUPER_ADMIN** | 100 | Full system access (God mode) | System owners, CTO |
| **ADMIN** | 80 | System administration | DevOps, System Admins |
| **DEVELOPER** | 60 | API and development access | Backend developers |
| **MANAGER** | 50 | Analytics and reporting | Product managers, analysts |
| **USER** | 30 | Standard features | Regular users |
| **GUEST** | 10 | Limited read-only access | Public users |

---

## 📁 File Structure

```
ailydian-ultra-pro/
├── middleware/
│   └── rbac.js (361 lines)           # RBAC middleware system
├── api/
│   └── admin/
│       └── roles.js (238 lines)       # Role management API
├── backend/
│   └── models/
│       └── User.js (updated)          # User model with role methods
├── database/
│   ├── init-db.js (updated)           # Database schema with role column
│   └── migrations/
│       └── 001_add_role_column.js     # Migration script
```

---

## 🔧 Implementation Details

### 1. Middleware Functions (`middleware/rbac.js`)

#### `requireRole(roles)`
Checks if user has one of the required roles.

```javascript
const rbac = require('./middleware/rbac');

// Protect admin endpoints
app.use('/api/admin', rbac.requireRole(['ADMIN', 'SUPER_ADMIN']));

// Single role
app.get('/api/developer/logs', rbac.requireRole('DEVELOPER'), (req, res) => {
  // Only DEVELOPER, ADMIN, and SUPER_ADMIN can access
});
```

#### `requirePermission(permissions)`
Checks if user has specific permissions.

```javascript
// Protect specific operations
app.delete('/api/users/:id',
  rbac.requirePermission(['users:delete']),
  deleteUserHandler
);

// Multiple permissions required
app.post('/api/content',
  rbac.requirePermission(['content:write', 'content:publish']),
  createContentHandler
);
```

#### `requireLevel(minimumLevel)`
Checks if user role level meets minimum requirement.

```javascript
// Requires level 60 or higher (DEVELOPER+)
app.use('/api/analytics', rbac.requireLevel(60));
```

#### `requireOwnership(resourceUserIdField)`
Checks if user owns the resource.

```javascript
// User can only update their own profile
app.put('/api/profile/:userId',
  rbac.requireOwnership('userId'),
  updateProfileHandler
);
```

---

### 2. Permission System

#### Permission Format
Permissions follow the `resource:action` pattern:

```javascript
'users:read'       // Read user data
'users:write'      // Create/update users
'users:delete'     // Delete users
'api:test'         // Test API endpoints
'analytics:export' // Export analytics
```

#### Permission Groups

```javascript
PERMISSION_GROUPS = {
  FULL_ACCESS: ['*'],
  USER_MANAGEMENT: ['users:read', 'users:write', 'users:delete'],
  CONTENT_MANAGEMENT: ['content:read', 'content:write', 'content:delete'],
  ANALYTICS_ACCESS: ['analytics:read', 'analytics:write', 'analytics:export'],
  API_ACCESS: ['api:read', 'api:write', 'api:delete'],
  SYSTEM_ACCESS: ['system:read', 'system:write', 'system:restart']
}
```

#### Role Permissions Matrix

**SUPER_ADMIN (Level 100):**
- Permissions: `['*']` (all permissions)

**ADMIN (Level 80):**
```javascript
permissions: [
  'users:read', 'users:write', 'users:delete',
  'settings:read', 'settings:write',
  'analytics:read', 'analytics:write',
  'api:read', 'api:write',
  'logs:read', 'logs:write'
]
```

**DEVELOPER (Level 60):**
```javascript
permissions: [
  'api:read', 'api:write', 'api:test',
  'logs:read',
  'analytics:read',
  'docs:read', 'docs:write'
]
```

**MANAGER (Level 50):**
```javascript
permissions: [
  'analytics:read', 'analytics:export',
  'reports:read', 'reports:generate',
  'users:read'
]
```

**USER (Level 30):**
```javascript
permissions: [
  'chat:read', 'chat:write',
  'models:read', 'models:use',
  'profile:read', 'profile:write',
  'files:read', 'files:upload'
]
```

**GUEST (Level 10):**
```javascript
permissions: [
  'models:read',
  'docs:read'
]
```

---

### 3. Admin API Endpoints (`api/admin/roles.js`)

#### Get All Roles
```bash
GET /api/admin/roles
Authorization: Bearer <token>
Required Role: ADMIN | SUPER_ADMIN

Response:
{
  "success": true,
  "roles": [
    {
      "id": "SUPER_ADMIN",
      "level": 100,
      "name": "Super Administrator",
      "permissions": ["*"]
    },
    ...
  ]
}
```

#### Get Role Permissions
```bash
GET /api/admin/roles/:role/permissions
Authorization: Bearer <token>
Required Role: ADMIN | SUPER_ADMIN

Response:
{
  "success": true,
  "role": "DEVELOPER",
  "permissions": ["api:read", "api:write", "api:test", ...]
}
```

#### Update User Role
```bash
PUT /api/admin/users/:userId/role
Authorization: Bearer <token>
Required Role: ADMIN | SUPER_ADMIN
Content-Type: application/json

Body:
{
  "role": "DEVELOPER"
}

Response:
{
  "success": true,
  "message": "User role updated successfully",
  "user": {
    "id": 123,
    "email": "developer@example.com",
    "role": "DEVELOPER",
    "previousRole": "USER"
  }
}
```

#### Get All Users
```bash
GET /api/admin/users?page=1&limit=50&role=USER&search=john
Authorization: Bearer <token>
Required Role: ADMIN | SUPER_ADMIN

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 50)
- role: Filter by role (optional)
- search: Search by name or email (optional)

Response:
{
  "success": true,
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}
```

#### Get All Permissions
```bash
GET /api/admin/permissions
Authorization: Bearer <token>
Required Role: ADMIN | SUPER_ADMIN

Response:
{
  "success": true,
  "permissionGroups": {
    "USER_MANAGEMENT": ["users:read", "users:write", "users:delete"],
    ...
  }
}
```

#### Check User Permission
```bash
POST /api/admin/users/:userId/permissions/check
Authorization: Bearer <token>
Required Role: ADMIN | SUPER_ADMIN
Content-Type: application/json

Body:
{
  "permission": "api:write"
}

Response:
{
  "success": true,
  "userId": 123,
  "permission": "api:write",
  "hasPermission": true,
  "userRole": "DEVELOPER"
}
```

#### Get Audit Log
```bash
GET /api/admin/audit-log?page=1&limit=100&userId=123&action=role_assigned
Authorization: Bearer <token>
Required Role: ADMIN | SUPER_ADMIN

Response:
{
  "success": true,
  "events": [
    {
      "timestamp": "2025-10-02T10:30:00Z",
      "action": "RBAC_Role_Assigned",
      "userId": "user123",
      "performedBy": "admin456",
      "details": "Role changed from USER to ADMIN"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 100
  }
}
```

---

### 4. User Model Methods

#### `User.updateUserRole(userId, role)`
Update user's role (used by admin API).

```javascript
const User = require('./backend/models/User');

const updatedUser = await User.updateUserRole(123, 'DEVELOPER');
// Returns: { id, email, role: 'DEVELOPER', previousRole: 'USER', ... }
```

#### `User.getAllUsers(options)`
Get users with filtering and pagination.

```javascript
const users = await User.getAllUsers({
  page: 1,
  limit: 50,
  role: 'USER',
  search: 'john'
});
// Returns: Array of sanitized user objects
```

---

### 5. Utility Functions

#### `rbac.canAssignRole(currentUserRole, targetRole)`
Check if current user can assign target role.

```javascript
const canAssign = rbac.canAssignRole('ADMIN', 'DEVELOPER');
// true - ADMIN (level 80) can assign DEVELOPER (level 60)

const canAssign = rbac.canAssignRole('MANAGER', 'ADMIN');
// false - MANAGER (level 50) cannot assign ADMIN (level 80)
```

#### `rbac.getAvailableRoles()`
Get all available roles.

```javascript
const roles = rbac.getAvailableRoles();
// Returns: Array of role objects with id, level, name, permissions
```

#### `rbac.getRolePermissions(role)`
Get permissions for a specific role.

```javascript
const permissions = rbac.getRolePermissions('DEVELOPER');
// Returns: ['api:read', 'api:write', 'api:test', ...]
```

#### `rbac.hasPermission(user, permission)`
Check if user has specific permission.

```javascript
const hasPermission = rbac.hasPermission(user, 'api:write');
// Returns: true or false
```

#### `rbac.assignDefaultRole(user)`
Assign default role to new user.

```javascript
const user = rbac.assignDefaultRole({ email: 'test@example.com' });
// Sets user.role = 'USER'
```

---

## 📊 Application Insights Integration

All RBAC operations are tracked in Azure Application Insights:

### Tracked Events

1. **RBAC_Authorized** - Successful authorization
2. **RBAC_Unauthorized** - Missing authentication
3. **RBAC_Forbidden** - Insufficient permissions
4. **RBAC_Permission_Denied** - Permission check failed
5. **RBAC_Ownership_Denied** - Ownership check failed
6. **Admin_Roles_Viewed** - Admin viewed roles list
7. **Admin_Role_Assigned** - Role assigned to user
8. **Admin_Role_Assignment_Denied** - Role assignment blocked
9. **Admin_Users_Viewed** - Admin viewed users list

### Event Properties

```javascript
insightsService.trackEvent('RBAC_Authorized', {
  userId: 'user123',
  userRole: 'DEVELOPER',
  endpoint: '/api/logs',
  timestamp: '2025-10-02T10:30:00Z'
});
```

---

## 🗄️ Database Schema

### Users Table (Updated)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'USER',  -- ✅ New RBAC column
  twoFactorSecret TEXT,
  twoFactorEnabled INTEGER DEFAULT 0,
  emailVerified INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastLogin DATETIME,
  subscription TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 100,
  usageLimit INTEGER DEFAULT 1000,
  currentUsage INTEGER DEFAULT 0,
  resetDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  avatar TEXT,
  bio TEXT,
  status TEXT DEFAULT 'active'
);

-- Index for fast role queries
CREATE INDEX idx_users_role ON users(role);
```

### Migration Status

✅ **Migration Completed:** `database/migrations/001_add_role_column.js`

```bash
# Run migration
node database/migrations/001_add_role_column.js

# Output:
🔄 Running migration: Add role column to users table...
✅ Migration completed: Role column added successfully
```

---

## 🚀 Integration Guide

### Server Integration (`server.js`)

```javascript
// Import routes
const adminRolesRoutes = require('./api/admin/roles');

// Register routes
app.use('/api/admin', adminRolesRoutes);

// Protect specific routes
const rbac = require('./middleware/rbac');

app.use('/api/admin/settings', rbac.requireRole(['ADMIN', 'SUPER_ADMIN']));
app.use('/api/developer', rbac.requireRole(['DEVELOPER', 'ADMIN', 'SUPER_ADMIN']));
```

### JWT Token Integration

Roles are automatically included in JWT tokens:

```javascript
// User.generateToken() includes role
const token = jwt.sign({
  id: user.id,
  email: user.email,
  subscription: user.subscription,
  role: user.role || 'USER'
}, JWT_SECRET, { expiresIn: '7d' });
```

### Authentication Middleware

```javascript
// Extract user from JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded = User.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role  // ✅ Role available in req.user
  };

  next();
};

// Use with RBAC
app.get('/api/admin/users',
  authenticateToken,
  rbac.requireRole(['ADMIN', 'SUPER_ADMIN']),
  getUsersHandler
);
```

---

## 🧪 Testing Examples

### Test User Role Assignment

```javascript
// Admin assigns role to user
const response = await fetch('/api/admin/users/123/role', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ role: 'DEVELOPER' })
});

const result = await response.json();
console.log(result);
// { success: true, user: { role: 'DEVELOPER', previousRole: 'USER' } }
```

### Test Permission Check

```javascript
// Check if user can access endpoint
const response = await fetch('/api/developer/logs', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

// 200 OK - User has DEVELOPER role
// 403 Forbidden - User has USER role
```

---

## 📈 Performance Considerations

1. **Database Index:** Role column indexed for fast queries
2. **In-Memory Cache:** Role permissions cached in middleware
3. **JWT Token:** Role included in token to avoid DB lookups
4. **Lightweight Checks:** Minimal overhead on each request

---

## 🔒 Security Best Practices

1. **Hierarchical Enforcement:** SUPER_ADMIN always has access
2. **Role Assignment Rules:** Users can only assign roles ≤ their level
3. **Audit Logging:** All role changes tracked in Application Insights
4. **Ownership Validation:** Users can only access their own resources
5. **Token Refresh:** Roles updated on next login/token refresh

---

## 📝 Next Steps

1. ✅ **RBAC Implementation** - COMPLETED
2. ⏳ **Cost Tracking Dashboard** - IN PROGRESS
3. ⏳ **Azure SQL Database Migration** - PENDING
4. ⏳ **Redis Cache Layer** - PENDING
5. ⏳ **Azure AD B2C Integration** - PENDING

---

## 📞 Support

**Developer:** AX9F7E2B AI + Sardag
**Project:** Ailydian Ultra Pro
**Repository:** Desktop/ailydian-ultra-pro
**Documentation Date:** 2025-10-02

---

**✅ RBAC SYSTEM FULLY OPERATIONAL**
