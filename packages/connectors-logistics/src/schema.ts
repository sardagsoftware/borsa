/**
 * LYDIAN-IQ LOGISTICS SCHEMA
 *
 * Purpose: Unified schema for cargo/shipping operations across multiple carriers
 * Compliance: KVKK/GDPR (PII fields: name, phone, address - purpose:shipment)
 * Vendors: Aras, Yurtiçi, UPS, Hepsijet, MNG, Sürat
 *
 * Features:
 * - Type-safe Zod schemas
 * - Idempotent operations
 * - Multi-carrier support
 * - Webhook tracking
 * - Label generation (PDF/ZPL)
 */

import { z } from "zod";

/**
 * Supported logistics vendors
 */
export const LogisticsVendor = z.enum([
  "aras",
  "yurtici",
  "ups",
  "hepsijet",
  "mng",
  "surat"
]);

export type LogisticsVendor = z.infer<typeof LogisticsVendor>;

/**
 * Shipment status (unified across all carriers)
 */
export const ShipmentStatus = z.enum([
  "created",         // Shipment created, awaiting label
  "label_ready",     // Label generated, ready for pickup
  "picked_up",       // Picked up by carrier
  "in_transit",      // In transit to destination
  "out_for_delivery",// Out for delivery
  "delivered",       // Delivered to recipient
  "exception",       // Exception (delayed, damaged, etc.)
  "canceled"         // Canceled by sender
]);

export type ShipmentStatus = z.infer<typeof ShipmentStatus>;

/**
 * Dimensions and weight
 * Compliance: KVKK - purpose:shipment (for pricing calculation)
 */
export const Dimensions = z.object({
  length_cm: z.number().positive().max(200).describe("Length in centimeters"),
  width_cm: z.number().positive().max(200).describe("Width in centimeters"),
  height_cm: z.number().positive().max(200).describe("Height in centimeters"),
  weight_kg: z.number().positive().max(100).describe("Weight in kilograms")
});

export type Dimensions = z.infer<typeof Dimensions>;

/**
 * Address schema
 * Compliance: KVKK/GDPR - PII fields (name, phone, address)
 * Purpose tag: "shipment" (7-day retention)
 *
 * IMPORTANT: All address fields are tagged for redaction after 7 days
 */
export const Address = z.object({
  // PII fields (purpose:shipment, retention:7d)
  name: z.string().min(2).max(100).describe("Recipient/sender name (PII)"),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/).describe("Phone number (PII)"),
  line1: z.string().min(5).max(200).describe("Address line 1 (PII)"),
  line2: z.string().max(200).optional().describe("Address line 2 (PII)"),
  city: z.string().min(2).max(50).describe("City (PII)"),
  state: z.string().max(50).optional().describe("State/province (PII)"),
  zip: z.string().regex(/^[0-9]{5,10}$/).describe("Postal code (PII)"),
  country: z.string().length(2).default("TR").describe("Country code (ISO 3166-1 alpha-2)"),

  // Non-PII fields
  company: z.string().max(100).optional().describe("Company name (optional)"),
  email: z.string().email().optional().describe("Email for notifications (optional)")
});

export type Address = z.infer<typeof Address>;

/**
 * Shipment service type
 */
export const ServiceType = z.enum([
  "standard",       // Standard delivery (3-5 days)
  "express",        // Express delivery (1-2 days)
  "same_day",       // Same-day delivery (available in major cities)
  "international"   // International shipping
]);

export type ServiceType = z.infer<typeof ServiceType>;

/**
 * Shipment options
 */
export const ShipmentOptions = z.object({
  service_type: ServiceType.default("standard"),
  cod_enabled: z.boolean().default(false).describe("Cash on delivery"),
  cod_amount: z.number().positive().optional().describe("COD amount in TRY"),
  insurance_enabled: z.boolean().default(false).describe("Insurance coverage"),
  insurance_value: z.number().positive().optional().describe("Insured value in TRY"),
  delivery_notes: z.string().max(500).optional().describe("Special delivery instructions"),
  reference_no: z.string().max(50).optional().describe("Customer reference number")
});

export type ShipmentOptions = z.infer<typeof ShipmentOptions>;

/**
 * Create shipment request
 *
 * Idempotency: X-Idempotency-Key = hash(orderId + vendor)
 */
export const CreateShipmentRequest = z.object({
  // Metadata
  order_id: z.string().min(1).max(50).describe("Order ID from e-commerce platform"),
  vendor: LogisticsVendor,

  // Addresses (PII - purpose:shipment)
  from: Address,
  to: Address,

  // Package details
  dims: Dimensions,

  // Options
  options: ShipmentOptions.optional(),

  // Idempotency
  idempotency_key: z.string().optional().describe("Idempotency key (auto-generated if not provided)")
});

export type CreateShipmentRequest = z.infer<typeof CreateShipmentRequest>;

/**
 * Shipment response
 */
export const ShipmentResponse = z.object({
  // Shipment ID
  shipment_id: z.string().describe("Internal shipment ID"),
  tracking_no: z.string().describe("Carrier tracking number"),

  // Status
  status: ShipmentStatus,

  // Label
  label_url: z.string().url().optional().describe("Label download URL (PDF)"),
  label_format: z.enum(["PDF", "ZPL", "GIF"]).optional().describe("Label format"),

  // Metadata
  vendor: LogisticsVendor,
  created_at: z.string().datetime().describe("Creation timestamp (ISO 8601)"),
  estimated_delivery: z.string().datetime().optional().describe("Estimated delivery date"),

  // Pricing
  shipping_cost: z.number().positive().optional().describe("Shipping cost in TRY"),
  currency: z.string().length(3).default("TRY").describe("Currency code")
});

export type ShipmentResponse = z.infer<typeof ShipmentResponse>;

/**
 * Tracking event
 */
export const TrackingEvent = z.object({
  timestamp: z.string().datetime().describe("Event timestamp (ISO 8601)"),
  status: ShipmentStatus,
  location: z.string().max(200).describe("Event location (city/facility)"),
  description: z.string().max(500).describe("Event description"),
  description_tr: z.string().max(500).optional().describe("Turkish description")
});

export type TrackingEvent = z.infer<typeof TrackingEvent>;

/**
 * Get tracking request
 */
export const GetTrackingRequest = z.object({
  vendor: LogisticsVendor,
  tracking_no: z.string().min(5).max(50).describe("Carrier tracking number")
});

export type GetTrackingRequest = z.infer<typeof GetTrackingRequest>;

/**
 * Tracking response
 */
export const TrackingResponse = z.object({
  tracking_no: z.string(),
  vendor: LogisticsVendor,
  status: ShipmentStatus,
  estimated_delivery: z.string().datetime().optional(),

  // Delivery info
  delivered_at: z.string().datetime().optional().describe("Actual delivery timestamp"),
  delivered_to: z.string().max(100).optional().describe("Person who received (e.g., 'Kapıcı', 'Alıcı')"),

  // Event history
  events: z.array(TrackingEvent).describe("Tracking events (chronological)"),

  // Metadata
  last_updated: z.string().datetime().describe("Last update timestamp")
});

export type TrackingResponse = z.infer<typeof TrackingResponse>;

/**
 * Cancel shipment request
 */
export const CancelShipmentRequest = z.object({
  vendor: LogisticsVendor,
  tracking_no: z.string().min(5).max(50).describe("Carrier tracking number"),
  reason: z.string().max(500).optional().describe("Cancellation reason")
});

export type CancelShipmentRequest = z.infer<typeof CancelShipmentRequest>;

/**
 * Cancel shipment response
 */
export const CancelShipmentResponse = z.object({
  tracking_no: z.string(),
  vendor: LogisticsVendor,
  status: z.literal("canceled"),
  canceled_at: z.string().datetime(),
  refund_eligible: z.boolean().describe("Whether refund is eligible"),
  message: z.string().max(500).optional()
});

export type CancelShipmentResponse = z.infer<typeof CancelShipmentResponse>;

/**
 * Webhook payload (carrier → Lydian-IQ)
 *
 * Security: HMAC-SHA256 signature verification required
 * Headers: X-Signature, X-Timestamp, X-Nonce
 */
export const WebhookPayload = z.object({
  // Webhook metadata
  event_id: z.string().uuid().describe("Unique event ID"),
  event_type: z.enum([
    "shipment.created",
    "shipment.picked_up",
    "shipment.in_transit",
    "shipment.out_for_delivery",
    "shipment.delivered",
    "shipment.exception",
    "shipment.canceled"
  ]),
  timestamp: z.string().datetime(),

  // Shipment data
  tracking_no: z.string(),
  vendor: LogisticsVendor,
  status: ShipmentStatus,

  // Event details
  event: TrackingEvent,

  // Signature (set by verifyWebhookSignature middleware)
  _verified: z.boolean().optional().describe("Signature verification flag (internal)")
});

export type WebhookPayload = z.infer<typeof WebhookPayload>;

/**
 * Error response
 */
export const LogisticsError = z.object({
  error: z.object({
    code: z.enum([
      "INVALID_ADDRESS",
      "INVALID_DIMENSIONS",
      "VENDOR_ERROR",
      "RATE_LIMIT_EXCEEDED",
      "TRACKING_NOT_FOUND",
      "SHIPMENT_NOT_CANCELABLE",
      "WEBHOOK_SIGNATURE_INVALID",
      "LEGAL_GATE_BLOCKED"
    ]),
    message: z.string(),
    details: z.record(z.any()).optional()
  })
});

export type LogisticsError = z.infer<typeof LogisticsError>;

/**
 * Logistics connector interface
 *
 * All vendors must implement this interface
 */
export interface LogisticsConnector {
  /**
   * Create shipment (idempotent)
   *
   * Idempotency: Same orderId + vendor → same shipment
   */
  createShipment(request: CreateShipmentRequest): Promise<ShipmentResponse>;

  /**
   * Get tracking information
   */
  getTracking(request: GetTrackingRequest): Promise<TrackingResponse>;

  /**
   * Cancel shipment (if eligible)
   */
  cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse>;

  /**
   * Get label (PDF/ZPL)
   */
  getLabel(tracking_no: string): Promise<{ url: string; format: "PDF" | "ZPL" | "GIF" }>;
}

/**
 * PII redaction utility
 *
 * Purpose: Mask PII fields after 7-day retention period
 * Compliance: KVKK/GDPR Article 17 (Right to erasure)
 */
export function redactPII<T extends { from?: Address; to?: Address }>(shipment: T): T {
  return {
    ...shipment,
    from: shipment.from ? redactAddress(shipment.from) : undefined,
    to: shipment.to ? redactAddress(shipment.to) : undefined
  };
}

function redactAddress(addr: Address): Address {
  return {
    ...addr,
    name: "[REDACTED]",
    phone: "[REDACTED]",
    line1: "[REDACTED]",
    line2: addr.line2 ? "[REDACTED]" : undefined,
    email: addr.email ? "[REDACTED]" : undefined
  };
}

/**
 * Idempotency key generator
 *
 * Purpose: Generate deterministic key for idempotent operations
 * Format: SHA256(orderId + vendor + timestamp_floor_hour)
 */
export function generateIdempotencyKey(orderId: string, vendor: string): string {
  const crypto = require("crypto");

  // Floor timestamp to hour (allows retries within 1 hour)
  const hourTimestamp = Math.floor(Date.now() / (60 * 60 * 1000)) * (60 * 60 * 1000);

  const message = `${orderId}|${vendor}|${hourTimestamp}`;
  return crypto.createHash("sha256").update(message).digest("hex");
}
