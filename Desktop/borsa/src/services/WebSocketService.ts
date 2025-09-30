type PriceUpdate = {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  timestamp: number;
};

type SubscribeCallback = (data: PriceUpdate) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private subscribers: Map<string, Set<SubscribeCallback>> = new Map();
  private connected = false;

  // Binance WebSocket streams for major cryptos
  private readonly BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream';
  private readonly symbols = ['btcusdt', 'ethusdt', 'bnbusdt'];

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    try {
      const streams = this.symbols.map(s => `${s}@ticker`).join('/');
      this.ws = new WebSocket(`${this.BINANCE_WS_URL}?streams=${streams}`);

      this.ws.onopen = () => {
        console.log('🟢 WebSocket bağlandı - Binance canlı veri akışı başlatıldı');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.updateGlobalStatus(true);
      };

      this.ws.onmessage = (event) => {
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
            };

            this.notifySubscribers(symbol, update);
          }
        } catch (error) {
          console.error('WebSocket mesaj hatası:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket hatası:', error);
        this.connected = false;
        this.updateGlobalStatus(false);
      };

      this.ws.onclose = () => {
        console.log('🔴 WebSocket bağlantısı kesildi');
        this.connected = false;
        this.updateGlobalStatus(false);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('WebSocket bağlantı hatası:', error);
      this.attemptReconnect();
    }
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
      callbacks.forEach(callback => callback(data));
    }

    // Also notify wildcard subscribers
    const wildcardCallbacks = this.subscribers.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => callback(data));
    }
  }

  private updateGlobalStatus(connected: boolean) {
    if (typeof window !== 'undefined') {
      (window as any).__lydian_ws_status = { connected };
    }
  }

  // Subscribe to specific symbol updates
  subscribe(symbol: string, callback: SubscribeCallback): () => void {
    const upperSymbol = symbol.toUpperCase();

    if (!this.subscribers.has(upperSymbol)) {
      this.subscribers.set(upperSymbol, new Set());
    }

    this.subscribers.get(upperSymbol)!.add(callback);

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
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
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
    } as any;
  }

  if (!wsService) {
    wsService = new WebSocketService();
  }

  return wsService;
}

export default WebSocketService;