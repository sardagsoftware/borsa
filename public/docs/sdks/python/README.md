# lydian-sdk - Python SDK

Official Python SDK for the Lydian AI Platform. Build intelligent applications with Smart Cities, İnsan IQ, and LyDian IQ APIs.

## Features

- **Type Hints** - Full type hints for Python 3.8+
- **Dataclasses** - Type-safe models using Python dataclasses
- **Automatic Retries** - Built-in retry logic with exponential backoff
- **OAuth2 & API Key** - Multiple authentication methods
- **Pagination Helpers** - Easy iteration through large datasets
- **Webhook Validation** - HMAC signature verification
- **Error Handling** - Comprehensive error handling

## Installation

```bash
pip install lydian-sdk
```

Or with poetry:

```bash
poetry add lydian-sdk
```

## Quick Start

```python
import os
from lydian import Lydian

# Initialize client with API key
lydian = Lydian(api_key=os.environ.get("LYDIAN_API_KEY"))

# Create a city
city = lydian.smart_cities.create_city(
    name="San Francisco",
    country="USA",
    population=873965
)

print(f"City created: {city.id}")
```

## Authentication

### API Key (Recommended)

```python
from lydian import Lydian

lydian = Lydian(api_key="your-api-key")
```

Or use environment variable:

```bash
export LYDIAN_API_KEY=your-api-key
```

### OAuth2

```python
from lydian import Lydian

lydian = Lydian()
lydian.authenticate_oauth2(
    client_id="your-client-id",
    client_secret="your-client-secret"
)
```

## API Modules

### Smart Cities

```python
# Create city
city = lydian.smart_cities.create_city(
    name="Tokyo",
    country="Japan",
    population=13960000
)

# Create sensor asset
sensor = lydian.smart_cities.create_asset(
    city_id=city.id,
    asset_type="sensor",
    name="Air Quality Sensor #1",
    location={"latitude": 35.6762, "longitude": 139.6503},
    status="active"
)

# Get metrics
metrics = lydian.smart_cities.get_metrics(
    city.id,
    start_date="2024-01-01",
    end_date="2024-01-31"
)

# Create alert
alert = lydian.smart_cities.create_alert(
    city_id=city.id,
    alert_type="environment",
    severity="high",
    title="High Air Pollution Detected",
    description="PM2.5 levels exceeded safe threshold",
    status="open"
)
```

### İnsan IQ

```python
# Create persona
persona = lydian.insan_iq.create_persona(
    name="Dr. Sarah Chen",
    persona_type="doctor",
    description="Cardiology specialist",
    capabilities=["diagnosis", "treatment-planning"]
)

# Publish skill
skill = lydian.insan_iq.publish_skill(
    persona_id=persona.id,
    name="Echocardiogram Analysis",
    category="diagnostic",
    proficiency_level=95
)

# Create chat session
session = lydian.insan_iq.create_session(
    persona_id=persona.id,
    user_id="user-123",
    title="Patient consultation"
)

# Send message
message = lydian.insan_iq.send_message(
    session.id,
    "Patient presents with chest pain"
)

# Get history
history = lydian.insan_iq.get_session_history(session.id)
```

### LyDian IQ

```python
from lydian.types import KnowledgeQuery

# Ingest signal
signal = lydian.lydian_iq.ingest_signal(
    signal_type="sensor",
    source="temperature-sensor-001",
    content={"temperature": 72.5, "unit": "fahrenheit"}
)

# Create knowledge entity
entity = lydian.lydian_iq.create_entity(
    entity_type="Building",
    name="Smart Office Tower A",
    properties={"floors": 20, "occupancy": 850},
    relationships=[]
)

# Query knowledge graph
result = lydian.lydian_iq.query_knowledge(
    KnowledgeQuery(
        query="Find all buildings with temperature sensors",
        entity_types=["Building", "Sensor"],
        limit=50
    )
)

# Generate insights
insights = lydian.lydian_iq.generate_insights(
    query="Analyze building energy consumption patterns",
    context={"time_range": "7d"}
)
```

## Pagination

```python
from lydian.types import PaginationParams

# Page-based pagination
page = 1
has_more = True

while has_more:
    result = lydian.smart_cities.list_cities(
        params=PaginationParams(page=page, limit=20)
    )
    print(f"Page {page}: {len(result.data)} cities")
    has_more = result.pagination.has_more
    page += 1

# Cursor-based pagination
cursor = None
while True:
    result = lydian.smart_cities.list_cities(
        params=PaginationParams(limit=20, cursor=cursor)
    )
    cursor = result.pagination.cursor
    if not cursor:
        break
```

## Error Handling

```python
from lydian import Lydian, LydianError

lydian = Lydian(api_key="your-api-key")

try:
    city = lydian.smart_cities.get_city("invalid-id")
except LydianError as e:
    print(f"API Error: {e.message}")
    print(f"Status: {e.status_code}")
    print(f"Code: {e.code}")
    print(f"Details: {e.details}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## Webhook Validation

```python
from flask import Flask, request, jsonify
from lydian.utils import verify_hmac_signature
import os

app = Flask(__name__)

@app.route("/webhooks/lydian", methods=["POST"])
def webhook():
    signature = request.headers.get("X-Lydian-Signature")
    payload = request.get_data(as_text=True)

    is_valid = verify_hmac_signature(
        payload,
        signature,
        os.environ.get("WEBHOOK_SECRET")
    )

    if not is_valid:
        return jsonify({"error": "Invalid signature"}), 401

    event = request.get_json()
    print(f"Event: {event['type']}")

    return jsonify({"received": True})
```

## Configuration

```python
lydian = Lydian(
    api_key="your-api-key",
    base_url="https://api.lydian.ai/v1",
    timeout=60,          # 60 seconds
    retry_attempts=5,    # Retry failed requests 5 times
    retry_delay=2        # Wait 2 seconds before retry
)
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [quickstart.py](./examples/quickstart.py) - Basic usage
- [smart_cities.py](./examples/smart_cities.py) - Smart Cities API
- [insan_iq.py](./examples/insan_iq.py) - İnsan IQ API
- [lydian_iq.py](./examples/lydian_iq.py) - LyDian IQ API
- [authentication.py](./examples/authentication.py) - Auth methods
- [webhooks.py](./examples/webhooks.py) - Webhook validation

## Requirements

- Python 3.8 or higher
- requests >= 2.25.0

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
- Issues: https://github.com/lydian/python-sdk/issues
- Email: support@lydian.ai
