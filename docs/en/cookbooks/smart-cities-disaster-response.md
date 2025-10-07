# Smart Cities Disaster Response Cookbook

Production-ready patterns for building emergency response systems with Smart Cities platform.

## Overview

Real-world recipes for earthquake detection, flood monitoring, evacuation coordination, and emergency alert systems.

## Recipe 1: Earthquake Early Warning

### Problem
Detect seismic activity and trigger automated alerts before major shaking arrives.

### Solution
Multi-sensor fusion with P-wave detection.

```typescript
import { SmartCitiesClient } from '@lydian/smart-cities';

const client = new SmartCitiesClient({
  apiKey: process.env.SMART_CITIES_API_KEY
});

interface SeismicReading {
  sensorId: string;
  pWaveDetected: boolean;
  magnitude: number;
  epicenterDistance: number;
  timestamp: Date;
}

async function processSeismicData(reading: SeismicReading) {
  if (reading.pWaveDetected && reading.magnitude > 5.0) {
    // Calculate time until S-wave arrival
    const pWaveSpeed = 6; // km/s
    const sWaveSpeed = 3.5; // km/s

    const pWaveTime = reading.epicenterDistance / pWaveSpeed;
    const sWaveTime = reading.epicenterDistance / sWaveSpeed;
    const warningTime = (sWaveTime - pWaveTime) * 1000; // ms

    // Trigger emergency alert
    await client.alerts.trigger({
      type: 'earthquake_warning',
      severity: 'critical',
      message: `Earthquake detected. Magnitude ${reading.magnitude}. Take cover in ${Math.floor(warningTime / 1000)} seconds.`,
      affectedArea: {
        center: await getSensorLocation(reading.sensorId),
        radius: reading.magnitude * 50 // km
      },
      actions: [
        'automated_shutoff_gas',
        'open_fire_doors',
        'alert_emergency_services'
      ]
    });

    // Trigger automated safety systems
    await triggerSafetySystems(reading);
  }
}

async function triggerSafetySystems(reading: SeismicReading) {
  const affectedAssets = await client.assets.queryByLocation({
    center: await getSensorLocation(reading.sensorId),
    radius: reading.magnitude * 50,
    types: ['gas_valve', 'fire_door', 'elevator']
  });

  await Promise.all([
    // Shut off gas lines
    ...affectedAssets
      .filter(a => a.type === 'gas_valve')
      .map(valve => client.actuators.command({
        assetId: valve.id,
        action: 'close'
      })),

    // Open fire doors
    ...affectedAssets
      .filter(a => a.type === 'fire_door')
      .map(door => client.actuators.command({
        assetId: door.id,
        action: 'unlock'
      })),

    // Stop elevators at nearest floor
    ...affectedAssets
      .filter(a => a.type === 'elevator')
      .map(elevator => client.actuators.command({
        assetId: elevator.id,
        action: 'emergency_stop'
      }))
  ]);
}
```

**Key Features**:
- P-wave detection for early warning
- Automated infrastructure control
- Zone-based alert distribution

## Recipe 2: Flood Detection and Routing

### Problem
Monitor water levels and reroute traffic before roads become impassable.

### Solution
Real-time water level monitoring with dynamic route optimization.

```typescript
interface FloodSensor {
  id: string;
  location: { lat: number; lng: number };
  waterLevel: number; // meters
  roadElevation: number; // meters
  flowRate: number; // cubic meters/hour
}

async function monitorFlooding() {
  const floodSensors = await client.assets.list({
    type: 'water_level_sensor',
    status: 'active'
  });

  for (const sensor of floodSensors.data) {
    const metrics = await client.metrics.latest({
      assetId: sensor.id,
      metrics: ['water_level', 'flow_rate']
    });

    const waterLevel = metrics.water_level;
    const roadElevation = sensor.metadata.road_elevation;

    // Critical threshold: water within 20cm of road surface
    if (waterLevel > roadElevation - 0.2) {
      await handleRoadFlooding(sensor, waterLevel, roadElevation);
    }

    // Predictive: rising water with high flow rate
    if (metrics.flow_rate > 100 && waterLevel > roadElevation - 0.5) {
      await predictiveRoadClosure(sensor, metrics);
    }
  }
}

async function handleRoadFlooding(
  sensor: any,
  waterLevel: number,
  roadElevation: number
) {
  // Close road
  await client.traffic.closeRoad({
    roadId: sensor.metadata.road_id,
    reason: 'flooding',
    severity: waterLevel > roadElevation ? 'impassable' : 'hazardous'
  });

  // Update navigation systems
  await client.traffic.updateRouting({
    excludeRoads: [sensor.metadata.road_id],
    reason: 'flooding',
    alternativeRoutes: true
  });

  // Alert emergency services
  await client.alerts.trigger({
    type: 'road_flooding',
    severity: 'high',
    location: sensor.location,
    message: `Road flooding detected. Water level: ${waterLevel.toFixed(2)}m. Road elevation: ${roadElevation.toFixed(2)}m.`,
    responders: ['fire_department', 'public_works']
  });

  // Notify affected citizens
  await sendPublicNotification({
    area: {
      center: sensor.location,
      radius: 5 // km
    },
    message: 'Road closure due to flooding. Use alternative routes.',
    channels: ['mobile_app', 'traffic_signs', 'radio']
  });
}

async function predictiveRoadClosure(sensor: any, metrics: any) {
  // Calculate time until flooding
  const timeToFlooding = calculateFloodingTime(
    metrics.water_level,
    sensor.metadata.road_elevation,
    metrics.flow_rate
  );

  if (timeToFlooding < 30) { // 30 minutes
    await client.alerts.trigger({
      type: 'flooding_prediction',
      severity: 'warning',
      message: `Road flooding expected in ${timeToFlooding} minutes. Seek alternative route.`,
      location: sensor.location
    });
  }
}

function calculateFloodingTime(
  currentLevel: number,
  roadElevation: number,
  flowRate: number
): number {
  const volumeNeeded = (roadElevation - currentLevel) * 1000; // cubic meters
  const timeHours = volumeNeeded / flowRate;
  return Math.floor(timeHours * 60); // minutes
}
```

**Key Features**:
- Predictive flood modeling
- Automated traffic rerouting
- Multi-channel citizen alerts

## Recipe 3: Mass Evacuation Coordination

### Problem
Coordinate safe evacuation of thousands of people during emergencies.

### Solution
Dynamic evacuation routing with capacity management.

```typescript
interface EvacuationZone {
  id: string;
  polygon: Array<{lat: number; lng: number}>;
  population: number;
  evacuated: number;
  shelters: string[];
}

async function coordinateEvacuation(emergencyType: string, affectedArea: any) {
  // Identify affected zones
  const zones = await identifyEvacuationZones(affectedArea);

  // Calculate shelter capacity
  const shelters = await client.assets.list({
    type: 'emergency_shelter',
    status: 'available'
  });

  const shelterCapacity = shelters.data.reduce(
    (total, shelter) => total + shelter.metadata.capacity,
    0
  );

  const totalPopulation = zones.reduce((sum, z) => sum + z.population, 0);

  if (totalPopulation > shelterCapacity) {
    await requestAdditionalResources(totalPopulation - shelterCapacity);
  }

  // Create evacuation plan
  const plan = await createEvacuationPlan(zones, shelters.data);

  // Execute evacuation
  await executeEvacuation(plan);

  // Monitor progress
  monitorEvacuationProgress(plan);
}

async function createEvacuationPlan(
  zones: EvacuationZone[],
  shelters: any[]
) {
  const plan = {
    zones: [] as any[],
    routes: [] as any[],
    timeline: [] as any[]
  };

  for (const zone of zones) {
    // Assign closest shelters with available capacity
    const assignedShelters = await assignShelters(
      zone,
      shelters,
      zone.population
    );

    // Calculate optimal evacuation routes
    const routes = await calculateEvacuationRoutes(
      zone,
      assignedShelters
    );

    // Traffic signal optimization
    await optimizeTrafficSignals(routes);

    plan.zones.push({
      zoneId: zone.id,
      population: zone.population,
      shelters: assignedShelters,
      routes: routes,
      estimatedDuration: calculateEvacuationTime(zone, routes)
    });
  }

  return plan;
}

async function optimizeTrafficSignals(routes: any[]) {
  // Green wave for evacuation routes
  for (const route of routes) {
    await client.traffic.configureSignals({
      roadIds: route.segments,
      mode: 'evacuation',
      priority: 'outbound',
      greenWaveDuration: 3600 // 1 hour
    });
  }
}

async function monitorEvacuationProgress(plan: any) {
  const interval = setInterval(async () => {
    for (const zone of plan.zones) {
      // Count people using traffic cameras + mobile data
      const currentPopulation = await estimateZonePopulation(zone.zoneId);
      const evacuated = zone.population - currentPopulation;
      const progress = (evacuated / zone.population) * 100;

      console.log(`Zone ${zone.zoneId}: ${progress.toFixed(1)}% evacuated`);

      if (progress >= 95) {
        console.log(`Zone ${zone.zoneId}: Evacuation complete`);
      }

      // Alert if evacuation is slower than expected
      if (progress < expectedProgress(zone)) {
        await sendEvacuationUpdate(zone, 'slow_progress');
      }
    }
  }, 60000); // Check every minute
}
```

**Key Features**:
- Dynamic shelter assignment
- Traffic signal optimization
- Real-time progress monitoring

## Recipe 4: Air Quality Emergency Response

### Problem
Respond to hazardous air quality events (chemical spills, fires).

### Solution
Automated air quality monitoring with zone-based health advisories.

```typescript
async function monitorHazardousAirQuality() {
  const sensors = await client.assets.list({
    type: 'air_quality_sensor'
  });

  for (const sensor of sensors.data) {
    const aqi = await client.metrics.latest({
      assetId: sensor.id,
      metrics: ['aqi', 'pm25', 'co', 'no2', 'voc']
    });

    // Hazardous threshold
    if (aqi.aqi > 300 || aqi.co > 50 || aqi.voc > 1000) {
      await handleAirQualityEmergency(sensor, aqi);
    }
  }
}

async function handleAirQualityEmergency(sensor: any, aqi: any) {
  // Identify affected area
  const affectedRadius = calculatePlumeRadius(aqi);

  // Close schools and public spaces
  await closePublicSpaces(sensor.location, affectedRadius);

  // Issue health advisory
  await client.alerts.trigger({
    type: 'air_quality_emergency',
    severity: 'critical',
    location: sensor.location,
    radius: affectedRadius,
    message: `Hazardous air quality detected. AQI: ${aqi.aqi}. Stay indoors. Close windows. Use air filtration.`,
    healthAdvice: {
      general_public: 'Avoid outdoor activities',
      sensitive_groups: 'Seek medical attention if experiencing symptoms',
      outdoor_workers: 'Suspend outdoor operations'
    }
  });

  // Activate emergency ventilation systems
  await activateVentilationSystems(sensor.location, affectedRadius);

  // Notify hospitals
  await notifyHealthcareProviders(sensor.location, affectedRadius, aqi);
}

async function activateVentilationSystems(location: any, radius: number) {
  const buildings = await client.assets.queryByLocation({
    center: location,
    radius: radius,
    types: ['hvac_system', 'air_filtration']
  });

  await Promise.all(
    buildings.map(building =>
      client.actuators.command({
        assetId: building.id,
        action: 'emergency_filtration_mode',
        parameters: {
          recirculation: true,
          external_air_intake: false,
          filtration_level: 'maximum'
        }
      })
    )
  );
}
```

**Key Features**:
- Multi-pollutant detection
- Automated building systems
- Targeted health advisories

## Recipe 5: Emergency Communication System

### Problem
Deliver critical alerts to affected populations across multiple channels.

### Solution
Multi-channel alert distribution with confirmation tracking.

```typescript
interface EmergencyAlert {
  type: 'earthquake' | 'flood' | 'fire' | 'chemical' | 'evacuation';
  severity: 'info' | 'warning' | 'critical';
  affectedArea: {
    polygon?: Array<{lat: number; lng: number}>;
    center?: {lat: number; lng: number};
    radius?: number;
  };
  message: string;
  instructions: string[];
  expiresAt: Date;
}

async function broadcastEmergencyAlert(alert: EmergencyAlert) {
  const citizens = await identifyAffectedPopulation(alert.affectedArea);

  // Multi-channel delivery
  await Promise.all([
    // Mobile push notifications
    sendPushNotifications(citizens, alert),

    // SMS for critical alerts
    alert.severity === 'critical'
      ? sendSMS(citizens, alert)
      : Promise.resolve(),

    // Public address systems
    activatePublicSpeakers(alert.affectedArea, alert),

    // Digital signage
    updateDigitalSigns(alert.affectedArea, alert),

    // Social media
    postToSocialMedia(alert),

    // Local radio/TV
    sendToMediaOutlets(alert),

    // Website/mobile app
    updateOfficialChannels(alert)
  ]);

  // Track delivery and confirmation
  return monitorAlertDelivery(alert, citizens);
}

async function sendPushNotifications(citizens: any[], alert: EmergencyAlert) {
  const batches = chunk(citizens, 1000);

  for (const batch of batches) {
    await client.notifications.sendBatch({
      recipients: batch.map(c => c.deviceId),
      notification: {
        title: `${alert.severity.toUpperCase()}: ${alert.type}`,
        body: alert.message,
        priority: alert.severity === 'critical' ? 'high' : 'normal',
        sound: alert.severity === 'critical' ? 'emergency_alert.wav' : 'default',
        vibration: alert.severity === 'critical' ? [0, 500, 200, 500] : [0, 200],
        actions: [
          { id: 'confirm', title: 'I am safe' },
          { id: 'help', title: 'I need assistance' }
        ],
        data: {
          alertId: alert.id,
          type: alert.type,
          instructions: alert.instructions
        }
      }
    });
  }
}

async function activatePublicSpeakers(area: any, alert: EmergencyAlert) {
  const speakers = await client.assets.queryByLocation({
    center: area.center,
    radius: area.radius,
    types: ['public_address_system']
  });

  const audioMessage = await textToSpeech(
    `Attention. This is an emergency alert. ${alert.message}. ${alert.instructions.join('. ')}`
  );

  await Promise.all(
    speakers.map(speaker =>
      client.actuators.command({
        assetId: speaker.id,
        action: 'broadcast',
        parameters: {
          message: audioMessage,
          repeat: alert.severity === 'critical' ? 3 : 1,
          volume: alert.severity === 'critical' ? 'maximum' : 'high'
        }
      })
    )
  );
}

async function monitorAlertDelivery(alert: EmergencyAlert, citizens: any[]) {
  const stats = {
    total: citizens.length,
    delivered: 0,
    confirmed_safe: 0,
    needs_help: 0,
    no_response: 0
  };

  const checkInterval = setInterval(async () => {
    const responses = await client.notifications.getResponses(alert.id);

    stats.delivered = responses.filter(r => r.status === 'delivered').length;
    stats.confirmed_safe = responses.filter(r => r.action === 'confirm').length;
    stats.needs_help = responses.filter(r => r.action === 'help').length;
    stats.no_response = stats.total - stats.delivered;

    console.log('Alert delivery status:', stats);

    // Dispatch help to those who need it
    const helpRequests = responses.filter(r => r.action === 'help');
    if (helpRequests.length > 0) {
      await dispatchEmergencyResponders(helpRequests);
    }

    // Follow up with non-responders after 30 minutes
    if (Date.now() - alert.timestamp > 30 * 60 * 1000) {
      await followUpNonResponders(alert, responses);
      clearInterval(checkInterval);
    }
  }, 60000);

  return stats;
}
```

**Key Features**:
- Multi-channel delivery
- Confirmation tracking
- Automated follow-up

## Related Documentation

- [Smart Cities Alerts & Events](../guides/smart-cities-alerts-events.md)
- [Smart Cities Webhooks](../guides/smart-cities-webhooks.md)
- [Event-Driven Architecture](../concepts/smart-cities-event-driven.md)

## Support

- **Documentation**: https://docs.lydian.com
- **Emergency Support**: emergency@lydian.com
- **24/7 Hotline**: +1-800-LYDIAN-911
