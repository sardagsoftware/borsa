// Cloudflare Worker Types - simplified version without runtime types
export interface Env {
  // Environment Variables
  JWT_SECRET: string;
  BINANCE_API_KEY: string;
  BINANCE_API_SECRET: string;
  OPENAI_API_KEY: string;
  SIGSTORE_OIDC_TOKEN: string;
  
  // Storage bindings (will be available at runtime)
  R2_BUCKET: any; // R2Bucket at runtime
  TRADING_KV: any; // KVNamespace at runtime
  SESSION_KV: any; // KVNamespace at runtime
  TRADING_DB: any; // D1Database at runtime
  TRADING_SESSION: any; // DurableObjectNamespace at runtime
}

// Trading Types
export interface Trade {
  id?: string;
  user_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: string;
  status: 'pending' | 'filled' | 'cancelled';
}

export interface Portfolio {
  symbol: string;
  position: number;
  avg_buy_price: number;
  trade_count: number;
  unrealized_pnl?: number;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'trade' | 'ping' | 'pong';
  data?: any;
  timestamp?: string;
}

// R2 Storage Types
export interface R2UploadResult {
  success: boolean;
  key?: string;
  etag?: string;
  size?: number;
  error?: string;
}

export interface R2DownloadResult {
  success: boolean;
  data?: ArrayBuffer;
  metadata?: Record<string, string>;
  httpMetadata?: any; // R2HTTPMetadata at runtime
  error?: string;
}

export interface R2ListResult {
  success: boolean;
  objects?: Array<{
    key: string;
    size: number;
    etag: string;
    uploaded: Date;
    metadata?: Record<string, string>;
  }>;
  truncated?: boolean;
  error?: string;
}

// Security Types
export interface SecurityEvent {
  id: string;
  type: 'login' | 'trade' | 'withdrawal' | 'suspicious_activity';
  user_id: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (request: Request) => string;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Worker Context
export interface WorkerContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}
