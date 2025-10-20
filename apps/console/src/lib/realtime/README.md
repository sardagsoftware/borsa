# Realtime System Documentation

## Overview

The Lydian Console Realtime System provides WebSocket-based live data streaming with SSE fallback, HMAC authentication, RBAC enforcement, and backpressure handling.

## Architecture

```
┌─────────────┐         WebSocket/SSE          ┌──────────────┐
│   Browser   │◄────────────────────────────────│   Gateway    │
│   Client    │    HMAC Auth + RBAC            │   Server     │
└─────────────┘                                 └──────────────┘
                                                       │
                                                       ▼
                                                 ┌──────────────┐
                                                 │   Topics     │
                                                 │   Registry   │
                                                 └──────────────┘
                                                       │
                                         ┌─────────────┼─────────────┐
                                         ▼             ▼             ▼
                                    kpis.s2    liveops.events  economy.patch
```

## Topics

### Available Topics

- **kpis.s2** - Season 2 KPI metrics (crash-free, performance, retention)
  - Required scope: `ops.admin`
  - Update frequency: ~10s

- **liveops.events** - Live operations events (new events, changes)
  - Required scope: `liveops.admin`
  - Update frequency: Real-time

- **economy.patch** - Economy balance updates (earn/spend, inflation)
  - Required scope: `economy.admin`
  - Update frequency: ~30s

- **ab.status** - A/B experiment status changes
  - Required scope: `liveops.admin`
  - Update frequency: Real-time

## Client Usage

### Basic Usage

```typescript
import { useRealtime } from '@/lib/realtime/client/useRealtime';

function MyComponent() {
  const { data, connected, error, stats } = useRealtime<KPIData>('kpis.s2', {
    scopes: ['ops.admin'],
  });

  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <div>Status: {connected ? 'Live' : 'Offline'}</div>
      <div>Crash-free: {data.crash_free}%</div>
      <div>Messages: {stats.messagesReceived}</div>
    </div>
  );
}
```

### Multiple Topics

```typescript
import { useRealtimeMulti } from '@/lib/realtime/client/useRealtime';

function Dashboard() {
  const topics = useRealtimeMulti<any>(['kpis.s2', 'liveops.events'], {
    scopes: ['ops.admin', 'liveops.admin'],
  });

  return (
    <div>
      <div>KPIs: {topics['kpis.s2'].data?.crash_free}%</div>
      <div>Events: {topics['liveops.events'].data?.length}</div>
    </div>
  );
}
```

### Connection Only

```typescript
import { useRealtimeConnection } from '@/lib/realtime/client/useRealtime';

function StatusIndicator() {
  const { connected, stats } = useRealtimeConnection();

  return (
    <div>
      <span className={connected ? 'online' : 'offline'}>
        {connected ? '● Live' : '○ Offline'}
      </span>
      <span>Reconnects: {stats.reconnectCount}</span>
    </div>
  );
}
```

## Server Integration

### 1. Install Dependencies

```bash
npm install ws
```

### 2. Create HTTP Server

```typescript
import http from 'http';
import { startWebSocketServer } from '@/lib/realtime/server/ws';
import { createSSEHandler } from '@/lib/realtime/server/sse';

const app = /* your Express/Next.js app */;
const server = http.createServer(app);

// Start WebSocket server
const WS_SECRET = process.env.WS_HMAC_SECRET!;
const wss = startWebSocketServer(server, WS_SECRET);

// Add SSE endpoint
app.get('/rt/sse', createSSEHandler(WS_SECRET));

server.listen(3100);
```

### 3. Broadcast Updates

```typescript
import { fanout } from '@/lib/realtime/server/topics';

// From your data pipeline
setInterval(() => {
  fanout('kpis.s2', {
    crash_free: 99.2,
    p95_gpu: 15.8,
    ts: Date.now(),
  });
}, 10000);

// From event handlers
eventEmitter.on('newEvent', (event) => {
  fanout('liveops.events', { id: event.id, when: Date.now() });
});
```

## Security

### HMAC Authentication

All connections must provide valid HMAC signature:

```
ws://localhost:3100/rt?ts=1234567890&nonce=abc123&sig=abcdef...&scopes=ops.admin
```

Parameters:
- `ts` - Unix timestamp (seconds)
- `nonce` - Random 16-char hex string
- `sig` - HMAC-SHA256(ts.nonce.body, secret)
- `scopes` - Comma-separated list of scopes

### RBAC Enforcement

Topics require specific scopes:

| Topic | Required Scope(s) |
|-------|------------------|
| kpis.s2 | ops.admin |
| liveops.events | liveops.admin |
| economy.patch | economy.admin |
| ab.status | liveops.admin |

### Replay Attack Prevention

- Timestamp must be within 5-minute window
- Nonces are tracked and rejected if reused
- Production: Use Redis for distributed nonce storage

## Performance

### Backpressure Handling

- Buffer limit: 1MB per connection
- Queue limit: 200 messages
- Strategy: Drop oldest messages when full
- Flush interval: 50ms

### Metrics

Target metrics:
- p95 update latency: ≤100ms
- Dropped message rate: <0.5%
- Heartbeat interval: 15s
- Connection timeout: 30s

### Scaling

For production with >1000 concurrent connections:

1. **Use Redis Pub/Sub**
   ```typescript
   import { createClient } from 'redis';
   const redis = createClient();

   // Subscribe to Redis channels
   redis.subscribe('kpis.s2', (message) => {
     fanout('kpis.s2', JSON.parse(message));
   });
   ```

2. **Load Balancer Configuration**
   - Enable sticky sessions
   - Configure WebSocket timeout (300s)
   - Health check: GET /health

3. **Horizontal Scaling**
   - Run multiple gateway instances
   - Share nonce store in Redis
   - Use Redis Pub/Sub for fanout

## Compliance

### KVKK/GDPR

- ✅ No PII in realtime messages
- ✅ Anonymous telemetry only
- ✅ 90-day data retention
- ✅ Attested logs for audit trail
- ✅ Right to disconnect (client.disconnect())

### Security Audit

- ✅ HMAC authentication
- ✅ RBAC enforcement
- ✅ Replay attack prevention
- ✅ TLS in production (wss://)
- ✅ Rate limiting (TODO: implement)
- ✅ SSRF protection (allowlist)

## Monitoring

### Health Check

```bash
curl http://localhost:3100/health
```

### Stats Endpoint

```bash
curl http://localhost:3100/rt/stats
```

Returns:
```json
{
  "total": 42,
  "kpis.s2": 15,
  "liveops.events": 20,
  "economy.patch": 5,
  "ab.status": 2
}
```

### Logs

```
[RT WS] WebSocket server started on /rt
[RT WS] Client connected: { id: 'abc-123', scopes: ['ops.admin'] }
[RT WS] Subscribed: { id: 'abc-123', topic: 'kpis.s2' }
[RT Fanout] kpis.s2: sent=15, dropped=0
```

## Troubleshooting

### Connection Fails

1. Check HMAC signature generation
2. Verify timestamp is within 5-minute window
3. Ensure nonce is unique
4. Check required scopes for topic

### Messages Not Received

1. Verify subscription succeeded (sub.ok message)
2. Check topic name matches exactly
3. Ensure fanout() is being called
4. Check backpressure logs for drops

### High Latency

1. Check backpressure metrics
2. Verify network conditions
3. Increase flush interval if needed
4. Consider batching messages

## Testing

### Manual Testing

```bash
# Test WebSocket connection
wscat -c 'ws://localhost:3100/rt?ts=1234567890&nonce=abc&sig=xyz&scopes=ops.admin'

# Test SSE connection
curl -N 'http://localhost:3100/rt/sse?ts=1234567890&nonce=abc&sig=xyz&scopes=ops.admin'
```

### Unit Tests

```typescript
import { verifyHMAC, rbacHas } from '@/lib/realtime/server/auth';

test('HMAC verification', () => {
  const sig = sign('connect', 'secret');
  expect(verifyHMAC(sig.sig, sig.ts, sig.nonce, 'connect', 'secret')).toBe(true);
});

test('RBAC enforcement', () => {
  expect(rbacHas(['ops.admin'], ['ops.admin'])).toBe(true);
  expect(rbacHas(['ops.admin'], ['liveops.admin'])).toBe(false);
});
```

## Production Checklist

- [ ] Change all secrets (WS_HMAC_SECRET, NEXT_PUBLIC_RT_SECRET)
- [ ] Enable TLS (wss:// protocol)
- [ ] Configure Vault/KMS for secret rotation (≤24h)
- [ ] Set up Redis for distributed nonce storage
- [ ] Enable attested logging
- [ ] Configure monitoring and alerting
- [ ] Set up Redis Pub/Sub for horizontal scaling
- [ ] Configure load balancer with sticky sessions
- [ ] Enable rate limiting
- [ ] Test failover and reconnection
- [ ] Document incident response procedures
- [ ] Perform security penetration testing

## Support

For issues or questions:
- GitHub Issues: https://github.com/ailydian/console/issues
- Security: security@ailydian.com
- Docs: https://docs.ailydian.com/realtime
