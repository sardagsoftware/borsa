# LyDian Smart Cities SDK

Official Python SDK for the LyDian Smart Cities API.

## Installation

```bash
pip install lydian-smart-cities
```

## Quick Start

```python
from lydian_smart_cities import SmartCitiesClient

# Create client with API key
client = SmartCitiesClient(api_key="your-api-key")

# Create a smart city
city = client.create_city(
    name="İstanbul Smart City",
    latitude=41.0082,
    longitude=28.9784,
    population=15_840_900,
    timezone="Europe/Istanbul"
)

# Get real-time metrics
metrics = client.get_city_metrics(city.cityId)
print(f"AQI: {metrics.air['aqi']}")
```

## Features

✅ **Type Hints** - Full type annotations for IDE auto-completion
✅ **Authentication** - OAuth2, API Key, and HMAC signature support
✅ **Pagination** - Cursor-based pagination for all list endpoints
✅ **Rate Limiting** - Automatic retry on rate limit with exponential backoff
✅ **Idempotency** - Built-in idempotency key support to prevent duplicates
✅ **Error Handling** - Typed exceptions with correlation IDs

## Authentication

### API Key (Recommended)

```python
client = SmartCitiesClient(api_key="your-api-key")
```

### OAuth2

```python
client = SmartCitiesClient(access_token="your-access-token")
```

### HMAC Signature

```python
client = SmartCitiesClient(hmac_secret="your-hmac-secret")
```

## API Reference

### Cities

- `create_city(name, latitude, longitude, population, timezone, idempotency_key=None)` - Create a new smart city
- `list_cities(cursor=None, limit=50)` - List all cities with pagination
- `get_city(city_id)` - Get city by ID

### Assets

- `register_asset(city_id, asset_type, name, latitude, longitude, metadata=None, idempotency_key=None)` - Register IoT asset
- `list_assets(city_id, cursor=None, limit=50, asset_type=None)` - List city assets with pagination

### Metrics

- `get_city_metrics(city_id)` - Get real-time city metrics (traffic, energy, air, water)

### Events

- `report_event(city_id, event_type, severity, description, location=None, metadata=None, idempotency_key=None)` - Report city event
- `list_events(cursor=None, limit=50, city_id=None, event_type=None)` - List events with pagination

### Alerts

- `create_alert(city_id, alert_type, severity, message, idempotency_key=None)` - Create alert
- `list_alerts(cursor=None, limit=50, city_id=None, severity=None)` - List alerts with pagination

## Examples

See the [examples](./examples) directory for more usage examples:

- [quickstart.py](./examples/quickstart.py) - Basic usage
- [pagination.py](./examples/pagination.py) - Paginating through results
- [idempotency.py](./examples/idempotency.py) - Using idempotency keys

## Error Handling

```python
from lydian_smart_cities import SmartCitiesClient, ValidationError, NotFoundError

client = SmartCitiesClient(api_key="your-api-key")

try:
    city = client.get_city("invalid-id")
except NotFoundError as e:
    print(f"City not found: {e.message}")
    print(f"Correlation ID: {e.correlation_id}")
except ValidationError as e:
    print(f"Validation error: {e.message}")
    print(f"Details: {e.details}")
```

## License

MIT

## Support

- Documentation: https://docs.lydian.com
- API Reference: https://docs.lydian.com/api/smart-cities
- Issues: https://github.com/lydian/sdks/issues
