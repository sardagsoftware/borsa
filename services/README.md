# Microservices Architecture

This directory contains the extracted microservices from the monolithic `server.js` file. Each service is designed to run independently or be integrated into the main application.

## Service Extraction Plan

For the complete service extraction roadmap, see [SERVICE-EXTRACTION-PLAN.md](../docs/architecture/SERVICE-EXTRACTION-PLAN.md).

## Extracted Services

### 1. Monitoring Service (`monitoring-service.js`)

**Status**: ✅ Complete
**Priority**: P0 (Critical - Observability First)
**Lines**: ~450
**Dependencies**: Sentry, Winston, API Health Monitor

#### Description

Enterprise-grade monitoring and health check service that provides:

- System health monitoring
- API endpoint health checks
- WebSocket connection monitoring
- Alert webhook processing
- Performance metrics
- Error tracking integration

#### Endpoints

| Method | Path                   | Description                   |
| ------ | ---------------------- | ----------------------------- |
| GET    | `/api/health`          | Basic health check            |
| GET    | `/api/status`          | Detailed server status        |
| GET    | `/api/health-status`   | API health monitor status     |
| GET    | `/api/health-monitor`  | Comprehensive monitoring data |
| GET    | `/api/database/health` | Database health check         |
| GET    | `/api/cache/health`    | Cache health check            |
| GET    | `/api/storage/health`  | Storage health check          |
| POST   | `/api/alerts/webhook`  | Alert processing webhook      |

#### Running Standalone

```bash
# Set environment variables
export MONITORING_PORT=3101
export SENTRY_DSN=your_sentry_dsn
export NODE_ENV=production

# Start the service
node services/monitoring-service.js
```

#### Running as Integrated Service

```javascript
const MonitoringService = require('./services/monitoring-service');

// Create service instance
const monitoringService = new MonitoringService({
  port: 3101,
  enableSentry: true,
  enableHealthMonitor: true,
});

// Start the service
await monitoringService.start();

// Or integrate with existing Express app
const app = express();
app.use('/monitoring', monitoringService.getApp());
```

#### Configuration Options

```javascript
{
  port: 3101,                    // Service port (default: 3101)
  enableSentry: true,            // Enable Sentry error tracking
  enableHealthMonitor: true      // Enable API health monitoring
}
```

#### Testing

```bash
# Run monitoring service tests
npm run test:unit -- tests/services/monitoring-service.test.js

# Test health endpoint
curl http://localhost:3101/api/health

# Test alert webhook
curl -X POST http://localhost:3101/api/alerts/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "alertType": "system",
    "severity": "info",
    "message": "Test alert",
    "metadata": {"source": "test"}
  }'
```

#### Environment Variables

| Variable          | Required | Default     | Description                     |
| ----------------- | -------- | ----------- | ------------------------------- |
| `MONITORING_PORT` | No       | 3101        | Service port                    |
| `SENTRY_DSN`      | No       | -           | Sentry error tracking DSN       |
| `SENTRY_ENABLED`  | No       | false       | Enable Sentry in non-production |
| `NODE_ENV`        | No       | development | Runtime environment             |
| `LOG_LEVEL`       | No       | info        | Logging level                   |

#### Health Check Examples

**Basic Health Check**

```bash
curl http://localhost:3101/api/health
```

Response:

```json
{
  "status": "OK",
  "timestamp": "2026-01-02T10:30:00.000Z",
  "service": "monitoring-service",
  "version": "1.0.0",
  "uptime": 123.45
}
```

**Server Status**

```bash
curl http://localhost:3101/api/status
```

Response:

```json
{
  "service": "monitoring-service",
  "status": "ACTIVE",
  "timestamp": "2026-01-02T10:30:00.000Z",
  "uptime": 123.45,
  "memory": {
    "rss": "120MB",
    "heapTotal": "80MB",
    "heapUsed": "60MB",
    "external": "5MB"
  },
  "process": {
    "pid": 12345,
    "nodeVersion": "v20.0.0",
    "platform": "darwin"
  }
}
```

#### Alert Webhook

**Send Alert**

```bash
curl -X POST http://localhost:3101/api/alerts/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "alertType": "database",
    "severity": "critical",
    "message": "Database connection lost",
    "metadata": {
      "database": "postgres-primary",
      "lastConnection": "2026-01-02T10:29:00.000Z"
    }
  }'
```

Response:

```json
{
  "success": true,
  "alert": {
    "id": "alert_1704192000000",
    "type": "database",
    "severity": "critical",
    "message": "Database connection lost",
    "timestamp": "2026-01-02T10:30:00.000Z",
    "acknowledged": false,
    "metadata": {
      "database": "postgres-primary",
      "lastConnection": "2026-01-02T10:29:00.000Z"
    },
    "escalation": {
      "pagerDuty": "triggered",
      "sms": "sent",
      "email": "sent",
      "slackChannel": "#alerts-critical"
    }
  },
  "processing": {
    "queued": true,
    "estimatedDelivery": "< 30 seconds",
    "channels": ["webhook", "email", "slack"]
  }
}
```

#### Alert Severity Levels

- **info**: Informational alerts, no escalation
- **warning**: Warning alerts, logged but no escalation
- **critical**: Critical alerts, full escalation (PagerDuty, SMS, Email, Slack)

#### Integration with Main Server

To integrate the monitoring service with the main server:

1. **Import the service:**

```javascript
const MonitoringService = require('./services/monitoring-service');
```

2. **Create and initialize:**

```javascript
const monitoringService = new MonitoringService({
  enableSentry: true,
  enableHealthMonitor: true,
});

// Mount the service routes
app.use('/monitoring', monitoringService.getApp());

// Access health monitor directly
const healthMonitor = monitoringService.getHealthMonitor();
```

3. **Use in WebSocket broadcasts:**

```javascript
healthMonitor.on('healthUpdate', healthData => {
  broadcastToStatusSubscribers({
    type: 'status-update',
    data: healthMonitor.getStatusForAPI(),
  });
});
```

#### Production Deployment

**Docker**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3101
CMD ["node", "services/monitoring-service.js"]
```

**Docker Compose**

```yaml
version: '3.8'
services:
  monitoring:
    build: .
    ports:
      - '3101:3101'
    environment:
      - NODE_ENV=production
      - MONITORING_PORT=3101
      - SENTRY_DSN=${SENTRY_DSN}
    restart: unless-stopped
```

**Kubernetes**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: monitoring-service
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: monitoring
          image: ailydian/monitoring-service:latest
          ports:
            - containerPort: 3101
          env:
            - name: NODE_ENV
              value: 'production'
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3101
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3101
            initialDelaySeconds: 5
            periodSeconds: 5
```

#### Monitoring Metrics

The monitoring service tracks:

- **API Health**: Response times, uptime, error rates
- **WebSocket Connections**: Connection status, latency
- **System Metrics**: Memory usage, CPU, uptime
- **Database Health**: Connection pool, response times
- **Cache Health**: Hit ratio, response times
- **Storage Health**: Disk usage, I/O performance

#### Best Practices

1. **Health Checks**: Use `/api/health` for load balancer health checks
2. **Monitoring**: Use `/api/health-monitor` for comprehensive monitoring dashboards
3. **Alerts**: Configure webhooks to receive critical alerts
4. **Logging**: Use structured logging with Winston for production
5. **Error Tracking**: Enable Sentry for production error tracking
6. **Graceful Shutdown**: Handle SIGTERM/SIGINT for zero-downtime deployments

---

### 2. Authentication Service (`auth-service.js`)

**Status**: ✅ Complete
**Priority**: P0 (Critical - Blocks All Services)
**Lines**: ~900
**Dependencies**: JWT, OAuth providers, Winston

#### Description

Enterprise-grade authentication and authorization service that provides:

- JWT authentication and token management
- OAuth 2.0 integration (Google, Microsoft, GitHub, Apple)
- Session management
- Role-based access control (RBAC)
- Multi-tenant isolation
- API key generation and validation

#### Endpoints

**OAuth Authentication:**

| Method | Path                           | Description           |
| ------ | ------------------------------ | --------------------- |
| GET    | `/api/auth/google`             | Google OAuth login    |
| GET    | `/api/auth/google/callback`    | Google callback       |
| GET    | `/api/auth/microsoft`          | Microsoft OAuth login |
| GET    | `/api/auth/microsoft/callback` | Microsoft callback    |
| GET    | `/api/auth/github`             | GitHub OAuth login    |
| GET    | `/api/auth/github/callback`    | GitHub callback       |
| GET    | `/api/auth/apple`              | Apple OAuth login     |
| POST   | `/api/auth/apple/callback`     | Apple callback        |

**JWT Authentication:**

| Method | Path                 | Description            |
| ------ | -------------------- | ---------------------- |
| POST   | `/api/auth/login`    | Login with credentials |
| POST   | `/api/auth/register` | Register new user      |
| POST   | `/api/auth/refresh`  | Refresh access token   |
| POST   | `/api/auth/logout`   | Logout user            |
| GET    | `/api/auth/verify`   | Verify JWT token       |

**Utilities:**

| Method | Path                         | Description           |
| ------ | ---------------------------- | --------------------- |
| POST   | `/api/auth/check-email`      | Check if email exists |
| POST   | `/api/auth/generate-api-key` | Generate API key      |

#### Running Standalone

```bash
# Set environment variables
export AUTH_PORT=3102
export JWT_SECRET=your-secret-key-minimum-32-characters
export JWT_EXPIRY=24h
export GOOGLE_CLIENT_ID=your-google-client-id
export GOOGLE_CLIENT_SECRET=your-google-client-secret
export NODE_ENV=production

# Start the service
node services/auth-service.js
```

#### Running as Integrated Service

```javascript
const AuthService = require('./services/auth-service');

// Create service instance
const authService = new AuthService({
  port: 3102,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: '24h',
  enableOAuth: true,
});

// Start the service
await authService.start();

// Or integrate with existing Express app
const app = express();
app.use('/auth', authService.getApp());
```

#### Configuration Options

```javascript
{
  port: 3102,                    // Service port (default: 3102)
  jwtSecret: 'your-secret',      // JWT secret (REQUIRED)
  jwtExpiry: '24h',              // Token expiry (default: 24h)
  enableOAuth: true              // Enable OAuth providers
}
```

#### Testing

```bash
# Run auth service tests
npm test -- tests/services/auth-service.test.js

# Test registration
curl -X POST http://localhost:3102/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "name": "Test User"
  }'

# Test login
curl -X POST http://localhost:3102/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'

# Test token verification
curl http://localhost:3102/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Environment Variables

| Variable                  | Required   | Default | Description                   |
| ------------------------- | ---------- | ------- | ----------------------------- |
| `AUTH_PORT`               | No         | 3102    | Service port                  |
| `JWT_SECRET`              | Yes (Prod) | -       | JWT secret key (min 32 chars) |
| `JWT_EXPIRY`              | No         | 24h     | Token expiration time         |
| `GOOGLE_CLIENT_ID`        | No         | -       | Google OAuth client ID        |
| `GOOGLE_CLIENT_SECRET`    | No         | -       | Google OAuth client secret    |
| `MICROSOFT_CLIENT_ID`     | No         | -       | Microsoft OAuth client ID     |
| `MICROSOFT_CLIENT_SECRET` | No         | -       | Microsoft OAuth client secret |
| `GITHUB_CLIENT_ID`        | No         | -       | GitHub OAuth client ID        |
| `GITHUB_CLIENT_SECRET`    | No         | -       | GitHub OAuth client secret    |
| `APPLE_CLIENT_ID`         | No         | -       | Apple OAuth client ID         |
| `APPLE_TEAM_ID`           | No         | -       | Apple team ID                 |
| `APPLE_KEY_ID`            | No         | -       | Apple key ID                  |
| `APPLE_PRIVATE_KEY`       | No         | -       | Apple private key             |

#### Authentication Examples

**Register User**

```bash
curl -X POST http://localhost:3102/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

Response:

```json
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": "local_uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

**Login**

```bash
curl -X POST http://localhost:3102/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

**Refresh Token**

```bash
curl -X POST http://localhost:3102/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGci..."
  }'
```

Response:

```json
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

**Generate API Key**

```bash
curl -X POST http://localhost:3102/api/auth/generate-api-key \
  -H "Authorization: Bearer eyJhbGci..."
```

Response:

```json
{
  "success": true,
  "apiKey": "abc123...xyz789",
  "message": "API key generated successfully. Store it securely - it will not be shown again."
}
```

#### OAuth Flow

1. **User initiates OAuth**: Redirect to `/api/auth/google` (or microsoft, github, apple)
2. **OAuth Provider**: User authenticates with provider
3. **Callback**: Provider redirects to `/api/auth/google/callback` with authorization code
4. **Token Exchange**: Service exchanges code for access token
5. **User Info**: Service fetches user profile
6. **JWT Generation**: Service creates JWT token
7. **Redirect**: User redirected to dashboard with token

#### Security Features

- **JWT Validation**: Minimum 32-character secret, weak secret detection
- **Password Hashing**: TODO - Implement bcrypt (placeholder in current version)
- **OAuth State Validation**: CSRF protection with state parameter
- **Role-Based Access Control**: USER, DEVELOPER, PREMIUM, ENTERPRISE, ADMIN roles
- **Multi-Tenant Isolation**: Tenant-scoped data access
- **API Key Validation**: SHA-256 hashed keys
- **Token Expiration**: Configurable expiry times
- **Refresh Tokens**: Long-lived tokens for token renewal

#### Roles and Permissions

| Role       | Level | Rate Limit     | Description                  |
| ---------- | ----- | -------------- | ---------------------------- |
| GUEST      | 0     | 100/hour       | Unauthenticated users        |
| USER       | 10    | 1,000/hour     | Standard authenticated users |
| DEVELOPER  | 20    | 5,000/hour     | Developer accounts           |
| PREMIUM    | 30    | 50,000/hour    | Premium subscribers          |
| ENTERPRISE | 40    | 500,000/hour   | Enterprise customers         |
| ADMIN      | 100   | 1,000,000/hour | System administrators        |

#### Production Deployment

**Docker**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3102
ENV NODE_ENV=production
CMD ["node", "services/auth-service.js"]
```

**Kubernetes**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: auth
          image: ailydian/auth-service:latest
          ports:
            - containerPort: 3102
          env:
            - name: NODE_ENV
              value: 'production'
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: auth-secrets
                  key: jwt-secret
          livenessProbe:
            httpGet:
              path: /
              port: 3102
            initialDelaySeconds: 15
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 3102
            initialDelaySeconds: 5
            periodSeconds: 5
```

#### Best Practices

1. **JWT Secret**: Use strong, randomly generated secrets (min 64 bytes)
2. **Token Expiry**: Use short-lived access tokens (1h) with refresh tokens (7d)
3. **OAuth Providers**: Configure only required providers
4. **Database Integration**: Replace in-memory storage with PostgreSQL/MongoDB
5. **Password Hashing**: Implement bcrypt with salt rounds >= 10
6. **HTTPS Only**: Always use HTTPS in production
7. **Rate Limiting**: Implement per-user rate limiting
8. **Audit Logging**: Log all authentication events

---

### 3. Azure AI Service (`azure-ai-service.js`)

**Status**: ✅ Complete
**Priority**: P0 (Critical - Core AI Provider)
**Lines**: ~700
**Dependencies**: @azure/openai, @azure/identity, @azure/arm-\*, Winston

#### Description

Enterprise Azure AI integration service providing access to Azure's comprehensive AI and cloud services:

- Azure OpenAI multimodal AI services
- Azure Cognitive Services (Vision, Speech, Translation)
- Azure Health Insights (Medical AI)
- Azure AI Search with RAG pipeline
- Azure Quantum Computing simulation
- Azure infrastructure metrics and monitoring

#### Endpoints

| Method | Path                     | Description                                               |
| ------ | ------------------------ | --------------------------------------------------------- |
| POST   | `/api/azure`             | Azure AI multimodal services (chat, vision, speech, etc.) |
| POST   | `/api/azure-test`        | Service operational status test                           |
| POST   | `/api/azure/speech/live` | Azure Speech Services live transcription                  |
| POST   | `/api/azure/search`      | Azure AI Search + RAG pipeline                            |
| POST   | `/api/azure/quantum`     | Azure Quantum Computing simulation                        |
| GET    | `/api/azure/metrics`     | Azure infrastructure metrics                              |
| GET    | `/api/azure/health`      | Azure service health status                               |

#### Azure OpenAI Services

The multimodal `/api/azure` endpoint supports multiple AI services:

**1. Chat Completion**

```bash
curl -X POST http://localhost:3103/api/azure \
  -H "Content-Type: application/json" \
  -d '{
    "service": "chat",
    "query": "Explain quantum computing",
    "options": {
      "model": "OX5C9E2B",
      "temperature": 0.7,
      "maxTokens": 2048
    }
  }'
```

**2. Computer Vision**

```bash
curl -X POST http://localhost:3103/api/azure \
  -H "Content-Type: application/json" \
  -d '{
    "service": "vision",
    "input": "base64_encoded_image_data"
  }'
```

**3. Speech Services**

```bash
curl -X POST http://localhost:3103/api/azure \
  -H "Content-Type: application/json" \
  -d '{
    "service": "speech",
    "input": "audio_data",
    "options": {
      "action": "transcribe",
      "language": "tr-TR"
    }
  }'
```

**4. Translation**

```bash
curl -X POST http://localhost:3103/api/azure \
  -H "Content-Type: application/json" \
  -d '{
    "service": "translation",
    "input": "Merhaba dünya",
    "options": {
      "targetLanguage": "en",
      "sourceLanguage": "auto"
    }
  }'
```

**5. Health Insights (Medical AI)**

```bash
curl -X POST http://localhost:3103/api/azure \
  -H "Content-Type: application/json" \
  -d '{
    "service": "health",
    "input": "radiology_report_text",
    "options": {
      "action": "analyze",
      "inferenceTypes": ["finding", "followup"]
    }
  }'
```

**6. Quantum Simulation**

```bash
curl -X POST http://localhost:3103/api/azure \
  -H "Content-Type: application/json" \
  -d '{
    "service": "quantum",
    "input": "quantum_circuit_definition",
    "options": {
      "qubits": 4,
      "algorithm": "grover",
      "iterations": 100
    }
  }'
```

**7. Azure AI Search**

```bash
curl -X POST http://localhost:3103/api/azure \
  -H "Content-Type: application/json" \
  -d '{
    "service": "search",
    "query": "Azure AI documentation",
    "options": {
      "top": 10,
      "semanticConfig": "default"
    }
  }'
```

#### Azure Cognitive Services

**Live Speech Transcription**

```bash
curl -X POST http://localhost:3103/api/azure/speech/live \
  -H "Content-Type: application/json" \
  -d '{
    "language": "tr-TR",
    "action": "transcribe",
    "input": "audio_stream_data"
  }'
```

**AI Search + RAG Pipeline**

```bash
curl -X POST http://localhost:3103/api/azure/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "enterprise AI solutions",
    "top": 10,
    "semanticConfig": "default",
    "filter": "category eq '\''technical'\''"
  }'
```

**Quantum Computing**

```bash
curl -X POST http://localhost:3103/api/azure/quantum \
  -H "Content-Type: application/json" \
  -d '{
    "algorithm": "grover",
    "qubits": 4,
    "iterations": 100
  }'
```

#### Azure Infrastructure Monitoring

**Get Infrastructure Metrics**

```bash
curl http://localhost:3103/api/azure/metrics
```

Returns comprehensive metrics for:

- Azure Kubernetes Service (AKS)
- Azure SQL Database
- Azure Redis Cache
- Azure Front Door
- Azure SignalR Service
- Azure AI Search
- Regional health and SLA data

**Health Check**

```bash
curl http://localhost:3103/api/azure/health
```

#### Configuration

**Environment Variables**

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=your-deployment-name

# Azure Subscription (for metrics)
AZURE_SUBSCRIPTION_ID=your-subscription-id

# Service Configuration
AZURE_AI_PORT=3103
NODE_ENV=production

# Feature Flags
ENABLE_AZURE_OPENAI=true
ENABLE_AZURE_COGNITIVE=true
ENABLE_AZURE_METRICS=true
```

**Configuration Object**

```javascript
const AzureAIService = require('./services/azure-ai-service');

const service = new AzureAIService({
  port: 3103,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureSubscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
  enableOpenAI: true,
  enableCognitiveServices: true,
  enableMetrics: true,
});

await service.start();
```

#### Integration with Main Server

```javascript
const express = require('express');
const AzureAIService = require('./services/azure-ai-service');

const app = express();
const azureService = new AzureAIService({
  enableOpenAI: true,
  enableCognitiveServices: true,
});

// Mount Azure AI service routes
app.use('/', azureService.getApp());

app.listen(3000, () => {
  console.log('Server with Azure AI integration running on port 3000');
});
```

#### Docker Deployment

**Dockerfile**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY services/azure-ai-service.js ./services/
COPY lib/ ./lib/
COPY api/azure-metrics.js ./api/

ENV AZURE_AI_PORT=3103
ENV NODE_ENV=production

EXPOSE 3103

CMD ["node", "services/azure-ai-service.js"]
```

**docker-compose.yml**

```yaml
version: '3.8'

services:
  azure-ai-service:
    build: .
    ports:
      - '3103:3103'
    environment:
      - AZURE_OPENAI_ENDPOINT=${AZURE_OPENAI_ENDPOINT}
      - AZURE_OPENAI_API_KEY=${AZURE_OPENAI_API_KEY}
      - AZURE_SUBSCRIPTION_ID=${AZURE_SUBSCRIPTION_ID}
      - ENABLE_AZURE_OPENAI=true
      - ENABLE_AZURE_COGNITIVE=true
      - ENABLE_AZURE_METRICS=true
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3103/api/azure/health']
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: azure-ai-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: azure-ai-service
  template:
    metadata:
      labels:
        app: azure-ai-service
    spec:
      containers:
        - name: azure-ai-service
          image: your-registry/azure-ai-service:latest
          ports:
            - containerPort: 3103
          env:
            - name: AZURE_OPENAI_ENDPOINT
              valueFrom:
                secretKeyRef:
                  name: azure-secrets
                  key: openai-endpoint
            - name: AZURE_OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: azure-secrets
                  key: openai-api-key
            - name: AZURE_SUBSCRIPTION_ID
              valueFrom:
                secretKeyRef:
                  name: azure-secrets
                  key: subscription-id
          resources:
            requests:
              memory: '512Mi'
              cpu: '500m'
            limits:
              memory: '1Gi'
              cpu: '1000m'
          livenessProbe:
            httpGet:
              path: /api/azure/health
              port: 3103
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/azure/health
              port: 3103
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: azure-ai-service
spec:
  selector:
    app: azure-ai-service
  ports:
    - port: 3103
      targetPort: 3103
  type: ClusterIP
```

#### Testing

The service includes comprehensive test coverage (28 tests):

```bash
# Run tests
npm test -- tests/services/azure-ai-service.test.js

# Run with coverage
npm test -- --coverage tests/services/azure-ai-service.test.js
```

**Test Coverage**:

- Service initialization and configuration
- All multimodal AI services (chat, vision, speech, translation, health, quantum, search)
- Live speech transcription
- Azure AI Search + RAG
- Quantum computing simulation
- Infrastructure metrics
- Health checks
- Error handling
- Service management (start/stop)
- Feature flags (enabled/disabled services)

#### Security Considerations

1. **API Key Protection**: Never commit Azure API keys to version control
2. **Environment Variables**: Use secure secret management (Azure Key Vault, Kubernetes Secrets)
3. **Network Security**: Use private endpoints for Azure services
4. **Rate Limiting**: Implement rate limiting to prevent API quota exhaustion
5. **Input Validation**: Validate all input data before sending to Azure services
6. **Error Handling**: Never expose sensitive Azure error details to clients
7. **Monitoring**: Monitor API usage and costs via Azure Cost Management

#### Performance & Scalability

1. **Horizontal Scaling**: Deploy multiple instances behind load balancer
2. **Caching**: Cache AI responses for frequently asked queries
3. **Request Timeout**: Implement appropriate timeouts for long-running operations
4. **Async Processing**: Use message queues for batch AI operations
5. **Connection Pooling**: Reuse HTTP connections to Azure services
6. **Regional Deployment**: Deploy close to Azure regions for lower latency

#### Cost Optimization

1. **Model Selection**: Use appropriate models (GPT-3.5 vs GPT-4) based on use case
2. **Token Management**: Implement token counting and limits
3. **Batch Processing**: Batch multiple requests when possible
4. **Caching**: Cache responses to reduce API calls
5. **Usage Monitoring**: Track costs per feature/user via Azure Cost Management

#### Best Practices

1. **Configuration**: Use feature flags to enable/disable services
2. **Graceful Degradation**: Implement fallbacks when Azure services are unavailable
3. **Logging**: Log all Azure API calls with request IDs for debugging
4. **Monitoring**: Set up alerts for API errors and quota limits
5. **Documentation**: Keep Azure service versions documented
6. **Testing**: Use mocked responses in tests to avoid Azure API costs
7. **Versioning**: Version your Azure API integrations

---

### 4. AI Chat Service (`ai-chat-service.js`)

**Status**: ✅ Complete
**Priority**: P0 (Critical - Core Business Logic)
**Lines**: ~1000
**Dependencies**: Axios, Winston

#### Description

Multi-provider AI chat service with 10+ AI provider integrations, conversation management, and specialized AI modes. This is the core business logic service that powers all AI interactions.

**Supported AI Providers** (10 integrations):

1. **Anthropic** - AX9F7E2B models (200K context)
2. **OpenAI** - OX5C9E2B models (128K context)
3. **Azure OpenAI** - Enterprise AI with regional deployment
4. **Groq** - Ultra-fast inference (GX models)
5. **Google Gemini** - Multimodal AI
6. **Zhipu AI** - GLM-4 models (Chinese AI leader)
7. **01.AI** - Yi models (advanced reasoning)
8. **Mistral AI** - Efficient European models
9. **Z.AI** - Specialized code generation
10. **ERNIE** - Baidu's conversational AI

#### Endpoints

| Method | Path                    | Description                                   |
| ------ | ----------------------- | --------------------------------------------- |
| GET    | `/api/models`           | List all available AI models                  |
| POST   | `/api/chat`             | Main chat endpoint (multi-provider routing)   |
| POST   | `/api/chat/specialized` | Specialized AI (code, reasoning, image, chat) |
| POST   | `/api/chat/gpt5`        | OX5C9E2B-specific endpoint                    |
| POST   | `/api/chat/AX9F7E2B`    | AX9F7E2B-specific endpoint                    |
| POST   | `/api/chat/gemini`      | Gemini-specific endpoint                      |

#### Main Chat Usage

**Standard Chat Request**

```bash
curl -X POST http://localhost:3104/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "OX7A3F8D",
    "message": "Explain quantum computing",
    "temperature": 0.7,
    "max_tokens": 2048,
    "history": []
  }'
```

**Chat with Conversation History**

```bash
curl -X POST http://localhost:3104/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "AX9F7E2B",
    "message": "Tell me more about that",
    "history": [
      {"role": "user", "content": "What is AI?"},
      {"role": "assistant", "content": "AI is artificial intelligence..."}
    ]
  }'
```

#### Specialized AI Modes

The `/api/chat/specialized` endpoint supports multiple AI types:

**1. Code Generation Mode**

```bash
curl -X POST http://localhost:3104/api/chat/specialized \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a Python function to sort an array",
    "aiType": "code",
    "temperature": 0.2
  }'
```

**2. Deep Reasoning Mode**

```bash
curl -X POST http://localhost:3104/api/chat/specialized \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain the implications of quantum supremacy",
    "aiType": "reasoning",
    "temperature": 0.5
  }'
```

**3. Image Analysis Mode**

```bash
curl -X POST http://localhost:3104/api/chat/specialized \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze this image: [base64_data]",
    "aiType": "image"
  }'
```

**4. General Chat Mode**

```bash
curl -X POST http://localhost:3104/api/chat/specialized \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me a story about space exploration",
    "aiType": "chat",
    "language": "en"
  }'
```

#### Model-Specific Endpoints

**OX5C9E2B Endpoint**

```bash
curl -X POST http://localhost:3104/api/chat/gpt5 \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain machine learning",
    "temperature": 0.7,
    "max_tokens": 1000
  }'
```

**AX9F7E2B Endpoint**

```bash
curl -X POST http://localhost:3104/api/chat/AX9F7E2B \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze this complex problem",
    "history": [],
    "temperature": 0.6
  }'
```

**Gemini Endpoint**

```bash
curl -X POST http://localhost:3104/api/chat/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What do you see in this image?",
    "max_tokens": 2048
  }'
```

#### Get Available Models

```bash
curl http://localhost:3104/api/models
```

**Response:**

```json
{
  "success": true,
  "models": [
    {
      "id": "OX7A3F8D",
      "name": "OX5C9E2B Turbo",
      "provider": "lydian-labs",
      "tokens": "128K",
      "category": "LYDIAN LABS",
      "capabilities": ["text", "vision", "reasoning", "code"],
      "available": true
    }
  ],
  "count": 9,
  "available_count": 5,
  "categories": ["MICROSOFT AZURE", "LYDIAN VELOCITY", "LYDIAN LABS", ...]
}
```

#### Configuration

**Environment Variables**

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Azure OpenAI
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com

# Groq (Ultra-fast)
GROQ_API_KEY=gsk_...

# Google Gemini
GOOGLE_AI_API_KEY=AI...

# Zhipu AI (GLM-4)
ZHIPU_API_KEY=...

# 01.AI (Yi)
YI_API_KEY=...

# Mistral AI
MISTRAL_API_KEY=...

# Service Configuration
AI_CHAT_PORT=3104
NODE_ENV=production
```

**Programmatic Configuration**

```javascript
const AIChatService = require('./services/ai-chat-service');

const service = new AIChatService({
  port: 3104,
  enableOpenAI: true,
  enableAnthropic: true,
  enableGroq: true,
  enableGemini: true,
  enableAzure: true,
});

await service.start();
```

#### Integration with Main Server

```javascript
const express = require('express');
const AIChatService = require('./services/ai-chat-service');

const app = express();
const chatService = new AIChatService({
  enableOpenAI: true,
  enableAnthropic: true,
  enableGroq: true,
});

// Mount AI chat service routes
app.use('/', chatService.getApp());

app.listen(3000, () => {
  console.log('Server with AI chat integration running on port 3000');
});
```

#### Docker Deployment

**Dockerfile**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY services/ai-chat-service.js ./services/
COPY lib/ ./lib/

ENV AI_CHAT_PORT=3104
ENV NODE_ENV=production

EXPOSE 3104

CMD ["node", "services/ai-chat-service.js"]
```

**docker-compose.yml**

```yaml
version: '3.8'

services:
  ai-chat-service:
    build: .
    ports:
      - '3104:3104'
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
      - AZURE_OPENAI_API_KEY=${AZURE_OPENAI_API_KEY}
      - AZURE_OPENAI_ENDPOINT=${AZURE_OPENAI_ENDPOINT}
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3104/']
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-chat-service
spec:
  replicas: 5
  selector:
    matchLabels:
      app: ai-chat-service
  template:
    metadata:
      labels:
        app: ai-chat-service
    spec:
      containers:
        - name: ai-chat-service
          image: your-registry/ai-chat-service:latest
          ports:
            - containerPort: 3104
          env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: ai-secrets
                  key: openai-key
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: ai-secrets
                  key: anthropic-key
            - name: GROQ_API_KEY
              valueFrom:
                secretKeyRef:
                  name: ai-secrets
                  key: groq-key
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /
              port: 3104
            initialDelaySeconds: 15
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/models
              port: 3104
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ai-chat-service
spec:
  selector:
    app: ai-chat-service
  ports:
    - port: 3104
      targetPort: 3104
  type: ClusterIP
```

#### Testing

The service includes comprehensive test coverage (45 tests):

```bash
# Run tests
npm test -- tests/services/ai-chat-service.test.js

# Run with coverage
npm test -- --coverage tests/services/ai-chat-service.test.js
```

**Test Coverage**:

- Service initialization and configuration
- Model listing and availability
- Main chat endpoint (all providers)
- Specialized chat modes (code, reasoning, image, chat)
- Model-specific endpoints (OX5C9E2B, AX9F7E2B, Gemini)
- Conversation history management
- Language detection (Turkish/English)
- Token estimation
- Fallback response generation
- Provider API error handling
- Service management (start/stop)

#### Features

**1. Multi-Provider Routing**

- Automatically routes requests to appropriate AI provider
- Supports 10 different AI providers
- Fallback to mock responses when no API keys configured

**2. Conversation History**

- Maintains conversation context
- Supports multi-turn dialogues
- Token-aware history management

**3. Specialized AI Modes**

- **Code**: Optimized for code generation (low temperature)
- **Reasoning**: Deep analysis with step-by-step thinking
- **Image**: Visual analysis and description
- **Chat**: General conversational AI

**4. Language Support**

- Automatic language detection (Turkish/English)
- Language-specific system prompts
- Forced language responses

**5. Token Management**

- Token estimation for requests/responses
- Configurable max_tokens limits
- Usage tracking and reporting

**6. Provider Fallbacks**

- Graceful degradation when providers unavailable
- Automatic fallback response generation
- Provider-specific error handling

#### Provider-Specific Features

**Anthropic (AX9F7E2B)**

- 200K context window
- Advanced reasoning capabilities
- Long-form content generation

**OpenAI (OX5C9E2B)**

- 128K context window
- Vision capabilities
- Function calling support

**Groq (GX models)**

- Ultra-fast inference (<1s)
- Cost-effective
- Llama 3.3 models

**Google Gemini**

- Multimodal capabilities
- Free tier available
- Image analysis

**Azure OpenAI**

- Enterprise compliance
- Regional deployment
- SLA guarantees

#### Security Considerations

1. **API Key Protection**: All API keys stored in environment variables
2. **Input Validation**: Validate all user inputs before API calls
3. **Rate Limiting**: Implement rate limiting per provider
4. **Cost Control**: Track token usage and set limits
5. **Error Masking**: Don't expose API errors to clients
6. **Audit Logging**: Log all AI interactions for compliance

#### Performance Optimization

1. **Provider Selection**: Use fastest provider (Groq) for simple queries
2. **Request Batching**: Batch multiple requests when possible
3. **Response Caching**: Cache responses for frequently asked questions
4. **Connection Pooling**: Reuse HTTP connections
5. **Timeout Management**: Set appropriate timeouts per provider
6. **Load Balancing**: Distribute across multiple provider accounts

#### Cost Optimization

1. **Provider Routing**: Route to cheapest provider for task type
2. **Token Limits**: Set max_tokens based on use case
3. **Temperature Tuning**: Use lower temperature for deterministic tasks
4. **Model Selection**: Use smaller models when sufficient
5. **Usage Monitoring**: Track costs per provider/model/user
6. **Free Tiers**: Leverage free tiers (Gemini, Groq)

#### Best Practices

1. **Fallback Strategy**: Always have fallback providers configured
2. **Error Handling**: Implement comprehensive error handling
3. **Logging**: Log all requests for debugging and analytics
4. **Monitoring**: Monitor provider availability and latency
5. **Testing**: Test with real API keys in staging
6. **Versioning**: Version your AI integrations
7. **Documentation**: Keep provider-specific docs updated

---

## Future Services

### Phase 1 (P0 - Critical)

- ✅ monitoring-service.js (Complete)
- ✅ auth-service.js (Complete)
- ✅ azure-ai-service.js (Complete)
- ✅ ai-chat-service.js (Complete)

### Phase 2-5

See [SERVICE-EXTRACTION-PLAN.md](../docs/architecture/SERVICE-EXTRACTION-PLAN.md) for the complete roadmap.

## Contributing

When adding a new service:

1. Create service file in `services/`
2. Create tests in `tests/services/`
3. Update this README with service documentation
4. Add integration examples
5. Update SERVICE-EXTRACTION-PLAN.md

## License

ISC
