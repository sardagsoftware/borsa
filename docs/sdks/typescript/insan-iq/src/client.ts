/**
 * LyDian İnsan IQ SDK
 * TypeScript/JavaScript SDK for İnsan IQ API
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
export interface InsanIQConfig {
  /** Base URL for the API (default: https://api.lydian.com/v1/insan-iq) */
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

type Persona = components['schemas']['Persona'];
type PersonaCreate = components['schemas']['PersonaCreate'];
type Skill = components['schemas']['Skill'];
type SkillCreate = components['schemas']['SkillCreate'];
type Assistant = components['schemas']['Assistant'];
type AssistantCreate = components['schemas']['AssistantCreate'];
type Session = components['schemas']['Session'];
type SessionCreate = components['schemas']['SessionCreate'];
type AssistantState = components['schemas']['AssistantState'];

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * İnsan IQ API Client
 */
export class InsanIQClient {
  private axios: AxiosInstance;
  private config: InsanIQConfig;

  constructor(config: InsanIQConfig) {
    this.config = {
      baseUrl: 'https://api.lydian.com/v1/insan-iq',
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

  // ==================== Personas ====================

  /**
   * Create a new persona
   */
  async createPersona(persona: PersonaCreate, idempotencyKey?: string): Promise<Persona> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await this.axios.post<Persona>('/personas', persona, { headers });
    return response.data;
  }

  /**
   * List personas with pagination
   */
  async listPersonas(params?: {
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedResponse<Persona>> {
    const response = await this.axios.get<{ data: Persona[] }>('/personas', { params });
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
   * Get persona by ID
   */
  async getPersona(personaId: string): Promise<Persona> {
    const response = await this.axios.get<Persona>(`/personas/${personaId}`);
    return response.data;
  }

  // ==================== Skills ====================

  /**
   * Publish a new skill to the marketplace
   */
  async publishSkill(skill: SkillCreate, idempotencyKey?: string): Promise<Skill> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await this.axios.post<Skill>('/skills', skill, { headers });
    return response.data;
  }

  /**
   * List skills in the marketplace with pagination
   */
  async listSkills(params?: {
    cursor?: string;
    limit?: number;
    category?: string;
  }): Promise<PaginatedResponse<Skill>> {
    const response = await this.axios.get<{ data: Skill[] }>('/skills', { params });
    const linkHeader = response.headers['link'] || '';
    const nextMatch = linkHeader.match(/<[^>]*[?&]cursor=([^&>]+)[^>]*>;\s*rel="next"/);
    const nextCursor = nextMatch ? decodeURIComponent(nextMatch[1]) : undefined;

    return {
      data: response.data.data,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  // ==================== Assistants ====================

  /**
   * Create a new AI assistant
   */
  async createAssistant(assistant: AssistantCreate, idempotencyKey?: string): Promise<Assistant> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await this.axios.post<Assistant>('/assistants', assistant, { headers });
    return response.data;
  }

  /**
   * List assistants with pagination
   */
  async listAssistants(params?: {
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedResponse<Assistant>> {
    const response = await this.axios.get<{ data: Assistant[] }>('/assistants', { params });
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
   * Get assistant by ID
   */
  async getAssistant(assistantId: string): Promise<Assistant> {
    const response = await this.axios.get<Assistant>(`/assistants/${assistantId}`);
    return response.data;
  }

  // ==================== Sessions ====================

  /**
   * Create a new session for an assistant
   */
  async createSession(
    assistantId: string,
    session: SessionCreate,
    idempotencyKey?: string
  ): Promise<Session> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await this.axios.post<Session>(
      `/assistants/${assistantId}/sessions`,
      session,
      { headers }
    );
    return response.data;
  }

  /**
   * List sessions for an assistant with pagination
   */
  async listSessions(
    assistantId: string,
    params?: {
      cursor?: string;
      limit?: number;
    }
  ): Promise<PaginatedResponse<Session>> {
    const response = await this.axios.get<{ data: Session[] }>(
      `/assistants/${assistantId}/sessions`,
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
   * Get assistant state
   */
  async getAssistantState(assistantId: string): Promise<AssistantState> {
    const response = await this.axios.get<AssistantState>(`/assistants/${assistantId}/state`);
    return response.data;
  }
}

/**
 * Create a new İnsan IQ client
 */
export function createClient(config: InsanIQConfig): InsanIQClient {
  return new InsanIQClient(config);
}
