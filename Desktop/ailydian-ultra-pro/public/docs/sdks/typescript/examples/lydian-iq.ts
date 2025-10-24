import { Lydian } from '@lydian/sdk';

const lydian = new Lydian({
  apiKey: process.env.LYDIAN_API_KEY,
});

async function lydianIQExample() {
  // 1. Ingest single signal
  const signal = await lydian.lydianIQ.ingestSignal({
    type: 'sensor',
    source: 'temperature-sensor-001',
    content: {
      temperature: 72.5,
      unit: 'fahrenheit',
      location: 'Building A, Floor 3',
    },
    metadata: {
      sensorModel: 'TempPro-200',
      batteryLevel: 87,
    },
  });

  console.log('Signal ingested:', signal.id);

  // 2. Batch ingest signals
  const signals = await lydian.lydianIQ.batchIngestSignals([
    {
      type: 'sensor',
      source: 'humidity-sensor-001',
      content: { humidity: 45, unit: 'percent' },
    },
    {
      type: 'sensor',
      source: 'air-quality-sensor-001',
      content: { pm25: 12.3, aqi: 48 },
    },
  ]);

  console.log(`Batch ingested ${signals.length} signals`);

  // 3. Create knowledge entity
  const entity = await lydian.lydianIQ.createEntity({
    type: 'Building',
    name: 'Smart Office Tower A',
    properties: {
      address: '123 Main St',
      floors: 20,
      occupancy: 850,
      energyEfficiencyRating: 'A+',
    },
    relationships: [
      {
        type: 'contains',
        targetId: 'floor-3',
        properties: { floor_number: 3 },
      },
    ],
  });

  console.log('Entity created:', entity.id);

  // 4. Query knowledge graph
  const queryResult = await lydian.lydianIQ.queryKnowledge({
    query: 'Find all buildings with temperature sensors showing anomalies',
    entityTypes: ['Building', 'Sensor'],
    filters: {
      'Sensor.type': 'temperature',
    },
    limit: 50,
  });

  console.log(`Found ${queryResult.entities.length} entities`);
  console.log(`Found ${queryResult.relationships.length} relationships`);
  console.log('Insights:', queryResult.insights);

  // 5. Generate insights
  const insights = await lydian.lydianIQ.generateInsights(
    'Analyze building energy consumption patterns',
    {
      timeRange: '7d',
      buildings: [entity.id],
    }
  );

  console.log(`Generated ${insights.length} insights`);

  insights.forEach(insight => {
    console.log(`\n[${insight.type}] ${insight.title}`);
    console.log(`Confidence: ${insight.confidence}%`);
    console.log(`Description: ${insight.description}`);
    if (insight.actionable && insight.actions) {
      console.log('Recommended actions:');
      insight.actions.forEach(action => console.log(`  - ${action}`));
    }
  });

  // 6. Get insights with filters
  const filteredInsights = await lydian.lydianIQ.getInsights({
    type: 'anomaly',
    minConfidence: 80,
    limit: 10,
  });

  console.log(`\nFound ${filteredInsights.data.length} high-confidence anomalies`);
}

lydianIQExample().catch(console.error);
