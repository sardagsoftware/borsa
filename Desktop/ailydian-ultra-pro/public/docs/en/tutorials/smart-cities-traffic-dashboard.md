# Tutorial: Building a Real-Time Traffic Monitoring Dashboard

## Overview

In this hands-on tutorial, you'll build a complete real-time traffic monitoring dashboard for smart cities. You'll learn how to ingest traffic sensor data, visualize real-time metrics, detect congestion, and send alerts when traffic conditions deteriorate.

**What You'll Build:**
- Real-time traffic map with live sensor data
- Traffic flow charts and heatmaps
- Congestion detection and alerting
- Historical traffic analysis
- Incident reporting system

**Time to Complete:** 2-3 hours

**Prerequisites:**
- Node.js 18+ or Python 3.8+
- LyDian API account with API key
- Basic knowledge of JavaScript/TypeScript or Python
- Familiarity with REST APIs and WebSockets

## Step 1: Project Setup

### Create Project Directory

```bash
mkdir traffic-dashboard
cd traffic-dashboard
npm init -y
```

### Install Dependencies

```bash
# Core dependencies
npm install @lydian/sdk axios dotenv

# Frontend (if building web UI)
npm install react react-dom next mapbox-gl chart.js

# Development tools
npm install -D typescript @types/node @types/react ts-node
```

### Create Environment Configuration

Create `.env` file:

```bash
LYDIAN_API_KEY=sk_live_abc123def456ghi789jkl
CITY_ID=city_01HXA2B3C4D5E6F7G8H9J0K1L2
MAPBOX_TOKEN=pk.your_mapbox_token_here
```

### Initialize TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Step 2: Initialize LyDian Client

Create `src/client.ts`:

```typescript
import { Lydian } from '@lydian/sdk';
import dotenv from 'dotenv';

dotenv.config();

export const client = new Lydian({
  apiKey: process.env.LYDIAN_API_KEY,
  baseUrl: 'https://api.lydian.com',
  timeout: 30000
});

export const CITY_ID = process.env.CITY_ID!;

// Verify connection
async function verifyConnection() {
  try {
    const city = await client.smartCities.getCity(CITY_ID);
    console.log(`✅ Connected to LyDian API - City: ${city.name}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to LyDian API:', error);
    return false;
  }
}

verifyConnection();
```

Test the connection:

```bash
npx ts-node src/client.ts
# Output: ✅ Connected to LyDian API - City: San Francisco
```

## Step 3: Register Traffic Sensors

Traffic sensors are registered as assets in the Smart Cities API.

Create `src/setup-sensors.ts`:

```typescript
import { client, CITY_ID } from './client';

interface TrafficSensor {
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  type: 'loop_detector' | 'camera' | 'radar';
  roadSegment: string;
  lanes: number;
}

const sensors: TrafficSensor[] = [
  {
    name: 'Highway 101 North - MP 432',
    location: { latitude: 37.7749, longitude: -122.4194 },
    type: 'loop_detector',
    roadSegment: 'US-101-N',
    lanes: 4
  },
  {
    name: 'Bay Bridge Toll Plaza',
    location: { latitude: 37.7983, longitude: -122.3778 },
    type: 'camera',
    roadSegment: 'I-80-W',
    lanes: 6
  },
  {
    name: 'Golden Gate Bridge South',
    location: { latitude: 37.8199, longitude: -122.4783 },
    type: 'radar',
    roadSegment: 'US-101-S',
    lanes: 6
  },
  {
    name: 'Market Street Downtown',
    location: { latitude: 37.7897, longitude: -122.4008 },
    type: 'loop_detector',
    roadSegment: 'MARKET-ST',
    lanes: 2
  },
  {
    name: 'Embarcadero Waterfront',
    location: { latitude: 37.7955, longitude: -122.3937 },
    type: 'camera',
    roadSegment: 'EMBARCADERO',
    lanes: 4
  }
];

async function registerSensors() {
  console.log('📡 Registering traffic sensors...\n');

  const registeredSensors = [];

  for (const sensor of sensors) {
    try {
      const asset = await client.smartCities.createAsset({
        cityId: CITY_ID,
        type: 'traffic_sensor',
        name: sensor.name,
        location: {
          type: 'Point',
          coordinates: [sensor.location.longitude, sensor.location.latitude]
        },
        status: 'active',
        capabilities: ['traffic_flow', 'vehicle_count', 'speed', 'occupancy'],
        metadata: {
          sensorType: sensor.type,
          roadSegment: sensor.roadSegment,
          lanes: sensor.lanes,
          manufacturer: 'TrafficTech Pro',
          installDate: '2024-01-01'
        }
      });

      console.log(`✅ Registered: ${sensor.name} (${asset.id})`);
      registeredSensors.push({ ...sensor, assetId: asset.id });
    } catch (error) {
      console.error(`❌ Failed to register ${sensor.name}:`, error.message);
    }
  }

  // Save sensor IDs for later use
  const fs = require('fs');
  fs.writeFileSync(
    './sensors.json',
    JSON.stringify(registeredSensors, null, 2)
  );

  console.log(`\n✅ Registered ${registeredSensors.length} sensors`);
  console.log('📄 Sensor IDs saved to sensors.json');
}

registerSensors();
```

Run the setup:

```bash
npx ts-node src/setup-sensors.ts
```

Expected output:

```
📡 Registering traffic sensors...

✅ Registered: Highway 101 North - MP 432 (asset_01HXA2B3C4D5E6F7G8H9J0K1L2)
✅ Registered: Bay Bridge Toll Plaza (asset_01HXB3C4D5E6F7G8H9J0K1L2M3)
✅ Registered: Golden Gate Bridge South (asset_01HXC4D5E6F7G8H9J0K1L2M3N4)
✅ Registered: Market Street Downtown (asset_01HXD5E6F7G8H9J0K1L2M3N4O5)
✅ Registered: Embarcadero Waterfront (asset_01HXE6F7G8H9J0K1L2M3N4O5P6)

✅ Registered 5 sensors
📄 Sensor IDs saved to sensors.json
```

## Step 4: Simulate Traffic Data

In production, real sensors would send data. For this tutorial, we'll simulate realistic traffic patterns.

Create `src/simulate-traffic.ts`:

```typescript
import { client } from './client';
import sensors from '../sensors.json';

interface TrafficReading {
  assetId: string;
  timestamp: Date;
  vehicleCount: number;  // vehicles per minute
  avgSpeed: number;      // km/h
  occupancy: number;     // percentage (0-100)
  congestionLevel: 'free' | 'moderate' | 'heavy' | 'stopped';
}

// Simulate traffic patterns based on time of day
function generateTrafficReading(sensor: any): TrafficReading {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Traffic patterns: morning rush (7-9), evening rush (17-19)
  let baseFlow = 30; // vehicles/minute
  let baseSpeed = 80; // km/h

  // Morning rush hour
  if (hour >= 7 && hour < 9) {
    baseFlow = 60 + Math.random() * 20;
    baseSpeed = 45 + Math.random() * 15;
  }
  // Evening rush hour
  else if (hour >= 17 && hour < 19) {
    baseFlow = 70 + Math.random() * 25;
    baseSpeed = 40 + Math.random() * 10;
  }
  // Night time
  else if (hour >= 23 || hour < 6) {
    baseFlow = 10 + Math.random() * 5;
    baseSpeed = 90 + Math.random() * 10;
  }
  // Normal hours
  else {
    baseFlow = 40 + Math.random() * 15;
    baseSpeed = 70 + Math.random() * 20;
  }

  // Add lane-based variation
  const flowPerLane = baseFlow / sensor.lanes;
  const vehicleCount = Math.round(flowPerLane * sensor.lanes * (0.8 + Math.random() * 0.4));

  // Calculate occupancy (percentage of road occupied)
  const occupancy = Math.min(100, (vehicleCount / sensor.lanes / 100) * 100);

  // Determine congestion level
  let congestionLevel: 'free' | 'moderate' | 'heavy' | 'stopped';
  if (baseSpeed > 70) congestionLevel = 'free';
  else if (baseSpeed > 50) congestionLevel = 'moderate';
  else if (baseSpeed > 20) congestionLevel = 'heavy';
  else congestionLevel = 'stopped';

  // Add occasional random incidents (5% chance)
  if (Math.random() < 0.05) {
    congestionLevel = 'stopped';
    baseSpeed = Math.random() * 10;
  }

  return {
    assetId: sensor.assetId,
    timestamp: now,
    vehicleCount,
    avgSpeed: Math.round(baseSpeed),
    occupancy: Math.round(occupancy),
    congestionLevel
  };
}

async function ingestMetric(assetId: string, metricType: string, value: number) {
  await client.smartCities.createMetric({
    assetId,
    timestamp: new Date().toISOString(),
    metricType,
    value,
    unit: getUnit(metricType)
  });
}

function getUnit(metricType: string): string {
  const units: Record<string, string> = {
    'traffic_flow': 'vehicles/min',
    'avg_speed': 'km/h',
    'occupancy': 'percent'
  };
  return units[metricType] || 'none';
}

async function simulateTraffic() {
  console.log('🚗 Starting traffic simulation...\n');

  // Ingest metrics every 30 seconds
  setInterval(async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Ingesting metrics...`);

    for (const sensor of sensors) {
      const reading = generateTrafficReading(sensor);

      try {
        // Ingest metrics in parallel
        await Promise.all([
          ingestMetric(sensor.assetId, 'traffic_flow', reading.vehicleCount),
          ingestMetric(sensor.assetId, 'avg_speed', reading.avgSpeed),
          ingestMetric(sensor.assetId, 'occupancy', reading.occupancy)
        ]);

        const congestionEmoji = {
          'free': '🟢',
          'moderate': '🟡',
          'heavy': '🟠',
          'stopped': '🔴'
        }[reading.congestionLevel];

        console.log(
          `${congestionEmoji} ${sensor.name}: ${reading.vehicleCount} veh/min, ` +
          `${reading.avgSpeed} km/h, ${reading.occupancy}% occupancy`
        );
      } catch (error) {
        console.error(`❌ Failed to ingest metrics for ${sensor.name}:`, error.message);
      }
    }

    console.log('');
  }, 30000); // Every 30 seconds

  // Keep process running
  console.log('✅ Traffic simulation started (Ctrl+C to stop)\n');
}

simulateTraffic();
```

Run the simulation:

```bash
npx ts-node src/simulate-traffic.ts
```

Expected output:

```
🚗 Starting traffic simulation...

✅ Traffic simulation started (Ctrl+C to stop)

[2024-01-01T08:30:00.000Z] Ingesting metrics...
🟡 Highway 101 North - MP 432: 72 veh/min, 52 km/h, 18% occupancy
🟠 Bay Bridge Toll Plaza: 95 veh/min, 38 km/h, 26% occupancy
🟢 Golden Gate Bridge South: 45 veh/min, 75 km/h, 12% occupancy
🟡 Market Street Downtown: 34 veh/min, 48 km/h, 28% occupancy
🟢 Embarcadero Waterfront: 28 veh/min, 68 km/h, 11% occupancy
```

## Step 5: Query Real-Time Traffic Data

Create `src/query-traffic.ts`:

```typescript
import { client, CITY_ID } from './client';
import sensors from '../sensors.json';

async function getCurrentTraffic() {
  console.log('📊 Fetching current traffic conditions...\n');

  for (const sensor of sensors) {
    try {
      // Query last 5 minutes of data
      const metrics = await client.smartCities.queryMetrics({
        assetId: sensor.assetId,
        metricTypes: ['traffic_flow', 'avg_speed', 'occupancy'],
        startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        aggregation: 'avg',
        interval: '1m'
      });

      // Calculate averages
      const avgFlow = average(metrics.filter(m => m.metricType === 'traffic_flow').map(m => m.value));
      const avgSpeed = average(metrics.filter(m => m.metricType === 'avg_speed').map(m => m.value));
      const avgOccupancy = average(metrics.filter(m => m.metricType === 'occupancy').map(m => m.value));

      console.log(`📍 ${sensor.name}`);
      console.log(`   Road: ${sensor.roadSegment} (${sensor.lanes} lanes)`);
      console.log(`   Flow: ${avgFlow.toFixed(1)} vehicles/min`);
      console.log(`   Speed: ${avgSpeed.toFixed(1)} km/h`);
      console.log(`   Occupancy: ${avgOccupancy.toFixed(1)}%`);
      console.log(`   Status: ${getCongestionStatus(avgSpeed)}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Error fetching metrics for ${sensor.name}:`, error.message);
    }
  }
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function getCongestionStatus(speed: number): string {
  if (speed >= 70) return '🟢 Free Flow';
  if (speed >= 50) return '🟡 Moderate';
  if (speed >= 20) return '🟠 Heavy';
  return '🔴 Stopped/Critical';
}

// Run every minute
setInterval(getCurrentTraffic, 60000);
getCurrentTraffic(); // Initial call
```

Run the query:

```bash
npx ts-node src/query-traffic.ts
```

## Step 6: Set Up Congestion Alerts

Create alert rules to notify when traffic congestion reaches critical levels.

Create `src/setup-alerts.ts`:

```typescript
import { client, CITY_ID } from './client';
import sensors from '../sensors.json';

async function setupCongestionAlerts() {
  console.log('🚨 Setting up congestion alerts...\n');

  for (const sensor of sensors) {
    // Alert when average speed drops below 30 km/h for 5 minutes
    const alert = await client.smartCities.createAlert({
      cityId: CITY_ID,
      name: `Heavy Congestion - ${sensor.name}`,
      description: `Alert when traffic speed drops below 30 km/h on ${sensor.roadSegment}`,
      condition: {
        assetId: sensor.assetId,
        metricType: 'avg_speed',
        operator: '<',
        threshold: 30,
        aggregation: 'avg',
        window: '5m'
      },
      severity: 'high',
      actions: [
        {
          type: 'webhook',
          url: 'https://your-app.com/api/traffic-alerts',
          method: 'POST'
        },
        {
          type: 'email',
          recipients: ['traffic-ops@city.gov']
        }
      ],
      enabled: true
    });

    console.log(`✅ Created alert: ${alert.name} (${alert.id})`);
  }

  // City-wide critical alert
  const cityWideAlert = await client.smartCities.createAlert({
    cityId: CITY_ID,
    name: 'City-Wide Traffic Emergency',
    description: 'Alert when 3 or more sensors report stopped traffic',
    condition: {
      metricType: 'avg_speed',
      operator: '<',
      threshold: 10,
      aggregation: 'count',
      window: '5m'
    },
    severity: 'critical',
    actions: [
      {
        type: 'webhook',
        url: 'https://your-app.com/api/emergency-alerts',
        method: 'POST'
      },
      {
        type: 'sms',
        recipients: ['+14155551234']
      }
    ],
    enabled: true
  });

  console.log(`\n✅ Created city-wide alert: ${cityWideAlert.name}`);
  console.log('📧 Alerts will be sent to traffic-ops@city.gov');
}

setupCongestionAlerts();
```

## Step 7: Build Real-Time Dashboard UI

Create `src/pages/dashboard.tsx` (Next.js React component):

```typescript
'use client';

import { useEffect, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { Line } from 'react-chartjs-2';
import { client } from '../client';

interface TrafficSensor {
  assetId: string;
  name: string;
  location: { latitude: number; longitude: number };
  roadSegment: string;
  currentFlow?: number;
  currentSpeed?: number;
  currentOccupancy?: number;
  congestionLevel?: string;
}

export default function TrafficDashboard() {
  const [sensors, setSensors] = useState<TrafficSensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<TrafficSensor | null>(null);
  const [historicalData, setHistoricalData] = useState<any>(null);

  // Load sensors on mount
  useEffect(() => {
    loadSensors();
    const interval = setInterval(loadSensors, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function loadSensors() {
    const sensorData = await fetch('/api/sensors').then(r => r.json());
    setSensors(sensorData);
  }

  // Load historical data when sensor is selected
  useEffect(() => {
    if (selectedSensor) {
      loadHistoricalData(selectedSensor.assetId);
    }
  }, [selectedSensor]);

  async function loadHistoricalData(assetId: string) {
    const data = await fetch(`/api/metrics?assetId=${assetId}&hours=24`).then(r => r.json());
    setHistoricalData(data);
  }

  function getMarkerColor(congestionLevel: string): string {
    const colors = {
      'free': '#22c55e',
      'moderate': '#eab308',
      'heavy': '#f97316',
      'stopped': '#ef4444'
    };
    return colors[congestionLevel] || '#6b7280';
  }

  return (
    <div className="dashboard">
      <header>
        <h1>🚦 Traffic Monitoring Dashboard</h1>
        <div className="stats">
          <div className="stat-card">
            <span className="label">Active Sensors</span>
            <span className="value">{sensors.length}</span>
          </div>
          <div className="stat-card">
            <span className="label">Congested Roads</span>
            <span className="value">
              {sensors.filter(s => s.congestionLevel === 'heavy' || s.congestionLevel === 'stopped').length}
            </span>
          </div>
          <div className="stat-card">
            <span className="label">Avg City Speed</span>
            <span className="value">
              {Math.round(sensors.reduce((sum, s) => sum + (s.currentSpeed || 0), 0) / sensors.length)} km/h
            </span>
          </div>
        </div>
      </header>

      <div className="content">
        {/* Map View */}
        <div className="map-container">
          <Map
            initialViewState={{
              latitude: 37.7749,
              longitude: -122.4194,
              zoom: 12
            }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          >
            {sensors.map((sensor) => (
              <Marker
                key={sensor.assetId}
                latitude={sensor.location.latitude}
                longitude={sensor.location.longitude}
                onClick={() => setSelectedSensor(sensor)}
              >
                <div
                  className="sensor-marker"
                  style={{ backgroundColor: getMarkerColor(sensor.congestionLevel || 'free') }}
                >
                  {sensor.currentSpeed}
                </div>
              </Marker>
            ))}
          </Map>
        </div>

        {/* Sensor Details Panel */}
        {selectedSensor && (
          <div className="details-panel">
            <h2>{selectedSensor.name}</h2>
            <p className="road-segment">{selectedSensor.roadSegment}</p>

            <div className="metrics">
              <div className="metric">
                <span className="metric-label">Flow</span>
                <span className="metric-value">{selectedSensor.currentFlow} veh/min</span>
              </div>
              <div className="metric">
                <span className="metric-label">Speed</span>
                <span className="metric-value">{selectedSensor.currentSpeed} km/h</span>
              </div>
              <div className="metric">
                <span className="metric-label">Occupancy</span>
                <span className="metric-value">{selectedSensor.currentOccupancy}%</span>
              </div>
            </div>

            {/* Historical Chart */}
            {historicalData && (
              <div className="chart-container">
                <h3>24-Hour Traffic Speed</h3>
                <Line
                  data={{
                    labels: historicalData.labels,
                    datasets: [{
                      label: 'Speed (km/h)',
                      data: historicalData.speeds,
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 120
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Step 8: Create API Endpoints

Create `src/pages/api/sensors.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { client, CITY_ID } from '../../client';
import sensorsConfig from '../../../sensors.json';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sensorsWithMetrics = await Promise.all(
      sensorsConfig.map(async (sensor) => {
        // Get last 1 minute of metrics
        const metrics = await client.smartCities.queryMetrics({
          assetId: sensor.assetId,
          metricTypes: ['traffic_flow', 'avg_speed', 'occupancy'],
          startTime: new Date(Date.now() - 60000).toISOString(),
          endTime: new Date().toISOString(),
          aggregation: 'avg',
          interval: '1m'
        });

        const flow = metrics.find(m => m.metricType === 'traffic_flow')?.value || 0;
        const speed = metrics.find(m => m.metricType === 'avg_speed')?.value || 0;
        const occupancy = metrics.find(m => m.metricType === 'occupancy')?.value || 0;

        let congestionLevel = 'free';
        if (speed < 20) congestionLevel = 'stopped';
        else if (speed < 50) congestionLevel = 'heavy';
        else if (speed < 70) congestionLevel = 'moderate';

        return {
          ...sensor,
          currentFlow: Math.round(flow),
          currentSpeed: Math.round(speed),
          currentOccupancy: Math.round(occupancy),
          congestionLevel
        };
      })
    );

    res.status(200).json(sensorsWithMetrics);
  } catch (error) {
    console.error('Error fetching sensors:', error);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
}
```

Create `src/pages/api/metrics.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { client } from '../../client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { assetId, hours = 24 } = req.query;

  if (!assetId || typeof assetId !== 'string') {
    return res.status(400).json({ error: 'assetId is required' });
  }

  try {
    const metrics = await client.smartCities.queryMetrics({
      assetId,
      metricTypes: ['avg_speed'],
      startTime: new Date(Date.now() - Number(hours) * 3600000).toISOString(),
      endTime: new Date().toISOString(),
      aggregation: 'avg',
      interval: '1h'
    });

    const labels = metrics.map(m => new Date(m.timestamp).toLocaleTimeString());
    const speeds = metrics.map(m => m.value);

    res.status(200).json({ labels, speeds });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}
```

## Step 9: Deploy and Test

### Start Development Server

```bash
npm run dev
```

Open http://localhost:3000/dashboard

### Test Workflow

1. **Verify Sensors Registered**
   ```bash
   curl https://api.lydian.com/v1/smart-cities/assets?cityId=$CITY_ID \
     -H "Authorization: Bearer $LYDIAN_API_KEY"
   ```

2. **Check Real-Time Data**
   - Open dashboard
   - Verify sensors appear on map
   - Click sensor to see details

3. **Trigger Alert**
   - Modify simulation to generate stopped traffic
   - Verify alert webhook fires

4. **View Historical Data**
   - Select sensor
   - Verify 24-hour chart displays

## Next Steps

**Enhancements:**
- Add predictive analytics (ML-based traffic forecasting)
- Implement route optimization suggestions
- Build incident management system
- Add public transit integration
- Create mobile app for citizens

**Production Deployment:**
- Deploy to Vercel/AWS/Azure
- Set up monitoring (Datadog, Sentry)
- Configure CDN for global access
- Implement authentication (Auth0)

## Troubleshooting

**Issue: No data appearing on dashboard**
- Verify simulation is running (`npx ts-node src/simulate-traffic.ts`)
- Check API key has correct permissions
- Inspect browser console for errors

**Issue: Alerts not firing**
- Verify webhook endpoint is accessible
- Check alert conditions are being met
- Review alert logs in LyDian dashboard

**Issue: Map not loading**
- Verify Mapbox token is valid
- Check browser console for CORS errors
- Ensure `NEXT_PUBLIC_MAPBOX_TOKEN` is set

## Conclusion

You've built a complete real-time traffic monitoring system! You learned how to:
- Register IoT assets (traffic sensors)
- Ingest time-series metrics
- Query and visualize real-time data
- Set up automated alerts
- Build an interactive dashboard

This foundation can be extended to monitor energy, water, air quality, and other smart city systems.

## Related Resources

- [Smart Cities API Reference](../api/smart-cities-api.md)
- [Managing Assets Guide](../guides/smart-cities-managing-assets.md)
- [Monitoring Metrics Guide](../guides/smart-cities-monitoring-metrics.md)
- [Webhooks & Events Guide](../guides/smart-cities-webhooks.md)
- [Architecture Overview](../concepts/smart-cities-architecture.md)
