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

## Future Services

### Phase 1 (P0 - Critical)
- ✅ monitoring-service.js (Complete)
- ⏳ auth-service.js (In Progress)
- ⏳ azure-ai-service.js (Planned)
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
