# @lydian/sdk - TypeScript/JavaScript SDK

Official TypeScript/JavaScript SDK for the Lydian AI Platform. Build intelligent applications with Smart Cities, İnsan IQ, and LyDian IQ APIs.

## Features

- **Full TypeScript Support** - Complete type definitions for all APIs
- **ESM & CommonJS** - Works in modern and legacy environments
- **Zero Dependencies** - Uses native fetch API
- **Automatic Retries** - Built-in retry logic with exponential backoff
- **OAuth2 & API Key** - Multiple authentication methods
- **Pagination Helpers** - Easy iteration through large datasets
- **Webhook Validation** - HMAC signature verification
- **Error Handling** - Type-safe error responses

## Installation

```bash
npm install @lydian/sdk
```

Or with yarn:

```bash
yarn add @lydian/sdk
```

Or with pnpm:

```bash
pnpm add @lydian/sdk
```

## Quick Start

```typescript
import { Lydian } from '@lydian/sdk';

// Initialize with API key
const lydian = new Lydian({
  apiKey: process.env.LYDIAN_API_KEY,
});

// Create a city
const city = await lydian.smartCities.createCity({
  name: 'San Francisco',
  country: 'USA',
  population: 873965,
});

console.log('City created:', city.id);
```

## Authentication

### API Key (Recommended)

```typescript
const lydian = new Lydian({
  apiKey: 'your-api-key',
});
```

Or use environment variable:

```bash
export LYDIAN_API_KEY=your-api-key
```

### OAuth2

```typescript
const lydian = new Lydian();

await lydian.authenticateOAuth2({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});
```

## API Modules

### Smart Cities

Manage cities, assets, metrics, and alerts:

```typescript
// Create city
const city = await lydian.smartCities.createCity({
  name: 'Tokyo',
  country: 'Japan',
  population: 13960000,
});

// Create sensor asset
const sensor = await lydian.smartCities.createAsset({
  cityId: city.id,
  type: 'sensor',
  name: 'Air Quality Sensor #1',
  location: {
    latitude: 35.6762,
    longitude: 139.6503,
  },
  status: 'active',
});

// Get metrics
const metrics = await lydian.smartCities.getMetrics(
  city.id,
  '2024-01-01',
  '2024-01-31'
);

// Create alert
const alert = await lydian.smartCities.createAlert({
  cityId: city.id,
  type: 'environment',
  severity: 'high',
  title: 'High Air Pollution Detected',
  description: 'PM2.5 levels exceeded safe threshold',
  status: 'open',
});
```

### İnsan IQ

Create AI personas and chat sessions:

```typescript
// Create persona
const persona = await lydian.insanIQ.createPersona({
  name: 'Dr. Sarah Chen',
  type: 'doctor',
  description: 'Cardiology specialist',
  capabilities: ['diagnosis', 'treatment-planning'],
});

// Publish skill
const skill = await lydian.insanIQ.publishSkill({
  personaId: persona.id,
  name: 'Echocardiogram Analysis',
  category: 'diagnostic',
  proficiencyLevel: 95,
});

// Create chat session
const session = await lydian.insanIQ.createSession({
  personaId: persona.id,
  userId: 'user-123',
  title: 'Patient consultation',
});

// Send message
const message = await lydian.insanIQ.sendMessage(
  session.id,
  'Patient presents with chest pain'
);

// Get history
const history = await lydian.insanIQ.getSessionHistory(session.id);
```

### LyDian IQ

Ingest signals and query knowledge graphs:

```typescript
// Ingest signal
const signal = await lydian.lydianIQ.ingestSignal({
  type: 'sensor',
  source: 'temperature-sensor-001',
  content: {
    temperature: 72.5,
    unit: 'fahrenheit',
  },
});

// Create knowledge entity
const entity = await lydian.lydianIQ.createEntity({
  type: 'Building',
  name: 'Smart Office Tower A',
  properties: {
    floors: 20,
    occupancy: 850,
  },
  relationships: [],
});

// Query knowledge graph
const result = await lydian.lydianIQ.queryKnowledge({
  query: 'Find all buildings with temperature sensors',
  entityTypes: ['Building', 'Sensor'],
  limit: 50,
});

// Generate insights
const insights = await lydian.lydianIQ.generateInsights(
  'Analyze building energy consumption patterns',
  { timeRange: '7d' }
);
```

## Pagination

```typescript
// Page-based pagination
let page = 1;
let hasMore = true;

while (hasMore) {
  const result = await lydian.smartCities.listCities({
    page,
    limit: 20,
  });

  console.log(`Page ${page}: ${result.data.length} cities`);
  hasMore = result.pagination.hasMore;
  page++;
}

// Cursor-based pagination
let cursor: string | undefined;
do {
  const result = await lydian.smartCities.listCities({
    limit: 20,
    cursor,
  });

  cursor = result.pagination.cursor;
} while (cursor);
```

## Error Handling

```typescript
import { LydianError } from '@lydian/sdk';

try {
  const city = await lydian.smartCities.getCity('invalid-id');
} catch (error) {
  if (error instanceof LydianError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Code:', error.code);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Webhook Validation

```typescript
import { verifyHmacSignature } from '@lydian/sdk';
import express from 'express';

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.post('/webhooks/lydian', (req, res) => {
  const signature = req.headers['x-lydian-signature'] as string;
  const payload = req.body.toString();

  const isValid = verifyHmacSignature(
    payload,
    signature,
    process.env.WEBHOOK_SECRET!
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(payload);
  console.log('Event:', event.type);

  res.json({ received: true });
});
```

## Configuration

```typescript
const lydian = new Lydian({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.lydian.ai/v1',
  timeout: 30000,        // 30 seconds
  retryAttempts: 3,      // Retry failed requests 3 times
  retryDelay: 1000,      // Wait 1 second before retry
});
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [quickstart.ts](./examples/quickstart.ts) - Basic usage
- [smart-cities.ts](./examples/smart-cities.ts) - Smart Cities API
- [insan-iq.ts](./examples/insan-iq.ts) - İnsan IQ API
- [lydian-iq.ts](./examples/lydian-iq.ts) - LyDian IQ API
- [authentication.ts](./examples/authentication.ts) - Auth methods
- [pagination.ts](./examples/pagination.ts) - Pagination patterns
- [webhooks.ts](./examples/webhooks.ts) - Webhook validation

## Requirements

- Node.js 18 or higher
- TypeScript 5.0 or higher (for TypeScript projects)

## Security Best Practices

1. **Never hardcode API keys** - Use environment variables
2. **Validate webhooks** - Always verify HMAC signatures
3. **Use HTTPS** - Never send credentials over HTTP
4. **Rotate keys** - Regularly rotate API keys and secrets
5. **Limit permissions** - Use API keys with minimum required permissions

## License

MIT

## Support

- Documentation: https://docs.lydian.ai
- API Reference: https://api.lydian.ai/docs
- Issues: https://github.com/lydian/typescript-sdk/issues
- Email: support@lydian.ai
