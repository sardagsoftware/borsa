/**
 * YAHOO FINANCE ADAPTER
 *
 * Free API for stocks, indices, forex
 * No API key required
 *
 * Supported: BIST100 (XU100.IS)
 */

export interface YahooQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
}

interface CachedYahooData {
  quote: YahooQuote;
  timestamp: number;
}

// Cache to avoid rate limits
const cache = new Map<string, CachedYahooData>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch quote from Yahoo Finance
 * Using public API endpoint
 */
export async function getYahooQuote(symbol: string): Promise<YahooQuote | null> {
  try {
    // Check cache first
    const cached = cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Yahoo Finance] Using cached quote for ${symbol}`);
      return cached.quote;
    }

    // Yahoo Finance v7 API (public, no auth)
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Yahoo Finance] HTTP ${response.status} for ${symbol}`);
      return null;
    }

    const data = await response.json();

    if (!data.quoteResponse?.result?.[0]) {
      console.error(`[Yahoo Finance] No data for ${symbol}`);
      return null;
    }

    const quote: YahooQuote = data.quoteResponse.result[0];

    // Cache it
    cache.set(symbol, {
      quote,
      timestamp: Date.now(),
    });

    console.log(`[Yahoo Finance] ${symbol}: ${quote.regularMarketPrice}`);
    return quote;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[Yahoo Finance] Timeout for ${symbol}`);
    } else {
      console.error(`[Yahoo Finance] Error fetching ${symbol}:`, error);
    }
    return null;
  }
}

/**
 * Generate sparkline from historical data (mock for now)
 */
export function generateSparkline(currentPrice: number, changePercent: number, points = 24): number[] {
  const sparkline: number[] = [];
  const startPrice = currentPrice / (1 + changePercent / 100);

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const price = startPrice + (currentPrice - startPrice) * progress;
    const noise = (Math.random() - 0.5) * currentPrice * 0.01; // 1% noise
    sparkline.push(price + noise);
  }

  // Ensure last point is current price
  sparkline[sparkline.length - 1] = currentPrice;

  return sparkline;
}
