import { Env } from '../types/worker';

// API Gateway with rate limiting and security
export class CloudflareAPI {
  private env: Env;
  private rateLimitKV: any; // KVNamespace at runtime

  constructor(env: Env) {
    this.env = env;
    this.rateLimitKV = env.SESSION_KV;
  }

  async handleRequest(request: Request): Promise<Response> {
    try {
      // Apply CORS headers
      const corsHeaders = this.getCorsHeaders(request);
      
      // Rate limiting
      const rateLimitResult = await this.checkRateLimit(request);
      if (!rateLimitResult.allowed) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Route handling
      const url = new URL(request.url);
      const response = await this.routeRequest(url, request);
      
      // Add security headers
      const secureHeaders = this.getSecurityHeaders();
      
      return new Response(response.body, {
        status: response.status,
        headers: { ...corsHeaders, ...secureHeaders, ...response.headers },
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  private async routeRequest(url: URL, request: Request): Promise<Response> {
    const path = url.pathname;
    const method = request.method;

    // Trading API endpoints
    if (path.startsWith('/api/trading/')) {
      return this.handleTradingAPI(path, method, request);
    }

    // Wallet API endpoints
    if (path.startsWith('/api/wallet/')) {
      return this.handleWalletAPI(path, method, request);
    }

    // Security API endpoints
    if (path.startsWith('/api/security/')) {
      return this.handleSecurityAPI(path, method, request);
    }

    // Portfolio API endpoints
    if (path.startsWith('/api/portfolio/')) {
      return this.handlePortfolioAPI(path, method, request);
    }

    return new Response('Not Found', { status: 404 });
  }

  private async handleTradingAPI(path: string, method: string, request: Request): Promise<Response> {
    const segments = path.split('/').filter(Boolean);
    
    switch (segments[2]) { // /api/trading/{action}
      case 'order':
        if (method === 'POST') {
          return this.createOrder(request);
        } else if (method === 'GET') {
          return this.getOrders(request);
        }
        break;
        
      case 'price':
        if (method === 'GET') {
          return this.getPrices(request);
        }
        break;
        
      case 'history':
        if (method === 'GET') {
          return this.getTradingHistory(request);
        }
        break;
        
      case 'signals':
        if (method === 'GET') {
          return this.getAISignals(request);
        }
        break;
    }

    return new Response('Method not allowed', { status: 405 });
  }

  private async handleWalletAPI(path: string, method: string, request: Request): Promise<Response> {
    const segments = path.split('/').filter(Boolean);
    
    switch (segments[2]) { // /api/wallet/{action}
      case 'balance':
        if (method === 'GET') {
          return this.getBalance(request);
        }
        break;
        
      case 'transactions':
        if (method === 'GET') {
          return this.getTransactions(request);
        } else if (method === 'POST') {
          return this.createTransaction(request);
        }
        break;
        
      case 'address':
        if (method === 'GET') {
          return this.getWalletAddress(request);
        }
        break;
    }

    return new Response('Method not allowed', { status: 405 });
  }

  private async handleSecurityAPI(path: string, method: string, request: Request): Promise<Response> {
    const segments = path.split('/').filter(Boolean);
    
    switch (segments[2]) { // /api/security/{action}
      case 'auth':
        if (method === 'POST') {
          return this.authenticate(request);
        }
        break;
        
      case 'threats':
        if (method === 'GET') {
          return this.getThreatIntelligence(request);
        }
        break;
        
      case 'incidents':
        if (method === 'GET') {
          return this.getSecurityIncidents(request);
        }
        break;
    }

    return new Response('Method not allowed', { status: 405 });
  }

  private async handlePortfolioAPI(path: string, method: string, request: Request): Promise<Response> {
    const segments = path.split('/').filter(Boolean);
    
    switch (segments[2]) { // /api/portfolio/{action}
      case 'positions':
        if (method === 'GET') {
          return this.getPositions(request);
        }
        break;
        
      case 'performance':
        if (method === 'GET') {
          return this.getPerformance(request);
        }
        break;
        
      case 'risk':
        if (method === 'GET') {
          return this.getRiskMetrics(request);
        }
        break;
    }

    return new Response('Method not allowed', { status: 405 });
  }

  // Trading API implementations
  private async createOrder(request: Request): Promise<Response> {
    const body = await request.json();
    
    // Validate order
    if (!body.symbol || !body.amount || !body.side) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: symbol, amount, side',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Mock order creation
    const order = {
      id: crypto.randomUUID(),
      symbol: body.symbol,
      side: body.side,
      amount: body.amount,
      price: body.price || null,
      type: body.type || 'market',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private async getOrders(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // Mock orders data
    const orders = [
      {
        id: '1',
        symbol: 'BTC/USDT',
        side: 'buy',
        amount: 0.1,
        price: 45000,
        type: 'limit',
        status: 'filled',
        timestamp: new Date().toISOString(),
      },
    ];

    return new Response(JSON.stringify({
      success: true,
      data: orders,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private async getPrices(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const symbols = url.searchParams.get('symbols')?.split(',') || ['BTC/USDT'];
    
    // Mock price data
    const prices = symbols.map(symbol => ({
      symbol,
      price: Math.random() * 100000,
      change24h: (Math.random() - 0.5) * 10,
      volume24h: Math.random() * 1000000,
      timestamp: new Date().toISOString(),
    }));

    return new Response(JSON.stringify({
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private async getTradingHistory(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // Mock history data
    const history = Array.from({ length: Math.min(limit, 50) }, (_, i) => ({
      id: crypto.randomUUID(),
      symbol: 'BTC/USDT',
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      amount: Math.random() * 0.5,
      price: 45000 + (Math.random() - 0.5) * 5000,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
    }));

    return new Response(JSON.stringify({
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private async getAISignals(request: Request): Promise<Response> {
    // Mock AI signals
    const signals = [
      {
        symbol: 'BTC/USDT',
        signal: 'BUY',
        confidence: 0.85,
        price_target: 48000,
        stop_loss: 42000,
        reasoning: 'Technical indicators show strong bullish momentum',
        timestamp: new Date().toISOString(),
      },
    ];

    return new Response(JSON.stringify({
      success: true,
      data: signals,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Wallet API implementations
  private async getBalance(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');
    
    // Mock balance data
    const balance = {
      address,
      balances: [
        { symbol: 'ETH', amount: '2.5', value_usd: 5000 },
        { symbol: 'USDT', amount: '10000', value_usd: 10000 },
        { symbol: 'BTC', amount: '0.1', value_usd: 4500 },
      ],
      total_value_usd: 19500,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify({
      success: true,
      data: balance,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private async getTransactions(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    // Mock transaction data
    const transactions = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      hash: '0x' + crypto.randomUUID().replace(/-/g, ''),
      from: '0x' + crypto.randomUUID().replace(/-/g, '').substring(0, 40),
      to: address,
      value: (Math.random() * 10).toFixed(4),
      symbol: 'ETH',
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      status: 'confirmed',
    }));

    return new Response(JSON.stringify({
      success: true,
      data: transactions,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private async createTransaction(request: Request): Promise<Response> {
    const body = await request.json();
    
    // Validate transaction
    if (!body.to || !body.amount) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: to, amount',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Mock transaction creation
    const transaction = {
      hash: '0x' + crypto.randomUUID().replace(/-/g, ''),
      from: body.from,
      to: body.to,
      amount: body.amount,
      symbol: body.symbol || 'ETH',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private async getWalletAddress(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // Mock wallet address
    const address = '0x' + crypto.randomUUID().replace(/-/g, '').substring(0, 40);

    return new Response(JSON.stringify({
      success: true,
      data: { address, userId },
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Security API implementations
  private async authenticate(request: Request): Promise<Response> {
    const body = await request.json();
    
    if (!body.signature || !body.message) {
      return new Response(JSON.stringify({
        error: 'Missing signature or message',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Mock authentication
    const token = 'jwt.' + btoa(JSON.stringify({ 
      address: body.address, 
      exp: Date.now() + 3600000 
    }));

    return new Response(JSON.stringify({
      success: true,
      data: { token, expiresAt: new Date(Date.now() + 3600000).toISOString() },
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private async getThreatIntelligence(request: Request): Promise<Response> {
    // Mock threat intelligence data
    const threats = [
      {
        type: 'malicious_address',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        risk_score: 0.9,
        description: 'Known phishing address',
        timestamp: new Date().toISOString(),
      },
    ];

    return new Response(JSON.stringify({
      success: true,
      data: threats,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private async getSecurityIncidents(request: Request): Promise<Response> {
    // Mock security incidents
    const incidents = [
      {
        id: crypto.randomUUID(),
        type: 'suspicious_login',
        severity: 'medium',
        description: 'Login from unusual location',
        ip_address: '192.168.1.100',
        timestamp: new Date().toISOString(),
        status: 'resolved',
      },
    ];

    return new Response(JSON.stringify({
      success: true,
      data: incidents,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Portfolio API implementations
  private async getPositions(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // Mock positions
    const positions = [
      {
        symbol: 'BTC/USDT',
        amount: 0.5,
        avg_price: 44000,
        current_price: 45000,
        unrealized_pnl: 500,
        pnl_percent: 2.27,
      },
      {
        symbol: 'ETH/USDT',
        amount: 10,
        avg_price: 2000,
        current_price: 2100,
        unrealized_pnl: 1000,
        pnl_percent: 5.0,
      },
    ];

    return new Response(JSON.stringify({
      success: true,
      data: positions,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private async getPerformance(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const period = url.searchParams.get('period') || '7d';
    
    // Mock performance data
    const performance = {
      total_return: 15.5,
      total_return_percent: 12.3,
      sharpe_ratio: 1.8,
      max_drawdown: -5.2,
      win_rate: 0.65,
      profit_factor: 2.1,
      period,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify({
      success: true,
      data: performance,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private async getRiskMetrics(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // Mock risk metrics
    const risk = {
      var_95: -1250, // Value at Risk (95%)
      cvar_95: -1800, // Conditional Value at Risk
      beta: 1.2,
      volatility: 0.18,
      correlation_btc: 0.85,
      leverage_ratio: 2.5,
      risk_score: 0.7,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify({
      success: true,
      data: risk,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Rate limiting
  private async checkRateLimit(request: Request): Promise<{ allowed: boolean; retryAfter?: number }> {
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = `rate_limit:${clientIP}`;
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    try {
      const current = await this.rateLimitKV.get(key);
      const now = Date.now();
      
      if (!current) {
        await this.rateLimitKV.put(key, JSON.stringify({
          count: 1,
          windowStart: now,
        }), { expirationTtl: 60 });
        return { allowed: true };
      }

      const data = JSON.parse(current);
      
      if (now - data.windowStart > windowMs) {
        await this.rateLimitKV.put(key, JSON.stringify({
          count: 1,
          windowStart: now,
        }), { expirationTtl: 60 });
        return { allowed: true };
      }

      if (data.count >= maxRequests) {
        const retryAfter = Math.ceil((data.windowStart + windowMs - now) / 1000);
        return { allowed: false, retryAfter };
      }

      await this.rateLimitKV.put(key, JSON.stringify({
        count: data.count + 1,
        windowStart: data.windowStart,
      }), { expirationTtl: 60 });

      return { allowed: true };
    } catch (error) {
      // If rate limiting fails, allow the request
      return { allowed: true };
    }
  }

  private getCorsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get('Origin');
    const allowedOrigins = ['http://localhost:3000', 'https://ailydian.com'];
    
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };

    if (origin && allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return headers;
  }

  private getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    };
  }
}
