/**
 * LYDIAN-IQ LOGISTICS CONNECTORS
 *
 * Package: @lydian-iq/connectors-logistics
 * Purpose: Unified logistics/shipping connectors for Turkish cargo companies
 * Vendors: Aras, Yurtiçi, UPS, Hepsijet, MNG, Sürat
 * Compliance: KVKK/GDPR (PII redaction after 7 days)
 *
 * Usage:
 * ```typescript
 * import { createShipment, getTracking } from '@lydian-iq/connectors-logistics';
 *
 * const shipment = await createShipment({
 *   vendor: 'aras',
 *   order_id: 'TR12345',
 *   from: { ... },
 *   to: { ... },
 *   dims: { length_cm: 30, width_cm: 20, height_cm: 10, weight_kg: 2 }
 * });
 *
 * const tracking = await getTracking({
 *   vendor: 'aras',
 *   tracking_no: shipment.tracking_no
 * });
 * ```
 */

// Export all schemas and types
export * from "./schema";

// Export base connector
export { BaseLogisticsConnector } from "./base-connector";

// Export connector implementations
export { ArasConnector } from "./aras/connector";
export { YurticiConnector } from "./yurtici/connector";
export { UPSConnector } from "./ups/connector";
export { HepsijetConnector } from "./hepsijet/connector";
export { MNGConnector } from "./mng/connector";
export { SuratConnector } from "./surat/connector";

// Export utility functions
export { redactPII, generateIdempotencyKey } from "./schema";

/**
 * Package version
 */
export const VERSION = "1.0.0";

/**
 * Supported vendors
 */
export const SUPPORTED_VENDORS = [
  "aras",
  "yurtici",
  "ups",
  "hepsijet",
  "mng",
  "surat"
] as const;

/**
 * Vendor metadata
 */
export const VENDOR_METADATA = {
  aras: {
    name: "Aras Kargo",
    country: "TR",
    api_base_url: "https://api.araskargo.com.tr/v1",
    auth_type: "api_key",
    rate_limit_rps: 5,
    features: {
      domestic: true,
      international: false,
      cod: true,
      insurance: true,
      webhook: true
    }
  },
  yurtici: {
    name: "Yurtiçi Kargo",
    country: "TR",
    api_base_url: "https://api.yurticikargo.com/v2",
    auth_type: "oauth2",
    rate_limit_rps: 5,
    features: {
      domestic: true,
      international: true,
      cod: true,
      insurance: true,
      webhook: true
    }
  },
  ups: {
    name: "UPS Turkey",
    country: "TR",
    api_base_url: "https://onlinetools.ups.com/api",
    auth_type: "oauth2",
    rate_limit_rps: 10,
    features: {
      domestic: true,
      international: true,
      cod: false,
      insurance: true,
      webhook: false
    }
  },
  hepsijet: {
    name: "Hepsijet",
    country: "TR",
    api_base_url: "https://api.hepsijet.com/v1",
    auth_type: "api_key",
    rate_limit_rps: 5,
    features: {
      domestic: true,
      international: false,
      cod: true,
      insurance: true,
      webhook: true
    }
  },
  mng: {
    name: "MNG Kargo",
    country: "TR",
    api_base_url: "https://api.mngkargo.com.tr/v1",
    auth_type: "api_key",
    rate_limit_rps: 5,
    features: {
      domestic: true,
      international: true,
      cod: true,
      insurance: true,
      webhook: true
    }
  },
  surat: {
    name: "Sürat Kargo",
    country: "TR",
    api_base_url: "https://api.suratkargo.com.tr/v1",
    auth_type: "api_key",
    rate_limit_rps: 5,
    features: {
      domestic: true,
      international: false,
      cod: true,
      insurance: true,
      webhook: false
    }
  }
} as const;

/**
 * Connector factory configuration
 */
export type ConnectorConfig =
  | { vendor: 'aras'; api_key: string; partner_id: string; webhook_secret?: string }
  | { vendor: 'yurtici'; client_id: string; client_secret: string; webhook_secret?: string }
  | { vendor: 'ups'; client_id: string; client_secret: string; account_number: string }
  | { vendor: 'hepsijet'; api_key: string; merchant_id: string; webhook_secret?: string }
  | { vendor: 'mng'; api_key: string; customer_code: string; webhook_secret?: string }
  | { vendor: 'surat'; api_key: string; sender_code: string; webhook_secret?: string };

/**
 * Create logistics connector based on vendor
 *
 * @param config - Vendor-specific configuration
 * @returns LogisticsConnector instance
 *
 * @example
 * ```typescript
 * import { createConnector } from '@lydian-iq/connectors-logistics';
 *
 * const connector = createConnector({
 *   vendor: 'aras',
 *   api_key: process.env.ARAS_API_KEY,
 *   partner_id: process.env.ARAS_PARTNER_ID,
 * });
 *
 * const shipment = await connector.createShipment(request);
 * ```
 */
export function createConnector(config: ConnectorConfig): import("./schema").LogisticsConnector {
  switch (config.vendor) {
    case 'aras': {
      const { ArasConnector } = require('./aras/connector');
      return new ArasConnector({
        api_key: config.api_key,
        partner_id: config.partner_id,
        webhook_secret: config.webhook_secret,
      });
    }

    case 'yurtici': {
      const { YurticiConnector } = require('./yurtici/connector');
      return new YurticiConnector({
        client_id: config.client_id,
        client_secret: config.client_secret,
        webhook_secret: config.webhook_secret,
      });
    }

    case 'ups': {
      const { UPSConnector } = require('./ups/connector');
      return new UPSConnector({
        client_id: config.client_id,
        client_secret: config.client_secret,
        account_number: config.account_number,
      });
    }

    case 'hepsijet': {
      const { HepsijetConnector } = require('./hepsijet/connector');
      return new HepsijetConnector({
        api_key: config.api_key,
        merchant_id: config.merchant_id,
        webhook_secret: config.webhook_secret,
      });
    }

    case 'mng': {
      const { MNGConnector } = require('./mng/connector');
      return new MNGConnector({
        api_key: config.api_key,
        customer_code: config.customer_code,
        webhook_secret: config.webhook_secret,
      });
    }

    case 'surat': {
      const { SuratConnector } = require('./surat/connector');
      return new SuratConnector({
        api_key: config.api_key,
        sender_code: config.sender_code,
        webhook_secret: config.webhook_secret,
      });
    }

    default:
      throw new Error(`Unknown vendor: ${(config as any).vendor}`);
  }
}
