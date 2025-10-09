# @lydian-iq/economy-optimizer

AI-powered economic intelligence for e-commerce platforms.

## Features

- **Demand Forecasting**: Prophet/LightGBM time-series models
- **Price Elasticity**: Bayesian/GLM regression for optimal pricing
- **Promotion Simulation**: Monte Carlo simulation before launch
- **Route Optimization**: MIP/heuristics for cost/time/carbon optimization
- **Carbon Footprint**: Per-shipment emissions with green alternatives
- **Explainability**: All decisions include natural language reasoning

## Installation

```bash
npm install @lydian-iq/economy-optimizer
```

## Usage

### Economy Optimization

```typescript
import { EconomyOptimizer, DEFAULT_GUARDRAILS } from '@lydian-iq/economy-optimizer';

const optimizer = new EconomyOptimizer(DEFAULT_GUARDRAILS);

const result = await optimizer.optimize({
  goal: 'margin',
  channels: ['trendyol', 'hepsiburada'],
  time_horizon_days: 30,
  constraints: {
    min_margin_percent: 15,
    max_discount_percent: 30,
  },
  include_carbon: true,
});

console.log(result.explainability.natural_language_summary);
// "Based on demand forecast (35% weight) and price elasticity analysis (40% weight)..."

// Apply if approved
if (result.guardrails_passed && userApproved) {
  await optimizer.apply(result.optimization_id);
}
```

### Carbon Footprint

```typescript
import { CarbonEstimator } from '@lydian-iq/economy-optimizer';

const estimator = new CarbonEstimator();

const carbon = await estimator.estimate(
  'SHIP-123',
  500, // km
  10,  // kg
  'aras',
  'ground'
);

console.log(`${carbon.carbon_kg} kg CO2`);
// "0.31 kg CO2"

if (carbon.green_alternative_available) {
  console.log(`Green alternative: ${carbon.green_alternative_carbon_kg} kg CO2`);
}
```

## Compliance

- **KVKK/GDPR**: Aggregated data only, 7-day retention
- **White-hat**: Official APIs only, no scraping
- **Transparent**: All decisions include explainability
- **Auditable**: Attestation logs for critical operations

## License

Proprietary - Lydian AI Inc.
