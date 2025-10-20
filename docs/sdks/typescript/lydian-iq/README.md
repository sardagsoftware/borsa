# LyDian IQ SDK

Official TypeScript/JavaScript SDK for the LyDian IQ API.

## Installation

```bash
npm install @lydian/lydian-iq-sdk
# or
yarn add @lydian/lydian-iq-sdk
# or
pnpm add @lydian/lydian-iq-sdk
```

## Quick Start

```typescript
import { createClient } from '@lydian/lydian-iq-sdk';

// Create client with API key
const client = createClient({
  auth: { apiKey: process.env.LYDIAN_API_KEY }
});

// Ingest a real-time signal
const signal = await client.ingestSignal({
  signalType: 'user-event',
  source: 'web-app',
  timestamp: new Date().toISOString(),
  payload: {
    eventType: 'page-view',
    userId: 'user_123',
    page: '/dashboard'
  }
});

console.log('Signal ingested:', signal.signalId);

// Query AI-derived insights
const insights = await client.getInsights({ limit: 5 });
console.log(`Found ${insights.data.length} insights`);
```

## Features

✅ **Type-Safe** - Full TypeScript support with auto-completion
✅ **Authentication** - OAuth2, API Key, and HMAC signature support
✅ **Pagination** - Cursor-based pagination for all list endpoints
✅ **Rate Limiting** - Automatic retry on rate limit with exponential backoff
✅ **Idempotency** - Built-in idempotency key support to prevent duplicates
✅ **Error Handling** - Standardized error responses with correlation IDs
✅ **Knowledge Graph** - Build and query entity-relationship graphs

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

### Signals

- `ingestSignal(signal, idempotencyKey?)` - Ingest real-time signal/event
- `listSignals(params?)` - List signals with pagination

### Indicators

- `getIndicators()` - Get dashboard indicators

### Knowledge Graph

- `createKnowledgeGraphNode(node, idempotencyKey?)` - Create entity node
- `queryKnowledgeGraphNodes(params?)` - Query nodes with pagination
- `createKnowledgeGraphEdge(edge, idempotencyKey?)` - Create relationship edge
- `queryKnowledgeGraphEdges(params?)` - Query edges with pagination

### Insights

- `getInsights(params?)` - Get AI-derived insights with pagination

## Examples

See the [examples](./examples) directory for more usage examples:

- [quickstart.ts](./examples/quickstart.ts) - Basic usage
- [knowledge-graph.ts](./examples/knowledge-graph.ts) - Building knowledge graphs

## License

MIT

## Support

- Documentation: https://docs.lydian.com
- API Reference: https://docs.lydian.com/api/lydian-iq
- Issues: https://github.com/lydian/sdks/issues
