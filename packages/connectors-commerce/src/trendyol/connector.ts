// ========================================
// TRENDYOL CONNECTOR
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
 * Trendyol API Base URL
 */
const TRENDYOL_API_BASE = 'https://api.trendyol.com/sapigw';

/**
 * Trendyol Connector
 * Implements official Seller API for product management, orders, inventory
 */
export class TrendyolConnector implements IConnector {
  private apiKey: string = '';
  private apiSecret: string = '';
  private supplierId: string = '';
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
          format: 'Basic {base64(apiKey:apiSecret)}',
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
        description: 'Sync product catalog to Trendyol',
        category: 'commerce',
        requiredScopes: ['trendyol:catalog:write'],
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
        description: 'Get product list from Trendyol',
        category: 'commerce',
        requiredScopes: ['trendyol:catalog:read'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(100).default(50),
        }),
        outputSchema: z.object({
          products: z.array(z.any()),
          total: z.number(),
          page: z.number(),
        }),
      },
      {
        id: 'order.list',
        name: 'List Orders',
        description: 'Get orders from Trendyol',
        category: 'commerce',
        requiredScopes: ['trendyol:orders:read'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(200).default(50),
        }),
        outputSchema: z.object({
          orders: z.array(z.any()),
          total: z.number(),
          page: z.number(),
        }),
      },
      {
        id: 'inventory.update',
        name: 'Update Inventory',
        description: 'Update stock and price',
        category: 'commerce',
        requiredScopes: ['trendyol:inventory:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          items: z.array(
            z.object({
              barcode: z.string(),
              quantity: z.number().int().nonnegative(),
              salePrice: z.number().positive().optional(),
              listPrice: z.number().positive().optional(),
            })
          ),
        }),
        outputSchema: z.object({
          updated: z.number(),
          failed: z.number(),
        }),
      },
    ];
  }

  /**
   * Initialize connector
   */
  async initialize(credentials: Record<string, any>): Promise<void> {
    console.log('[Trendyol] Initializing connector...');

    // Extract credentials
    this.apiKey = credentials.TRENDYOL_API_KEY || '';
    this.apiSecret = credentials.TRENDYOL_API_SECRET || '';
    this.supplierId = credentials.TRENDYOL_SUPPLIER_ID || '';

    if (!this.apiKey || !this.apiSecret || !this.supplierId) {
      throw new Error('Missing Trendyol credentials (API_KEY, API_SECRET, SUPPLIER_ID)');
    }

    // Setup rate limiter
    rateLimiterManager.createLimiter('trendyol', 10, 1000, 20);

    // Setup circuit breaker
    circuitBreakerManager.createBreaker('trendyol', {
      failureThreshold: 5,
      resetTimeout: 60000,
      successThreshold: 2,
      monitoringPeriod: 10000,
    });

    this.initialized = true;
    console.log('[Trendyol] ✅ Connector initialized');
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
      case 'inventory.update':
        return await this.updateInventory(payload);
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
   * Sync products to Trendyol
   */
  private async syncProducts(payload: any): Promise<ActionResult> {
    console.log('[Trendyol] Syncing products:', payload.products.length);

    // Check rate limit
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded',
        },
      };
    }

    // Execute with circuit breaker
    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        // Call Trendyol API
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products`, {
          method: 'POST',
          headers: {
            Authorization: this.getAuthHeader(),
            'User-Agent': 'Lydian-SDK/1.0',
          },
          body: { items: payload.products },
        });

        if (!response.success) {
          throw new Error(response.error?.message || 'API call failed');
        }

        return response.data;
      });

      return {
        success: true,
        data: {
          synced: result.batchRequestId ? payload.products.length : 0,
          failed: 0,
          batchRequestId: result.batchRequestId,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * List products from Trendyol
   */
  private async listProducts(payload: any): Promise<ActionResult> {
    console.log('[Trendyol] Listing products (page:', payload.page, ')');

    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(
          `${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products?page=${payload.page}&size=${payload.size}`,
          {
            method: 'GET',
            headers: {
              Authorization: this.getAuthHeader(),
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
          products: result.content || [],
          total: result.totalElements || 0,
          page: result.page || payload.page,
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
   * List orders from Trendyol
   */
  private async listOrders(payload: any): Promise<ActionResult> {
    console.log('[Trendyol] Listing orders');

    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const params = new URLSearchParams({
          page: payload.page.toString(),
          size: payload.size.toString(),
        });

        if (payload.startDate) params.append('startDate', payload.startDate);
        if (payload.endDate) params.append('endDate', payload.endDate);

        const response = await secureFetch(
          `${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/orders?${params}`,
          {
            method: 'GET',
            headers: {
              Authorization: this.getAuthHeader(),
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
          orders: result.content || [],
          total: result.totalElements || 0,
          page: result.page || payload.page,
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
   * Update inventory (stock & price)
   */
  private async updateInventory(payload: any): Promise<ActionResult> {
    console.log('[Trendyol] Updating inventory:', payload.items.length, 'items');

    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(
          `${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products/price-and-inventory`,
          {
            method: 'POST',
            headers: {
              Authorization: this.getAuthHeader(),
            },
            body: { items: payload.items },
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
          updated: payload.items.length,
          failed: 0,
          batchRequestId: result.batchRequestId,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'INVENTORY_UPDATE_FAILED', message: error.message },
      };
    }
  }

  /**
   * Get Authorization header (Basic Auth)
   */
  private getAuthHeader(): string {
    const credentials = `${this.apiKey}:${this.apiSecret}`;
    const encoded = Buffer.from(credentials).toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    if (!this.initialized) {
      return { healthy: false, message: 'Not initialized' };
    }

    try {
      // Simple ping to Trendyol API
      const response = await secureFetch(
        `${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products?page=0&size=1`,
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
    console.log('[Trendyol] Shutting down connector...');
    this.initialized = false;
  }
}
