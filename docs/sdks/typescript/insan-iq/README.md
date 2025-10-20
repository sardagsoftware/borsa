# LyDian İnsan IQ SDK

Official TypeScript/JavaScript SDK for the LyDian İnsan IQ API.

## Installation

```bash
npm install @lydian/insan-iq-sdk
# or
yarn add @lydian/insan-iq-sdk
# or
pnpm add @lydian/insan-iq-sdk
```

## Quick Start

```typescript
import { createClient } from '@lydian/insan-iq-sdk';

// Create client with API key
const client = createClient({
  auth: { apiKey: process.env.LYDIAN_API_KEY }
});

// Create a persona
const persona = await client.createPersona({
  name: 'Customer Support Agent',
  personality: 'friendly, patient, solution-oriented',
  expertise: ['customer service', 'problem solving'],
  language: 'tr'
});

// Create an AI assistant
const assistant = await client.createAssistant({
  name: 'Support Bot',
  personaId: persona.personaId,
  skills: ['ticket-management'],
  capabilities: ['text-generation', 'sentiment-analysis']
});

console.log('Assistant created:', assistant.assistantId);
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

### Personas

- `createPersona(persona, idempotencyKey?)` - Create a new persona
- `listPersonas(params?)` - List all personas with pagination
- `getPersona(personaId)` - Get persona by ID

### Skills

- `publishSkill(skill, idempotencyKey?)` - Publish skill to marketplace
- `listSkills(params?)` - List skills in marketplace with pagination

### Assistants

- `createAssistant(assistant, idempotencyKey?)` - Create AI assistant
- `listAssistants(params?)` - List assistants with pagination
- `getAssistant(assistantId)` - Get assistant by ID

### Sessions

- `createSession(assistantId, session, idempotencyKey?)` - Create assistant session
- `listSessions(assistantId, params?)` - List sessions with pagination
- `getAssistantState(assistantId)` - Get assistant state

## Examples

See the [examples](./examples) directory for more usage examples:

- [quickstart.ts](./examples/quickstart.ts) - Basic usage
- [skills-marketplace.ts](./examples/skills-marketplace.ts) - Publishing and discovering skills

## License

MIT

## Support

- Documentation: https://docs.lydian.com
- API Reference: https://docs.lydian.com/api/insan-iq
- Issues: https://github.com/lydian/sdks/issues
