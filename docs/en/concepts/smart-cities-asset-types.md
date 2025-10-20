# Smart Cities Asset Types

Understanding asset classification, taxonomies, and type hierarchies in the Smart Cities platform.

## Overview

Asset types define the classification system for organizing and managing IoT devices, sensors, and infrastructure within Smart Cities deployments.

### Core Concepts

**Asset Type**: A classification category that defines common characteristics, capabilities, and behaviors

**Type Hierarchy**: Parent-child relationships enabling inheritance of properties

**Type Templates**: Reusable configurations for creating assets of specific types

**Metadata Schema**: Required and optional fields for each asset type

## Standard Asset Types

### Environmental Sensors

**Air Quality Monitors**
- Metrics: PM2.5, PM10, CO2, NO2, O3, VOC
- Update frequency: 1-5 minutes
- Typical deployment: Urban areas, industrial zones
- Power: Mains or solar with battery backup

**Weather Stations**
- Metrics: Temperature, humidity, pressure, wind speed/direction, precipitation
- Update frequency: 5-15 minutes
- Coverage: City-wide grid deployment
- Calibration: Annual professional calibration required

**Noise Level Sensors**
- Metrics: dB(A) levels, frequency spectrum
- Update frequency: Real-time streaming
- Use cases: Construction zones, traffic monitoring
- Compliance: Local noise ordinance thresholds

### Traffic and Transportation

**Traffic Cameras**
- Capabilities: Vehicle counting, license plate recognition, incident detection
- Resolution: Minimum 1080p
- Storage: Cloud-based with local edge caching
- Privacy: Automatic face blurring

**Inductive Loop Detectors**
- Function: Vehicle presence detection
- Installation: Embedded in road surface
- Durability: 10-15 year lifespan
- Integration: Traffic signal control systems

**Smart Parking Sensors**
- Technology: Ultrasonic, magnetic, or camera-based
- Status reporting: Occupied/vacant binary state
- Network: LoRaWAN or NB-IoT
- Battery life: 5-10 years

### Utilities and Infrastructure

**Smart Street Lights**
- Controls: On/off, dimming, scheduling
- Sensors: Motion detection, ambient light
- Energy: LED with smart controller
- Maintenance: Remote diagnostics, predictive failure detection

**Water Quality Monitors**
- Parameters: pH, turbidity, chlorine, conductivity
- Deployment: Treatment plants, distribution network
- Alert thresholds: EPA/WHO compliance limits
- Calibration: Monthly automated + quarterly manual

**Smart Waste Bins**
- Sensors: Fill level (ultrasonic), weight, temperature
- Optimization: Route planning for collection
- Capacity: 50L to 1100L variants
- Communication: Cellular or LoRaWAN

## Type Hierarchy

### Inheritance Example

```
BaseAsset
├── Sensor
│   ├── EnvironmentalSensor
│   │   ├── AirQualitySensor
│   │   ├── WeatherStation
│   │   └── NoiseSensor
│   ├── TrafficSensor
│   │   ├── LoopDetector
│   │   ├── RadarSensor
│   │   └── TrafficCamera
│   └── UtilitySensor
│       ├── WaterQualitySensor
│       ├── EnergyMeter
│       └── SmartMeter
├── Actuator
│   ├── StreetLight
│   ├── TrafficSignal
│   └── IrrigationValve
└── Gateway
    ├── LoRaWANGateway
    ├── NBIoTGateway
    └── WiFiGateway
```

### Property Inheritance

**BaseAsset properties** (inherited by all):
- id, name, location (lat/lng), installation_date
- status, last_seen, firmware_version
- owner_organization, maintenance_schedule

**Sensor properties** (inherited by all sensors):
- sampling_rate, data_units, accuracy, calibration_date
- alert_thresholds, data_retention_days

**EnvironmentalSensor properties**:
- environmental_protection_rating (IP rating)
- operating_temperature_range
- certification_standards (EPA, WHO, etc.)

## Asset Templates

### Air Quality Monitor Template

```typescript
{
  type: 'air_quality_sensor',
  vendor: 'AirQuality Corp',
  model: 'AQ-2000',
  capabilities: {
    metrics: ['pm25', 'pm10', 'co2', 'no2', 'o3', 'voc'],
    sampling_rate: 60, // seconds
    accuracy: {
      pm25: '±10%',
      pm10: '±15%',
      co2: '±50 ppm'
    }
  },
  power: {
    type: 'solar_battery',
    battery_capacity: '20Ah',
    solar_panel: '50W',
    expected_uptime: '99.9%'
  },
  connectivity: {
    primary: 'wifi',
    fallback: 'cellular_4g',
    protocol: 'mqtt'
  },
  maintenance: {
    calibration_interval_days: 365,
    filter_replacement_days: 180,
    expected_lifespan_years: 10
  }
}
```

### Traffic Camera Template

```typescript
{
  type: 'traffic_camera',
  vendor: 'VisionTech',
  model: 'TC-4K-AI',
  capabilities: {
    resolution: '4K (3840x2160)',
    fps: 30,
    night_vision: true,
    analytics: [
      'vehicle_counting',
      'speed_estimation',
      'license_plate_recognition',
      'incident_detection'
    ]
  },
  storage: {
    local_cache: '1TB SSD',
    retention_hours: 72,
    cloud_archival: true
  },
  ai_processing: {
    edge_inference: true,
    models: ['yolo_v8', 'license_plate_ocr'],
    gpu: 'NVIDIA Jetson Nano'
  }
}
```

## Metadata Schemas

### Required Fields (All Types)

- **id**: Unique identifier (UUID)
- **type**: Asset type classification
- **location**: Geographic coordinates
- **status**: operational | maintenance | offline
- **installation_date**: ISO 8601 timestamp

### Type-Specific Required Fields

**Environmental Sensors**:
- calibration_certificate
- environmental_rating (IP67, IP68, etc.)
- measurement_units

**Traffic Infrastructure**:
- traffic_zone_id
- road_classification
- speed_limit

**Utility Meters**:
- meter_id
- service_address
- billing_account_number

### Optional Enrichment Fields

- asset_photo_url
- maintenance_contact
- warranty_expiration
- integration_endpoints
- custom_tags (key-value pairs)

## Use Cases by Type

### Deployment Patterns

**Dense Urban Coverage** (Air Quality):
- Grid spacing: 500m - 1km
- Sensor count: 100-500 per city
- Data aggregation: 15-minute averages
- Alert zones: School zones, hospitals

**Arterial Road Monitoring** (Traffic):
- Camera placement: Major intersections
- Coverage: 360-degree views
- Integration: Traffic signal optimization
- Historical analysis: Congestion patterns

**Neighborhood Services** (Waste Management):
- Bin density: 1 per 50-100 households
- Collection optimization: Fill-level based
- Cost savings: 30-40% reduction in trips
- Environmental impact: Lower emissions

## Related Documentation

- [Smart Cities Architecture](./smart-cities-architecture.md)
- [Managing Assets Guide](../guides/smart-cities-managing-assets.md)
- [Asset API Reference](/docs/api/smart-cities/assets)

## Support

- **Documentation**: https://docs.lydian.com
- **Support Email**: support@lydian.com
