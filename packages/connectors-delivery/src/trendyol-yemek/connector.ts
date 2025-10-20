// ========================================
// TRENDYOL YEMEK CONNECTOR
// Partner API Integration for Food Delivery
// White-Hat: Partner-required, TOS compliant, KVKK aware
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
 * Trendyol Yemek Partner API Base URL
 * Note: This is a placeholder - actual URL requires partner approval
 */
const TRENDYOL_YEMEK_API_BASE = process.env.TRENDYOL_YEMEK_API_BASE || 'https://partner-api.trendyolyemek.com/v1';

/**
 * Trendyol Yemek Connector
 * Implements partner API for restaurant menu management, order tracking, and campaigns
 *
 * Legal Gate: mode=partner_required, status=disabled by default
 * Production use requires:
 * 1. Partner agreement with Trendyol Yemek
 * 2. API credentials (PARTNER_KEY + RESTAURANT_ID)
 * 3. Restaurant owner consent for data operations
 * 4. KVKK compliance (30-day retention)
 */
export class TrendyolYemekConnector implements IConnector {
  private partnerKey: string = '';
  private restaurantId: string = '';
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
        description: 'Bulk sync restaurant menu to Trendyol Yemek',
        category: 'delivery',
        requiredScopes: ['trendyol_yemek:menu:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          categoryId: z.string().optional(),
          items: z.array(z.any()),
          deleteObsolete: z.boolean().default(false),
          validateImages: z.boolean().default(true),
        }),
        outputSchema: z.object({
          synced: z.number(),
          updated: z.number(),
          deleted: z.number(),
          failed: z.number(),
          warnings: z.array(z.string()).optional(),
        }),
      },
      {
        id: 'menu.update',
        name: 'Update Menu Item',
        description: 'Update single menu item (price, availability, stock, options)',
        category: 'delivery',
        requiredScopes: ['trendyol_yemek:menu:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          itemId: z.string(),
          updates: z.object({
            price: z.number().positive().optional(),
            discountedPrice: z.number().positive().optional(),
            isAvailable: z.boolean().optional(),
            stock: z.number().int().nonnegative().optional(),
            preparationTime: z.number().int().positive().optional(), // minutes
            options: z.array(z.any()).optional(),
            tags: z.array(z.string()).optional(), // "new", "popular", "spicy"
          }),
        }),
        outputSchema: z.object({
          success: z.boolean(),
          itemId: z.string(),
          updatedAt: z.string().datetime(),
        }),
      },
      {
        id: 'order.list',
        name: 'List Orders',
        description: 'Get delivery orders from Trendyol Yemek',
        category: 'delivery',
        requiredScopes: ['trendyol_yemek:orders:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          status: z.enum([
            'received',
            'confirmed',
            'preparing',
            'ready_for_pickup',
            'picked_up',
            'on_delivery',
            'delivered',
            'cancelled',
            'rejected',
          ]).optional(),
          dateFrom: z.string().datetime().optional(),
          dateTo: z.string().datetime().optional(),
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(100).default(50),
        }),
        outputSchema: z.object({
          orders: z.array(z.any()),
          total: z.number(),
          page: z.number(),
          size: z.number(),
          totalPages: z.number(),
        }),
      },
      {
        id: 'order.status',
        name: 'Update Order Status',
        description: 'Update order status and preparation info',
        category: 'delivery',
        requiredScopes: ['trendyol_yemek:orders:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
          status: z.enum(['confirmed', 'preparing', 'ready_for_pickup', 'rejected']),
          estimatedReadyTime: z.number().int().positive().optional(), // minutes
          rejectionCode: z.enum([
            'out_of_stock',
            'too_busy',
            'delivery_area',
            'technical_issue',
            'other',
          ]).optional(),
          rejectionNote: z.string().max(500).optional(),
        }),
        outputSchema: z.object({
          success: z.boolean(),
          orderId: z.string(),
          newStatus: z.string(),
          updatedAt: z.string().datetime(),
        }),
      },
      {
        id: 'restaurant.status',
        name: 'Update Restaurant Status',
        description: 'Update restaurant online/offline status and accepting orders',
        category: 'delivery',
        requiredScopes: ['trendyol_yemek:restaurant:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          isOnline: z.boolean(),
          acceptingOrders: z.boolean(),
          reason: z.string().max(200).optional(), // "Busy", "Holiday", etc.
          reopenTime: z.string().datetime().optional(),
        }),
        outputSchema: z.object({
          success: z.boolean(),
          restaurantId: z.string(),
          isOnline: z.boolean(),
          acceptingOrders: z.boolean(),
        }),
      },
      {
        id: 'campaign.list',
        name: 'List Active Campaigns',
        description: 'Get active campaigns and promotions for restaurant',
        category: 'delivery',
        requiredScopes: ['trendyol_yemek:campaigns:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          activeOnly: z.boolean().default(true),
        }),
        outputSchema: z.object({
          campaigns: z.array(z.any()),
          total: z.number(),
        }),
      },
    ];
  }

  /**
   * Initialize connector
   */
  async initialize(credentials: Record<string, any>): Promise<void> {
    console.log('[Trendyol Yemek] Initializing connector...');

    // Extract credentials
    this.partnerKey = credentials.TRENDYOL_YEMEK_PARTNER_KEY || '';
    this.restaurantId = credentials.TRENDYOL_YEMEK_RESTAURANT_ID || '';

    if (!this.partnerKey || !this.restaurantId) {
      throw new Error('Missing Trendyol Yemek credentials (PARTNER_KEY, RESTAURANT_ID)');
    }

    // Check Legal Gate
    const manifest = this.getManifest();
    if (manifest.mode === 'partner_required' && manifest.status !== 'partner_ok') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          '[LEGAL GATE] Trendyol Yemek connector requires partner approval. ' +
          'Apply at https://partner.trendyolyemek.com/basvuru and update status to "partner_ok"'
        );
      } else {
        console.warn(
          '[LEGAL GATE] ⚠️ Trendyol Yemek connector in sandbox mode. ' +
          'Production requires partner approval and restaurant consent.'
        );
      }
    }

    // Setup rate limiter (10 rps - Trendyol standard)
    rateLimiterManager.createLimiter('trendyol_yemek', 10, 1000, 20);

    // Setup circuit breaker
    circuitBreakerManager.createBreaker('trendyol_yemek', {
      failureThreshold: 5,
      resetTimeout: 60000,
      successThreshold: 2,
      monitoringPeriod: 10000,
    });

    this.initialized = true;
    console.log('[Trendyol Yemek] ✅ Connector initialized');
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
      case 'restaurant.status':
        return await this.updateRestaurantStatus(payload);
      case 'campaign.list':
        return await this.listCampaigns(payload);
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
   * Sync menu to Trendyol Yemek
   */
  private async syncMenu(payload: any): Promise<ActionResult> {
    console.log('[Trendyol Yemek] Syncing menu for restaurant:', payload.restaurantId);

    const allowed = await rateLimiterManager.acquire('trendyol_yemek');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('trendyol_yemek', async () => {
        const response = await secureFetch(
          `${TRENDYOL_YEMEK_API_BASE}/restaurants/${payload.restaurantId}/menu/bulk`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.partnerKey}`,
              'X-Restaurant-ID': this.restaurantId,
              'User-Agent': 'Lydian-SDK/1.0',
            },
            body: {
              categoryId: payload.categoryId,
              items: payload.items,
              deleteObsolete: payload.deleteObsolete,
              validateImages: payload.validateImages,
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
          deleted: result.deleted || 0,
          failed: result.failed || 0,
          warnings: result.warnings || [],
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
    console.log('[Trendyol Yemek] Updating menu item:', payload.itemId);

    const allowed = await rateLimiterManager.acquire('trendyol_yemek');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('trendyol_yemek', async () => {
        const response = await secureFetch(
          `${TRENDYOL_YEMEK_API_BASE}/restaurants/${payload.restaurantId}/menu/items/${payload.itemId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${this.partnerKey}`,
              'X-Restaurant-ID': this.restaurantId,
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
          updatedAt: result.updatedAt || new Date().toISOString(),
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
   * List orders from Trendyol Yemek
   */
  private async listOrders(payload: any): Promise<ActionResult> {
    console.log('[Trendyol Yemek] Listing orders for restaurant:', payload.restaurantId);

    const allowed = await rateLimiterManager.acquire('trendyol_yemek');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('trendyol_yemek', async () => {
        const params = new URLSearchParams({
          page: payload.page.toString(),
          size: payload.size.toString(),
        });

        if (payload.status) params.append('status', payload.status);
        if (payload.dateFrom) params.append('dateFrom', payload.dateFrom);
        if (payload.dateTo) params.append('dateTo', payload.dateTo);

        const response = await secureFetch(
          `${TRENDYOL_YEMEK_API_BASE}/restaurants/${payload.restaurantId}/orders?${params}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.partnerKey}`,
              'X-Restaurant-ID': this.restaurantId,
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
          size: payload.size,
          totalPages: Math.ceil((result.total || 0) / payload.size),
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
    console.log('[Trendyol Yemek] Updating order status:', payload.orderId);

    const allowed = await rateLimiterManager.acquire('trendyol_yemek');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('trendyol_yemek', async () => {
        const response = await secureFetch(
          `${TRENDYOL_YEMEK_API_BASE}/orders/${payload.orderId}/status`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${this.partnerKey}`,
              'X-Restaurant-ID': this.restaurantId,
            },
            body: {
              status: payload.status,
              estimatedReadyTime: payload.estimatedReadyTime,
              rejectionCode: payload.rejectionCode,
              rejectionNote: payload.rejectionNote,
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
          updatedAt: result.updatedAt || new Date().toISOString(),
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
   * Update restaurant status
   */
  private async updateRestaurantStatus(payload: any): Promise<ActionResult> {
    console.log('[Trendyol Yemek] Updating restaurant status:', payload.restaurantId);

    const allowed = await rateLimiterManager.acquire('trendyol_yemek');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('trendyol_yemek', async () => {
        const response = await secureFetch(
          `${TRENDYOL_YEMEK_API_BASE}/restaurants/${payload.restaurantId}/status`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${this.partnerKey}`,
              'X-Restaurant-ID': this.restaurantId,
            },
            body: {
              isOnline: payload.isOnline,
              acceptingOrders: payload.acceptingOrders,
              reason: payload.reason,
              reopenTime: payload.reopenTime,
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
          isOnline: payload.isOnline,
          acceptingOrders: payload.acceptingOrders,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'RESTAURANT_STATUS_UPDATE_FAILED', message: error.message },
      };
    }
  }

  /**
   * List active campaigns
   */
  private async listCampaigns(payload: any): Promise<ActionResult> {
    console.log('[Trendyol Yemek] Listing campaigns for restaurant:', payload.restaurantId);

    const allowed = await rateLimiterManager.acquire('trendyol_yemek');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('trendyol_yemek', async () => {
        const params = new URLSearchParams();
        if (payload.activeOnly !== undefined) {
          params.append('activeOnly', payload.activeOnly.toString());
        }

        const response = await secureFetch(
          `${TRENDYOL_YEMEK_API_BASE}/restaurants/${payload.restaurantId}/campaigns?${params}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.partnerKey}`,
              'X-Restaurant-ID': this.restaurantId,
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
          campaigns: result.campaigns || [],
          total: result.total || 0,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'LIST_CAMPAIGNS_FAILED', message: error.message },
      };
    }
  }

  /**
   * Get Authorization header
   */
  private getAuthHeader(): string {
    return `Bearer ${this.partnerKey}`;
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
        `${TRENDYOL_YEMEK_API_BASE}/health`,
        {
          method: 'GET',
          headers: {
            Authorization: this.getAuthHeader(),
            'X-Restaurant-ID': this.restaurantId,
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
    console.log('[Trendyol Yemek] Shutting down connector...');
    this.initialized = false;
  }
}
