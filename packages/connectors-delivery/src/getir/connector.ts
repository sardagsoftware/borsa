// ========================================
// GETIR CONNECTOR
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
 * Getir Partner API Base URL
 * Note: This is a placeholder - actual URL requires partner approval
 */
const GETIR_API_BASE = process.env.GETIR_API_BASE || 'https://partner-api.getir.com/v1';

/**
 * Getir Connector
 * Implements partner API for restaurant menu management and order tracking
 *
 * Legal Gate: mode=partner_required, status=disabled by default
 * Production use requires:
 * 1. Partner agreement with Getir
 * 2. API credentials
 * 3. Restaurant consent for data sync
 */
export class GetirConnector implements IConnector {
  private apiKey: string = '';
  private partnerId: string = '';
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
        description: 'Sync restaurant menu to Getir',
        category: 'delivery',
        requiredScopes: ['getir:menu:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          items: z.array(z.any()),
          deleteNotInList: z.boolean().default(false),
        }),
        outputSchema: z.object({
          synced: z.number(),
          updated: z.number(),
          deleted: z.number(),
          failed: z.number(),
        }),
      },
      {
        id: 'menu.update',
        name: 'Update Menu Item',
        description: 'Update single menu item (price, availability, stock)',
        category: 'delivery',
        requiredScopes: ['getir:menu:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          itemId: z.string(),
          updates: z.object({
            price: z.number().positive().optional(),
            isAvailable: z.boolean().optional(),
            stock: z.number().int().nonnegative().optional(),
          }),
        }),
        outputSchema: z.object({
          success: z.boolean(),
          itemId: z.string(),
        }),
      },
      {
        id: 'order.list',
        name: 'List Orders',
        description: 'Get delivery orders from Getir',
        category: 'delivery',
        requiredScopes: ['getir:orders:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered']).optional(),
          since: z.string().datetime().optional(),
          offset: z.number().int().nonnegative().default(0),
          limit: z.number().int().positive().max(100).default(50),
        }),
        outputSchema: z.object({
          orders: z.array(z.any()),
          total: z.number(),
        }),
      },
      {
        id: 'order.status',
        name: 'Update Order Status',
        description: 'Update order status (confirm, ready, etc.)',
        category: 'delivery',
        requiredScopes: ['getir:orders:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
          status: z.enum(['confirmed', 'preparing', 'ready']),
          estimatedReadyTime: z.number().int().positive().optional(), // minutes
          note: z.string().max(500).optional(),
        }),
        outputSchema: z.object({
          success: z.boolean(),
          orderId: z.string(),
          newStatus: z.string(),
        }),
      },
    ];
  }

  /**
   * Initialize connector
   */
  async initialize(credentials: Record<string, any>): Promise<void> {
    console.log('[Getir] Initializing connector...');

    // Extract credentials
    this.apiKey = credentials.GETIR_API_KEY || '';
    this.partnerId = credentials.GETIR_PARTNER_ID || '';

    if (!this.apiKey || !this.partnerId) {
      throw new Error('Missing Getir credentials (API_KEY, PARTNER_ID)');
    }

    // Check Legal Gate
    const manifest = this.getManifest();
    if (manifest.mode === 'partner_required' && manifest.status !== 'partner_ok') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          '[LEGAL GATE] Getir connector requires partner approval. ' +
          'Apply at https://partner.getir.com and update status to "partner_ok"'
        );
      } else {
        console.warn(
          '[LEGAL GATE] ⚠️ Getir connector in sandbox mode. ' +
          'Production requires partner approval.'
        );
      }
    }

    // Setup rate limiter (5 rps - conservative for delivery APIs)
    rateLimiterManager.createLimiter('getir', 5, 1000, 10);

    // Setup circuit breaker
    circuitBreakerManager.createBreaker('getir', {
      failureThreshold: 5,
      resetTimeout: 60000,
      successThreshold: 2,
      monitoringPeriod: 10000,
    });

    this.initialized = true;
    console.log('[Getir] ✅ Connector initialized');
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
   * Sync menu to Getir
   */
  private async syncMenu(payload: any): Promise<ActionResult> {
    console.log('[Getir] Syncing menu for restaurant:', payload.restaurantId);

    const allowed = await rateLimiterManager.acquire('getir');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('getir', async () => {
        const response = await secureFetch(
          `${GETIR_API_BASE}/restaurants/${payload.restaurantId}/menu/sync`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'X-Partner-ID': this.partnerId,
              'User-Agent': 'Lydian-SDK/1.0',
            },
            body: {
              items: payload.items,
              deleteNotInList: payload.deleteNotInList,
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
    console.log('[Getir] Updating menu item:', payload.itemId);

    const allowed = await rateLimiterManager.acquire('getir');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('getir', async () => {
        const response = await secureFetch(
          `${GETIR_API_BASE}/restaurants/${payload.restaurantId}/menu/items/${payload.itemId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'X-Partner-ID': this.partnerId,
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
   * List orders from Getir
   */
  private async listOrders(payload: any): Promise<ActionResult> {
    console.log('[Getir] Listing orders for restaurant:', payload.restaurantId);

    const allowed = await rateLimiterManager.acquire('getir');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('getir', async () => {
        const params = new URLSearchParams({
          offset: payload.offset.toString(),
          limit: payload.limit.toString(),
        });

        if (payload.status) params.append('status', payload.status);
        if (payload.since) params.append('since', payload.since);

        const response = await secureFetch(
          `${GETIR_API_BASE}/restaurants/${payload.restaurantId}/orders?${params}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'X-Partner-ID': this.partnerId,
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
    console.log('[Getir] Updating order status:', payload.orderId);

    const allowed = await rateLimiterManager.acquire('getir');
    if (!allowed) {
      return {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      };
    }

    try {
      const result = await circuitBreakerManager.execute('getir', async () => {
        const response = await secureFetch(
          `${GETIR_API_BASE}/orders/${payload.orderId}/status`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'X-Partner-ID': this.partnerId,
            },
            body: {
              status: payload.status,
              estimatedReadyTime: payload.estimatedReadyTime,
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
        `${GETIR_API_BASE}/health`,
        {
          method: 'GET',
          headers: {
            Authorization: this.getAuthHeader(),
            'X-Partner-ID': this.partnerId,
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
    console.log('[Getir] Shutting down connector...');
    this.initialized = false;
  }
}
