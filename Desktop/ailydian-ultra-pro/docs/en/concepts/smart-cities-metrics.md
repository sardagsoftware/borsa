# Smart Cities Metrics & Analytics - Concepts

## Overview

Metrics are the foundation of data-driven smart city operations. They provide quantitative measurements of city performance, enabling monitoring, analysis, optimization, and evidence-based decision-making across domains such as traffic, energy, water, air quality, and public safety.

This document explains the conceptual framework, data models, aggregation strategies, and best practices for metrics in LyDian Smart Cities.

## Metric Fundamentals

### What is a Metric?

A metric is a time-stamped numerical measurement of a specific aspect of city operations, collected from IoT sensors, systems, or manual data entry.

**Core Components:**
```typescript
interface Metric {
  assetId: string;        // Source asset (sensor, system)
  timestamp: Date;        // When measurement was taken
  metricType: string;     // What is being measured
  value: number;          // Numerical measurement
  unit: string;           // Unit of measurement
  tags?: Record<string, string>; // Additional context
}
```

**Example Metrics:**
- Traffic: `vehicle_count`, `avg_speed`, `congestion_level`
- Energy: `power_consumption`, `voltage`, `frequency`
- Environment: `air_quality_pm25`, `temperature`, `humidity`, `noise_level`
- Water: `flow_rate`, `pressure`, `chlorine_level`, `ph`
- Waste: `bin_fill_level`, `collection_frequency`, `weight`

## Metric Types

### 1. Gauge Metrics (Current State)

Gauges represent the current value of something that can go up or down.

**Examples:**
- Temperature: 22.5°C
- Traffic speed: 45 km/h
- Bin fill level: 78%
- Available parking spaces: 142

**Characteristics:**
- Point-in-time measurement
- Value can increase or decrease
- Represents current state
- No accumulation over time

**Use Cases:**
- Real-time dashboards
- Current status monitoring
- Threshold-based alerts

### 2. Counter Metrics (Cumulative)

Counters monotonically increase over time (never decrease, except on reset).

**Examples:**
- Total vehicles passed: 45,892
- Total energy consumed: 1,247 kWh
- Water consumed: 3,456 liters
- Total waste collected: 12.5 tons

**Characteristics:**
- Always increasing
- Reset on system restart
- Cumulative over time
- Rate calculated by difference

**Use Cases:**
- Usage tracking
- Billing calculations
- Trend analysis (via rate calculation)

### 3. Histogram Metrics (Distribution)

Histograms track the distribution of values across buckets.

**Examples:**
- Traffic speed distribution:
  - 0-20 km/h: 15% of time
  - 21-40 km/h: 35% of time
  - 41-60 km/h: 40% of time
  - 61+ km/h: 10% of time

**Characteristics:**
- Groups values into ranges
- Shows distribution patterns
- Enables percentile calculations
- Memory efficient for large datasets

**Use Cases:**
- SLA compliance (p95, p99 latency)
- Performance analysis
- Quality of service metrics

### 4. Summary Metrics (Statistics)

Summaries pre-calculate statistical measures over a time window.

**Examples:**
- Last hour air quality:
  - Min: 28 AQI
  - Max: 67 AQI
  - Avg: 45.3 AQI
  - Median: 44 AQI
  - Std Dev: 8.2

**Characteristics:**
- Pre-aggregated statistics
- Configurable time windows
- Reduces query overhead
- Trade-off: accuracy vs. performance

**Use Cases:**
- Performance dashboards
- Real-time analytics
- Resource optimization

## Time-Series Data Model

### Timestamp Precision

```typescript
// High precision (milliseconds) for real-time systems
timestamp: "2024-01-15T10:30:45.123Z"

// Standard precision (seconds) for most sensors
timestamp: "2024-01-15T10:30:45Z"

// Minute precision for aggregated data
timestamp: "2024-01-15T10:30:00Z"
```

### Retention Policies

**Hot Tier** (Real-time, 7 days):
- Full resolution data
- Sub-second precision
- Stored in memory/SSD
- Used for: Real-time dashboards, alerting

**Warm Tier** (Recent, 8-90 days):
- Downsampled to 1-minute intervals
- Stored in TimescaleDB with compression
- Used for: Weekly reports, trend analysis

**Cold Tier** (Historical, 91+ days):
- Downsampled to 1-hour intervals
- Stored in S3/Object Storage (Parquet format)
- Used for: Annual reports, ML training, compliance

### Downsampling Strategy

```typescript
// Original data (every 10 seconds)
[
  { timestamp: "10:00:00", value: 42 },
  { timestamp: "10:00:10", value: 45 },
  { timestamp: "10:00:20", value: 41 },
  { timestamp: "10:00:30", value: 47 },
  { timestamp: "10:00:40", value: 44 },
  { timestamp: "10:00:50", value: 46 }
]

// Downsampled (1 minute)
{
  timestamp: "10:00:00",
  avg: 44.2,
  min: 41,
  max: 47,
  count: 6,
  stddev: 2.14
}
```

**Benefits:**
- 83% storage reduction (6 points → 1 point)
- Faster queries on historical data
- Preserves statistical properties
- Enables long-term retention

## Aggregation Functions

### Temporal Aggregation

**Average (Most Common):**
```sql
SELECT
  time_bucket('1 hour', timestamp) AS hour,
  AVG(value) AS avg_temperature
FROM metrics
WHERE metric_type = 'temperature'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour;
```

**Sum (For Counters):**
```sql
SELECT
  time_bucket('1 day', timestamp) AS day,
  SUM(value) AS total_energy_kwh
FROM metrics
WHERE metric_type = 'energy_consumption'
GROUP BY day;
```

**Max/Min:**
```sql
SELECT
  time_bucket('1 hour', timestamp) AS hour,
  MAX(value) AS peak_traffic_flow,
  MIN(value) AS lowest_traffic_flow
FROM metrics
WHERE metric_type = 'traffic_flow'
GROUP BY hour;
```

**Percentiles:**
```sql
SELECT
  time_bucket('1 hour', timestamp) AS hour,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY value) AS p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value) AS p99
FROM metrics
WHERE metric_type = 'response_time'
GROUP BY hour;
```

### Spatial Aggregation

**Average by Zone:**
```sql
SELECT
  zone_id,
  AVG(value) AS avg_air_quality
FROM metrics m
JOIN assets a ON m.asset_id = a.id
WHERE metric_type = 'air_quality_pm25'
GROUP BY zone_id;
```

**City-Wide Statistics:**
```sql
SELECT
  city_id,
  COUNT(DISTINCT asset_id) AS sensor_count,
  AVG(value) AS city_avg_noise,
  MAX(value) AS peak_noise,
  STDDEV(value) AS noise_variance
FROM metrics m
JOIN assets a ON m.asset_id = a.id
WHERE metric_type = 'noise_level'
GROUP BY city_id;
```

## Metric Composition

### Derived Metrics

Calculated from other metrics.

**Traffic Congestion Index:**
```typescript
congestionIndex = (
  (1 - normalizedSpeed) * 0.4 +
  normalizedVehicleCount * 0.3 +
  normalizedOccupancy * 0.3
) * 100

// Where normalized values are in range [0, 1]
```

**Energy Efficiency Ratio:**
```typescript
energyEfficiency = (
  energyProduced / energyConsumed
) * 100
```

**Air Quality Index (AQI):**
```typescript
function calculateAQI(pm25: number, pm10: number, no2: number, co: number): number {
  const aqiPM25 = convertPM25ToAQI(pm25);
  const aqiPM10 = convertPM10ToAQI(pm10);
  const aqiNO2 = convertNO2ToAQI(no2);
  const aqiCO = convertCOToAQI(co);

  // Return worst pollutant AQI
  return Math.max(aqiPM25, aqiPM10, aqiNO2, aqiCO);
}
```

### Composite Metrics

Combine multiple metrics into a single score.

**City Performance Index:**
```typescript
interface CityPerformanceIndex {
  traffic: number;      // 0-100 (100 = best)
  energy: number;       // 0-100
  environment: number;  // 0-100
  safety: number;       // 0-100
  overall: number;      // Weighted average
}

function calculateCPI(metrics: CityMetrics): CityPerformanceIndex {
  const traffic = (1 - metrics.avgCongestion) * 100;
  const energy = metrics.renewableEnergyPercent;
  const environment = 100 - metrics.avgAQI;
  const safety = (1 - metrics.crimeRate) * 100;

  return {
    traffic,
    energy,
    environment,
    safety,
    overall: (
      traffic * 0.25 +
      energy * 0.25 +
      environment * 0.30 +
      safety * 0.20
    )
  };
}
```

## Metric Quality

### Data Quality Dimensions

**1. Accuracy**
- How close is the measurement to the true value?
- Affected by: Sensor calibration, environmental conditions
- Mitigation: Regular calibration, outlier detection

**2. Completeness**
- Are all expected measurements present?
- Affected by: Network issues, sensor failures
- Mitigation: Interpolation, imputation, alerts

**3. Consistency**
- Do measurements make logical sense?
- Affected by: Sensor drift, configuration errors
- Mitigation: Validation rules, cross-checking

**4. Timeliness**
- Are measurements delivered promptly?
- Affected by: Network latency, processing delays
- Mitigation: Edge computing, buffering

### Quality Checks

**Range Validation:**
```typescript
function validateMetric(metric: Metric): boolean {
  const ranges: Record<string, [number, number]> = {
    'temperature': [-40, 60],  // °C
    'humidity': [0, 100],       // %
    'air_quality_pm25': [0, 500], // μg/m³
    'traffic_speed': [0, 150]   // km/h
  };

  const [min, max] = ranges[metric.metricType] || [-Infinity, Infinity];
  return metric.value >= min && metric.value <= max;
}
```

**Rate-of-Change Validation:**
```typescript
function validateRateOfChange(
  current: Metric,
  previous: Metric,
  maxChangeRate: number
): boolean {
  const timeDelta = (current.timestamp.getTime() - previous.timestamp.getTime()) / 1000; // seconds
  const valueDelta = Math.abs(current.value - previous.value);
  const rate = valueDelta / timeDelta;

  return rate <= maxChangeRate;
}

// Example: Temperature shouldn't change >5°C per minute
validateRateOfChange(currentTemp, previousTemp, 5 / 60);
```

**Missing Data Detection:**
```typescript
function detectMissingData(
  metrics: Metric[],
  expectedInterval: number // seconds
): Gap[] {
  const gaps: Gap[] = [];

  for (let i = 1; i < metrics.length; i++) {
    const timeDiff = (metrics[i].timestamp.getTime() - metrics[i-1].timestamp.getTime()) / 1000;

    if (timeDiff > expectedInterval * 2) {
      gaps.push({
        start: metrics[i-1].timestamp,
        end: metrics[i].timestamp,
        duration: timeDiff
      });
    }
  }

  return gaps;
}
```

## Metric Tagging

Tags add contextual metadata to metrics for filtering and grouping.

**Common Tags:**
```typescript
interface MetricTags {
  city: string;           // "san_francisco"
  zone: string;           // "downtown", "industrial"
  assetType: string;      // "traffic_sensor", "air_quality_monitor"
  manufacturer: string;   // "SensorTech Inc"
  firmwareVersion: string; // "v2.1.3"
  environment: string;    // "production", "staging"
}
```

**Example:**
```typescript
{
  assetId: "sensor_001",
  timestamp: "2024-01-15T10:30:00Z",
  metricType: "air_quality_pm25",
  value: 42.5,
  unit: "μg/m³",
  tags: {
    city: "san_francisco",
    zone: "downtown",
    assetType: "air_quality_monitor",
    location: "intersection_market_5th"
  }
}
```

**Querying with Tags:**
```typescript
// Get average PM2.5 for downtown zone
const downtownAQI = await client.smartCities.queryMetrics({
  metricType: 'air_quality_pm25',
  tags: { zone: 'downtown' },
  aggregation: 'avg',
  timeRange: { start: '2024-01-15T00:00:00Z', end: '2024-01-15T23:59:59Z' }
});
```

## Alert Thresholds

### Static Thresholds

Fixed values that trigger alerts.

**Example: High Air Pollution:**
```typescript
{
  metricType: 'air_quality_pm25',
  operator: '>',
  threshold: 75, // μg/m³ (Unhealthy for Sensitive Groups)
  severity: 'high'
}
```

### Dynamic Thresholds

Thresholds that adapt based on historical patterns.

**Standard Deviation Based:**
```typescript
function calculateDynamicThreshold(
  historicalData: number[],
  sigmaMultiplier: number = 3
): number {
  const mean = average(historicalData);
  const stdDev = standardDeviation(historicalData);
  return mean + (sigmaMultiplier * stdDev);
}

// Alert if value is >3 standard deviations from mean
const threshold = calculateDynamicThreshold(last30DaysData, 3);
```

**Seasonal Baselines:**
```typescript
// Traffic is higher during rush hours, use time-based thresholds
const thresholds: Record<number, number> = {
  0: 30,  // Midnight-1am: 30 vehicles/min is high
  8: 80,  // 8am-9am: 80 vehicles/min is normal
  17: 90, // 5pm-6pm: 90 vehicles/min is normal
  23: 35  // 11pm-midnight: 35 is high
};

const currentHour = new Date().getHours();
const threshold = thresholds[currentHour];
```

## Performance Optimization

### Continuous Aggregates

Pre-computed rollups for fast queries.

```sql
-- Create continuous aggregate (TimescaleDB)
CREATE MATERIALIZED VIEW hourly_traffic_stats
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS hour,
  asset_id,
  AVG(value) AS avg_speed,
  MAX(value) AS max_speed,
  MIN(value) AS min_speed,
  COUNT(*) AS sample_count
FROM metrics
WHERE metric_type = 'traffic_speed'
GROUP BY hour, asset_id;

-- Automatically refresh every 10 minutes
SELECT add_continuous_aggregate_policy('hourly_traffic_stats',
  start_offset => INTERVAL '1 day',
  end_offset => INTERVAL '10 minutes',
  schedule_interval => INTERVAL '10 minutes'
);
```

**Query Performance:**
- Without aggregate: 2.3s for 1 month of data
- With aggregate: 45ms (50x faster)

### Compression

TimescaleDB compression can reduce storage by 90%.

```sql
-- Enable compression
ALTER TABLE metrics SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'asset_id,metric_type',
  timescaledb.compress_orderby = 'timestamp DESC'
);

-- Compress data older than 7 days
SELECT add_compression_policy('metrics', INTERVAL '7 days');
```

**Storage Impact:**
- Before compression: 1TB
- After compression: 100GB (90% reduction)

### Partitioning

Partition by time for efficient queries and data management.

```sql
-- TimescaleDB automatically partitions by time
SELECT create_hypertable('metrics', 'timestamp',
  chunk_time_interval => INTERVAL '1 day'
);

-- Each day becomes a separate chunk
-- Old chunks can be dropped without affecting recent data
SELECT drop_chunks('metrics', INTERVAL '1 year'); -- Drop data >1 year old
```

## Use Case Examples

### 1. Traffic Optimization

**Metrics:**
- `traffic_flow`: vehicles/minute
- `avg_speed`: km/h
- `occupancy`: % of road occupied
- `incident_count`: number of incidents

**Derived Metric:**
```typescript
congestionLevel = (
  (maxSpeed - currentSpeed) / maxSpeed * 0.4 +
  occupancy / 100 * 0.3 +
  (trafficFlow / maxFlow) * 0.3
)
```

**Alert:**
- If `congestionLevel > 0.8` for 5+ minutes → Trigger traffic rerouting

### 2. Energy Grid Management

**Metrics:**
- `power_demand`: kW
- `power_supply`: kW
- `renewable_generation`: kW
- `grid_frequency`: Hz

**Derived Metric:**
```typescript
gridStability = (
  1 - Math.abs(demand - supply) / demand * 0.5 +
  (frequency >= 49.9 && frequency <= 50.1 ? 1 : 0) * 0.5
)
```

**Alert:**
- If `gridStability < 0.7` → Activate backup generators

### 3. Environmental Monitoring

**Metrics:**
- `air_quality_pm25`: μg/m³
- `air_quality_pm10`: μg/m³
- `no2`: ppb
- `co`: ppm

**Composite Metric (AQI):**
```typescript
aqi = max(
  calculateSubIndex(pm25, PM25_BREAKPOINTS),
  calculateSubIndex(pm10, PM10_BREAKPOINTS),
  calculateSubIndex(no2, NO2_BREAKPOINTS),
  calculateSubIndex(co, CO_BREAKPOINTS)
)
```

**Public Health Advisory:**
- AQI 0-50: Good
- AQI 51-100: Moderate
- AQI 101-150: Unhealthy for Sensitive Groups
- AQI 151+: Unhealthy

## Best Practices

### 1. Choose Appropriate Granularity

```typescript
// ✅ Good: 1-minute intervals for traffic
interval: '1m'

// ❌ Bad: 1-second intervals (too much data)
interval: '1s'

// ❌ Bad: 1-hour intervals (too coarse)
interval: '1h'
```

### 2. Tag Consistently

```typescript
// ✅ Good: Consistent naming
tags: { zone: 'downtown', asset_type: 'sensor' }

// ❌ Bad: Inconsistent naming
tags: { Zone: 'Downtown', assettype: 'Sensor' }
```

### 3. Handle Missing Data

```typescript
// ✅ Good: Interpolate missing values
const interpolated = linearInterpolation(before, after, timestamp);

// ❌ Bad: Use 0 or null (skews statistics)
const value = missingData ? 0 : actualValue;
```

### 4. Validate Input

```typescript
// ✅ Good: Validate before storing
if (validateMetric(metric)) {
  await client.smartCities.createMetric(metric);
} else {
  logger.warn('Invalid metric', metric);
}

// ❌ Bad: Store without validation
await client.smartCities.createMetric(metric);
```

## Related Documentation

- [Getting Started with Smart Cities](../guides/smart-cities-getting-started.md)
- [Monitoring Metrics Guide](../guides/smart-cities-monitoring-metrics.md)
- [Architecture Overview](./smart-cities-architecture.md)
- [Smart Cities API Reference](../api/smart-cities-api.md)
