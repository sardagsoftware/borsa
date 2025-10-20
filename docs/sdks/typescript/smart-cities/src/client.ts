/**
 * LyDian Smart Cities SDK
 * TypeScript/JavaScript SDK for Smart Cities API
 *
 * @packageDocumentation
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { components, paths } from './types';

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** OAuth2 access token */
  accessToken?: string;
  /** API Key for X-API-Key header */
  apiKey?: string;
  /** HMAC credentials for signature auth */
  hmac?: {
    secret: string;
    algorithm?: 'HMAC-SHA256';
  };
}

/**
 * SDK Configuration
 */
export interface SmartCitiesConfig {
  /** Base URL for the API (default: https://api.lydian.com/v1/smart-cities) */
  baseUrl?: string;
  /** Authentication configuration */
  auth: AuthConfig;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Enable automatic retries on rate limit (default: true) */
  autoRetry?: boolean;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
}

/**
 * Standardized error from API
 */
export interface LydianError {
  error: {
    code: string;
    message: string;
    details?: Array<{
      path: string;
      issue: string;
    }>;
    correlationId: string;
    timestamp?: string;
  };
}

type City = components['schemas']['City'];
type CityCreate = components['schemas']['CityCreate'];
type Asset = components['schemas']['Asset'];
type AssetCreate = components['schemas']['AssetCreate'];
type CityMetrics = components['schemas']['CityMetrics'];
type Event = components['schemas']['Event'];
type EventCreate = components['schemas']['EventCreate'];
type Alert = components['schemas']['Alert'];
type AlertCreate = components['schemas']['AlertCreate'];

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Smart Cities API Client
 */
export class SmartCitiesClient {
  private axios: AxiosInstance;
  private config: SmartCitiesConfig;

  constructor(config: SmartCitiesConfig) {
    this.config = {
      baseUrl: 'https://api.lydian.com/v1/smart-cities',
      timeout: 30000,
      autoRetry: true,
      maxRetries: 3,
      ...config,
    };

    this.axios = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
    });

    // Add request interceptor for authentication
    this.axios.interceptors.request.use((config) => {
      if (this.config.auth.accessToken) {
        config.headers.Authorization = `Bearer ${this.config.auth.accessToken}`;
      } else if (this.config.auth.apiKey) {
        config.headers['X-API-Key'] = this.config.auth.apiKey;
      } else if (this.config.auth.hmac) {
        const signature = this.generateHmacSignature(config);
        config.headers['X-HMAC-Signature'] = signature.signature;
        config.headers['X-HMAC-Timestamp'] = signature.timestamp;
        config.headers['X-HMAC-Algorithm'] = signature.algorithm;
      }
      return config;
    });

    // Add response interceptor for rate limiting and retries
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 429 && this.config.autoRetry) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
          await this.sleep(retryAfter * 1000);
          return this.axios.request(error.config!);
        }
        throw this.handleError(error);
      }
    );
  }

  /**
   * Generate HMAC signature for request
   */
  private generateHmacSignature(config: AxiosRequestConfig): {
    signature: string;
    timestamp: string;
    algorithm: string;
  } {
    const crypto = require('crypto');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = (config.method || 'GET').toUpperCase();
    const path = config.url || '';
    const bodyHash = config.data
      ? crypto.createHash('sha256').update(JSON.stringify(config.data)).digest('hex')
      : crypto.createHash('sha256').update('').digest('hex');

    const canonical = `${method}\n${path}\n${timestamp}\n${bodyHash}`;
    const signature = crypto
      .createHmac('sha256', this.config.auth.hmac!.secret)
      .update(canonical)
      .digest('hex');

    return {
      signature: `sha256=${signature}`,
      timestamp,
      algorithm: 'HMAC-SHA256',
    };
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): Error {
    if (error.response?.data) {
      const lydianError = error.response.data as LydianError;
      const err = new Error(lydianError.error.message);
      err.name = lydianError.error.code;
      (err as any).correlationId = lydianError.error.correlationId;
      (err as any).details = lydianError.error.details;
      return err;
    }
    return error;
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==================== Cities ====================

  /**
   * Create a new city
   */
  async createCity(city: CityCreate, idempotencyKey?: string): Promise<City> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await this.axios.post<City>('/cities', city, { headers });
    return response.data;
  }

  /**
   * List cities with pagination
   */
  async listCities(params?: {
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedResponse<City>> {
    const response = await this.axios.get<{ data: City[] }>('/cities', { params });
    const linkHeader = response.headers['link'] || '';
    const nextMatch = linkHeader.match(/<[^>]*[?&]cursor=([^&>]+)[^>]*>;\s*rel="next"/);
    const nextCursor = nextMatch ? decodeURIComponent(nextMatch[1]) : undefined;

    return {
      data: response.data.data,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  /**
   * Get city by ID
   */
  async getCity(cityId: string): Promise<City> {
    const response = await this.axios.get<City>(`/cities/${cityId}`);
    return response.data;
  }

  // ==================== Assets ====================

  /**
   * Register a new IoT asset in a city
   */
  async registerAsset(
    cityId: string,
    asset: AssetCreate,
    idempotencyKey?: string
  ): Promise<Asset> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await this.axios.post<Asset>(`/cities/${cityId}/assets`, asset, { headers });
    return response.data;
  }

  /**
   * List assets in a city with pagination
   */
  async listAssets(
    cityId: string,
    params?: {
      cursor?: string;
      limit?: number;
      assetType?: string;
    }
  ): Promise<PaginatedResponse<Asset>> {
    const response = await this.axios.get<{ data: Asset[] }>(`/cities/${cityId}/assets`, {
      params,
    });
    const linkHeader = response.headers['link'] || '';
    const nextMatch = linkHeader.match(/<[^>]*[?&]cursor=([^&>]+)[^>]*>;\s*rel="next"/);
    const nextCursor = nextMatch ? decodeURIComponent(nextMatch[1]) : undefined;

    return {
      data: response.data.data,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  // ==================== Metrics ====================

  /**
   * Get real-time metrics for a city
   */
  async getCityMetrics(cityId: string): Promise<CityMetrics> {
    const response = await this.axios.get<CityMetrics>(`/cities/${cityId}/metrics`);
    return response.data;
  }

  // ==================== Events ====================

  /**
   * Report a city event
   */
  async reportEvent(event: EventCreate, idempotencyKey?: string): Promise<Event> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await this.axios.post<Event>('/events', event, { headers });
    return response.data;
  }

  /**
   * List events with pagination
   */
  async listEvents(params?: {
    cursor?: string;
    limit?: number;
    cityId?: string;
    eventType?: string;
  }): Promise<PaginatedResponse<Event>> {
    const response = await this.axios.get<{ data: Event[] }>('/events', { params });
    const linkHeader = response.headers['link'] || '';
    const nextMatch = linkHeader.match(/<[^>]*[?&]cursor=([^&>]+)[^>]*>;\s*rel="next"/);
    const nextCursor = nextMatch ? decodeURIComponent(nextMatch[1]) : undefined;

    return {
      data: response.data.data,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  // ==================== Alerts ====================

  /**
   * Create an alert
   */
  async createAlert(alert: AlertCreate, idempotencyKey?: string): Promise<Alert> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await this.axios.post<Alert>('/alerts', alert, { headers });
    return response.data;
  }

  /**
   * List alerts with pagination
   */
  async listAlerts(params?: {
    cursor?: string;
    limit?: number;
    cityId?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<PaginatedResponse<Alert>> {
    const response = await this.axios.get<{ data: Alert[] }>('/alerts', { params });
    const linkHeader = response.headers['link'] || '';
    const nextMatch = linkHeader.match(/<[^>]*[?&]cursor=([^&>]+)[^>]*>;\s*rel="next"/);
    const nextCursor = nextMatch ? decodeURIComponent(nextMatch[1]) : undefined;

    return {
      data: response.data.data,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }
}

/**
 * Create a new Smart Cities client
 */
export function createClient(config: SmartCitiesConfig): SmartCitiesClient {
  return new SmartCitiesClient(config);
}
