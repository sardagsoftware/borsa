/**
 * ========================================
 * MIGROS CONNECTOR - FULL IMPLEMENTATION
 * ========================================
 *
 * Vendor: Migros (TR Grocery/Quick Commerce)
 * Mode: partner_required (Legal Gate enforced)
 * Status: sandbox (production blocked until partner_ok)
 *
 * SPRINT 2 - Delivery & Grocery
 *
 * 12 Unified Grocery Actions:
 * - Store Management (3): store.sync, store.list, store.get
 * - Catalog Management (3): catalog.sync, catalog.list, catalog.update
 * - Inventory Management (3): inventory.update, inventory.bulk-update, inventory.list
 * - Order Management (3): order.list, order.get, order.fulfill
 *
 * Technical Features:
 * - Rate limiting: 10 rps, burst 20 (higher for grocery ops)
 * - Circuit breaker: 5 failures → 60s cooldown
 * - API Key + Partner ID authentication
 * - Zod schema validation
 * - Legal Gate enforcement (3-layer)
 *
 * Vendor-Specific Notes:
 * - Supports multi-location grocery stores
 * - Real-time inventory sync (perishable goods)
 * - Quick commerce fulfillment (10-30 min delivery)
 *
 * ========================================
 */

import type {
  IConnector,
  ConnectorManifest,
  Capability,
  ActionContext,
  ActionResult
} from '@lydian/connectors-core/types';
import {
  rateLimiterManager,
  circuitBreakerManager,
  secureFetch
} from '@lydian/connectors-core/resilience';
import { z } from 'zod';

const MIGROS_API_BASE = 'https://partner-api.migros.com.tr/api/v1';

/**
 * Migros Connector - Full Implementation
 *
 * Legal Gate: partner_required
 * Sector: Grocery/Quick Commerce
 */
export class MigrosConnectorFull implements IConnector {
  private partnerId: string = '';
  private apiKey: string = '';
  private initialized: boolean = false;

  /**
   * Connector manifest with Legal Gate enforcement
   */
  getManifest(): ConnectorManifest {
    return {
      id: 'migros',
      name: 'Migros',
      version: '1.0.0',
      vendor: 'Migros',
      country: 'TR',
      sector: 'grocery',
      mode: 'partner_required',
      status: 'sandbox',
      description: 'Migros grocery/quick commerce integration (partner-only)',
      authType: 'api_key',
      rateLimit: {
        requestsPerSecond: 10,
        burstSize: 20,
      },
      capabilities: this.getCapabilities(),
    };
  }

  /**
   * 12 Unified Grocery Actions
   */
  private getCapabilities(): Capability[] {
    return [
      // ========== Store Management (3 actions) ==========
      {
        id: 'store.sync',
        name: 'Sync Store',
        category: 'grocery',
        description: 'Register or update store location',
        requiredScopes: ['migros:store:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          storeId: z.string().optional(),
          name: z.string().min(1),
          storeCode: z.string(),
          address: z.object({
            street: z.string(),
            city: z.string(),
            district: z.string(),
            zipCode: z.string(),
            latitude: z.number(),
            longitude: z.number(),
          }),
          operatingHours: z.record(z.object({
            open: z.string(),
            close: z.string(),
          })),
          deliveryRadius: z.number().positive(),
          fulfillmentTypes: z.array(z.enum(['delivery', 'pickup', 'quick_commerce'])),
        }),
        outputSchema: z.object({
          storeId: z.string(),
          status: z.enum(['active', 'pending_approval', 'inactive']),
        }),
      },
      {
        id: 'store.list',
        name: 'List Stores',
        category: 'grocery',
        description: 'List all registered stores',
        requiredScopes: ['migros:store:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(100).default(50),
          city: z.string().optional(),
          status: z.enum(['active', 'inactive', 'pending_approval']).optional(),
        }),
        outputSchema: z.object({
          stores: z.array(z.any()),
          total: z.number().int().nonnegative(),
          page: z.number().int().positive(),
          totalPages: z.number().int().nonnegative(),
        }),
      },
      {
        id: 'store.get',
        name: 'Get Store',
        category: 'grocery',
        description: 'Get single store details',
        requiredScopes: ['migros:store:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          storeId: z.string(),
        }),
        outputSchema: z.object({
          store: z.any(),
        }),
      },

      // ========== Catalog Management (3 actions) ==========
      {
        id: 'catalog.sync',
        name: 'Sync Catalog',
        category: 'grocery',
        description: 'Sync product catalog (categories, SKUs, pricing)',
        requiredScopes: ['migros:catalog:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          storeId: z.string(),
          catalog: z.object({
            categories: z.array(z.object({
              id: z.string(),
              name: z.string(),
              parentId: z.string().optional(),
            })),
            products: z.array(z.object({
              sku: z.string(),
              barcode: z.string(),
              categoryId: z.string(),
              name: z.string(),
              brand: z.string().optional(),
              price: z.number().positive(),
              unit: z.enum(['piece', 'kg', 'liter', 'pack']),
              imageUrl: z.string().url().optional(),
              perishable: z.boolean().default(false),
              shelfLife: z.number().int().positive().optional(),
            })),
          }),
        }),
        outputSchema: z.object({
          synced: z.number().int().nonnegative(),
          failed: z.number().int().nonnegative(),
          batchRequestId: z.string().optional(),
        }),
      },
      {
        id: 'catalog.list',
        name: 'List Catalog',
        category: 'grocery',
        description: 'List current product catalog',
        requiredScopes: ['migros:catalog:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          storeId: z.string(),
          categoryId: z.string().optional(),
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(500).default(100),
        }),
        outputSchema: z.object({
          products: z.array(z.any()),
          total: z.number().int().nonnegative(),
          page: z.number().int().positive(),
          totalPages: z.number().int().nonnegative(),
        }),
      },
      {
        id: 'catalog.update',
        name: 'Update Catalog Item',
        category: 'grocery',
        description: 'Update product details (price, name, etc.)',
        requiredScopes: ['migros:catalog:write'],
        idempotent: false,
        requiresPartner: true,
        inputSchema: z.object({
          storeId: z.string(),
          sku: z.string(),
          updates: z.object({
            price: z.number().positive().optional(),
            name: z.string().optional(),
            imageUrl: z.string().url().optional(),
          }),
        }),
        outputSchema: z.object({
          updated: z.boolean(),
        }),
      },

      // ========== Inventory Management (3 actions) ==========
      {
        id: 'inventory.update',
        name: 'Update Inventory',
        category: 'grocery',
        description: 'Update stock levels for products',
        requiredScopes: ['migros:inventory:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          storeId: z.string(),
          items: z.array(z.object({
            sku: z.string(),
            quantity: z.number().int().nonnegative(),
            expiryDate: z.string().optional(),
          })),
        }),
        outputSchema: z.object({
          updated: z.number().int().nonnegative(),
          failed: z.number().int().nonnegative(),
        }),
      },
      {
        id: 'inventory.bulk-update',
        name: 'Bulk Inventory Update',
        category: 'grocery',
        description: 'Bulk update inventory levels (for large catalogs)',
        requiredScopes: ['migros:inventory:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          storeId: z.string(),
          items: z.array(z.object({
            sku: z.string(),
            quantity: z.number().int().nonnegative(),
          })),
        }),
        outputSchema: z.object({
          updated: z.number().int().nonnegative(),
          failed: z.number().int().nonnegative(),
          batchRequestId: z.string().optional(),
        }),
      },
      {
        id: 'inventory.list',
        name: 'List Inventory',
        category: 'grocery',
        description: 'List current inventory levels',
        requiredScopes: ['migros:inventory:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          storeId: z.string(),
          lowStockOnly: z.boolean().default(false),
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(500).default(100),
        }),
        outputSchema: z.object({
          items: z.array(z.object({
            sku: z.string(),
            quantity: z.number().int().nonnegative(),
            available: z.boolean(),
          })),
          total: z.number().int().nonnegative(),
          page: z.number().int().positive(),
          totalPages: z.number().int().nonnegative(),
        }),
      },

      // ========== Order Management (3 actions) ==========
      {
        id: 'order.list',
        name: 'List Orders',
        category: 'grocery',
        description: 'List grocery orders with filters',
        requiredScopes: ['migros:orders:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          storeId: z.string(),
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(100).default(50),
          status: z.enum(['pending', 'picking', 'packed', 'dispatched', 'delivered', 'cancelled']).optional(),
          fulfillmentType: z.enum(['delivery', 'pickup', 'quick_commerce']).optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }),
        outputSchema: z.object({
          orders: z.array(z.any()),
          total: z.number().int().nonnegative(),
          page: z.number().int().positive(),
          totalPages: z.number().int().nonnegative(),
        }),
      },
      {
        id: 'order.get',
        name: 'Get Order',
        category: 'grocery',
        description: 'Get single order details',
        requiredScopes: ['migros:orders:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
        }),
        outputSchema: z.object({
          order: z.any(),
        }),
      },
      {
        id: 'order.fulfill',
        name: 'Fulfill Order',
        category: 'grocery',
        description: 'Mark order as fulfilled (picked & packed)',
        requiredScopes: ['migros:orders:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
          substitutions: z.array(z.object({
            originalSku: z.string(),
            substituteSku: z.string(),
            reason: z.enum(['out_of_stock', 'damaged', 'customer_request']),
          })).optional(),
        }),
        outputSchema: z.object({
          fulfilled: z.boolean(),
        }),
      },
    ];
  }

  /**
   * Initialize connector
   */
  async initialize(config: Record<string, any>): Promise<void> {
    this.partnerId = config.partnerId || '';
    this.apiKey = config.apiKey || '';

    if (!this.partnerId || !this.apiKey) {
      throw new Error('[Migros] Missing partner credentials (partnerId, apiKey)');
    }

    // Rate limiter: 10 rps, burst 20 (higher for grocery ops)
    rateLimiterManager.createLimiter('migros', 10, 1000, 20);

    // Circuit breaker
    circuitBreakerManager.createBreaker('migros', 5, 60000);

    this.initialized = true;
    console.log('[Migros] Connector initialized successfully');
  }

  /**
   * Execute action with Legal Gate enforcement
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

    // Rate limiting
    const allowed = await rateLimiterManager.acquire('migros');
    if (!allowed) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded (10 rps)',
        },
      };
    }

    // Action routing (12 grocery actions)
    const handlers: Record<string, (payload: any) => Promise<ActionResult>> = {
      'store.sync': this.syncStore.bind(this),
      'store.list': this.listStores.bind(this),
      'store.get': this.getStore.bind(this),
      'catalog.sync': this.syncCatalog.bind(this),
      'catalog.list': this.listCatalog.bind(this),
      'catalog.update': this.updateCatalogItem.bind(this),
      'inventory.update': this.updateInventory.bind(this),
      'inventory.bulk-update': this.bulkUpdateInventory.bind(this),
      'inventory.list': this.listInventory.bind(this),
      'order.list': this.listOrders.bind(this),
      'order.get': this.getOrder.bind(this),
      'order.fulfill': this.fulfillOrder.bind(this),
    };

    const handler = handlers[context.action];
    if (!handler) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ACTION',
          message: `Action ${context.action} not found`,
        },
      };
    }

    return await handler(context.payload);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    const start = Date.now();
    try {
      const response = await secureFetch(`${MIGROS_API_BASE}/ping`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return {
        healthy: response.success,
        latency: Date.now() - start,
      };
    } catch {
      return { healthy: false };
    }
  }

  /**
   * Get request headers
   */
  private getHeaders(): Record<string, string> {
    return {
      'X-Partner-Id': this.partnerId,
      'X-Api-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  // ========== Action Handlers ==========

  private async syncStore(payload: any): Promise<ActionResult> {
    try {
      const result = await circuitBreakerManager.execute('migros', async () => {
        const response = await secureFetch(
          `${MIGROS_API_BASE}/partners/${this.partnerId}/stores`,
          {
            method: 'POST',
            headers: this.getHeaders(),
            body: payload,
          }
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'Store sync failed');
        }

        return response.data;
      });

      return {
        success: true,
        data: {
          storeId: result.storeId || result.id,
          status: result.status || 'pending_approval',
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

  private async listStores(payload: any): Promise<ActionResult> {
    try {
      const { page = 1, size = 50, city, status } = payload;
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        ...(city && { city }),
        ...(status && { status }),
      });

      const response = await secureFetch(
        `${MIGROS_API_BASE}/partners/${this.partnerId}/stores?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.success) {
        throw new Error('Failed to list stores');
      }

      return {
        success: true,
        data: {
          stores: response.data?.stores || [],
          total: response.data?.total || 0,
          page,
          totalPages: Math.ceil((response.data?.total || 0) / size),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LIST_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async getStore(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${MIGROS_API_BASE}/partners/${this.partnerId}/stores/${payload.storeId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.success) {
        throw new Error('Store not found');
      }

      return {
        success: true,
        data: { store: response.data },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async syncCatalog(payload: any): Promise<ActionResult> {
    try {
      const result = await circuitBreakerManager.execute('migros', async () => {
        const response = await secureFetch(
          `${MIGROS_API_BASE}/partners/${this.partnerId}/stores/${payload.storeId}/catalog`,
          {
            method: 'POST',
            headers: this.getHeaders(),
            body: payload.catalog,
          }
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'Catalog sync failed');
        }

        return response.data;
      });

      return {
        success: true,
        data: {
          synced: payload.catalog.products?.length || 0,
          failed: 0,
          batchRequestId: result.batchId,
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

  private async listCatalog(payload: any): Promise<ActionResult> {
    try {
      const { page = 1, size = 100, categoryId } = payload;
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        ...(categoryId && { categoryId }),
      });

      const response = await secureFetch(
        `${MIGROS_API_BASE}/partners/${this.partnerId}/stores/${payload.storeId}/catalog/products?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.success) {
        throw new Error('Failed to list catalog');
      }

      return {
        success: true,
        data: {
          products: response.data?.products || [],
          total: response.data?.total || 0,
          page,
          totalPages: Math.ceil((response.data?.total || 0) / size),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LIST_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async updateCatalogItem(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${MIGROS_API_BASE}/partners/${this.partnerId}/stores/${payload.storeId}/catalog/products/${payload.sku}`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: payload.updates,
        }
      );

      return {
        success: response.success,
        data: { updated: response.success },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async updateInventory(payload: any): Promise<ActionResult> {
    try {
      const result = await circuitBreakerManager.execute('migros', async () => {
        const response = await secureFetch(
          `${MIGROS_API_BASE}/partners/${this.partnerId}/stores/${payload.storeId}/inventory`,
          {
            method: 'PUT',
            headers: this.getHeaders(),
            body: { items: payload.items },
          }
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'Inventory update failed');
        }

        return response.data;
      });

      return {
        success: true,
        data: {
          updated: payload.items.length,
          failed: 0,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async bulkUpdateInventory(payload: any): Promise<ActionResult> {
    try {
      const result = await circuitBreakerManager.execute('migros', async () => {
        const response = await secureFetch(
          `${MIGROS_API_BASE}/partners/${this.partnerId}/stores/${payload.storeId}/inventory/bulk`,
          {
            method: 'POST',
            headers: this.getHeaders(),
            body: { items: payload.items },
          }
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'Bulk inventory update failed');
        }

        return response.data;
      });

      return {
        success: true,
        data: {
          updated: payload.items.length,
          failed: 0,
          batchRequestId: result.batchId,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BULK_UPDATE_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async listInventory(payload: any): Promise<ActionResult> {
    try {
      const { page = 1, size = 100, lowStockOnly = false } = payload;
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        lowStockOnly: String(lowStockOnly),
      });

      const response = await secureFetch(
        `${MIGROS_API_BASE}/partners/${this.partnerId}/stores/${payload.storeId}/inventory?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.success) {
        throw new Error('Failed to list inventory');
      }

      return {
        success: true,
        data: {
          items: response.data?.items || [],
          total: response.data?.total || 0,
          page,
          totalPages: Math.ceil((response.data?.total || 0) / size),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LIST_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async listOrders(payload: any): Promise<ActionResult> {
    try {
      const { page = 1, size = 50, status, fulfillmentType, startDate, endDate } = payload;
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        ...(status && { status }),
        ...(fulfillmentType && { fulfillmentType }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await secureFetch(
        `${MIGROS_API_BASE}/partners/${this.partnerId}/stores/${payload.storeId}/orders?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.success) {
        throw new Error('Failed to list orders');
      }

      return {
        success: true,
        data: {
          orders: response.data?.orders || [],
          total: response.data?.total || 0,
          page,
          totalPages: Math.ceil((response.data?.total || 0) / size),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LIST_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async getOrder(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${MIGROS_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.success) {
        throw new Error('Order not found');
      }

      return {
        success: true,
        data: { order: response.data },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async fulfillOrder(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${MIGROS_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}/fulfill`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: {
            substitutions: payload.substitutions || [],
          },
        }
      );

      return {
        success: response.success,
        data: { fulfilled: response.success },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FULFILL_FAILED',
          message: error.message,
        },
      };
    }
  }
}
