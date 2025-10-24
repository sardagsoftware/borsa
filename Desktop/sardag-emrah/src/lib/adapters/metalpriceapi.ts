/**
 * METALPRICE API ADAPTER
 *
 * Free API for precious metals (Gold, Silver, Platinum, Palladium)
 * Free tier: 100 requests/month
 * Base: USD
 *
 * Docs: https://metalpriceapi.com/documentation
 */

export interface MetalPrice {
  success: boolean;
  base: string; // USD
  timestamp: number;
  rates: {
    XAU?: number; // Gold (Troy Ounce)
    XAG?: number; // Silver (Troy Ounce)
    XPT?: number; // Platinum (Troy Ounce)
    XPD?: number; // Palladium (Troy Ounce)
  };
}

interface CachedMetalData {
  price: number;
  timestamp: number;
}

// Simple cache to avoid hitting rate limits
const cache = new Map<string, CachedMetalData>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get metal price from MetalpriceAPI
 * Free tier: No API key required, but limited to 100 req/month
 */
export async function getMetalPrice(
  symbol: 'XAG' | 'XPT' | 'XPD' | 'XAU'
): Promise<number | null> {
  try {
    // Check cache first
    const cached = cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[MetalpriceAPI] Using cached price for ${symbol}`);
      return cached.price;
    }

    // Free tier endpoint (no API key)
    const url = `https://api.metalpriceapi.com/v1/latest?base=USD&currencies=${symbol}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[MetalpriceAPI] HTTP ${response.status} for ${symbol}`);
      return null;
    }

    const data: MetalPrice = await response.json();

    if (!data.success || !data.rates || !data.rates[symbol]) {
      console.error(`[MetalpriceAPI] Invalid data for ${symbol}`);
      return null;
    }

    // Price is returned as "USD per troy ounce"
    // We need "troy ounce per USD" (inverse)
    const pricePerOunce = 1 / data.rates[symbol];

    // Cache it
    cache.set(symbol, {
      price: pricePerOunce,
      timestamp: Date.now(),
    });

    console.log(`[MetalpriceAPI] ${symbol}: $${pricePerOunce.toFixed(2)}`);
    return pricePerOunce;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[MetalpriceAPI] Timeout for ${symbol}`);
    } else {
      console.error(`[MetalpriceAPI] Error fetching ${symbol}:`, error);
    }
    return null;
  }
}

/**
 * Get historical prices for sparkline (mock for now)
 * Note: Free tier doesn't include historical data
 * We'll generate a simple trend based on current price
 */
export function generateSparkline(currentPrice: number, points = 24): number[] {
  const sparkline: number[] = [];
  const volatility = 0.02; // 2% volatility

  for (let i = 0; i < points; i++) {
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const price = currentPrice * (1 + randomChange);
    sparkline.push(price);
  }

  // Ensure last point is current price
  sparkline[sparkline.length - 1] = currentPrice;

  return sparkline;
}

/**
 * Calculate 24h change (mock - free tier doesn't provide this)
 * Estimate based on price volatility
 */
export function estimateChange24h(currentPrice: number): number {
  // Random change between -3% and +3%
  return (Math.random() - 0.5) * 6;
}
