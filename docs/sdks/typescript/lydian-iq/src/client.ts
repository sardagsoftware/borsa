/**
 * LyDian IQ SDK
 * TypeScript/JavaScript SDK for LyDian IQ API
 *
 * @packageDocumentation
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { components } from './types';

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
export interface LydianIQConfig {
  /** Base URL for the API (default: https://api.lydian.com/v1/lydian-iq) */
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

type Signal = components['schemas']['Signal'];
type SignalCreate = components['schemas']['SignalCreate'];
type Indicator = components['schemas']['Indicator'];
type KnowledgeGraphNode = components['schemas']['KnowledgeGraphNode'];
type KnowledgeGraphNodeCreate = components['schemas']['KnowledgeGraphNodeCreate'];
type KnowledgeGraphEdge = components['schemas']['KnowledgeGraphEdge'];
type KnowledgeGraphEdgeCreate = components['schemas']['KnowledgeGraphEdgeCreate'];
type Insight = components['schemas']['Insight'];

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * LyDian IQ API Client
 */
export class LydianIQClient {
  private axios: AxiosInstance;
  private config: LydianIQConfig;

  constructor(config: LydianIQConfig) {
    this.config = {
      baseUrl: 'https://api.lydian.com/v1/lydian-iq',
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

  // ==================== Signals ====================

  /**
   * Ingest a signal or event
   */
  async ingestSignal(signal: SignalCreate, idempotencyKey?: string): Promise<Signal> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await this.axios.post<Signal>('/signals', signal, { headers });
    return response.data;
  }

  /**
   * List signals with pagination
   */
  async listSignals(params?: {
    cursor?: string;
    limit?: number;
    signalType?: string;
  }): Promise<PaginatedResponse<Signal>> {
    const response = await this.axios.get<{ data: Signal[] }>('/signals', { params });
    const linkHeader = response.headers['link'] || '';
    const nextMatch = linkHeader.match(/<[^>]*[?&]cursor=([^&>]+)[^>]*>;\s*rel="next"/);
    const nextCursor = nextMatch ? decodeURIComponent(nextMatch[1]) : undefined;

    return {
      data: response.data.data,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  // ==================== Indicators ====================

  /**
   * Get dashboard indicators
   */
  async getIndicators(): Promise<Indicator[]> {
    const response = await this.axios.get<{ data: Indicator[] }>('/indicators');
    return response.data.data;
  }

  // ==================== Knowledge Graph ====================

  /**
   * Create a knowledge graph node
   */
  async createKnowledgeGraphNode(
    node: KnowledgeGraphNodeCreate,
    idempotencyKey?: string
  ): Promise<KnowledgeGraphNode> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await this.axios.post<KnowledgeGraphNode>('/knowledge-graph/nodes', node, {
      headers,
    });
    return response.data;
  }

  /**
   * Query knowledge graph nodes with pagination
   */
  async queryKnowledgeGraphNodes(params?: {
    cursor?: string;
    limit?: number;
    nodeType?: string;
  }): Promise<PaginatedResponse<KnowledgeGraphNode>> {
    const response = await this.axios.get<{ data: KnowledgeGraphNode[] }>(
      '/knowledge-graph/nodes',
      { params }
    );
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
   * Create a knowledge graph edge (relationship)
   */
  async createKnowledgeGraphEdge(
    edge: KnowledgeGraphEdgeCreate,
    idempotencyKey?: string
  ): Promise<KnowledgeGraphEdge> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await this.axios.post<KnowledgeGraphEdge>('/knowledge-graph/edges', edge, {
      headers,
    });
    return response.data;
  }

  /**
   * Query knowledge graph edges with pagination
   */
  async queryKnowledgeGraphEdges(params?: {
    cursor?: string;
    limit?: number;
    edgeType?: string;
  }): Promise<PaginatedResponse<KnowledgeGraphEdge>> {
    const response = await this.axios.get<{ data: KnowledgeGraphEdge[] }>(
      '/knowledge-graph/edges',
      { params }
    );
    const linkHeader = response.headers['link'] || '';
    const nextMatch = linkHeader.match(/<[^>]*[?&]cursor=([^&>]+)[^>]*>;\s*rel="next"/);
    const nextCursor = nextMatch ? decodeURIComponent(nextMatch[1]) : undefined;

    return {
      data: response.data.data,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  // ==================== Insights ====================

  /**
   * Get AI-derived insights
   */
  async getInsights(params?: {
    cursor?: string;
    limit?: number;
    insightType?: string;
  }): Promise<PaginatedResponse<Insight>> {
    const response = await this.axios.get<{ data: Insight[] }>('/insights', { params });
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
 * Create a new LyDian IQ client
 */
export function createClient(config: LydianIQConfig): LydianIQClient {
  return new LydianIQClient(config);
}
