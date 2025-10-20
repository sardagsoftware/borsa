// ========================================
// CONNECTORS CORE TYPES
// Universal Connector Standard (UCS)
// ========================================

/**
 * HTTP Methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Secure Fetch Options
 */
export interface SecureFetchOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

/**
 * Secure Fetch Response
 */
export interface SecureFetchResponse<T = any> {
  success: boolean;
  data?: T;
  statusCode: number;
  headers: Record<string, string>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    requestId: string;
    duration: number;
    retries: number;
  };
}

/**
 * Rate Limiter Token Bucket
 */
export interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number;
}

/**
 * Circuit Breaker State
 */
export type CircuitState = 'closed' | 'open' | 'half_open';

/**
 * Circuit Breaker Config
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;      // Failures before opening
  resetTimeout: number;           // ms to wait before half-open
  successThreshold: number;       // Successes in half-open before closing
  monitoringPeriod: number;       // ms to track failures
}

/**
 * Idempotency Key Generator
 */
export type IdempotencyKeyGenerator = (payload: any, resource: string) => string;
