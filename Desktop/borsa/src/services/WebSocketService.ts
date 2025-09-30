export type PriceUpdate = {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  timestamp: number;
  exchange: string;
  high24h?: number;
  low24h?: number;
  marketCap?: number;
};

type SubscribeCallback = (data: PriceUpdate) => void;

interface ExchangeWebSocket {
  id: string;
  ws: WebSocket | null;
  url: string;
  connected: boolean;
}

class WebSocketService {
  private exchanges: Map<string, ExchangeWebSocket> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private subscribers: Map<string, Set<SubscribeCallback>> = new Map();
  private connected = false;
  private watchedSymbols: Set<string> = new Set();

  // Top crypto symbols from CoinMarketCap Top 100
  private readonly DEFAULT_SYMBOLS = [
    'btcusdt', 'ethusdt', 'bnbusdt', 'solusdt', 'xrpusdt',
    'adausdt', 'dogeusdt', 'maticusdt', 'dotusdt', 'ltcusdt',
    'trxusdt', 'avaxusdt', 'linkusdt', 'atomusdt', 'xlmusdt'
  ];

  // Exchange WebSocket URLs
  private readonly EXCHANGES = {
    binance: 'wss://stream.binance.com:9443/stream',
    bybit: 'wss://stream.bybit.com/v5/public/spot',
    okx: 'wss://ws.okx.com:8443/ws/v5/public',
    huobi: 'wss://api.huobi.pro/ws',
    kucoin: 'wss://ws-api.kucoin.com/endpoint'
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
      // Initialize watched symbols with defaults
      this.DEFAULT_SYMBOLS.forEach(s => this.watchedSymbols.add(s));
    }
  }

  private connect() {
    // Connect to Binance (primary exchange)
    this.connectBinance();
  }

  private connectBinance() {
    try {
      const exchangeId = 'binance';
      const streams = this.DEFAULT_SYMBOLS.map(s => `${s}@ticker`).join('/');
      const ws = new WebSocket(`${this.EXCHANGES.binance}?streams=${streams}`);

      ws.onopen = () => {
        console.log('🟢 Binance WebSocket bağlandı - Canlı veri akışı başlatıldı');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.updateGlobalStatus(true);

        this.exchanges.set(exchangeId, {
          id: exchangeId,
          ws,
          url: this.EXCHANGES.binance,
          connected: true
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.stream && data.data) {
            const ticker = data.data;
            const symbol = ticker.s; // e.g., "BTCUSDT"

            const update: PriceUpdate = {
              symbol: symbol.replace('USDT', ''),
              price: parseFloat(ticker.c), // Current price
              change24h: parseFloat(ticker.P), // 24h price change percentage
              volume: parseFloat(ticker.v), // 24h volume
              timestamp: ticker.E, // Event time
              exchange: 'binance',
              high24h: parseFloat(ticker.h), // 24h high
              low24h: parseFloat(ticker.l) // 24h low
            };

            this.notifySubscribers(symbol, update);
          }
        } catch (error) {
          console.error('❌ Binance WebSocket mesaj hatası:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Binance WebSocket hatası:', error);
        const exchange = this.exchanges.get(exchangeId);
        if (exchange) {
          exchange.connected = false;
        }
        this.connected = false;
        this.updateGlobalStatus(false);
      };

      ws.onclose = () => {
        console.log('🔴 Binance WebSocket bağlantısı kesildi');
        const exchange = this.exchanges.get(exchangeId);
        if (exchange) {
          exchange.connected = false;
          exchange.ws = null;
        }
        this.connected = false;
        this.updateGlobalStatus(false);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('❌ Binance WebSocket bağlantı hatası:', error);
      this.attemptReconnect();
    }
  }

  // Add symbols to watch list dynamically
  addSymbols(symbols: string[]) {
    symbols.forEach(s => this.watchedSymbols.add(s.toLowerCase()));
    console.log(`📊 ${symbols.length} yeni sembol izlemeye alındı`);
    // Reconnect to include new symbols
    this.reconnectWithNewSymbols();
  }

  // Remove symbols from watch list
  removeSymbols(symbols: string[]) {
    symbols.forEach(s => this.watchedSymbols.delete(s.toLowerCase()));
    console.log(`📊 ${symbols.length} sembol izlemeden çıkarıldı`);
  }

  private reconnectWithNewSymbols() {
    // Close existing connection
    const binanceExchange = this.exchanges.get('binance');
    if (binanceExchange?.ws) {
      binanceExchange.ws.close();
    }
    // Reconnect with updated symbol list
    setTimeout(() => this.connectBinance(), 1000);
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Maksimum yeniden bağlanma denemesi aşıldı');
    }
  }

  private notifySubscribers(symbol: string, data: PriceUpdate) {
    const callbacks = this.subscribers.get(symbol.toUpperCase());
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Subscriber callback hatası:', error);
        }
      });
    }

    // Also notify wildcard subscribers
    const wildcardCallbacks = this.subscribers.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Wildcard subscriber callback hatası:', error);
        }
      });
    }
  }

  private updateGlobalStatus(connected: boolean) {
    if (typeof window !== 'undefined') {
      (window as any).__lydian_ws_status = {
        connected,
        exchanges: Array.from(this.exchanges.entries()).map(([id, ex]) => ({
          id,
          connected: ex.connected
        })),
        symbolCount: this.watchedSymbols.size,
        subscriberCount: this.subscribers.size
      };
    }
  }

  // Subscribe to specific symbol updates
  subscribe(symbol: string, callback: SubscribeCallback): () => void {
    const upperSymbol = symbol.toUpperCase();

    if (!this.subscribers.has(upperSymbol)) {
      this.subscribers.set(upperSymbol, new Set());
    }

    this.subscribers.get(upperSymbol)!.add(callback);

    // Auto-add symbol to watch list if not present
    const lowerSymbol = symbol.toLowerCase() + 'usdt';
    if (!this.watchedSymbols.has(lowerSymbol)) {
      this.addSymbols([lowerSymbol]);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(upperSymbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(upperSymbol);
        }
      }
    };
  }

  // Subscribe to all updates
  subscribeAll(callback: SubscribeCallback): () => void {
    return this.subscribe('*', callback);
  }

  isConnected(): boolean {
    return this.connected && this.exchanges.get('binance')?.connected === true;
  }

  // Get connection status for all exchanges
  getConnectionStatus() {
    return {
      connected: this.connected,
      exchanges: Array.from(this.exchanges.entries()).map(([id, ex]) => ({
        id,
        connected: ex.connected,
        url: ex.url
      })),
      symbolCount: this.watchedSymbols.size,
      subscriberCount: this.subscribers.size
    };
  }

  // Get watched symbols
  getWatchedSymbols(): string[] {
    return Array.from(this.watchedSymbols);
  }

  disconnect() {
    // Close all exchange connections
    this.exchanges.forEach(exchange => {
      if (exchange.ws) {
        exchange.ws.close();
        exchange.ws = null;
      }
      exchange.connected = false;
    });

    this.exchanges.clear();
    this.subscribers.clear();
    this.connected = false;
    this.updateGlobalStatus(false);
  }
}

// Singleton instance
let wsService: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
  if (typeof window === 'undefined') {
    // Return a mock service for SSR
    return {
      subscribe: () => () => {},
      subscribeAll: () => () => {},
      isConnected: () => false,
      disconnect: () => {},
      addSymbols: () => {},
      removeSymbols: () => {},
      getConnectionStatus: () => ({ connected: false, exchanges: [], symbolCount: 0, subscriberCount: 0 }),
      getWatchedSymbols: () => []
    } as any;
  }

  if (!wsService) {
    wsService = new WebSocketService();
  }

  return wsService;
}

export default WebSocketService;