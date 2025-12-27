# Redis Cache Manager

Enterprise-grade distributed caching system for AILYDIAN Ultra Pro platform.

## Features

### ✅ Implemented

- **Redis-based Caching**: Distributed cache compatible with serverless (Vercel)
- **Automatic Fallback**: Gracefully falls back to in-memory cache when Redis unavailable
- **Connection Pooling**: Efficient Redis connection management with ioredis
- **Health Monitoring**: Automatic health checks and reconnection
- **Performance Tracking**: Hit/miss rates, latency metrics
- **Multiple Cache Namespaces**: memory, session, aiResponse, static
- **TTL Management**: Configurable time-to-live per cache type
- **Sync/Async API**: Backwards compatible sync API + modern async API

## Why Redis?

### Problem with In-Memory Cache (NodeCache)

- ❌ **Serverless Incompatible**: Each Vercel function instance has its own memory
- ❌ **No Persistence**: Cache lost on function cold start
- ❌ **No Sharing**: Cache not shared across instances
- ❌ **Scalability**: Doesn't scale horizontally

### Solution: Redis

- ✅ **Serverless Compatible**: External distributed cache
- ✅ **Persistent**: Data survives function restarts
- ✅ **Shared**: All instances share the same cache
- ✅ **Scalable**: Horizontal scaling with Redis cluster
- ✅ **Fast**: Sub-millisecond response times

## Usage

### Basic Usage (Backwards Compatible)

```javascript
const cacheManager = require('./lib/cache/redis-cache-manager');

// Get from cache (synchronous - uses memory fallback)
const value = cacheManager.get('aiResponse', 'key');

// Set to cache (synchronous - uses memory fallback)
cacheManager.set('aiResponse', 'key', { data: 'value' }, 3600);

// Delete from cache
cacheManager.delete('aiResponse', 'key');

// Flush cache
cacheManager.flush('aiResponse'); // Flush specific type
cacheManager.flush('all');        // Flush all caches
```

### Modern Async API (Recommended for Redis)

```javascript
const cacheManager = require('./lib/cache/redis-cache-manager');

// Get from cache (async - uses Redis)
const value = await cacheManager.getAsync('aiResponse', 'key');

// Set to cache (async - uses Redis)
await cacheManager.setAsync('aiResponse', 'key', { data: 'value' }, 3600);

// Delete from cache (async)
await cacheManager.deleteAsync('aiResponse', 'key');

// Flush cache (async)
await cacheManager.flushAsync('aiResponse');
```

## Cache Types

| Type | Default TTL | Purpose |
|------|-------------|---------|
| `memory` | 600s (10 min) | Short-term temporary data |
| `session` | 1800s (30 min) | User session data |
| `aiResponse` | 3600s (1 hour) | AI model responses |
| `static` | 86400s (24 hours) | Static content, rarely changing data |

## Configuration

### Environment Variables

```bash
# Local Development (Docker or local Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=ailydian:

# Production (Upstash Redis for Vercel)
REDIS_HOST=your-redis-12345.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-password
REDIS_DB=0
REDIS_KEY_PREFIX=ailydian:prod:
```

### Vercel Production Setup

For Vercel deployment, use **Upstash Redis** (serverless-optimized):

1. Create Upstash Redis database: https://console.upstash.com/
2. Get connection details from Upstash dashboard
3. Add to Vercel environment variables:
   ```
   REDIS_HOST=your-redis.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=your-password
   ```

## Fallback Behavior

The cache manager automatically falls back to in-memory NodeCache when:

- Redis connection fails
- Redis is unreachable
- Redis credentials are invalid
- REDIS_HOST is not configured

```javascript
// Always check stats to see current mode
const stats = cacheManager.getStats();
console.log(stats.mode); // 'redis' or 'memory'
```

## Performance Monitoring

### Get Cache Statistics

```javascript
const stats = cacheManager.getStats();
console.log(stats);

// Output:
{
  mode: 'redis',              // or 'memory'
  connected: true,
  hitRates: {
    memory: 85,               // 85% hit rate
    session: 92,
    aiResponse: 78,
    static: 99
  },
  hitCounts: { ... },
  missCounts: { ... },
  totalRequests: 15432
}
```

### Health Check

```javascript
const health = await cacheManager.healthCheck();
console.log(health);

// Output:
{
  healthy: true,
  mode: 'redis',
  latency_ms: 2,
  host: 'localhost',
  port: 6379
}
```

## Production Deployment

### 1. Local Development

```bash
# Start Redis with Docker
docker run -d \
  --name ailydian-redis \
  -p 6379:6379 \
  redis:7-alpine

# Or install Redis locally (macOS)
brew install redis
brew services start redis
```

### 2. Vercel Deployment

**Option A: Upstash Redis (Recommended)**

```bash
# Create Upstash account and database
# Copy connection details to Vercel environment variables
vercel env add REDIS_HOST
vercel env add REDIS_PORT
vercel env add REDIS_PASSWORD
```

**Option B: Azure Cache for Redis**

```bash
# Create Azure Redis Cache
az redis create \
  --name ailydian-redis \
  --resource-group ailydian-rg \
  --location eastus \
  --sku Basic \
  --vm-size c0

# Get connection details
az redis list-keys --name ailydian-redis --resource-group ailydian-rg
```

## Migration from NodeCache

The new Redis cache manager is **100% backwards compatible** with the old NodeCache implementation:

```javascript
// Before (NodeCache)
const cacheManager = new CacheManager();
const value = cacheManager.get('aiResponse', 'key');
cacheManager.set('aiResponse', 'key', value, 3600);

// After (Redis - no code changes required!)
const cacheManager = require('./lib/cache/redis-cache-manager');
const value = cacheManager.get('aiResponse', 'key');
cacheManager.set('aiResponse', 'key', value, 3600);
```

All existing code continues to work without modifications!

## Testing

### Test Script

```javascript
const cacheManager = require('./lib/cache/redis-cache-manager');

// Test set/get
await cacheManager.setAsync('memory', 'test-key', { foo: 'bar' }, 60);
const value = await cacheManager.getAsync('memory', 'test-key');
console.log(value); // { foo: 'bar' }

// Test health
const health = await cacheManager.healthCheck();
console.log('Redis health:', health);

// Test stats
const stats = cacheManager.getStats();
console.log('Cache stats:', stats);
```

### Performance Benchmarks

```javascript
const start = Date.now();

// Write 1000 cache entries
for (let i = 0; i < 1000; i++) {
  await cacheManager.setAsync('memory', `key-${i}`, { data: i });
}

// Read 1000 cache entries
for (let i = 0; i < 1000; i++) {
  await cacheManager.getAsync('memory', `key-${i}`);
}

const duration = Date.now() - start;
console.log(`1000 writes + 1000 reads: ${duration}ms`);
// Expected: < 500ms for Redis, < 100ms for memory fallback
```

## Monitoring & Alerts

### Azure Application Insights

Cache metrics are automatically sent to Azure Insights:

- `cache_hit_rate_memory`
- `cache_hit_rate_session`
- `cache_hit_rate_ai_response`
- `cache_hit_rate_static`

### Recommended Alerts

```yaml
- Cache hit rate < 50% for 15 minutes
- Redis connection failures > 10 in 5 minutes
- Cache latency > 100ms (p95)
- Memory fallback mode for > 5 minutes
```

## Best Practices

1. ✅ Use async methods (`getAsync`, `setAsync`) when possible for Redis
2. ✅ Set appropriate TTLs based on data volatility
3. ✅ Monitor hit rates to optimize caching strategy
4. ✅ Use health checks before critical operations
5. ❌ Don't cache sensitive data (PII, passwords, tokens)
6. ❌ Don't set TTL > 24 hours for frequently changing data
7. ❌ Don't use cache as primary data store (use database)

## Troubleshooting

### Cache not working in production

1. Check Redis connection:
   ```bash
   vercel logs --follow
   # Look for "Redis connected" message
   ```

2. Verify environment variables:
   ```bash
   vercel env ls
   ```

3. Test Redis connectivity:
   ```bash
   redis-cli -h your-redis.upstash.io -p 6379 -a your-password PING
   # Expected: PONG
   ```

### High memory usage

1. Check cache sizes:
   ```javascript
   const stats = cacheManager.getStats();
   ```

2. Reduce TTLs or maxKeys in memory fallback

3. Use Redis with eviction policy:
   ```bash
   # In redis.conf
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

### Slow cache performance

1. Check Redis latency:
   ```javascript
   const health = await cacheManager.healthCheck();
   console.log(health.latency_ms); // Should be < 10ms
   ```

2. Monitor network latency between Vercel and Redis

3. Consider using Vercel Edge Functions with Upstash Edge

## Future Enhancements

- [ ] Cache compression for large objects
- [ ] Cache warming on cold starts
- [ ] Multi-tier caching (L1: memory, L2: Redis)
- [ ] Cache invalidation events
- [ ] Automatic cache optimization based on hit rates
- [ ] Redis cluster support for high availability

---

**Status**: ✅ Production Ready
**Last Updated**: 2025-12-27
**Maintained By**: AILYDIAN DevOps Team
