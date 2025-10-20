/**
 * TRADINGVIEW CHART HELPERS
 * TradingView widget yapılandırma ve yardımcı fonksiyonlar
 */

/**
 * Convert our symbol format to TradingView format
 * BTCUSDT -> BINANCE:BTCUSDT
 */
export function formatSymbolForTradingView(symbol: string, exchange: string = 'BINANCE'): string {
  // If already formatted, return as-is
  if (symbol.includes(':')) {
    return symbol;
  }

  // Add exchange prefix
  return `${exchange}:${symbol}`;
}

/**
 * Get TradingView interval from our timeframe format
 */
export function getIntervalFromTimeframe(timeframe: string): string {
  const intervalMap: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '2h': '120',
    '4h': '240',
    '6h': '360',
    '12h': '720',
    '1d': 'D',
    '1w': 'W',
    '1M': 'M',
  };

  return intervalMap[timeframe] || '240'; // Default to 4h
}

/**
 * Get popular TradingView studies (indicators)
 */
export const POPULAR_STUDIES = {
  // Moving Averages
  MA_CROSS: 'MAExp@tv-basicstudies',
  EMA_RIBBON: 'MASimple@tv-basicstudies',

  // Momentum
  RSI: 'RSI@tv-basicstudies',
  MACD: 'MACD@tv-basicstudies',
  STOCHASTIC: 'StochasticRSI@tv-basicstudies',

  // Volatility
  BOLLINGER: 'BB@tv-basicstudies',
  ATR: 'ATR@tv-basicstudies',

  // Volume
  VOLUME: 'Volume@tv-basicstudies',
  VWAP: 'VWAP@tv-basicstudies',

  // Trend
  SUPERTREND: 'Supertrend@tv-basicstudies',
  ICHIMOKU: 'IchimokuCloud@tv-basicstudies',
};

/**
 * Get chart configuration for strategy type
 */
export function getChartConfigForStrategy(strategy: string): string[] {
  const strategyStudies: Record<string, string[]> = {
    'ma-crossover': [POPULAR_STUDIES.MA_CROSS, POPULAR_STUDIES.VOLUME],
    'rsi-divergence': [POPULAR_STUDIES.RSI, POPULAR_STUDIES.VOLUME],
    'macd-histogram': [POPULAR_STUDIES.MACD, POPULAR_STUDIES.VOLUME],
    'bollinger-squeeze': [POPULAR_STUDIES.BOLLINGER, POPULAR_STUDIES.VOLUME],
    'ema-ribbon': [POPULAR_STUDIES.EMA_RIBBON, POPULAR_STUDIES.VOLUME],
    'volume-breakout': [POPULAR_STUDIES.VOLUME, POPULAR_STUDIES.VWAP],
    'support-resistance': [POPULAR_STUDIES.VOLUME],
  };

  return strategyStudies[strategy] || [POPULAR_STUDIES.VOLUME];
}

/**
 * Get top crypto symbols for ticker tape
 */
export function getTopCryptoSymbols(limit: number = 10): Array<{ proName: string; title: string }> {
  const topCoins = [
    { proName: 'BINANCE:BTCUSDT', title: 'Bitcoin' },
    { proName: 'BINANCE:ETHUSDT', title: 'Ethereum' },
    { proName: 'BINANCE:BNBUSDT', title: 'BNB' },
    { proName: 'BINANCE:SOLUSDT', title: 'Solana' },
    { proName: 'BINANCE:XRPUSDT', title: 'XRP' },
    { proName: 'BINANCE:ADAUSDT', title: 'Cardano' },
    { proName: 'BINANCE:DOGEUSDT', title: 'Dogecoin' },
    { proName: 'BINANCE:DOTUSDT', title: 'Polkadot' },
    { proName: 'BINANCE:AVAXUSDT', title: 'Avalanche' },
    { proName: 'BINANCE:MATICUSDT', title: 'Polygon' },
    { proName: 'BINANCE:LINKUSDT', title: 'Chainlink' },
    { proName: 'BINANCE:UNIUSDT', title: 'Uniswap' },
    { proName: 'BINANCE:ATOMUSDT', title: 'Cosmos' },
    { proName: 'BINANCE:LTCUSDT', title: 'Litecoin' },
    { proName: 'BINANCE:ETCUSDT', title: 'Ethereum Classic' },
  ];

  return topCoins.slice(0, limit);
}

/**
 * Check if TradingView widget is loaded
 */
export function isTradingViewLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as any).TradingView !== 'undefined';
}

/**
 * Load TradingView library
 */
export async function loadTradingView(): Promise<boolean> {
  if (isTradingViewLoaded()) return true;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.head.appendChild(script);
  });
}

/**
 * Get theme from user preferences
 */
export function getTradingViewTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';

  const theme = localStorage.getItem('sardag_preferences');
  if (!theme) return 'dark';

  try {
    const preferences = JSON.parse(theme);
    return preferences.theme === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/**
 * Responsive chart height based on screen size
 */
export function getResponsiveChartHeight(): number {
  if (typeof window === 'undefined') return 500;

  const width = window.innerWidth;

  if (width < 640) return 300; // Mobile
  if (width < 1024) return 400; // Tablet
  return 500; // Desktop
}
