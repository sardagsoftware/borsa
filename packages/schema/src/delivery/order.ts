// ========================================
// DELIVERY ORDER SCHEMA
// Unified schema for delivery orders across platforms
// ========================================

import { z } from 'zod';

/**
 * Delivery Order Status
 */
export const DeliveryOrderStatusSchema = z.enum([
  'pending',          // Order received
  'confirmed',        // Restaurant confirmed
  'preparing',        // Food being prepared
  'ready',            // Ready for pickup
  'picked_up',        // Courier picked up
  'in_transit',       // On the way
  'delivered',        // Successfully delivered
  'cancelled',        // Cancelled
  'failed',           // Failed delivery
]);

export type DeliveryOrderStatus = z.infer<typeof DeliveryOrderStatusSchema>;

/**
 * Payment Method
 */
export const PaymentMethodSchema = z.enum([
  'credit_card',
  'debit_card',
  'cash',
  'wallet',
  'online_transfer',
]);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

/**
 * Payment Status
 */
export const PaymentStatusSchema = z.enum([
  'pending',
  'paid',
  'refunded',
  'failed',
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

/**
 * Delivery Address
 */
export const DeliveryAddressSchema = z.object({
  recipientName: z.string().min(1).max(200),
  phone: z.string().min(10).max(20),
  street: z.string().min(1),
  buildingNo: z.string().optional(),
  apartmentNo: z.string().optional(),
  floor: z.string().optional(),
  district: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().optional(),
  country: z.string().length(2).default('TR'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(500).optional(), // "Ring doorbell", "Leave at door"
});

export type DeliveryAddress = z.infer<typeof DeliveryAddressSchema>;

/**
 * Order Line Item
 */
export const OrderLineItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),

  // Options selected (e.g., "Large", "Extra cheese")
  options: z.array(
    z.object({
      groupName: z.string(),
      optionName: z.string(),
      priceModifier: z.number(),
    })
  ).default([]),

  specialInstructions: z.string().max(500).optional(),
  vendorData: z.record(z.any()).optional(),
});

export type OrderLineItem = z.infer<typeof OrderLineItemSchema>;

/**
 * Courier Info
 */
export const CourierInfoSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  phone: z.string().min(10).max(20).optional(),
  vehicle: z.string().optional(), // "bike", "scooter", "car"
  plateNumber: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).optional();

export type CourierInfo = z.infer<typeof CourierInfoSchema>;

/**
 * Delivery Order Schema
 * Unified model for delivery orders across platforms
 */
export const DeliveryOrderSchema = z.object({
  id: z.string(),
  vendorId: z.string(), // getir, yemeksepeti, trendyol_yemek
  vendorOrderId: z.string(), // External order ID from vendor

  // Restaurant
  restaurantId: z.string(),
  restaurantName: z.string(),

  // Order Details
  orderNumber: z.string(),
  status: DeliveryOrderStatusSchema,
  lineItems: z.array(OrderLineItemSchema).min(1),

  // Pricing
  subtotal: z.number().nonnegative(),
  deliveryFee: z.number().nonnegative(),
  serviceFee: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  total: z.number().positive(),
  currency: z.string().length(3).default('TRY'),

  // Payment
  paymentMethod: PaymentMethodSchema,
  paymentStatus: PaymentStatusSchema,
  paymentTransactionId: z.string().optional(),

  // Delivery
  deliveryAddress: DeliveryAddressSchema,
  estimatedDeliveryTime: z.string().datetime().optional(),
  actualDeliveryTime: z.string().datetime().optional(),

  // Courier
  courier: CourierInfoSchema,

  // Tracking
  statusHistory: z.array(
    z.object({
      status: DeliveryOrderStatusSchema,
      timestamp: z.string().datetime(),
      note: z.string().optional(),
    })
  ).default([]),

  // Customer
  customerId: z.string().optional(),
  customerPhone: z.string().optional(),

  // Special Instructions
  orderNotes: z.string().max(1000).optional(),

  // Vendor-specific data
  vendorData: z.record(z.any()).optional(),

  // Metadata
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export type DeliveryOrder = z.infer<typeof DeliveryOrderSchema>;

/**
 * Delivery Order Create Schema
 */
export const DeliveryOrderCreateSchema = DeliveryOrderSchema.omit({
  id: true,
  vendorOrderId: true,
  status: true,
  statusHistory: true,
  courier: true,
  actualDeliveryTime: true,
  createdAt: true,
  updatedAt: true,
});

export type DeliveryOrderCreate = z.infer<typeof DeliveryOrderCreateSchema>;

/**
 * Status Update Schema
 */
export const DeliveryOrderStatusUpdateSchema = z.object({
  orderId: z.string(),
  status: DeliveryOrderStatusSchema,
  note: z.string().max(500).optional(),
  courierInfo: CourierInfoSchema,
  estimatedDeliveryTime: z.string().datetime().optional(),
});

export type DeliveryOrderStatusUpdate = z.infer<typeof DeliveryOrderStatusUpdateSchema>;
