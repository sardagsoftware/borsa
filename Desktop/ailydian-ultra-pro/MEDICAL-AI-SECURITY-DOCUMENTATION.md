# ENTERPRISE-GRADE SECURITY IMPLEMENTATION
## Medical AI System - HIPAA Compliant

**Document Version:** 1.0.0
**Last Updated:** 2025-10-06
**Classification:** Internal - Security Documentation
**Compliance:** HIPAA, GDPR, KVKK

---

## Table of Contents

1. [Overview](#overview)
2. [OAuth 2.0 Authentication System](#oauth-20-authentication-system)
3. [CSRF Protection](#csrf-protection)
4. [Rate Limiting](#rate-limiting)
5. [Input Validation & Sanitization](#input-validation--sanitization)
6. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
7. [Integration Guide](#integration-guide)
8. [Security Best Practices](#security-best-practices)
9. [Compliance & Audit](#compliance--audit)

---

## Overview

This document describes the enterprise-grade security implementation for the Medical AI system. The implementation follows white-hat security best practices and is designed to meet HIPAA, GDPR, and KVKK compliance requirements.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   OAuth 2.0   │  │     CSRF     │  │ Rate Limiting │     │
│  │ Authentication│  │  Protection  │  │   (DDoS)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Input     │  │     RBAC     │  │ HIPAA Audit   │     │
│  │  Validation  │  │ (Medical)    │  │   Logging     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

- **OAuth 2.0 with Azure AD B2C** - Enterprise SSO for healthcare organizations
- **JWT Token Management** - Short-lived access tokens (15 min) + refresh tokens (7 days)
- **CSRF Protection** - Double submit cookie + synchronizer token pattern
- **Advanced Rate Limiting** - 7 tiers with burst protection
- **Input Validation** - Joi schemas with XSS/SQLi/NoSQLi prevention
- **Medical RBAC** - 10 roles with PHI access control
- **HIPAA Audit Logging** - Complete audit trail for compliance

---

## OAuth 2.0 Authentication System

### File Location
`/api/auth/oauth.js`

### Features

1. **Multi-Provider Support**
   - Google OAuth
   - GitHub OAuth
   - Microsoft / Azure AD
   - Apple Sign-In (coming soon)

2. **JWT Token System**
   - **Access Token**: 15 minutes (HIPAA best practice)
   - **Refresh Token**: 7 days with rotation
   - **Token Binding**: JTI (JWT ID) for revocation support

3. **Session Management**
   - Redis-backed sessions for scalability
   - Secure cookie configuration
   - Rolling sessions (reset on activity)

4. **Medical Role Assignment**
   - Automatic role detection from Azure AD attributes
   - Job title mapping (Doctor, Nurse, Admin, etc.)
   - Default patient role for unknown users

### Configuration

#### Environment Variables

```env
# JWT Secrets
JWT_SECRET=your-256-bit-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
SESSION_SECRET=your-session-secret-key-here

# Azure AD B2C (for Healthcare Organizations)
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/github/callback

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=https://yourdomain.com/api/auth/microsoft/callback

# Redis (for distributed sessions)
REDIS_URL=redis://localhost:6379
```

### API Endpoints

#### 1. Google OAuth Login
```
GET /api/auth/google
```
Initiates Google OAuth flow.

#### 2. Google OAuth Callback
```
GET /api/auth/google/callback
```
Handles Google OAuth callback and generates JWT tokens.

#### 3. Microsoft OAuth Login
```
GET /api/auth/microsoft
```
Initiates Microsoft/Azure AD OAuth flow.

#### 4. Token Refresh
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

**Response:**
```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token",
  "expiresIn": 900
}
```

#### 5. Logout
```
POST /api/auth/logout
```
Destroys session and logs out user.

#### 6. Session Verification
```
GET /api/auth/verify
```
Verifies if user is authenticated.

### Security Features

1. **Brute Force Protection**
   - 5 login attempts per 5 minutes per IP
   - 15-minute lockout after exhaustion

2. **CSRF Protection**
   - State parameter validation in OAuth flow
   - Protects against CSRF attacks

3. **HIPAA Audit Logging**
   - All authentication events logged
   - Failed login attempts tracked
   - Token refresh events recorded

---

## CSRF Protection

### File Location
`/middleware/csrf.js`

### Features

1. **Double Submit Cookie Pattern**
   - Token stored in cookie
   - Token sent in header/body
   - Server validates both match

2. **Synchronizer Token Pattern**
   - Session-bound tokens
   - Server-side token storage
   - Cryptographically secure tokens (256-bit)

3. **Medical Endpoint Enhanced Protection**
   - Token rotation on sensitive operations
   - Origin/Referer validation
   - HIPAA audit logging

### Configuration

```javascript
const { setupCSRFProtection } = require('./middleware/csrf');

// In server.js
setupCSRFProtection(app);
```

### Usage

#### 1. Get CSRF Token
```
GET /api/csrf-token
```

**Response:**
```json
{
  "csrfToken": "your-csrf-token-here",
  "headerName": "x-csrf-token",
  "expiresIn": 86400000
}
```

#### 2. Include Token in Requests

**Option A: Custom Header (Preferred)**
```javascript
fetch('/api/medical/diagnosis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken
  },
  body: JSON.stringify(data)
});
```

**Option B: Request Body**
```javascript
fetch('/api/medical/diagnosis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ...data,
    _csrf: csrfToken
  })
});
```

### Middleware Usage

```javascript
const { medicalCSRFProtection, standardCSRFProtection } = require('./middleware/csrf');

// Medical endpoints (enhanced protection)
app.post('/api/medical/diagnosis', medicalCSRFProtection, diagnosisHandler);

// Standard endpoints
app.post('/api/settings', standardCSRFProtection, settingsHandler);

// Conditional CSRF (auto-detects medical endpoints)
app.use(conditionalCSRF);
```

---

## Rate Limiting

### File Location
`/middleware/rate-limit.js`

### Rate Limit Tiers

| Tier | Endpoints | Limit | Duration | Block Duration |
|------|-----------|-------|----------|----------------|
| **Auth** | `/auth/*`, `/login`, `/register` | 5 req | 5 min | 15 min |
| **Medical AI** | `/medical/*`, `/diagnosis/*`, `/patient/*` | 30 req | 1 min | 5 min |
| **Medical Burst** | Same as above | 10 req | 10 sec | N/A |
| **Doctor** | Medical endpoints (doctor role) | 200 req | 1 min | 1 min |
| **API** | `/api/*` | 100 req | 1 min | 2 min |
| **Premium** | All (premium users) | 500 req | 1 min | 1 min |
| **Public** | All other endpoints | 1000 req | 1 min | None |
| **Upload** | `/upload`, `/files` | 20 req | 1 hour | 2 hours |

### Features

1. **Intelligent Rate Limiting**
   - Automatic tier selection based on endpoint
   - User role-based limits (doctors get higher limits)
   - Premium user benefits

2. **Distributed Rate Limiting**
   - Redis-backed for multi-server deployments
   - Fallback to in-memory for development

3. **Burst Protection**
   - Medical AI endpoints have dual limits:
     - 30 requests/minute
     - 10 requests/10 seconds (burst)

4. **HIPAA Audit Logging**
   - Rate limit violations on medical endpoints logged
   - Security events tracked for compliance

### Configuration

```javascript
const { setupRateLimiting } = require('./middleware/rate-limit');

// In server.js
setupRateLimiting(app);
```

### Response Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-10-06T15:30:00.000Z
Retry-After: 60  (if rate limit exceeded)
```

### Custom Rate Limiting

```javascript
const {
  strictRateLimit,      // Auth endpoints
  medicalRateLimit,     // Medical endpoints
  apiRateLimit,         // API endpoints
  uploadRateLimit       // File uploads
} = require('./middleware/rate-limit');

// Apply specific rate limiter
app.post('/api/auth/login', strictRateLimit, loginHandler);
app.post('/api/medical/diagnosis', medicalRateLimit, diagnosisHandler);
```

---

## Input Validation & Sanitization

### File Location
`/middleware/input-validation.js`

### Features

1. **Joi Schema Validation**
   - Type-safe validation
   - Custom error messages
   - Strict mode (no unknown fields)

2. **XSS Prevention**
   - DOMPurify sanitization
   - HTML tag removal
   - Control character removal

3. **Injection Prevention**
   - SQL injection prevention
   - NoSQL injection prevention
   - Command injection prevention
   - Path traversal prevention

4. **Medical Data Validation**
   - FHIR-compliant schemas
   - Medical Record Number (MRN) validation
   - PHI detection
   - HIPAA audit logging

### Available Schemas

#### 1. User Registration
```javascript
const { validateUserRegistration } = require('./middleware/input-validation');

app.post('/api/auth/register', validateUserRegistration, registerHandler);
```

**Schema:**
```javascript
{
  email: string (required, valid email),
  password: string (min 8, uppercase + lowercase + number + special char),
  name: string (2-100 chars, letters only),
  phone: string (optional, E.164 format),
  role: enum ['patient', 'doctor', 'nurse', 'admin', 'lab_technician']
}
```

#### 2. User Login
```javascript
const { validateUserLogin } = require('./middleware/input-validation');

app.post('/api/auth/login', validateUserLogin, loginHandler);
```

#### 3. Medical Chat
```javascript
const { validateMedicalChat } = require('./middleware/input-validation');

app.post('/api/medical/chat', validateMedicalChat, chatHandler);
```

**Schema:**
```javascript
{
  message: string (required, 1-10000 chars),
  sessionId: uuid (optional),
  patientId: string (optional),
  specialty: enum ['general', 'cardiology', 'neurology', ...],
  urgency: enum ['low', 'medium', 'high', 'critical'],
  attachments: array of {
    filename: string (max 255),
    size: number (max 10MB),
    mimeType: enum ['image/jpeg', 'image/png', 'application/pdf', 'application/dicom']
  } (max 5 attachments)
}
```

#### 4. Patient Data (FHIR-compliant)
```javascript
const { validatePatientData } = require('./middleware/input-validation');

app.post('/api/patients', validatePatientData, createPatientHandler);
```

**Schema:**
```javascript
{
  mrn: string (required, alphanumeric + hyphens),
  firstName: string (required, letters only),
  lastName: string (required, letters only),
  dateOfBirth: date (required, past date),
  gender: enum ['male', 'female', 'other', 'unknown'],
  ssn: string (optional, XXX-XX-XXXX format),
  email: string (optional, valid email),
  phone: string (optional, E.164 format),
  address: object {
    street: string,
    city: string,
    state: string (2 chars, uppercase),
    zip: string (XXXXX or XXXXX-XXXX),
    country: string (2 chars, default 'US')
  },
  emergencyContact: object {
    name: string (required),
    relationship: string (required),
    phone: string (required, E.164 format)
  }
}
```

### Global Input Sanitization

```javascript
const { sanitizeInputs } = require('./middleware/input-validation');

// Apply to all routes
app.use(sanitizeInputs);
```

This middleware:
- Sanitizes all string inputs (body, query, params)
- Removes XSS payloads
- Prevents NoSQL injection
- Validates path parameters for traversal

### Medical Data Validation

```javascript
const { validateMedicalData } = require('./middleware/input-validation');

// Apply to medical endpoints
app.post('/api/medical/*', validateMedicalData, handler);
```

This middleware:
- Detects PHI in requests
- Validates user permissions for PHI access
- Logs PHI access for HIPAA audit
- Blocks unauthorized PHI access

---

## Role-Based Access Control (RBAC)

### File Location
`/middleware/rbac.js`

### Medical Role Hierarchy

| Role | Level | PHI Access | Prescribe | Diagnose | Description |
|------|-------|------------|-----------|----------|-------------|
| **SUPER_ADMIN** | 100 | ✓ | ✓ | ✓ | Full system access |
| **ADMIN** | 80 | ✗ | ✗ | ✗ | System administration |
| **DOCTOR** | 75 | ✓ | ✓ | ✓ | Medical professional |
| **NURSE** | 65 | ✓ | ✗ | ✗ | Healthcare provider |
| **LAB_TECHNICIAN** | 55 | ✓ (limited) | ✗ | ✗ | Lab results |
| **DEVELOPER** | 60 | ✗ | ✗ | ✗ | API access |
| **MANAGER** | 50 | ✗ | ✗ | ✗ | Analytics & reporting |
| **PATIENT** | 40 | ✓ (self only) | ✗ | ✗ | Personal health data |
| **USER** | 30 | ✗ | ✗ | ✗ | Standard features |
| **GUEST** | 10 | ✗ | ✗ | ✗ | Read-only access |

### Middleware Usage

#### 1. Require Specific Role
```javascript
const { requireRole } = require('./middleware/rbac');

// Single role
app.get('/api/admin/users', requireRole('ADMIN'), usersHandler);

// Multiple roles (any of)
app.get('/api/medical/patients', requireRole(['DOCTOR', 'NURSE']), patientsHandler);
```

#### 2. Require Permission
```javascript
const { requirePermission } = require('./middleware/rbac');

// Single permission
app.post('/api/prescriptions', requirePermission('medical:prescribe'), prescribeHandler);

// Multiple permissions (all required)
app.post('/api/diagnosis', requirePermission(['medical:diagnose', 'phi:write']), diagnoseHandler);
```

#### 3. Require Access Level
```javascript
const { requireLevel } = require('./middleware/rbac');

// Minimum level 75 (Doctor and above)
app.get('/api/medical/critical', requireLevel(75), criticalHandler);
```

#### 4. PHI Access Control
```javascript
const { requirePHIAccess } = require('./middleware/rbac');

// Requires role with PHI access permission
app.get('/api/patients/:id/records', requirePHIAccess, recordsHandler);
```

#### 5. Prescription Rights
```javascript
const { requirePrescriptionRights } = require('./middleware/rbac');

// Only doctors can prescribe
app.post('/api/prescriptions', requirePrescriptionRights, prescribeHandler);
```

#### 6. Diagnosis Rights
```javascript
const { requireDiagnosisRights } = require('./middleware/rbac');

// Only doctors can diagnose
app.post('/api/diagnosis', requireDiagnosisRights, diagnoseHandler);
```

#### 7. Medical Professional Only
```javascript
const { requireMedicalProfessional } = require('./middleware/rbac');

// Doctors, Nurses, Lab Technicians
app.get('/api/medical/dashboard', requireMedicalProfessional, dashboardHandler);
```

### Permission Groups

```javascript
const { PERMISSION_GROUPS } = require('./middleware/rbac');

// Available permission groups
PERMISSION_GROUPS.PHI_ACCESS                 // PHI read/write/update
PERMISSION_GROUPS.MEDICAL_PROFESSIONAL       // Medical operations
PERMISSION_GROUPS.PATIENT_MANAGEMENT         // Patient CRUD
PERMISSION_GROUPS.LABORATORY_ACCESS          // Lab operations
PERMISSION_GROUPS.IMAGING_ACCESS             // Imaging operations
PERMISSION_GROUPS.PRESCRIPTION_RIGHTS        // Prescribing
PERMISSION_GROUPS.DIAGNOSIS_RIGHTS           // Diagnosis
```

### Utility Functions

```javascript
const {
  getMedicalCapabilities,
  hasPermission,
  canAssignRole
} = require('./middleware/rbac');

// Check user capabilities
const capabilities = getMedicalCapabilities(req.user);
// Returns: { canAccessPHI, canPrescribe, canDiagnose, selfOnly }

// Check specific permission
if (hasPermission(req.user, 'medical:prescribe')) {
  // User can prescribe
}

// Check if user can assign a role to another user
if (canAssignRole(req.user.role, 'DOCTOR')) {
  // User can assign doctor role
}
```

---

## Integration Guide

### Step 1: Install Dependencies

```bash
npm install joi isomorphic-dompurify validator rate-limiter-flexible ioredis express-session connect-redis jsonwebtoken
```

### Step 2: Configure Environment Variables

Create `.env` file:

```env
NODE_ENV=production
PORT=3100

# JWT Secrets (REQUIRED - Generate strong secrets!)
JWT_SECRET=your-256-bit-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
SESSION_SECRET=your-session-secret-key-here

# Azure AD B2C
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# Redis (for distributed rate limiting and sessions)
REDIS_URL=redis://localhost:6379

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 3: Update server.js

```javascript
const express = require('express');
const app = express();

// 1. Load security middleware
const { setupCSRFProtection, conditionalCSRF } = require('./middleware/csrf');
const { setupRateLimiting } = require('./middleware/rate-limit');
const { sanitizeInputs, validateMedicalData } = require('./middleware/input-validation');
const { requirePHIAccess, requireMedicalProfessional } = require('./middleware/rbac');

// 2. Setup rate limiting (must be early in middleware chain)
setupRateLimiting(app);

// 3. Setup CSRF protection
setupCSRFProtection(app);

// 4. Apply global input sanitization
app.use(sanitizeInputs);

// 5. Apply conditional CSRF to all routes
app.use(conditionalCSRF);

// 6. Mount OAuth routes
const authRoutes = require('./api/auth/oauth');
app.use('/api/auth', authRoutes);

// 7. Protect medical endpoints
app.use('/api/medical/*', validateMedicalData);
app.use('/api/patients/*', requirePHIAccess);
app.use('/api/diagnosis/*', requireMedicalProfessional);

// Your application routes here...

app.listen(3100, () => {
  console.log('Server running with enterprise-grade security');
});
```

### Step 4: Frontend Integration

#### Get CSRF Token
```javascript
async function getCsrfToken() {
  const response = await fetch('/api/csrf-token');
  const data = await response.json();
  return data.csrfToken;
}
```

#### Make Authenticated Requests
```javascript
async function callMedicalAPI(endpoint, data) {
  const csrfToken = await getCsrfToken();
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'x-csrf-token': csrfToken
    },
    body: JSON.stringify(data)
  });

  if (response.status === 401) {
    // Access token expired - refresh it
    await refreshToken();
    return callMedicalAPI(endpoint, data); // Retry
  }

  return response.json();
}
```

#### Token Refresh
```javascript
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    // Refresh token invalid - redirect to login
    window.location.href = '/auth.html';
    return;
  }

  const { accessToken, refreshToken: newRefreshToken } = await response.json();
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', newRefreshToken);
}
```

---

## Security Best Practices

### 1. Secret Management

**DO:**
- Use strong, randomly generated secrets (256-bit minimum)
- Rotate secrets regularly (every 90 days)
- Store secrets in environment variables or secret managers (Azure Key Vault, AWS Secrets Manager)
- Use different secrets for development, staging, and production

**DON'T:**
- Hardcode secrets in code
- Commit secrets to version control
- Share secrets via email or chat
- Use default or example secrets in production

### 2. HTTPS/TLS

**REQUIRED in Production:**
- TLS 1.3 only
- Strong cipher suites (AES-256-GCM, ChaCha20-Poly1305)
- Valid SSL certificate (not self-signed)
- HSTS header (max-age=31536000)

### 3. Database Security

**DO:**
- Use parameterized queries (prevents SQL injection)
- Encrypt PHI at rest (AES-256)
- Enable audit logging
- Implement backup encryption
- Use least privilege database accounts

### 4. PHI Handling

**HIPAA Requirements:**
- De-identify PHI when possible
- Encrypt PHI in transit (TLS 1.3)
- Encrypt PHI at rest (AES-256)
- Implement access controls (RBAC)
- Log all PHI access
- Retain audit logs for 7 years
- Implement data retention policies

### 5. Error Handling

**DO:**
- Log detailed errors server-side
- Return generic error messages to clients
- Don't expose stack traces
- Don't leak sensitive information in errors

**Example:**
```javascript
try {
  // Operation
} catch (error) {
  console.error('Detailed error:', error); // Server-side only
  res.status(500).json({
    error: 'Internal server error', // Generic message
    message: 'An error occurred processing your request'
  });
}
```

### 6. Logging & Monitoring

**Log:**
- All authentication events (success & failure)
- PHI access
- Permission denied events
- Rate limit violations
- Security errors

**DON'T Log:**
- Passwords
- Tokens
- PHI content
- Credit card numbers

---

## Compliance & Audit

### HIPAA Compliance

This implementation includes the following HIPAA safeguards:

#### Administrative Safeguards
- ✓ Access controls (RBAC)
- ✓ Audit controls (comprehensive logging)
- ✓ Security awareness training (documentation)
- ✓ Contingency planning (backup strategies)

#### Physical Safeguards
- ✓ Workstation security (TLS encryption)
- ✓ Device and media controls (encryption at rest)

#### Technical Safeguards
- ✓ Access control (authentication & authorization)
- ✓ Audit controls (HIPAA audit logs)
- ✓ Integrity controls (input validation)
- ✓ Transmission security (TLS 1.3)

### Audit Log Requirements

All audit logs include:
- User ID
- User role
- Timestamp (ISO 8601)
- IP address
- Action performed
- Endpoint accessed
- Success/failure status

**Retention:** 7 years (HIPAA requirement)

### GDPR/KVKK Compliance

- ✓ Right to access (user can request their data)
- ✓ Right to erasure (data deletion endpoints)
- ✓ Data portability (export functionality)
- ✓ Consent management (patient consent tracking)
- ✓ Data minimization (only collect necessary data)
- ✓ Purpose limitation (data used only for stated purposes)

---

## Testing

### Security Testing Checklist

- [ ] Test authentication with valid credentials
- [ ] Test authentication with invalid credentials
- [ ] Test rate limiting (trigger rate limit)
- [ ] Test CSRF protection (make request without token)
- [ ] Test CSRF protection (make request with invalid token)
- [ ] Test input validation (send invalid data)
- [ ] Test XSS prevention (send XSS payloads)
- [ ] Test SQL injection (send SQL payloads)
- [ ] Test NoSQL injection (send NoSQL payloads)
- [ ] Test role-based access (access endpoint with wrong role)
- [ ] Test PHI access control (patient tries to access other patient's data)
- [ ] Test token expiration (use expired token)
- [ ] Test token refresh (refresh expired token)
- [ ] Test HTTPS enforcement (try HTTP in production)

### Automated Security Testing

```bash
# Install OWASP ZAP or similar tool
# Run automated security scan
npm run security:scan

# Run dependency vulnerability scan
npm audit
npm audit fix

# Check for known vulnerabilities
npm install -g snyk
snyk test
```

---

## Support & Contact

For security issues or questions:

**Email:** security@ailydian.com
**Security Hotline:** Available 24/7 for critical issues
**Documentation:** https://docs.ailydian.com/security

---

## Changelog

### Version 1.0.0 (2025-10-06)
- Initial release
- OAuth 2.0 with Azure AD B2C integration
- CSRF protection middleware
- Advanced rate limiting with 7 tiers
- Input validation with Joi
- Medical RBAC with 10 roles
- HIPAA audit logging

---

**Document Classification:** Internal - Security Documentation
**Compliance:** HIPAA, GDPR, KVKK
**Review Frequency:** Quarterly
**Next Review:** 2026-01-06
