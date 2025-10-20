# LyDian Platform Security & Compliance Guide

**Version**: 2.1.0
**Last Updated**: 2025-01-07
**Classification**: Public

---

## 🛡️ Overview

LyDian platform implements **enterprise-grade security** with **GDPR & KVKK compliance** built-in. This guide covers authentication, authorization, encryption, rate limiting, DDoS protection, audit logging, and data privacy.

## 📋 Table of Contents

1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Rate Limiting & DDoS Protection](#rate-limiting--ddos-protection)
4. [Data Encryption & Privacy](#data-encryption--privacy)
5. [Audit Logging](#audit-logging)
6. [GDPR & KVKK Compliance](#gdpr--kvkk-compliance)
7. [Security Best Practices](#security-best-practices)
8. [Incident Response](#incident-response)

---

## 1. Security Architecture

### Multi-Layer Defense Strategy

```
┌─────────────────────────────────────────┐
│   1. DDoS Protection (IP-based)         │
├─────────────────────────────────────────┤
│   2. Adaptive Throttling (Attack Mode)  │
├─────────────────────────────────────────┤
│   3. Audit Logging (All Requests)       │
├─────────────────────────────────────────┤
│   4. Authentication (JWT/API Key)       │
├─────────────────────────────────────────┤
│   5. Authorization (RBAC)               │
├─────────────────────────────────────────┤
│   6. Rate Limiting (Role-based)         │
├─────────────────────────────────────────┤
│   7. Concurrent Limits                  │
├─────────────────────────────────────────┤
│   8. GDPR/KVKK Compliance               │
├─────────────────────────────────────────┤
│   9. PII Masking & Encryption           │
├─────────────────────────────────────────┤
│   10. Application Logic                 │
└─────────────────────────────────────────┘
```

### Security Modules

- **`middleware/api-auth.js`** - JWT and API key authentication
- **`middleware/rate-limiter.js`** - Token bucket rate limiting
- **`middleware/encryption.js`** - AES-256-GCM encryption & PII detection
- **`middleware/audit-logger.js`** - Tamper-proof audit trails
- **`middleware/gdpr-kvkk-compliance.js`** - Data subject rights

---

## 2. Authentication & Authorization

### Authentication Methods

#### 1. JWT (JSON Web Token)

**For**: Web applications, mobile apps

```javascript
// Login example
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "********"
}

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "USER"
  }
}

// Using the token
GET /api/smart-cities/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 2. API Keys

**For**: Server-to-server integration, scripts, CI/CD

```javascript
// Generate API key
POST /api/auth/api-keys
Authorization: Bearer <your-jwt-token>
{
  "name": "Production Server",
  "permissions": ["smart-cities:*", "insan-iq:read"]
}

// Response
{
  "apiKey": "lyd_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "createdAt": "2025-01-07T12:00:00Z",
  "permissions": ["smart-cities:*", "insan-iq:read"]
}

// Using API key
GET /api/lydian-iq/documents
X-LyDian-API-Key: lyd_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Role-Based Access Control (RBAC)

| Role | Requests/Hour | Concurrent | AI Credits | Use Case |
|------|---------------|------------|------------|----------|
| **GUEST** | 100 | 5 | 1x | Anonymous testing |
| **USER** | 1,000 | 10 | 10x | Free tier |
| **DEVELOPER** | 5,000 | 20 | 50x | Development & testing |
| **PREMIUM** | 50,000 | 50 | 500x | Production apps |
| **ENTERPRISE** | 500,000 | 100 | 5000x | Enterprise apps |
| **ADMIN** | 1,000,000 | 200 | Unlimited | Platform administration |

### Permission System

```javascript
// Require specific role
app.get('/api/admin/users',
  requireRole('ADMIN'),
  (req, res) => { /* ... */ }
);

// Require specific permission
app.post('/api/smart-cities/device',
  requirePermission('smart-cities:write'),
  (req, res) => { /* ... */ }
);

// Permissions format: <module>:<action>
// Examples:
//   smart-cities:read
//   smart-cities:write
//   smart-cities:*
//   insan-iq:empathy
//   lydian-iq:compliance
```

---

## 3. Rate Limiting & DDoS Protection

### Token Bucket Algorithm

LyDian uses **token bucket rate limiting** for smooth traffic handling:

- Each user/IP gets a bucket of tokens
- Tokens refill at a constant rate
- Each request consumes 1 token
- When tokens exhausted = rate limit

### Rate Limits by Role

```javascript
// Automatic role-based limiting
GET /api/smart-cities/analytics

// Response headers
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 2025-01-07T13:00:00Z
```

### AI Cost-Based Limiting

AI operations consume different amounts of "credits":

| Operation | Cost (Credits) |
|-----------|----------------|
| Smart Cities Query | 1 |
| Smart Cities Analytics | 5 |
| Smart Cities Prediction | 10 |
| İnsan IQ Emotion Detection | 2 |
| İnsan IQ Empathy Response | 3 |
| İnsan IQ Conversation | 5 |
| LyDian IQ Document Analysis | 10 |
| LyDian IQ Contract Review | 20 |
| LyDian IQ Compliance Check | 15 |

```javascript
// AI request example
POST /api/insan-iq/empathy
X-LyDian-API-Key: lyd_live_...

// Response headers
X-AI-Cost: 3
X-AI-Credits-Remaining: 4997
X-AI-Credits-Reset: 2025-01-07T13:00:00Z
```

### DDoS Protection

**IP-based protection** with automatic banning:

- **Threshold**: 1,000 requests/minute from single IP
- **Action**: Temporary 1-hour ban
- **Response**: HTTP 403 with ban expiration

```json
{
  "error": "IP banned",
  "message": "Your IP has been temporarily banned due to suspicious activity. Ban expires in 3542s.",
  "code": "IP_BANNED",
  "banExpiresIn": 3542
}
```

### Adaptive Throttling

During detected attacks:
- System enters "attack mode"
- GUEST requests throttled more aggressively
- Authenticated users get priority
- Returns HTTP 503 during peak attack

---

## 4. Data Encryption & Privacy

### Encryption at Rest

**AES-256-GCM** encryption for sensitive data:

```javascript
const { encrypt, decrypt } = require('./middleware/encryption');

// Encrypt sensitive user data
const encrypted = encrypt('user@example.com', 'user-data');
// Store: encrypted.ciphertext, encrypted.keyId

// Decrypt when needed
const decrypted = decrypt(encrypted);
// Returns: "user@example.com"
```

### Field-Level Encryption

```javascript
const { encryptFields, decryptFields } = require('./middleware/encryption');

const user = {
  id: 'user-123',
  email: 'user@example.com',
  ssn: '123-45-6789',
  address: '123 Main St'
};

// Encrypt sensitive fields
const encrypted = encryptFields(user, ['email', 'ssn', 'address']);

// Store in database...

// Decrypt when authorized
const decrypted = decryptFields(encrypted, ['email', 'ssn', 'address']);
```

### PII Detection & Masking

Automatic detection and masking of:
- Email addresses
- Phone numbers
- Credit card numbers
- SSN / TC Kimlik numbers
- IBAN
- IP addresses

```javascript
const { detectPII, maskPII } = require('./middleware/encryption');

const text = "Contact me at john@example.com or call 555-1234";

// Detect PII
const detected = detectPII(text);
// [{ type: 'email', count: 1, samples: ['john@example.com'] }]

// Mask PII
const masked = maskPII(text);
// "Contact me at jo***@example.com or call ****1234"
```

### Data Anonymization

**Irreversible** anonymization for GDPR Article 17 (Right to be Forgotten):

```javascript
const { anonymize } = require('./middleware/encryption');

const userData = {
  email: 'user@example.com',
  phone: '+1-555-1234',
  ssn: '123-45-6789',
  name: 'John Doe'
};

const anonymized = anonymize(userData);
// {
//   email: '7b52009b64fd',
//   phone: '3f786850e387',
//   ssn: 'a5b1cef8a2f9',
//   name: '098f6bcd4621',
//   _anonymized: true,
//   _anonymizedAt: '2025-01-07T12:00:00Z'
// }
```

---

## 5. Audit Logging

### Comprehensive Audit Trail

All API requests automatically logged with:
- User identity
- IP address & User-Agent
- Request method, path, query parameters
- Response status code
- Duration
- Cryptographic signature (production)

### Event Types

| Category | Event Types |
|----------|-------------|
| **Authentication** | login, logout, failed, token_refresh, password_change |
| **Authorization** | denied, role_change |
| **Data Access** | read, create, update, delete, export |
| **Privacy** | consent_given, consent_revoked, data_anonymized, data_deleted, right_to_access |
| **Security** | rate_limit, ddos_detected, intrusion_attempt, key_rotated |
| **AI Operations** | query, training, model_updated |
| **System** | config_change, maintenance, error |

### Manual Audit Logging

```javascript
const { getAuditLogger, EVENT_TYPES, SEVERITY } = require('./middleware/audit-logger');

const logger = getAuditLogger();

// Log critical security event
await logger.log(EVENT_TYPES.SECURITY_INTRUSION_ATTEMPT, {
  attemptedPath: '/api/admin/users',
  reason: 'Missing authentication'
}, {
  userId: req.user?.id || 'anonymous',
  ip: req.ip,
  severity: SEVERITY.CRITICAL
});
```

### Querying Audit Logs

```javascript
// Query logs
const logs = await logger.query({
  userId: 'user-123',
  type: EVENT_TYPES.PRIVACY_DATA_DELETED,
  startDate: '2025-01-01',
  endDate: '2025-01-07',
  severity: SEVERITY.WARNING
});

// Verify log integrity (production only)
for (const log of logs) {
  const isValid = logger.verifySignature(log);
  console.log(`Log ${log.id}: ${isValid ? 'VALID' : 'TAMPERED'}`);
}
```

---

## 6. GDPR & KVKK Compliance

### Data Subject Rights

LyDian supports all GDPR Article 15-22 and KVKK Article 11 rights:

#### Right to Access (GDPR Art. 15 / KVKK Art. 11)

```javascript
POST /api/privacy/data-subject-request
Authorization: Bearer <user-jwt>
{
  "right": "access"
}

// Returns complete user data export
{
  "success": true,
  "right": "access",
  "result": {
    "profile": { /* user profile data */ },
    "consents": { /* consent records */ },
    "aiInteractions": [ /* AI usage history */ ],
    "auditLogs": [ /* all user actions */ ],
    "exportedAt": "2025-01-07T12:00:00Z"
  }
}
```

#### Right to Data Portability (GDPR Art. 20 / KVKK Art. 11)

```javascript
POST /api/privacy/data-subject-request
{
  "right": "portability",
  "format": "json" // or "csv", "xml"
}
```

#### Right to Erasure / Be Forgotten (GDPR Art. 17 / KVKK Art. 11)

```javascript
POST /api/privacy/data-subject-request
{
  "right": "erasure",
  "reason": "No longer using service"
}

// All personal data anonymized/deleted within 30 days
{
  "success": true,
  "anonymizedRecords": {
    "originalUserId": "user-123",
    "anonymizedId": "anon-a1b2c3d4",
    "anonymizedAt": "2025-01-07T12:00:00Z"
  }
}
```

### Consent Management

```javascript
const { getComplianceManager, PROCESSING_PURPOSES } = require('./middleware/gdpr-kvkk-compliance');

const manager = getComplianceManager();

// Track consent
await manager.trackConsent('user-123', [
  PROCESSING_PURPOSES.SERVICE_DELIVERY,
  PROCESSING_PURPOSES.ANALYTICS
], {
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  consentVersion: '2.0'
});

// Check consent
const hasConsent = manager.hasConsent('user-123', PROCESSING_PURPOSES.MARKETING);
if (!hasConsent) {
  return res.status(403).json({
    error: 'Consent required',
    purpose: 'MARKETING'
  });
}

// Withdraw consent
await manager.withdrawConsent('user-123', [PROCESSING_PURPOSES.MARKETING]);
```

### Lawful Basis Tracking

All data processing must have a lawful basis:

| Lawful Basis | GDPR Art. | Example |
|--------------|-----------|---------|
| **Consent** | 6(1)(a) | Marketing emails |
| **Contract** | 6(1)(b) | Service delivery |
| **Legal Obligation** | 6(1)(c) | Tax records |
| **Vital Interests** | 6(1)(d) | Emergency medical data |
| **Public Task** | 6(1)(e) | Government services |
| **Legitimate Interests** | 6(1)(f) | Fraud prevention |

---

## 7. Security Best Practices

### For Developers

✅ **DO**:
- Use HTTPS everywhere (enforced in production)
- Rotate API keys every 90 days
- Store encryption keys in secure vault (AWS KMS, Azure Key Vault, HashiCorp Vault)
- Enable audit logging in production
- Implement least privilege principle
- Use environment variables for secrets
- Validate all user input
- Sanitize output to prevent XSS
- Use prepared statements to prevent SQL injection

❌ **DON'T**:
- Hard-code API keys or passwords
- Log sensitive data (PII masking is automatic)
- Disable security middleware
- Expose internal error details to users
- Trust client-side validation alone
- Store passwords in plain text
- Use outdated dependencies

### Environment Variables

Required production environment variables:

```bash
# Security
JWT_SECRET=<random-256-bit-key>
ENCRYPTION_KEY_DEFAULT=<random-256-bit-key>
AUDIT_SIGNING_KEY=<random-256-bit-key>

# API Keys (if using external services)
ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
GROQ_API_KEY=<your-key>

# Database (encrypted connections)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Optional
NODE_ENV=production
PORT=3100
```

### Security Headers

Automatically set by `securityHeaders` middleware:

- `Content-Security-Policy`: Prevents XSS attacks
- `Strict-Transport-Security`: Enforces HTTPS
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: Browser XSS protection
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Restricts browser features

---

## 8. Incident Response

### Security Incident Levels

| Level | Response Time | Action |
|-------|---------------|--------|
| **EMERGENCY** (7) | Immediate | Page on-call team, activate incident response |
| **ALERT** (6) | < 15 minutes | Notify security team, investigate immediately |
| **CRITICAL** (5) | < 1 hour | Security team investigation, potential containment |
| **ERROR** (4) | < 4 hours | Log review, automated alerts |
| **WARNING** (3) | < 24 hours | Monitor trends, routine review |

### Automatic Alerts

Critical events trigger automatic alerts:
- Multiple failed authentication attempts
- DDoS attack detected
- Unusual data access patterns
- API key compromise suspected
- Encryption key rotation needed

### Monitoring Dashboard

```javascript
GET /api/security/dashboard

{
  "rateLimit": {
    "blocked": 42,
    "near_limit": 15
  },
  "ddos": {
    "bannedIPs": 3,
    "attackMode": false
  },
  "audit": {
    "critical_events_24h": 2,
    "failed_auth_1h": 8
  },
  "compliance": {
    "data_subject_requests_pending": 1,
    "consent_withdrawals_24h": 0
  }
}
```

### Contact

- **Security Issues**: security@lydian.com
- **Data Protection Officer**: dpo@lydian.com
- **General Support**: support@lydian.com

---

## 📚 Additional Resources

- [API Reference](/docs/en/api-reference/)
- [GDPR Compliance Guide](/docs/en/compliance/gdpr.md)
- [KVKK Compliance Guide](/docs/en/compliance/kvkk.md)
- [Security Changelog](/SECURITY-CHANGELOG.md)

---

**Document Classification**: Public
**Last Security Audit**: 2025-01-07
**Next Audit**: 2025-04-07 (Quarterly)
