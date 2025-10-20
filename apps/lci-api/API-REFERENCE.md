# LCI API Reference
**Version**: 1.0.0
**Base URL**: `http://localhost:3201` (dev) | `https://api.lci.lydian.ai` (prod)
**Authentication**: JWT Bearer Token

---

## Table of Contents

1. [Authentication](#authentication)
2. [Complaints](#complaints)
3. [Moderation](#moderation)
4. [Brands](#brands)
5. [Legal (KVKK/GDPR)](#legal-kvkkgdpr)
6. [Evidence](#evidence)
7. [Health](#health)

---

## Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "locale": "tr"
}
```

**Response 201**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "kycLevel": "LEVEL_1",
    "status": "ACTIVE"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Validation**:
- Email: Valid email format
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- Locale: `tr` or `en`

---

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error 401**: Invalid credentials

---

### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}
```

**Response 200**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "USER",
  "kycLevel": "LEVEL_1",
  "status": "ACTIVE",
  "locale": "tr",
  "createdAt": "2025-10-15T10:00:00Z"
}
```

---

### Logout
```http
POST /auth/logout
Authorization: Bearer {token}
```

**Response 200**:
```json
{
  "message": "Logged out successfully"
}
```

---

## Complaints

### Create Complaint
```http
POST /complaints
Authorization: Bearer {token}
Content-Type: application/json

{
  "brandId": "uuid",
  "title": "Ürün hasarlı geldi",
  "body": "Sipariş ettiğim ürün hasarlı olarak teslim edildi.",
  "severity": "MEDIUM",
  "productId": "uuid" // Optional
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "brandId": "uuid",
  "title": "Ürün hasarlı geldi",
  "body": "Sipariş ettiğim ürün hasarlı olarak teslim edildi.",
  "severity": "MEDIUM",
  "state": "DRAFT",
  "publishedAt": null,
  "createdAt": "2025-10-15T10:00:00Z"
}
```

**Severity Options**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
**Initial State**: `DRAFT`

---

### Get Complaint
```http
GET /complaints/{id}
Authorization: Bearer {token}
```

**Response 200**:
```json
{
  "id": "uuid",
  "title": "Ürün hasarlı geldi",
  "body": "...",
  "severity": "MEDIUM",
  "state": "OPEN",
  "publishedAt": "2025-10-15T11:00:00Z",
  "brand": {
    "id": "uuid",
    "name": "Turkcell",
    "slug": "turkcell"
  },
  "user": {
    "id": "uuid",
    "email": "[REDACTED]" // Privacy: only owner sees full email
  },
  "responses": [
    {
      "id": "uuid",
      "message": "Şikayetiniz için teşekkür ederiz...",
      "createdAt": "2025-10-15T12:00:00Z"
    }
  ]
}
```

---

### Update Complaint
```http
PATCH /complaints/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated title",
  "body": "Updated body",
  "severity": "HIGH"
}
```

**Response 200**: Updated complaint object

**Rules**:
- Only owner can update
- Can only update DRAFT state complaints
- Cannot update published complaints

---

### Transition State
```http
POST /complaints/{id}/transition
Authorization: Bearer {token}
Content-Type: application/json

{
  "newState": "OPEN",
  "reason": "Publishing complaint" // Optional
}
```

**Response 200**:
```json
{
  "id": "uuid",
  "state": "OPEN",
  "publishedAt": "2025-10-15T11:00:00Z"
}
```

**Valid Transitions**:
- USER: `DRAFT → OPEN`
- BRAND_AGENT: `OPEN → IN_PROGRESS`, `IN_PROGRESS → RESOLVED`
- MODERATOR/ADMIN: All transitions + `ESCALATED`, `REJECTED`

---

### List Complaints
```http
GET /complaints?state=OPEN&severity=HIGH&limit=20&offset=0
Authorization: Bearer {token}
```

**Query Parameters**:
- `state`: Filter by state
- `severity`: Filter by severity
- `brandId`: Filter by brand
- `limit`: Results per page (default: 20, max: 100)
- `offset`: Pagination offset

**Response 200**:
```json
[
  {
    "id": "uuid",
    "title": "...",
    "severity": "HIGH",
    "state": "OPEN",
    "publishedAt": "2025-10-15T10:00:00Z"
  }
]
```

---

### Delete Complaint
```http
DELETE /complaints/{id}
Authorization: Bearer {token}
```

**Response 200**:
```json
{
  "message": "Complaint deleted successfully"
}
```

**Rules**:
- Only owner can delete
- Can only delete DRAFT complaints
- Cannot delete published complaints

---

## Moderation

### Moderate Text (Manual)
```http
POST /moderation/moderate-text
Authorization: Bearer {token}
Content-Type: application/json
Roles: MODERATOR, ADMIN

{
  "text": "TC kimlik numaram 12345678901 olan kişiye bilgi vermişler"
}
```

**Response 200**:
```json
{
  "original": "TC kimlik numaram 12345678901 olan kişiye bilgi vermişler",
  "moderated": "TC kimlik numaram TC****01 olan kişiye bilgi vermişler",
  "flags": {
    "hasPII": true,
    "piiTypes": ["turkish_id"],
    "maskCount": 1
  }
}
```

**PII Types Detected**:
- `turkish_id`: Turkish ID numbers (11 digits)
- `email`: Email addresses
- `phone_number`: Turkish phone numbers
- `iban`: IBAN numbers
- `credit_card`: Credit card numbers (partial detection)
- `address`: Street addresses with numbers
- `name_with_surname`: Full names (basic detection)
- `date_of_birth`: Dates in DD/MM/YYYY format
- `passport`: Turkish passport numbers

---

## Brands

### Create Brand Response
```http
POST /brands/responses
Authorization: Bearer {token}
Content-Type: application/json
Roles: BRAND_AGENT, MODERATOR, ADMIN
Rate Limit: 10/minute

{
  "complaintId": "uuid",
  "message": "Sayın müşterimiz, şikayetiniz için teşekkür ederiz. Konuyu inceliyoruz..."
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "complaintId": "uuid",
  "brandId": "uuid",
  "message": "...",
  "respondedBy": "uuid",
  "createdAt": "2025-10-15T12:00:00Z"
}
```

**Validation**:
- Message: Min 20 chars, max 5000 chars
- Can only respond to OPEN/IN_PROGRESS complaints

---

### Get Brand Dashboard
```http
GET /brands/{brandId}/dashboard
Authorization: Bearer {token}
Roles: BRAND_AGENT, MODERATOR, ADMIN
```

**Response 200**:
```json
{
  "brand": {
    "id": "uuid",
    "name": "Turkcell",
    "slug": "turkcell"
  },
  "statistics": {
    "total": 127,
    "open": 30,
    "resolved": 75,
    "byState": {
      "DRAFT": 0,
      "OPEN": 30,
      "IN_PROGRESS": 15,
      "RESOLVED": 75,
      "ESCALATED": 5,
      "REJECTED": 2
    },
    "bySeverity": {
      "LOW": 20,
      "MEDIUM": 50,
      "HIGH": 45,
      "CRITICAL": 12
    }
  },
  "sla": {
    "breaches": 12,
    "compliance": 90.6,
    "avgResponseTimeHours": 18.5,
    "avgResolutionTimeHours": 52.3
  },
  "urgentComplaints": [
    {
      "id": "uuid",
      "title": "...",
      "severity": "CRITICAL",
      "publishedAt": "2025-10-14T08:00:00Z",
      "sla": {
        "overallStatus": "RED",
        "firstResponse": {
          "breached": true,
          "elapsedHours": 26,
          "targetHours": 4,
          "remainingHours": 0
        }
      }
    }
  ]
}
```

---

### List Brand Complaints
```http
GET /brands/{brandId}/complaints
Authorization: Bearer {token}
Roles: BRAND_AGENT, MODERATOR, ADMIN
```

**Response 200**: Array of complaints with SLA metrics

---

### Get Complaint Responses
```http
GET /brands/complaints/{complaintId}/responses
Authorization: Bearer {token}
Roles: BRAND_AGENT, MODERATOR, ADMIN
```

**Response 200**:
```json
[
  {
    "id": "uuid",
    "message": "...",
    "respondedBy": "uuid",
    "createdAt": "2025-10-15T12:00:00Z"
  }
]
```

---

## Legal (KVKK/GDPR)

### Export User Data
```http
GET /legal/export
Authorization: Bearer {token}
Rate Limit: 3/hour
```

**Response 200**:
```json
{
  "metadata": {
    "exportDate": "2025-10-15T14:00:00Z",
    "userId": "uuid",
    "dataController": "Lydian Complaint Intelligence (LCI)",
    "legalBasis": "KVKK Madde 11 - Veri Taşınabilirliği Hakkı"
  },
  "personalData": {
    "email": "user@example.com",
    "role": "USER",
    "kycLevel": "LEVEL_1",
    "status": "ACTIVE",
    "locale": "tr",
    "createdAt": "2025-09-01T10:00:00Z",
    "updatedAt": "2025-10-15T14:00:00Z"
  },
  "complaints": [...],
  "statistics": {
    "totalComplaints": 5,
    "complaintsByState": {...}
  }
}
```

---

### Request Data Erasure
```http
POST /legal/erase
Authorization: Bearer {token}
Content-Type: application/json
Rate Limit: 2/day

{
  "reason": "Artık platformu kullanmayacağım" // Optional
}
```

**Response 200**:
```json
{
  "requestId": "uuid",
  "status": "PENDING",
  "message": "Silme talebiniz alınmıştır. İşleminiz 30 gün içinde tamamlanacaktır.",
  "processingDeadline": "2025-11-14T14:00:00Z"
}
```

**Rules**:
- Cannot erase if active complaints exist (OPEN, IN_PROGRESS, ESCALATED)
- 30-day processing window
- User can cancel before processing

---

### Cancel Erasure Request
```http
DELETE /legal/erase/{requestId}
Authorization: Bearer {token}
Rate Limit: 5/hour
```

**Response 200**:
```json
{
  "status": "CANCELLED",
  "message": "Silme talebiniz iptal edilmiştir"
}
```

---

### Get Erasure Status
```http
GET /legal/erase/status
Authorization: Bearer {token}
Rate Limit: 10/hour
```

**Response 200**:
```json
{
  "hasActiveRequest": true,
  "requestId": "uuid",
  "status": "PENDING",
  "createdAt": "2025-10-15T14:00:00Z",
  "reason": "..."
}
```

---

### Process Erasure (Admin Only)
```http
POST /legal/erase/{requestId}/process
Authorization: Bearer {token}
Roles: ADMIN
Rate Limit: 20/hour
```

**Response 200**:
```json
{
  "status": "COMPLETED",
  "message": "Verileriniz başarıyla anonimleştirilmiştir."
}
```

---

### List Pending Erasures (Admin Only)
```http
GET /legal/erase/pending
Authorization: Bearer {token}
Roles: ADMIN
Rate Limit: 30/minute
```

**Response 200**: Array of pending erasure requests

---

## Evidence

### Upload Evidence
```http
POST /evidence/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
Rate Limit: 10/minute

Form Data:
- complaintId: uuid
- file: File (PDF, JPG, PNG, HEIC)
- description: "Receipt showing purchase" (optional)
```

**Response 201**:
```json
{
  "id": "uuid",
  "complaintId": "uuid",
  "filename": "uuid-generated-name.pdf",
  "mimeType": "application/pdf",
  "size": 102400,
  "scanStatus": "CLEAN",
  "description": "Receipt showing purchase",
  "createdAt": "2025-10-15T15:00:00Z"
}
```

**Validation**:
- Max file size: 10 MB
- Allowed types: `application/pdf`, `image/jpeg`, `image/png`, `image/heic`
- Max 10 files per complaint
- Can only upload to DRAFT/OPEN complaints

---

### List Evidence
```http
GET /evidence?complaintId={uuid}
Authorization: Bearer {token}
```

**Response 200**: Array of evidence objects

---

### Delete Evidence
```http
DELETE /evidence/{id}
Authorization: Bearer {token}
```

**Response 200**:
```json
{
  "message": "Evidence deleted successfully"
}
```

**Rules**:
- Only complaint owner can delete
- Can only delete from DRAFT/OPEN complaints

---

## Health

### Health Check
```http
GET /health
```

**Response 200**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T16:00:00Z",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email format is invalid"
    }
  ]
}
```

**Common Status Codes**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/register | 5 | 1 hour |
| POST /auth/login | 10 | 15 minutes |
| POST /complaints | 20 | 1 hour |
| POST /brands/responses | 10 | 1 minute |
| POST /evidence/upload | 10 | 1 minute |
| GET /legal/export | 3 | 1 hour |
| POST /legal/erase | 2 | 1 day |
| Default | 100 | 1 minute |

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697380800
```

---

## Authentication

All protected endpoints require JWT Bearer token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Expiry**: 24 hours
**Refresh**: Login again to get new token

---

## CORS

Allowed origins:
- `http://localhost:3200` (lci-web dev)
- `https://lci.lydian.ai` (production)

---

## Webhooks (Future)

Not yet implemented. Planned for Phase 6.

---

## Support

- **Docs**: https://docs.lci.lydian.ai
- **Email**: support@lydian.ai
- **GitHub**: https://github.com/lydian/lci

---

**Last Updated**: 2025-10-15
**API Version**: 1.0.0
