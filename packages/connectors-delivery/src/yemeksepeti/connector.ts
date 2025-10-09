// ========================================
// YEMEKSEPETI CONNECTOR
// Partner API Integration for Food Delivery
// White-Hat: Partner-required, TOS compliant, KVKK/GDPR aware
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
 * Yemeksepeti Partner API Base URL
 * Note: This is a placeholder - actual URL requires partner approval
 */
const YEMEKSEPETI_API_BASE = process.env.YEMEKSEPETI_API_BASE || 'https://partner-api.yemeksepeti.com/v2';

/**
 * Yemeksepeti Connector
 * Implements partner API for restaurant menu management and order tracking
 *
 * Legal Gate: mode=partner_required, status=disabled by default
 * Production use requires:
 * 1. Partner agreement with Yemeksepeti
 * 2. API credentials (API_KEY + RESTAURANT_KEY)
 * 3. Restaurant owner consent for data operations
 * 4. KVKK compliance (7-day retention → anonymize)
 */
export class YemeksepetiConnector implements IConnector {
  private apiKey: string = '';
  private restaurantKey: string = '';
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
        id: 'menu.sync',
        name: 'Sync Menu',
        description: 'Sync restaurant menu to Yemeksepeti',
        category: 'delivery',
        requiredScopes: ['yemeksepeti:menu:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          categoryId: z.string().optional(),
          items: z.array(z.any()),
          mode: z.enum(['full', 'incremental']).default('incremental'),
        }),
        outputSchema: z.object({
          synced: z.number(),
          updated: z.number(),
          skipped: z.number(),
          failed: z.number(),
          errors: z.array(z.string()).optional(),
        }),
      },
      {
        id: 'menu.update',
        name: 'Update Menu Item',
        description: 'Update single menu item (price, availability, options)',
        category: 'delivery',
        requiredScopes: ['yemeksepeti:menu:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          itemId: z.string(),
          updates: z.object({
            price: z.number().positive().optional(),
            isAvailable: z.boolean().optional(),
            stock: z.number().int().nonnegative().optional(),
            preparationTime: z.number().int().positive().optional(), // minutes
            options: z.array(z.any()).optional(),
          }),
        }),
        outputSchema: z.object({
          success: z.boolean(),
          itemId: z.string(),
          updatedFields: z.array(z.string()),
        }),
      },
      {
        id: 'order.list',
        name: 'List Orders',
        description: 'Get delivery orders from Yemeksepeti',
        category: 'delivery',
        requiredScopes: ['yemeksepeti:orders:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          status: z.enum([
            'new',
            'confirmed',
            'preparing',
            'ready',
            'on_the_way',
            'delivered',
            'cancelled',
          ]).optional(),
          dateFrom: z.string().datetime().optional(),
          dateTo: z.string().datetime().optional(),
          page: z.number().int().positive().default(1),
          pageSize: z.number().int().positive().max(100).default(50),
        }),
        outputSchema: z.object({
          orders: z.array(z.any()),
          total: z.number(),
          page: z.number(),
          pageSize: z.number(),
          hasMore: z.boolean(),
        }),
      },
      {
        id: 'order.status',
        name: 'Update Order Status',
        description: 'Update order status and estimated time',
        category: 'delivery',
        requiredScopes: ['yemeksepeti:orders:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
          status: z.enum(['confirmed', 'preparing', 'ready', 'cancelled']),
          estimatedDeliveryTime: z.number().int().positive().optional(), // minutes
          rejectionReason: z.string().max(500).optional(), // For cancelled orders
          note: z.string().max(500).optional(),
        }),
        outputSchema: z.object({
          success: z.boolean(),
          orderId: z.string(),
          newStatus: z.string(),
          estimatedTime: z.string().datetime().optional(),
        }),
      },
      {
        id: 'restaurant.hours',
        name: 'Update Operating Hours',
        description: 'Update restaurant operating hours (for special days/holidays)',
        category: 'delivery',
        requiredScopes: ['yemeksepeti:restaurant:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
          isOpen: z.boolean(),
          openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:MM
          closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        }),
        outputSchema: z.object({
          success: z.boolean(),
          restaurantId: z.string(),
          date: z.string(),
        }),
      },
    ];
  }

  /**
   * Initialize connector
   */
  async initialize(credentials: Record<string, any>): Promise<void> {
    console.log('[Yemeksepeti] Initializing connector...');

    // Extract credentials
    this.apiKey = credentials.YEMEKSEPETI_API_KEY || '';
    this.restaurantKey = credentials.YEMEKSEPETI_RESTAURANT_KEY || '';

    if (!this.apiKey || !this.restaurantKey) {
      throw new Error('Missing Yemeksepeti credentials (API_KEY, RESTAURANT_KEY)');
    }

    // Check Legal Gate
    const manifest = this.getManifest();
    if (manifest.mode === 'partner_required' && manifest.status !== 'partner_ok') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          '[LEGAL GATE] Yemeksepeti connector requires partner approval. ' +
          'Apply at https://partners.yemeksepeti.com/apply and update status to "partner_ok"'
        );
      } else {
        console.warn(
          '[LEGAL GATE] ⚠️ Yemeksepeti connector in sandbox mode. ' +
          'Production requires partner approval and restaurant consent.'
        );
      }
    }

    // Setup rate limiter (8 rps - Yemeksepeti standard)
    rateLimiterManager.createLimiter('yemeksepeti', 8, 1000, 16);

    // Setup circuit breaker
    circuitBreakerManager.createBreaker('yemeksepeti', {
      failureThreshold: 5,
      resetTimeout: 60000,
      successThreshold: 2,
      monitoringPeriod: 10000,
    });

    this.initialized = true;
    console.log('[Yemeksepeti] ✅ Connector initialized');
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
      case 'menu.sync':
        return await this.syncMenu(payload);
      case 'menu.update':
        return await this.updateMenuItem(payload);
      case 'order.list':
        return await this.listOrders(payload);
      case 'order.status':
        return await this.updateOrderStatus(payload);
      case 'restaurant.hours':
        return await this.updateOperatingHours(payload);
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
   * Sync menu to Yemeksepeti
   */
  private async syncMenu(payload: any): Promise<ActionResult> {
    console.log('[Yemeksepeti] Syncing menu for restaurant:', payload.restaurantId);

    const allowed = await rateLimiterManager.acquire('yemeksepeti');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('yemeksepeti', async () => {
        const response = await secureFetch(
          `${YEMEKSEPETI_API_BASE}/restaurants/${payload.restaurantId}/menu/sync`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'X-Restaurant-Key': this.restaurantKey,
              'User-Agent': 'Lydian-SDK/1.0',
            },
            body: {
              categoryId: payload.categoryId,
              items: payload.items,
              mode: payload.mode,
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
          synced: result.synced || 0,
          updated: result.updated || 0,
          skipped: result.skipped || 0,
          failed: result.failed || 0,
          errors: result.errors || [],
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'MENU_SYNC_FAILED', message: error.message },
      };
    }
  }

  /**
   * Update menu item
   */
  private async updateMenuItem(payload: any): Promise<ActionResult> {
    console.log('[Yemeksepeti] Updating menu item:', payload.itemId);

    const allowed = await rateLimiterManager.acquire('yemeksepeti');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('yemeksepeti', async () => {
        const response = await secureFetch(
          `${YEMEKSEPETI_API_BASE}/restaurants/${payload.restaurantId}/menu/items/${payload.itemId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'X-Restaurant-Key': this.restaurantKey,
            },
            body: payload.updates,
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
          itemId: payload.itemId,
          updatedFields: result.updatedFields || Object.keys(payload.updates),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'MENU_UPDATE_FAILED', message: error.message },
      };
    }
  }

  /**
   * List orders from Yemeksepeti
   */
  private async listOrders(payload: any): Promise<ActionResult> {
    console.log('[Yemeksepeti] Listing orders for restaurant:', payload.restaurantId);

    const allowed = await rateLimiterManager.acquire('yemeksepeti');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('yemeksepeti', async () => {
        const params = new URLSearchParams({
          page: payload.page.toString(),
          pageSize: payload.pageSize.toString(),
        });

        if (payload.status) params.append('status', payload.status);
        if (payload.dateFrom) params.append('dateFrom', payload.dateFrom);
        if (payload.dateTo) params.append('dateTo', payload.dateTo);

        const response = await secureFetch(
          `${YEMEKSEPETI_API_BASE}/restaurants/${payload.restaurantId}/orders?${params}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'X-Restaurant-Key': this.restaurantKey,
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
          orders: result.orders || [],
          total: result.total || 0,
          page: payload.page,
          pageSize: payload.pageSize,
          hasMore: result.hasMore || false,
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
   * Update order status
   */
  private async updateOrderStatus(payload: any): Promise<ActionResult> {
    console.log('[Yemeksepeti] Updating order status:', payload.orderId);

    const allowed = await rateLimiterManager.acquire('yemeksepeti');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('yemeksepeti', async () => {
        const response = await secureFetch(
          `${YEMEKSEPETI_API_BASE}/orders/${payload.orderId}/status`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'X-Restaurant-Key': this.restaurantKey,
            },
            body: {
              status: payload.status,
              estimatedDeliveryTime: payload.estimatedDeliveryTime,
              rejectionReason: payload.rejectionReason,
              note: payload.note,
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
          orderId: payload.orderId,
          newStatus: result.status || payload.status,
          estimatedTime: result.estimatedDeliveryTime,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'ORDER_STATUS_UPDATE_FAILED', message: error.message },
      };
    }
  }

  /**
   * Update restaurant operating hours
   */
  private async updateOperatingHours(payload: any): Promise<ActionResult> {
    console.log('[Yemeksepeti] Updating operating hours for:', payload.restaurantId);

    const allowed = await rateLimiterManager.acquire('yemeksepeti');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('yemeksepeti', async () => {
        const response = await secureFetch(
          `${YEMEKSEPETI_API_BASE}/restaurants/${payload.restaurantId}/hours`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'X-Restaurant-Key': this.restaurantKey,
            },
            body: {
              date: payload.date,
              isOpen: payload.isOpen,
              openTime: payload.openTime,
              closeTime: payload.closeTime,
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
          restaurantId: payload.restaurantId,
          date: payload.date,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'HOURS_UPDATE_FAILED', message: error.message },
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
        `${YEMEKSEPETI_API_BASE}/health`,
        {
          method: 'GET',
          headers: {
            Authorization: this.getAuthHeader(),
            'X-Restaurant-Key': this.restaurantKey,
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
    console.log('[Yemeksepeti] Shutting down connector...');
    this.initialized = false;
  }
}
