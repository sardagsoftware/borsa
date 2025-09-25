// Multi-Exchange Order Manager for borsa.ailydian.com
import { EventEmitter } from 'events';
import { TradingConfig, ExchangeConfig } from '../config';
import { TradeSignal } from './AITradingEngine';

// Exchange adapters interfaces
export interface ExchangeAdapter {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // Market data methods
  fetchTicker(symbol: string): Promise<any>;
  fetchOrderBook(symbol: string, limit?: number): Promise<any>;
  fetchTrades(symbol: string, limit?: number): Promise<any>;
  
  // Account methods
  fetchBalance(): Promise<any>;
  fetchPositions(symbol?: string): Promise<any>;
  
  // Trading methods
  createMarketOrder(symbol: string, type: 'buy' | 'sell', amount: number, price?: number): Promise<any>;
  createLimitOrder(symbol: string, type: 'buy' | 'sell', amount: number, price: number): Promise<any>;
  createStopOrder(symbol: string, type: 'buy' | 'sell', amount: number, stopPrice: number): Promise<any>;
  cancelOrder(id: string, symbol?: string): Promise<any>;
  fetchOrder(id: string, symbol?: string): Promise<any>;
  fetchOpenOrders(symbol?: string): Promise<any>;
  
  // WebSocket methods
  watchTicker(symbol: string, callback: (data: any) => void): Promise<void>;
  watchOrderBook(symbol: string, callback: (data: any) => void): Promise<void>;
  watchTrades(symbol: string, callback: (data: any) => void): Promise<void>;
  watchOrders(callback: (data: any) => void): Promise<void>;
}

// Binance adapter (crypto)
class BinanceAdapter implements ExchangeAdapter {
  name = 'binance';
  private client: any = null;
  private config: ExchangeConfig;
  private paperMode: boolean = true;
  private paperBalance: Map<string, number> = new Map();
  private paperOrders: Map<string, any> = new Map();
  
  constructor(config: ExchangeConfig) {
    this.config = config;
    this.paperMode = config.sandbox || true; // Force paper mode for safety
    
    // Initialize paper balance
    this.paperBalance.set('USDT', 10000); // $10,000 paper money
    this.paperBalance.set('BTC', 0);
    this.paperBalance.set('ETH', 0);
  }
  
  async connect(): Promise<void> {
    if (this.paperMode) {
      console.log('🧪 Binance: Connected in PAPER MODE');
      return;
    }
    
    try {
      // In production, use actual ccxt binance client
      // const ccxt = require('ccxt');
      // this.client = new ccxt.binance({
      //   apiKey: this.config.apiKey,
      //   secret: this.config.apiSecret,
      //   sandbox: this.config.sandbox,
      //   enableRateLimit: true,
      // });
      // await this.client.loadMarkets();
      
      console.log('✅ Binance: Connected to live trading');
    } catch (error) {
      throw new Error(`Binance connection failed: ${error}`);
    }
  }
  
  async disconnect(): Promise<void> {
    this.client = null;
    console.log('🔌 Binance: Disconnected');
  }
  
  async fetchTicker(symbol: string): Promise<any> {
    if (this.paperMode) {
      // Simulate ticker data
      const basePrice = this.getBasePrice(symbol);
      const change = (Math.random() - 0.5) * 0.02; // ±1% random change
      
      return {
        symbol,
        last: basePrice * (1 + change),
        bid: basePrice * (1 + change - 0.001),
        ask: basePrice * (1 + change + 0.001),
        high: basePrice * (1 + Math.abs(change) + 0.005),
        low: basePrice * (1 - Math.abs(change) - 0.005),
        volume: Math.random() * 1000000,
        timestamp: Date.now()
      };
    }
    
    return this.client?.fetchTicker(symbol);
  }
  
  async fetchOrderBook(symbol: string, limit: number = 100): Promise<any> {
    if (this.paperMode) {
      const ticker = await this.fetchTicker(symbol);
      const mid = ticker.last;
      const spread = mid * 0.001; // 0.1% spread
      
      return {
        symbol,
        bids: Array.from({length: limit/2}, (_, i) => [mid - spread * (i + 1), Math.random() * 100]),
        asks: Array.from({length: limit/2}, (_, i) => [mid + spread * (i + 1), Math.random() * 100]),
        timestamp: Date.now()
      };
    }
    
    return this.client?.fetchOrderBook(symbol, limit);
  }
  
  async fetchTrades(symbol: string, limit: number = 100): Promise<any> {
    if (this.paperMode) {
      const ticker = await this.fetchTicker(symbol);
      return Array.from({length: limit}, () => ({
        id: Math.random().toString(36),
        order: Math.random().toString(36),
        amount: Math.random() * 10,
        price: ticker.last * (1 + (Math.random() - 0.5) * 0.001),
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        timestamp: Date.now() - Math.random() * 3600000
      }));
    }
    
    return this.client?.fetchTrades(symbol, limit);
  }
  
  async fetchBalance(): Promise<any> {
    if (this.paperMode) {
      const balance: any = { info: {} };
      for (const [currency, amount] of this.paperBalance) {
        balance[currency] = {
          free: amount,
          used: 0,
          total: amount
        };
      }
      return balance;
    }
    
    return this.client?.fetchBalance();
  }
  
  async fetchPositions(symbol?: string): Promise<any> {
    if (this.paperMode) {
      return []; // No positions in spot trading
    }
    
    return this.client?.fetchPositions(symbol);
  }
  
  async createMarketOrder(symbol: string, type: 'buy' | 'sell', amount: number, price?: number): Promise<any> {
    if (this.paperMode) {
      return this.simulateOrder(symbol, 'market', type, amount, price);
    }
    
    return this.client?.createMarketOrder(symbol, type, amount, price);
  }
  
  async createLimitOrder(symbol: string, type: 'buy' | 'sell', amount: number, price: number): Promise<any> {
    if (this.paperMode) {
      return this.simulateOrder(symbol, 'limit', type, amount, price);
    }
    
    return this.client?.createLimitOrder(symbol, type, amount, price);
  }
  
  async createStopOrder(symbol: string, type: 'buy' | 'sell', amount: number, stopPrice: number): Promise<any> {
    if (this.paperMode) {
      return this.simulateOrder(symbol, 'stop', type, amount, stopPrice);
    }
    
    return this.client?.createOrder(symbol, 'stop', type, amount, undefined, undefined, { stopPrice });
  }
  
  private async simulateOrder(symbol: string, orderType: string, side: 'buy' | 'sell', amount: number, price?: number): Promise<any> {
    const orderId = Math.random().toString(36);
    const ticker = await this.fetchTicker(symbol);
    const executionPrice = price || ticker.last;
    
    // Check balance
    const [base, quote] = symbol.split('/');
    const cost = amount * executionPrice;
    
    if (side === 'buy') {
      const quoteBalance = this.paperBalance.get(quote) || 0;
      if (quoteBalance < cost) {
        throw new Error(`Insufficient ${quote} balance`);
      }
      
      // Update balances
      this.paperBalance.set(quote, quoteBalance - cost);
      this.paperBalance.set(base, (this.paperBalance.get(base) || 0) + amount);
    } else {
      const baseBalance = this.paperBalance.get(base) || 0;
      if (baseBalance < amount) {
        throw new Error(`Insufficient ${base} balance`);
      }
      
      // Update balances
      this.paperBalance.set(base, baseBalance - amount);
      this.paperBalance.set(quote, (this.paperBalance.get(quote) || 0) + cost);
    }
    
    const order = {
      id: orderId,
      clientOrderId: orderId,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      lastTradeTimestamp: Date.now(),
      symbol,
      type: orderType,
      side,
      amount,
      price: executionPrice,
      cost,
      average: executionPrice,
      filled: amount,
      remaining: 0,
      status: 'closed',
      fee: { cost: cost * 0.001, currency: quote }, // 0.1% fee
      trades: [],
      info: { simulation: true }
    };
    
    this.paperOrders.set(orderId, order);
    
    console.log(`📝 PAPER ORDER: ${side.toUpperCase()} ${amount} ${symbol} at ${executionPrice}`);
    
    return order;
  }
  
  async cancelOrder(id: string, symbol?: string): Promise<any> {
    if (this.paperMode) {
      const order = this.paperOrders.get(id);
      if (!order) throw new Error('Order not found');
      
      order.status = 'canceled';
      return order;
    }
    
    return this.client?.cancelOrder(id, symbol);
  }
  
  async fetchOrder(id: string, symbol?: string): Promise<any> {
    if (this.paperMode) {
      const order = this.paperOrders.get(id);
      if (!order) throw new Error('Order not found');
      return order;
    }
    
    return this.client?.fetchOrder(id, symbol);
  }
  
  async fetchOpenOrders(symbol?: string): Promise<any> {
    if (this.paperMode) {
      const orders = Array.from(this.paperOrders.values())
        .filter(order => order.status === 'open')
        .filter(order => !symbol || order.symbol === symbol);
      return orders;
    }
    
    return this.client?.fetchOpenOrders(symbol);
  }
  
  async watchTicker(symbol: string, callback: (data: any) => void): Promise<void> {
    if (this.paperMode) {
      // Simulate real-time ticker updates
      setInterval(async () => {
        const ticker = await this.fetchTicker(symbol);
        callback(ticker);
      }, 1000);
      return;
    }
    
    // In production, use actual WebSocket
    // this.client?.watchTicker(symbol, callback);
  }
  
  async watchOrderBook(symbol: string, callback: (data: any) => void): Promise<void> {
    // Similar to watchTicker
  }
  
  async watchTrades(symbol: string, callback: (data: any) => void): Promise<void> {
    // Similar to watchTicker
  }
  
  async watchOrders(callback: (data: any) => void): Promise<void> {
    // Similar to watchTicker
  }
  
  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'BTC/USDT': 43000,
      'ETH/USDT': 2600,
      'BNB/USDT': 315,
      'ADA/USDT': 0.48,
      'XRP/USDT': 0.62,
      'SOL/USDT': 95,
      'MATIC/USDT': 0.82,
      'DOT/USDT': 7.2,
      'AVAX/USDT': 38,
      'LINK/USDT': 14.5
    };
    
    return prices[symbol] || 100;
  }
}

// Alpaca adapter (stocks)
class AlpacaAdapter implements ExchangeAdapter {
  name = 'alpaca';
  private client: any = null;
  private config: ExchangeConfig;
  private paperMode: boolean = true;
  private paperBalance: number = 100000; // $100,000 paper money
  private paperPositions: Map<string, any> = new Map();
  private paperOrders: Map<string, any> = new Map();
  
  constructor(config: ExchangeConfig) {
    this.config = config;
    this.paperMode = config.sandbox || true; // Force paper mode for safety
  }
  
  async connect(): Promise<void> {
    if (this.paperMode) {
      console.log('🧪 Alpaca: Connected in PAPER MODE');
      return;
    }
    
    try {
      // In production, use actual Alpaca client
      // const Alpaca = require('@alpacahq/alpaca-trade-api');
      // this.client = new Alpaca({
      //   key: this.config.apiKey,
      //   secret: this.config.apiSecret,
      //   paper: this.config.sandbox,
      //   usePolygon: false
      // });
      
      console.log('✅ Alpaca: Connected to live trading');
    } catch (error) {
      throw new Error(`Alpaca connection failed: ${error}`);
    }
  }
  
  async disconnect(): Promise<void> {
    this.client = null;
    console.log('🔌 Alpaca: Disconnected');
  }
  
  async fetchTicker(symbol: string): Promise<any> {
    if (this.paperMode) {
      const basePrice = this.getBasePrice(symbol);
      const change = (Math.random() - 0.5) * 0.01; // ±0.5% random change
      
      return {
        symbol,
        last: basePrice * (1 + change),
        bid: basePrice * (1 + change - 0.0005),
        ask: basePrice * (1 + change + 0.0005),
        high: basePrice * (1 + Math.abs(change) + 0.002),
        low: basePrice * (1 - Math.abs(change) - 0.002),
        volume: Math.random() * 10000000,
        timestamp: Date.now()
      };
    }
    
    // return this.client?.getLastTrade(symbol);
  }
  
  async fetchOrderBook(symbol: string, limit?: number): Promise<any> {
    // Stocks don't typically have full order book data available
    const ticker = await this.fetchTicker(symbol);
    return {
      symbol,
      bids: [[ticker.bid, 1000]],
      asks: [[ticker.ask, 1000]],
      timestamp: Date.now()
    };
  }
  
  async fetchTrades(symbol: string, limit?: number): Promise<any> {
    if (this.paperMode) {
      return []; // Simplified for paper trading
    }
    
    // return this.client?.getTrades(symbol, { limit });
  }
  
  async fetchBalance(): Promise<any> {
    if (this.paperMode) {
      return {
        USD: {
          free: this.paperBalance,
          used: 0,
          total: this.paperBalance
        }
      };
    }
    
    // return this.client?.getAccount();
  }
  
  async fetchPositions(symbol?: string): Promise<any> {
    if (this.paperMode) {
      const positions = Array.from(this.paperPositions.values());
      return symbol ? positions.filter(p => p.symbol === symbol) : positions;
    }
    
    // return this.client?.getPositions();
  }
  
  async createMarketOrder(symbol: string, type: 'buy' | 'sell', amount: number, price?: number): Promise<any> {
    if (this.paperMode) {
      return this.simulateStockOrder(symbol, 'market', type, amount, price);
    }
    
    // return this.client?.createOrder({
    //   symbol,
    //   qty: amount,
    //   side: type,
    //   type: 'market',
    //   time_in_force: 'day'
    // });
  }
  
  async createLimitOrder(symbol: string, type: 'buy' | 'sell', amount: number, price: number): Promise<any> {
    if (this.paperMode) {
      return this.simulateStockOrder(symbol, 'limit', type, amount, price);
    }
    
    // return this.client?.createOrder({
    //   symbol,
    //   qty: amount,
    //   side: type,
    //   type: 'limit',
    //   limit_price: price,
    //   time_in_force: 'day'
    // });
  }
  
  async createStopOrder(symbol: string, type: 'buy' | 'sell', amount: number, stopPrice: number): Promise<any> {
    if (this.paperMode) {
      return this.simulateStockOrder(symbol, 'stop', type, amount, stopPrice);
    }
    
    // return this.client?.createOrder({
    //   symbol,
    //   qty: amount,
    //   side: type,
    //   type: 'stop',
    //   stop_price: stopPrice,
    //   time_in_force: 'day'
    // });
  }
  
  private async simulateStockOrder(symbol: string, orderType: string, side: 'buy' | 'sell', amount: number, price?: number): Promise<any> {
    const orderId = Math.random().toString(36);
    const ticker = await this.fetchTicker(symbol);
    const executionPrice = price || ticker.last;
    const cost = amount * executionPrice;
    
    if (side === 'buy') {
      if (this.paperBalance < cost) {
        throw new Error('Insufficient USD balance');
      }
      
      this.paperBalance -= cost;
      
      // Add to positions
      const existingPosition = this.paperPositions.get(symbol);
      if (existingPosition) {
        const newQty = existingPosition.qty + amount;
        const newAvgPrice = (existingPosition.qty * existingPosition.avg_entry_price + cost) / newQty;
        existingPosition.qty = newQty;
        existingPosition.avg_entry_price = newAvgPrice;
      } else {
        this.paperPositions.set(symbol, {
          symbol,
          qty: amount,
          side: 'long',
          avg_entry_price: executionPrice,
          market_value: cost,
          unrealized_pl: 0
        });
      }
    } else {
      const position = this.paperPositions.get(symbol);
      if (!position || position.qty < amount) {
        throw new Error('Insufficient shares to sell');
      }
      
      this.paperBalance += cost;
      
      // Reduce position
      position.qty -= amount;
      if (position.qty === 0) {
        this.paperPositions.delete(symbol);
      }
    }
    
    const order = {
      id: orderId,
      client_order_id: orderId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      filled_at: new Date().toISOString(),
      symbol,
      asset_class: 'us_equity',
      order_type: orderType,
      side,
      qty: amount,
      filled_qty: amount,
      limit_price: orderType === 'limit' ? executionPrice : null,
      stop_price: orderType === 'stop' ? executionPrice : null,
      filled_avg_price: executionPrice,
      status: 'filled',
      time_in_force: 'day',
      info: { simulation: true }
    };
    
    this.paperOrders.set(orderId, order);
    
    console.log(`📝 PAPER STOCK ORDER: ${side.toUpperCase()} ${amount} ${symbol} at $${executionPrice}`);
    
    return order;
  }
  
  async cancelOrder(id: string, symbol?: string): Promise<any> {
    if (this.paperMode) {
      const order = this.paperOrders.get(id);
      if (!order) throw new Error('Order not found');
      
      order.status = 'canceled';
      return order;
    }
    
    // return this.client?.cancelOrder(id);
  }
  
  async fetchOrder(id: string, symbol?: string): Promise<any> {
    if (this.paperMode) {
      return this.paperOrders.get(id);
    }
    
    // return this.client?.getOrder(id);
  }
  
  async fetchOpenOrders(symbol?: string): Promise<any> {
    if (this.paperMode) {
      return Array.from(this.paperOrders.values())
        .filter(order => order.status === 'new' || order.status === 'accepted')
        .filter(order => !symbol || order.symbol === symbol);
    }
    
    // return this.client?.getOrders({ status: 'open', symbols: symbol });
  }
  
  async watchTicker(symbol: string, callback: (data: any) => void): Promise<void> {
    if (this.paperMode) {
      setInterval(async () => {
        const ticker = await this.fetchTicker(symbol);
        callback(ticker);
      }, 2000); // 2 second updates for stocks
      return;
    }
    
    // In production, use Alpaca WebSocket
  }
  
  async watchOrderBook(symbol: string, callback: (data: any) => void): Promise<void> {
    // Stocks don't have traditional order book streaming
  }
  
  async watchTrades(symbol: string, callback: (data: any) => void): Promise<void> {
    // In production, use Alpaca WebSocket for trades
  }
  
  async watchOrders(callback: (data: any) => void): Promise<void> {
    // In production, use Alpaca WebSocket for order updates
  }
  
  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'AAPL': 175,
      'MSFT': 340,
      'GOOGL': 140,
      'AMZN': 145,
      'TSLA': 240,
      'META': 485,
      'NVDA': 480,
      'NFLX': 420,
      'AMD': 105,
      'INTC': 45,
      'CRM': 260,
      'ORCL': 110,
      'ADBE': 580,
      'PYPL': 58,
      'UBER': 62,
      'SHOP': 58
    };
    
    return prices[symbol] || 100;
  }
}

export class OrderManager extends EventEmitter {
  private config: TradingConfig;
  private exchanges: Map<string, ExchangeAdapter> = new Map();
  private activeOrders: Map<string, any> = new Map();
  private orderHistory: Map<string, any[]> = new Map();
  
  constructor(config: TradingConfig) {
    super();
    this.config = config;
  }
  
  async initialize(): Promise<void> {
    console.log('🔄 Initializing Order Manager...');
    
    // Initialize exchange adapters
    for (const exchangeConfig of this.config.exchanges) {
      if (!exchangeConfig.enabled) continue;
      
      let adapter: ExchangeAdapter;
      
      switch (exchangeConfig.name.toLowerCase()) {
        case 'binance':
          adapter = new BinanceAdapter(exchangeConfig);
          break;
        case 'alpaca':
          adapter = new AlpacaAdapter(exchangeConfig);
          break;
        default:
          console.warn(`⚠️ Exchange ${exchangeConfig.name} not supported yet`);
          continue;
      }
      
      try {
        await adapter.connect();
        this.exchanges.set(exchangeConfig.name, adapter);
        console.log(`✅ ${exchangeConfig.name} adapter initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${exchangeConfig.name}:`, error);
      }
    }
    
    // Start order monitoring
    this.startOrderMonitoring();
    
    console.log('✅ Order Manager initialized');
  }
  
  async placeOrder(signal: TradeSignal): Promise<any> {
    const adapter = this.exchanges.get(signal.exchange);
    if (!adapter) {
      throw new Error(`Exchange ${signal.exchange} not available`);
    }
    
    try {
      let order: any;
      
      // Use market orders for immediate execution
      if (signal.action === 'BUY' || signal.action === 'SELL') {
        const side = signal.action.toLowerCase() as 'buy' | 'sell';
        order = await adapter.createMarketOrder(signal.symbol, side, signal.quantity);
      } else {
        throw new Error(`Unsupported order action: ${signal.action}`);
      }
      
      // Store order for tracking
      this.activeOrders.set(order.id, {
        ...order,
        signal,
        createdAt: new Date(),
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit
      });
      
      // Set stop loss and take profit orders
      if (signal.stopLoss && order.status === 'filled') {
        await this.setStopLoss(signal.symbol, signal.exchange, signal.quantity, signal.stopLoss, signal.action);
      }
      
      if (signal.takeProfit && order.status === 'filled') {
        await this.setTakeProfit(signal.symbol, signal.exchange, signal.quantity, signal.takeProfit, signal.action);
      }
      
      this.emit('orderPlaced', order);
      return order;
      
    } catch (error) {
      console.error(`❌ Order placement failed for ${signal.symbol}:`, error);
      this.emit('orderError', { signal, error });
      throw error;
    }
  }
  
  private async setStopLoss(symbol: string, exchange: string, quantity: number, stopPrice: number, originalAction: string): Promise<void> {
    const adapter = this.exchanges.get(exchange);
    if (!adapter) return;
    
    try {
      const side = originalAction === 'BUY' ? 'sell' : 'buy'; // Opposite side for stop loss
      const stopOrder = await adapter.createStopOrder(symbol, side, quantity, stopPrice);
      
      this.activeOrders.set(stopOrder.id, {
        ...stopOrder,
        orderType: 'stop_loss',
        parentSymbol: symbol
      });
      
      console.log(`🛡️ Stop loss set for ${symbol} at ${stopPrice}`);
    } catch (error) {
      console.error(`❌ Failed to set stop loss for ${symbol}:`, error);
    }
  }
  
  private async setTakeProfit(symbol: string, exchange: string, quantity: number, takeProfitPrice: number, originalAction: string): Promise<void> {
    const adapter = this.exchanges.get(exchange);
    if (!adapter) return;
    
    try {
      const side = originalAction === 'BUY' ? 'sell' : 'buy'; // Opposite side for take profit
      const takeProfitOrder = await adapter.createLimitOrder(symbol, side, quantity, takeProfitPrice);
      
      this.activeOrders.set(takeProfitOrder.id, {
        ...takeProfitOrder,
        orderType: 'take_profit',
        parentSymbol: symbol
      });
      
      console.log(`🎯 Take profit set for ${symbol} at ${takeProfitPrice}`);
    } catch (error) {
      console.error(`❌ Failed to set take profit for ${symbol}:`, error);
    }
  }
  
  async closePosition(symbol: string, position: any): Promise<any> {
    // Determine which exchange to use
    const exchange = this.getExchangeForSymbol(symbol);
    const adapter = this.exchanges.get(exchange);
    
    if (!adapter) {
      throw new Error(`No adapter available for ${symbol}`);
    }
    
    try {
      // Determine order side (opposite of position)
      const side = position.side === 'long' ? 'sell' : 'buy';
      const quantity = Math.abs(position.quantity || position.qty || position.amount);
      
      const order = await adapter.createMarketOrder(symbol, side, quantity);
      
      this.emit('positionClosed', { symbol, order });
      return order;
      
    } catch (error) {
      console.error(`❌ Failed to close position for ${symbol}:`, error);
      throw error;
    }
  }
  
  async cancelOrder(orderId: string, symbol?: string): Promise<any> {
    const order = this.activeOrders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    const exchangeName = this.getExchangeForSymbol(order.symbol || symbol || '');
    const adapter = this.exchanges.get(exchangeName);
    
    if (!adapter) {
      throw new Error(`Exchange adapter not found for order ${orderId}`);
    }
    
    try {
      const cancelResult = await adapter.cancelOrder(orderId, symbol);
      this.activeOrders.delete(orderId);
      
      this.emit('orderCanceled', cancelResult);
      return cancelResult;
      
    } catch (error) {
      console.error(`❌ Failed to cancel order ${orderId}:`, error);
      throw error;
    }
  }
  
  async getOrderStatus(orderId: string, symbol?: string): Promise<any> {
    const order = this.activeOrders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    const exchangeName = this.getExchangeForSymbol(order.symbol || symbol || '');
    const adapter = this.exchanges.get(exchangeName);
    
    if (!adapter) {
      throw new Error(`Exchange adapter not found for order ${orderId}`);
    }
    
    try {
      return await adapter.fetchOrder(orderId, symbol);
    } catch (error) {
      console.error(`❌ Failed to fetch order ${orderId}:`, error);
      throw error;
    }
  }
  
  async getAccountBalance(exchange?: string): Promise<any> {
    if (exchange) {
      const adapter = this.exchanges.get(exchange);
      return adapter ? await adapter.fetchBalance() : null;
    }
    
    const balances: Record<string, any> = {};
    for (const [exchangeName, adapter] of this.exchanges) {
      try {
        balances[exchangeName] = await adapter.fetchBalance();
      } catch (error) {
        console.error(`❌ Failed to fetch balance from ${exchangeName}:`, error);
        balances[exchangeName] = null;
      }
    }
    
    return balances;
  }
  
  async getAllPositions(exchange?: string): Promise<any> {
    if (exchange) {
      const adapter = this.exchanges.get(exchange);
      return adapter ? await adapter.fetchPositions() : [];
    }
    
    const allPositions: Record<string, any[]> = {};
    for (const [exchangeName, adapter] of this.exchanges) {
      try {
        allPositions[exchangeName] = await adapter.fetchPositions();
      } catch (error) {
        console.error(`❌ Failed to fetch positions from ${exchangeName}:`, error);
        allPositions[exchangeName] = [];
      }
    }
    
    return allPositions;
  }
  
  private startOrderMonitoring(): void {
    // Monitor orders every 10 seconds
    setInterval(async () => {
      await this.monitorActiveOrders();
    }, 10000);
  }
  
  private async monitorActiveOrders(): Promise<void> {
    for (const [orderId, orderData] of this.activeOrders) {
      try {
        const exchangeName = this.getExchangeForSymbol(orderData.symbol);
        const adapter = this.exchanges.get(exchangeName);
        
        if (!adapter) continue;
        
        const currentOrder = await adapter.fetchOrder(orderId, orderData.symbol);
        
        if (currentOrder.status !== orderData.status) {
          // Order status changed
          this.activeOrders.set(orderId, { ...orderData, ...currentOrder });
          
          if (currentOrder.status === 'filled') {
            this.emit('orderFilled', currentOrder);
            
            // Move to history if order is completed
            if (!this.orderHistory.has(orderData.symbol)) {
              this.orderHistory.set(orderData.symbol, []);
            }
            this.orderHistory.get(orderData.symbol)!.push(currentOrder);
          } else if (currentOrder.status === 'canceled' || currentOrder.status === 'rejected') {
            this.emit('orderCanceled', currentOrder);
            this.activeOrders.delete(orderId);
          }
        }
      } catch (error) {
        // Order might have been filled/canceled - remove from active orders
        this.activeOrders.delete(orderId);
      }
    }
  }
  
  private getExchangeForSymbol(symbol: string): string {
    // Simple logic to determine exchange based on symbol format
    if (symbol.includes('/')) {
      return 'binance'; // Crypto pairs
    } else if (symbol.length <= 5 && /^[A-Z]+$/.test(symbol)) {
      return 'alpaca'; // Stock symbols
    }
    
    return 'binance'; // Default
  }
  
  // Public API methods
  public getActiveOrders(): Map<string, any> {
    return new Map(this.activeOrders);
  }
  
  public getOrderHistory(symbol?: string): any[] {
    if (symbol) {
      return this.orderHistory.get(symbol) || [];
    }
    
    const allHistory: any[] = [];
    for (const history of this.orderHistory.values()) {
      allHistory.push(...history);
    }
    
    return allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  public getExchangeStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [name, adapter] of this.exchanges) {
      status[name] = adapter !== null;
    }
    return status;
  }
  
  public async emergencyCloseAll(): Promise<void> {
    console.log('🚨 EMERGENCY: Closing all positions');
    
    const allPositions = await this.getAllPositions();
    
    for (const [exchangeName, positions] of Object.entries(allPositions)) {
      if (!Array.isArray(positions)) continue;
      
      for (const position of positions) {
        try {
          await this.closePosition(position.symbol, position);
          console.log(`✅ Emergency closed position: ${position.symbol}`);
        } catch (error) {
          console.error(`❌ Failed to emergency close ${position.symbol}:`, error);
        }
      }
    }
    
    // Cancel all active orders
    for (const orderId of this.activeOrders.keys()) {
      try {
        await this.cancelOrder(orderId);
        console.log(`✅ Emergency canceled order: ${orderId}`);
      } catch (error) {
        console.error(`❌ Failed to emergency cancel order ${orderId}:`, error);
      }
    }
  }
}

export default OrderManager;