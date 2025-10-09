// ========================================
// HEPSIBURADA CONNECTOR
// Official Seller API Integration
// White-Hat: Resmi API kullanımı, TOS compliant
// ========================================

import type {
  IConnector,
  ConnectorManifest,
  ActionContext,
  ActionResult,
  Capability,
} from '@lydian/app-sdk';
import { secureFetch, rateLimiterManager, circuitBreakerManager } from '@lydian/connectors-core';
import { z } from 'zod';
import manifestConfig from './config.json';

/**
 * Hepsiburada API Base URL
 */
const HEPSIBURADA_API_BASE = 'https://mpop.hepsiburada.com/product/api';

/**
 * Hepsiburada Connector
 * Implements official Merchant API for product management, orders, shipping
 */
export class HepsiburadaConnector implements IConnector {
  private apiKey: string = '';
  private apiSecret: string = '';
  private merchantId: string = '';
  private initialized: boolean = false;

  /**
   * Get connector manifest
   */
  getManifest(): ConnectorManifest {
    return {
      ...manifestConfig,
      auth: {
        strategy: 'api_key',
        config: {
          headerName: 'Authorization',
          format: 'Bearer {apiKey}',
        },
      },
      capabilities: this.getCapabilities(),
    } as ConnectorManifest;
  }

  /**
   * Define capabilities (actions)
   */
  private getCapabilities(): Capability[] {
    return [
      {
        id: 'product.sync',
        name: 'Sync Products',
        description: 'Sync product catalog to Hepsiburada',
        category: 'commerce',
        requiredScopes: ['hepsiburada:catalog:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          products: z.array(z.any()),
        }),
        outputSchema: z.object({
          synced: z.number(),
          failed: z.number(),
          details: z.array(z.any()).optional(),
        }),
      },
      {
        id: 'product.list',
        name: 'List Products',
        description: 'Get product list from Hepsiburada',
        category: 'commerce',
        requiredScopes: ['hepsiburada:catalog:read'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          offset: z.number().int().nonnegative().default(0),
          limit: z.number().int().positive().max(100).default(50),
        }),
        outputSchema: z.object({
          products: z.array(z.any()),
          total: z.number(),
        }),
      },
      {
        id: 'order.list',
        name: 'List Orders',
        description: 'Get orders from Hepsiburada',
        category: 'commerce',
        requiredScopes: ['hepsiburada:orders:read'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          beginDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          offset: z.number().int().nonnegative().default(0),
          limit: z.number().int().positive().max(200).default(50),
        }),
        outputSchema: z.object({
          orders: z.array(z.any()),
          total: z.number(),
        }),
      },
      {
        id: 'shipping.update',
        name: 'Update Shipping',
        description: 'Update shipment tracking info',
        category: 'commerce',
        requiredScopes: ['hepsiburada:shipping:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          packageNumber: z.string(),
          trackingNumber: z.string(),
          shippingCompany: z.string(),
        }),
        outputSchema: z.object({
          success: z.boolean(),
          packageNumber: z.string(),
        }),
      },
    ];
  }

  /**
   * Initialize connector
   */
  async initialize(credentials: Record<string, any>): Promise<void> {
    console.log('[Hepsiburada] Initializing connector...');

    // Extract credentials
    this.apiKey = credentials.HEPSIBURADA_API_KEY || '';
    this.apiSecret = credentials.HEPSIBURADA_API_SECRET || '';
    this.merchantId = credentials.HEPSIBURADA_MERCHANT_ID || '';

    if (!this.apiKey || !this.apiSecret || !this.merchantId) {
      throw new Error('Missing Hepsiburada credentials (API_KEY, API_SECRET, MERCHANT_ID)');
    }

    // Setup rate limiter (8 rps as per docs)
    rateLimiterManager.createLimiter('hepsiburada', 8, 1000, 16);

    // Setup circuit breaker
    circuitBreakerManager.createBreaker('hepsiburada', {
      failureThreshold: 5,
      resetTimeout: 60000,
      successThreshold: 2,
      monitoringPeriod: 10000,
    });

    this.initialized = true;
    console.log('[Hepsiburada] ✅ Connector initialized');
  }

  /**
   * Execute action
   */
  async executeAction(context: ActionContext): Promise<ActionResult> {
    if (!this.initialized) {
      return {
        success: false,
        error: {
          code: 'NOT_INITIALIZED',
          message: 'Connector not initialized',
        },
      };
    }

    const { action, payload } = context;

    // Route to appropriate handler
    switch (action) {
      case 'product.sync':
        return await this.syncProducts(payload);
      case 'product.list':
        return await this.listProducts(payload);
      case 'order.list':
        return await this.listOrders(payload);
      case 'shipping.update':
        return await this.updateShipping(payload);
      default:
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ACTION',
            message: `Unknown action: ${action}`,
          },
        };
    }
  }

  /**
   * Sync products to Hepsiburada
   */
  private async syncProducts(payload: any): Promise<ActionResult> {
    console.log('[Hepsiburada] Syncing products:', payload.products.length);

    const allowed = await rateLimiterManager.acquire('hepsiburada');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('hepsiburada', async () => {
        const response = await secureFetch(`${HEPSIBURADA_API_BASE}/products/import`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'User-Agent': 'Lydian-SDK/1.0',
          },
          body: { products: payload.products },
        });

        if (!response.success) {
          throw new Error(response.error?.message || 'API call failed');
        }

        return response.data;
      });

      return {
        success: true,
        data: {
          synced: result.successCount || payload.products.length,
          failed: result.failedCount || 0,
          trackingId: result.trackingId,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'SYNC_FAILED', message: error.message },
      };
    }
  }

  /**
   * List products from Hepsiburada
   */
  private async listProducts(payload: any): Promise<ActionResult> {
    console.log('[Hepsiburada] Listing products (offset:', payload.offset, ')');

    const allowed = await rateLimiterManager.acquire('hepsiburada');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('hepsiburada', async () => {
        const response = await secureFetch(
          `${HEPSIBURADA_API_BASE}/products?offset=${payload.offset}&limit=${payload.limit}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          }
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'API call failed');
        }

        return response.data;
      });

      return {
        success: true,
        data: {
          products: result.listings || [],
          total: result.totalCount || 0,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'LIST_FAILED', message: error.message },
      };
    }
  }

  /**
   * List orders from Hepsiburada
   */
  private async listOrders(payload: any): Promise<ActionResult> {
    console.log('[Hepsiburada] Listing orders');

    const allowed = await rateLimiterManager.acquire('hepsiburada');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('hepsiburada', async () => {
        const params = new URLSearchParams({
          offset: payload.offset.toString(),
          limit: payload.limit.toString(),
        });

        if (payload.beginDate) params.append('beginDate', payload.beginDate);
        if (payload.endDate) params.append('endDate', payload.endDate);

        const response = await secureFetch(
          `${HEPSIBURADA_API_BASE}/orders?${params}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          }
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'API call failed');
        }

        return response.data;
      });

      return {
        success: true,
        data: {
          orders: result.items || [],
          total: result.totalCount || 0,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'LIST_ORDERS_FAILED', message: error.message },
      };
    }
  }

  /**
   * Update shipping info
   */
  private async updateShipping(payload: any): Promise<ActionResult> {
    console.log('[Hepsiburada] Updating shipping:', payload.packageNumber);

    const allowed = await rateLimiterManager.acquire('hepsiburada');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('hepsiburada', async () => {
        const response = await secureFetch(
          `${HEPSIBURADA_API_BASE}/shipping/update`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: {
              packageNumber: payload.packageNumber,
              trackingNumber: payload.trackingNumber,
              shippingCompany: payload.shippingCompany,
            },
          }
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'API call failed');
        }

        return response.data;
      });

      return {
        success: true,
        data: {
          success: true,
          packageNumber: payload.packageNumber,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'SHIPPING_UPDATE_FAILED', message: error.message },
      };
    }
  }

  /**
   * Get Authorization header
   */
  private getAuthHeader(): string {
    return `Bearer ${this.apiKey}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    if (!this.initialized) {
      return { healthy: false, message: 'Not initialized' };
    }

    try {
      const response = await secureFetch(
        `${HEPSIBURADA_API_BASE}/products?offset=0&limit=1`,
        {
          method: 'GET',
          headers: {
            Authorization: this.getAuthHeader(),
          },
          timeout: 5000,
          retries: 1,
        }
      );

      return {
        healthy: response.success,
        message: response.success ? 'OK' : response.error?.message,
      };
    } catch (error: any) {
      return { healthy: false, message: error.message };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[Hepsiburada] Shutting down connector...');
    this.initialized = false;
  }
}
