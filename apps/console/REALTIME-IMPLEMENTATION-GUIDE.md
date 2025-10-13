# Realtime System Implementation Guide

## ✅ Implementation Complete

The Lydian Console now has a complete realtime data streaming system with:
- WebSocket server with HMAC authentication
- SSE fallback for compatibility
- RBAC enforcement per topic
- Backpressure handling
- Automatic reconnection
- Live dashboard updates

## Quick Start

### 1. Install Dependencies

```bash
npm install ws
# or
pnpm add ws
```

### 2. Set Environment Variables

Copy `.env.local.example` to `.env.local` and update:

```env
WS_HMAC_SECRET=your-production-secret-here
NEXT_PUBLIC_RT_SECRET=your-public-secret-here
NEXT_PUBLIC_API_BASE_URL=http://localhost:3100
```

### 3. Test with Demo Server

```bash
# Terminal 1: Start demo WebSocket server
node realtime-test-demo.js

# Terminal 2: Start Next.js dev server (update NEXT_PUBLIC_API_BASE_URL to localhost:3101)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3101 npm run dev

# Open browser
open http://localhost:3100/kpis
open http://localhost:3100/liveops/s2
```

You should see:
- **● Live** indicator turning green
- KPI metrics updating every 10 seconds
- LiveOps sections highlighting in Lydian gold when live

### 4. Integrate with Production Server

#### Option A: Next.js Custom Server

Create `server.js` in your project root:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { startWebSocketServer } = require('./src/lib/realtime/server/ws');
const { createSSEHandler } = require('./src/lib/realtime/server/sse');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3100;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Start WebSocket server
  const WS_SECRET = process.env.WS_HMAC_SECRET;
  startWebSocketServer(server, WS_SECRET);

  // Add SSE endpoint (if using Express middleware)
  // app.use('/rt/sse', createSSEHandler(WS_SECRET));

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket on ws://${hostname}:${port}/rt`);
  });
});
```

Update `package.json`:

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

#### Option B: Separate Gateway Service

Deploy the WebSocket gateway as a separate service:

```javascript
// services/gateway/index.js
const http = require('http');
const { startWebSocketServer } = require('./realtime/ws');
const { createSSEHandler } = require('./realtime/sse');

const server = http.createServer();
const WS_SECRET = process.env.WS_HMAC_SECRET;

startWebSocketServer(server, WS_SECRET);

server.listen(3200, () => {
  console.log('Gateway running on port 3200');
});
```

Then configure NEXT_PUBLIC_API_BASE_URL to point to the gateway.

### 5. Broadcast Real Data

Connect your data pipeline to fanout messages:

```typescript
import { fanout } from '@/lib/realtime/server/topics';

// From metrics collection
setInterval(async () => {
  const metrics = await fetchMetrics();
  fanout('kpis.s2', {
    crash_free: metrics.crashFree,
    p95_gpu: metrics.p95Gpu,
    // ...
    ts: Date.now(),
  });
}, 10000);

// From event system
eventEmitter.on('newLiveOpsEvent', (event) => {
  fanout('liveops.events', {
    id: event.id,
    type: event.type,
    when: Date.now(),
  });
});

// From economy updates
economyService.on('balanceChange', (balance) => {
  fanout('economy.patch', {
    earn_spend_ratio: balance.earnSpend,
    inflation_index: balance.inflation,
    drops: balance.drops,
  });
});
```

## Production Deployment

### Security Hardening

1. **Change All Secrets**
   ```bash
   # Generate secure secrets
   openssl rand -hex 32  # For WS_HMAC_SECRET
   ```

2. **Enable TLS**
   ```nginx
   server {
     listen 443 ssl;
     ssl_certificate /path/to/cert.pem;
     ssl_certificate_key /path/to/key.pem;

     location /rt {
       proxy_pass http://localhost:3100;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_read_timeout 300s;
     }
   }
   ```

3. **Configure Vault/KMS**
   ```typescript
   import { getSecret } from './vault';

   const WS_SECRET = await getSecret('realtime/hmac-secret');

   // Rotate every 24 hours
   setInterval(async () => {
     const newSecret = await getSecret('realtime/hmac-secret');
     // Update secret atomically
   }, 24 * 60 * 60 * 1000);
   ```

### Scaling

1. **Redis Pub/Sub for Horizontal Scaling**
   ```typescript
   import { createClient } from 'redis';

   const redis = createClient();
   await redis.connect();

   // Subscribe to Redis channels
   await redis.subscribe('realtime:kpis.s2', (message) => {
     fanout('kpis.s2', JSON.parse(message));
   });

   // Publish from data sources
   await redis.publish('realtime:kpis.s2', JSON.stringify(data));
   ```

2. **Load Balancer Configuration**
   ```nginx
   upstream realtime {
     ip_hash;  # Sticky sessions
     server gateway1:3100;
     server gateway2:3100;
     server gateway3:3100;
   }
   ```

3. **Redis for Nonce Storage**
   ```typescript
   import { createClient } from 'redis';

   const redis = createClient();

   export async function checkNonce(nonce: string): Promise<boolean> {
     const exists = await redis.exists(`nonce:${nonce}`);
     if (exists) return false;

     await redis.setex(`nonce:${nonce}`, 300, '1');
     return true;
   }
   ```

### Monitoring

1. **Metrics Collection**
   ```typescript
   import { register, Counter, Histogram } from 'prom-client';

   const wsConnections = new Counter({
     name: 'realtime_connections_total',
     help: 'Total WebSocket connections',
   });

   const messageLatency = new Histogram({
     name: 'realtime_message_latency_ms',
     help: 'Message delivery latency',
   });

   // Expose metrics
   app.get('/metrics', (req, res) => {
     res.set('Content-Type', register.contentType);
     res.end(register.metrics());
   });
   ```

2. **Health Check**
   ```typescript
   app.get('/health', (req, res) => {
     const stats = getStats();
     res.json({
       status: 'ok',
       connections: stats.total,
       topics: stats,
       uptime: process.uptime(),
     });
   });
   ```

3. **Alerting**
   ```yaml
   # Prometheus alerts
   groups:
     - name: realtime
       rules:
         - alert: HighDropRate
           expr: rate(realtime_messages_dropped_total[5m]) > 0.005
           annotations:
             summary: "High message drop rate"

         - alert: HighLatency
           expr: histogram_quantile(0.95, realtime_message_latency_ms) > 100
           annotations:
             summary: "High p95 message latency"
   ```

## Troubleshooting

### Connection Fails

**Problem**: Client can't connect to WebSocket

**Solutions**:
1. Check HMAC signature generation
2. Verify timestamp is within 5-minute window
3. Ensure nonce is unique
4. Check firewall/security group rules
5. Verify TLS certificate if using wss://

### No Messages Received

**Problem**: Connected but not receiving updates

**Solutions**:
1. Check subscription succeeded (look for `sub.ok` message)
2. Verify RBAC scopes match topic requirements
3. Ensure fanout() is being called server-side
4. Check backpressure logs for drops
5. Verify topic name matches exactly

### High Latency

**Problem**: Updates arrive slowly

**Solutions**:
1. Check network latency (ping server)
2. Review backpressure metrics
3. Increase flush interval if needed
4. Consider message batching
5. Check server CPU/memory usage

### Memory Leaks

**Problem**: Memory usage grows over time

**Solutions**:
1. Verify cleanup on disconnect
2. Check for uncleared intervals/timeouts
3. Ensure subscribers are removed from registry
4. Monitor with `process.memoryUsage()`
5. Use heap snapshots to identify leaks

## Testing

### Unit Tests

```typescript
import { verifyHMAC, rbacHas } from '@/lib/realtime/server/auth';
import { sign } from '@/lib/security/hmac';

describe('Realtime Auth', () => {
  test('HMAC verification', () => {
    const sig = sign('connect', 'secret');
    expect(verifyHMAC(sig.sig, sig.ts, sig.nonce, 'connect', 'secret')).toBe(true);
  });

  test('RBAC enforcement', () => {
    expect(rbacHas(['ops.admin'], ['ops.admin'])).toBe(true);
    expect(rbacHas(['ops.admin'], ['liveops.admin'])).toBe(false);
  });
});
```

### Integration Tests

```typescript
import WebSocket from 'ws';

describe('Realtime Integration', () => {
  test('WebSocket connection', async () => {
    const ws = new WebSocket('ws://localhost:3100/rt?...');

    await new Promise((resolve) => {
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.t === 'hello') resolve();
      });
    });

    ws.close();
  });
});
```

### Load Tests

```bash
# Install artillery
npm install -g artillery

# Create test config
cat > load-test.yml <<EOF
config:
  target: 'ws://localhost:3100'
  phases:
    - duration: 60
      arrivalRate: 10
  engines:
    ws:
      timeout: 30000

scenarios:
  - name: "Subscribe to KPIs"
    engine: ws
    flow:
      - send:
          payload: '{"cmd":"subscribe","topic":"kpis.s2"}'
      - think: 30
EOF

# Run test
artillery run load-test.yml
```

## Migration from SWR-Only

If migrating from SWR-only implementation:

1. Keep existing SWR hooks for initial data
2. Add realtime hook alongside:
   ```typescript
   const { data: swrData } = useSWR('/api/kpis');
   const { data: rtData } = useRealtime('kpis.s2');
   const data = rtData || swrData;  // Prefer realtime, fallback to SWR
   ```

3. Gradually migrate to realtime-first
4. Keep SWR as fallback for offline mode

## Support

- Documentation: `src/lib/realtime/README.md`
- Demo server: `node realtime-test-demo.js`
- Issues: https://github.com/ailydian/console/issues
- Security: security@ailydian.com

## License

White-hat only. KVKK/GDPR/PDPL compliant. See LICENSE file.
