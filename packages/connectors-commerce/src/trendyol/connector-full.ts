// ========================================
// TRENDYOL CONNECTOR - FULL 23 ACTIONS
// Official Seller API Integration
// White-Hat: Resmi API kullanımı, TOS compliant
// SPRINT 1: TR Commerce Core
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

const TRENDYOL_API_BASE = 'https://api.trendyol.com/sapigw';

/**
 * Trendyol Connector - Full Implementation (23 Actions)
 * SPRINT 1 Deliverable
 */
export class TrendyolConnectorFull implements IConnector {
  private apiKey: string = '';
  private apiSecret: string = '';
  private supplierId: string = '';
  private initialized: boolean = false;

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
   * 23 Unified Commerce Actions
   */
  private getCapabilities(): Capability[] {
    return [
      // ========== Product Management (8) ==========
      {
        id: 'product.sync',
        name: 'Sync Products',
        description: 'Bulk sync product catalog',
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
          batchRequestId: z.string().optional(),
        }),
      },
      {
        id: 'product.list',
        name: 'List Products',
        description: 'Get product list with filters',
        category: 'commerce',
        requiredScopes: ['trendyol:catalog:read'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(100).default(50),
          approved: z.boolean().optional(),
        }),
        outputSchema: z.object({
          products: z.array(z.any()),
          total: z.number(),
          page: z.number(),
        }),
      },
      {
        id: 'product.get',
        name: 'Get Product',
        description: 'Get single product details',
        category: 'commerce',
        requiredScopes: ['trendyol:catalog:read'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          productId: z.string(),
        }),
        outputSchema: z.object({
          product: z.any(),
        }),
      },
      {
        id: 'product.update',
        name: 'Update Product',
        description: 'Update product details',
        category: 'commerce',
        requiredScopes: ['trendyol:catalog:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          productId: z.string(),
          updates: z.any(),
        }),
        outputSchema: z.object({
          updated: z.boolean(),
          batchRequestId: z.string().optional(),
        }),
      },
      {
        id: 'product.delete',
        name: 'Delete Product',
        description: 'Delete/delist product',
        category: 'commerce',
        requiredScopes: ['trendyol:catalog:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          productId: z.string(),
        }),
        outputSchema: z.object({
          deleted: z.boolean(),
        }),
      },
      {
        id: 'product.approve',
        name: 'Approve Products',
        description: 'Approve pending products',
        category: 'commerce',
        requiredScopes: ['trendyol:catalog:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          productIds: z.array(z.string()),
        }),
        outputSchema: z.object({
          approved: z.number(),
          failed: z.number(),
        }),
      },
      {
        id: 'product.reject',
        name: 'Reject Products',
        description: 'Reject pending products',
        category: 'commerce',
        requiredScopes: ['trendyol:catalog:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          productIds: z.array(z.string()),
          reason: z.string(),
        }),
        outputSchema: z.object({
          rejected: z.number(),
        }),
      },
      {
        id: 'product.batch-status',
        name: 'Check Batch Status',
        description: 'Check async batch operation status',
        category: 'commerce',
        requiredScopes: ['trendyol:catalog:read'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          batchRequestId: z.string(),
        }),
        outputSchema: z.object({
          status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
          items: z.array(z.any()).optional(),
        }),
      },

      // ========== Inventory Management (5) ==========
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
          batchRequestId: z.string().optional(),
        }),
      },
      {
        id: 'inventory.list',
        name: 'List Inventory',
        description: 'Get current inventory status',
        category: 'commerce',
        requiredScopes: ['trendyol:inventory:read'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(100).default(50),
        }),
        outputSchema: z.object({
          items: z.array(z.any()),
          total: z.number(),
        }),
      },
      {
        id: 'inventory.bulk-update',
        name: 'Bulk Update Inventory',
        description: 'Bulk stock update (large batches)',
        category: 'commerce',
        requiredScopes: ['trendyol:inventory:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          items: z.array(z.any()),
        }),
        outputSchema: z.object({
          batchRequestId: z.string(),
          itemCount: z.number(),
        }),
      },
      {
        id: 'price.update',
        name: 'Update Pricing',
        description: 'Update product pricing',
        category: 'commerce',
        requiredScopes: ['trendyol:inventory:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          items: z.array(
            z.object({
              barcode: z.string(),
              salePrice: z.number().positive(),
              listPrice: z.number().positive(),
            })
          ),
        }),
        outputSchema: z.object({
          updated: z.number(),
          failed: z.number(),
        }),
      },
      {
        id: 'price.optimize',
        name: 'Optimize Pricing',
        description: 'AI-powered price optimization',
        category: 'commerce',
        requiredScopes: ['trendyol:inventory:write'],
        idempotent: false,
        requiresPartner: false,
        inputSchema: z.object({
          strategy: z.enum(['elasticity', 'match', 'ai']),
          productIds: z.array(z.string()),
          guardrails: z
            .object({
              minMargin: z.number().optional(),
              maxDiscount: z.number().optional(),
            })
            .optional(),
        }),
        outputSchema: z.object({
          recommendations: z.array(z.any()),
          applied: z.number(),
        }),
      },

      // ========== Order Management (7) ==========
      {
        id: 'order.list',
        name: 'List Orders',
        description: 'Get orders with filters',
        category: 'commerce',
        requiredScopes: ['trendyol:orders:read'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          status: z.string().optional(),
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
        id: 'order.get',
        name: 'Get Order',
        description: 'Get order details',
        category: 'commerce',
        requiredScopes: ['trendyol:orders:read'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          orderId: z.string(),
        }),
        outputSchema: z.object({
          order: z.any(),
        }),
      },
      {
        id: 'order.update-status',
        name: 'Update Order Status',
        description: 'Update order status',
        category: 'commerce',
        requiredScopes: ['trendyol:orders:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          orderId: z.string(),
          status: z.enum(['SHIPPED', 'DELIVERED', 'CANCELLED']),
        }),
        outputSchema: z.object({
          updated: z.boolean(),
        }),
      },
      {
        id: 'order.ship',
        name: 'Ship Order',
        description: 'Mark order as shipped',
        category: 'commerce',
        requiredScopes: ['trendyol:orders:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          orderId: z.string(),
          trackingNumber: z.string(),
          carrier: z.string(),
        }),
        outputSchema: z.object({
          shipped: z.boolean(),
        }),
      },
      {
        id: 'order.cancel',
        name: 'Cancel Order',
        description: 'Cancel order',
        category: 'commerce',
        requiredScopes: ['trendyol:orders:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          orderId: z.string(),
          reason: z.string(),
        }),
        outputSchema: z.object({
          cancelled: z.boolean(),
        }),
      },
      {
        id: 'order.refund',
        name: 'Process Refund',
        description: 'Process order refund',
        category: 'commerce',
        requiredScopes: ['trendyol:orders:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          orderId: z.string(),
          amount: z.number().positive(),
          reason: z.string(),
        }),
        outputSchema: z.object({
          refunded: z.boolean(),
          refundId: z.string().optional(),
        }),
      },
      {
        id: 'order.invoice',
        name: 'Generate Invoice',
        description: 'Generate order invoice',
        category: 'commerce',
        requiredScopes: ['trendyol:orders:read'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          orderId: z.string(),
        }),
        outputSchema: z.object({
          invoiceUrl: z.string(),
          invoiceNumber: z.string(),
        }),
      },

      // ========== Messaging (3) ==========
      {
        id: 'message.list',
        name: 'List Messages',
        description: 'Get customer messages',
        category: 'commerce',
        requiredScopes: ['trendyol:messages:read'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          page: z.number().int().positive().default(1),
          size: z.number().int().positive().max(100).default(50),
          unreadOnly: z.boolean().optional(),
        }),
        outputSchema: z.object({
          messages: z.array(z.any()),
          total: z.number(),
          unread: z.number(),
        }),
      },
      {
        id: 'message.send',
        name: 'Send Message',
        description: 'Send message to customer',
        category: 'commerce',
        requiredScopes: ['trendyol:messages:write'],
        idempotent: false,
        requiresPartner: false,
        inputSchema: z.object({
          orderId: z.string(),
          content: z.string().min(1).max(1000),
        }),
        outputSchema: z.object({
          sent: z.boolean(),
          messageId: z.string().optional(),
        }),
      },
      {
        id: 'message.read',
        name: 'Mark as Read',
        description: 'Mark messages as read',
        category: 'commerce',
        requiredScopes: ['trendyol:messages:write'],
        idempotent: true,
        requiresPartner: false,
        inputSchema: z.object({
          messageIds: z.array(z.string()),
        }),
        outputSchema: z.object({
          marked: z.number(),
        }),
      },
    ];
  }

  async initialize(credentials: Record<string, any>): Promise<void> {
    console.log('[Trendyol] Initializing connector (Full 23 Actions)...');

    this.apiKey = credentials.TRENDYOL_API_KEY || '';
    this.apiSecret = credentials.TRENDYOL_API_SECRET || '';
    this.supplierId = credentials.TRENDYOL_SUPPLIER_ID || '';

    if (!this.apiKey || !this.apiSecret || !this.supplierId) {
      throw new Error('Missing Trendyol credentials');
    }

    rateLimiterManager.createLimiter('trendyol', 10, 1000, 20);
    circuitBreakerManager.createBreaker('trendyol', {
      failureThreshold: 5,
      resetTimeout: 60000,
      successThreshold: 2,
      monitoringPeriod: 10000,
    });

    this.initialized = true;
    console.log('[Trendyol] ✅ Connector initialized (23 actions ready)');
  }

  async executeAction(context: ActionContext): Promise<ActionResult> {
    if (!this.initialized) {
      return {
        success: false,
        error: { code: 'NOT_INITIALIZED', message: 'Connector not initialized' },
      };
    }

    const { action, payload } = context;

    // Route to handlers (23 actions)
    const handlers: Record<string, (p: any) => Promise<ActionResult>> = {
      // Product Management
      'product.sync': this.syncProducts.bind(this),
      'product.list': this.listProducts.bind(this),
      'product.get': this.getProduct.bind(this),
      'product.update': this.updateProduct.bind(this),
      'product.delete': this.deleteProduct.bind(this),
      'product.approve': this.approveProducts.bind(this),
      'product.reject': this.rejectProducts.bind(this),
      'product.batch-status': this.checkBatchStatus.bind(this),

      // Inventory Management
      'inventory.update': this.updateInventory.bind(this),
      'inventory.list': this.listInventory.bind(this),
      'inventory.bulk-update': this.bulkUpdateInventory.bind(this),
      'price.update': this.updatePrice.bind(this),
      'price.optimize': this.optimizePrice.bind(this),

      // Order Management
      'order.list': this.listOrders.bind(this),
      'order.get': this.getOrder.bind(this),
      'order.update-status': this.updateOrderStatus.bind(this),
      'order.ship': this.shipOrder.bind(this),
      'order.cancel': this.cancelOrder.bind(this),
      'order.refund': this.refundOrder.bind(this),
      'order.invoice': this.generateInvoice.bind(this),

      // Messaging
      'message.list': this.listMessages.bind(this),
      'message.send': this.sendMessage.bind(this),
      'message.read': this.markMessagesRead.bind(this),
    };

    const handler = handlers[action];
    if (!handler) {
      return {
        success: false,
        error: { code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` },
      };
    }

    return await handler(payload);
  }

  // ========== Product Management Handlers ==========

  private async syncProducts(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products`, {
          method: 'POST',
          headers: { Authorization: this.getAuthHeader() },
          body: { items: payload.products },
        });
        if (!response.success) throw new Error(response.error?.message || 'API call failed');
        return response.data;
      });

      return {
        success: true,
        data: { synced: payload.products.length, failed: 0, batchRequestId: result.batchRequestId },
      };
    } catch (error: any) {
      return { success: false, error: { code: 'SYNC_FAILED', message: error.message } };
    }
  }

  private async listProducts(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const params = `page=${payload.page}&size=${payload.size}${payload.approved !== undefined ? `&approved=${payload.approved}` : ''}`;
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products?${params}`, {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        });
        if (!response.success) throw new Error(response.error?.message || 'API call failed');
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
      return { success: false, error: { code: 'LIST_FAILED', message: error.message } };
    }
  }

  private async getProduct(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products/${payload.productId}`, {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        });
        if (!response.success) throw new Error(response.error?.message || 'Product not found');
        return response.data;
      });

      return { success: true, data: { product: result } };
    } catch (error: any) {
      return { success: false, error: { code: 'GET_PRODUCT_FAILED', message: error.message } };
    }
  }

  private async updateProduct(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products/${payload.productId}`, {
          method: 'PUT',
          headers: { Authorization: this.getAuthHeader() },
          body: payload.updates,
        });
        if (!response.success) throw new Error(response.error?.message || 'Update failed');
        return response.data;
      });

      return { success: true, data: { updated: true, batchRequestId: result.batchRequestId } };
    } catch (error: any) {
      return { success: false, error: { code: 'UPDATE_FAILED', message: error.message } };
    }
  }

  private async deleteProduct(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products/${payload.productId}`, {
          method: 'DELETE',
          headers: { Authorization: this.getAuthHeader() },
        });
        if (!response.success) throw new Error(response.error?.message || 'Delete failed');
        return response.data;
      });

      return { success: true, data: { deleted: true } };
    } catch (error: any) {
      return { success: false, error: { code: 'DELETE_FAILED', message: error.message } };
    }
  }

  private async approveProducts(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products/approve`, {
          method: 'POST',
          headers: { Authorization: this.getAuthHeader() },
          body: { productIds: payload.productIds },
        });
        if (!response.success) throw new Error(response.error?.message || 'Approve failed');
        return response.data;
      });

      return { success: true, data: { approved: payload.productIds.length, failed: 0 } };
    } catch (error: any) {
      return { success: false, error: { code: 'APPROVE_FAILED', message: error.message } };
    }
  }

  private async rejectProducts(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products/reject`, {
          method: 'POST',
          headers: { Authorization: this.getAuthHeader() },
          body: { productIds: payload.productIds, reason: payload.reason },
        });
        if (!response.success) throw new Error(response.error?.message || 'Reject failed');
        return response.data;
      });

      return { success: true, data: { rejected: payload.productIds.length } };
    } catch (error: any) {
      return { success: false, error: { code: 'REJECT_FAILED', message: error.message } };
    }
  }

  private async checkBatchStatus(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products/batch-requests/${payload.batchRequestId}`, {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        });
        if (!response.success) throw new Error(response.error?.message || 'Batch status check failed');
        return response.data;
      });

      return { success: true, data: { status: result.status, items: result.items } };
    } catch (error: any) {
      return { success: false, error: { code: 'BATCH_STATUS_FAILED', message: error.message } };
    }
  }

  // ========== Inventory Management Handlers ==========

  private async updateInventory(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products/price-and-inventory`, {
          method: 'POST',
          headers: { Authorization: this.getAuthHeader() },
          body: { items: payload.items },
        });
        if (!response.success) throw new Error(response.error?.message || 'Inventory update failed');
        return response.data;
      });

      return { success: true, data: { updated: payload.items.length, failed: 0, batchRequestId: result.batchRequestId } };
    } catch (error: any) {
      return { success: false, error: { code: 'INVENTORY_UPDATE_FAILED', message: error.message } };
    }
  }

  private async listInventory(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products/price-and-inventory?page=${payload.page}&size=${payload.size}`, {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        });
        if (!response.success) throw new Error(response.error?.message || 'List inventory failed');
        return response.data;
      });

      return { success: true, data: { items: result.content || [], total: result.totalElements || 0 } };
    } catch (error: any) {
      return { success: false, error: { code: 'LIST_INVENTORY_FAILED', message: error.message } };
    }
  }

  private async bulkUpdateInventory(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products/price-and-inventory/bulk`, {
          method: 'POST',
          headers: { Authorization: this.getAuthHeader() },
          body: { items: payload.items },
        });
        if (!response.success) throw new Error(response.error?.message || 'Bulk update failed');
        return response.data;
      });

      return { success: true, data: { batchRequestId: result.batchRequestId, itemCount: payload.items.length } };
    } catch (error: any) {
      return { success: false, error: { code: 'BULK_UPDATE_FAILED', message: error.message } };
    }
  }

  private async updatePrice(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products/price`, {
          method: 'POST',
          headers: { Authorization: this.getAuthHeader() },
          body: { items: payload.items },
        });
        if (!response.success) throw new Error(response.error?.message || 'Price update failed');
        return response.data;
      });

      return { success: true, data: { updated: payload.items.length, failed: 0 } };
    } catch (error: any) {
      return { success: false, error: { code: 'PRICE_UPDATE_FAILED', message: error.message } };
    }
  }

  private async optimizePrice(payload: any): Promise<ActionResult> {
    // AI-powered price optimization (placeholder for SPRINT 5 - Lydian-IQ Reasoner)
    console.log('[Trendyol] Price optimization strategy:', payload.strategy);

    return {
      success: true,
      data: {
        recommendations: [
          // Mock recommendations (will be replaced with real AI in SPRINT 5)
          { productId: 'mock-1', currentPrice: 100, suggestedPrice: 95, reason: 'Market competition' },
        ],
        applied: 0, // Not applied in SPRINT 1
      },
    };
  }

  // ========== Order Management Handlers ==========

  private async listOrders(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const params = new URLSearchParams({
          page: payload.page.toString(),
          size: payload.size.toString(),
        });
        if (payload.startDate) params.append('startDate', payload.startDate);
        if (payload.endDate) params.append('endDate', payload.endDate);
        if (payload.status) params.append('status', payload.status);

        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/orders?${params}`, {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        });
        if (!response.success) throw new Error(response.error?.message || 'List orders failed');
        return response.data;
      });

      return {
        success: true,
        data: { orders: result.content || [], total: result.totalElements || 0, page: result.page || payload.page },
      };
    } catch (error: any) {
      return { success: false, error: { code: 'LIST_ORDERS_FAILED', message: error.message } };
    }
  }

  private async getOrder(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/orders/${payload.orderId}`, {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        });
        if (!response.success) throw new Error(response.error?.message || 'Order not found');
        return response.data;
      });

      return { success: true, data: { order: result } };
    } catch (error: any) {
      return { success: false, error: { code: 'GET_ORDER_FAILED', message: error.message } };
    }
  }

  private async updateOrderStatus(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/orders/${payload.orderId}/status`, {
          method: 'PUT',
          headers: { Authorization: this.getAuthHeader() },
          body: { status: payload.status },
        });
        if (!response.success) throw new Error(response.error?.message || 'Status update failed');
        return response.data;
      });

      return { success: true, data: { updated: true } };
    } catch (error: any) {
      return { success: false, error: { code: 'UPDATE_STATUS_FAILED', message: error.message } };
    }
  }

  private async shipOrder(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/orders/${payload.orderId}/ship`, {
          method: 'POST',
          headers: { Authorization: this.getAuthHeader() },
          body: { trackingNumber: payload.trackingNumber, carrier: payload.carrier },
        });
        if (!response.success) throw new Error(response.error?.message || 'Ship order failed');
        return response.data;
      });

      return { success: true, data: { shipped: true } };
    } catch (error: any) {
      return { success: false, error: { code: 'SHIP_ORDER_FAILED', message: error.message } };
    }
  }

  private async cancelOrder(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/orders/${payload.orderId}/cancel`, {
          method: 'POST',
          headers: { Authorization: this.getAuthHeader() },
          body: { reason: payload.reason },
        });
        if (!response.success) throw new Error(response.error?.message || 'Cancel order failed');
        return response.data;
      });

      return { success: true, data: { cancelled: true } };
    } catch (error: any) {
      return { success: false, error: { code: 'CANCEL_ORDER_FAILED', message: error.message } };
    }
  }

  private async refundOrder(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/orders/${payload.orderId}/refund`, {
          method: 'POST',
          headers: { Authorization: this.getAuthHeader() },
          body: { amount: payload.amount, reason: payload.reason },
        });
        if (!response.success) throw new Error(response.error?.message || 'Refund failed');
        return response.data;
      });

      return { success: true, data: { refunded: true, refundId: result.refundId } };
    } catch (error: any) {
      return { success: false, error: { code: 'REFUND_FAILED', message: error.message } };
    }
  }

  private async generateInvoice(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/orders/${payload.orderId}/invoice`, {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        });
        if (!response.success) throw new Error(response.error?.message || 'Invoice generation failed');
        return response.data;
      });

      return { success: true, data: { invoiceUrl: result.invoiceUrl, invoiceNumber: result.invoiceNumber } };
    } catch (error: any) {
      return { success: false, error: { code: 'INVOICE_FAILED', message: error.message } };
    }
  }

  // ========== Messaging Handlers ==========

  private async listMessages(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const params = `page=${payload.page}&size=${payload.size}${payload.unreadOnly ? '&unreadOnly=true' : ''}`;
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/questions?${params}`, {
          method: 'GET',
          headers: { Authorization: this.getAuthHeader() },
        });
        if (!response.success) throw new Error(response.error?.message || 'List messages failed');
        return response.data;
      });

      return {
        success: true,
        data: {
          messages: result.content || [],
          total: result.totalElements || 0,
          unread: result.unreadCount || 0,
        },
      };
    } catch (error: any) {
      return { success: false, error: { code: 'LIST_MESSAGES_FAILED', message: error.message } };
    }
  }

  private async sendMessage(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      const result = await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/questions/answer`, {
          method: 'POST',
          headers: { Authorization: this.getAuthHeader() },
          body: { orderId: payload.orderId, text: payload.content },
        });
        if (!response.success) throw new Error(response.error?.message || 'Send message failed');
        return response.data;
      });

      return { success: true, data: { sent: true, messageId: result.messageId } };
    } catch (error: any) {
      return { success: false, error: { code: 'SEND_MESSAGE_FAILED', message: error.message } };
    }
  }

  private async markMessagesRead(payload: any): Promise<ActionResult> {
    const allowed = await rateLimiterManager.acquire('trendyol');
    if (!allowed) return { success: false, error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } };

    try {
      await circuitBreakerManager.execute('trendyol', async () => {
        const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/questions/read`, {
          method: 'POST',
          headers: { Authorization: this.getAuthHeader() },
          body: { messageIds: payload.messageIds },
        });
        if (!response.success) throw new Error(response.error?.message || 'Mark read failed');
        return response.data;
      });

      return { success: true, data: { marked: payload.messageIds.length } };
    } catch (error: any) {
      return { success: false, error: { code: 'MARK_READ_FAILED', message: error.message } };
    }
  }

  // ========== Utility Methods ==========

  private getAuthHeader(): string {
    const credentials = `${this.apiKey}:${this.apiSecret}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    if (!this.initialized) return { healthy: false, message: 'Not initialized' };

    try {
      const response = await secureFetch(`${TRENDYOL_API_BASE}/suppliers/${this.supplierId}/products?page=0&size=1`, {
        method: 'GET',
        headers: { Authorization: this.getAuthHeader() },
        timeout: 5000,
        retries: 1,
      });

      return { healthy: response.success, message: response.success ? 'OK' : response.error?.message };
    } catch (error: any) {
      return { healthy: false, message: error.message };
    }
  }

  async shutdown(): Promise<void> {
    console.log('[Trendyol] Shutting down connector...');
    this.initialized = false;
  }
}
