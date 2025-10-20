# LyDian IQ Signals Guide

Complete guide to signal processing, pattern detection, and anomaly detection with the LyDian IQ platform.

## Table of Contents

- [Overview](#overview)
- [Signal Basics](#signal-basics)
- [Ingesting Signals](#ingesting-signals)
- [Real-Time Processing](#real-time-processing)
- [Pattern Detection](#pattern-detection)
- [Anomaly Detection](#anomaly-detection)
- [Signal Correlation](#signal-correlation)
- [Time-Series Analysis](#time-series-analysis)
- [Filtering & Transformation](#filtering--transformation)
- [Best Practices](#best-practices)

## Overview

LyDian IQ Signals enable real-time processing of time-series data streams for pattern detection, anomaly detection, and predictive analytics across various domains including IoT, financial trading, healthcare monitoring, and infrastructure operations.

### Key Features

- **Real-Time Ingestion**: Process millions of signals per second with sub-millisecond latency
- **Pattern Recognition**: Detect complex patterns using ML models and rule-based logic
- **Anomaly Detection**: Identify outliers using statistical methods and deep learning
- **Signal Correlation**: Find relationships between multiple signal streams
- **Time-Series Forecasting**: Predict future values using ARIMA, Prophet, LSTM
- **Windowing Operations**: Tumbling, sliding, and session windows for aggregation
- **Stream Processing**: Apache Flink-compatible processing engine

### Use Cases

- **IoT Monitoring**: Real-time sensor data processing for smart devices
- **Financial Trading**: Market signal analysis and algorithmic trading
- **Healthcare**: Patient vital signs monitoring and early warning systems
- **Infrastructure**: Network traffic analysis and performance optimization
- **Security**: Intrusion detection and threat intelligence

## Signal Basics

### Signal Types

LyDian IQ supports multiple signal types:

```typescript
import { LyDianIQClient, SignalType } from '@lydian/lydian-iq';

const client = new LyDianIQClient({
  apiKey: process.env.LYDIAN_IQ_API_KEY,
  environment: 'production'
});

// Numeric signal (most common)
const temperatureSignal = await client.signals.create({
  name: 'device.temperature',
  type: SignalType.NUMERIC,
  unit: 'celsius',
  metadata: {
    deviceId: 'sensor_001',
    location: 'warehouse_a',
    sampleRate: 1000 // Hz
  }
});

// Boolean signal
const doorSignal = await client.signals.create({
  name: 'security.door.open',
  type: SignalType.BOOLEAN,
  metadata: {
    doorId: 'entrance_main',
    building: 'headquarters'
  }
});

// Categorical signal
const orderStatusSignal = await client.signals.create({
  name: 'order.status',
  type: SignalType.CATEGORICAL,
  categories: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
  metadata: {
    domain: 'e-commerce'
  }
});

// Vector signal (multi-dimensional)
const accelerometerSignal = await client.signals.create({
  name: 'device.accelerometer',
  type: SignalType.VECTOR,
  dimensions: ['x', 'y', 'z'],
  unit: 'm/s²',
  metadata: {
    deviceType: 'smartphone'
  }
});
```

### Signal Schema

Define schemas for structured signals:

```typescript
const stockPriceSchema = await client.signals.createSchema({
  name: 'stock_price_tick',
  version: '1.0.0',
  fields: [
    { name: 'symbol', type: 'string', required: true },
    { name: 'timestamp', type: 'timestamp', required: true },
    { name: 'price', type: 'float64', required: true },
    { name: 'volume', type: 'int64', required: true },
    { name: 'bid', type: 'float64', required: false },
    { name: 'ask', type: 'float64', required: false },
    { name: 'exchange', type: 'string', required: true }
  ],
  indexes: ['symbol', 'timestamp'],
  partitionKey: 'symbol'
});
```

## Ingesting Signals

### Single Signal Ingestion

Send individual signal values:

```typescript
// Simple numeric value
await client.signals.send('device.temperature', {
  value: 23.5,
  timestamp: new Date(),
  tags: {
    deviceId: 'sensor_001',
    room: 'server_room'
  }
});

// Boolean event
await client.signals.send('security.door.open', {
  value: true,
  timestamp: new Date(),
  tags: {
    doorId: 'entrance_main',
    userId: 'employee_456'
  }
});

// Vector value
await client.signals.send('device.accelerometer', {
  value: { x: 0.5, y: -0.3, z: 9.8 },
  timestamp: new Date(),
  tags: {
    deviceId: 'phone_123'
  }
});
```

### Batch Ingestion

Send multiple signals efficiently:

```typescript
// Batch send for high-throughput scenarios
const batch = client.signals.createBatch();

for (let i = 0; i < 1000; i++) {
  batch.add('sensor.temperature', {
    value: 20 + Math.random() * 10,
    timestamp: new Date(Date.now() + i * 1000),
    tags: { sensor: `temp_${i % 10}` }
  });
}

await batch.flush();
console.log(`Sent ${batch.count} signals`);
```

### Stream Ingestion

Ingest continuous data streams:

```python
from lydian import LyDianIQClient
import asyncio

client = LyDianIQClient(api_key=os.environ['LYDIAN_IQ_API_KEY'])

async def ingest_iot_stream():
    """Continuously ingest IoT sensor data"""

    async with client.signals.stream('iot.sensors') as stream:
        async for sensor_reading in sensor_data_source():
            await stream.send({
                'sensor_id': sensor_reading.id,
                'temperature': sensor_reading.temp,
                'humidity': sensor_reading.humidity,
                'pressure': sensor_reading.pressure,
                'timestamp': sensor_reading.timestamp
            })

            # Automatic batching and backpressure handling
            if stream.pending_count > 1000:
                await stream.flush()

# Run the ingestion
asyncio.run(ingest_iot_stream())
```

### Kafka Integration

Integrate with Apache Kafka:

```go
package main

import (
    "github.com/lydian/lydian-iq-go"
    "github.com/segmentio/kafka-go"
)

func ingestFromKafka() {
    client := lydianiq.NewClient(os.Getenv("LYDIAN_IQ_API_KEY"))

    // Kafka reader
    reader := kafka.NewReader(kafka.ReaderConfig{
        Brokers: []string{"localhost:9092"},
        Topic:   "sensor-data",
        GroupID: "lydian-ingestion",
    })
    defer reader.Close()

    // Create signal stream
    stream := client.Signals.Stream("kafka.sensors")

    for {
        msg, err := reader.ReadMessage(context.Background())
        if err != nil {
            log.Printf("Error reading: %v", err)
            continue
        }

        // Parse message
        var data SensorData
        json.Unmarshal(msg.Value, &data)

        // Send to LyDian IQ
        err = stream.Send(&lydianiq.Signal{
            Name:      "sensor.reading",
            Value:     data.Value,
            Timestamp: data.Timestamp,
            Tags: map[string]string{
                "sensor_id": data.SensorID,
                "type":      data.Type,
            },
        })

        if err != nil {
            log.Printf("Error sending signal: %v", err)
        }
    }
}
```

## Real-Time Processing

### Stream Processing

Process signals in real-time:

```typescript
// Create processing pipeline
const pipeline = await client.signals.createPipeline({
  name: 'temperature-monitoring',
  source: {
    signal: 'device.temperature',
    filter: {
      tags: { location: 'data_center' }
    }
  },
  processors: [
    // Moving average smoothing
    {
      type: 'moving_average',
      window: '5m',
      field: 'value'
    },
    // Celsius to Fahrenheit conversion
    {
      type: 'transform',
      expression: 'value * 9/5 + 32'
    },
    // Detect high temperature
    {
      type: 'threshold',
      condition: 'value > 80',
      action: 'emit_event',
      event: {
        type: 'high_temperature',
        severity: 'warning'
      }
    }
  ],
  sink: {
    type: 'signal',
    name: 'processed.temperature'
  }
});

// Start pipeline
await pipeline.start();
console.log('Pipeline running');
```

### Windowing Operations

Aggregate signals over time windows:

```typescript
// Tumbling window (non-overlapping)
const tumblingWindow = await client.signals.createAggregation({
  signal: 'api.requests',
  window: {
    type: 'tumbling',
    size: '1m' // 1 minute windows
  },
  aggregations: [
    { function: 'count', output: 'request_count' },
    { function: 'avg', field: 'response_time', output: 'avg_response_time' },
    { function: 'p95', field: 'response_time', output: 'p95_response_time' },
    { function: 'max', field: 'response_time', output: 'max_response_time' }
  ],
  output: 'api.metrics.1m'
});

// Sliding window (overlapping)
const slidingWindow = await client.signals.createAggregation({
  signal: 'cpu.usage',
  window: {
    type: 'sliding',
    size: '5m',
    slide: '1m' // New window every 1 minute
  },
  aggregations: [
    { function: 'avg', field: 'value', output: 'avg_cpu' },
    { function: 'max', field: 'value', output: 'peak_cpu' }
  ],
  output: 'cpu.rolling_stats'
});

// Session window (based on gaps in data)
const sessionWindow = await client.signals.createAggregation({
  signal: 'user.activity',
  window: {
    type: 'session',
    gap: '30m' // New session after 30 minutes of inactivity
  },
  aggregations: [
    { function: 'duration', output: 'session_duration' },
    { function: 'count', output: 'actions_count' },
    { function: 'collect_list', field: 'action', output: 'actions' }
  ],
  groupBy: ['user_id'],
  output: 'user.sessions'
});
```

### Complex Event Processing

Detect patterns across multiple signals:

```typescript
const complexEventRule = await client.signals.createCEPRule({
  name: 'security-breach-detection',
  pattern: {
    sequence: [
      {
        signal: 'auth.failed_login',
        condition: 'attempts >= 3',
        within: '5m',
        alias: 'failed_auth'
      },
      {
        signal: 'network.unusual_traffic',
        condition: 'volume > threshold',
        within: '10m',
        after: 'failed_auth',
        alias: 'suspicious_traffic'
      },
      {
        signal: 'file.access',
        condition: 'file_type = "sensitive"',
        within: '15m',
        after: 'suspicious_traffic',
        alias: 'data_access'
      }
    ],
    matchStrategy: 'strict', // or 'skip_till_next_match', 'skip_till_any_match'
  },
  action: {
    type: 'emit_alert',
    alert: {
      severity: 'critical',
      title: 'Potential Security Breach Detected',
      description: 'Multiple failed logins followed by unusual traffic and sensitive file access',
      tags: ['security', 'breach', 'critical']
    },
    notify: ['security-team@company.com'],
    runPlaybook: 'incident-response-breach'
  }
});
```

## Pattern Detection

### Regular Patterns

Detect recurring patterns:

```typescript
// Detect daily peak usage pattern
const dailyPattern = await client.signals.detectPattern({
  signal: 'cpu.usage',
  timeRange: { last: '30d' },
  pattern: {
    type: 'periodic',
    period: '1d',
    peakWindow: '2h',
    tolerance: 0.15 // 15% tolerance
  },
  output: {
    predictions: true,
    confidence: true
  }
});

console.log('Detected pattern:');
console.log('Peak hours:', dailyPattern.peakHours); // e.g., [9, 10, 14, 15, 16]
console.log('Peak days:', dailyPattern.peakDays); // e.g., ['Monday', 'Wednesday', 'Friday']
console.log('Next predicted peak:', dailyPattern.nextPeak);
```

### Trend Detection

Identify trends in signals:

```python
# Detect upward/downward trends
trend_detector = client.signals.create_trend_detector(
    signal='revenue.daily',
    methods=['linear_regression', 'mann_kendall', 'seasonal_decomposition'],
    min_confidence=0.85
)

# Run detection
result = trend_detector.detect(time_range={'last': '90d'})

print(f"Trend: {result.trend}")  # 'upward', 'downward', 'stable'
print(f"Slope: {result.slope}")  # rate of change
print(f"Confidence: {result.confidence}")
print(f"Forecast next 30 days: {result.forecast}")

# Seasonal decomposition
if result.seasonality:
    print(f"Seasonal period: {result.seasonal_period}")
    print(f"Seasonal strength: {result.seasonal_strength}")
```

### Shape-Based Matching

Find similar signal shapes:

```typescript
// Define reference shape
const referenceShape = await client.signals.createShape({
  name: 'normal_heartbeat',
  signal: 'ecg.reading',
  timeRange: {
    start: '2025-10-01T10:00:00Z',
    end: '2025-10-01T10:00:01Z'
  },
  normalize: true
});

// Search for similar shapes
const matches = await client.signals.findSimilarShapes({
  referenceShape: referenceShape.id,
  searchSignal: 'ecg.reading',
  timeRange: { last: '24h' },
  similarity: {
    algorithm: 'dynamic_time_warping', // or 'euclidean', 'pearson'
    threshold: 0.9
  },
  maxResults: 100
});

matches.forEach(match => {
  console.log(`Match at ${match.timestamp}: ${match.similarity}`);
  if (match.similarity < 0.7) {
    console.log('⚠️ Abnormal heartbeat detected');
  }
});
```

## Anomaly Detection

### Statistical Methods

Detect anomalies using statistical techniques:

```typescript
// Z-score based detection
const zScoreDetector = await client.signals.createAnomalyDetector({
  name: 'temperature-anomaly',
  signal: 'sensor.temperature',
  method: 'zscore',
  parameters: {
    threshold: 3.0, // 3 standard deviations
    window: '1h',
    minSamples: 100
  },
  action: {
    onAnomaly: 'emit_alert',
    severity: 'warning'
  }
});

// Interquartile Range (IQR) method
const iqrDetector = await client.signals.createAnomalyDetector({
  name: 'request-latency-anomaly',
  signal: 'api.latency',
  method: 'iqr',
  parameters: {
    multiplier: 1.5, // IQR multiplier
    window: '15m'
  }
});

// Exponential Weighted Moving Average (EWMA)
const ewmaDetector = await client.signals.createAnomalyDetector({
  name: 'network-traffic-anomaly',
  signal: 'network.bytes',
  method: 'ewma',
  parameters: {
    alpha: 0.3, // smoothing factor
    threshold: 3.5,
    warmupPeriod: '1h'
  }
});
```

### Machine Learning Methods

Use ML models for sophisticated anomaly detection:

```python
# Isolation Forest
isolation_forest = client.signals.create_anomaly_detector(
    name='transaction-fraud-detection',
    signal='transaction.amount',
    method='isolation_forest',
    features=[
        'amount',
        'merchant_category',
        'transaction_time',
        'location_distance',
        'user_age',
        'account_age'
    ],
    parameters={
        'contamination': 0.01,  # Expected anomaly rate
        'n_estimators': 200,
        'max_samples': 256
    },
    training={
        'data_range': {'last': '90d'},
        'retrain_interval': '7d'
    }
)

# Autoencoder (Deep Learning)
autoencoder = client.signals.create_anomaly_detector(
    name='system-behavior-anomaly',
    signal='system.metrics',
    method='autoencoder',
    features=[
        'cpu_usage',
        'memory_usage',
        'disk_io',
        'network_io',
        'process_count'
    ],
    parameters={
        'architecture': [64, 32, 16, 8, 16, 32, 64],
        'activation': 'relu',
        'learning_rate': 0.001,
        'reconstruction_threshold': 0.05
    },
    training={
        'epochs': 100,
        'batch_size': 128,
        'validation_split': 0.2
    }
)

# LSTM for time-series anomalies
lstm_detector = client.signals.create_anomaly_detector(
    name='predictive-maintenance',
    signal='machine.vibration',
    method='lstm',
    parameters={
        'sequence_length': 100,
        'hidden_units': [128, 64],
        'dropout': 0.2,
        'prediction_threshold': 0.1
    },
    training={
        'data_range': {'last': '6months'},
        'retrain_interval': '30d'
    }
)
```

### Ensemble Methods

Combine multiple detection methods:

```go
// Create ensemble detector
ensemble, err := client.Signals.CreateEnsembleDetector(&lydianiq.EnsembleDetectorConfig{
    Name:   "comprehensive-anomaly-detection",
    Signal: "application.metrics",
    Detectors: []lydianiq.DetectorConfig{
        {
            Method: "zscore",
            Weight: 0.3,
            Parameters: map[string]interface{}{
                "threshold": 3.0,
            },
        },
        {
            Method: "isolation_forest",
            Weight: 0.4,
            Parameters: map[string]interface{}{
                "contamination": 0.01,
            },
        },
        {
            Method: "lstm",
            Weight: 0.3,
            Parameters: map[string]interface{}{
                "sequence_length": 50,
            },
        },
    },
    VotingStrategy: "weighted_average",
    ThresholdStrategy: "adaptive", // or "fixed"
    MinAgreement: 2, // At least 2 detectors must agree
})

if err != nil {
    log.Fatal(err)
}

// Get anomaly detections
detections, err := ensemble.GetAnomalies(&lydianiq.AnomalyQuery{
    TimeRange: lydianiq.TimeRange{Last: "24h"},
    MinScore:  0.7,
})

for _, detection := range detections {
    fmt.Printf("Anomaly at %s: Score %.2f\n", detection.Timestamp, detection.Score)
    fmt.Printf("  Contributing detectors: %v\n", detection.Contributors)
}
```

## Signal Correlation

### Cross-Correlation Analysis

Find time-lagged relationships:

```typescript
// Compute cross-correlation between two signals
const correlation = await client.signals.crossCorrelate({
  signal1: 'marketing.spend',
  signal2: 'sales.revenue',
  maxLag: '30d',
  stepSize: '1d',
  method: 'pearson'
});

console.log('Correlation results:');
console.log('Best correlation:', correlation.maxCorrelation);
console.log('Optimal lag:', correlation.optimalLag); // e.g., "7d"
console.log('Interpretation: Marketing spend affects sales with a 7-day delay');

// Visualize correlation at different lags
correlation.lagCorrelations.forEach(({ lag, coefficient }) => {
  console.log(`Lag ${lag}: ${coefficient}`);
});
```

### Granger Causality

Test if one signal predicts another:

```python
# Test if signal A Granger-causes signal B
granger_test = client.signals.granger_causality_test(
    cause_signal='interest_rate',
    effect_signal='housing_prices',
    max_lag=12,  # months
    significance_level=0.05
)

print(f"P-value: {granger_test.p_value}")
print(f"F-statistic: {granger_test.f_statistic}")
print(f"Granger causes: {granger_test.causes}")

if granger_test.causes:
    print(f"Optimal lag: {granger_test.optimal_lag} months")
    print(f"Interest rate changes predict housing prices with {granger_test.optimal_lag}-month delay")
```

### Multi-Signal Correlation

Analyze relationships between multiple signals:

```typescript
const multiCorrelation = await client.signals.correlationMatrix({
  signals: [
    'cpu.usage',
    'memory.usage',
    'disk.io',
    'network.latency',
    'error.rate'
  ],
  timeRange: { last: '7d' },
  method: 'spearman',
  threshold: 0.7 // Only show correlations > 0.7
});

// Display correlation matrix
console.table(multiCorrelation.matrix);

// Find strongly correlated pairs
multiCorrelation.strongCorrelations.forEach(({ signal1, signal2, coefficient }) => {
  console.log(`${signal1} ↔ ${signal2}: ${coefficient}`);
});
```

## Time-Series Analysis

### Forecasting

Predict future signal values:

```typescript
// ARIMA forecasting
const arimaForecast = await client.signals.forecast({
  signal: 'sales.daily',
  method: 'arima',
  horizon: '30d',
  parameters: {
    p: 5, // AR order
    d: 1, // Differencing
    q: 2  // MA order
  },
  confidenceIntervals: [0.95, 0.80]
});

console.log('30-day sales forecast:');
arimaForecast.predictions.forEach(({ date, value, lower95, upper95 }) => {
  console.log(`${date}: ${value} (${lower95} - ${upper95})`);
});

// Prophet forecasting (handles seasonality well)
const prophetForecast = await client.signals.forecast({
  signal: 'website.traffic',
  method: 'prophet',
  horizon: '60d',
  parameters: {
    changepoint_prior_scale: 0.05,
    seasonality_mode: 'multiplicative',
    yearly_seasonality: true,
    weekly_seasonality: true,
    daily_seasonality: false
  }
});

// LSTM neural network forecasting
const lstmForecast = await client.signals.forecast({
  signal: 'stock.price',
  method: 'lstm',
  horizon: '7d',
  features: [
    'price',
    'volume',
    'volatility',
    'technical_indicators'
  ],
  parameters: {
    sequence_length: 60,
    hidden_units: [128, 64],
    dropout: 0.2,
    epochs: 100
  }
});
```

### Seasonal Decomposition

Break down signals into components:

```python
# Decompose time series
decomposition = client.signals.seasonal_decompose(
    signal='electricity.consumption',
    model='multiplicative',  # or 'additive'
    period=24  # hourly data with daily seasonality
)

# Access components
trend = decomposition.trend
seasonal = decomposition.seasonal
residual = decomposition.residual

# Analyze seasonality strength
print(f"Seasonal strength: {decomposition.seasonal_strength}")
print(f"Trend strength: {decomposition.trend_strength}")

# Detect change points in trend
changepoints = decomposition.detect_changepoints(
    min_significance=0.05,
    min_distance=168  # 1 week for hourly data
)

for cp in changepoints:
    print(f"Trend change at {cp.timestamp}: {cp.magnitude}")
```

## Filtering & Transformation

### Signal Filtering

Remove noise and smooth signals:

```typescript
// Low-pass filter (remove high-frequency noise)
const smoothed = await client.signals.filter({
  signal: 'sensor.raw_reading',
  filter: {
    type: 'butterworth_lowpass',
    cutoff: 0.1, // Hz
    order: 4
  },
  output: 'sensor.filtered'
});

// Median filter (remove spikes)
await client.signals.filter({
  signal: 'network.latency',
  filter: {
    type: 'median',
    window: 5
  },
  output: 'network.latency_smooth'
});

// Savitzky-Golay filter (preserve features while smoothing)
await client.signals.filter({
  signal: 'acceleration.z',
  filter: {
    type: 'savgol',
    windowLength: 11,
    polynomialOrder: 3
  },
  output: 'acceleration.z_filtered'
});
```

### Signal Transformation

Transform signals to extract features:

```typescript
// FFT (Frequency domain analysis)
const fft = await client.signals.transform({
  signal: 'vibration.sensor',
  transform: 'fft',
  window: '1s',
  overlap: 0.5
});

// Dominant frequencies
fft.dominantFrequencies.forEach(({ frequency, magnitude }) => {
  console.log(`${frequency} Hz: ${magnitude}`);
});

// Wavelet transform
const wavelet = await client.signals.transform({
  signal: 'seismic.activity',
  transform: 'wavelet',
  waveletType: 'db4',
  levels: 5
});

// Principal Component Analysis
const pca = await client.signals.transform({
  signals: ['feature1', 'feature2', 'feature3', 'feature4', 'feature5'],
  transform: 'pca',
  nComponents: 2,
  output: ['pca_1', 'pca_2']
});

console.log('Explained variance:', pca.explainedVariance);
```

## Best Practices

### Performance Optimization

**1. Batch Operations**

```typescript
// ✅ Good: Batch ingestion
const batch = client.signals.createBatch({ size: 1000 });
for (const reading of readings) {
  batch.add('sensor.temp', reading);
}
await batch.flush();

// ❌ Bad: Individual sends
for (const reading of readings) {
  await client.signals.send('sensor.temp', reading); // Too many network calls
}
```

**2. Use Downsampling**

```typescript
// Store high-resolution data with automatic downsampling
await client.signals.create({
  name: 'sensor.temperature',
  retention: {
    raw: '7d',      // Keep raw data for 7 days
    '1m': '90d',    // 1-minute aggregates for 90 days
    '1h': '2y',     // 1-hour aggregates for 2 years
    '1d': 'forever' // Daily aggregates forever
  },
  aggregations: ['avg', 'min', 'max', 'p95']
});
```

**3. Selective Processing**

```go
// Only process signals that match criteria
pipeline := client.Signals.CreatePipeline(&lydianiq.PipelineConfig{
    Source: &lydianiq.SourceConfig{
        Signal: "application.logs",
        Filter: &lydianiq.Filter{
            // Only process errors and warnings
            Condition: "level IN ('ERROR', 'WARN')",
        },
    },
    Processors: processors,
})
```

### Data Quality

**1. Handle Missing Data**

```python
# Interpolation for missing values
interpolated = client.signals.interpolate(
    signal='sensor.reading',
    method='linear',  # or 'cubic', 'forward_fill', 'backward_fill'
    max_gap='5m'  # Don't interpolate gaps larger than 5 minutes
)

# Fill with default value
filled = client.signals.fill_missing(
    signal='sensor.reading',
    strategy='constant',
    value=0
)
```

**2. Outlier Removal**

```typescript
// Remove outliers before analysis
const cleaned = await client.signals.removeOutliers({
  signal: 'price.bid',
  method: 'iqr',
  multiplier: 3.0,
  action: 'remove' // or 'cap', 'interpolate'
});
```

### Monitoring & Alerting

**1. Signal Health Monitoring**

```typescript
// Monitor signal health metrics
const healthCheck = await client.signals.createHealthMonitor({
  signal: 'critical.metric',
  checks: [
    {
      name: 'data_freshness',
      condition: 'last_update_age < 5m',
      severity: 'critical'
    },
    {
      name: 'data_completeness',
      condition: 'missing_rate < 0.05', // < 5% missing
      severity: 'warning'
    },
    {
      name: 'value_range',
      condition: 'value BETWEEN 0 AND 100',
      severity: 'error'
    }
  ],
  notifyOnFailure: ['ops-team@company.com']
});
```

**2. Alerting Best Practices**

```typescript
// Use hysteresis to avoid alert flapping
const alert = await client.signals.createAlert({
  signal: 'cpu.usage',
  condition: {
    enter: 'value > 90', // Alert when crossing 90%
    exit: 'value < 75',  // Clear when dropping below 75%
    duration: '5m'       // Must persist for 5 minutes
  },
  throttle: '15m', // Don't repeat alert more than once per 15 min
  escalation: [
    { after: '5m', notify: ['oncall-primary'] },
    { after: '15m', notify: ['oncall-secondary'] },
    { after: '30m', notify: ['engineering-leads'] }
  ]
});
```

## Related Documentation

- [LyDian IQ Getting Started](./lydian-iq-getting-started.md)
- [LyDian IQ Knowledge Graphs](./lydian-iq-knowledge-graphs.md)
- [LyDian IQ API Reference](/docs/api/lydian-iq/signals)
- [Signal Processing Concepts](/docs/en/concepts/lydian-iq-signal-processing.md)

## Support

- **Documentation**: https://docs.lydian.com
- **API Status**: https://status.lydian.com
- **Support Email**: support@lydian.com
- **Community Forum**: https://community.lydian.com
