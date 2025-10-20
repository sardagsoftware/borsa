# Lydian-IQ DevSDK

Official SDK for building Lydian-IQ plugins and connectors.

## Installation

```bash
npm install @lydian-iq/devsdk
```

## Quick Start

```typescript
import { createPlugin } from '@lydian-iq/devsdk';

const plugin = createPlugin({
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My awesome plugin',
  author: {
    name: 'Your Name',
    email: 'you@example.com',
  },
  license: 'MIT',
  capabilities: ['pricing'],
  // ... rest of manifest
});

// Register handlers
plugin.registerHandler('/calculate', async (input, context) => {
  context.logger.info('Calculating...', { input });
  return { result: 42 };
});

export default plugin;
```

## Features

- **Type-safe**: Full TypeScript support
- **Secure**: Sandboxed execution environment
- **Observable**: Built-in logging and metrics
- **Testable**: Easy to unit test with mock contexts

## Sample Plugins

See `/samples` directory for complete examples:
- **pricing-plugin**: Dynamic pricing rules
- **credit-formatter**: Credit offer formatter
- **shipping-label**: Shipping label generator

## Security

All plugins are scanned for:
- Vulnerabilities (OSV database)
- License compliance
- Code quality
- SBOM generation
- SLSA provenance

## Documentation

Visit https://lydian-iq.com/docs/devsdk for full documentation.
