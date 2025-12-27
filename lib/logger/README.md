# Production Logger System

Enterprise-grade logging infrastructure for AILYDIAN Ultra Pro platform.

## Features

### ✅ Implemented

- **Winston-based Logging**: Industry-standard logging framework
- **PII/Secret Redaction**: Automatic removal of sensitive data (passwords, tokens, API keys, SSN, credit cards)
- **Structured JSON Logging**: Machine-readable logs for production
- **Multiple Transports**:
  - Console (development)
  - File rotation (local development)
  - Azure Application Insights (production)
- **Request/Response Logging**: Automatic HTTP request/response tracking
- **Performance Monitoring**: Request duration tracking with slow request detection
- **Error Tracking**: Comprehensive error logging with stack traces
- **Console Override**: Production console.log/warn/error automatically redirected to Winston

## Usage

### Basic Logging

```javascript
const logger = require('./lib/logger/production-logger');

// Different log levels
logger.error('Database connection failed', { error: err, dbHost: 'localhost' });
logger.warn('Rate limit approaching', { userId: 123, requests: 95 });
logger.info('User logged in', { userId: 123, ip: '192.168.1.1' });
logger.debug('Cache hit', { key: 'user:123', ttl: 3600 });
```

### Request Logging

Request logging middleware is automatically applied to all routes:

```javascript
// Automatically logs:
// - Incoming requests (method, URL, IP, user agent)
// - Outgoing responses (status code, duration)
// - Slow requests (>1000ms)
```

### Performance Timing

```javascript
const logger = require('./lib/logger/production-logger');

const endTimer = logger.time('database-query');
// ... perform operation
const duration = endTimer(); // Logs: "Timer: database-query { duration_ms: 45 }"
```

### Azure Application Insights Integration

```javascript
const { trackEvent, trackMetric, trackDependency } = require('./lib/logger/azure-insights-transport');

// Track custom events
trackEvent('user-registration', { plan: 'premium', referrer: 'google' });

// Track custom metrics
trackMetric('active-users', 1542, { region: 'us-east' });

// Track external dependencies
trackDependency('OpenAI API', 'chat-completion', 1250, true, { model: 'gpt-4' });
```

## Configuration

### Environment Variables

```bash
# Required for Azure Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://...
APPINSIGHTS_INSTRUMENTATIONKEY=your-key

# Optional
LOG_LEVEL=info                    # error, warn, info, debug
LOG_TO_CONSOLE=true               # Enable console output in production
AZURE_CLOUD_ROLE_NAME=ailydian-ultra-pro
AZURE_CLOUD_ROLE_INSTANCE=production-1
```

### Log Levels

- **error**: Critical errors requiring immediate attention
- **warn**: Warning conditions (e.g., deprecated API usage, slow requests)
- **info**: General informational messages (default production level)
- **debug**: Detailed debugging information (development only)

## Security Features

### Automatic PII Redaction

The logger automatically redacts sensitive information:

```javascript
logger.info('User data', {
  username: 'john',
  password: 'secret123',      // Redacted
  token: 'Bearer xyz...',     // Redacted
  ssn: '123-45-6789',         // Redacted
  email: 'john@example.com'   // Preserved
});

// Output: { username: 'john', password: '[REDACTED]', token: '[REDACTED]', ssn: '[REDACTED]', email: 'john@example.com' }
```

### Protected Fields

- Passwords, tokens, API keys
- Social Security Numbers (SSN)
- Credit card numbers
- Private keys
- Session tokens
- Two-factor secrets
- Backup codes

### Pattern-based Redaction

- Bearer tokens: `Bearer abc123...` → `[REDACTED]`
- OpenAI keys: `sk-proj-abc...` → `[REDACTED]`
- Anthropic keys: `sk-ant-...` → `[REDACTED]`
- Long hex strings (32+ chars)
- Credit card numbers (13-19 digits)
- SSN format: `123-45-6789`

## Production Deployment

### Vercel Serverless

In Vercel environment:
- File transports disabled (ephemeral filesystem)
- Console transport with JSON format
- Azure Insights enabled (recommended)
- Automatic log flushing on function completion

### Local Development

In local environment:
- Console transport with colored output
- File rotation (10MB per file, 5 files max)
- Separate error.log and combined.log
- Exception/rejection handlers

## Performance

- **Zero overhead** when log level filters out messages
- **Async writes** to prevent blocking
- **Automatic batching** for Azure Insights
- **Request ID tracking** for distributed tracing

## Monitoring & Alerts

### Azure Application Insights Dashboard

View in Azure Portal:
1. **Live Metrics**: Real-time request/response metrics
2. **Application Map**: Service dependency visualization
3. **Performance**: Request duration percentiles (p50, p95, p99)
4. **Failures**: Error rates and exception tracking
5. **Custom Events**: Business metrics and user actions

### Alert Rules (Recommended)

```yaml
- Error rate > 1% for 5 minutes
- P95 response time > 1000ms for 10 minutes
- Failed dependency calls > 5% for 5 minutes
- Exception count > 10 in 1 minute
```

## File Structure

```
lib/logger/
├── production-logger.js           # Main Winston logger
├── azure-insights-transport.js    # Azure Application Insights transport
├── README.md                      # This file
lib/middleware/
├── request-logger.js              # HTTP request/response logging middleware
```

## Migration from console.log

### Before (Discouraged)

```javascript
console.log('User logged in:', userId);
console.error('Database error:', error);
```

### After (Recommended)

```javascript
logger.info('User logged in', { userId });
logger.error('Database error', { error });
```

## Testing

```bash
# Test logger locally
NODE_ENV=development node -e "
  const logger = require('./lib/logger/production-logger');
  logger.info('Test message', { foo: 'bar' });
  logger.error('Test error', { error: new Error('Test') });
"

# Test with sensitive data redaction
node -e "
  const logger = require('./lib/logger/production-logger');
  logger.info('Sensitive test', {
    user: 'john',
    password: 'secret123',
    token: 'Bearer abc123',
    ssn: '123-45-6789'
  });
"
```

## Troubleshooting

### Logs not appearing in Azure

1. Check `APPLICATIONINSIGHTS_CONNECTION_STRING` is set correctly
2. Verify network connectivity to Azure
3. Check Application Insights resource in Azure Portal
4. Enable `LOG_TO_CONSOLE=true` to see local output

### Slow performance

1. Reduce log level in production (use `info` instead of `debug`)
2. Disable console transport in production (remove `LOG_TO_CONSOLE`)
3. Check Azure Insights ingestion limits

### PII still appearing in logs

1. Add new sensitive field to `SENSITIVE_FIELDS` array
2. Add regex pattern to `SENSITIVE_PATTERNS` array
3. Test with example sensitive data

## Best Practices

1. ✅ Use structured logging with metadata objects
2. ✅ Include request IDs for traceability
3. ✅ Log at appropriate levels (error for failures, info for successes)
4. ✅ Use performance timing for slow operations
5. ❌ Don't log sensitive user data (PII, passwords, tokens)
6. ❌ Don't log entire large objects (use selective fields)
7. ❌ Don't use console.log in production code (use logger instead)

## Future Enhancements

- [ ] Sentry integration for error tracking
- [ ] OpenTelemetry distributed tracing
- [ ] Elasticsearch integration for log aggregation
- [ ] Custom dashboard templates
- [ ] Automated log analysis with AI
- [ ] Cost optimization for Azure Insights

---

**Status**: ✅ Production Ready
**Last Updated**: 2025-12-27
**Maintained By**: AILYDIAN DevOps Team
