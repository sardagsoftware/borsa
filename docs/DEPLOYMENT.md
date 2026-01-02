# 🚀 AILYDIAN Production Deployment Guide

**Version**: 1.0.0
**Last Updated**: January 2, 2026
**Phase**: 5 - Production Deployment

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Deployment](#docker-deployment)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Variables](#environment-variables)
5. [Azure Services Setup](#azure-services-setup)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### Required Tools

- **Docker** (v20.10 or higher)
- **Docker Compose** (v2.0 or higher)
- **Node.js** (v18 or higher)
- **Git**

### Required Accounts

- **Vercel Account** (for hosting)
- **Azure Account** (for AI services, Blob Storage)
- **Stripe Account** (for payments)
- **SendGrid Account** (for emails)

### Required API Keys

See `.env.example` for complete list of required environment variables.

---

## 🐳 Docker Deployment

### Option A: Production Docker Compose

**Quick Start**:

```bash
# 1. Clone repository
git clone https://github.com/your-org/ailydian.git
cd ailydian

# 2. Create production environment file
cp .env.example .env.production
# Edit .env.production with your actual values

# 3. Build and start
docker-compose -f docker-compose.production.yml up -d

# 4. Check health
curl http://localhost:3100/api/services/health
```

**Detailed Steps**:

#### 1. Environment Configuration

Create `.env.production`:

```bash
# Server
NODE_ENV=production
PORT=3100

# Security (CRITICAL - Generate strong secrets!)
JWT_SECRET=<generate-with-openssl-rand-base64-64>
SESSION_SECRET=<generate-with-openssl-rand-base64-64>

# Azure Services
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_CONTAINER_NAME=uploads

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# SendGrid
SENDGRID_API_KEY=SG.your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@www.ailydian.com
SENDGRID_FROM_NAME=AILYDIAN

# Optional: Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_HOST=redis
REDIS_PORT=6379
```

#### 2. Build Docker Image

```bash
# Build production image
docker build -t ailydian/server:latest .

# Or use docker-compose
docker-compose -f docker-compose.production.yml build
```

#### 3. Start Services

```bash
# Start in background
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Check status
docker-compose -f docker-compose.production.yml ps
```

#### 4. Verify Deployment

```bash
# Health check
curl http://localhost:3100/api/services/health

# Service discovery
curl http://localhost:3100/api/services

# Expected response:
{
  "timestamp": "2026-01-02T12:00:00.000Z",
  "overall": "OK",
  "services": {
    "monitoring": { "status": "OK" },
    "auth": { "status": "OK" },
    "azureAI": { "status": "OK" },
    "aiChat": { "status": "OK" },
    "fileStorage": { "status": "OK" },
    "payment": { "status": "OK" }
  }
}
```

#### 5. Scaling (Optional)

```bash
# Scale to multiple instances
docker-compose -f docker-compose.production.yml up -d --scale ailydian-server=3

# Load balancer required for multiple instances
```

### Option B: Standalone Docker

```bash
# Build
docker build -t ailydian/server:latest .

# Run with environment file
docker run -d \
  --name ailydian-server \
  -p 3100:3100 \
  --env-file .env.production \
  --restart unless-stopped \
  ailydian/server:latest

# Check logs
docker logs -f ailydian-server
```

---

## ☁️ Vercel Deployment

### Prerequisites

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login
```

### Deployment Steps

#### 1. Configure Vercel

Create `vercel.json`:

```json
{
  "version": 2,
  "name": "ailydian-ultra-pro",
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"]
}
```

#### 2. Set Environment Variables

```bash
# Add all required environment variables
vercel env add JWT_SECRET production
vercel env add SESSION_SECRET production
vercel env add AZURE_OPENAI_API_KEY production
# ... add all variables from .env.example
```

**OR** use Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.example`
3. Mark as "Production"

#### 3. Deploy

```bash
# Deploy to production
vercel --prod

# Expected output:
🔍  Inspect: https://vercel.com/...
✅  Production: https://ailydian-ultra-pro.vercel.app
```

#### 4. Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add www.ailydian.com

# Configure DNS (follow Vercel instructions)
```

### Vercel-Specific Considerations

**File Size Limits**:
- Max file size: 50MB per file
- Max deployment size: 100MB (compressed)

**Function Timeout**:
- Hobby plan: 10s
- Pro plan: 60s (upgrade if needed)

**Environment Variables**:
- Add ALL variables from `.env.example`
- Use Vercel Secrets for sensitive data

---

## 🔐 Environment Variables

### Critical Security Variables

**Generate Strong Secrets**:

```bash
# JWT Secret (64 bytes)
openssl rand -base64 64

# Session Secret (64 bytes)
openssl rand -base64 64
```

### Required Variables by Service

#### Main Server
```bash
NODE_ENV=production
PORT=3100
```

#### Microservices
```bash
MONITORING_PORT=3101
AUTH_PORT=3102
AZURE_AI_PORT=3103
AI_CHAT_PORT=3104
FILE_STORAGE_PORT=3105
PAYMENT_PORT=3106
```

#### Azure Services
```bash
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=yourstore;AccountKey=...
AZURE_CONTAINER_NAME=uploads

# Azure Search (optional)
AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_ADMIN_KEY=your_admin_key
```

#### Payment (Stripe)
```bash
STRIPE_SECRET_KEY=sk_live_... (use sk_test_ for testing)
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Email (SendGrid)
```bash
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@www.ailydian.com
SENDGRID_FROM_NAME=AILYDIAN
```

#### Authentication
```bash
JWT_SECRET=<strong-secret-here>
SESSION_SECRET=<strong-secret-here>
```

### Optional Variables

```bash
# Database (if using)
DATABASE_URL=postgresql://...

# Redis (if using)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Other AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=...
```

---

## ☁️ Azure Services Setup

### 1. Azure OpenAI

```bash
# Create Azure OpenAI resource
az cognitiveservices account create \
  --name ailydian-openai \
  --resource-group ailydian-rg \
  --kind OpenAI \
  --sku S0 \
  --location eastus

# Deploy model
az cognitiveservices account deployment create \
  --name ailydian-openai \
  --resource-group ailydian-rg \
  --deployment-name gpt-4 \
  --model-name gpt-4 \
  --model-version "0613" \
  --model-format OpenAI \
  --scale-settings-scale-type "Standard"

# Get endpoint and key
az cognitiveservices account show \
  --name ailydian-openai \
  --resource-group ailydian-rg \
  --query properties.endpoint

az cognitiveservices account keys list \
  --name ailydian-openai \
  --resource-group ailydian-rg
```

### 2. Azure Blob Storage

```bash
# Create storage account
az storage account create \
  --name ailydianstore \
  --resource-group ailydian-rg \
  --location eastus \
  --sku Standard_LRS

# Create container
az storage container create \
  --name uploads \
  --account-name ailydianstore \
  --public-access off

# Get connection string
az storage account show-connection-string \
  --name ailydianstore \
  --resource-group ailydian-rg
```

### 3. Azure Application Insights (Monitoring)

```bash
# Create Application Insights
az monitor app-insights component create \
  --app ailydian-insights \
  --location eastus \
  --resource-group ailydian-rg

# Get instrumentation key
az monitor app-insights component show \
  --app ailydian-insights \
  --resource-group ailydian-rg \
  --query instrumentationKey
```

---

## ✅ Post-Deployment Checklist

### 1. Health Checks

```bash
# Global health
curl https://www.ailydian.com/api/services/health

# Individual services
curl https://www.ailydian.com/api/monitoring/
curl https://www.ailydian.com/api/auth/
curl https://www.ailydian.com/api/azure-ai/
curl https://www.ailydian.com/api/ai-chat/
curl https://www.ailydian.com/api/files/
curl https://www.ailydian.com/api/payments/
```

### 2. Test Critical Flows

**File Upload**:
```bash
curl -X POST https://www.ailydian.com/api/files/upload \
  -F "file=@test.txt" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Payment Intent**:
```bash
curl -X POST https://www.ailydian.com/api/payments/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 99.99, "currency": "usd"}' \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**AI Chat**:
```bash
curl -X POST https://www.ailydian.com/api/ai-chat/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "userId": "test-user"}' \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Configure Webhooks

**Stripe Webhooks**:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://www.ailydian.com/api/payments/webhooks/stripe`
3. Select events: `payment_intent.*`, `subscription.*`, `customer.*`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

**SendGrid Domain Authentication**:
1. Follow steps in `SENDGRID-DNS-SETUP.md`
2. Add 6 DNS records
3. Verify in SendGrid dashboard

### 4. Monitoring Setup

- Set up Application Insights dashboards
- Configure error alerting
- Set up uptime monitoring (Pingdom, UptimeRobot)
- Configure log aggregation

### 5. Security Hardening

- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Configure CSP headers (already in server.js)
- [ ] Set up rate limiting (already configured)
- [ ] Enable CORS for specific origins
- [ ] Rotate secrets regularly
- [ ] Set up IP whitelisting (if needed)

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Health check failed"

**Symptoms**: Health endpoint returns 503

**Solutions**:
```bash
# Check logs
docker logs ailydian-server

# Verify environment variables
docker exec ailydian-server env | grep AZURE

# Restart service
docker-compose -f docker-compose.production.yml restart
```

#### 2. "Module not found" errors

**Symptoms**: Cannot find module errors in logs

**Solutions**:
```bash
# Rebuild with no cache
docker-compose -f docker-compose.production.yml build --no-cache

# Or rebuild specific service
docker build --no-cache -t ailydian/server:latest .
```

#### 3. "Port already in use"

**Symptoms**: Address already in use error

**Solutions**:
```bash
# Find process using port 3100
lsof -i :3100

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3200
```

#### 4. Azure connection errors

**Symptoms**: Azure service timeouts

**Solutions**:
- Verify endpoint URLs (must end with /)
- Check API keys are correct
- Verify resource is deployed in correct region
- Check network/firewall rules

#### 5. Stripe webhook failures

**Symptoms**: Webhook signature verification fails

**Solutions**:
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook URL is correct
- Ensure raw body is passed to webhook handler
- Test with Stripe CLI: `stripe listen --forward-to localhost:3100/api/payments/webhooks/stripe`

---

## 📚 Additional Resources

- [API Documentation](./API-ENDPOINTS.md)
- [Architecture Overview](./CURRENT-STATUS.md)
- [SendGrid Setup](./SENDGRID-DNS-SETUP.md)
- [Phase 4 Summary](./PHASE-4-SUMMARY.md)

---

## 🆘 Support

For deployment issues:
1. Check logs: `docker-compose -f docker-compose.production.yml logs`
2. Verify all environment variables are set
3. Test locally first: `npm run dev`
4. Check Azure portal for service status

---

**Generated by**: Claude Code (Sonnet 4.5)
**Date**: January 2, 2026
**Version**: 1.0.0

_Complete deployment guide for AILYDIAN production deployment across Docker and Vercel platforms._
