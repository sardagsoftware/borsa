import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { GlobalExchangeRegistry, ExchangeConfig, ExchangeType } from '../exchanges/GlobalExchangeConfig';

export interface MarketData {
  symbol: string;
  exchange: string;
  timestamp: number;
  price: number;
  volume: number;
  bid?: number;
  ask?: number;
  high24h?: number;
  low24h?: number;
  change24h?: number;
  changePercent24h?: number;
}

export interface OrderBook {
  symbol: string;
  exchange: string;
  timestamp: number;
  bids: [number, number][]; // [price, quantity]
  asks: [number, number][];
}

export interface Trade {
  id: string;
  symbol: string;
  exchange: string;
  timestamp: number;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class UniversalMarketDataEngine extends EventEmitter {
  private connections: Map<string, WebSocket> = new Map();
  private marketData: Map<string, MarketData> = new Map();
  private orderBooks: Map<string, OrderBook> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // exchange -> symbols
  private reconnectIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isConnected: Map<string, boolean> = new Map();
  private dataCache: Map<string, any> = new Map();
  
  // AI entegrasyonu için event handlers
  private aiPredictionHandler?: (data: MarketData) => void;
  private anomalyDetector?: (data: MarketData) => boolean;

  constructor() {
    super();
    this.initializeConnections();
  }

  private async initializeConnections(): Promise<void> {
    console.log('🌐 Evrensel Market Data Engine başlatılıyor...');
    
    const activeExchanges = GlobalExchangeRegistry.getAICompatibleExchanges();
    
    for (const exchange of activeExchanges) {
      if (exchange.wsBaseUrl) {
        await this.connectToExchange(exchange);
      }
    }
  }

  private async connectToExchange(exchange: ExchangeConfig): Promise<void> {
    try {
      console.log(`🔌 ${exchange.displayName} borsasına bağlanıyor...`);
      
      const ws = new WebSocket(exchange.wsBaseUrl!);
      
      ws.on('open', () => {
        console.log(`✅ ${exchange.displayName} bağlantısı başarılı`);
        this.isConnected.set(exchange.id, true);
        this.connections.set(exchange.id, ws);
        this.emit('exchangeConnected', exchange.id);
        
        // Varsayılan sembollere abone ol
        this.subscribeToDefaultSymbols(exchange);
      });

      ws.on('message', (data) => {
        this.handleMarketData(exchange, data.toString());
      });

      ws.on('close', () => {
        console.log(`⚠️ ${exchange.displayName} bağlantısı kesildi, yeniden bağlanıyor...`);
        this.isConnected.set(exchange.id, false);
        this.scheduleReconnect(exchange);
      });

      ws.on('error', (error) => {
        console.error(`❌ ${exchange.displayName} bağlantı hatası:`, error);
        this.emit('exchangeError', exchange.id, error);
      });

    } catch (error) {
      console.error(`❌ ${exchange.displayName} bağlantı kurulamadı:`, error);
    }
  }

  private subscribeToDefaultSymbols(exchange: ExchangeConfig): void {
    const defaultSymbols = exchange.supportedAssets.slice(0, 10); // İlk 10 sembol
    
    defaultSymbols.forEach(symbol => {
      this.subscribeToSymbol(exchange.id, symbol);
    });
  }

  public subscribeToSymbol(exchangeId: string, symbol: string): void {
    const exchange = GlobalExchangeRegistry.getExchange(exchangeId);
    if (!exchange) return;

    const ws = this.connections.get(exchangeId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Her borsa için farklı subscription formatı
    let subscribeMessage: any;

    switch (exchangeId) {
      case 'binance':
        subscribeMessage = {
          method: 'SUBSCRIBE',
          params: [
            `${symbol.toLowerCase()}@ticker`,
            `${symbol.toLowerCase()}@depth20`,
            `${symbol.toLowerCase()}@trade`
          ],
          id: Date.now()
        };
        break;

      case 'coinbase_pro':
        subscribeMessage = {
          type: 'subscribe',
          product_ids: [symbol],
          channels: ['ticker', 'level2', 'matches']
        };
        break;

      case 'btcturk':
        subscribeMessage = {
          type: 'join',
          channel: `ticker:${symbol}`
        };
        break;

      default:
        subscribeMessage = {
          action: 'subscribe',
          symbol: symbol,
          channels: ['ticker', 'orderbook', 'trades']
        };
    }

    ws.send(JSON.stringify(subscribeMessage));
    
    // Subscription'ı kaydet
    if (!this.subscriptions.has(exchangeId)) {
      this.subscriptions.set(exchangeId, new Set());
    }
    this.subscriptions.get(exchangeId)!.add(symbol);
    
    console.log(`📊 ${exchange.displayName}: ${symbol} sembolüne abone olundu`);
  }

  private handleMarketData(exchange: ExchangeConfig, rawData: string): void {
    try {
      const data = JSON.parse(rawData);
      
      // Her borsa için farklı data parsing
      const marketData = this.parseMarketData(exchange, data);
      
      if (marketData) {
        const key = `${exchange.id}:${marketData.symbol}`;
        this.marketData.set(key, marketData);
        
        // Cache'e kaydet
        this.updateCache(key, marketData);
        
        // AI entegrasyonu
        if (this.aiPredictionHandler) {
          this.aiPredictionHandler(marketData);
        }

        // Anomali tespiti
        if (this.anomalyDetector && this.anomalyDetector(marketData)) {
          this.emit('anomalyDetected', marketData);
        }

        // Event emit
        this.emit('marketData', marketData);
        this.emit(`marketData:${exchange.id}`, marketData);
        this.emit(`marketData:${exchange.id}:${marketData.symbol}`, marketData);
      }
      
    } catch (error) {
      console.error(`❌ ${exchange.displayName} market data parsing hatası:`, error);
    }
  }

  private parseMarketData(exchange: ExchangeConfig, data: any): MarketData | null {
    let marketData: MarketData | null = null;

    switch (exchange.id) {
      case 'binance':
        if (data.e === '24hrTicker') {
          marketData = {
            symbol: data.s,
            exchange: exchange.id,
            timestamp: data.E,
            price: parseFloat(data.c),
            volume: parseFloat(data.v),
            bid: parseFloat(data.b),
            ask: parseFloat(data.a),
            high24h: parseFloat(data.h),
            low24h: parseFloat(data.l),
            change24h: parseFloat(data.P),
            changePercent24h: parseFloat(data.P)
          };
        }
        break;

      case 'coinbase_pro':
        if (data.type === 'ticker') {
          marketData = {
            symbol: data.product_id,
            exchange: exchange.id,
            timestamp: new Date(data.time).getTime(),
            price: parseFloat(data.price),
            volume: parseFloat(data.volume_24h),
            bid: parseFloat(data.best_bid),
            ask: parseFloat(data.best_ask),
            high24h: parseFloat(data.high_24h),
            low24h: parseFloat(data.low_24h)
          };
        }
        break;

      case 'btcturk':
        if (data.channel && data.channel.startsWith('ticker:')) {
          marketData = {
            symbol: data.event.PS,
            exchange: exchange.id,
            timestamp: Date.now(),
            price: parseFloat(data.event.LA),
            volume: parseFloat(data.event.V),
            high24h: parseFloat(data.event.H),
            low24h: parseFloat(data.event.L),
            changePercent24h: parseFloat(data.event.DC)
          };
        }
        break;

      // Hisse senedi borsaları için parsing
      case 'nasdaq':
      case 'bist':
      case 'lse':
        marketData = {
          symbol: data.symbol || data.s,
          exchange: exchange.id,
          timestamp: data.timestamp || Date.now(),
          price: parseFloat(data.price || data.p),
          volume: parseFloat(data.volume || data.v || 0),
          change24h: parseFloat(data.change || data.c || 0),
          changePercent24h: parseFloat(data.changePercent || data.cp || 0)
        };
        break;

      // Emtia ve forex için parsing
      case 'cme':
      case 'oanda':
        marketData = {
          symbol: data.instrument || data.symbol,
          exchange: exchange.id,
          timestamp: new Date(data.time || data.timestamp).getTime(),
          price: parseFloat(data.closeoutBid || data.price),
          volume: parseFloat(data.volume || 0),
          bid: parseFloat(data.bid),
          ask: parseFloat(data.ask)
        };
        break;
    }

    return marketData;
  }

  private scheduleReconnect(exchange: ExchangeConfig): void {
    const existingInterval = this.reconnectIntervals.get(exchange.id);
    if (existingInterval) {
      clearTimeout(existingInterval);
    }

    const interval = setTimeout(() => {
      this.connectToExchange(exchange);
    }, 5000); // 5 saniye sonra yeniden bağlan

    this.reconnectIntervals.set(exchange.id, interval);
  }

  private updateCache(key: string, data: MarketData): void {
    this.dataCache.set(key, {
      ...data,
      cachedAt: Date.now()
    });

    // Cache boyutunu kontrol et (max 10000 entry)
    if (this.dataCache.size > 10000) {
      const oldestKey = this.dataCache.keys().next().value;
      this.dataCache.delete(oldestKey);
    }
  }

  // AI entegrasyonu metodları
  public setAIPredictionHandler(handler: (data: MarketData) => void): void {
    this.aiPredictionHandler = handler;
    console.log('🤖 AI prediction handler bağlandı');
  }

  public setAnomalyDetector(detector: (data: MarketData) => boolean): void {
    this.anomalyDetector = detector;
    console.log('🚨 Anomali dedektörü bağlandı');
  }

  // Public metodları
  public getMarketData(exchange: string, symbol: string): MarketData | null {
    const key = `${exchange}:${symbol}`;
    return this.marketData.get(key) || null;
  }

  public getAllMarketData(): Map<string, MarketData> {
    return new Map(this.marketData);
  }

  public getExchangeStatus(exchangeId: string): boolean {
    return this.isConnected.get(exchangeId) || false;
  }

  public getConnectedExchanges(): string[] {
    return Array.from(this.isConnected.entries())
      .filter(([_, connected]) => connected)
      .map(([id, _]) => id);
  }

  public async getHistoricalData(
    exchange: string, 
    symbol: string, 
    interval: string = '1d', 
    limit: number = 100
  ): Promise<Candle[]> {
    const exchangeConfig = GlobalExchangeRegistry.getExchange(exchange);
    if (!exchangeConfig) throw new Error(`Exchange ${exchange} not found`);

    // Her borsa için farklı historical data API çağrıları
    try {
      const response = await this.fetchHistoricalData(exchangeConfig, symbol, interval, limit);
      return response;
    } catch (error) {
      console.error(`Historical data fetch error for ${exchange}:${symbol}:`, error);
      return [];
    }
  }

  private async fetchHistoricalData(
    exchange: ExchangeConfig,
    symbol: string,
    interval: string,
    limit: number
  ): Promise<Candle[]> {
    let url = '';
    let headers = {};

    switch (exchange.id) {
      case 'binance':
        url = `${exchange.apiBaseUrl}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        break;
      
      case 'coinbase_pro':
        url = `${exchange.apiBaseUrl}/products/${symbol}/candles?granularity=86400`;
        break;
      
      default:
        url = `${exchange.apiBaseUrl}/api/v1/candles/${symbol}?interval=${interval}&limit=${limit}`;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();

    return this.parseHistoricalData(exchange.id, data);
  }

  private parseHistoricalData(exchangeId: string, data: any[]): Candle[] {
    const candles: Candle[] = [];

    switch (exchangeId) {
      case 'binance':
        data.forEach(item => {
          candles.push({
            timestamp: item[0],
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5])
          });
        });
        break;

      case 'coinbase_pro':
        data.forEach(item => {
          candles.push({
            timestamp: item[0] * 1000,
            open: item[3],
            high: item[2],
            low: item[1],
            close: item[4],
            volume: item[5]
          });
        });
        break;

      default:
        data.forEach(item => {
          candles.push({
            timestamp: item.timestamp,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume
          });
        });
    }

    return candles.reverse(); // En yeni veriler son olsun
  }

  public subscribeToMultipleSymbols(exchangeId: string, symbols: string[]): void {
    symbols.forEach(symbol => {
      this.subscribeToSymbol(exchangeId, symbol);
    });
  }

  public unsubscribeFromSymbol(exchangeId: string, symbol: string): void {
    const ws = this.connections.get(exchangeId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Unsubscribe message format her borsa için farklı
    let unsubscribeMessage: any;

    switch (exchangeId) {
      case 'binance':
        unsubscribeMessage = {
          method: 'UNSUBSCRIBE',
          params: [`${symbol.toLowerCase()}@ticker`],
          id: Date.now()
        };
        break;

      default:
        unsubscribeMessage = {
          action: 'unsubscribe',
          symbol: symbol
        };
    }

    ws.send(JSON.stringify(unsubscribeMessage));
    
    const subscriptions = this.subscriptions.get(exchangeId);
    if (subscriptions) {
      subscriptions.delete(symbol);
    }
  }

  public startArbitrageDetection(): void {
    console.log('🔍 Arbitraj fırsatları taranmaya başladı...');
    
    setInterval(() => {
      this.detectArbitrageOpportunities();
    }, 1000); // Her saniye kontrol et
  }

  private detectArbitrageOpportunities(): void {
    const symbols = new Set<string>();
    
    // Tüm sembolleri topla
    this.marketData.forEach((data) => {
      symbols.add(data.symbol);
    });

    symbols.forEach(symbol => {
      const prices: { exchange: string; price: number; data: MarketData }[] = [];
      
      this.marketData.forEach((data, key) => {
        if (data.symbol === symbol) {
          prices.push({
            exchange: data.exchange,
            price: data.price,
            data: data
          });
        }
      });

      if (prices.length >= 2) {
        const maxPrice = Math.max(...prices.map(p => p.price));
        const minPrice = Math.min(...prices.map(p => p.price));
        const spread = ((maxPrice - minPrice) / minPrice) * 100;

        if (spread > 0.5) { // %0.5'den fazla fark varsa arbitraj fırsatı
          const buyExchange = prices.find(p => p.price === minPrice)!;
          const sellExchange = prices.find(p => p.price === maxPrice)!;
          
          this.emit('arbitrageOpportunity', {
            symbol,
            spread: spread.toFixed(2),
            buyExchange: buyExchange.exchange,
            sellExchange: sellExchange.exchange,
            buyPrice: buyExchange.price,
            sellPrice: sellExchange.price,
            potentialProfit: spread
          });
        }
      }
    });
  }

  public getTopMovers(limit: number = 10): MarketData[] {
    const allData = Array.from(this.marketData.values());
    
    return allData
      .filter(data => data.changePercent24h !== undefined)
      .sort((a, b) => Math.abs(b.changePercent24h!) - Math.abs(a.changePercent24h!))
      .slice(0, limit);
  }

  public getVolumeLeaders(limit: number = 10): MarketData[] {
    const allData = Array.from(this.marketData.values());
    
    return allData
      .filter(data => data.volume > 0)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
  }

  public close(): void {
    console.log('🔌 Tüm borsa bağlantıları kapatılıyor...');
    
    this.connections.forEach((ws, exchangeId) => {
      ws.close();
      console.log(`✅ ${exchangeId} bağlantısı kapatıldı`);
    });

    this.reconnectIntervals.forEach((interval) => {
      clearTimeout(interval);
    });

    this.connections.clear();
    this.reconnectIntervals.clear();
    this.isConnected.clear();
  }
}

export default UniversalMarketDataEngine;