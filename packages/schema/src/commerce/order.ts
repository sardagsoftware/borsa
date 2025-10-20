// ========================================
// COMMERCE.ORDER - UNIFIED ORDER SCHEMA
// Harmonizes order data across e-commerce vendors
// ========================================

import { z } from 'zod';

/**
 * Order Status
 */
export const OrderStatusSchema = z.enum([
  'pending',          // Beklemede
  'confirmed',        // Onaylandı
  'processing',       // İşleniyor
  'shipped',          // Kargoya verildi
  'in_transit',       // Yolda
  'delivered',        // Teslim edildi
  'cancelled',        // İptal edildi
  'returned',         // İade edildi
  'refunded',         // Para iadesi yapıldı
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/**
 * Payment Status
 */
export const PaymentStatusSchema = z.enum([
  'pending',       // Beklemede
  'authorized',    // Yetkilendirildi
  'paid',          // Ödendi
  'failed',        // Başarısız
  'refunded',      // İade edildi
  'partially_refunded', // Kısmi iade
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

/**
 * Address
 */
export const AddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  company: z.string().optional(),
  address1: z.string(),
  address2: z.string().optional(),
  city: z.string(),
  province: z.string().optional(),
  country: z.string(),
  postalCode: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
});

export type Address = z.infer<typeof AddressSchema>;

/**
 * Order Line Item
 */
export const OrderLineItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  sku: z.string(),

  title: z.string(),
  variantTitle: z.string().optional(),
  brand: z.string().optional(),

  quantity: z.number().int().positive(),
  price: z.number().positive(),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),

  currency: z.string().length(3).default('TRY'),

  // Images
  imageUrl: z.string().url().optional(),

  // Vendor-specific
  vendorItemId: z.string().optional(),
});

export type OrderLineItem = z.infer<typeof OrderLineItemSchema>;

/**
 * Shipping Info
 */
export const ShippingInfoSchema = z.object({
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  shippedAt: z.string().datetime().optional(),
  estimatedDeliveryAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
});

export type ShippingInfo = z.infer<typeof ShippingInfoSchema>;

/**
 * Order (Unified Schema)
 */
export const OrderSchema = z.object({
  // Identity
  id: z.string(),
  externalId: z.string().optional(),     // Vendor-specific order ID
  orderNumber: z.string(),               // Human-readable order number

  // Status
  status: OrderStatusSchema,
  paymentStatus: PaymentStatusSchema,

  // Customer
  customerId: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  customerName: z.string(),

  // Addresses
  billingAddress: AddressSchema,
  shippingAddress: AddressSchema,

  // Line Items
  lineItems: z.array(OrderLineItemSchema).min(1),

  // Financial
  subtotal: z.number().nonnegative(),
  taxTotal: z.number().nonnegative().default(0),
  shippingTotal: z.number().nonnegative().default(0),
  discountTotal: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  currency: z.string().length(3).default('TRY'),

  // Discounts
  discountCodes: z.array(z.object({
    code: z.string(),
    amount: z.number().nonnegative(),
    type: z.enum(['percentage', 'fixed_amount']),
  })).optional(),

  // Shipping
  shippingInfo: ShippingInfoSchema.optional(),

  // Notes
  customerNote: z.string().optional(),
  internalNote: z.string().optional(),

  // Vendor-specific
  vendorId: z.string(),
  vendorData: z.record(z.any()).optional(),

  // Timestamps
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  confirmedAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

/**
 * Order List Filters
 */
export const OrderListFiltersSchema = z.object({
  status: OrderStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  customerId: z.string().optional(),
  orderNumber: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  vendorId: z.string().optional(),

  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'total']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type OrderListFilters = z.infer<typeof OrderListFiltersSchema>;

/**
 * Order Update Input
 */
export const OrderUpdateInputSchema = z.object({
  id: z.string(),
  status: OrderStatusSchema.optional(),
  internalNote: z.string().optional(),
  shippingInfo: ShippingInfoSchema.optional(),
  cancelReason: z.string().optional(),
});

export type OrderUpdateInput = z.infer<typeof OrderUpdateInputSchema>;
