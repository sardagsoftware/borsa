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

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Basic health check |
| GET | `/api/status` | Detailed server status |
| GET | `/api/health-status` | API health monitor status |
| GET | `/api/health-monitor` | Comprehensive monitoring data |
| GET | `/api/database/health` | Database health check |
| GET | `/api/cache/health` | Cache health check |
| GET | `/api/storage/health` | Storage health check |
| POST | `/api/alerts/webhook` | Alert processing webhook |

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
  enableHealthMonitor: true
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

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONITORING_PORT` | No | 3101 | Service port |
| `SENTRY_DSN` | No | - | Sentry error tracking DSN |
| `SENTRY_ENABLED` | No | false | Enable Sentry in non-production |
| `NODE_ENV` | No | development | Runtime environment |
| `LOG_LEVEL` | No | info | Logging level |

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
  enableHealthMonitor: true
});

// Mount the service routes
app.use('/monitoring', monitoringService.getApp());

// Access health monitor directly
const healthMonitor = monitoringService.getHealthMonitor();
```

3. **Use in WebSocket broadcasts:**
```javascript
healthMonitor.on('healthUpdate', (healthData) => {
  broadcastToStatusSubscribers({
    type: 'status-update',
    data: healthMonitor.getStatusForAPI()
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
      - "3101:3101"
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
          value: "production"
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

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/google/callback` | Google callback |
| GET | `/api/auth/microsoft` | Microsoft OAuth login |
| GET | `/api/auth/microsoft/callback` | Microsoft callback |
| GET | `/api/auth/github` | GitHub OAuth login |
| GET | `/api/auth/github/callback` | GitHub callback |
| GET | `/api/auth/apple` | Apple OAuth login |
| POST | `/api/auth/apple/callback` | Apple callback |

**JWT Authentication:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/verify` | Verify JWT token |

**Utilities:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/check-email` | Check if email exists |
| POST | `/api/auth/generate-api-key` | Generate API key |

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
  enableOAuth: true
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

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTH_PORT` | No | 3102 | Service port |
| `JWT_SECRET` | Yes (Prod) | - | JWT secret key (min 32 chars) |
| `JWT_EXPIRY` | No | 24h | Token expiration time |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth client secret |
| `MICROSOFT_CLIENT_ID` | No | - | Microsoft OAuth client ID |
| `MICROSOFT_CLIENT_SECRET` | No | - | Microsoft OAuth client secret |
| `GITHUB_CLIENT_ID` | No | - | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | - | GitHub OAuth client secret |
| `APPLE_CLIENT_ID` | No | - | Apple OAuth client ID |
| `APPLE_TEAM_ID` | No | - | Apple team ID |
| `APPLE_KEY_ID` | No | - | Apple key ID |
| `APPLE_PRIVATE_KEY` | No | - | Apple private key |

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

| Role | Level | Rate Limit | Description |
|------|-------|------------|-------------|
| GUEST | 0 | 100/hour | Unauthenticated users |
| USER | 10 | 1,000/hour | Standard authenticated users |
| DEVELOPER | 20 | 5,000/hour | Developer accounts |
| PREMIUM | 30 | 50,000/hour | Premium subscribers |
| ENTERPRISE | 40 | 500,000/hour | Enterprise customers |
| ADMIN | 100 | 1,000,000/hour | System administrators |

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
          value: "production"
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

## Future Services

### Phase 1 (P0 - Critical)
- ✅ monitoring-service.js (Complete)
- ✅ auth-service.js (Complete)
- ⏳ azure-ai-service.js (In Progress)
- ⏳ ai-chat-service.js (Planned)

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
