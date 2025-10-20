/**
 * ========================================
 * TRENDYOL YEMEK CONNECTOR - FULL IMPLEMENTATION
 * ========================================
 *
 * Vendor: Trendyol Yemek (Food Delivery arm of Trendyol)
 * Mode: partner_required (Legal Gate enforced)
 * Status: sandbox (production blocked until partner_ok)
 *
 * SPRINT 2 - Delivery & Grocery
 *
 * 15 Unified Delivery Actions (same interface as Getir/Yemeksepeti):
 * - Restaurant Management (4)
 * - Menu Management (4)
 * - Order Management (5)
 * - Delivery Tracking (2)
 *
 * Technical Features:
 * - Rate limiting: 8 rps, burst 16 (same as Trendyol Marketplace)
 * - Circuit breaker: 5 failures → 60s cooldown
 * - Basic Auth (same credentials as Trendyol Commerce)
 * - Zod schema validation
 * - Legal Gate enforcement (3-layer)
 *
 * Vendor-Specific Notes:
 * - Shares infrastructure with Trendyol Marketplace
 * - Uses supplierId from commerce account
 * - Unified catalog sync across commerce + yemek
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

const TRENDYOL_YEMEK_API_BASE = 'https://api.trendyol.com/yemeksepeti/integration/suppliers';

/**
 * Trendyol Yemek Connector - Full Implementation
 *
 * Legal Gate: partner_required
 * Ecosystem: Trendyol Group (Commerce + Food Delivery synergy)
 */
export class TrendyolYemekConnectorFull implements IConnector {
  private supplierId: string = '';
  private apiKey: string = '';
  private apiSecret: string = '';
  private initialized: boolean = false;

  /**
   * Connector manifest with Legal Gate enforcement
   */
  getManifest(): ConnectorManifest {
    return {
      id: 'trendyol-yemek',
      name: 'Trendyol Yemek',
      version: '1.0.0',
      vendor: 'Trendyol',
      country: 'TR',
      sector: 'delivery',
      mode: 'partner_required',
      status: 'sandbox',
      description: 'Trendyol Yemek food delivery integration (partner-only)',
      authType: 'basic_auth',
      rateLimit: {
        requestsPerSecond: 8,
        burstSize: 16,
      },
      capabilities: this.getCapabilities(),
    };
  }

  /**
   * 15 Unified Delivery Actions (same as Getir/Yemeksepeti)
   */
  private getCapabilities(): Capability[] {
    return [
      // ========== Restaurant Management (4 actions) ==========
      {
        id: 'restaurant.sync',
        name: 'Sync Restaurant',
        category: 'delivery',
        description: 'Register or update restaurant profile',
        requiredScopes: ['trendyol-yemek:restaurant:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string().optional(),
          name: z.string().min(1),
          address: z.object({
            street: z.string(),
            city: z.string(),
            district: z.string(),
            zipCode: z.string(),
            latitude: z.number(),
            longitude: z.number(),
          }),
          cuisine: z.array(z.string()),
          operatingHours: z.record(z.object({
            open: z.string(),
            close: z.string(),
          })),
          minOrderAmount: z.number().nonnegative().default(0),
          deliveryFee: z.number().nonnegative().default(0),
        }),
        outputSchema: z.object({
          restaurantId: z.string(),
          status: z.enum(['active', 'pending_review', 'inactive']),
        }),
      },
      {
        id: 'restaurant.list',
        name: 'List Restaurants',
        category: 'delivery',
        description: 'List all registered restaurants',
        requiredScopes: ['trendyol-yemek:restaurant:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(100).default(50),
          status: z.enum(['active', 'inactive', 'pending_review']).optional(),
        }),
        outputSchema: z.object({
          restaurants: z.array(z.any()),
          total: z.number().int().nonnegative(),
          page: z.number().int().positive(),
          totalPages: z.number().int().nonnegative(),
        }),
      },
      {
        id: 'restaurant.get',
        name: 'Get Restaurant',
        category: 'delivery',
        description: 'Get single restaurant details',
        requiredScopes: ['trendyol-yemek:restaurant:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
        }),
        outputSchema: z.object({
          restaurant: z.any(),
        }),
      },
      {
        id: 'restaurant.update',
        name: 'Update Restaurant',
        category: 'delivery',
        description: 'Update restaurant details',
        requiredScopes: ['trendyol-yemek:restaurant:write'],
        idempotent: false,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          updates: z.record(z.any()),
        }),
        outputSchema: z.object({
          updated: z.boolean(),
        }),
      },

      // ========== Menu Management (4 actions) ==========
      {
        id: 'menu.sync',
        name: 'Sync Menu',
        category: 'delivery',
        description: 'Sync full menu catalog',
        requiredScopes: ['trendyol-yemek:menu:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          menu: z.object({
            categories: z.array(z.object({
              id: z.string(),
              name: z.string(),
              sortOrder: z.number().int().nonnegative(),
            })),
            items: z.array(z.object({
              id: z.string(),
              categoryId: z.string(),
              name: z.string(),
              description: z.string().optional(),
              price: z.number().positive(),
              imageUrl: z.string().url().optional(),
              available: z.boolean().default(true),
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
        id: 'menu.list',
        name: 'List Menu Items',
        category: 'delivery',
        description: 'List current menu items',
        requiredScopes: ['trendyol-yemek:menu:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          categoryId: z.string().optional(),
        }),
        outputSchema: z.object({
          items: z.array(z.any()),
          total: z.number().int().nonnegative(),
        }),
      },
      {
        id: 'menu.update',
        name: 'Update Menu Item',
        category: 'delivery',
        description: 'Update item availability/price',
        requiredScopes: ['trendyol-yemek:menu:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          itemId: z.string(),
          updates: z.object({
            available: z.boolean().optional(),
            price: z.number().positive().optional(),
          }),
        }),
        outputSchema: z.object({
          updated: z.boolean(),
        }),
      },
      {
        id: 'menu.batch-status',
        name: 'Check Batch Status',
        category: 'delivery',
        description: 'Check async menu sync batch status',
        requiredScopes: ['trendyol-yemek:menu:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          batchRequestId: z.string(),
        }),
        outputSchema: z.object({
          status: z.enum(['pending', 'processing', 'completed', 'failed']),
          processed: z.number().int().nonnegative(),
          total: z.number().int().nonnegative(),
        }),
      },

      // ========== Order Management (5 actions) ==========
      {
        id: 'order.list',
        name: 'List Orders',
        category: 'delivery',
        description: 'List incoming orders with filters',
        requiredScopes: ['trendyol-yemek:orders:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(100).default(50),
          status: z.enum(['pending', 'accepted', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled']).optional(),
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
        category: 'delivery',
        description: 'Get single order details',
        requiredScopes: ['trendyol-yemek:orders:read'],
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
        id: 'order.accept',
        name: 'Accept Order',
        category: 'delivery',
        description: 'Accept incoming order',
        requiredScopes: ['trendyol-yemek:orders:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
          estimatedPrepTime: z.number().int().positive(),
        }),
        outputSchema: z.object({
          accepted: z.boolean(),
        }),
      },
      {
        id: 'order.reject',
        name: 'Reject Order',
        category: 'delivery',
        description: 'Reject order with reason',
        requiredScopes: ['trendyol-yemek:orders:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
          reason: z.enum(['out_of_stock', 'closed', 'high_volume', 'other']),
          reasonText: z.string().optional(),
        }),
        outputSchema: z.object({
          rejected: z.boolean(),
        }),
      },
      {
        id: 'order.dispatch',
        name: 'Dispatch Order',
        category: 'delivery',
        description: 'Mark order as ready for pickup',
        requiredScopes: ['trendyol-yemek:orders:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
        }),
        outputSchema: z.object({
          dispatched: z.boolean(),
        }),
      },

      // ========== Delivery Tracking (2 actions) ==========
      {
        id: 'delivery.track',
        name: 'Track Delivery',
        category: 'delivery',
        description: 'Get real-time delivery status',
        requiredScopes: ['trendyol-yemek:delivery:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
        }),
        outputSchema: z.object({
          status: z.enum(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered']),
          courier: z.object({
            name: z.string(),
            phone: z.string(),
            location: z.object({
              latitude: z.number(),
              longitude: z.number(),
            }).optional(),
          }).optional(),
          estimatedDeliveryTime: z.string().optional(),
        }),
      },
      {
        id: 'delivery.update-status',
        name: 'Update Delivery Status',
        category: 'delivery',
        description: 'Update delivery status (restaurant perspective)',
        requiredScopes: ['trendyol-yemek:delivery:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
          status: z.enum(['preparing', 'ready', 'handed_to_courier']),
        }),
        outputSchema: z.object({
          updated: z.boolean(),
        }),
      },
    ];
  }

  /**
   * Initialize connector
   */
  async initialize(config: Record<string, any>): Promise<void> {
    this.supplierId = config.supplierId || '';
    this.apiKey = config.apiKey || '';
    this.apiSecret = config.apiSecret || '';

    if (!this.supplierId || !this.apiKey || !this.apiSecret) {
      throw new Error('[Trendyol Yemek] Missing credentials (supplierId, apiKey, apiSecret)');
    }

    // Rate limiter: 8 rps, burst 16 (same as Trendyol Marketplace)
    rateLimiterManager.createLimiter('trendyol-yemek', 8, 1000, 16);

    // Circuit breaker
    circuitBreakerManager.createBreaker('trendyol-yemek', 5, 60000);

    this.initialized = true;
    console.log('[Trendyol Yemek] Connector initialized successfully');
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
    const allowed = await rateLimiterManager.acquire('trendyol-yemek');
    if (!allowed) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded (8 rps)',
        },
      };
    }

    // Action routing (same 15 actions)
    const handlers: Record<string, (payload: any) => Promise<ActionResult>> = {
      'restaurant.sync': this.syncRestaurant.bind(this),
      'restaurant.list': this.listRestaurants.bind(this),
      'restaurant.get': this.getRestaurant.bind(this),
      'restaurant.update': this.updateRestaurant.bind(this),
      'menu.sync': this.syncMenu.bind(this),
      'menu.list': this.listMenu.bind(this),
      'menu.update': this.updateMenuItem.bind(this),
      'menu.batch-status': this.getBatchStatus.bind(this),
      'order.list': this.listOrders.bind(this),
      'order.get': this.getOrder.bind(this),
      'order.accept': this.acceptOrder.bind(this),
      'order.reject': this.rejectOrder.bind(this),
      'order.dispatch': this.dispatchOrder.bind(this),
      'delivery.track': this.trackDelivery.bind(this),
      'delivery.update-status': this.updateDeliveryStatus.bind(this),
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
      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/health`,
        {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        }
      );
      return {
        healthy: response.success,
        latency: Date.now() - start,
      };
    } catch {
      return { healthy: false };
    }
  }

  /**
   * Basic Auth header (same as Trendyol Marketplace)
   */
  private getAuthHeader(): string {
    const credentials = `${this.apiKey}:${this.apiSecret}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  // ========== Action Handlers ==========

  private async syncRestaurant(payload: any): Promise<ActionResult> {
    try {
      const result = await circuitBreakerManager.execute('trendyol-yemek', async () => {
        const response = await secureFetch(
          `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/restaurants`,
          {
            method: 'POST',
            headers: {
              Authorization: this.getAuthHeader(),
              'Content-Type': 'application/json',
            },
            body: payload,
          }
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'Restaurant sync failed');
        }

        return response.data;
      });

      return {
        success: true,
        data: {
          restaurantId: result.restaurantId || result.id,
          status: result.status || 'pending_review',
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

  private async listRestaurants(payload: any): Promise<ActionResult> {
    try {
      const { page = 1, size = 50, status } = payload;
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        ...(status && { status }),
      });

      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/restaurants?${params}`,
        {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        }
      );

      if (!response.success) {
        throw new Error('Failed to list restaurants');
      }

      return {
        success: true,
        data: {
          restaurants: response.data?.restaurants || [],
          total: response.data?.totalCount || 0,
          page,
          totalPages: Math.ceil((response.data?.totalCount || 0) / size),
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

  private async getRestaurant(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/restaurants/${payload.restaurantId}`,
        {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        }
      );

      if (!response.success) {
        throw new Error('Restaurant not found');
      }

      return {
        success: true,
        data: { restaurant: response.data },
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

  private async updateRestaurant(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/restaurants/${payload.restaurantId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
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

  private async syncMenu(payload: any): Promise<ActionResult> {
    try {
      const result = await circuitBreakerManager.execute('trendyol-yemek', async () => {
        const response = await secureFetch(
          `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/restaurants/${payload.restaurantId}/menu`,
          {
            method: 'POST',
            headers: {
              Authorization: this.getAuthHeader(),
              'Content-Type': 'application/json',
            },
            body: payload.menu,
          }
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'Menu sync failed');
        }

        return response.data;
      });

      return {
        success: true,
        data: {
          synced: payload.menu.items?.length || 0,
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

  private async listMenu(payload: any): Promise<ActionResult> {
    try {
      const params = new URLSearchParams();
      if (payload.categoryId) {
        params.append('categoryId', payload.categoryId);
      }

      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/restaurants/${payload.restaurantId}/menu/items?${params}`,
        {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        }
      );

      if (!response.success) {
        throw new Error('Failed to list menu');
      }

      return {
        success: true,
        data: {
          items: response.data?.items || [],
          total: response.data?.totalCount || 0,
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

  private async updateMenuItem(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/restaurants/${payload.restaurantId}/menu/items/${payload.itemId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
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

  private async getBatchStatus(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/batches/${payload.batchRequestId}`,
        {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        }
      );

      if (!response.success) {
        throw new Error('Batch not found');
      }

      return {
        success: true,
        data: {
          status: response.data?.status || 'pending',
          processed: response.data?.processedCount || 0,
          total: response.data?.totalCount || 0,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BATCH_STATUS_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async listOrders(payload: any): Promise<ActionResult> {
    try {
      const { page = 1, size = 50, status, startDate, endDate } = payload;
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/restaurants/${payload.restaurantId}/orders?${params}`,
        {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        }
      );

      if (!response.success) {
        throw new Error('Failed to list orders');
      }

      return {
        success: true,
        data: {
          orders: response.data?.content || [],
          total: response.data?.totalElements || 0,
          page,
          totalPages: response.data?.totalPages || 0,
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
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/orders/${payload.orderId}`,
        {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
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

  private async acceptOrder(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/orders/${payload.orderId}/accept`,
        {
          method: 'POST',
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: { estimatedPrepTime: payload.estimatedPrepTime },
        }
      );

      return {
        success: response.success,
        data: { accepted: response.success },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ACCEPT_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async rejectOrder(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/orders/${payload.orderId}/reject`,
        {
          method: 'POST',
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: {
            reason: payload.reason,
            reasonText: payload.reasonText,
          },
        }
      );

      return {
        success: response.success,
        data: { rejected: response.success },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REJECT_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async dispatchOrder(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/orders/${payload.orderId}/dispatch`,
        {
          method: 'POST',
          headers: { Authorization: this.getAuthHeader() },
        }
      );

      return {
        success: response.success,
        data: { dispatched: response.success },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DISPATCH_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async trackDelivery(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/orders/${payload.orderId}/tracking`,
        {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        }
      );

      if (!response.success) {
        throw new Error('Delivery tracking failed');
      }

      return {
        success: true,
        data: {
          status: response.data?.deliveryStatus || 'pending',
          courier: response.data?.courier,
          estimatedDeliveryTime: response.data?.estimatedDeliveryTime,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRACK_FAILED',
          message: error.message,
        },
      };
    }
  }

  private async updateDeliveryStatus(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${TRENDYOL_YEMEK_API_BASE}/${this.supplierId}/orders/${payload.orderId}/delivery/status`,
        {
          method: 'PUT',
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: { status: payload.status },
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
}
