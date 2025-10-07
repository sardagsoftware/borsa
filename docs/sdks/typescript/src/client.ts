import { LydianConfig, OAuth2Config, ErrorResponse } from './types';
import { createHmacSignature, generateIdempotencyKey } from './utils';

/**
 * Base HTTP client with retry logic and authentication
 */
export class LydianClient {
  private apiKey?: string;
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;
  private accessToken?: string;

  constructor(config: LydianConfig = {}) {
    this.apiKey = config.apiKey || process.env.LYDIAN_API_KEY;
    this.baseUrl = config.baseUrl || process.env.LYDIAN_BASE_URL || 'https://api.lydian.ai/v1';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Authenticate with OAuth2 client credentials
   */
  async authenticateOAuth2(config: OAuth2Config): Promise<void> {
    const tokenUrl = config.tokenUrl || `${this.baseUrl}/oauth/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new LydianError('OAuth2 authentication failed', response.status);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
  }

  /**
   * Make HTTP request with retry logic
   */
  async request<T>(
    method: string,
    path: string,
    options: {
      body?: any;
      query?: Record<string, any>;
      headers?: Record<string, string>;
      idempotencyKey?: string;
    } = {}
  ): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const headers = this.buildHeaders(options.headers, options.idempotencyKey);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new LydianError(
            errorData.error?.message || `HTTP ${response.status}`,
            response.status,
            errorData.error?.code,
            errorData.error?.details
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        // Don't retry client errors (4xx)
        if (error instanceof LydianError && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        // Wait before retrying
        if (attempt < this.retryAttempts - 1) {
          await this.sleep(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  private buildUrl(path: string, query?: Record<string, any>): string {
    const url = new URL(path, this.baseUrl);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private buildHeaders(
    customHeaders?: Record<string, string>,
    idempotencyKey?: string
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': '@lydian/sdk/1.0.0',
      ...customHeaders,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return headers;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom error class for Lydian API errors
 */
export class LydianError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'LydianError';
  }
}
