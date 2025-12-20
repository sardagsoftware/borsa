# 🔐 JWT AUTHENTICATION SYSTEM - Medical LyDian

## Overview

Complete JWT (JSON Web Token) authentication system with role-based access control (RBAC), session management, and security features for Medical LyDian platform.

---

## 🎯 Features

### Core Authentication
- ✅ JWT token generation and verification
- ✅ Access tokens (15 min expiry) + Refresh tokens (7 days)
- ✅ HTTP-only secure cookies
- ✅ Token refresh mechanism
- ✅ Multi-device session management
- ✅ Logout (single device or all devices)

### Security
- ✅ Role-Based Access Control (RBAC)
- ✅ Permission system
- ✅ Session revocation
- ✅ Secure token storage
- ✅ IP and device tracking
- ✅ Activity logging

### Compatibility
- ✅ Legacy userId query parameter support
- ✅ Gradual migration path
- ✅ Backward compatible APIs

---

## 🏗️ Architecture

### Token Types

#### Access Token (Short-lived)
```javascript
{
  userId: "uuid",
  email: "user@example.com",
  role: "patient|doctor|admin",
  type: "access",
  metadata: {
    fullName: "John Doe"
  },
  iat: timestamp,
  exp: timestamp, // 15 minutes
  iss: "medical-lydian",
  aud: "medical-lydian-api"
}
```

#### Refresh Token (Long-lived)
```javascript
{
  userId: "uuid",
  email: "user@example.com",
  type: "refresh",
  iat: timestamp,
  exp: timestamp, // 7 days
  iss: "medical-lydian",
  aud: "medical-lydian-api"
}
```

---

## 👥 User Roles

### Available Roles
1. **patient** - Regular users uploading medical files
2. **doctor** - Medical professionals with analysis capabilities
3. **nurse** - Healthcare staff with limited access
4. **staff** - Administrative staff
5. **admin** - Full system access

### Permissions Matrix

| Permission | Patient | Doctor | Nurse | Staff | Admin |
|-----------|---------|--------|-------|-------|-------|
| file:read:own | ✅ | ✅ | ✅ | ✅ | ✅ |
| file:read:all | ❌ | ✅ | ❌ | ❌ | ✅ |
| file:write | ✅ | ✅ | ✅ | ❌ | ✅ |
| file:delete | ✅ | ✅ | ❌ | ❌ | ✅ |
| analysis:run | ❌ | ✅ | ✅ | ❌ | ✅ |
| analysis:read:own | ✅ | ✅ | ✅ | ❌ | ✅ |
| analysis:read:all | ❌ | ✅ | ❌ | ❌ | ✅ |
| user:update:own | ✅ | ✅ | ✅ | ✅ | ✅ |
| user:update:all | ❌ | ❌ | ❌ | ❌ | ✅ |
| admin:* | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 📡 API Endpoints

### 1. Login
**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "patient"
    },
    "accessToken": "eyJhbGc...",
    "expiresIn": "15m"
  },
  "message": "Login successful"
}
```

**Sets Cookie:**
```
refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
```

---

### 2. Refresh Token
**POST** `/api/auth/refresh`

**Request:**
```json
{
  "refreshToken": "optional-if-in-cookie"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": "15m",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "patient"
    }
  },
  "message": "Token refreshed successfully"
}
```

---

### 3. Logout
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request:**
```json
{
  "revokeAll": false  // true to logout from all devices
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "revokedCount": 1
  }
}
```

---

## 🔧 Using JWT in Your APIs

### Method 1: Required Authentication

```javascript
const { authenticate, authorize } = require('../auth/jwt-middleware');

export default async function handler(req, res) {
    // Apply authentication middleware
    await new Promise((resolve, reject) => {
        authenticate(req, res, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    // User is now available in req.user
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Your API logic here
}
```

### Method 2: Optional Authentication (with Legacy Support)

```javascript
const { optionalAuthenticate, legacyCompatibility } = require('../auth/jwt-middleware');

export default async function handler(req, res) {
    // Try JWT first, fallback to legacy userId
    await new Promise((resolve) => {
        optionalAuthenticate(req, res, () => {
            legacyCompatibility(req, res, resolve);
        });
    });

    // User available from JWT or legacy
    const userId = req.user?.userId;

    // Your API logic here
}
```

### Method 3: Role-Based Authorization

```javascript
const { authenticate, authorize } = require('../auth/jwt-middleware');

export default async function handler(req, res) {
    // Authenticate
    await new Promise((resolve, reject) => {
        authenticate(req, res, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    // Check permissions
    await new Promise((resolve, reject) => {
        authorize('file:write', 'analysis:run')(req, res, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    // User has required permissions
    const userId = req.user.userId;

    // Your API logic here
}
```

---

## 🌐 Client-Side Usage

### Login Flow

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123'
    })
});

const { data } = await loginResponse.json();

// 2. Store access token (localStorage or memory)
localStorage.setItem('accessToken', data.accessToken);

// 3. Use token in subsequent requests
const response = await fetch('/api/medical/file-manager?action=list', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
});
```

### Automatic Token Refresh

```javascript
// Token refresh helper
async function refreshAccessToken() {
    const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'  // Include cookies
    });

    if (response.ok) {
        const { data } = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
    }

    // Refresh failed - redirect to login
    window.location.href = '/login';
    return null;
}

// API helper with automatic retry
async function authenticatedFetch(url, options = {}) {
    // Add authorization header
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    };

    let response = await fetch(url, options);

    // If token expired, refresh and retry
    if (response.status === 401) {
        const errorData = await response.json();

        if (errorData.code === 'TOKEN_EXPIRED') {
            const newToken = await refreshAccessToken();

            if (newToken) {
                // Retry request with new token
                options.headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(url, options);
            }
        }
    }

    return response;
}

// Usage
const files = await authenticatedFetch('/api/medical/file-manager?action=list');
```

### Logout

```javascript
async function logout(fromAllDevices = false) {
    await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ revokeAll: fromAllDevices })
    });

    // Clear local storage
    localStorage.removeItem('accessToken');

    // Redirect to login
    window.location.href = '/login';
}
```

---

## 🗄️ Database Schema

### user_sessions Table (New)

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(refresh_token)
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

---

## 🔐 Environment Variables

Add to your `.env` or Vercel environment variables:

```bash
# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-super-secret-access-token-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-here

# Token Expiration
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Existing variables
DATABASE_URL=postgresql://...
```

---

## 📋 Migration Guide

### Step 1: Run Database Migration

```bash
psql $DATABASE_URL << 'EOF'
-- Add user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(refresh_token)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
EOF
```

### Step 2: Set Environment Variables

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add `JWT_SECRET` and `JWT_REFRESH_SECRET`
3. Add `JWT_EXPIRATION` and `JWT_REFRESH_EXPIRATION` (optional)

### Step 3: Update Your APIs

Replace legacy userId logic:

**Before:**
```javascript
const userId = req.query.userId || 'default-user';
```

**After:**
```javascript
const { optionalAuthenticate, legacyCompatibility } = require('../auth/jwt-middleware');

await new Promise((resolve) => {
    optionalAuthenticate(req, res, () => {
        legacyCompatibility(req, res, resolve);
    });
});

const userId = req.user?.userId;
```

### Step 4: Update Frontend

1. Implement login page
2. Store access tokens
3. Add Authorization headers
4. Implement token refresh logic
5. Handle 401 responses

---

## 🧪 Testing

### Test Login

```bash
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Protected Endpoint

```bash
# Get access token from login response
TOKEN="eyJhbGc..."

curl https://your-domain.vercel.app/api/medical/file-manager?action=list \
  -H "Authorization: Bearer $TOKEN"
```

### Test Token Refresh

```bash
# Using refresh token from cookie
curl -X POST https://your-domain.vercel.app/api/auth/refresh \
  -H "Cookie: refresh_token=<refresh-token>" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

---

## 🚨 Security Best Practices

1. **Never expose JWT secrets** - Keep them in environment variables
2. **Use HTTPS in production** - Tokens should only be sent over secure connections
3. **HttpOnly cookies for refresh tokens** - Prevents XSS attacks
4. **Short-lived access tokens** - Limits damage if compromised
5. **Rotate refresh tokens** - Consider implementing token rotation on refresh
6. **IP and device tracking** - Log suspicious activity
7. **Rate limiting** - Prevent brute force attacks on login
8. **Secure password storage** - Use bcrypt with salt rounds ≥ 10

---

## 📊 Monitoring

### Track Active Sessions

```sql
SELECT
    u.email,
    COUNT(*) as active_sessions,
    MAX(s.last_used_at) as last_activity
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.revoked = FALSE AND s.expires_at > NOW()
GROUP BY u.id, u.email
ORDER BY active_sessions DESC;
```

### Find Expired Sessions to Clean

```sql
DELETE FROM user_sessions
WHERE expires_at < NOW() - INTERVAL '30 days';
```

---

## 🐛 Troubleshooting

### Token Expired Error

**Problem:** Getting `TOKEN_EXPIRED` error

**Solution:** Implement automatic token refresh on the client side (see Client-Side Usage section)

### Invalid Token Error

**Problem:** `INVALID_TOKEN` or `JsonWebTokenError`

**Solution:**
1. Check JWT_SECRET is set correctly
2. Verify token format: `Bearer <token>`
3. Ensure token hasn't been tampered with

### No Token Error

**Problem:** `NO_TOKEN` or `Authentication required`

**Solution:**
1. Include `Authorization: Bearer <token>` header
2. Check token is stored correctly on client
3. Verify token hasn't expired

### Legacy userId Not Working

**Problem:** APIs not recognizing legacy userId parameter

**Solution:** Ensure `legacyCompatibility` middleware is applied after `optionalAuthenticate`

---

## ✨ Next Steps

1. **Implement login UI** - Create a beautiful login page
2. **Add registration endpoint** - New user signup
3. **Email verification** - Verify user emails
4. **Password reset** - Forgot password flow
5. **2FA/MFA** - Two-factor authentication
6. **Social login** - OAuth with Google, Apple, etc.
7. **Session management UI** - Let users view/revoke active sessions
8. **Audit logging** - Comprehensive security audit trail

---

## 📞 Support

For issues or questions about JWT authentication:
1. Check this documentation
2. Review the code in `api/auth/jwt-middleware.js`
3. Test with the provided examples
4. Check server logs for detailed error messages

**Remember:** Keep your JWT secrets secure and never commit them to version control!
