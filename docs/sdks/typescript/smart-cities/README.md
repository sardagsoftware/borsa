# LyDian Smart Cities SDK

Official TypeScript/JavaScript SDK for the LyDian Smart Cities API.

## Installation

```bash
npm install @lydian/smart-cities-sdk
# or
yarn add @lydian/smart-cities-sdk
# or
pnpm add @lydian/smart-cities-sdk
```

## Quick Start

```typescript
import { createClient } from '@lydian/smart-cities-sdk';

// Create client with API key
const client = createClient({
  auth: { apiKey: process.env.LYDIAN_API_KEY }
});

// Create a smart city
const city = await client.createCity({
  name: 'İstanbul Smart City',
  coordinates: { latitude: 41.0082, longitude: 28.9784 },
  population: 15_840_900,
  timezone: 'Europe/Istanbul'
});

// Get real-time metrics
const metrics = await client.getCityMetrics(city.cityId);
console.log('AQI:', metrics.air.aqi);
```

## Features

✅ **Type-Safe** - Full TypeScript support with auto-completion
✅ **Authentication** - OAuth2, API Key, and HMAC signature support
✅ **Pagination** - Cursor-based pagination for all list endpoints
✅ **Rate Limiting** - Automatic retry on rate limit with exponential backoff
✅ **Idempotency** - Built-in idempotency key support to prevent duplicates
✅ **Error Handling** - Standardized error responses with correlation IDs

## Authentication

### API Key (Recommended)

```typescript
const client = createClient({
  auth: { apiKey: 'your-api-key' }
});
```

### OAuth2

```typescript
const client = createClient({
  auth: { accessToken: 'your-access-token' }
});
```

### HMAC Signature

```typescript
const client = createClient({
  auth: {
    hmac: {
      secret: 'your-hmac-secret',
      algorithm: 'HMAC-SHA256'
    }
  }
});
```

## API Reference

### Cities

- `createCity(city, idempotencyKey?)` - Create a new smart city
- `listCities(params?)` - List all cities with pagination
- `getCity(cityId)` - Get city by ID

### Assets

- `registerAsset(cityId, asset, idempotencyKey?)` - Register IoT asset
- `listAssets(cityId, params?)` - List city assets with pagination

### Metrics

- `getCityMetrics(cityId)` - Get real-time city metrics (traffic, energy, air, water)

### Events

- `reportEvent(event, idempotencyKey?)` - Report city event
- `listEvents(params?)` - List events with pagination

### Alerts

- `createAlert(alert, idempotencyKey?)` - Create alert
- `listAlerts(params?)` - List alerts with pagination

## Examples

See the [examples](./examples) directory for more usage examples:

- [quickstart.ts](./examples/quickstart.ts) - Basic usage
- [pagination.ts](./examples/pagination.ts) - Paginating through results
- [idempotency.ts](./examples/idempotency.ts) - Using idempotency keys

## License

MIT

## Support

- Documentation: https://docs.lydian.com
- API Reference: https://docs.lydian.com/api/smart-cities
- Issues: https://github.com/lydian/sdks/issues
