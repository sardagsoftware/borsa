# Lydian-IQ Civic-Grid

**Anonymous aggregate statistics for public sector insights with Differential Privacy**

## Overview

Civic-Grid provides privacy-preserving aggregate statistics from e-commerce data for public sector institutions (government agencies, research organizations, NGOs). All data is protected with **Differential Privacy (DP)** and **k-anonymity** to ensure individual privacy while enabling valuable civic insights.

## Key Features

- **Differential Privacy (DP)**: Calibrated noise injection for (ε, δ)-DP guarantee
- **k-Anonymity**: Suppression of results below minimum group size threshold
- **Epsilon Budget Management**: Daily privacy budget tracking per institution
- **Institution Authentication**: API key-based access control
- **Rate Limiting**: Query limits to prevent abuse
- **Compliance**: KVKK/GDPR Article 89 (public interest research)

## Supported Insights

1. **Price Trend Analysis**: Regional/sectoral price trends over time
2. **Return Rate Statistics**: Aggregate return rates by region/sector
3. **Logistics Bottleneck Detection**: Shipping delay hotspots
4. **Sales Volume** (coming soon)

## Privacy Mechanisms

### Differential Privacy (DP)

Civic-Grid implements both Laplace and Gaussian mechanisms:

- **Laplace Mechanism**: ε-differential privacy
  - Scale = sensitivity / ε
  - Suitable for counting queries

- **Gaussian Mechanism**: (ε, δ)-differential privacy
  - σ² = 2 ln(1.25/δ) × sensitivity² / ε²
  - More flexible for complex queries

**Privacy Guarantee**: An attacker cannot determine with high confidence whether any individual's data was included in the dataset.

### k-Anonymity

Suppresses results where the group size < k (default: k=5) to prevent re-identification attacks.

## Installation

```bash
npm install @lydian-iq/civic-grid
```

## Usage

### 1. Initialize API and Register Institutions

```typescript
import { CivicInsightsAPI } from '@lydian-iq/civic-grid';

const api = new CivicInsightsAPI();

// Register a government institution
const apiKey = api.registerInstitution({
  institution_name: 'T.C. Ticaret Bakanlığı',
  institution_type: 'government',
  allowed_metrics: ['price_trend', 'return_rate', 'logistics_bottleneck'],
  rate_limit_per_day: 5000,
  epsilon_budget_per_day: 50.0,
  expires_in_days: 365,
});

console.log('API Key:', apiKey.key_id);
```

### 2. Query Price Trends

```typescript
const result = await api.query(apiKey.key_id, {
  metric: 'price_trend',
  region: 'İstanbul',
  sector: 'electronics',
  period_start: '2025-01-01T00:00:00Z',
  period_end: '2025-01-31T23:59:59Z',
  granularity: 'weekly',
  dp_epsilon: 1.0,
});

console.log('Price Trend:', result.data);
console.log('Privacy Guarantee:', result.data.privacy_guarantee);
console.log('Remaining Budget:', result.budget_status.remaining_epsilon);
```

### 3. Query Return Rates

```typescript
const result = await api.query(apiKey.key_id, {
  metric: 'return_rate',
  region: 'Ankara',
  sector: 'fashion',
  period_start: '2025-01-01T00:00:00Z',
  period_end: '2025-01-31T23:59:59Z',
  granularity: 'weekly',
  dp_epsilon: 1.0,
});

if (result.data.suppressed) {
  console.log('Result suppressed due to k-anonymity threshold');
} else {
  console.log('Return Rate:', result.data.return_rate_percent, '%');
}
```

### 4. Detect Logistics Bottlenecks

```typescript
const result = await api.query(apiKey.key_id, {
  metric: 'logistics_bottleneck',
  region: 'İstanbul',
  period_start: '2025-01-01T00:00:00Z',
  period_end: '2025-01-31T23:59:59Z',
  granularity: 'weekly',
  dp_epsilon: 1.0,
});

result.data.bottlenecks.forEach(bottleneck => {
  console.log(`${bottleneck.area}: ${bottleneck.avg_delay_hours}h delay (${bottleneck.severity})`);
});
```

## API Endpoints

### GET /api/insights/price-trend

Query price trends with DP protection.

**Headers**:
- `X-API-Key`: Institution API key (required)

**Query Parameters**:
- `region` (optional): City or province
- `sector` (optional): electronics | fashion | food | health | general
- `period_start` (required): ISO 8601 datetime
- `period_end` (required): ISO 8601 datetime
- `granularity` (optional): daily | weekly | monthly (default: weekly)
- `dp_epsilon` (optional): Privacy budget (0.1-5.0, default: 1.0)

**Response**:
```json
{
  "success": true,
  "data": {
    "metric": "price_trend",
    "region": "İstanbul",
    "sector": "electronics",
    "data_points": [
      {
        "date": "2025-01-01T00:00:00Z",
        "avg_price": 125.45,
        "price_change_percent": 2.3,
        "dp_noise_added": true
      }
    ],
    "dp_parameters": {
      "epsilon": 1.0,
      "sensitivity": 10.0,
      "noise_mechanism": "laplace"
    },
    "privacy_guarantee": "ε=1.0-differential privacy...",
    "data_quality": "high"
  },
  "budget_status": {
    "epsilon_consumed": "1.00",
    "queries_count": 1,
    "remaining_epsilon": "49.00"
  }
}
```

### GET /api/insights/return-rate

Query return rates with DP protection.

**Headers**:
- `X-API-Key`: Institution API key (required)

**Query Parameters**:
- `region` (optional): City or province
- `sector` (optional): electronics | fashion | food | health | general
- `period_start` (required): ISO 8601 datetime
- `period_end` (required): ISO 8601 datetime
- `dp_epsilon` (optional): Privacy budget (0.1-5.0, default: 1.0)

### GET /api/insights/logistics-bottlenecks

Detect logistics bottlenecks with DP protection.

**Headers**:
- `X-API-Key`: Institution API key (required)

**Query Parameters**:
- `region` (required): City or province
- `period_start` (required): ISO 8601 datetime
- `period_end` (required): ISO 8601 datetime
- `dp_epsilon` (optional): Privacy budget (0.1-5.0, default: 1.0)

## Error Handling

- **401 Unauthorized**: Invalid or missing API key
- **403 Forbidden**: Institution not authorized for requested metric
- **429 Too Many Requests**: Rate limit or epsilon budget exceeded
- **400 Bad Request**: Invalid query parameters

## Privacy Budget Management

Each institution has a daily epsilon budget. Once exhausted, queries return 429 error until the next day.

**Best Practices**:
- Use lower ε values (0.5-1.0) for better privacy
- Monitor budget consumption via `budget_status`
- Plan query frequency based on daily limits

## Compliance

Civic-Grid is designed for compliance with:
- **KVKK** (Turkish Data Protection Law)
- **GDPR Article 89** (Public interest research)
- **PDPL** (Qatar/Saudi data protection)

## Security

- Read-only API (no data modification)
- API key authentication
- Rate limiting per institution
- Epsilon budget tracking
- All responses are DP-protected aggregates
- No individual-level data exposure

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run typecheck

# Run tests
npm test
```

## License

UNLICENSED - Internal use only

## Support

For institution API key registration, contact: civic-grid@ailydian.com
