# Smart Cities Event-Driven Architecture

Understanding event-driven patterns, message flows, and reactive systems in Smart Cities platform.

## Overview

Event-driven architecture (EDA) enables Smart Cities systems to react to real-time changes, process data streams, and coordinate distributed IoT infrastructure.

### Core Principles

**Event Sources**: IoT sensors, user actions, system state changes

**Event Consumers**: Analytics engines, alerting systems, dashboards

**Decoupling**: Producers and consumers operate independently

**Scalability**: Handle millions of events per second

**Resilience**: Graceful degradation, automatic retry

## Event Flow Patterns

### Publish-Subscribe

**Pattern**: One-to-many event distribution

**Use Case**: Sensor data broadcast to multiple consumers

**Characteristics**:
- Publishers don't know consumers
- Consumers subscribe to event types
- Dynamic subscription management
- Fan-out distribution

**Implementation**:
```
Sensor → Event Bus → [Analytics, Alerts, Dashboard, Archive]
```

### Event Sourcing

**Pattern**: Store state changes as immutable event log

**Use Case**: Asset state history, audit trails

**Characteristics**:
- Complete history preserved
- State reconstruction from events
- Time-travel queries
- Compliance and auditing

**Event Log Example**:
```
t0: AssetCreated {id: "sensor_001", type: "air_quality"}
t1: AssetOnline {id: "sensor_001", location: [lat, lng]}
t2: MetricRecorded {id: "sensor_001", pm25: 35}
t3: AlertTriggered {id: "sensor_001", threshold_exceeded: "pm25"}
t4: AssetMaintenance {id: "sensor_001", reason: "calibration"}
```

### CQRS (Command Query Responsibility Segregation)

**Pattern**: Separate read and write data models

**Use Case**: High-volume sensor ingestion with complex querying

**Characteristics**:
- Write model: Optimized for ingestion speed
- Read model: Optimized for query performance
- Eventual consistency acceptable
- Independent scaling

**Architecture**:
```
Write Side: Sensor → Ingestion API → Write DB (Time-series)
Read Side: Event Stream → Aggregator → Read DB (Analytics)
```

## Event Types

### Domain Events

**Asset Lifecycle Events**:
- asset.created
- asset.commissioned
- asset.decommissioned
- asset.deleted

**Operational Events**:
- asset.online
- asset.offline
- asset.battery_low
- asset.firmware_update

**Data Events**:
- metric.recorded
- metric.batch_ingested
- metric.quality_check_failed

### Integration Events

**External System Events**:
- weather.forecast_updated
- traffic.incident_reported
- utility.outage_detected

**User Events**:
- user.dashboard_viewed
- user.alert_acknowledged
- user.configuration_changed

## Message Formats

### CloudEvents Standard

```json
{
  "specversion": "1.0",
  "type": "com.smartcities.asset.metric_recorded",
  "source": "/sensors/air_quality/sensor_001",
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "time": "2025-01-15T10:30:00Z",
  "datacontenttype": "application/json",
  "data": {
    "asset_id": "sensor_001",
    "metric_type": "pm25",
    "value": 35.5,
    "unit": "μg/m³",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }
}
```

### Custom Envelope Format

```json
{
  "event_id": "evt_123456",
  "event_type": "alert.triggered",
  "timestamp": "2025-01-15T10:30:00Z",
  "source_asset": "sensor_001",
  "correlation_id": "corr_abc123",
  "causation_id": "cause_def456",
  "payload": {
    "alert_id": "alert_temp_high",
    "severity": "critical",
    "threshold": 75.0,
    "actual_value": 85.5
  },
  "metadata": {
    "organization_id": "org_xyz",
    "region": "us-east"
  }
}
```

## Event Processing

### Stream Processing

**Real-Time Aggregation**:
- Windowing: Tumbling, sliding, session windows
- Aggregations: Average, sum, min, max, count
- Grouping: By asset, location, type

**Complex Event Processing (CEP)**:
- Pattern detection across multiple events
- Temporal correlation
- Sequence matching

**Example Pattern**:
```
PATTERN: High Traffic Congestion
EVENTS:
  1. Vehicle count > 100 (within 5 minutes)
  2. Average speed < 20 km/h (within same 5 minutes)
  3. No incidents reported (negative condition)
ACTIONS:
  - Trigger congestion alert
  - Update traffic map
  - Notify traffic management center
```

### Batch Processing

**Scheduled Aggregations**:
- Hourly rollups for dashboards
- Daily reports for compliance
- Monthly trend analysis

**Data Lake Integration**:
- Raw events archived to object storage
- Parquet format for analytics
- Retention policies applied

## Guaranteed Delivery

### At-Least-Once Semantics

**Mechanism**: Acknowledge after successful processing

**Use Case**: Critical alerts, compliance data

**Trade-off**: Possible duplicate processing

**Idempotency Required**: Deduplication logic in consumers

### Exactly-Once Semantics

**Mechanism**: Transactional outbox pattern

**Use Case**: Financial transactions, state changes

**Trade-off**: Higher complexity, lower throughput

**Implementation**: Database transaction + message delivery atomic

### At-Most-Once Semantics

**Mechanism**: Fire and forget

**Use Case**: Telemetry data, high-volume sensors

**Trade-off**: Potential data loss

**Justification**: Acceptable for non-critical metrics

## Scalability Patterns

### Partitioning

**By Asset ID**: Hash-based partition assignment

**By Location**: Geographic sharding

**By Event Type**: Topic-based separation

**Benefits**:
- Parallel processing
- Isolated failure domains
- Independent scaling

### Load Leveling

**Queue-Based**: Buffer spikes in event volume

**Rate Limiting**: Protect downstream systems

**Backpressure**: Slow down producers when consumers overloaded

## Resilience

### Dead Letter Queues

**Purpose**: Capture failed events for later analysis

**Trigger Conditions**:
- Max retry attempts exceeded
- Invalid message format
- Business logic errors

**Recovery**:
- Manual review and reprocessing
- Automated retry with exponential backoff

### Circuit Breaker

**States**: Closed, Open, Half-Open

**Failure Detection**: Consecutive errors, error rate threshold

**Recovery**: Gradual health check, limited retry

## Observability

### Event Tracing

**Correlation IDs**: Track event chains

**Distributed Tracing**: Visualize event flows

**Metrics**:
- Events published per second
- Processing latency (p50, p95, p99)
- Consumer lag
- Error rates

### Event Replay

**Use Cases**:
- Bug fix verification
- New consumer bootstrapping
- Historical analysis

**Implementation**:
- Event log retention
- Timestamp-based replay
- Filtered replay by criteria

## Integration Patterns

### Event Gateway

**Function**: Protocol translation, routing

**Supported Protocols**: HTTP, MQTT, AMQP, WebSocket

**Capabilities**:
- Authentication/authorization
- Rate limiting
- Message transformation

### Saga Pattern

**Use Case**: Distributed transactions across services

**Example**: Asset commissioning workflow

**Steps**:
1. Reserve asset ID
2. Configure device
3. Register in inventory
4. Activate monitoring

**Compensation**: Rollback on failure

## Related Documentation

- [Smart Cities Architecture](./smart-cities-architecture.md)
- [Alerts & Events Guide](../guides/smart-cities-alerts-events.md)
- [Webhooks Guide](../guides/smart-cities-webhooks.md)

## Support

- **Documentation**: https://docs.lydian.com
- **Support Email**: support@lydian.com
