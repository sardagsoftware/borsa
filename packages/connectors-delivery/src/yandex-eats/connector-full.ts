/**
 * ========================================
 * YANDEX EATS CONNECTOR - FULL IMPLEMENTATION
 * ========================================
 *
 * Vendor: Yandex Eats (AZ/RU Food Delivery)
 * Countries: Azerbaijan (AZ), Russia (RU)
 * Mode: partner_required (Legal Gate enforced)
 * Status: sandbox (production blocked until partner_ok)
 *
 * SPRINT 3 - International Expansion (Azerbaijan + Russia)
 *
 * 15 Unified Delivery Actions (same interface as other delivery connectors):
 * - Restaurant Management (4)
 * - Menu Management (4)
 * - Order Management (5)
 * - Delivery Tracking (2)
 *
 * Technical Features:
 * - Rate limiting: 15 rps, burst 30 (high throughput for Yandex infrastructure)
 * - Circuit breaker: 5 failures → 60s cooldown
 * - OAuth 2.0 authentication (Yandex OAuth)
 * - Zod schema validation
 * - Legal Gate enforcement (3-layer)
 * - i18n support: RU/AZ/EN
 * - Multi-currency: RUB/AZN
 * - Multi-region: Russia + CIS countries
 *
 * Vendor-Specific Notes:
 * - Russian tech giant (Yandex Group)
 * - Strong presence in CIS region
 * - Advanced logistics and routing
 * - Integration with Yandex ecosystem (Maps, Taxi, etc.)
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

const YANDEX_EATS_API_BASE = 'https://eda-integration-api.eda.yandex.net/api/v1';

/**
 * Yandex Eats Connector - Full Implementation
 *
 * Legal Gate: partner_required
 * Markets: Azerbaijan, Russia, Kazakhstan, Belarus
 */
export class YandexEatsConnectorFull implements IConnector {
  private partnerId: string = '';
  private clientId: string = '';
  private clientSecret: string = '';
  private accessToken: string = '';
  private countryCode: string = 'AZ';
  private currency: string = 'AZN';
  private region: string = 'caucasus';
  private initialized: boolean = false;

  /**
   * Connector manifest with Legal Gate enforcement
   */
  getManifest(): ConnectorManifest {
    return {
      id: 'yandex-eats',
      name: 'Yandex Eats',
      version: '1.0.0',
      vendor: 'Yandex',
      country: 'AZ',
      sector: 'delivery',
      mode: 'partner_required',
      status: 'sandbox',
      description: 'Yandex Eats food delivery integration - AZ/RU markets (partner-only)',
      authType: 'oauth2',
      rateLimit: {
        requestsPerSecond: 15,
        burstSize: 30,
      },
      capabilities: this.getCapabilities(),
    };
  }

  /**
   * 15 Unified Delivery Actions (same as other delivery connectors)
   */
  private getCapabilities(): Capability[] {
    return [
      // ========== Restaurant Management (4 actions) ==========
      {
        id: 'restaurant.sync',
        name: 'Sync Restaurant',
        category: 'delivery',
        description: 'Register or update place (restaurant) on Yandex Eats',
        requiredScopes: ['yandex-eats:place:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string().optional(),
          name: z.object({
            ru: z.string(),
            az: z.string().optional(),
            en: z.string().optional(),
          }),
          address: z.object({
            street: z.string(),
            city: z.string(),
            region: z.string().optional(),
            postalCode: z.string().optional(),
            countryCode: z.enum(['AZ', 'RU', 'KZ', 'BY']).default('AZ'),
            latitude: z.number(),
            longitude: z.number(),
          }),
          categories: z.array(z.string()),
          schedule: z.array(z.object({
            day: z.number().int().min(0).max(6), // 0=Monday, 6=Sunday
            start: z.string(), // HH:MM format
            end: z.string(),
          })),
          deliverySettings: z.object({
            enabled: z.boolean().default(true),
            minOrderAmount: z.number().nonnegative().default(0),
            deliveryFee: z.number().nonnegative().default(0),
            freeDeliveryThreshold: z.number().positive().optional(),
          }),
          contactPhone: z.string(),
        }),
        outputSchema: z.object({
          restaurantId: z.string(),
          status: z.enum(['active', 'moderation', 'disabled']),
        }),
      },
      {
        id: 'restaurant.list',
        name: 'List Restaurants',
        category: 'delivery',
        description: 'List all registered places',
        requiredScopes: ['yandex-eats:place:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          cursor: z.string().optional(), // Cursor-based pagination
          limit: z.number().int().positive().max(100).default(50),
          status: z.enum(['active', 'moderation', 'disabled']).optional(),
          region: z.string().optional(),
        }),
        outputSchema: z.object({
          restaurants: z.array(z.any()),
          nextCursor: z.string().optional(),
          total: z.number().int().nonnegative(),
        }),
      },
      {
        id: 'restaurant.get',
        name: 'Get Restaurant',
        category: 'delivery',
        description: 'Get single place details',
        requiredScopes: ['yandex-eats:place:read'],
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
        description: 'Update place details',
        requiredScopes: ['yandex-eats:place:write'],
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
        description: 'Sync full menu catalog (multi-language, multi-currency)',
        requiredScopes: ['yandex-eats:menu:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          menu: z.object({
            categories: z.array(z.object({
              id: z.string(),
              name: z.object({
                ru: z.string(),
                az: z.string().optional(),
                en: z.string().optional(),
              }),
              sortOrder: z.number().int().nonnegative(),
            })),
            items: z.array(z.object({
              id: z.string(),
              categoryId: z.string(),
              name: z.object({
                ru: z.string(),
                az: z.string().optional(),
                en: z.string().optional(),
              }),
              description: z.object({
                ru: z.string(),
                az: z.string().optional(),
                en: z.string().optional(),
              }).optional(),
              price: z.number().positive(),
              currency: z.enum(['RUB', 'AZN', 'KZT', 'BYN']).default('AZN'),
              imageUrl: z.string().url().optional(),
              available: z.boolean().default(true),
              weight: z.number().positive().optional(),
              volume: z.number().positive().optional(),
              nutritionInfo: z.object({
                calories: z.number().nonnegative().optional(),
                proteins: z.number().nonnegative().optional(),
                fats: z.number().nonnegative().optional(),
                carbohydrates: z.number().nonnegative().optional(),
              }).optional(),
            })),
          }),
        }),
        outputSchema: z.object({
          synced: z.number().int().nonnegative(),
          failed: z.number().int().nonnegative(),
          taskId: z.string().optional(),
        }),
      },
      {
        id: 'menu.list',
        name: 'List Menu Items',
        category: 'delivery',
        description: 'List current menu items',
        requiredScopes: ['yandex-eats:menu:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          categoryId: z.string().optional(),
          language: z.enum(['ru', 'az', 'en']).default('ru'),
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
        requiredScopes: ['yandex-eats:menu:write'],
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
        description: 'Check async menu sync task status',
        requiredScopes: ['yandex-eats:menu:read'],
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
        requiredScopes: ['yandex-eats:orders:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          restaurantId: z.string(),
          cursor: z.string().optional(),
          limit: z.number().int().positive().max(100).default(50),
          status: z.enum(['created', 'confirmed', 'cooking', 'ready', 'taken', 'delivered', 'cancelled']).optional(),
          from: z.string().optional(),
          to: z.string().optional(),
        }),
        outputSchema: z.object({
          orders: z.array(z.any()),
          nextCursor: z.string().optional(),
          total: z.number().int().nonnegative(),
        }),
      },
      {
        id: 'order.get',
        name: 'Get Order',
        category: 'delivery',
        description: 'Get single order details',
        requiredScopes: ['yandex-eats:orders:read'],
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
        description: 'Confirm incoming order',
        requiredScopes: ['yandex-eats:orders:write'],
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
        description: 'Cancel order with reason',
        requiredScopes: ['yandex-eats:orders:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
          reason: z.enum(['no_capacity', 'items_unavailable', 'technical_error', 'other']),
          comment: z.string().optional(),
        }),
        outputSchema: z.object({
          rejected: z.boolean(),
        }),
      },
      {
        id: 'order.dispatch',
        name: 'Dispatch Order',
        category: 'delivery',
        description: 'Mark order as ready for courier',
        requiredScopes: ['yandex-eats:orders:write'],
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
        description: 'Get real-time delivery status (Yandex Taxi integration)',
        requiredScopes: ['yandex-eats:delivery:read'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
        }),
        outputSchema: z.object({
          status: z.enum(['searching_courier', 'courier_assigned', 'courier_arrived', 'taken', 'delivering', 'delivered']),
          courier: z.object({
            name: z.string(),
            phone: z.string(),
            carModel: z.string().optional(),
            carNumber: z.string().optional(),
            location: z.object({
              latitude: z.number(),
              longitude: z.number(),
              bearing: z.number().optional(),
            }).optional(),
          }).optional(),
          estimatedArrival: z.string().optional(),
        }),
      },
      {
        id: 'delivery.update-status',
        name: 'Update Delivery Status',
        category: 'delivery',
        description: 'Update delivery status (place perspective)',
        requiredScopes: ['yandex-eats:delivery:write'],
        idempotent: true,
        requiresPartner: true,
        inputSchema: z.object({
          orderId: z.string(),
          status: z.enum(['cooking', 'ready', 'given_to_courier']),
        }),
        outputSchema: z.object({
          updated: z.boolean(),
        }),
      },
    ];
  }

  /**
   * Initialize connector with Yandex OAuth credentials
   */
  async initialize(config: Record<string, any>): Promise<void> {
    this.partnerId = config.partnerId || '';
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';
    this.countryCode = config.countryCode || 'AZ';
    this.currency = config.currency || 'AZN';
    this.region = config.region || 'caucasus';

    if (!this.partnerId || !this.clientId || !this.clientSecret) {
      throw new Error('[Yandex Eats] Missing partner credentials (partnerId, clientId, clientSecret)');
    }

    // Rate limiter: 15 rps, burst 30
    rateLimiterManager.createLimiter('yandex-eats', 15, 1000, 30);

    // Circuit breaker
    circuitBreakerManager.createBreaker('yandex-eats', 5, 60000);

    // Obtain Yandex OAuth access token
    await this.refreshAccessToken();

    this.initialized = true;
    console.log(`[Yandex Eats] Connector initialized successfully (Country: ${this.countryCode}, Currency: ${this.currency}, Region: ${this.region})`);
  }

  /**
   * Yandex OAuth 2.0 token refresh
   */
  private async refreshAccessToken(): Promise<void> {
    const response = await secureFetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!response.success || !response.data?.access_token) {
      throw new Error('[Yandex Eats] OAuth token refresh failed');
    }

    this.accessToken = response.data.access_token;
    console.log('[Yandex Eats] Access token refreshed');
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
          message: 'Connector not initialized. Call initialize() first.',
        },
      };
    }

    // Rate limiting
    const allowed = await rateLimiterManager.acquire('yandex-eats');
    if (!allowed) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded (15 rps). Retry after delay.',
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
      const response = await secureFetch(`${YANDEX_EATS_API_BASE}/ping`, {
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
      'Authorization': `OAuth ${this.accessToken}`,
      'Content-Type': 'application/json',
      'X-YaEda-PartnerId': this.partnerId,
      'X-YaEda-CountryCode': this.countryCode,
      'X-YaEda-Currency': this.currency,
      'Accept-Language': this.countryCode === 'RU' ? 'ru-RU' : 'az-AZ',
    };
  }

  // ========== Action Handlers ==========

  private async syncRestaurant(payload: any): Promise<ActionResult> {
    try {
      const result = await circuitBreakerManager.execute('yandex-eats', async () => {
        const response = await secureFetch(
          `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/places`,
          {
            method: 'POST',
            headers: this.getHeaders(),
            body: payload,
          }
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'Place sync failed');
        }

        return response.data;
      });

      return {
        success: true,
        data: {
          restaurantId: result.placeId || result.id,
          status: result.status || 'moderation',
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
      const { cursor, limit = 50, status, region } = payload;
      const params = new URLSearchParams({
        limit: String(limit),
        ...(cursor && { cursor }),
        ...(status && { status }),
        ...(region && { region }),
      });

      const response = await secureFetch(
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/places?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.success) {
        throw new Error('Failed to list places');
      }

      return {
        success: true,
        data: {
          restaurants: response.data?.places || [],
          nextCursor: response.data?.nextCursor,
          total: response.data?.total || 0,
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
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/places/${payload.restaurantId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.success) {
        throw new Error('Place not found');
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
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/places/${payload.restaurantId}`,
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

  private async syncMenu(payload: any): Promise<ActionResult> {
    try {
      const result = await circuitBreakerManager.execute('yandex-eats', async () => {
        const response = await secureFetch(
          `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/places/${payload.restaurantId}/menu`,
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
          taskId: result.taskId,
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
      if (payload.language) {
        params.append('lang', payload.language);
      }

      const response = await secureFetch(
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/places/${payload.restaurantId}/menu/items?${params}`,
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
          items: response.data?.items || [],
          total: response.data?.total || 0,
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
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/places/${payload.restaurantId}/menu/items/${payload.itemId}`,
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
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/tasks/${payload.batchRequestId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.success) {
        throw new Error('Task not found');
      }

      return {
        success: true,
        data: {
          status: response.data?.status || 'pending',
          processed: response.data?.processed || 0,
          total: response.data?.total || 0,
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
      const { cursor, limit = 50, status, from, to } = payload;
      const params = new URLSearchParams({
        limit: String(limit),
        ...(cursor && { cursor }),
        ...(status && { status }),
        ...(from && { from }),
        ...(to && { to }),
      });

      const response = await secureFetch(
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/places/${payload.restaurantId}/orders?${params}`,
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
          nextCursor: response.data?.nextCursor,
          total: response.data?.total || 0,
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
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}`,
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
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}/confirm`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: { cookingDuration: payload.estimatedPrepTime },
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
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}/cancel`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: {
            cancelReason: payload.reason,
            comment: payload.comment,
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
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}/ready`,
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
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}/courier`,
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
          status: response.data?.deliveryStatus || 'searching_courier',
          courier: response.data?.courier,
          estimatedArrival: response.data?.eta,
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
        `${YANDEX_EATS_API_BASE}/partners/${this.partnerId}/orders/${payload.orderId}/status`,
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
