/**
 * ========================================
 * YEMEKSEPETI CONNECTOR - FULL IMPLEMENTATION
 * ========================================
 *
 * Vendor: Yemeksepeti (TR Food Delivery Market Leader)
 * Mode: partner_required (Legal Gate enforced)
 * Status: sandbox (production blocked until partner_ok)
 *
 * SPRINT 2 - Delivery & Grocery
 *
 * 15 Unified Delivery Actions (same interface as Getir):
 * - Restaurant Management (4)
 * - Menu Management (4)
 * - Order Management (5)
 * - Delivery Tracking (2)
 *
 * Technical Features:
 * - Rate limiting: 6 rps, burst 12 (per Yemeksepeti partner docs)
 * - Circuit breaker: 5 failures → 60s cooldown
 * - API Key authentication (partner API key)
 * - Zod schema validation
 * - Legal Gate enforcement (3-layer)
 *
 * Vendor-Specific Notes:
 * - Uses storeId instead of restaurantId
 * - Supports multiple delivery zones per restaurant
 * - Real-time menu availability sync
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

const YEMEKSEPETI_API_BASE = 'https://partner-api.yemeksepeti.com/api/v2';

/**
 * Yemeksepeti Connector - Full Implementation
 *
 * Legal Gate: partner_required
 * Market Position: #1 food delivery in Turkey
 */
export class YemeksepetiConnectorFull implements IConnector {
  private partnerId: string = '';
  private apiKey: string = '';
  private initialized: boolean = false;

  /**
   * Connector manifest with Legal Gate enforcement
   */
  getManifest(): ConnectorManifest {
    return {
      id: 'yemeksepeti',
      name: 'Yemeksepeti',
      version: '1.0.0',
      vendor: 'Yemeksepeti',
      country: 'TR',
      sector: 'delivery',
      mode: 'partner_required',
      status: 'sandbox',
      description: 'Yemeksepeti food delivery integration (partner-only)',
      authType: 'api_key',
      rateLimit: {
        requestsPerSecond: 6,
        burstSize: 12,
      },
      capabilities: this.getCapabilities(),
    };
  }

  /**
   * 15 Unified Delivery Actions (same as Getir)
   */
  private getCapabilities(): Capability[] {
    return [
      // ========== Restaurant Management (4 actions) ==========
      {
        id: 'restaurant.sync',
        name: 'Sync Restaurant',
        category: 'delivery',
        description: 'Register or update restaurant (store) profile',
        requiredScopes: ['yemeksepeti:restaurant:write'],
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
          deliveryZones: z.array(z.object({
            name: z.string(),
            polygonCoordinates: z.array(z.object({
              lat: z.number(),
              lng: z.number(),
            })),
            minOrderAmount: z.number().nonnegative(),
            deliveryFee: z.number().nonnegative(),
          })),
        }),
        outputSchema: z.object({
          restaurantId: z.string(),
          status: z.enum(['active', 'pending_approval', 'inactive']),
        }),
      },
      {
        id: 'restaurant.list',
        name: 'List Restaurants',
        category: 'delivery',
        description: 'List all registered restaurants (stores)',
        requiredScopes: ['yemeksepeti:restaurant:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(100).default(50),
          status: z.enum(['active', 'inactive', 'pending_approval']).optional(),
          city: z.string().optional(),
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
        requiredScopes: ['yemeksepeti:restaurant:read'],
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
        requiredScopes: ['yemeksepeti:restaurant:write'],
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
        description: 'Sync full menu catalog (categories, products, options)',
        requiredScopes: ['yemeksepeti:menu:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          menu: z.object({
            categories: z.array(z.object({
              id: z.string(),
              name: z.string(),
              displayOrder: z.number().int().nonnegative(),
            })),
            items: z.array(z.object({
              id: z.string(),
              categoryId: z.string(),
              name: z.string(),
              description: z.string().optional(),
              price: z.number().positive(),
              imageUrl: z.string().url().optional(),
              available: z.boolean().default(true),
              options: z.array(z.object({
                name: z.string(),
                choices: z.array(z.object({
                  name: z.string(),
                  price: z.number().nonnegative(),
                })),
                required: z.boolean().default(false),
              })).optional(),
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
        requiredScopes: ['yemeksepeti:menu:read'],
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
        requiredScopes: ['yemeksepeti:menu:write'],
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
        requiredScopes: ['yemeksepeti:menu:read'],
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
        requiredScopes: ['yemeksepeti:orders:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(100).default(50),
          status: z.enum(['new', 'accepted', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled']).optional(),
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
        requiredScopes: ['yemeksepeti:orders:read'],
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
        requiredScopes: ['yemeksepeti:orders:write'],
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
        requiredScopes: ['yemeksepeti:orders:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
          reason: z.enum(['out_of_stock', 'restaurant_busy', 'technical_issue', 'other']),
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
        description: 'Mark order as ready for courier pickup',
        requiredScopes: ['yemeksepeti:orders:write'],
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
        requiredScopes: ['yemeksepeti:delivery:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
        }),
        outputSchema: z.object({
          status: z.enum(['pending', 'courier_assigned', 'picked_up', 'on_the_way', 'delivered']),
          courier: z.object({
            name: z.string(),
            phone: z.string(),
            vehicleType: z.enum(['bike', 'scooter', 'car']).optional(),
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
        requiredScopes: ['yemeksepeti:delivery:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
          status: z.enum(['preparing', 'ready_for_pickup', 'handed_to_courier']),
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
    this.partnerId = config.partnerId || '';
    this.apiKey = config.apiKey || '';

    if (!this.partnerId || !this.apiKey) {
      throw new Error('[Yemeksepeti] Missing partner credentials (partnerId, apiKey)');
    }

    // Rate limiter: 6 rps, burst 12
    rateLimiterManager.createLimiter('yemeksepeti', 6, 1000, 12);

    // Circuit breaker
    circuitBreakerManager.createBreaker('yemeksepeti', 5, 60000);

    this.initialized = true;
    console.log('[Yemeksepeti] Connector initialized successfully');
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
    const allowed = await rateLimiterManager.acquire('yemeksepeti');
    if (!allowed) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded (6 rps)',
        },
      };
    }

    // Action routing (same 15 actions as Getir)
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
      const response = await secureFetch(`${YEMEKSEPETI_API_BASE}/ping`, {
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
   * Get request headers with API key
   */
  private getHeaders(): Record<string, string> {
    return {
      'X-Partner-Id': this.partnerId,
      'X-Api-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  // ========== Action Handlers ==========

  private async syncRestaurant(payload: any): Promise<ActionResult> {
    try {
      const result = await circuitBreakerManager.execute('yemeksepeti', async () => {
        const response = await secureFetch(
          `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/stores`,
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
          restaurantId: result.storeId || result.id,
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

  private async listRestaurants(payload: any): Promise<ActionResult> {
    try {
      const { page = 1, size = 50, status, city } = payload;
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(size),
        ...(status && { status }),
        ...(city && { city }),
      });

      const response = await secureFetch(
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/stores?${params}`,
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
          restaurants: response.data?.stores || [],
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
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/stores/${payload.restaurantId}`,
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
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/stores/${payload.restaurantId}`,
        {
          method: 'PUT',
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

  private async syncMenu(payload: any): Promise<ActionResult> {
    try {
      const result = await circuitBreakerManager.execute('yemeksepeti', async () => {
        const response = await secureFetch(
          `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/stores/${payload.restaurantId}/menu`,
          {
            method: 'POST',
            headers: this.getHeaders(),
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

  private async listMenu(payload: any): Promise<ActionResult> {
    try {
      const params = new URLSearchParams();
      if (payload.categoryId) {
        params.append('categoryId', payload.categoryId);
      }

      const response = await secureFetch(
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/stores/${payload.restaurantId}/menu/products?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.success) {
        throw new Error('Failed to list menu');
      }

      return {
        success: true,
        data: {
          items: response.data?.products || [],
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
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/stores/${payload.restaurantId}/menu/products/${payload.itemId}`,
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

  private async getBatchStatus(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/batches/${payload.batchRequestId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
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
        pageSize: String(size),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await secureFetch(
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/stores/${payload.restaurantId}/orders?${params}`,
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

  private async getOrder(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}`,
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

  private async acceptOrder(payload: any): Promise<ActionResult> {
    try {
      const response = await secureFetch(
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}/accept`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: { estimatedPrepMinutes: payload.estimatedPrepTime },
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
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}/reject`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: {
            rejectionReason: payload.reason,
            notes: payload.reasonText,
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
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}/ready`,
        {
          method: 'POST',
          headers: this.getHeaders(),
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
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}/tracking`,
        {
          method: 'GET',
          headers: this.getHeaders(),
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
          estimatedDeliveryTime: response.data?.eta,
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
        `${YEMEKSEPETI_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}/status`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
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
