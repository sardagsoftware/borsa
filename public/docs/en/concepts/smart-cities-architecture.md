# Smart Cities Platform Architecture

## Overview

The LyDian Smart Cities platform is built on a modern, cloud-native architecture designed for scalability, resilience, and real-time data processing. This document explains the core architectural components, design patterns, and technical decisions that power the platform.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  (Web Apps, Mobile Apps, IoT Devices, Third-Party Systems)      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      API Gateway Layer                           │
│  • Authentication & Authorization (OAuth2, API Keys)             │
│  • Rate Limiting & Throttling                                    │
│  • Request Routing & Load Balancing                              │
│  • API Versioning & Deprecation                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     Service Mesh Layer                           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Cities     │  │   Assets     │  │   Metrics    │         │
│  │   Service    │  │   Service    │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Alerts     │  │  Webhooks    │  │   Events     │         │
│  │   Service    │  │   Service    │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      Data Layer                                  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  PostgreSQL  │  │   TimescaleDB│  │    Redis     │         │
│  │  (Metadata)  │  │ (Time-series)│  │   (Cache)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Kafka       │  │  S3/Object   │  │ Elasticsearch│         │
│  │  (Streaming) │  │   Storage    │  │   (Search)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. API Gateway Layer

The API Gateway serves as the single entry point for all client requests.

**Responsibilities:**
- **Authentication**: Validates OAuth2 tokens, API keys, and HMAC signatures
- **Authorization**: Enforces role-based access control (RBAC) policies
- **Rate Limiting**: Prevents abuse with per-client rate limits (default: 1000 req/hour)
- **Request Routing**: Routes requests to appropriate microservices
- **Protocol Translation**: Supports HTTP/1.1, HTTP/2, and WebSocket
- **Monitoring**: Logs all requests for audit and analytics

**Technology Stack:**
- Kong Gateway or AWS API Gateway
- Redis for rate limit storage
- OpenID Connect (OIDC) for authentication

**Example Rate Limit Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1704067200
Retry-After: 3600
```

### 2. Service Mesh Layer

Microservices architecture with domain-driven design principles.

#### Cities Service
**Purpose**: Manages city entities and metadata.

**Data Model:**
```typescript
interface City {
  id: string;              // ULID
  name: string;
  country: string;
  population: number;
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Operations:**
- `POST /cities` - Create city
- `GET /cities/:id` - Retrieve city
- `PATCH /cities/:id` - Update city
- `DELETE /cities/:id` - Delete city
- `GET /cities` - List cities (paginated)

#### Assets Service
**Purpose**: Manages IoT assets, sensors, and infrastructure.

**Data Model:**
```typescript
interface Asset {
  id: string;
  cityId: string;
  type: AssetType;         // sensor, camera, traffic_light, etc.
  location: GeoJSON;
  status: 'active' | 'inactive' | 'maintenance';
  capabilities: string[];  // ['temperature', 'humidity', 'air_quality']
  metadata: Record<string, any>;
  lastSeenAt: Date;
  createdAt: Date;
}
```

**Asset Types:**
- Environmental sensors (air quality, noise, temperature)
- Traffic infrastructure (cameras, sensors, signals)
- Energy systems (smart meters, solar panels)
- Water infrastructure (flow sensors, quality monitors)
- Public safety (emergency buttons, surveillance)

#### Metrics Service
**Purpose**: Ingests, stores, and queries time-series metrics.

**Data Model:**
```typescript
interface Metric {
  assetId: string;
  timestamp: Date;
  metricType: string;      // 'temperature', 'traffic_flow', 'air_quality'
  value: number;
  unit: string;            // 'celsius', 'vehicles/hour', 'aqi'
  tags: Record<string, string>;
}
```

**Storage Strategy:**
- **Hot data** (last 7 days): In-memory Redis cache for ultra-fast queries
- **Warm data** (8-90 days): TimescaleDB with automatic compression
- **Cold data** (91+ days): S3/Object Storage with Parquet format

**Query Patterns:**
```sql
-- Downsample query (average hourly temperature)
SELECT
  time_bucket('1 hour', timestamp) AS hour,
  AVG(value) AS avg_temp
FROM metrics
WHERE asset_id = 'asset_01HXA2B3C4D5E6F7G8H9J0K1L2'
  AND metric_type = 'temperature'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour DESC;
```

#### Alerts Service
**Purpose**: Monitors metrics, evaluates rules, and triggers notifications.

**Alert Rules Engine:**
```typescript
interface AlertRule {
  id: string;
  name: string;
  cityId: string;
  condition: {
    metricType: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    aggregation: 'avg' | 'sum' | 'max' | 'min' | 'count';
    window: string;        // '5m', '1h', '24h'
  };
  severity: 'critical' | 'high' | 'medium' | 'low';
  actions: Action[];       // webhook, email, sms, slack
  enabled: boolean;
}
```

**Example Alert Rule:**
```json
{
  "name": "High Air Pollution Alert",
  "condition": {
    "metricType": "air_quality_pm25",
    "operator": ">",
    "threshold": 75,
    "aggregation": "avg",
    "window": "1h"
  },
  "severity": "critical",
  "actions": [
    {
      "type": "webhook",
      "url": "https://api.city.gov/alerts",
      "method": "POST"
    },
    {
      "type": "email",
      "recipients": ["env-team@city.gov"]
    }
  ]
}
```

#### Webhooks Service
**Purpose**: Delivers events to external systems via HTTP callbacks.

**Webhook Delivery Guarantees:**
- At-least-once delivery semantics
- Exponential backoff retry (max 5 attempts)
- Retry schedule: 1s, 5s, 25s, 125s, 625s
- Dead letter queue for failed deliveries
- HMAC-SHA256 signature verification

**Webhook Payload:**
```json
{
  "id": "evt_01HXA2B3C4D5E6F7G8H9J0K1L2",
  "type": "alert.triggered",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "alertId": "alert_01HXA2B3C4D5E6F7G8",
    "cityId": "city_01HXA2B3C4D5E6F7",
    "severity": "critical",
    "message": "Air quality PM2.5 exceeded threshold"
  },
  "signature": "sha256=5d41402abc4b2a76b9719d911017c592"
}
```

#### Events Service
**Purpose**: Provides event sourcing and real-time event streaming.

**Event Types:**
- Domain events (city.created, asset.updated, alert.triggered)
- Integration events (webhook.delivered, metric.ingested)
- System events (service.started, backup.completed)

**Event Store:**
- Kafka as event log (retention: 30 days)
- PostgreSQL as event archive (retention: infinite)
- Event replay capability for debugging and analytics

### 3. Data Layer

#### PostgreSQL (Primary Database)
**Usage**: Relational data, metadata, configuration

**Schema Design:**
```sql
-- Cities table
CREATE TABLE cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  population INTEGER,
  timezone TEXT,
  coordinates JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cities_country ON cities(country);
CREATE INDEX idx_cities_coordinates ON cities USING GIST(coordinates);

-- Assets table
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  city_id TEXT REFERENCES cities(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  status TEXT,
  capabilities TEXT[],
  metadata JSONB,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_city ON assets(city_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_location ON assets USING GIST(location);
```

#### TimescaleDB (Time-Series Database)
**Usage**: Metrics, sensor data, historical time-series

**Hypertable Configuration:**
```sql
-- Create hypertable for metrics
CREATE TABLE metrics (
  time TIMESTAMPTZ NOT NULL,
  asset_id TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value DOUBLE PRECISION,
  unit TEXT,
  tags JSONB,
  PRIMARY KEY (time, asset_id, metric_type)
);

SELECT create_hypertable('metrics', 'time');

-- Enable compression (90% storage savings)
ALTER TABLE metrics SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'asset_id,metric_type'
);

SELECT add_compression_policy('metrics', INTERVAL '7 days');

-- Continuous aggregates for fast queries
CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS hour,
  asset_id,
  metric_type,
  AVG(value) AS avg_value,
  MAX(value) AS max_value,
  MIN(value) AS min_value,
  COUNT(*) AS count
FROM metrics
GROUP BY hour, asset_id, metric_type;
```

#### Redis (Cache & Session Store)
**Usage**: API response cache, rate limiting, session storage

**Caching Strategy:**
```typescript
// Cache-aside pattern
async function getCity(cityId: string): Promise<City> {
  // Check cache first
  const cached = await redis.get(`city:${cityId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss - fetch from database
  const city = await db.query('SELECT * FROM cities WHERE id = $1', [cityId]);

  // Store in cache (TTL: 1 hour)
  await redis.setex(`city:${cityId}`, 3600, JSON.stringify(city));

  return city;
}
```

**Rate Limiting:**
```typescript
async function checkRateLimit(clientId: string): Promise<boolean> {
  const key = `ratelimit:${clientId}:${getCurrentHour()}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 3600); // 1 hour window
  }

  return count <= 1000; // Max 1000 requests per hour
}
```

#### Apache Kafka (Event Streaming)
**Usage**: Real-time event streaming, async communication between services

**Topics:**
- `smart-cities.metrics` - Metric ingestion stream
- `smart-cities.alerts` - Alert notifications
- `smart-cities.events` - Domain events
- `smart-cities.webhooks` - Webhook delivery queue

**Producer Example:**
```typescript
await kafka.send({
  topic: 'smart-cities.metrics',
  messages: [{
    key: assetId,
    value: JSON.stringify({
      assetId,
      timestamp: new Date().toISOString(),
      metricType: 'temperature',
      value: 22.5,
      unit: 'celsius'
    }),
    headers: {
      'correlation-id': requestId
    }
  }]
});
```

**Consumer Example:**
```typescript
await kafka.subscribe({
  topic: 'smart-cities.metrics',
  fromBeginning: false
});

await kafka.run({
  eachMessage: async ({ topic, partition, message }) => {
    const metric = JSON.parse(message.value.toString());
    await metricsService.store(metric);
  }
});
```

#### Elasticsearch (Search & Analytics)
**Usage**: Full-text search, log aggregation, analytics

**Index Mapping:**
```json
{
  "mappings": {
    "properties": {
      "assetId": { "type": "keyword" },
      "cityId": { "type": "keyword" },
      "type": { "type": "keyword" },
      "location": { "type": "geo_point" },
      "status": { "type": "keyword" },
      "metadata": { "type": "object", "enabled": false },
      "createdAt": { "type": "date" }
    }
  }
}
```

**Geo Search Example:**
```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "cityId": "city_123" } },
        { "term": { "status": "active" } }
      ],
      "filter": {
        "geo_distance": {
          "distance": "5km",
          "location": {
            "lat": 37.7749,
            "lon": -122.4194
          }
        }
      }
    }
  }
}
```

## Design Patterns

### 1. API Design Patterns

#### RESTful Resource Modeling
All resources follow REST principles with standard HTTP methods.

**Resource Hierarchy:**
```
/cities/{cityId}
/cities/{cityId}/assets
/cities/{cityId}/assets/{assetId}
/cities/{cityId}/assets/{assetId}/metrics
/cities/{cityId}/alerts
/cities/{cityId}/webhooks
```

#### HATEOAS (Hypermedia Links)
Responses include links to related resources.

```json
{
  "id": "city_123",
  "name": "San Francisco",
  "_links": {
    "self": { "href": "/cities/city_123" },
    "assets": { "href": "/cities/city_123/assets" },
    "metrics": { "href": "/cities/city_123/metrics" },
    "alerts": { "href": "/cities/city_123/alerts" }
  }
}
```

#### Idempotency Keys
All mutation operations support idempotency keys to prevent duplicate requests.

```http
POST /cities HTTP/1.1
Idempotency-Key: uuid-4d3e2a1b-c0f9-4e8d-a7b6-5c4d3e2f1a0b
Content-Type: application/json

{
  "name": "San Francisco",
  "country": "USA"
}
```

If the same request is sent twice with the same idempotency key, the second request returns the cached response (409 Conflict or 200 OK with existing resource).

### 2. Microservices Patterns

#### Service Discovery
Services register with a service registry (Consul or AWS Cloud Map) and discover each other dynamically.

```typescript
// Service registration
await serviceRegistry.register({
  name: 'cities-service',
  id: 'cities-001',
  address: '10.0.1.42',
  port: 8080,
  healthCheck: {
    http: 'http://10.0.1.42:8080/health',
    interval: '10s'
  }
});

// Service discovery
const instances = await serviceRegistry.discover('cities-service');
const instance = loadBalancer.choose(instances);
```

#### Circuit Breaker
Prevents cascading failures by failing fast when a downstream service is unhealthy.

```typescript
const breaker = new CircuitBreaker(fetchMetrics, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

breaker.on('open', () => {
  console.error('Circuit breaker opened - service unhealthy');
});

breaker.on('halfOpen', () => {
  console.info('Circuit breaker half-open - testing recovery');
});
```

#### Saga Pattern (Distributed Transactions)
For operations spanning multiple services, use choreography-based sagas.

**Example: Create City with Initial Assets**

1. Cities service creates city → emits `city.created` event
2. Assets service listens to `city.created` → creates default assets → emits `assets.created`
3. Metrics service listens to `assets.created` → initializes metric streams
4. If any step fails → compensating transactions rollback changes

```typescript
// Compensating transaction
eventBus.on('asset.creation.failed', async (event) => {
  const { cityId, reason } = event.data;

  // Rollback: delete the city
  await citiesService.delete(cityId);

  // Notify client
  await webhookService.send({
    type: 'city.creation.failed',
    data: { cityId, reason }
  });
});
```

### 3. Data Patterns

#### Event Sourcing
Store all state changes as immutable events.

```typescript
// Event store
const events = [
  { type: 'CityCreated', data: { id: 'city_123', name: 'SF' }, timestamp: '2024-01-01T00:00:00Z' },
  { type: 'CityUpdated', data: { id: 'city_123', population: 873965 }, timestamp: '2024-01-02T00:00:00Z' },
  { type: 'AssetAdded', data: { cityId: 'city_123', assetId: 'asset_456' }, timestamp: '2024-01-03T00:00:00Z' }
];

// Rebuild state by replaying events
function rebuildCity(cityId: string): City {
  const cityEvents = events.filter(e => e.data.id === cityId || e.data.cityId === cityId);
  return cityEvents.reduce((state, event) => applyEvent(state, event), {});
}
```

#### CQRS (Command Query Responsibility Segregation)
Separate read and write models for optimized performance.

**Write Model (Command):**
```typescript
// Optimized for writes
class CitiesCommandHandler {
  async createCity(command: CreateCityCommand): Promise<string> {
    const city = new City(command);
    await db.insert(city);
    await eventBus.publish('city.created', city);
    return city.id;
  }
}
```

**Read Model (Query):**
```typescript
// Optimized for reads (denormalized, cached)
class CitiesQueryHandler {
  async getCityWithStats(cityId: string): Promise<CityWithStats> {
    return await cache.getOrCompute(`city:${cityId}:stats`, async () => {
      const city = await db.getCity(cityId);
      const assetCount = await db.countAssets(cityId);
      const activeAlerts = await db.countActiveAlerts(cityId);

      return { ...city, assetCount, activeAlerts };
    });
  }
}
```

#### Materialized Views
Precompute expensive queries for fast reads.

```sql
-- Materialized view for city statistics
CREATE MATERIALIZED VIEW city_stats AS
SELECT
  c.id AS city_id,
  c.name,
  COUNT(DISTINCT a.id) AS total_assets,
  COUNT(DISTINCT CASE WHEN a.status = 'active' THEN a.id END) AS active_assets,
  COUNT(DISTINCT al.id) AS active_alerts,
  MAX(m.timestamp) AS last_metric_time
FROM cities c
LEFT JOIN assets a ON a.city_id = c.id
LEFT JOIN alerts al ON al.city_id = c.id AND al.status = 'active'
LEFT JOIN metrics m ON m.asset_id = a.id
GROUP BY c.id, c.name;

-- Refresh hourly
SELECT cron.schedule('refresh-city-stats', '0 * * * *', 'REFRESH MATERIALIZED VIEW city_stats');
```

## Scalability & Performance

### Horizontal Scaling
All services are stateless and can scale horizontally.

**Auto-scaling Policy:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cities-service
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cities-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Sharding
TimescaleDB supports automatic sharding for time-series data.

```sql
-- Shard by time and city_id
SELECT create_distributed_hypertable('metrics', 'time', 'city_id',
  number_partitions => 10,
  replication_factor => 2
);
```

### Caching Strategy
Multi-level caching reduces database load.

```
Client → CDN (static assets)
       → API Gateway Cache (public endpoints, 60s TTL)
       → Redis Cache (data cache, 1h TTL)
       → TimescaleDB Continuous Aggregates
       → PostgreSQL
```

### Read Replicas
PostgreSQL read replicas handle read-heavy workloads.

```typescript
// Write to primary
await primaryDb.query('INSERT INTO cities VALUES (...)');

// Read from replica
const cities = await replicaDb.query('SELECT * FROM cities');
```

## Security Architecture

### Defense in Depth
Multiple security layers protect the platform.

**Layer 1: Network Security**
- VPC isolation
- Private subnets for databases
- Security groups with least privilege

**Layer 2: API Gateway**
- OAuth2 authentication
- Rate limiting
- IP allowlisting/blocklisting
- DDoS protection

**Layer 3: Application Security**
- Input validation
- SQL injection prevention (parameterized queries)
- XSS protection (CSP headers)
- CSRF tokens

**Layer 4: Data Security**
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Field-level encryption for sensitive data

### Authentication & Authorization

**OAuth2 Flows:**
```typescript
// Client credentials flow (service-to-service)
const token = await oauth.getToken({
  grant_type: 'client_credentials',
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  scope: 'cities:read cities:write'
});

// Authorization code flow (user-facing apps)
const authUrl = oauth.getAuthorizationUrl({
  client_id: process.env.CLIENT_ID,
  redirect_uri: 'https://app.example.com/callback',
  scope: 'cities:read',
  state: generateRandomState()
});
```

**Role-Based Access Control (RBAC):**
```typescript
const permissions = {
  'admin': ['cities:*', 'assets:*', 'alerts:*'],
  'operator': ['cities:read', 'assets:read', 'assets:write', 'alerts:read'],
  'viewer': ['cities:read', 'assets:read']
};

function authorize(user: User, action: string): boolean {
  const role = user.role;
  return permissions[role].some(perm => matchesPattern(perm, action));
}
```

## Monitoring & Observability

### Three Pillars

**1. Metrics (Prometheus + Grafana)**
```typescript
// Custom business metrics
const cityCreations = new promClient.Counter({
  name: 'lydian_cities_created_total',
  help: 'Total number of cities created'
});

const activeAssets = new promClient.Gauge({
  name: 'lydian_assets_active',
  help: 'Number of active assets',
  labelNames: ['city_id', 'asset_type']
});

const apiLatency = new promClient.Histogram({
  name: 'lydian_api_request_duration_seconds',
  help: 'API request latency',
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});
```

**2. Logs (ELK Stack)**
```typescript
logger.info('City created', {
  cityId: city.id,
  userId: req.user.id,
  correlationId: req.headers['x-correlation-id'],
  duration: Date.now() - startTime
});
```

**3. Traces (OpenTelemetry + Jaeger)**
```typescript
const span = tracer.startSpan('createCity');
span.setAttribute('city.name', cityName);
span.setAttribute('user.id', userId);

try {
  const city = await citiesService.create(data);
  span.setStatus({ code: SpanStatusCode.OK });
  return city;
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  throw error;
} finally {
  span.end();
}
```

### SLA Targets

| Metric | Target | Monitoring |
|--------|--------|-----------|
| API Availability | 99.9% | Uptime checks every 60s |
| API Latency (p99) | < 500ms | Histogram metrics |
| Data Ingestion Lag | < 5s | Kafka consumer lag |
| Alert Delivery | < 30s | Webhook latency tracking |
| Error Rate | < 0.1% | Error count metrics |

## Disaster Recovery

### Backup Strategy
- **PostgreSQL**: Daily full backups + WAL archiving (PITR)
- **TimescaleDB**: Continuous replication to standby
- **Kafka**: Multi-AZ replication (min 3 replicas)
- **Redis**: RDB snapshots every 6 hours + AOF

### Recovery Procedures
```bash
# PostgreSQL point-in-time recovery
pg_restore --dbname=lydian_cities \
  --clean --if-exists \
  --jobs=4 \
  --verbose \
  /backups/cities_2024-01-01.dump

# TimescaleDB continuous aggregate rebuild
SELECT refresh_continuous_aggregate('metrics_hourly',
  start => '2024-01-01',
  end => NOW()
);
```

### High Availability
- Multi-AZ deployment across 3 availability zones
- Active-active database replication
- Automatic failover (RTO: 60s, RPO: 0s)
- Health checks with automatic instance replacement

## Conclusion

The Smart Cities platform architecture prioritizes:
- **Scalability**: Horizontal scaling, sharding, caching
- **Resilience**: Circuit breakers, retries, multi-AZ deployment
- **Performance**: Sub-500ms latency, real-time data ingestion
- **Security**: Multi-layer defense, encryption, OAuth2
- **Observability**: Comprehensive metrics, logs, and traces

This architecture supports millions of IoT devices, billions of metrics per day, and provides a foundation for future smart city innovations.

## Related Documentation

- [Asset Types Reference](./smart-cities-asset-types.md)
- [Metrics & Analytics](./smart-cities-metrics.md)
- [Event-Driven Architecture](./smart-cities-events.md)
- [Getting Started Guide](../guides/smart-cities-getting-started.md)
- [API Reference](../api/smart-cities-api.md)
