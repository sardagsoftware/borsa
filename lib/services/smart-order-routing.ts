// Smart Order Routing (SOR) for Multi-Exchange Execution
import { EventEmitter } from 'events';

export interface ExchangeInfo {
  name: string;
  baseUrl: string;
  weight: number; // Preference weight (0-1)
  fees: {
    maker: number;
    taker: number;
  };
  limits: {
    minOrderSize: number;
    maxOrderSize: number;
  };
  latency: number; // Average response time in ms
  reliability: number; // Uptime percentage
  volume24h: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  exchange: string;
}

export interface ConsolidatedOrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
  spread: number;
  depth: {
    bidDepth: number;
    askDepth: number;
  };
}

export interface RoutingStrategy {
  type: 'vwap' | 'twap' | 'implementation_shortfall' | 'iceberg' | 'smart_limit';
  parameters: {
    timeHorizon?: number; // minutes
    maxSlippage?: number; // percentage
    maxExposure?: number; // percentage of volume
    urgency?: 'low' | 'medium' | 'high';
    hiddenSize?: number; // for iceberg orders
  };
}

export interface OrderSlice {
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'GTX';
  expectedFee: number;
  expectedSlippage: number;
  priority: number;
}

export interface ExecutionReport {
  orderId: string;
  symbol: string;
  totalQuantity: number;
  executedQuantity: number;
  avgExecutionPrice: number;
  totalFees: number;
  slippage: number;
  executionTime: number; // milliseconds
  exchanges: {
    [exchange: string]: {
      quantity: number;
      price: number;
      fee: number;
    };
  };
  vwapBenchmark: number;
  performanceMetrics: {
    priceImprovement: number;
    fillRatio: number;
    timeToFill: number;
  };
}

export class SmartOrderRouter extends EventEmitter {
  private exchanges: Map<string, ExchangeInfo> = new Map();
  private orderBooks: Map<string, ConsolidatedOrderBook> = new Map();
  private executionHistory: ExecutionReport[] = [];
  private activeOrders: Map<string, OrderSlice[]> = new Map();

  constructor() {
    super();
    this.initializeExchanges();
  }

  private initializeExchanges() {
    // Initialize supported exchanges with their characteristics
    this.exchanges.set('binance', {
      name: 'Binance',
      baseUrl: 'https://api.binance.com',
      weight: 0.4, // High weight due to liquidity
      fees: { maker: 0.001, taker: 0.001 },
      limits: { minOrderSize: 0.00001, maxOrderSize: 100000 },
      latency: 50,
      reliability: 99.9,
      volume24h: 15000000000, // $15B
    });

    this.exchanges.set('bybit', {
      name: 'Bybit',
      baseUrl: 'https://api.bybit.com',
      weight: 0.25,
      fees: { maker: 0.001, taker: 0.0006 },
      limits: { minOrderSize: 0.00001, maxOrderSize: 50000 },
      latency: 60,
      reliability: 99.8,
      volume24h: 8000000000, // $8B
    });

    this.exchanges.set('okx', {
      name: 'OKX',
      baseUrl: 'https://www.okx.com',
      weight: 0.2,
      fees: { maker: 0.0008, taker: 0.001 },
      limits: { minOrderSize: 0.00001, maxOrderSize: 30000 },
      latency: 70,
      reliability: 99.7,
      volume24h: 5000000000, // $5B
    });

    this.exchanges.set('kucoin', {
      name: 'KuCoin',
      baseUrl: 'https://api.kucoin.com',
      weight: 0.15,
      fees: { maker: 0.001, taker: 0.001 },
      limits: { minOrderSize: 0.0001, maxOrderSize: 20000 },
      latency: 80,
      reliability: 99.5,
      volume24h: 2000000000, // $2B
    });
  }

  // Consolidate order books from multiple exchanges
  public async consolidateOrderBook(symbol: string): Promise<ConsolidatedOrderBook> {
    const exchangeBooks = await Promise.all(
      Array.from(this.exchanges.keys()).map(async (exchange) => {
        try {
          return await this.fetchOrderBook(exchange, symbol);
        } catch (error) {
          console.warn(`Failed to fetch order book from ${exchange}:`, error);
          return null;
        }
      })
    );

    const validBooks = exchangeBooks.filter(book => book !== null);
    if (validBooks.length === 0) {
      throw new Error('No valid order books available');
    }

    // Combine and sort all bids and asks
    const allBids: OrderBookLevel[] = [];
    const allAsks: OrderBookLevel[] = [];

    validBooks.forEach(book => {
      allBids.push(...book.bids);
      allAsks.push(...book.asks);
    });

    // Sort bids (highest first) and asks (lowest first)
    allBids.sort((a, b) => b.price - a.price);
    allAsks.sort((a, b) => a.price - b.price);

    // Calculate consolidated metrics
    const bestBid = allBids[0]?.price || 0;
    const bestAsk = allAsks[0]?.price || 0;
    const spread = bestAsk - bestBid;

    const bidDepth = allBids.slice(0, 20).reduce((sum, level) => sum + level.quantity, 0);
    const askDepth = allAsks.slice(0, 20).reduce((sum, level) => sum + level.quantity, 0);

    const consolidatedBook: ConsolidatedOrderBook = {
      symbol,
      bids: allBids.slice(0, 50), // Top 50 levels
      asks: allAsks.slice(0, 50),
      timestamp: Date.now(),
      spread,
      depth: { bidDepth, askDepth },
    };

    this.orderBooks.set(symbol, consolidatedBook);
    this.emit('orderBookUpdate', consolidatedBook);

    return consolidatedBook;
  }

  // Main routing function - determines optimal execution strategy
  public async routeOrder(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    strategy: RoutingStrategy,
    maxSlippage: number = 0.005 // 0.5% default
  ): Promise<OrderSlice[]> {
    
    const orderBook = await this.consolidateOrderBook(symbol);
    const marketData = this.analyzeMarketConditions(orderBook);
    
    // Select routing algorithm based on strategy
    switch (strategy.type) {
      case 'vwap':
        return this.vwapRouting(symbol, side, quantity, orderBook, strategy, maxSlippage);
      
      case 'twap':
        return this.twapRouting(symbol, side, quantity, orderBook, strategy, maxSlippage);
      
      case 'implementation_shortfall':
        return this.implementationShortfallRouting(symbol, side, quantity, orderBook, strategy, maxSlippage);
      
      case 'iceberg':
        return this.icebergRouting(symbol, side, quantity, orderBook, strategy, maxSlippage);
      
      case 'smart_limit':
        return this.smartLimitRouting(symbol, side, quantity, orderBook, strategy, maxSlippage);
      
      default:
        throw new Error(`Unknown routing strategy: ${strategy.type}`);
    }
  }

  // VWAP (Volume Weighted Average Price) routing
  private vwapRouting(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    orderBook: ConsolidatedOrderBook,
    strategy: RoutingStrategy,
    maxSlippage: number
  ): OrderSlice[] {
    
    const levels = side === 'buy' ? orderBook.asks : orderBook.bids;
    const slices: OrderSlice[] = [];
    let remainingQuantity = quantity;
    let cumulativeCost = 0;
    let cumulativeQuantity = 0;

    // Calculate VWAP and optimal distribution
    for (const level of levels) {
      if (remainingQuantity <= 0) break;

      const exchange = this.exchanges.get(level.exchange);
      if (!exchange) continue;

      const sliceQuantity = Math.min(remainingQuantity, level.quantity);
      const expectedSlippage = this.calculateSlippage(level.price, orderBook, side);
      
      if (expectedSlippage > maxSlippage) continue;

      const expectedFee = sliceQuantity * level.price * exchange.fees.taker;
      
      slices.push({
        exchange: level.exchange,
        symbol,
        side,
        quantity: sliceQuantity,
        price: level.price,
        type: 'limit',
        timeInForce: 'IOC',
        expectedFee,
        expectedSlippage,
        priority: this.calculatePriority(exchange, expectedSlippage, expectedFee),
      });

      remainingQuantity -= sliceQuantity;
      cumulativeCost += sliceQuantity * level.price;
      cumulativeQuantity += sliceQuantity;
    }

    // Sort by priority (highest first)
    return slices.sort((a, b) => b.priority - a.priority);
  }

  // TWAP (Time Weighted Average Price) routing
  private twapRouting(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    orderBook: ConsolidatedOrderBook,
    strategy: RoutingStrategy,
    maxSlippage: number
  ): OrderSlice[] {
    
    const timeHorizon = strategy.parameters.timeHorizon || 30; // minutes
    const numSlices = Math.min(10, Math.ceil(timeHorizon / 3)); // Every 3 minutes
    const sliceSize = quantity / numSlices;

    return this.vwapRouting(symbol, side, sliceSize, orderBook, strategy, maxSlippage);
  }

  // Implementation Shortfall routing (minimize market impact + timing risk)
  private implementationShortfallRouting(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    orderBook: ConsolidatedOrderBook,
    strategy: RoutingStrategy,
    maxSlippage: number
  ): OrderSlice[] {
    
    const urgency = strategy.parameters.urgency || 'medium';
    const marketImpact = this.estimateMarketImpact(quantity, orderBook, side);
    
    // Adjust strategy based on market impact and urgency
    if (marketImpact > 0.01 || urgency === 'low') {
      // Use TWAP for large orders or low urgency
      return this.twapRouting(symbol, side, quantity, orderBook, strategy, maxSlippage);
    } else {
      // Use aggressive VWAP for smaller orders or high urgency
      return this.vwapRouting(symbol, side, quantity, orderBook, strategy, maxSlippage);
    }
  }

  // Iceberg routing (hide order size)
  private icebergRouting(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    orderBook: ConsolidatedOrderBook,
    strategy: RoutingStrategy,
    maxSlippage: number
  ): OrderSlice[] {
    
    const hiddenSize = strategy.parameters.hiddenSize || quantity * 0.1; // 10% visible
    const numSlices = Math.ceil(quantity / hiddenSize);
    
    const slices: OrderSlice[] = [];
    
    for (let i = 0; i < numSlices; i++) {
      const sliceQuantity = Math.min(hiddenSize, quantity - i * hiddenSize);
      const vwapSlices = this.vwapRouting(symbol, side, sliceQuantity, orderBook, strategy, maxSlippage);
      
      // Add delay between slices to hide order pattern
      vwapSlices.forEach((slice, index) => {
        slice.priority = slice.priority - i * 10; // Lower priority for later slices
      });
      
      slices.push(...vwapSlices);
    }
    
    return slices;
  }

  // Smart limit routing with dynamic pricing
  private smartLimitRouting(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    orderBook: ConsolidatedOrderBook,
    strategy: RoutingStrategy,
    maxSlippage: number
  ): OrderSlice[] {
    
    const bestPrice = side === 'buy' ? orderBook.asks[0]?.price : orderBook.bids[0]?.price;
    if (!bestPrice) throw new Error('No market price available');

    // Calculate smart limit prices based on market conditions
    const marketVolatility = this.calculateMarketVolatility(orderBook);
    const liquidityScore = this.calculateLiquidityScore(orderBook);
    
    // Adjust limit price based on market conditions
    const priceAdjustment = this.calculatePriceAdjustment(marketVolatility, liquidityScore);
    const limitPrice = side === 'buy' 
      ? bestPrice * (1 + priceAdjustment)
      : bestPrice * (1 - priceAdjustment);

    // Distribute across exchanges at the smart limit price
    const slices: OrderSlice[] = [];
    let remainingQuantity = quantity;

    // Prioritize exchanges by score
    const exchanges = this.rankExchanges(symbol, side);
    
    exchanges.forEach(exchange => {
      if (remainingQuantity <= 0) return;
      
      const maxQuantityForExchange = Math.min(
        remainingQuantity,
        remainingQuantity * 0.4, // Max 40% per exchange
        exchange.limits.maxOrderSize
      );
      
      if (maxQuantityForExchange >= exchange.limits.minOrderSize) {
        slices.push({
          exchange: exchange.name.toLowerCase(),
          symbol,
          side,
          quantity: maxQuantityForExchange,
          price: limitPrice,
          type: 'limit',
          timeInForce: 'GTC',
          expectedFee: maxQuantityForExchange * limitPrice * exchange.fees.maker,
          expectedSlippage: this.calculateSlippage(limitPrice, orderBook, side),
          priority: exchange.weight * 100,
        });
        
        remainingQuantity -= maxQuantityForExchange;
      }
    });

    return slices;
  }

  // Execute order slices across multiple exchanges
  public async executeOrder(slices: OrderSlice[]): Promise<ExecutionReport> {
    const orderId = this.generateOrderId();
    const startTime = Date.now();
    
    this.activeOrders.set(orderId, slices);
    
    try {
      // Execute slices in parallel with priority ordering
      const executionPromises = slices.map(async (slice, index) => {
        // Add small delay based on priority to manage execution order
        await this.delay(index * 10); 
        
        return this.executeSingleOrder(slice);
      });

      const results = await Promise.allSettled(executionPromises);
      
      // Process results and generate execution report
      const successful = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);

      const failed = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);

      // Calculate execution metrics
      const totalQuantity = slices.reduce((sum, slice) => sum + slice.quantity, 0);
      const executedQuantity = successful.reduce((sum, result) => sum + (result.executedQty || 0), 0);
      
      const totalValue = successful.reduce((sum, result) => 
        sum + (result.executedQty * result.price), 0
      );
      const avgExecutionPrice = totalValue / executedQuantity || 0;
      
      const totalFees = successful.reduce((sum, result) => sum + (result.fee || 0), 0);
      const executionTime = Date.now() - startTime;

      // Group by exchange
      const exchangeBreakdown: { [key: string]: any } = {};
      successful.forEach(result => {
        if (!exchangeBreakdown[result.exchange]) {
          exchangeBreakdown[result.exchange] = {
            quantity: 0,
            price: 0,
            fee: 0,
          };
        }
        
        exchangeBreakdown[result.exchange].quantity += result.executedQty;
        exchangeBreakdown[result.exchange].price = 
          (exchangeBreakdown[result.exchange].price + result.price) / 2;
        exchangeBreakdown[result.exchange].fee += result.fee;
      });

      // Calculate benchmark and performance metrics
      const vwapBenchmark = this.calculateVWAPBenchmark(slices[0].symbol, totalQuantity);
      const priceImprovement = this.calculatePriceImprovement(avgExecutionPrice, vwapBenchmark);
      
      const report: ExecutionReport = {
        orderId,
        symbol: slices[0].symbol,
        totalQuantity,
        executedQuantity,
        avgExecutionPrice,
        totalFees,
        slippage: this.calculateActualSlippage(avgExecutionPrice, slices),
        executionTime,
        exchanges: exchangeBreakdown,
        vwapBenchmark,
        performanceMetrics: {
          priceImprovement,
          fillRatio: executedQuantity / totalQuantity,
          timeToFill: executionTime,
        },
      };

      this.executionHistory.push(report);
      this.activeOrders.delete(orderId);
      
      this.emit('executionComplete', report);
      
      return report;
      
    } catch (error) {
      this.activeOrders.delete(orderId);
      throw error;
    }
  }

  // Helper methods
  private async fetchOrderBook(exchange: string, symbol: string): Promise<any> {
    // Mock implementation - in production, call actual exchange APIs
    return {
      bids: Array.from({ length: 20 }, (_, i) => ({
        price: 50000 - i * 10,
        quantity: Math.random() * 10,
        exchange,
      })),
      asks: Array.from({ length: 20 }, (_, i) => ({
        price: 50000 + i * 10,
        quantity: Math.random() * 10,
        exchange,
      })),
    };
  }

  private analyzeMarketConditions(orderBook: ConsolidatedOrderBook) {
    return {
      volatility: this.calculateMarketVolatility(orderBook),
      liquidity: this.calculateLiquidityScore(orderBook),
      spread: orderBook.spread,
      imbalance: this.calculateOrderBookImbalance(orderBook),
    };
  }

  private calculateSlippage(price: number, orderBook: ConsolidatedOrderBook, side: 'buy' | 'sell'): number {
    const midPrice = (orderBook.bids[0]?.price + orderBook.asks[0]?.price) / 2;
    return Math.abs(price - midPrice) / midPrice;
  }

  private calculatePriority(exchange: ExchangeInfo, slippage: number, fee: number): number {
    // Higher score is better
    const latencyScore = 100 / exchange.latency; // Lower latency = higher score
    const feeScore = 1 / fee; // Lower fee = higher score
    const slippageScore = 1 / (slippage + 0.0001); // Lower slippage = higher score
    
    return exchange.weight * exchange.reliability * latencyScore * feeScore * slippageScore;
  }

  private estimateMarketImpact(quantity: number, orderBook: ConsolidatedOrderBook, side: 'buy' | 'sell'): number {
    const levels = side === 'buy' ? orderBook.asks : orderBook.bids;
    const totalAvailableQuantity = levels.slice(0, 10).reduce((sum, level) => sum + level.quantity, 0);
    
    return quantity / totalAvailableQuantity; // Simple market impact estimate
  }

  private calculateMarketVolatility(orderBook: ConsolidatedOrderBook): number {
    // Calculate volatility based on spread and depth
    const spreadRatio = orderBook.spread / ((orderBook.bids[0]?.price + orderBook.asks[0]?.price) / 2);
    const depthRatio = Math.min(orderBook.depth.bidDepth, orderBook.depth.askDepth) / 1000; // Normalized
    
    return spreadRatio / (depthRatio + 0.1); // Higher spread, lower depth = higher volatility
  }

  private calculateLiquidityScore(orderBook: ConsolidatedOrderBook): number {
    const totalDepth = orderBook.depth.bidDepth + orderBook.depth.askDepth;
    const levelCount = orderBook.bids.length + orderBook.asks.length;
    
    return (totalDepth * levelCount) / 10000; // Normalized liquidity score
  }

  private calculatePriceAdjustment(volatility: number, liquidity: number): number {
    // Higher volatility and lower liquidity require more aggressive pricing
    const baseAdjustment = 0.0005; // 0.05% base
    const volatilityFactor = Math.min(volatility * 2, 0.005); // Max 0.5%
    const liquidityFactor = Math.max(0, 0.002 - liquidity * 0.001); // Up to 0.2%
    
    return baseAdjustment + volatilityFactor + liquidityFactor;
  }

  private rankExchanges(symbol: string, side: 'buy' | 'sell'): ExchangeInfo[] {
    return Array.from(this.exchanges.values())
      .sort((a, b) => {
        // Score based on weight, reliability, fees, and latency
        const scoreA = a.weight * a.reliability * (1 / a.fees.taker) * (100 / a.latency);
        const scoreB = b.weight * b.reliability * (1 / b.fees.taker) * (100 / b.latency);
        return scoreB - scoreA;
      });
  }

  private async executeSingleOrder(slice: OrderSlice): Promise<any> {
    // Mock execution - in production, call exchange APIs
    await this.delay(50 + Math.random() * 100); // Simulate network latency
    
    const success = Math.random() > 0.1; // 90% success rate
    if (!success) {
      throw new Error(`Order execution failed on ${slice.exchange}`);
    }
    
    const partialFill = Math.random() > 0.2; // 80% full fill rate
    const executedQty = partialFill ? slice.quantity : slice.quantity * (0.5 + Math.random() * 0.5);
    const executionPrice = slice.price || 50000 + (Math.random() - 0.5) * 100;
    
    return {
      exchange: slice.exchange,
      executedQty,
      price: executionPrice,
      fee: executedQty * executionPrice * (slice.expectedFee / (slice.quantity * (slice.price || executionPrice))),
      timestamp: Date.now(),
    };
  }

  private calculateOrderBookImbalance(orderBook: ConsolidatedOrderBook): number {
    const { bidDepth, askDepth } = orderBook.depth;
    return (bidDepth - askDepth) / (bidDepth + askDepth);
  }

  private calculateVWAPBenchmark(symbol: string, quantity: number): number {
    // Mock VWAP calculation - in production, use historical data
    return 50000 + (Math.random() - 0.5) * 1000;
  }

  private calculatePriceImprovement(executionPrice: number, benchmark: number): number {
    return (benchmark - executionPrice) / benchmark;
  }

  private calculateActualSlippage(executionPrice: number, slices: OrderSlice[]): number {
    const expectedPrice = slices.reduce((sum, slice) => 
      sum + (slice.price || 0) * slice.quantity, 0
    ) / slices.reduce((sum, slice) => sum + slice.quantity, 0);
    
    return Math.abs(executionPrice - expectedPrice) / expectedPrice;
  }

  private generateOrderId(): string {
    return `SOR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  public getExecutionHistory(limit: number = 100): ExecutionReport[] {
    return this.executionHistory.slice(-limit);
  }

  public getActiveOrders(): Map<string, OrderSlice[]> {
    return new Map(this.activeOrders);
  }

  public getExchangeStatus(): Map<string, ExchangeInfo> {
    return new Map(this.exchanges);
  }

  public subscribeToExecutions(callback: (report: ExecutionReport) => void) {
    this.on('executionComplete', callback);
  }

  public subscribeToOrderBookUpdates(callback: (orderBook: ConsolidatedOrderBook) => void) {
    this.on('orderBookUpdate', callback);
  }
}

export const smartOrderRouter = new SmartOrderRouter();
