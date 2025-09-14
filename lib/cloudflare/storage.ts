import { Env } from '../types/worker';

// Cloudflare R2 Storage Configuration
export class CloudflareR2 {
  private bucket: any; // R2Bucket at runtime
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.bucket = env.R2_BUCKET;
  }

  async uploadFile(key: string, data: ArrayBuffer | string, metadata?: Record<string, string>) {
    try {
      const result = await this.bucket.put(key, data, {
        httpMetadata: {
          contentType: this.getContentType(key),
        },
        customMetadata: metadata,
      });

      return {
        success: true,
        key: result?.key,
        etag: result?.etag,
        size: result?.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async downloadFile(key: string) {
    try {
      const object = await this.bucket.get(key);
      
      if (!object) {
        return { success: false, error: 'File not found' };
      }

      return {
        success: true,
        data: await object.arrayBuffer(),
        metadata: object.customMetadata,
        httpMetadata: object.httpMetadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  async deleteFile(key: string) {
    try {
      await this.bucket.delete(key);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  async listFiles(prefix?: string, limit: number = 100) {
    try {
      const result = await this.bucket.list({
        prefix,
        limit,
      });

      return {
        success: true,
        objects: result.objects.map((obj: any) => ({
          key: obj.key,
          size: obj.size,
          etag: obj.etag,
          uploaded: obj.uploaded,
          metadata: obj.customMetadata,
        })),
        truncated: result.truncated,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'List failed',
      };
    }
  }

  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      'json': 'application/json',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'js': 'application/javascript',
      'css': 'text/css',
      'html': 'text/html',
      'xml': 'application/xml',
      'zip': 'application/zip',
    };
    
    return types[ext || ''] || 'application/octet-stream';
  }
}

// Cloudflare KV Storage
export class CloudflareKV {
  private kv: any; // KVNamespace at runtime

  constructor(kv: any) {
    this.kv = kv;
  }

  async get(key: string): Promise<string | null> {
    return await this.kv.get(key);
  }

  async getWithMetadata(key: string): Promise<{ value: string | null; metadata: any }> {
    return await this.kv.getWithMetadata(key);
  }

  async put(key: string, value: string, options?: { 
    expirationTtl?: number; 
    metadata?: any 
  }): Promise<void> {
    await this.kv.put(key, value, options);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async list(options?: { prefix?: string; limit?: number }): Promise<{ keys: Array<{ name: string; metadata?: any }> }> {
    return await this.kv.list(options);
  }
}

// Cloudflare D1 Database
export class CloudflareD1 {
  private db: any; // D1Database at runtime

  constructor(db: any) {
    this.db = db;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    return await this.db.prepare(sql).bind(...(params || [])).all();
  }

  async execute(sql: string, params?: any[]): Promise<any> {
    return await this.db.prepare(sql).bind(...(params || [])).run();
  }

  async batch(statements: Array<{ sql: string; params?: any[] }>): Promise<any[]> {
    const prepared = statements.map(stmt => 
      this.db.prepare(stmt.sql).bind(...(stmt.params || []))
    );
    return await this.db.batch(prepared);
  }

  // Trading specific queries
  async insertTrade(trade: {
    user_id: string;
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
    price: number;
    timestamp: string;
  }): Promise<any> {
    return await this.execute(`
      INSERT INTO trades (user_id, symbol, side, amount, price, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [trade.user_id, trade.symbol, trade.side, trade.amount, trade.price, trade.timestamp]);
  }

  async getUserTrades(userId: string, limit: number = 100): Promise<any> {
    return await this.query(`
      SELECT * FROM trades 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [userId, limit]);
  }

  async getPortfolio(userId: string): Promise<any> {
    return await this.query(`
      SELECT 
        symbol,
        SUM(CASE WHEN side = 'buy' THEN amount ELSE -amount END) as position,
        AVG(CASE WHEN side = 'buy' THEN price ELSE NULL END) as avg_buy_price,
        COUNT(*) as trade_count
      FROM trades 
      WHERE user_id = ? 
      GROUP BY symbol
      HAVING position != 0
    `, [userId]);
  }
}

// Durable Objects for real-time features (simplified for TypeScript)
export class TradingSession {
  private state: any; // DurableObjectState at runtime
  private env: Env;
  private sessions: Map<string, any> = new Map(); // WebSocket at runtime

  constructor(state: any, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected websocket', { status: 400 });
      }

      // WebSocketPair available at runtime in Cloudflare Workers
      const webSocketPair = (globalThis as any).WebSocketPair?.();
      if (!webSocketPair) {
        return new Response('WebSocket not supported', { status: 400 });
      }

      const [client, server] = Object.values(webSocketPair);
      await this.handleSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      } as any);
    }

    return new Response('Not found', { status: 404 });
  }

  async handleSession(webSocket: any) {
    webSocket.accept();
    
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, webSocket);

    webSocket.addEventListener('message', async (event: any) => {
      try {
        const data = JSON.parse(event.data as string);
        await this.handleMessage(sessionId, data);
      } catch (error) {
        webSocket.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });

    webSocket.addEventListener('close', () => {
      this.sessions.delete(sessionId);
    });

    // Send welcome message
    webSocket.send(JSON.stringify({
      type: 'connected',
      sessionId,
      timestamp: new Date().toISOString(),
    }));
  }

  async handleMessage(sessionId: string, data: any) {
    const webSocket = this.sessions.get(sessionId);
    if (!webSocket) return;

    switch (data.type) {
      case 'subscribe':
        // Subscribe to price feeds
        await this.subscribeToPriceFeed(sessionId, data.symbols);
        break;
        
      case 'trade':
        // Execute trade
        await this.executeTrade(sessionId, data.trade);
        break;
        
      case 'ping':
        // Heartbeat
        webSocket.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
        
      default:
        webSocket.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`,
        }));
    }
  }

  async subscribeToPriceFeed(sessionId: string, symbols: string[]) {
    const webSocket = this.sessions.get(sessionId);
    if (!webSocket) return;

    // Store subscription in durable storage
    const subscriptions = await this.state.storage.get('subscriptions') || {};
    subscriptions[sessionId] = symbols;
    await this.state.storage.put('subscriptions', subscriptions);

    webSocket.send(JSON.stringify({
      type: 'subscribed',
      symbols,
      timestamp: new Date().toISOString(),
    }));

    // Start sending price updates (mock data for now)
    this.startPriceUpdates(sessionId, symbols);
  }

  async executeTrade(sessionId: string, trade: any) {
    const webSocket = this.sessions.get(sessionId);
    if (!webSocket) return;

    // Validate trade
    if (!trade.symbol || !trade.amount || !trade.side) {
      webSocket.send(JSON.stringify({
        type: 'trade_error',
        message: 'Invalid trade parameters',
      }));
      return;
    }

    // Mock trade execution
    const executedTrade = {
      id: crypto.randomUUID(),
      symbol: trade.symbol,
      side: trade.side,
      amount: trade.amount,
      price: Math.random() * 100, // Mock price
      timestamp: new Date().toISOString(),
      status: 'filled',
    };

    // Broadcast to all sessions
    this.broadcast({
      type: 'trade_executed',
      trade: executedTrade,
    });
  }

  private startPriceUpdates(sessionId: string, symbols: string[]) {
    // Mock price updates every 1 second
    const interval = setInterval(() => {
      const webSocket = this.sessions.get(sessionId);
      if (!webSocket) {
        clearInterval(interval);
        return;
      }

      const priceUpdates = symbols.map(symbol => ({
        symbol,
        price: Math.random() * 100,
        change: (Math.random() - 0.5) * 10,
        timestamp: new Date().toISOString(),
      }));

      webSocket.send(JSON.stringify({
        type: 'price_update',
        prices: priceUpdates,
      }));
    }, 1000);
  }

  private broadcast(message: any) {
    this.sessions.forEach((webSocket) => {
      webSocket.send(JSON.stringify(message));
    });
  }
}
