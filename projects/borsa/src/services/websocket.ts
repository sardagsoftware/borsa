// WebSocket service for real-time market data

export interface WebSocketMessage {
  type: 'stock' | 'crypto' | 'market' | 'news';
  data: any;
  timestamp: number;
}

export interface MarketDataSubscription {
  symbol: string;
  type: 'stock' | 'crypto';
  callback: (data: any) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscriptions = new Map<string, MarketDataSubscription[]>();
  private isConnected = false;
  
  constructor() {
    this.connect();
  }
  
  private connect() {
    // In production, this would connect to a real WebSocket endpoint
    // For now, we'll simulate WebSocket behavior
    this.simulateConnection();
  }
  
  private simulateConnection() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Simulate real-time price updates every 3 seconds
    this.startSimulation();
    
    console.log('WebSocket connection established (simulated)');
  }
  
  private startSimulation() {
    setInterval(() => {
      if (this.isConnected) {
        // Simulate stock price updates
        this.simulateStockUpdates();
        // Simulate crypto price updates
        this.simulateCryptoUpdates();
      }
    }, 3000);
  }
  
  private simulateStockUpdates() {
    const stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA'];
    
    stocks.forEach(symbol => {
      if (this.subscriptions.has(`stock:${symbol}`)) {
        const basePrice = this.getBasePrice(symbol, 'stock');
        const change = (Math.random() - 0.5) * 0.05; // ±2.5% change
        const newPrice = basePrice * (1 + change);
        
        const data = {
          symbol,
          price: parseFloat(newPrice.toFixed(2)),
          change: parseFloat((change * 100).toFixed(2)),
          volume: Math.floor(Math.random() * 1000000),
          timestamp: Date.now()
        };
        
        this.notifySubscribers(`stock:${symbol}`, data);
      }
    });
  }
  
  private simulateCryptoUpdates() {
    const cryptos = ['bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot'];
    
    cryptos.forEach(symbol => {
      if (this.subscriptions.has(`crypto:${symbol}`)) {
        const basePrice = this.getBasePrice(symbol, 'crypto');
        const change = (Math.random() - 0.5) * 0.1; // ±5% change (crypto is more volatile)
        const newPrice = basePrice * (1 + change);
        
        const data = {
          symbol,
          price: parseFloat(newPrice.toFixed(2)),
          change: parseFloat((change * 100).toFixed(2)),
          volume: Math.floor(Math.random() * 100000000),
          timestamp: Date.now()
        };
        
        this.notifySubscribers(`crypto:${symbol}`, data);
      }
    });
  }
  
  private getBasePrice(symbol: string, type: 'stock' | 'crypto'): number {
    // Simulated base prices
    const stockPrices: Record<string, number> = {
      'AAPL': 175,
      'GOOGL': 140,
      'MSFT': 340,
      'AMZN': 145,
      'TSLA': 240,
      'NVDA': 480
    };
    
    const cryptoPrices: Record<string, number> = {
      'bitcoin': 43000,
      'ethereum': 2600,
      'cardano': 0.48,
      'solana': 95,
      'polkadot': 7.2
    };
    
    if (type === 'stock') {
      return stockPrices[symbol] || 100;
    } else {
      return cryptoPrices[symbol] || 1;
    }
  }
  
  private notifySubscribers(key: string, data: any) {
    const subscribers = this.subscriptions.get(key);
    if (subscribers) {
      subscribers.forEach(subscription => {
        try {
          subscription.callback(data);
        } catch (error) {
          console.error('Error in WebSocket callback:', error);
        }
      });
    }
  }
  
  subscribe(symbol: string, type: 'stock' | 'crypto', callback: (data: any) => void): () => void {
    const key = `${type}:${symbol}`;
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }
    
    const subscription: MarketDataSubscription = { symbol, type, callback };
    this.subscriptions.get(key)!.push(subscription);
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(key);
      if (subscribers) {
        const index = subscribers.indexOf(subscription);
        if (index > -1) {
          subscribers.splice(index, 1);
        }
        
        // Remove the key if no more subscribers
        if (subscribers.length === 0) {
          this.subscriptions.delete(key);
        }
      }
    };
  }
  
  unsubscribe(symbol: string, type: 'stock' | 'crypto') {
    const key = `${type}:${symbol}`;
    this.subscriptions.delete(key);
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.subscriptions.clear();
  }
  
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
  
  // Send message to WebSocket (for future use)
  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();