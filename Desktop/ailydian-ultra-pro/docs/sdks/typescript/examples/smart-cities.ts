import { Lydian } from '@lydian/sdk';

const lydian = new Lydian({
  apiKey: process.env.LYDIAN_API_KEY,
});

async function smartCitiesExample() {
  // 1. Create city
  const city = await lydian.smartCities.createCity({
    name: 'Tokyo',
    country: 'Japan',
    population: 13960000,
    timezone: 'Asia/Tokyo',
    metadata: {
      mayor: 'Yuriko Koike',
      area_km2: 2194,
    },
  });

  console.log('City created:', city.id);

  // 2. Create city asset (sensor)
  const sensor = await lydian.smartCities.createAsset({
    cityId: city.id,
    type: 'sensor',
    name: 'Air Quality Sensor #1',
    location: {
      latitude: 35.6762,
      longitude: 139.6503,
      address: 'Shibuya, Tokyo',
    },
    status: 'active',
    metadata: {
      model: 'AQM-2000',
      installDate: '2024-01-15',
    },
  });

  console.log('Sensor created:', sensor.id);

  // 3. List all assets
  const assets = await lydian.smartCities.listAssets(city.id, {
    page: 1,
    limit: 20,
  });

  console.log(`Found ${assets.data.length} assets`);

  // 4. Get city metrics
  const metrics = await lydian.smartCities.getMetrics(
    city.id,
    '2024-01-01',
    '2024-01-31'
  );

  console.log('Metrics:', metrics);

  // 5. Create alert
  const alert = await lydian.smartCities.createAlert({
    cityId: city.id,
    type: 'environment',
    severity: 'high',
    title: 'High Air Pollution Detected',
    description: 'PM2.5 levels exceeded safe threshold',
    location: {
      latitude: 35.6762,
      longitude: 139.6503,
    },
    status: 'open',
  });

  console.log('Alert created:', alert.id);

  // 6. Update alert status
  const updatedAlert = await lydian.smartCities.updateAlert(
    alert.id,
    'acknowledged'
  );

  console.log('Alert acknowledged:', updatedAlert.status);
}

smartCitiesExample().catch(console.error);
