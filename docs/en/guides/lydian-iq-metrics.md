# LyDian IQ Metrics Guide

Complete guide to collecting, querying, and analyzing operational metrics with the LyDian IQ platform.

## Table of Contents

- [Overview](#overview)
- [Recording Metrics](#recording-metrics)
- [Metric Types](#metric-types)
- [Querying Metrics](#querying-metrics)
- [Aggregations](#aggregations)
- [Dashboards](#dashboards)
- [Alerting](#alerting)
- [Time-Series Analysis](#time-series-analysis)
- [Performance Optimization](#performance-optimization)
- [Best Practices](#best-practices)

## Overview

LyDian IQ Metrics provides a comprehensive observability platform for tracking application and business metrics in real-time.

### Key Features

- **Multi-Dimensional Metrics**: Tag-based metric organization
- **High Cardinality Support**: Handle millions of unique time series
- **Real-Time Aggregation**: Sub-second query performance
- **Custom Dashboards**: Visualize metrics with charts and graphs
- **Intelligent Alerting**: Anomaly detection and threshold alerts
- **Long-Term Storage**: Retain metrics with automatic downsampling
- **PromQL Compatible**: Industry-standard query language

### Use Cases

- Application Performance Monitoring (APM)
- Business KPI Tracking
- Infrastructure Monitoring
- User Behavior Analytics
- SLA/SLO Tracking
- Cost and Resource Optimization

## Recording Metrics

### Counter Metrics

```typescript
import { LydianIQClient } from '@lydian/lydian-iq';

const client = new LydianIQClient({
  apiKey: process.env.LYDIAN_IQ_API_KEY
});

// Increment counter
await client.metrics.increment('api.requests.total', 1, {
  tags: {
    endpoint: '/api/users',
    method: 'GET',
    status: '200'
  }
});

// Batch increment
await client.metrics.incrementBatch([
  { name: 'orders.created', value: 1, tags: { region: 'us-east' } },
  { name: 'orders.created', value: 1, tags: { region: 'eu-west' } },
  { name: 'revenue.usd', value: 99.99, tags: { product: 'pro' } }
]);
```

```python
from lydian import LydianIQClient

client = LydianIQClient(api_key=os.environ['LYDIAN_IQ_API_KEY'])

# Increment counter
client.metrics.increment(
    'api.requests.total',
    value=1,
    tags={
        'endpoint': '/api/users',
        'method': 'GET',
        'status': '200'
    }
)
```

### Gauge Metrics

```typescript
// Record current value
await client.metrics.gauge('system.memory.used_bytes', 8589934592, {
  tags: {
    host: 'web-server-01',
    region: 'us-east-1'
  }
});

// Set gauge with timestamp
await client.metrics.gauge('cpu.usage.percent', 75.5, {
  tags: { host: 'web-server-01' },
  timestamp: Date.now()
});
```

### Histogram Metrics

```typescript
// Track distributions
await client.metrics.histogram('api.response_time.ms', 125.5, {
  tags: {
    endpoint: '/api/users',
    method: 'GET'
  }
});

// Automatically calculates percentiles (p50, p95, p99)
```

## Metric Types

### Counter

```typescript
// Monotonically increasing counter
await client.metrics.increment('http.requests.total', 1, {
  tags: {
    service: 'api',
    status_code: '200'
  }
});

// Error counter
await client.metrics.increment('http.errors.total', 1, {
  tags: {
    service: 'api',
    error_type: 'timeout'
  }
});
```

### Gauge

```typescript
// Current temperature
await client.metrics.gauge('sensor.temperature.celsius', 23.5, {
  tags: {
    sensor_id: 'temp_001',
    location: 'datacenter_a'
  }
});

// Active connections
await client.metrics.gauge('db.connections.active', 45, {
  tags: {
    database: 'postgres',
    host: 'db-primary'
  }
});
```

### Histogram

```typescript
// Request duration distribution
await client.metrics.histogram('request.duration.ms', 245.8, {
  tags: {
    endpoint: '/api/orders',
    method: 'POST'
  }
});

// File size distribution
await client.metrics.histogram('upload.size.bytes', 1048576, {
  tags: {
    file_type: 'image',
    user_tier: 'premium'
  }
});
```

### Summary

```typescript
// Track quantiles over sliding time window
await client.metrics.summary('payment.amount.usd', 99.99, {
  tags: {
    payment_method: 'credit_card',
    currency: 'USD'
  },
  quantiles: [0.5, 0.9, 0.99] // p50, p90, p99
});
```

## Querying Metrics

### Basic Queries

```typescript
// Query metric
const results = await client.metrics.query({
  metric: 'api.requests.total',
  aggregation: 'sum',
  start: Date.now() - 3600000, // 1 hour ago
  end: Date.now(),
  granularity: '1m' // 1-minute buckets
});

console.log('Total requests:', results.values.reduce((a, b) => a + b, 0));
```

```python
# Query with filters
results = client.metrics.query(
    metric='api.requests.total',
    aggregation='sum',
    start=datetime.now() - timedelta(hours=1),
    end=datetime.now(),
    granularity='1m',
    filters={
        'endpoint': '/api/users',
        'status': ['200', '201']
    }
)

print(f'Total requests: {sum(results.values)}')
```

### PromQL Queries

```typescript
// PromQL-style queries
const query = `
  rate(api_requests_total{endpoint="/api/users"}[5m])
`;

const results = await client.metrics.promql(query);

// Complex query with operators
const complexQuery = `
  sum(rate(http_requests_total[5m])) by (status_code) /
  sum(rate(http_requests_total[5m]))
`;

const errorRate = await client.metrics.promql(complexQuery);
```

### Multi-Metric Queries

```typescript
// Query multiple metrics simultaneously
const multiQuery = await client.metrics.queryMulti({
  queries: [
    {
      metric: 'cpu.usage.percent',
      aggregation: 'avg',
      tags: { host: 'web-server-01' }
    },
    {
      metric: 'memory.usage.percent',
      aggregation: 'avg',
      tags: { host: 'web-server-01' }
    },
    {
      metric: 'disk.usage.percent',
      aggregation: 'max',
      tags: { host: 'web-server-01' }
    }
  ],
  start: Date.now() - 3600000,
  end: Date.now(),
  granularity: '5m'
});

console.log('System metrics:', multiQuery);
```

## Aggregations

### Temporal Aggregations

```typescript
// Average over time
const avgResponse = await client.metrics.query({
  metric: 'api.response_time.ms',
  aggregation: 'avg',
  start: Date.now() - 86400000, // 24 hours
  end: Date.now(),
  granularity: '1h'
});

// P95 percentile
const p95Response = await client.metrics.query({
  metric: 'api.response_time.ms',
  aggregation: 'p95',
  start: Date.now() - 3600000,
  end: Date.now(),
  granularity: '1m'
});

// Rate of change
const requestRate = await client.metrics.query({
  metric: 'api.requests.total',
  aggregation: 'rate',
  start: Date.now() - 300000, // 5 minutes
  end: Date.now(),
  granularity: '10s'
});
```

### Spatial Aggregations

```typescript
// Group by tags
const requestsByRegion = await client.metrics.query({
  metric: 'api.requests.total',
  aggregation: 'sum',
  groupBy: ['region'],
  start: Date.now() - 3600000,
  end: Date.now()
});

// Multi-dimensional grouping
const errorsByService = await client.metrics.query({
  metric: 'errors.total',
  aggregation: 'count',
  groupBy: ['service', 'error_type'],
  start: Date.now() - 3600000,
  end: Date.now()
});
```

## Dashboards

### Creating Dashboards

```typescript
// Create custom dashboard
const dashboard = await client.dashboards.create({
  name: 'API Performance Dashboard',
  description: 'Monitor API health and performance',
  widgets: [
    {
      type: 'timeseries',
      title: 'Request Rate',
      query: {
        metric: 'api.requests.total',
        aggregation: 'rate',
        granularity: '1m'
      },
      visualization: {
        type: 'line',
        yAxis: { label: 'Requests/sec' }
      }
    },
    {
      type: 'timeseries',
      title: 'Response Time (P95)',
      query: {
        metric: 'api.response_time.ms',
        aggregation: 'p95',
        granularity: '1m'
      },
      visualization: {
        type: 'area',
        thresholds: [
          { value: 200, color: 'green', label: 'Good' },
          { value: 500, color: 'yellow', label: 'Warning' },
          { value: 1000, color: 'red', label: 'Critical' }
        ]
      }
    },
    {
      type: 'single_value',
      title: 'Error Rate',
      query: {
        metric: 'errors.total',
        aggregation: 'rate'
      },
      visualization: {
        format: 'percentage',
        thresholds: [
          { value: 1, color: 'green' },
          { value: 5, color: 'red' }
        ]
      }
    }
  ]
});

console.log('Dashboard created:', dashboard.id);
console.log('Dashboard URL:', dashboard.url);
```

## Alerting

### Threshold Alerts

```typescript
// Create threshold alert
const alert = await client.alerts.create({
  name: 'High Error Rate',
  description: 'Alert when error rate exceeds 5%',
  query: {
    metric: 'errors.total',
    aggregation: 'rate',
    filters: { service: 'api' }
  },
  condition: {
    type: 'threshold',
    operator: '>',
    value: 0.05, // 5%
    duration: '5m' // Sustained for 5 minutes
  },
  notifications: [
    {
      type: 'email',
      recipients: ['oncall@example.com']
    },
    {
      type: 'slack',
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: '#alerts'
    },
    {
      type: 'pagerduty',
      integration_key: process.env.PAGERDUTY_KEY,
      severity: 'critical'
    }
  ]
});
```

### Anomaly Detection Alerts

```typescript
// Automatic anomaly detection
const anomalyAlert = await client.alerts.create({
  name: 'Traffic Anomaly Detection',
  description: 'Detect unusual traffic patterns',
  query: {
    metric: 'api.requests.total',
    aggregation: 'rate'
  },
  condition: {
    type: 'anomaly',
    algorithm: 'adaptive_threshold',
    sensitivity: 'medium', // low, medium, high
    training_window: '7d' // Learn from 7 days of data
  },
  notifications: [
    {
      type: 'webhook',
      url: 'https://api.example.com/alerts',
      headers: {
        'Authorization': `Bearer ${process.env.ALERT_TOKEN}`
      }
    }
  ]
});
```

## Time-Series Analysis

### Forecasting

```typescript
// Predict future metric values
const forecast = await client.metrics.forecast({
  metric: 'api.requests.total',
  aggregation: 'rate',
  historical_period: '30d', // Train on 30 days
  forecast_period: '7d', // Predict next 7 days
  confidence: 0.95
});

console.log('Predicted traffic:', forecast.predictions);
console.log('Confidence intervals:', forecast.confidence_intervals);
```

### Trend Analysis

```typescript
// Detect trends
const trend = await client.metrics.trend({
  metric: 'signup.conversions',
  aggregation: 'count',
  period: '30d',
  algorithm: 'linear_regression'
});

console.log('Trend direction:', trend.direction); // 'increasing', 'decreasing', 'stable'
console.log('Growth rate:', trend.rate_of_change);
console.log('Statistical significance:', trend.p_value);
```

## Performance Optimization

### Downsampling

```typescript
// Configure automatic downsampling
await client.metrics.configureRetention({
  metric: 'api.requests.total',
  policies: [
    {
      resolution: '1s',
      retention: '7d' // Keep 1-second resolution for 7 days
    },
    {
      resolution: '1m',
      retention: '90d' // Downsample to 1-minute for 90 days
    },
    {
      resolution: '1h',
      retention: '1y' // Downsample to 1-hour for 1 year
    }
  ]
});
```

### Cardinality Management

```typescript
// Monitor metric cardinality
const cardinality = await client.metrics.getCardinality('api.requests.total');

console.log('Unique time series:', cardinality.total);
console.log('Top dimensions:', cardinality.dimensions);

// Limit cardinality
await client.metrics.setCardinalityLimit('api.requests.total', {
  max_series: 10000,
  policy: 'drop_oldest' // or 'reject_new'
});
```

## Best Practices

### 1. Metric Naming

```typescript
// ✅ Good naming
await client.metrics.increment('api.requests.total', 1, {
  tags: { endpoint: '/users', method: 'GET', status: '200' }
});

// ❌ Bad naming (puts dimension in metric name)
await client.metrics.increment('api.requests.users.get.200', 1);
```

### 2. Tag Cardinality

```typescript
// ✅ Low cardinality tags
await client.metrics.gauge('cache.hit_rate', 0.85, {
  tags: {
    cache_type: 'redis', // Low cardinality
    region: 'us-east', // Low cardinality
    environment: 'production' // Low cardinality
  }
});

// ❌ High cardinality tags (avoid)
await client.metrics.gauge('cache.hit_rate', 0.85, {
  tags: {
    user_id: '12345', // High cardinality!
    request_id: 'abc-def-ghi' // Very high cardinality!
  }
});
```

### 3. Batch Recording

```typescript
// ✅ Batch metrics for efficiency
const batch = [
  { name: 'requests.total', value: 1, tags: { endpoint: '/users' } },
  { name: 'requests.total', value: 1, tags: { endpoint: '/orders' } },
  { name: 'response_time.ms', value: 125, tags: { endpoint: '/users' } }
];

await client.metrics.recordBatch(batch);

// ❌ Individual calls (slower)
await client.metrics.increment('requests.total', 1);
await client.metrics.increment('requests.total', 1);
await client.metrics.histogram('response_time.ms', 125);
```

## Related Documentation

- [LyDian IQ Signals](./lydian-iq-signals.md)
- [LyDian IQ Events](./lydian-iq-events.md)
- [Metrics API Reference](/docs/api/lydian-iq/metrics)

## Support

- **Documentation**: https://docs.lydian.com
- **Support Email**: support@lydian.com
- **Community Forum**: https://community.lydian.com
