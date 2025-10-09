# LyDian İnsan IQ SDK

Official Python SDK for the LyDian İnsan IQ API.

## Installation

```bash
pip install lydian-insan-iq
```

## Quick Start

```python
from lydian_insan_iq import InsanIQClient

# Create client with API key
client = InsanIQClient(api_key="your-api-key")

# Create a persona
persona = client.create_persona(
    name="Customer Support Agent",
    personality="friendly, patient, solution-oriented",
    expertise=["customer-service", "problem-solving"],
    language="tr"
)

# Create an AI assistant
assistant = client.create_assistant(
    name="Support Bot",
    persona_id=persona.persona_id,
    skills=["ticket-management"],
    capabilities=["text-generation", "sentiment-analysis"]
)

print(f"Assistant created: {assistant.assistant_id}")
```

## Features

✅ **Type Hints** - Full type annotations
✅ **Authentication** - OAuth2, API Key, and HMAC signature support
✅ **Pagination** - Cursor-based pagination
✅ **Rate Limiting** - Automatic retry
✅ **Idempotency** - Built-in support
✅ **Error Handling** - Typed exceptions

## License

MIT

## Support

- Documentation: https://docs.lydian.com
- API Reference: https://docs.lydian.com/api/insan-iq
