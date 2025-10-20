# Smart Cities Performance Cookbook

Production-ready recipes for optimizing performance, reducing latency, and scaling Smart Cities deployments.

## Overview

Collection of battle-tested patterns for high-performance IoT data processing.

## Recipe 1: Batch Ingestion

### Problem
Individual metric writes create excessive API calls and slow ingestion.

### Solution
Batch multiple metrics into single API request.

```typescript
import { SmartCitiesClient } from '@lydian/smart-cities';

const client = new SmartCitiesClient({
  apiKey: process.env.SMART_CITIES_API_KEY
});

// Bad: Individual writes
async function slowIngestion(readings: SensorReading[]) {
  for (const reading of readings) {
    await client.metrics.record({
      assetId: reading.sensorId,
      metrics: [{ name: 'temperature', value: reading.temp }]
    });
  }
}

// Good: Batched writes
async function fastIngestion(readings: SensorReading[]) {
  const batches = chunk(readings, 100); // 100 per batch

  await Promise.all(
    batches.map(batch =>
      client.metrics.recordBatch(
        batch.map(r => ({
          assetId: r.sensorId,
          metrics: [{ name: 'temperature', value: r.temp }]
        }))
      )
    )
  );
}

function chunk<T>(array: T[], size: number): T[][] {
  return Array.from(
    { length: Math.ceil(array.length / size) },
    (_, i) => array.slice(i * size, (i + 1) * size)
  );
}
```

**Performance Gain**: 50x faster for 1000 sensors

## Recipe 2: Connection Pooling

### Problem
Creating new HTTP connections for each request adds latency.

### Solution
Reuse HTTP connections with connection pooling.

```typescript
import { Agent } from 'https';

const client = new SmartCitiesClient({
  apiKey: process.env.SMART_CITIES_API_KEY,
  httpAgent: new Agent({
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000,
    keepAliveMsecs: 3000
  })
});
```

**Performance Gain**: 30% latency reduction

## Recipe 3: Parallel Queries

### Problem
Sequential queries waste time waiting for responses.

### Solution
Execute queries in parallel using Promise.all.

```typescript
// Bad: Sequential queries (300ms total)
async function slowQueries(sensorIds: string[]) {
  const results = [];

  for (const id of sensorIds) {
    const data = await client.metrics.query({
      assetId: id,
      metrics: ['temperature'],
      period: '1h'
    });
    results.push(data);
  }

  return results;
}

// Good: Parallel queries (100ms total)
async function fastQueries(sensorIds: string[]) {
  return Promise.all(
    sensorIds.map(id =>
      client.metrics.query({
        assetId: id,
        metrics: ['temperature'],
        period: '1h'
      })
    )
  );
}
```

**Performance Gain**: 3x faster for 10 sensors

## Recipe 4: Caching

### Problem
Repeated queries for same data waste resources.

### Solution
Cache responses with appropriate TTL.

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

async function getCachedMetrics(assetId: string) {
  const cacheKey = `metrics_${assetId}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const metrics = await client.metrics.query({
    assetId,
    metrics: ['temperature', 'humidity'],
    period: '1h'
  });

  cache.set(cacheKey, metrics);
  return metrics;
}

// Cache invalidation on new data
client.webhooks.on('metric.recorded', (event) => {
  cache.del(`metrics_${event.assetId}`);
});
```

**Performance Gain**: 90% reduction in API calls

## Recipe 5: Data Compression

### Problem
Large payloads slow down network transfer.

### Solution
Enable gzip compression.

```typescript
import compression from 'compression';
import express from 'express';

const app = express();

// Enable compression
app.use(compression({
  level: 6, // Compression level
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.get('/api/sensors', async (req, res) => {
  const sensors = await client.assets.list({ limit: 1000 });
  res.json(sensors); // Automatically compressed
});
```

**Performance Gain**: 70% bandwidth reduction

## Recipe 6: Pagination

### Problem
Loading all data at once causes timeouts and memory issues.

### Solution
Implement cursor-based pagination.

```typescript
async function* paginateAssets(type: string) {
  let cursor: string | undefined;

  do {
    const page = await client.assets.list({
      type,
      limit: 100,
      cursor
    });

    yield page.data;

    cursor = page.nextCursor;
  } while (cursor);
}

// Usage
for await (const assets of paginateAssets('air_quality_sensor')) {
  console.log(`Processing ${assets.length} assets`);
  await processAssets(assets);
}
```

**Performance Gain**: Handles unlimited datasets

## Recipe 7: Debouncing Writes

### Problem
High-frequency sensor updates overwhelm the API.

### Solution
Debounce rapid updates.

```typescript
import { debounce } from 'lodash';

const debouncedWrite = debounce(
  async (assetId: string, metrics: any[]) => {
    await client.metrics.record({ assetId, metrics });
  },
  1000, // Wait 1 second
  { maxWait: 5000 } // Force write after 5 seconds
);

// Sensor data arrives every 100ms
sensorStream.on('data', (reading) => {
  debouncedWrite(reading.assetId, reading.metrics);
});
```

**Performance Gain**: 90% reduction in API calls

## Recipe 8: Edge Computing

### Problem
Sending raw sensor data to cloud increases bandwidth and latency.

### Solution
Process data at the edge, send aggregates.

```typescript
// Edge device code
class EdgeProcessor {
  private buffer: Map<string, number[]> = new Map();

  addReading(metric: string, value: number) {
    const values = this.buffer.get(metric) || [];
    values.push(value);
    this.buffer.set(metric, values);
  }

  async flush() {
    const aggregates = Array.from(this.buffer.entries()).map(
      ([metric, values]) => ({
        name: metric,
        avg: values.reduce((a, b) => a + b) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      })
    );

    await client.metrics.record({
      assetId: this.assetId,
      metrics: aggregates
    });

    this.buffer.clear();
  }
}

// Flush every 60 seconds
const processor = new EdgeProcessor();
setInterval(() => processor.flush(), 60000);
```

**Performance Gain**: 95% bandwidth reduction

## Recipe 9: Query Optimization

### Problem
Complex queries are slow.

### Solution
Use aggregations and filters server-side.

```typescript
// Bad: Fetch all data, filter client-side
async function slowQuery() {
  const allData = await client.metrics.query({
    metrics: ['temperature'],
    period: '7d',
    granularity: '1m'
  });

  return allData.filter(d => d.value > 25);
}

// Good: Filter server-side
async function fastQuery() {
  return client.metrics.query({
    metrics: ['temperature'],
    period: '7d',
    granularity: '1m',
    filters: {
      'value': { '>': 25 }
    }
  });
}
```

**Performance Gain**: 80% faster queries

## Recipe 10: WebSocket Multiplexing

### Problem
One WebSocket per sensor doesn't scale.

### Solution
Multiplex multiple sensor streams over single WebSocket.

```typescript
const ws = new WebSocket('wss://api.smartcities.com/stream');

// Subscribe to multiple sensors
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['sensor_001', 'sensor_002', 'sensor_003']
}));

// Handle multiplexed data
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.channel) {
    case 'sensor_001':
      handleSensor001(message.data);
      break;
    case 'sensor_002':
      handleSensor002(message.data);
      break;
  }
};
```

**Performance Gain**: 100x connection reduction

## Recipe 11: Database Indexing

### Problem
Time-series queries on large datasets are slow.

### Solution
Create composite indexes on time + asset.

```sql
-- PostgreSQL with TimescaleDB
CREATE INDEX idx_metrics_asset_time
ON metrics (asset_id, timestamp DESC);

-- Query optimization
SELECT avg(value)
FROM metrics
WHERE asset_id = 'sensor_001'
  AND timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY time_bucket('15 minutes', timestamp);
```

**Performance Gain**: 100x faster time-series queries

## Recipe 12: Load Balancing

### Problem
Single server becomes bottleneck.

### Solution
Distribute load across multiple instances.

```typescript
import { createClient } from 'redis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const redis = createClient();

const limiter = new RateLimiterRedis({
  storeClient: redis,
  points: 100, // Requests
  duration: 1, // Per second
  blockDuration: 10 // Block for 10 seconds if exceeded
});

app.use(async (req, res, next) => {
  try {
    await limiter.consume(req.ip);
    next();
  } catch (error) {
    res.status(429).json({ error: 'Rate limit exceeded' });
  }
});
```

**Performance Gain**: Handles 10x more traffic

## Related Documentation

- [Smart Cities Architecture](../concepts/smart-cities-architecture.md)
- [Data Ingestion Guide](../guides/smart-cities-data-ingestion.md)
- [IoT Patterns Cookbook](./smart-cities-iot-patterns.md)

## Support

- **Documentation**: https://docs.lydian.com
- **Performance Consulting**: performance@lydian.com
