# UKALAI Trading Platform - Developer Guide

**Version**: 2.0.0
**Last Updated**: 20 Ekim 2025
**Target Audience**: Developers, Contributors, System Architects

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Adding a New Trading Strategy](#adding-a-new-trading-strategy)
4. [Strategy Integration Checklist](#strategy-integration-checklist)
5. [Testing Strategies](#testing-strategies)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Security Guidelines](#security-guidelines)
9. [Code Style & Standards](#code-style--standards)
10. [Deployment](#deployment)

---

## Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────┐
│           User Interface (Next.js)              │
│  - Market Overview                              │
│  - Charts & Signals                             │
│  - Real-time Updates                            │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│      Strategy Aggregator (Orchestrator)         │
│  - Fetches candle data from Binance             │
│  - Runs all 9 strategies in parallel            │
│  - Calculates weighted consensus                │
│  - Triggers AI enhancement                      │
└──────────────────┬──────────────────────────────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
┌──────▼─────┐ ┌──▼──────┐ ┌──▼──────────┐
│  Strategy  │ │Strategy │ │   Strategy  │
│     1-6    │ │  7-9    │ │ AI Groq     │
│   (Core)   │ │(Advanced│ │(Enhancement)│
└────────────┘ └─────────┘ └─────────────┘
       │           │           │
       └───────────┼───────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│         Aggregated Signal Output                │
│  - Overall: STRONG_BUY / BUY / NEUTRAL          │
│  - Confidence: 0-100%                           │
│  - Entry / Stop Loss / Take Profit              │
│  - AI Enhancement (optional)                    │
└─────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── lib/
│   ├── strategy-aggregator.ts          # Main orchestrator
│   ├── signals/                        # Trading strategies
│   │   ├── ma-crossover-pullback.ts
│   │   ├── rsi-divergence.ts
│   │   ├── macd-histogram.ts
│   │   ├── bollinger-squeeze.ts
│   │   ├── ema-ribbon.ts
│   │   ├── volume-profile.ts
│   │   ├── fibonacci-retracement.ts    # Advanced
│   │   ├── ichimoku-cloud.ts           # Advanced
│   │   └── atr-volatility.ts           # Advanced
│   ├── ai/
│   │   └── groq-enhancer.ts            # AI enhancement
│   ├── monitoring/
│   │   ├── web-vitals.ts               # Performance monitoring
│   │   └── trading-metrics.ts          # Trading analytics
│   └── utils/                          # Helper functions
├── components/
│   ├── market/
│   │   ├── MarketOverview.tsx
│   │   ├── CoinCard.tsx
│   │   └── MultiStrategyModal.tsx
│   ├── scanner/
│   │   └── MACrossoverScanner.tsx
│   └── providers/
│       └── Providers.tsx               # App initialization
├── hooks/
│   └── useMarketData.ts                # Data fetching hooks
├── store/
│   └── useChartStore.ts                # State management
└── app/
    ├── layout.tsx                      # Root layout
    ├── page.tsx                        # Homepage
    └── (dashboard)/                    # Dashboard routes
        ├── market/
        └── charts/
```

---

## Development Setup

### Prerequisites

- **Node.js**: 18.17.0 or higher
- **pnpm**: 8.0.0 or higher
- **TypeScript**: 5.3.3 (already in package.json)

### Installation

```bash
# Clone repository
git clone [repository-url]
cd sardag-emrah

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Configure environment
# Add your API keys to .env.local:
# - GROQ_API_KEY (optional, for AI enhancement)
# - NEXT_PUBLIC_BASE_URL (production URL)

# Start development server
pnpm dev
```

### Development Commands

```bash
# Development server (http://localhost:3000)
pnpm dev

# Type checking
pnpm typecheck

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

### Environment Variables

```env
# AI Enhancement (Optional)
GROQ_API_KEY=gsk_...

# Base URL (Production)
NEXT_PUBLIC_BASE_URL=https://www.ukalai.ai

# Analytics (Optional - Privacy-first)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

## Adding a New Trading Strategy

### Step 1: Create Strategy File

Create a new file in `src/lib/signals/`:

```typescript
// src/lib/signals/your-strategy.ts

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface YourStrategySignal {
  type: 'your_strategy';
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number;      // 1-10
  confidence: number;    // 0-100

  // Strategy-specific data
  // ...

  // Risk management
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  targets?: number[];

  reason: string;
  timestamp: number;
}

/**
 * YOUR STRATEGY NAME
 *
 * Description of strategy logic, indicators used, success rate, etc.
 *
 * Success Rate: XX-YY%
 * Best Timeframes: 4H, 1D
 */
export function detectYourStrategy(candles: Candle[]): YourStrategySignal | null {
  // 1. Validate input
  if (candles.length < 50) return null; // Minimum data required

  const current = candles[candles.length - 1];
  const currentPrice = current.close;

  // 2. Calculate indicators
  // ... your calculations

  // 3. Determine signal
  let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  let strength = 5;
  let confidence = 50;
  let reason = 'Neutral - no clear signal';

  // 4. Signal logic
  if (/* bullish conditions */) {
    signal = 'BUY';
    strength = 8;
    confidence = 75;
    reason = 'Bullish setup detected';
  } else if (/* bearish conditions */) {
    signal = 'SELL';
    strength = 8;
    confidence = 75;
    reason = 'Bearish setup detected';
  }

  // 5. Calculate risk management levels
  const entryPrice = currentPrice;
  const stopLoss = signal === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02;
  const takeProfit = signal === 'BUY' ? currentPrice * 1.02 : currentPrice * 0.98;

  // 6. Return signal
  return {
    type: 'your_strategy',
    signal,
    strength,
    confidence,
    entryPrice,
    stopLoss,
    takeProfit,
    targets: [takeProfit],
    reason,
    timestamp: Date.now(),
  };
}

// Export default metadata
export default {
  detect: detectYourStrategy,
  name: 'Your Strategy Name',
  description: 'Brief description',
  successRate: 75, // Historical success rate
};
```

### Step 2: Integrate into Aggregator

Update `src/lib/strategy-aggregator.ts`:

```typescript
// 1. Import your strategy
import { detectYourStrategy, type YourStrategySignal } from './signals/your-strategy';

// 2. Add to strategy weights
const STRATEGY_WEIGHTS = {
  ichimoku: 1.00,
  volumeProfile: 0.98,
  emaRibbon: 0.95,
  fibonacci: 0.93,
  yourStrategy: 0.90,    // ← Add here (weight based on success rate)
  atrVolatility: 0.91,
  // ...
};

// 3. Run strategy in analyzeSymbol function
export async function analyzeSymbol(symbol: string, timeframe: string = '4h') {
  // ... existing code

  // Run your strategy
  const yourStrategy = detectYourStrategy(candles);
  strategies.push({
    name: 'Your Strategy Name',
    signal: yourStrategy,
    strength: yourStrategy?.strength || 0,
    weight: STRATEGY_WEIGHTS.yourStrategy,
    active: yourStrategy !== null && yourStrategy.strength >= 3,
    description: yourStrategy?.reason || 'No signal',
  });

  // ... rest of aggregation logic
}
```

### Step 3: Update Documentation

Update the header comment in `strategy-aggregator.ts`:

```typescript
/**
 * UNIFIED STRATEGY AGGREGATOR SYSTEM
 *
 * CORE STRATEGIES (6):
 * 1-6. [existing strategies]
 *
 * ADVANCED STRATEGIES (4):  ← Update count
 * 7. Fibonacci Retracement (72-82% success)
 * 8. Ichimoku Cloud (75-85% success)
 * 9. ATR Volatility (70-80% success)
 * 10. Your Strategy (XX-YY% success)  ← Add here
 *
 * AI ENHANCEMENT:
 * 11. Groq AI (Llama 3.3 70B) - Boosts confidence by +5-10%
 *
 * FINAL SUCCESS RATE: 93-95% (with AI)
 */
```

---

## Strategy Integration Checklist

Before integrating a new strategy, ensure:

### ✅ Code Quality
- [ ] TypeScript strict mode compliant (no `any` types)
- [ ] Comprehensive JSDoc comments
- [ ] Descriptive variable names
- [ ] No console.log in production code (use proper logging)

### ✅ Data Validation
- [ ] Input validation (minimum candles check)
- [ ] Null/undefined checks
- [ ] Division by zero protection
- [ ] Array bounds checking

### ✅ Strategy Logic
- [ ] Clear entry conditions
- [ ] Clear exit conditions
- [ ] Risk management (stop loss, take profit)
- [ ] Strength calculation (1-10 scale)
- [ ] Confidence calculation (0-100% scale)

### ✅ Performance
- [ ] Efficient calculations (O(n) or better)
- [ ] No unnecessary loops
- [ ] Minimal memory allocation
- [ ] Proper data structures

### ✅ Testing
- [ ] Test with different timeframes (1h, 4h, 1d)
- [ ] Test with trending markets
- [ ] Test with ranging markets
- [ ] Test with insufficient data
- [ ] Edge case handling

### ✅ Documentation
- [ ] Strategy description in file header
- [ ] Success rate documented
- [ ] Best timeframes documented
- [ ] Example usage provided
- [ ] API reference updated

### ✅ Zero-Error Guarantee
- [ ] `pnpm typecheck` passes (0 errors)
- [ ] `pnpm build` succeeds
- [ ] No runtime errors in browser console
- [ ] Graceful degradation on errors

---

## Testing Strategies

### Unit Testing (Manual)

Create a test file:

```typescript
// test-strategy.ts
import { detectYourStrategy } from '@/lib/signals/your-strategy';

async function testStrategy() {
  // Fetch real market data
  const response = await fetch(
    'https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=4h&limit=200'
  );
  const data = await response.json();

  const candles = data.map((d: any) => ({
    time: d[0],
    open: parseFloat(d[1]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
    close: parseFloat(d[4]),
    volume: parseFloat(d[5]),
  }));

  // Run strategy
  const signal = detectYourStrategy(candles);

  console.log('Signal:', signal);

  // Validate
  if (signal) {
    console.assert(signal.strength >= 1 && signal.strength <= 10, 'Strength out of range');
    console.assert(signal.confidence >= 0 && signal.confidence <= 100, 'Confidence out of range');
    console.assert(['BUY', 'SELL', 'NEUTRAL'].includes(signal.signal), 'Invalid signal type');
  }
}

testStrategy();
```

Run test:
```bash
npx ts-node test-strategy.ts
```

### Integration Testing

Test strategy within aggregator:

```typescript
import { analyzeSymbol } from '@/lib/strategy-aggregator';

async function testIntegration() {
  const signal = await analyzeSymbol('BTCUSDT', '4h');

  if (signal) {
    console.log(`Overall: ${signal.overall}`);
    console.log(`Confidence: ${signal.confidenceScore}%`);
    console.log(`Active Strategies: ${signal.agreementCount}/10`); // Updated count

    // Find your strategy
    const yourStrategy = signal.strategies.find(s => s.name === 'Your Strategy Name');
    if (yourStrategy) {
      console.log(`Your Strategy Active: ${yourStrategy.active}`);
      console.log(`Strength: ${yourStrategy.strength}/10`);
    }
  }
}

testIntegration();
```

### Backtesting (Advanced)

For historical performance analysis:

```typescript
async function backtest(symbol: string, days: number = 30) {
  const results = {
    totalSignals: 0,
    wins: 0,
    losses: 0,
    avgProfit: 0,
  };

  // Fetch historical data
  // ... implementation

  // For each time period
  for (const period of periods) {
    const signal = detectYourStrategy(period.candles);

    if (signal && signal.strength >= 7) {
      results.totalSignals++;

      // Check if signal was correct
      const actualOutcome = checkOutcome(signal, period.futureCandles);
      if (actualOutcome === 'win') {
        results.wins++;
      } else {
        results.losses++;
      }
    }
  }

  const winRate = (results.wins / results.totalSignals) * 100;
  console.log(`Win Rate: ${winRate.toFixed(2)}%`);

  return results;
}
```

---

## Performance Optimization

### 1. Efficient Calculations

Use sliding window approach:

```typescript
// ❌ BAD: Recalculates entire array every time
function calculateSMA(candles: Candle[], period: number): number[] {
  const sma: number[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    sma.push(sum / period);
  }
  return sma;
}

// ✅ GOOD: Uses running sum
function calculateSMA(candles: Candle[], period: number): number[] {
  const sma: number[] = [];
  let sum = 0;

  // Initial sum
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  sma.push(sum / period);

  // Sliding window
  for (let i = period; i < candles.length; i++) {
    sum = sum - candles[i - period].close + candles[i].close;
    sma.push(sum / period);
  }

  return sma;
}
```

### 2. Memoization

Cache expensive calculations:

```typescript
const cache = new Map<string, number[]>();

function calculateIndicator(candles: Candle[], period: number): number[] {
  const cacheKey = `${candles.length}_${period}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const result = expensiveCalculation(candles, period);
  cache.set(cacheKey, result);

  return result;
}
```

### 3. Early Returns

Fail fast:

```typescript
export function detectStrategy(candles: Candle[]): Signal | null {
  // Early validation
  if (candles.length < 50) return null;

  const current = candles[candles.length - 1];

  // Early exit if obvious non-signal
  if (current.volume < 1000) return null;

  // Continue with expensive calculations only if needed
  // ...
}
```

### 4. Bundle Size Optimization

Keep strategy files modular:

```typescript
// Split large strategies into smaller modules

// indicators.ts
export function calculateRSI(candles: Candle[], period: number): number[] {
  // Implementation
}

export function calculateMACD(candles: Candle[]): MACDResult {
  // Implementation
}

// strategy.ts
import { calculateRSI, calculateMACD } from './indicators';

export function detectStrategy(candles: Candle[]): Signal | null {
  const rsi = calculateRSI(candles, 14);
  const macd = calculateMACD(candles);
  // Use indicators
}
```

---

## Monitoring & Analytics

### Adding Strategy Metrics

Track your strategy's performance:

```typescript
import { tradingMetrics } from '@/lib/monitoring/trading-metrics';

export function detectYourStrategy(candles: Candle[]): YourStrategySignal | null {
  // ... strategy logic

  if (signal && signal.signal !== 'NEUTRAL') {
    // Track signal
    tradingMetrics.trackSignal({
      symbol: 'SYMBOL', // You may need to pass this as parameter
      signal: signal.signal,
      confidence: signal.confidence,
      entryPrice: signal.entryPrice || 0,
      strategiesUsed: ['Your Strategy Name'],
      aiEnhanced: false,
    });
  }

  return signal;
}
```

### Performance Logging

Add strategic logging:

```typescript
export function detectYourStrategy(candles: Candle[]): YourStrategySignal | null {
  const startTime = performance.now();

  // ... strategy logic

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  if (executionTime > 100) {
    console.warn(`[Your Strategy] Slow execution: ${executionTime.toFixed(2)}ms`);
  }

  return signal;
}
```

---

## Security Guidelines

### 1. Input Validation

Always validate external data:

```typescript
export function detectStrategy(candles: Candle[]): Signal | null {
  // Validate candles array
  if (!Array.isArray(candles) || candles.length === 0) {
    console.error('[Strategy] Invalid candles array');
    return null;
  }

  // Validate candle structure
  const validCandles = candles.every(c =>
    typeof c.open === 'number' &&
    typeof c.high === 'number' &&
    typeof c.low === 'number' &&
    typeof c.close === 'number' &&
    typeof c.volume === 'number' &&
    !isNaN(c.open) && !isNaN(c.high) && !isNaN(c.low) && !isNaN(c.close)
  );

  if (!validCandles) {
    console.error('[Strategy] Invalid candle data');
    return null;
  }

  // Continue with logic
}
```

### 2. API Key Security

Never expose API keys:

```typescript
// ❌ BAD
const API_KEY = 'gsk_abc123...';

// ✅ GOOD
const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.warn('AI enhancement disabled - no API key');
  return null;
}
```

### 3. Rate Limiting

Respect external API limits:

```typescript
class RateLimiter {
  private lastRequest = 0;
  private minInterval = 150; // ms between requests

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }

    this.lastRequest = Date.now();
    return fn();
  }
}

const rateLimiter = new RateLimiter();

// Usage
await rateLimiter.throttle(() => fetchCandles('BTCUSDT'));
```

### 4. White-Hat Principles

Follow ethical guidelines:

- ✅ No market manipulation
- ✅ Respect exchange rate limits
- ✅ No hidden fees or dark patterns
- ✅ Transparent success rates
- ✅ Clear risk warnings
- ✅ User data privacy (local storage only)

---

## Code Style & Standards

### TypeScript

```typescript
// Use strict types
export interface Signal {
  type: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL'; // Union types
  strength: number;
  confidence: number;
}

// Avoid 'any'
// ❌ BAD
function calculate(data: any): any {
  return data.value;
}

// ✅ GOOD
function calculate(data: { value: number }): number {
  return data.value;
}

// Use type guards
function isValidSignal(obj: unknown): obj is Signal {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    'signal' in obj
  );
}
```

### Naming Conventions

```typescript
// Functions: camelCase, descriptive verbs
function calculateMovingAverage() {}
function detectBullishDivergence() {}

// Interfaces: PascalCase
interface TradingSignal {}
interface CandleData {}

// Constants: UPPER_SNAKE_CASE
const MAX_CANDLES = 200;
const DEFAULT_TIMEFRAME = '4h';

// Private variables: _prefix
class Strategy {
  private _cache: Map<string, number>;
}
```

### Comments

```typescript
/**
 * Detects RSI divergence signals
 *
 * @param candles - Array of candle data (minimum 50 required)
 * @param period - RSI period (default: 14)
 * @returns Signal object or null if no signal detected
 *
 * @example
 * ```ts
 * const signal = detectRSIDivergence(candles, 14);
 * if (signal?.type === 'bullish') {
 *   console.log('Bullish divergence detected!');
 * }
 * ```
 */
export function detectRSIDivergence(
  candles: Candle[],
  period: number = 14
): RSIDivergenceSignal | null {
  // Implementation
}
```

---

## Deployment

### Pre-Deployment Checklist

```bash
# 1. Type check
pnpm typecheck
# ✅ Expected: 0 errors

# 2. Build
pnpm build
# ✅ Expected: Build succeeds, all pages generated

# 3. Check bundle size
# ✅ Expected: First Load JS < 100 kB

# 4. Test in production mode
pnpm build && pnpm start
# ✅ Navigate to http://localhost:3000 and test functionality

# 5. Verify environment variables
# ✅ Ensure NEXT_PUBLIC_BASE_URL is set correctly
```

### Production Build

```bash
# Build optimized production bundle
pnpm build

# Output should show:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Generating static pages (11/11)
# ✓ Finalizing page optimization

# Bundle Analysis
Route (app)                              Size     First Load JS
┌ ○ /                                   142 B          87.6 kB
├ ○ /_not-found                         871 B          88.3 kB
└ ○ /charts                             142 B           132 kB
```

### Zero-Error Guarantee

Always maintain:
- ✅ TypeScript: 0 errors
- ✅ Build: 0 errors
- ✅ ESLint: 0 errors (warnings allowed in development)
- ✅ Runtime: No uncaught exceptions

---

## Troubleshooting

### Common Issues

**Issue**: TypeScript error `Property 'X' does not exist on type 'Y'`

**Solution**: Add proper type definitions
```typescript
interface YourType {
  X: number; // Add missing property
}
```

**Issue**: `Cannot find module '@/lib/signals/your-strategy'`

**Solution**: Ensure file exists and tsconfig paths are correct

**Issue**: Strategy always returns null

**Solution**: Check minimum candle requirements and data validation

**Issue**: Performance degradation

**Solution**: Profile code, optimize loops, add memoization

---

## Best Practices Summary

1. **Type Safety**: Always use TypeScript strict mode
2. **Validation**: Validate all inputs, especially external data
3. **Performance**: Optimize calculations, use efficient algorithms
4. **Testing**: Test with real market data across timeframes
5. **Documentation**: Document strategy logic, success rates, usage
6. **Monitoring**: Track performance metrics
7. **Security**: Follow white-hat principles, protect API keys
8. **Zero Errors**: Maintain zero TypeScript and build errors

---

## Support & Contributing

- **API Reference**: `/UKALAI-API-REFERENCE.md`
- **User Guide**: `/UKALAI-USER-GUIDE.md`
- **Project Status**: `/UNIFIED-STRATEGY-SYSTEM-COMPLETE.md`

**Version**: 2.0.0
**Last Updated**: 20 Ekim 2025
**Production**: https://www.ukalai.ai
