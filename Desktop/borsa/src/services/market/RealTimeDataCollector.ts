/**
 * Real-Time Market Data Collector
 * Binance WebSocket + CoinGecko API for Top 100 Coins
 * Multi-timeframe OHLCV aggregation (1d, 4h, 1h, 15m)
 */

interface CoinData {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  rank: number;
}

interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketData {
  symbol: string;
  currentPrice: number;
  candles: {
    '1d': OHLCV[];
    '4h': OHLCV[];
    '1h': OHLCV[];
    '15m': OHLCV[];
  };
  lastUpdate: number;
}

export class RealTimeDataCollector {
  private ws: WebSocket | null = null;
  private marketData: Map<string, MarketData> = new Map();
  private topCoins: CoinData[] = [];
  private updateCallbacks: Set<(data: CoinData[]) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor() {
    this.initializeTopCoins();
  }

  /**
   * Fetch Top 100 coins from CoinGecko
   */
  private async initializeTopCoins() {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h'
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      this.topCoins = data.map((coin: any, index: number) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercent24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume || 0,
        marketCap: coin.market_cap || 0,
        rank: index + 1,
      }));

      console.log(`✅ Loaded ${this.topCoins.length} coins from CoinGecko`);

      // Initialize WebSocket for real-time updates
      this.connectBinanceWebSocket();

      // Fetch historical data for each coin
      await this.fetchHistoricalData();

      // Update prices every 30 seconds
      setInterval(() => this.updatePrices(), 30000);

    } catch (error) {
      console.error('❌ Failed to initialize top coins:', error);
      // Retry after delay
      setTimeout(() => this.initializeTopCoins(), 5000);
    }
  }

  /**
   * Connect to Binance WebSocket for real-time price updates
   */
  private connectBinanceWebSocket() {
    try {
      // Get symbols for Binance (only USDT pairs available on Binance)
      const binanceSymbols = this.topCoins
        .map(coin => `${coin.symbol.toLowerCase()}usdt`)
        .slice(0, 50); // Binance limit

      const streams = binanceSymbols.map(s => `${s}@ticker`).join('/');
      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Binance WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.data) {
            this.handleBinanceUpdate(message.data);
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed, attempting reconnect...');
        this.reconnectWebSocket();
      };

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      this.reconnectWebSocket();
    }
  }

  /**
   * Reconnect WebSocket with exponential backoff
   */
  private reconnectWebSocket() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Reconnecting... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connectBinanceWebSocket();
    }, delay);
  }

  /**
   * Handle Binance WebSocket price update
   */
  private handleBinanceUpdate(data: any) {
    const symbol = data.s.replace('USDT', '').toUpperCase();
    const price = parseFloat(data.c);
    const priceChange = parseFloat(data.p);
    const priceChangePercent = parseFloat(data.P);
    const volume = parseFloat(data.v);

    // Update coin data
    const coinIndex = this.topCoins.findIndex(c => c.symbol === symbol);
    if (coinIndex !== -1) {
      this.topCoins[coinIndex] = {
        ...this.topCoins[coinIndex],
        price,
        priceChange24h: priceChange,
        priceChangePercent24h: priceChangePercent,
        volume24h: volume,
      };

      // Notify subscribers
      this.notifySubscribers();
    }
  }

  /**
   * Update prices from CoinGecko (fallback for non-Binance coins)
   */
  private async updatePrices() {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h'
      );

      if (!response.ok) return;

      const data = await response.json();

      data.forEach((coin: any, index: number) => {
        const symbol = coin.symbol.toUpperCase();
        const existing = this.topCoins.find(c => c.symbol === symbol);

        if (existing) {
          existing.price = coin.current_price;
          existing.priceChange24h = coin.price_change_24h || 0;
          existing.priceChangePercent24h = coin.price_change_percentage_24h || 0;
          existing.volume24h = coin.total_volume || 0;
          existing.marketCap = coin.market_cap || 0;
        }
      });

      this.notifySubscribers();

    } catch (error) {
      console.error('Price update error:', error);
    }
  }

  /**
   * Fetch historical OHLCV data for all timeframes
   */
  private async fetchHistoricalData() {
    console.log('📊 Fetching historical data for 100 coins...');

    const promises = this.topCoins.slice(0, 50).map(async (coin) => {
      try {
        // Binance Klines API (1000 candles max per request)
        const symbol = `${coin.symbol}USDT`;
        const timeframes = [
          { interval: '1d', limit: 365 },
          { interval: '4h', limit: 360 },
          { interval: '1h', limit: 168 },
          { interval: '15m', limit: 96 },
        ];

        const candleData: any = {
          '1d': [],
          '4h': [],
          '1h': [],
          '15m': [],
        };

        for (const tf of timeframes) {
          const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${tf.interval}&limit=${tf.limit}`;
          const response = await fetch(url);

          if (!response.ok) continue;

          const klines = await response.json();

          candleData[tf.interval as keyof typeof candleData] = klines.map((k: any) => ({
            timestamp: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
          }));
        }

        this.marketData.set(coin.symbol, {
          symbol: coin.symbol,
          currentPrice: coin.price,
          candles: candleData,
          lastUpdate: Date.now(),
        });

      } catch (error) {
        console.error(`Failed to fetch data for ${coin.symbol}:`, error);
      }
    });

    await Promise.all(promises);
    console.log(`✅ Historical data loaded for ${this.marketData.size} coins`);
  }

  /**
   * Get current top coins
   */
  getTopCoins(): CoinData[] {
    return this.topCoins;
  }

  /**
   * Get market data for specific symbol
   */
  getMarketData(symbol: string): MarketData | undefined {
    return this.marketData.get(symbol.toUpperCase());
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (data: CoinData[]) => void) {
    this.updateCallbacks.add(callback);
    // Send initial data
    callback(this.topCoins);
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(callback: (data: CoinData[]) => void) {
    this.updateCallbacks.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers() {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(this.topCoins);
      } catch (error) {
        console.error('Subscriber notification error:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateCallbacks.clear();
    this.marketData.clear();
  }
}

// Singleton instance
let collectorInstance: RealTimeDataCollector | null = null;

export function getDataCollector(): RealTimeDataCollector {
  if (!collectorInstance) {
    collectorInstance = new RealTimeDataCollector();
  }
  return collectorInstance;
}