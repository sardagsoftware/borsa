# Building an Air Quality Dashboard

Step-by-step tutorial for building a production-ready air quality monitoring dashboard with real-time sensor data visualization.

## Overview

This tutorial demonstrates full-stack development with Smart Cities platform, covering:

- Backend: Sensor data ingestion and processing
- Frontend: Real-time dashboard with interactive maps
- Integration: WebSocket streaming, REST API
- Deployment: Production-ready configuration

**Time to complete**: 45-60 minutes

**Prerequisites**:
- Smart Cities API key
- Node.js 18+ and npm
- Basic React/TypeScript knowledge

## Architecture

```
Air Quality Sensors → Ingestion API → Time-Series DB
                                    ↓
                              WebSocket Server
                                    ↓
                          React Dashboard (Frontend)
```

## Step 1: Project Setup

### Initialize Project

```bash
mkdir air-quality-dashboard
cd air-quality-dashboard

# Initialize package.json
npm init -y

# Install dependencies
npm install express @lydian/smart-cities ws cors
npm install -D typescript @types/express @types/ws @types/node

# Frontend dependencies
npx create-react-app frontend --template typescript
cd frontend
npm install @lydian/smart-cities-client leaflet react-leaflet recharts
npm install -D @types/leaflet
```

### Project Structure

```
air-quality-dashboard/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── ingestion.ts
│   │   ├── websocket.ts
│   │   └── api.ts
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.tsx
│   │   │   ├── SensorCard.tsx
│   │   │   └── Chart.tsx
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── package.json
└── package.json
```

## Step 2: Backend - Data Ingestion

### Configure Smart Cities Client

```typescript
// backend/src/ingestion.ts
import { SmartCitiesClient } from '@lydian/smart-cities';

const client = new SmartCitiesClient({
  apiKey: process.env.SMART_CITIES_API_KEY!
});

interface SensorReading {
  sensorId: string;
  location: {
    lat: number;
    lng: number;
  };
  metrics: {
    pm25: number;
    pm10: number;
    aqi: number;
  };
  timestamp: Date;
}

export async function ingestSensorData(reading: SensorReading) {
  try {
    await client.metrics.record({
      assetId: reading.sensorId,
      metrics: [
        {
          name: 'pm25',
          value: reading.metrics.pm25,
          unit: 'μg/m³',
          timestamp: reading.timestamp
        },
        {
          name: 'pm10',
          value: reading.metrics.pm10,
          unit: 'μg/m³',
          timestamp: reading.timestamp
        },
        {
          name: 'aqi',
          value: reading.metrics.aqi,
          unit: 'index',
          timestamp: reading.timestamp
        }
      ],
      location: reading.location
    });

    console.log(`Ingested data from sensor ${reading.sensorId}`);
  } catch (error) {
    console.error('Ingestion failed:', error);
    throw error;
  }
}

export async function getSensorReadings(
  sensorIds: string[],
  startTime: Date,
  endTime: Date
) {
  const readings = await Promise.all(
    sensorIds.map(async (sensorId) => {
      const metrics = await client.metrics.query({
        assetId: sensorId,
        metrics: ['pm25', 'pm10', 'aqi'],
        start: startTime,
        end: endTime,
        granularity: '5m'
      });

      return {
        sensorId,
        data: metrics
      };
    })
  );

  return readings;
}
```

## Step 3: Backend - WebSocket Streaming

### Real-Time Data Streaming

```typescript
// backend/src/websocket.ts
import WebSocket from 'ws';
import { SmartCitiesClient } from '@lydian/smart-cities';

const client = new SmartCitiesClient({
  apiKey: process.env.SMART_CITIES_API_KEY!
});

export function setupWebSocketServer(server: any) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    // Subscribe to sensor updates
    const subscription = client.metrics.subscribe({
      assetIds: ['*'], // All sensors
      metrics: ['pm25', 'pm10', 'aqi'],
      onData: (data) => {
        // Stream to connected clients
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'sensor_update',
            data: {
              sensorId: data.assetId,
              metrics: data.metrics,
              timestamp: data.timestamp
            }
          }));
        }
      }
    });

    // Handle client messages
    ws.on('message', (message: string) => {
      try {
        const msg = JSON.parse(message);

        if (msg.type === 'subscribe_sensor') {
          // Subscribe to specific sensor
          console.log(`Client subscribed to sensor: ${msg.sensorId}`);
        }
      } catch (error) {
        console.error('Invalid message:', error);
      }
    });

    // Cleanup on disconnect
    ws.on('close', () => {
      console.log('Client disconnected');
      subscription.unsubscribe();
    });
  });

  return wss;
}
```

## Step 4: Backend - REST API

### Express API Endpoints

```typescript
// backend/src/api.ts
import express from 'express';
import cors from 'cors';
import { SmartCitiesClient } from '@lydian/smart-cities';

const app = express();
const client = new SmartCitiesClient({
  apiKey: process.env.SMART_CITIES_API_KEY!
});

app.use(cors());
app.use(express.json());

// Get all sensors
app.get('/api/sensors', async (req, res) => {
  try {
    const sensors = await client.assets.list({
      type: 'air_quality_sensor',
      status: 'active'
    });

    res.json({
      sensors: sensors.data.map(sensor => ({
        id: sensor.id,
        name: sensor.name,
        location: sensor.location,
        status: sensor.status,
        lastSeen: sensor.lastSeen
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sensors' });
  }
});

// Get sensor history
app.get('/api/sensors/:sensorId/history', async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { hours = 24 } = req.query;

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - Number(hours) * 3600000);

    const metrics = await client.metrics.query({
      assetId: sensorId,
      metrics: ['pm25', 'pm10', 'aqi'],
      start: startTime,
      end: endTime,
      granularity: '15m'
    });

    res.json({ history: metrics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get city-wide statistics
app.get('/api/statistics', async (req, res) => {
  try {
    const stats = await client.metrics.aggregate({
      metrics: ['pm25', 'pm10', 'aqi'],
      aggregation: 'avg',
      groupBy: ['location.city'],
      period: '1h'
    });

    res.json({ statistics: stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default app;
```

## Step 5: Backend - Server Setup

```typescript
// backend/src/server.ts
import http from 'http';
import app from './api';
import { setupWebSocketServer } from './websocket';

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

// Setup WebSocket
setupWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}`);
});
```

## Step 6: Frontend - Map Component

### Interactive Sensor Map

```tsx
// frontend/src/components/Map.tsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Sensor {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  metrics: {
    pm25: number;
    aqi: number;
  };
}

const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return '#00e400';      // Good
  if (aqi <= 100) return '#ffff00';     // Moderate
  if (aqi <= 150) return '#ff7e00';     // Unhealthy for sensitive
  if (aqi <= 200) return '#ff0000';     // Unhealthy
  if (aqi <= 300) return '#8f3f97';     // Very unhealthy
  return '#7e0023';                      // Hazardous
};

export const SensorMap: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3001');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'sensor_update') {
        setSensors(prev => {
          const updated = [...prev];
          const index = updated.findIndex(s => s.id === message.data.sensorId);

          if (index >= 0) {
            updated[index] = {
              ...updated[index],
              metrics: message.data.metrics
            };
          }

          return updated;
        });
      }
    };

    // Fetch initial sensor list
    fetch('http://localhost:3001/api/sensors')
      .then(res => res.json())
      .then(data => setSensors(data.sensors));

    return () => ws.close();
  }, []);

  return (
    <MapContainer
      center={[40.7128, -74.0060]}
      zoom={12}
      style={{ height: '600px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {sensors.map(sensor => (
        <CircleMarker
          key={sensor.id}
          center={[sensor.location.lat, sensor.location.lng]}
          radius={15}
          fillColor={getAQIColor(sensor.metrics?.aqi || 0)}
          color="#fff"
          weight={2}
          fillOpacity={0.8}
        >
          <Popup>
            <div>
              <h3>{sensor.name}</h3>
              <p>PM2.5: {sensor.metrics?.pm25} μg/m³</p>
              <p>AQI: {sensor.metrics?.aqi}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};
```

## Step 7: Frontend - Chart Component

### Time-Series Visualization

```tsx
// frontend/src/components/Chart.tsx
import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartProps {
  sensorId: string;
}

export const AirQualityChart: React.FC<ChartProps> = ({ sensorId }) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`http://localhost:3001/api/sensors/${sensorId}/history?hours=24`)
      .then(res => res.json())
      .then(result => {
        const formatted = result.history.map((point: any) => ({
          time: new Date(point.timestamp).toLocaleTimeString(),
          pm25: point.metrics.pm25,
          pm10: point.metrics.pm10,
          aqi: point.metrics.aqi
        }));
        setData(formatted);
      });
  }, [sensorId]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="pm25" stroke="#8884d8" name="PM2.5" />
        <Line type="monotone" dataKey="pm10" stroke="#82ca9d" name="PM10" />
        <Line type="monotone" dataKey="aqi" stroke="#ffc658" name="AQI" />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

## Step 8: Frontend - Main Application

```tsx
// frontend/src/App.tsx
import React, { useState } from 'react';
import { SensorMap } from './components/Map';
import { AirQualityChart } from './components/Chart';
import './App.css';

function App() {
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Air Quality Dashboard</h1>
        <p>Real-time monitoring across the city</p>
      </header>

      <main className="app-main">
        <section className="map-section">
          <h2>Sensor Locations</h2>
          <SensorMap />
        </section>

        {selectedSensor && (
          <section className="chart-section">
            <h2>24-Hour History</h2>
            <AirQualityChart sensorId={selectedSensor} />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
```

## Step 9: Deployment

### Environment Configuration

```bash
# backend/.env.production
SMART_CITIES_API_KEY=your_production_key
PORT=3001
NODE_ENV=production
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Frontend build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci && npm run build

COPY backend ./backend
COPY frontend/build ./frontend/build

EXPOSE 3001

CMD ["node", "backend/src/server.js"]
```

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd ../backend
npm run build
npm start
```

## Testing

### Backend API Tests

```typescript
// backend/tests/api.test.ts
import request from 'supertest';
import app from '../src/api';

describe('Air Quality API', () => {
  test('GET /api/sensors returns sensor list', async () => {
    const response = await request(app).get('/api/sensors');

    expect(response.status).toBe(200);
    expect(response.body.sensors).toBeInstanceOf(Array);
  });

  test('GET /api/sensors/:id/history returns time-series data', async () => {
    const response = await request(app)
      .get('/api/sensors/sensor_001/history')
      .query({ hours: 24 });

    expect(response.status).toBe(200);
    expect(response.body.history).toBeInstanceOf(Array);
  });
});
```

### Frontend Component Tests

```tsx
// frontend/src/components/__tests__/Map.test.tsx
import { render, screen } from '@testing-library/react';
import { SensorMap } from '../Map';

test('renders map component', () => {
  render(<SensorMap />);
  const mapElement = screen.getByRole('region');
  expect(mapElement).toBeInTheDocument();
});
```

## Performance Optimization

### Backend Caching

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

app.get('/api/sensors', async (req, res) => {
  const cacheKey = 'sensors_list';
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  const sensors = await client.assets.list({
    type: 'air_quality_sensor'
  });

  cache.set(cacheKey, sensors);
  res.json(sensors);
});
```

### Frontend Optimization

```tsx
import { memo, useMemo } from 'react';

export const SensorMap = memo(() => {
  const memoizedSensors = useMemo(() => {
    return sensors.map(sensor => ({
      ...sensor,
      color: getAQIColor(sensor.metrics.aqi)
    }));
  }, [sensors]);

  // Component render...
});
```

## Next Steps

- Add alert notifications for unhealthy AQI levels
- Implement historical data export (CSV, PDF)
- Add predictive analytics using ML models
- Create mobile-responsive design
- Implement user authentication
- Add multi-city support

## Related Documentation

- [Smart Cities Data Ingestion](../guides/smart-cities-data-ingestion.md)
- [Smart Cities Webhooks](../guides/smart-cities-webhooks.md)
- [Smart Cities API Reference](/docs/api/smart-cities)

## Support

- **Documentation**: https://docs.lydian.com
- **Support Email**: support@lydian.com
- **Sample Code**: https://github.com/lydian/examples
