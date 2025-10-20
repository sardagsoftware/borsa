/**
 * BINANCE MARKET DATA API
 *
 * 200 coin için market data çekme sistemi
 * - Futures market
 * - 24h ticker
 * - 7d historical data
 * - Real-time WebSocket
 */

export interface MarketTicker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume: number;
  marketCap?: number;
  rank?: number;
}

export interface SparklineData {
  symbol: string;
  prices: number[];
  timestamps: number[];
  change7d: number;
  changePercent7d: number;
}

export interface MarketData extends MarketTicker {
  sparkline: number[];
  change7d: number;
  changePercent7d: number;
}

// ============================================================
// 1. BINANCE FUTURES 24H TICKER
// ============================================================

/**
 * Tüm Futures coinlerinin 24h ticker verisi
 */
export async function fetchAllTickers(): Promise<MarketTicker[]> {
  try {
    const response = await fetch(
      'https://fapi.binance.com/fapi/v1/ticker/24hr',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();

    // USDT pairs only, sıralı
    const tickers: MarketTicker[] = data
      .filter((t: any) => t.symbol.endsWith('USDT'))
      .map((t: any, index: number) => ({
        symbol: t.symbol,
        price: parseFloat(t.lastPrice),
        change24h: parseFloat(t.priceChange),
        changePercent24h: parseFloat(t.priceChangePercent),
        high24h: parseFloat(t.highPrice),
        low24h: parseFloat(t.lowPrice),
        volume24h: parseFloat(t.volume),
        quoteVolume: parseFloat(t.quoteVolume),
        rank: index + 1, // Binance'deki sıralama
      }))
      .sort((a: any, b: any) => b.quoteVolume - a.quoteVolume) // Volume'e göre sırala
      .slice(0, 200); // İlk 200

    return tickers;
  } catch (error) {
    console.error('[Market Data] Fetch tickers error:', error);
    return [];
  }
}

// ============================================================
// 2. 7D SPARKLINE DATA
// ============================================================

/**
 * Tek bir coin için 7 günlük kline data (sparkline için)
 */
export async function fetchSparklineData(symbol: string): Promise<SparklineData | null> {
  try {
    const response = await fetch(
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=4h&limit=42` // 7 gün x 6 candle (4h)
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const prices = data.map((d: any) => parseFloat(d[4])); // Close prices
    const timestamps = data.map((d: any) => d[0]);

    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change7d = lastPrice - firstPrice;
    const changePercent7d = ((change7d / firstPrice) * 100);

    return {
      symbol,
      prices,
      timestamps,
      change7d,
      changePercent7d,
    };
  } catch (error) {
    console.error(`[Market Data] Sparkline error for ${symbol}:`, error);
    return null;
  }
}

/**
 * Batch sparkline data (multiple coins)
 */
export async function fetchBatchSparklines(symbols: string[]): Promise<Map<string, SparklineData>> {
  const sparklineMap = new Map<string, SparklineData>();

  // Rate limiting için batch processing
  const batchSize = 10;
  const delay = 100; // 100ms per batch

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);

    const promises = batch.map(symbol => fetchSparklineData(symbol));
    const results = await Promise.all(promises);

    results.forEach((sparkline, index) => {
      if (sparkline) {
        sparklineMap.set(batch[index], sparkline);
      }
    });

    // Rate limiting delay
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return sparklineMap;
}

// ============================================================
// 3. COMBINED MARKET DATA
// ============================================================

/**
 * 24h ticker + 7d sparkline combined
 */
export async function fetchMarketOverviewData(): Promise<MarketData[]> {
  try {
    console.log('[Market Data] 📊 Fetching market overview...');

    // 1. 24h tickers al
    const tickers = await fetchAllTickers();
    console.log(`[Market Data] ✅ Fetched ${tickers.length} tickers`);

    if (tickers.length === 0) {
      return [];
    }

    // 2. OPTIMIZED: İlk 20 coin için sparkline data (ultra-fast load)
    const top20Symbols = tickers.slice(0, 20).map(t => t.symbol);
    console.log('[Market Data] 📈 Fetching sparklines for top 20 (fast load)...');

    const sparklineMap = await fetchBatchSparklines(top20Symbols);
    console.log(`[Market Data] ✅ Fetched ${sparklineMap.size} sparklines`);

    // 3. Combine data
    const marketData: MarketData[] = tickers.map((ticker) => {
      const sparklineData = sparklineMap.get(ticker.symbol);

      return {
        ...ticker,
        sparkline: sparklineData?.prices || [],
        change7d: sparklineData?.change7d || 0,
        changePercent7d: sparklineData?.changePercent7d || 0,
      };
    });

    console.log('[Market Data] ✅ Market data ready!');
    return marketData;
  } catch (error) {
    console.error('[Market Data] Fatal error:', error);
    return [];
  }
}

// ============================================================
// 4. WEBSOCKET REAL-TIME UPDATES
// ============================================================

export interface WebSocketUpdate {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
}

/**
 * WebSocket stream için
 */
export function subscribeToMarketStream(
  symbols: string[],
  onUpdate: (update: WebSocketUpdate) => void
): () => void {
  // Stream URL (lowercase symbols)
  const streams = symbols
    .slice(0, 20) // İlk 20 coin (rate limit için)
    .map(s => `${s.toLowerCase()}@ticker`)
    .join('/');

  const wsUrl = `wss://fstream.binance.com/stream?streams=${streams}`;

  let ws: WebSocket | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;

  const connect = () => {
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] ✅ Connected to Binance stream');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const data = message.data;

          if (data && data.e === '24hrTicker') {
            onUpdate({
              symbol: data.s,
              price: parseFloat(data.c),
              change24h: parseFloat(data.p),
              changePercent24h: parseFloat(data.P),
            });
          }
        } catch (err) {
          console.error('[WebSocket] Parse error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] ❌ Disconnected, reconnecting...');

        // Auto reconnect after 5 seconds
        reconnectTimer = setTimeout(connect, 5000);
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  };

  connect();

  // Cleanup function
  return () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    if (ws) {
      ws.close();
    }
  };
}

// ============================================================
// 5. CACHE UTILITIES
// ============================================================

const CACHE_KEY = 'market_overview_data';
const CACHE_TTL = 60000; // 1 dakika

interface CachedData {
  data: MarketData[];
  timestamp: number;
}

/**
 * LocalStorage cache
 */
export function getCachedMarketData(): MarketData[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: CachedData = JSON.parse(cached);

    // Check if expired
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.data;
  } catch (error) {
    return null;
  }
}

/**
 * Cache market data
 */
export function cacheMarketData(data: MarketData[]): void {
  if (typeof window === 'undefined') return;

  try {
    const cached: CachedData = {
      data,
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error('[Market Data] Cache error:', error);
  }
}

// ============================================================
// 6. HELPER FUNCTIONS
// ============================================================

/**
 * Format large numbers (volume, market cap)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

/**
 * Format price with appropriate decimals
 */
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  if (price >= 1) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 0.01) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 });
}

/**
 * Get color for percentage change
 */
export function getChangeColor(changePercent: number): string {
  if (changePercent >= 5) return 'text-green-400'; // Strong bull
  if (changePercent > 0) return 'text-green-500'; // Bull
  if (changePercent > -2) return 'text-gray-400'; // Sideways
  return 'text-red-500'; // Bear
}

/**
 * Get emoji for percentage change
 */
export function getChangeEmoji(changePercent: number): string {
  if (changePercent >= 10) return '🚀';
  if (changePercent >= 5) return '📈';
  if (changePercent > 0) return '🟢';
  if (changePercent > -2) return '⚪';
  if (changePercent > -5) return '🔴';
  return '💥';
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  fetchAllTickers,
  fetchSparklineData,
  fetchBatchSparklines,
  fetchMarketOverviewData,
  subscribeToMarketStream,
  getCachedMarketData,
  cacheMarketData,
  formatLargeNumber,
  formatPrice,
  getChangeColor,
  getChangeEmoji,
};
