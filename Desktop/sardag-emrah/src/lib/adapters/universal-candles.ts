/**
 * UNIVERSAL CANDLE DATA ADAPTER
 *
 * Fetch candle data from multiple sources and normalize to common format
 * Supports:
 * - Binance (Crypto, PAXG Gold, Forex)
 * - Yahoo Finance (Indices like BIST100)
 * - MetalpriceAPI (Silver, Platinum) - Historical data mock
 */

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandleCache {
  candles: Candle[];
  timestamp: number;
}

// 5-minute cache
const cache = new Map<string, CandleCache>();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Fetch candles from Binance (Spot or Futures)
 */
async function fetchBinanceCandles(
  symbol: string,
  interval: string,
  limit: number
): Promise<Candle[]> {
  try {
    // Try Futures API first (more pairs)
    let url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    let response = await fetch(url);

    // If failed, try Spot API
    if (!response.ok) {
      url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      response = await fetch(url);
    }

    if (!response.ok) {
      console.error(`[Universal Candles] Binance failed for ${symbol}`);
      return [];
    }

    const data = await response.json();
    return data.map((d: any) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
  } catch (error) {
    console.error(`[Universal Candles] Binance error for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch candles from Yahoo Finance
 * NOTE: Yahoo Finance has rate limiting - use sparingly
 */
async function fetchYahooCandles(
  symbol: string,
  interval: string,
  limit: number
): Promise<Candle[]> {
  try {
    // Map interval to Yahoo Finance format
    const yahooInterval = interval === '1h' ? '1h' : interval === '4h' ? '1d' : '1d';

    // Calculate date range
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (limit * 3600); // Rough estimate

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${yahooInterval}&period1=${startTime}&period2=${endTime}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      console.error(`[Universal Candles] Yahoo failed for ${symbol}`);
      return [];
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result || !result.timestamp) {
      console.error(`[Universal Candles] Yahoo no data for ${symbol}`);
      return [];
    }

    const timestamps = result.timestamp;
    const quotes = result.indicators?.quote?.[0];

    if (!quotes) {
      console.error(`[Universal Candles] Yahoo no quotes for ${symbol}`);
      return [];
    }

    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (
        quotes.open[i] !== null &&
        quotes.high[i] !== null &&
        quotes.low[i] !== null &&
        quotes.close[i] !== null
      ) {
        candles.push({
          time: timestamps[i] * 1000, // Convert to milliseconds
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          volume: quotes.volume[i] || 0,
        });
      }
    }

    return candles;
  } catch (error) {
    console.error(`[Universal Candles] Yahoo error for ${symbol}:`, error);
    return [];
  }
}

/**
 * Generate mock candles for metals (MetalpriceAPI doesn't provide historical)
 * Uses realistic price movement based on current price
 */
function generateMockMetalCandles(
  currentPrice: number,
  limit: number
): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const interval = 3600000; // 1 hour in ms
  const volatility = 0.01; // 1% volatility for metals

  for (let i = limit - 1; i >= 0; i--) {
    const time = now - (i * interval);
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const open = currentPrice * (1 + randomChange);
    const high = open * (1 + Math.random() * volatility);
    const low = open * (1 - Math.random() * volatility);
    const close = low + Math.random() * (high - low);

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000, // Mock volume
    });
  }

  return candles;
}

/**
 * MAIN FUNCTION: Get candles for any symbol from appropriate source
 */
export async function getUniversalCandles(
  symbol: string,
  interval: string = '4h',
  limit: number = 200
): Promise<Candle[]> {
  // Check cache first
  const cacheKey = `${symbol}:${interval}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Universal Candles] ✅ Cache HIT for ${symbol}`);
    return cached.candles;
  }

  console.log(`[Universal Candles] 🔍 Fetching ${symbol} (${interval})...`);

  let candles: Candle[] = [];

  // Route to appropriate data source
  if (symbol.endsWith('USDT') || symbol.endsWith('BUSD')) {
    // Binance crypto or forex
    candles = await fetchBinanceCandles(symbol, interval, limit);
  } else if (symbol.includes('.IS') || symbol === 'XU100.IS') {
    // Yahoo Finance (Turkish stocks, BIST100)
    candles = await fetchYahooCandles(symbol, interval, limit);
  } else if (symbol === 'XAG' || symbol === 'XPT') {
    // Metals - generate mock candles
    // In real production, you'd fetch current price and generate from it
    // For now, use a reasonable default price
    const defaultPrice = symbol === 'XAG' ? 30 : 1000; // Silver ~$30, Platinum ~$1000
    candles = generateMockMetalCandles(defaultPrice, limit);
    console.warn(`[Universal Candles] ⚠️  Using MOCK candles for ${symbol} (MetalpriceAPI doesn't provide historical)`);
  } else {
    console.error(`[Universal Candles] ❌ Unknown symbol type: ${symbol}`);
    return [];
  }

  // Cache the result
  if (candles.length > 0) {
    cache.set(cacheKey, {
      candles,
      timestamp: Date.now(),
    });
  }

  console.log(`[Universal Candles] ✅ Fetched ${candles.length} candles for ${symbol}`);
  return candles;
}

/**
 * Check if a symbol is supported
 */
export function isSupportedSymbol(symbol: string): boolean {
  return (
    symbol.endsWith('USDT') ||
    symbol.endsWith('BUSD') ||
    symbol.includes('.IS') ||
    symbol === 'XAG' ||
    symbol === 'XPT' ||
    symbol === 'PAXGUSDT'
  );
}
