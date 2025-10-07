/**
 * HTTP Client
 * Handles all API requests to LyDian platform
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { configManager } from './config';
import { ApiResponse, ApiError, ExitCode } from '../types';

export class LydianClient {
  private client: AxiosInstance;
  private baseURL: string = '';
  private authToken: string = '';
  private apiKey: string = '';

  constructor() {
    this.client = axios.create();
    this.setupInterceptors();
  }

  /**
   * Initialize client with current profile configuration
   */
  async init(): Promise<void> {
    const { config } = await configManager.getCurrentProfile();
    this.baseURL = config.endpoint;

    if (config.auth_method === 'oauth2' && config.access_token) {
      this.authToken = config.access_token;
    } else if (config.auth_method === 'apikey' && config.apikey) {
      this.apiKey = config.apikey;
    }

    this.client.defaults.baseURL = this.baseURL;
    this.client.defaults.timeout = (await configManager.getSettings()).timeout;
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add authentication
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        } else if (this.apiKey) {
          config.headers['X-API-Key'] = this.apiKey;
        }

        // Add default headers
        config.headers['Content-Type'] = 'application/json';
        config.headers['User-Agent'] = 'lydian-cli/1.0.0';

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          const refreshed = await this.refreshToken();
          if (refreshed && error.config) {
            // Retry original request
            return this.client.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh OAuth2 token
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const { config } = await configManager.getCurrentProfile();

      if (config.auth_method !== 'oauth2' || !config.refresh_token) {
        return false;
      }

      const response = await axios.post(`${this.baseURL}/oauth/token`, {
        grant_type: 'refresh_token',
        refresh_token: config.refresh_token
      });

      const { access_token, refresh_token, expires_in } = response.data;

      // Update config
      await configManager.set('access_token', access_token);
      await configManager.set('refresh_token', refresh_token);
      await configManager.set('token_expires_at', Date.now() + expires_in * 1000);

      this.authToken = access_token;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Make GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Make POST request
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Make PUT request
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Make PATCH request
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Make DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): never {
    const apiError: ApiError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred'
    };

    if (error.response) {
      const data = error.response.data as any;
      apiError.code = data?.error?.code || `HTTP_${error.response.status}`;
      apiError.message = data?.error?.message || error.message;
      apiError.details = data?.error?.details;
      apiError.request_id = data?.request_id;
    } else if (error.request) {
      apiError.code = 'NETWORK_ERROR';
      apiError.message = 'Unable to reach the API server';
    } else {
      apiError.code = 'REQUEST_ERROR';
      apiError.message = error.message;
    }

    throw apiError;
  }

  /**
   * Set API key for authentication
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Set OAuth token for authentication
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Get current base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

export const client = new LydianClient();
