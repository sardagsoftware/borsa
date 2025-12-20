# 🔐 httpOnly Cookie Implementation Guide

**Date**: 25 Ekim 2025
**Phase**: 2 - Security Hardening
**Priority**: High (XSS Protection)
**Status**: 🔄 IN PROGRESS

---

## 📊 SCOPE

### Files to Modify

**Backend** (5 files):
```
✅ middleware/cookie-auth.js (CREATED - 250 lines)
⏳ middleware/api-auth.js (UPDATE - add cookie support)
⏳ api/auth/login.js (UPDATE - set cookies)
⏳ api/auth/logout.js (UPDATE - clear cookies)
⏳ api/auth/refresh.js (CREATE - refresh token endpoint)
```

**Frontend** (27 files):
```
⏳ public/dashboard.html (auth_token)
⏳ public/cost-dashboard.html (token)
⏳ public/governance-dashboard.html (governance_token)
⏳ public/chat.html (userToken)
⏳ public/lydian-iq.html (sessionToken)
... (22 more files)
```

---

## 🎯 IMPLEMENTATION STRATEGY

### Phase 2.1: Backend Foundation ✅ DONE

```
✅ Created middleware/cookie-auth.js
   - setCookie(), setAuthCookies()
   - getCookie(), clearAuthCookies()
   - generateCSRFToken(), setCSRFCookie()
   - csrfProtection middleware
   - getAuthToken() for dual support
```

### Phase 2.2: Auth Middleware Update (CURRENT)

**File**: `middleware/api-auth.js`

**Change**:
```javascript
// BEFORE:
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  // ...
}

// AFTER:
const { getAuthToken } = require('./cookie-auth');

function authenticate(req, res, next) {
  // Support both cookies (preferred) and headers (API clients)
  const token = getAuthToken(req);
  // ...
}
```

### Phase 2.3: Login Endpoint Update

**File**: `api/auth/login.js`

**Change**:
```javascript
// BEFORE:
res.json({
  success: true,
  token: jwt.sign(...)
});

// AFTER:
const { setAuthCookies, setCSRFCookie, generateCSRFToken } = require('../../middleware/cookie-auth');

// Generate tokens
const accessToken = jwt.sign({ userId, ... }, SECRET, { expiresIn: '15m' });
const refreshToken = jwt.sign({ userId, type: 'refresh' }, SECRET, { expiresIn: '7d' });
const csrfToken = generateCSRFToken();

// Set httpOnly cookies
setAuthCookies(res, accessToken, refreshToken);
setCSRFCookie(res, csrfToken);

res.json({
  success: true,
  user: { id, email, role },
  csrfToken  // Client needs this for POST requests
});
```

### Phase 2.4: Logout Endpoint Update

**File**: `api/auth/logout.js`

**Change**:
```javascript
// BEFORE:
res.json({ success: true, message: 'Logged out' });

// AFTER:
const { clearAuthCookies } = require('../../middleware/cookie-auth');

clearAuthCookies(res);
res.json({ success: true, message: 'Logged out' });
```

### Phase 2.5: Refresh Token Endpoint (NEW)

**File**: `api/auth/refresh.js` (CREATE)

```javascript
const jwt = require('jsonwebtoken');
const { getCookie, setAuthCookies } = require('../../middleware/cookie-auth');

module.exports = async (req, res) => {
  // Get refresh token from cookie
  const refreshToken = getCookie(req, 'refresh_token');

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    // Verify refresh token
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: payload.userId, email: payload.email, role: payload.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Set new access token cookie
    setAuthCookies(res, newAccessToken, refreshToken);

    res.json({ success: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};
```

### Phase 2.6: Frontend Update (Critical Files)

**Pattern for ALL frontend files**:

```javascript
// BEFORE:
localStorage.setItem('auth_token', token);
const token = localStorage.getItem('auth_token');

fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// AFTER:
// 1. Remove all localStorage calls
// 2. Add credentials: 'include' to fetch
// 3. Add CSRF token to POST/PUT/DELETE

// Store CSRF token (NOT httpOnly, can be read)
let csrfToken = null;

// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',  // Send cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
csrfToken = data.csrfToken;  // Store for POST requests

// GET request (no CSRF needed)
await fetch('/api/auth/me', {
  credentials: 'include'  // Cookies sent automatically
});

// POST request (CSRF token required)
await fetch('/api/data', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken  // Add CSRF token
  },
  body: JSON.stringify({ ... })
});

// Auto-refresh on 401
async function fetchWithRefresh(url, options = {}) {
  options.credentials = 'include';

  let response = await fetch(url, options);

  if (response.status === 401) {
    // Try refresh
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });

    if (refreshRes.ok) {
      // Retry original request
      response = await fetch(url, options);
    } else {
      // Redirect to login
      window.location.href = '/login.html';
    }
  }

  return response;
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Backend

- [x] Create cookie-auth middleware
- [ ] Update api-auth middleware (cookie support)
- [ ] Update login endpoint (set cookies)
- [ ] Update logout endpoint (clear cookies)
- [ ] Create refresh endpoint (token rotation)
- [ ] Test backend with Postman/curl

### Frontend (Priority Files)

- [ ] dashboard.html
- [ ] cost-dashboard.html
- [ ] governance-dashboard.html
- [ ] chat.html
- [ ] lydian-iq.html

### Frontend (Remaining 22 files)

- [ ] Bulk update with pattern matching
- [ ] Test each critical page
- [ ] Verify no localStorage usage remains

### Testing

- [ ] Login flow (cookies set)
- [ ] API calls (cookies sent)
- [ ] Logout (cookies cleared)
- [ ] Refresh token (silent refresh)
- [ ] CSRF protection (POST blocked without token)
- [ ] XSS test (cookies not accessible from JS)

### Deployment

- [ ] Git commit
- [ ] Deploy to production
- [ ] Verify 0 errors
- [ ] Monitor for issues

---

## 🔒 SECURITY BENEFITS

### Before (localStorage)

```
❌ XSS vulnerable (JavaScript can read)
❌ No automatic expiry
❌ Sent to all domains (if XSS)
❌ No CSRF protection
```

### After (httpOnly Cookies)

```
✅ XSS protected (httpOnly flag)
✅ Automatic expiry (maxAge)
✅ Same-site only (sameSite=strict)
✅ HTTPS only in prod (secure flag)
✅ CSRF token validation
✅ Refresh token rotation
```

---

## 🎯 COMPLETION CRITERIA

### Must-Have (0 Errors)

```
✅ All auth flows work with cookies
✅ No localStorage token usage
✅ CSRF protection active
✅ httpOnly + Secure + SameSite flags set
✅ Refresh token mechanism working
✅ 0 production errors
```

### Nice-to-Have

```
⏳ Automatic token refresh (background)
⏳ Remember me functionality
⏳ Device tracking (security)
⏳ Session management dashboard
```

---

## 📊 MIGRATION PLAN

### Step 1: Dual Support (Backward Compatible)

```
Week 1: Backend supports BOTH cookies AND headers
      - Old clients: continue using localStorage
      - New clients: use cookies

Week 2: Frontend updates (gradual rollout)
      - Update critical pages first
      - Test extensively
      - Monitor for issues

Week 3: Deprecation notice
      - Log warning for header auth
      - Encourage users to re-login

Week 4: Remove localStorage support
      - Frontend: remove all localStorage code
      - Backend: cookies only
```

### Step 2: Immediate Cutover (Aggressive)

```
Day 1: Deploy backend + frontend together
     - All users must re-login
     - Clear all existing tokens

Day 2: Monitor and fix issues
Day 3: Verify 100% cookie usage
```

**Recommended**: Dual support for smooth transition

---

## 🐛 TROUBLESHOOTING

### Issue 1: Cookies not sent

**Symptom**: API returns 401, cookies exist
**Cause**: Missing `credentials: 'include'`
**Fix**: Add to all fetch calls

### Issue 2: CSRF validation fails

**Symptom**: POST requests fail with 403
**Cause**: Missing `X-CSRF-Token` header
**Fix**: Add header from stored csrfToken

### Issue 3: Refresh loop

**Symptom**: Infinite refresh calls
**Cause**: Refresh endpoint also returns 401
**Fix**: Check refresh token expiry, redirect to login

### Issue 4: Cookies not set

**Symptom**: No Set-Cookie header
**Cause**: Incorrect res.setHeader usage
**Fix**: Use cookie-auth middleware

---

## 📝 CODE SAMPLES

### Complete Login Example

**Backend** (`api/auth/login.js`):
```javascript
const jwt = require('jsonwebtoken');
const { setAuthCookies, setCSRFCookie, generateCSRFToken } = require('../../middleware/cookie-auth');

module.exports = async (req, res) => {
  const { email, password } = req.body;

  // Validate credentials (your logic here)
  const user = await validateUser(email, password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m', issuer: 'LyDian-Platform' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d', issuer: 'LyDian-Platform' }
  );

  const csrfToken = generateCSRFToken();

  // Set httpOnly cookies
  setAuthCookies(res, accessToken, refreshToken);
  setCSRFCookie(res, csrfToken);

  // Return user data + CSRF token
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    csrfToken
  });
};
```

**Frontend** (`public/dashboard.html`):
```javascript
// Login handler
async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',  // IMPORTANT: Send/receive cookies
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();

    // Store CSRF token (in memory or sessionStorage, NOT localStorage)
    window.csrfToken = data.csrfToken;

    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed');
  }
}

// API call with CSRF
async function updateProfile(profileData) {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': window.csrfToken  // Add CSRF token
    },
    body: JSON.stringify(profileData)
  });

  return response.json();
}

// GET request (no CSRF needed)
async function loadDashboard() {
  const response = await fetch('/api/auth/me', {
    credentials: 'include'  // Cookies sent automatically
  });

  if (!response.ok) {
    // Not authenticated, redirect
    window.location.href = '/login.html';
    return;
  }

  const userData = await response.json();
  // Update UI with userData
}

// Initialize
document.addEventListener('DOMContentLoaded', loadDashboard);
```

---

## 🎉 EXPECTED OUTCOME

### Security Improvements

```
🔐 XSS Protection: httpOnly cookies
🔐 CSRF Protection: CSRF tokens
🔐 HTTPS Enforcement: Secure flag
🔐 Token Rotation: Refresh mechanism
🔐 Session Management: Automatic expiry
```

### User Experience

```
✅ Seamless authentication (cookies auto-sent)
✅ Silent token refresh (no interruption)
✅ Secure logout (cookies cleared)
✅ No manual token management
```

### Compliance

```
✅ OWASP Top 10 compliance
✅ SOC 2 requirement (secure auth)
✅ GDPR compliance (session management)
✅ White-hat security practices
```

---

**🚀 READY TO IMPLEMENT**

All code samples, patterns, and migration plan documented.
Next: Execute Phase 2.2-2.6 systematically.

**Estimated Effort**: 2-3 days full implementation
**Risk**: Medium (requires thorough testing)
**Impact**: High (significant security improvement)

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**
**Co-Authored-By: Claude <noreply@anthropic.com>**

---

*Last Update: 25 Ekim 2025 04:50 AM*
*Status: Implementation Guide Complete ✅*
*Next: Phase 2.2 - Update auth middleware*
