# 📡 AILYDIAN API Endpoints Documentation

**Version**: 1.0.0
**Last Updated**: January 2, 2026
**Base URL**: `http://localhost:3100` (development)
**Production URL**: `https://www.ailydian.com`

---

## 🏗️ Architecture Overview

AILYDIAN uses a microservices architecture with 6 integrated services:

```
Main Server (Port 3100)
├── Monitoring Service (3101) → /api/monitoring
├── Auth Service (3102) → /api/auth
├── Azure AI Service (3103) → /api/azure-ai
├── AI Chat Service (3104) → /api/ai-chat
├── File Storage Service (3105) → /api/files
└── Payment Service (3106) → /api/payments
```

---

## 📋 Table of Contents

1. [Global Endpoints](#global-endpoints)
2. [Monitoring Service](#monitoring-service)
3. [Auth Service](#auth-service)
4. [Azure AI Service](#azure-ai-service)
5. [AI Chat Service](#ai-chat-service)
6. [File Storage Service](#file-storage-service)
7. [Payment Service](#payment-service)
8. [Error Responses](#error-responses)
9. [Rate Limiting](#rate-limiting)

---

## 🌐 Global Endpoints

### Service Discovery

Get information about all available services.

```http
GET /api/services
```

**Response**:
```json
{
  "success": true,
  "timestamp": "2026-01-02T12:00:00.000Z",
  "services": [
    {
      "name": "Monitoring Service",
      "path": "/api/monitoring",
      "port": 3101,
      "description": "System health monitoring and metrics",
      "endpoints": ["GET /api/monitoring/health", ...]
    },
    ...
  ],
  "totalServices": 6
}
```

---

### Global Health Check

Aggregate health status from all services.

```http
GET /api/services/health
```

**Response**:
```json
{
  "timestamp": "2026-01-02T12:00:00.000Z",
  "overall": "OK",
  "services": {
    "monitoring": {
      "status": "OK",
      "stats": { ... }
    },
    "auth": {
      "status": "OK",
      "stats": { ... }
    },
    ...
  }
}
```

**Status Codes**:
- `200 OK` - All services healthy
- `503 Service Unavailable` - One or more services degraded

---

## 📊 Monitoring Service

**Base Path**: `/api/monitoring`
**Port** (standalone): 3101

### Get Service Info

```http
GET /api/monitoring/
```

**Response**:
```json
{
  "service": "monitoring-service",
  "version": "1.0.0",
  "uptime": 123456,
  "endpoints": {
    "health": "/health",
    "metrics": "/metrics",
    "uptime": "/uptime"
  }
}
```

---

### Health Check

```http
GET /api/monitoring/health
```

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2026-01-02T12:00:00.000Z",
  "uptime": 123456,
  "memoryUsage": {
    "heapUsed": 50000000,
    "heapTotal": 100000000,
    "external": 1000000
  }
}
```

---

### System Metrics

```http
GET /api/monitoring/metrics
```

**Response**:
```json
{
  "cpu": {
    "usage": 25.5,
    "loadAverage": [1.2, 1.5, 1.8]
  },
  "memory": {
    "total": 16000000000,
    "free": 8000000000,
    "used": 8000000000,
    "usagePercent": 50.0
  },
  "uptime": 123456,
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

---

### Uptime

```http
GET /api/monitoring/uptime
```

**Response**:
```json
{
  "uptime": 123456,
  "uptimeFormatted": "1 day, 10 hours, 17 minutes",
  "startTime": "2026-01-01T01:43:00.000Z"
}
```

---

## 🔐 Auth Service

**Base Path**: `/api/auth`
**Port** (standalone): 3102

### Get Service Info

```http
GET /api/auth/
```

---

### User Registration

```http
POST /api/auth/register
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "user"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2026-01-02T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here"
}
```

---

### User Login

```http
POST /api/auth/login
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "expiresIn": "24h"
}
```

---

### Refresh Token

```http
POST /api/auth/refresh
```

**Request Body**:
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response**:
```json
{
  "success": true,
  "token": "new_access_token_here",
  "expiresIn": "24h"
}
```

---

### Logout

```http
POST /api/auth/logout
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Verify Token

```http
GET /api/auth/verify
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

### Get User Profile

```http
GET /api/auth/profile
```

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2026-01-02T12:00:00.000Z",
    "lastLogin": "2026-01-02T12:00:00.000Z"
  }
}
```

---

## 🤖 Azure AI Service

**Base Path**: `/api/azure-ai`
**Port** (standalone): 3103

### Get Service Info

```http
GET /api/azure-ai/
```

---

### AI Chat Completion

```http
POST /api/azure-ai/chat
```

**Request Body**:
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "What is AI?"
    }
  ],
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response**:
```json
{
  "success": true,
  "response": "AI (Artificial Intelligence) refers to...",
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  },
  "model": "gpt-4",
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

---

### Text Completion

```http
POST /api/azure-ai/completion
```

**Request Body**:
```json
{
  "prompt": "Complete this text: Once upon a time",
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 500
}
```

**Response**:
```json
{
  "success": true,
  "completion": "there was a brave knight...",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 100,
    "total_tokens": 110
  }
}
```

---

### Generate Embedding

```http
POST /api/azure-ai/embedding
```

**Request Body**:
```json
{
  "text": "This is a sample text for embedding generation",
  "model": "text-embedding-3-large"
}
```

**Response**:
```json
{
  "success": true,
  "embedding": [0.123, 0.456, ...],
  "dimensions": 1536,
  "model": "text-embedding-3-large"
}
```

---

## 💬 AI Chat Service

**Base Path**: `/api/ai-chat`
**Port** (standalone): 3104

### Get Service Info

```http
GET /api/ai-chat/
```

---

### Send Chat Message

```http
POST /api/ai-chat/chat
```

**Request Body**:
```json
{
  "message": "Hello, how are you?",
  "conversationId": "conv_123",
  "userId": "user_123",
  "model": "gpt-4",
  "temperature": 0.7
}
```

**Response**:
```json
{
  "success": true,
  "response": {
    "text": "Hello! I'm doing well, thank you for asking. How can I help you today?",
    "conversationId": "conv_123",
    "messageId": "msg_456",
    "timestamp": "2026-01-02T12:00:00.000Z"
  },
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 25,
    "total_tokens": 40
  }
}
```

---

### Get Conversations

```http
GET /api/ai-chat/conversations?userId=user_123&page=1&limit=20
```

**Response**:
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv_123",
      "userId": "user_123",
      "title": "General Chat",
      "lastMessage": "Hello! I'm doing well...",
      "messageCount": 10,
      "createdAt": "2026-01-02T12:00:00.000Z",
      "updatedAt": "2026-01-02T12:30:00.000Z"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### Get Conversation Details

```http
GET /api/ai-chat/conversations/:id
```

**Response**:
```json
{
  "success": true,
  "conversation": {
    "id": "conv_123",
    "userId": "user_123",
    "title": "General Chat",
    "messages": [
      {
        "id": "msg_1",
        "role": "user",
        "content": "Hello",
        "timestamp": "2026-01-02T12:00:00.000Z"
      },
      {
        "id": "msg_2",
        "role": "assistant",
        "content": "Hello! How can I help you?",
        "timestamp": "2026-01-02T12:00:05.000Z"
      },
      ...
    ],
    "createdAt": "2026-01-02T12:00:00.000Z",
    "updatedAt": "2026-01-02T12:30:00.000Z"
  }
}
```

---

### Delete Conversation

```http
DELETE /api/ai-chat/conversations/:id
```

**Response**:
```json
{
  "success": true,
  "message": "Conversation deleted successfully",
  "conversationId": "conv_123"
}
```

---

## 📁 File Storage Service

**Base Path**: `/api/files`
**Port** (standalone): 3105

### Get Service Info

```http
GET /api/files/
```

---

### Upload Single File

```http
POST /api/files/upload
Content-Type: multipart/form-data
```

**Request Body** (form-data):
```
file: <binary file data>
description: "Profile picture"
tags: "profile,avatar"
```

**Response**:
```json
{
  "success": true,
  "file": {
    "id": "file_123",
    "originalName": "avatar.jpg",
    "filename": "1704196800000-avatar.jpg",
    "mimetype": "image/jpeg",
    "size": 102400,
    "url": "https://storage.ailydian.com/file_123",
    "deleted": false,
    "metadata": {
      "description": "Profile picture",
      "tags": "profile,avatar"
    },
    "uploadedAt": "2026-01-02T12:00:00.000Z"
  }
}
```

---

### Upload Multiple Files

```http
POST /api/files/upload/multiple
Content-Type: multipart/form-data
```

**Request Body** (form-data):
```
files: <file1>
files: <file2>
files: <file3>
```

**Response**:
```json
{
  "success": true,
  "files": [
    {
      "id": "file_123",
      "originalName": "image1.jpg",
      "size": 102400,
      ...
    },
    {
      "id": "file_124",
      "originalName": "image2.jpg",
      "size": 204800,
      ...
    }
  ],
  "count": 2
}
```

---

### Get File Metadata

```http
GET /api/files/:id/metadata
```

**Response**:
```json
{
  "success": true,
  "metadata": {
    "id": "file_123",
    "originalName": "avatar.jpg",
    "filename": "1704196800000-avatar.jpg",
    "mimetype": "image/jpeg",
    "size": 102400,
    "uploadedAt": "2026-01-02T12:00:00.000Z",
    "deleted": false,
    "metadata": {
      "description": "Profile picture",
      "tags": "profile,avatar"
    }
  }
}
```

---

### Download File

```http
GET /api/files/:id
```

**Response**: Binary file data or redirect to Azure Blob Storage URL

---

### List Files

```http
GET /api/files?page=1&limit=20&type=image
```

**Query Parameters**:
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `type` - Filter by file type (image, pdf, video, etc.)

**Response**:
```json
{
  "success": true,
  "files": [
    {
      "id": "file_123",
      "originalName": "avatar.jpg",
      "mimetype": "image/jpeg",
      "size": 102400,
      "uploadedAt": "2026-01-02T12:00:00.000Z"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### Delete File (Soft Delete)

```http
DELETE /api/files/:id
```

**Response**:
```json
{
  "success": true,
  "message": "File deleted successfully",
  "fileId": "file_123"
}
```

---

### Generate Shareable Link

```http
POST /api/files/:id/share
```

**Request Body**:
```json
{
  "expiresIn": 3600
}
```

**Response**:
```json
{
  "success": true,
  "shareableUrl": "https://www.ailydian.com/api/files/share/abc123token",
  "expiresIn": 3600,
  "expiresAt": "2026-01-02T13:00:00.000Z"
}
```

---

### Access Shared File

```http
GET /api/files/share/:token
```

**Response**: Binary file data or redirect to Azure Blob Storage URL

---

## 💳 Payment Service

**Base Path**: `/api/payments`
**Port** (standalone): 3106

### Get Service Info

```http
GET /api/payments/
```

---

### Create Payment Intent

```http
POST /api/payments/create-payment-intent
```

**Request Body**:
```json
{
  "amount": 99.99,
  "currency": "usd",
  "metadata": {
    "orderId": "order_123",
    "productName": "Premium Plan"
  }
}
```

**Response**:
```json
{
  "success": true,
  "paymentIntent": {
    "id": "pi_123",
    "amount": 9999,
    "currency": "usd",
    "status": "requires_payment_method",
    "clientSecret": "pi_123_secret_abc",
    "created": "2026-01-02T12:00:00.000Z",
    "metadata": {
      "orderId": "order_123",
      "productName": "Premium Plan"
    }
  }
}
```

---

### Confirm Payment

```http
POST /api/payments/confirm-payment
```

**Request Body**:
```json
{
  "paymentIntentId": "pi_123",
  "paymentMethodId": "pm_123"
}
```

**Response**:
```json
{
  "success": true,
  "paymentIntent": {
    "id": "pi_123",
    "status": "succeeded",
    "amount": 9999,
    "currency": "usd",
    "confirmed": true
  }
}
```

---

### Create Customer

```http
POST /api/payments/customers/create
```

**Request Body**:
```json
{
  "email": "customer@example.com",
  "name": "John Doe",
  "metadata": {
    "userId": "user_123"
  }
}
```

**Response**:
```json
{
  "success": true,
  "customer": {
    "id": "cus_123",
    "email": "customer@example.com",
    "name": "John Doe",
    "created": "2026-01-02T12:00:00.000Z",
    "metadata": {
      "userId": "user_123"
    }
  }
}
```

---

### Get Customer

```http
GET /api/payments/customers/:id
```

**Response**:
```json
{
  "success": true,
  "customer": {
    "id": "cus_123",
    "email": "customer@example.com",
    "name": "John Doe",
    "created": "2026-01-02T12:00:00.000Z"
  }
}
```

---

### Create Subscription

```http
POST /api/payments/subscriptions/create
```

**Request Body**:
```json
{
  "customerId": "cus_123",
  "priceId": "price_123",
  "trialPeriodDays": 14,
  "metadata": {
    "planName": "Premium Monthly"
  }
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "customerId": "cus_123",
    "status": "active",
    "currentPeriodStart": "2026-01-02T12:00:00.000Z",
    "currentPeriodEnd": "2026-02-02T12:00:00.000Z",
    "trialEnd": "2026-01-16T12:00:00.000Z",
    "metadata": {
      "planName": "Premium Monthly"
    }
  }
}
```

---

### Get Subscription

```http
GET /api/payments/subscriptions/:id
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "customerId": "cus_123",
    "status": "active",
    "currentPeriodStart": "2026-01-02T12:00:00.000Z",
    "currentPeriodEnd": "2026-02-02T12:00:00.000Z"
  }
}
```

---

### Update Subscription

```http
POST /api/payments/subscriptions/:id/update
```

**Request Body**:
```json
{
  "priceId": "price_456",
  "quantity": 2,
  "metadata": {
    "planName": "Premium Yearly"
  }
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "status": "active",
    "updated": true
  }
}
```

---

### Cancel Subscription

```http
POST /api/payments/subscriptions/:id/cancel
```

**Request Body**:
```json
{
  "immediately": false
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "status": "canceled",
    "cancelAt": "2026-02-02T12:00:00.000Z",
    "canceledAt": "2026-01-02T12:00:00.000Z"
  }
}
```

---

### Create Refund

```http
POST /api/payments/refunds/create
```

**Request Body**:
```json
{
  "paymentIntentId": "pi_123",
  "amount": 4999,
  "reason": "requested_by_customer"
}
```

**Response**:
```json
{
  "success": true,
  "refund": {
    "id": "re_123",
    "amount": 4999,
    "currency": "usd",
    "status": "succeeded",
    "reason": "requested_by_customer",
    "created": "2026-01-02T12:00:00.000Z"
  }
}
```

---

### Get Payment History

```http
GET /api/payments/history?customerId=cus_123&limit=20
```

**Query Parameters**:
- `customerId` - Filter by customer
- `limit` (default: 10) - Number of results

**Response**:
```json
{
  "success": true,
  "payments": [
    {
      "id": "pi_123",
      "amount": 9999,
      "currency": "usd",
      "status": "succeeded",
      "created": "2026-01-02T12:00:00.000Z"
    },
    ...
  ],
  "hasMore": false
}
```

---

### Stripe Webhook

```http
POST /api/payments/webhooks/stripe
```

**Headers**:
```
stripe-signature: <webhook signature>
```

**Request Body**: Raw Stripe webhook event

**Response**:
```json
{
  "received": true,
  "eventType": "payment_intent.succeeded"
}
```

---

## ❌ Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service degraded

---

## ⏱️ Rate Limiting

All API endpoints are protected by rate limiting:

- **Default**: 100 requests per minute per IP
- **Auth endpoints**: 10 requests per minute per IP
- **File upload**: 20 uploads per hour per user
- **Payment endpoints**: 50 requests per minute per user

**Rate limit headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704196860
```

When rate limit is exceeded:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## 🔒 Authentication

Most endpoints require authentication via JWT Bearer token:

```http
Authorization: Bearer <your_jwt_token>
```

Obtain tokens via:
- `POST /api/auth/login`
- `POST /api/auth/register`

Refresh tokens via:
- `POST /api/auth/refresh`

---

## 📚 Additional Resources

- [Architecture Diagram](./ARCHITECTURE.md)
- [Phase 3 Summary](./PHASE-3-SUMMARY.md)
- [Phase 4 Summary](./PHASE-4-SUMMARY.md)
- [Environment Configuration](./.env.example)

---

**Generated by**: Claude Code (Sonnet 4.5)
**Date**: January 2, 2026
**Version**: 1.0.0
**Total Endpoints**: 60+

_Complete API documentation for AILYDIAN microservices architecture._
