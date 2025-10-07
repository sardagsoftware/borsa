# Smart Cities Data Ingestion Guide

Complete guide to ingesting, validating, transforming, and processing IoT sensor data at scale with the Smart Cities platform.

## Table of Contents

- [Overview](#overview)
- [Ingestion Methods](#ingestion-methods)
- [Data Validation](#data-validation)
- [Data Transformation](#data-transformation)
- [Batch vs Stream Processing](#batch-vs-stream-processing)
- [Protocol Support](#protocol-support)
- [Schema Management](#schema-management)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Best Practices](#best-practices)

## Overview

Smart Cities Data Ingestion enables you to collect data from thousands of IoT sensors, validate and transform it in real-time, and store it efficiently for analytics and monitoring.

### Key Features

- **Multi-Protocol Support**: HTTP, MQTT, CoAP, LoRaWAN, WebSocket
- **Real-Time Validation**: Schema validation, data quality checks
- **Automatic Transformation**: Data normalization, unit conversion
- **Scalable Ingestion**: Handle millions of events per second
- **Schema Evolution**: Backward-compatible versioning
- **Dead Letter Queues**: Graceful handling of invalid data

### Use Cases

- Traffic Sensors
- Environmental Monitoring
- Smart Parking
- Energy Management
- Waste Management
- Public Safety

## Ingestion Methods

### HTTP REST API

```typescript
import { SmartCitiesClient } from '@lydian/smart-cities';

const client = new SmartCitiesClient({
  apiKey: process.env.SMART_CITIES_API_KEY
});

await client.ingest.http({
  assetId: 'sensor_temp_001',
  metrics: {
    temperature: 23.5,
    humidity: 65.2
  }
});
```

### MQTT Protocol

```python
from lydian import SmartCitiesClient

client = SmartCitiesClient(api_key=os.environ['SMART_CITIES_API_KEY'])

mqtt_config = client.ingest.configure_mqtt(
    broker='mqtt.smartcity.example.com',
    topics=['sensors/temperature/#']
)
```

## Data Validation

### Schema Validation

```typescript
const schema = await client.schemas.create({
  name: 'temperature_sensor_v1',
  fields: [
    {
      name: 'temperature',
      type: 'float',
      validation: {min: -50, max: 60}
    }
  ]
});
```

## Related Documentation

- [Smart Cities Getting Started](./smart-cities-getting-started.md)
- [Managing Assets](./smart-cities-managing-assets.md)
- [Smart Cities API Reference](/docs/api/smart-cities/ingestion)

## Support

- **Documentation**: https://docs.lydian.com
- **Support Email**: support@lydian.com
