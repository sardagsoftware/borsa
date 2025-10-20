# LyDian IQ SDK

Official Python SDK for the LyDian IQ API.

## Installation

```bash
pip install lydian-iq
```

## Quick Start

```python
from lydian_iq import LydianIQClient

# Create client with API key
client = LydianIQClient(api_key="your-api-key")

# Ingest a real-time signal
signal = client.ingest_signal(
    signal_type="user-event",
    source="web-app",
    payload={
        "eventType": "page-view",
        "userId": "user_123",
        "page": "/dashboard"
    }
)

print(f"Signal ingested: {signal.signal_id}")

# Query AI-derived insights
insights = client.get_insights(limit=5)
print(f"Found {len(insights.data)} insights")
```

## Features

✅ **Type Hints** - Full type annotations
✅ **Authentication** - OAuth2, API Key, and HMAC signature support
✅ **Pagination** - Cursor-based pagination
✅ **Rate Limiting** - Automatic retry
✅ **Idempotency** - Built-in support
✅ **Error Handling** - Typed exceptions
✅ **Knowledge Graph** - Build and query entity-relationship graphs

## License

MIT

## Support

- Documentation: https://docs.lydian.com
- API Reference: https://docs.lydian.com/api/lydian-iq
