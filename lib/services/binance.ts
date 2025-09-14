import crypto from 'crypto';

interface BinanceCredentials {
  apiKey: string;
  secretKey: string;
  testnet?: boolean;
}

interface BinanceOrderResponse {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  side: string;
  type: string;
  fills: Array<{
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
  }>;
}

interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

interface BinancePrice {
  symbol: string;
  price: string;
}

interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

interface BinanceOrderBookEntry {
  price: string;
  quantity: string;
}

interface BinanceOrderBook {
  lastUpdateId: number;
  bids: BinanceOrderBookEntry[];
  asks: BinanceOrderBookEntry[];
}

class BinanceService {
  private credentials: BinanceCredentials | null = null;
  private baseUrl: string;
  private recvWindow = 5000;

  constructor(testnet = true) {
    this.baseUrl = testnet 
      ? 'https://testnet.binance.vision/api'
      : 'https://api.binance.com/api';
  }

  setCredentials(credentials: BinanceCredentials) {
    this.credentials = credentials;
    this.baseUrl = credentials.testnet 
      ? 'https://testnet.binance.vision/api'
      : 'https://api.binance.com/api';
  }

  private createSignature(queryString: string): string {
    if (!this.credentials?.secretKey) {
      throw new Error('Secret key not configured');
    }
    return crypto
      .createHmac('sha256', this.credentials.secretKey)
      .update(queryString)
      .digest('hex');
  }

  private async makeRequest(
    endpoint: string,
    method = 'GET',
    params: Record<string, any> = {},
    signed = false
  ): Promise<any> {
    if (!this.credentials?.apiKey) {
      throw new Error('API key not configured');
    }

    let queryString = '';
    if (Object.keys(params).length > 0) {
      queryString = new URLSearchParams(params).toString();
    }

    if (signed) {
      const timestamp = Date.now();
      const signedParams = queryString 
        ? `${queryString}&timestamp=${timestamp}&recvWindow=${this.recvWindow}`
        : `timestamp=${timestamp}&recvWindow=${this.recvWindow}`;
      
      const signature = this.createSignature(signedParams);
      queryString = `${signedParams}&signature=${signature}`;
    }

    const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;

    const headers: Record<string, string> = {
      'X-MBX-APIKEY': this.credentials.apiKey,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Binance API error: ${response.status} - ${errorData.msg || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Binance API request failed:', error);
      throw error;
    }
  }

  /**
   * Test connectivity to the Rest API
   */
  async ping(): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/v3/ping`);
      return true;
    } catch (error) {
      console.error('Binance ping failed:', error);
      return false;
    }
  }

  /**
   * Get server time
   */
  async getServerTime(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/v3/time`);
    const data = await response.json();
    return data.serverTime;
  }

  /**
   * Get exchange information
   */
  async getExchangeInfo(): Promise<any> {
    return this.makeRequest('/v3/exchangeInfo');
  }

  /**
   * Get symbol price ticker
   */
  async getPrice(symbol?: string): Promise<BinancePrice | BinancePrice[]> {
    const params = symbol ? { symbol } : {};
    return this.makeRequest('/v3/ticker/price', 'GET', params);
  }

  /**
   * Get 24hr ticker price change statistics
   */
  async getTicker(symbol?: string): Promise<BinanceTicker | BinanceTicker[]> {
    const params = symbol ? { symbol } : {};
    return this.makeRequest('/v3/ticker/24hr', 'GET', params);
  }

  /**
   * Get order book
   */
  async getOrderBook(symbol: string, limit = 100): Promise<BinanceOrderBook> {
    return this.makeRequest('/v3/depth', 'GET', { symbol, limit });
  }

  /**
   * Get recent trades
   */
  async getRecentTrades(symbol: string, limit = 500): Promise<any[]> {
    return this.makeRequest('/v3/trades', 'GET', { symbol, limit });
  }

  /**
   * Get kline/candlestick data
   */
  async getKlines(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit = 500
  ): Promise<any[]> {
    const params: any = { symbol, interval, limit };
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    
    return this.makeRequest('/v3/klines', 'GET', params);
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    return this.makeRequest('/v3/account', 'GET', {}, true);
  }

  /**
   * Get account balances
   */
  async getBalances(): Promise<BinanceBalance[]> {
    const account = await this.getAccountInfo();
    return account.balances;
  }

  /**
   * Get open orders
   */
  async getOpenOrders(symbol?: string): Promise<any[]> {
    const params = symbol ? { symbol } : {};
    return this.makeRequest('/v3/openOrders', 'GET', params, true);
  }

  /**
   * Get all orders (active, canceled, filled)
   */
  async getAllOrders(symbol: string, limit = 500): Promise<any[]> {
    return this.makeRequest('/v3/allOrders', 'GET', { symbol, limit }, true);
  }

  /**
   * Create a new order
   */
  async createOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    type: string,
    options: {
      quantity?: string;
      price?: string;
      stopPrice?: string;
      timeInForce?: string;
      newClientOrderId?: string;
    } = {}
  ): Promise<BinanceOrderResponse> {
    const params: any = {
      symbol,
      side,
      type,
      ...options,
    };

    return this.makeRequest('/v3/order', 'POST', params, true);
  }

  /**
   * Create market buy order
   */
  async marketBuy(symbol: string, quantity: string): Promise<BinanceOrderResponse> {
    return this.createOrder(symbol, 'BUY', 'MARKET', { quantity });
  }

  /**
   * Create market sell order
   */
  async marketSell(symbol: string, quantity: string): Promise<BinanceOrderResponse> {
    return this.createOrder(symbol, 'SELL', 'MARKET', { quantity });
  }

  /**
   * Create limit buy order
   */
  async limitBuy(symbol: string, quantity: string, price: string): Promise<BinanceOrderResponse> {
    return this.createOrder(symbol, 'BUY', 'LIMIT', { 
      quantity, 
      price, 
      timeInForce: 'GTC' 
    });
  }

  /**
   * Create limit sell order
   */
  async limitSell(symbol: string, quantity: string, price: string): Promise<BinanceOrderResponse> {
    return this.createOrder(symbol, 'SELL', 'LIMIT', { 
      quantity, 
      price, 
      timeInForce: 'GTC' 
    });
  }

  /**
   * Create stop loss order
   */
  async stopLoss(
    symbol: string, 
    side: 'BUY' | 'SELL', 
    quantity: string, 
    stopPrice: string
  ): Promise<BinanceOrderResponse> {
    return this.createOrder(symbol, side, 'STOP_LOSS_LIMIT', {
      quantity,
      stopPrice,
      price: stopPrice, // Use stop price as limit price
      timeInForce: 'GTC',
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    return this.makeRequest('/v3/order', 'DELETE', { symbol, orderId }, true);
  }

  /**
   * Cancel all open orders for a symbol
   */
  async cancelAllOrders(symbol: string): Promise<any> {
    return this.makeRequest('/v3/openOrders', 'DELETE', { symbol }, true);
  }

  /**
   * Get order status
   */
  async getOrder(symbol: string, orderId: number): Promise<any> {
    return this.makeRequest('/v3/order', 'GET', { symbol, orderId }, true);
  }

  /**
   * Get trading fees
   */
  async getTradingFees(): Promise<any> {
    return this.makeRequest('/v3/tradeFee', 'GET', {}, true);
  }

  /**
   * Get deposit history
   */
  async getDepositHistory(coin?: string): Promise<any> {
    const params = coin ? { coin } : {};
    return this.makeRequest('/sapi/v1/capital/deposit/hisrec', 'GET', params, true);
  }

  /**
   * Get withdraw history
   */
  async getWithdrawHistory(coin?: string): Promise<any> {
    const params = coin ? { coin } : {};
    return this.makeRequest('/sapi/v1/capital/withdraw/history', 'GET', params, true);
  }

  /**
   * Get popular trading pairs
   */
  async getPopularPairs(): Promise<string[]> {
    const tickers = await this.getTicker() as BinanceTicker[];
    
    // Sort by 24h volume and return top trading pairs
    return tickers
      .filter(ticker => 
        ticker.symbol.endsWith('USDT') || 
        ticker.symbol.endsWith('BTC') || 
        ticker.symbol.endsWith('ETH')
      )
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 50)
      .map(ticker => ticker.symbol);
  }
}

export const binanceService = new BinanceService(true); // Start with testnet
export type { 
  BinanceCredentials, 
  BinanceOrderResponse, 
  BinanceBalance, 
  BinancePrice, 
  BinanceTicker,
  BinanceOrderBook 
};
