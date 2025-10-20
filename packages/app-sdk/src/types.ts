// ========================================
// LYDIAN APPLICATION SDK - CORE TYPES
// White-Hat Architecture: Type-safe connector framework
// ========================================

import { z } from 'zod';

/**
 * Vendor operation mode
 * Defines legal/partnership requirements for each connector
 */
export type VendorMode =
  | 'seller_api'           // Resmi seller API (Trendyol, Hepsiburada)
  | 'partner_required'     // Partner anlaşması gerekli
  | 'partner_or_affiliate' // Partner VEYA affiliate programı
  | 'affiliate/search'     // Affiliate meta-search (Trivago)
  | 'affiliate/api';       // Affiliate API (Hangikredi)

/**
 * Connector status
 * Legal Gate: partner_required connector'lar manual review gerektirir
 */
export type ConnectorStatus = 'disabled' | 'sandbox' | 'partner_ok' | 'production';

/**
 * Action category
 */
export type ActionCategory =
  | 'commerce'   // E-commerce operations
  | 'delivery'   // Food & grocery delivery
  | 'travel'     // Travel & hospitality
  | 'finance'    // Financial services
  | 'classifieds'; // Classified ads

/**
 * Authentication strategy
 */
export type AuthStrategy =
  | 'oauth2'       // OAuth 2.0 (client_credentials, authorization_code)
  | 'api_key'      // API Key in header/query
  | 'hmac'         // HMAC signature
  | 'basic'        // HTTP Basic Auth
  | 'bearer'       // Bearer token
  | 'custom';      // Vendor-specific auth

/**
 * Rate limit configuration per vendor
 */
export interface RateLimitConfig {
  maxRequests: number;    // Max requests per window
  windowMs: number;       // Time window in milliseconds
  burstSize?: number;     // Burst capacity (default: maxRequests * 2)
  strategy: 'token_bucket' | 'sliding_window' | 'fixed_window';
}

/**
 * OAuth2 configuration
 */
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl?: string;
  tokenUrl: string;
  scopes: string[];
  grantType: 'client_credentials' | 'authorization_code' | 'refresh_token';
}

/**
 * Connector authentication config
 */
export interface ConnectorAuthConfig {
  strategy: AuthStrategy;
  config: OAuth2Config | Record<string, any>;
}

/**
 * Capability: Single action that a connector can perform
 */
export interface Capability {
  id: string;                    // e.g., "product.sync", "order.check"
  name: string;                  // Human-readable name
  description: string;
  category: ActionCategory;
  requiredScopes: string[];      // OAuth scopes needed
  rateLimit?: RateLimitConfig;   // Per-action rate limit
  idempotent: boolean;           // Supports X-Idempotency-Key?
  requiresPartner: boolean;      // Legal Gate flag
  inputSchema: z.ZodSchema;      // Zod schema for validation
  outputSchema: z.ZodSchema;
}

/**
 * Connector Manifest
 * Defines all metadata and capabilities for a vendor connector
 */
export interface ConnectorManifest {
  // Identity
  id: string;                    // e.g., "trendyol", "hepsiburada"
  name: string;                  // Display name
  vendor: string;                // Vendor name
  version: string;               // Connector version (semver)

  // Legal & Status
  mode: VendorMode;
  status: ConnectorStatus;
  tosUrl?: string;               // Terms of Service URL
  privacyUrl?: string;           // Privacy Policy URL

  // Authentication
  auth: ConnectorAuthConfig;

  // Rate Limiting (default for all actions)
  defaultRateLimit: RateLimitConfig;

  // Capabilities (Actions this connector supports)
  capabilities: Capability[];

  // Metadata
  documentation?: string;        // Link to vendor API docs
  supportEmail?: string;
  webhookUrl?: string;           // Webhook endpoint for this vendor
}

/**
 * Action execution context
 * Passed to connector methods during execution
 */
export interface ActionContext {
  // Request
  action: string;                // Action ID (e.g., "product.sync")
  payload: unknown;              // Validated input payload

  // Auth
  credentials: Record<string, any>;  // Vendor credentials from Vault
  scopes: string[];              // Granted scopes

  // Tracking
  requestId: string;             // Unique request ID (X-Request-ID)
  idempotencyKey?: string;       // X-Idempotency-Key
  userId?: string;               // User ID (for KVKK audit)

  // Rate Limiting
  rateLimitRemaining?: number;

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Action execution result
 */
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    responseTime: number;        // ms
    rateLimitRemaining?: number;
    retryAfter?: number;         // seconds (if 429)
  };
}

/**
 * Connector interface
 * All vendor connectors must implement this
 */
export interface IConnector {
  /**
   * Get connector manifest
   */
  getManifest(): ConnectorManifest;

  /**
   * Initialize connector (load credentials, setup auth)
   */
  initialize(credentials: Record<string, any>): Promise<void>;

  /**
   * Execute an action
   */
  executeAction(context: ActionContext): Promise<ActionResult>;

  /**
   * Health check
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;

  /**
   * Graceful shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Action Registry Entry
 */
export interface ActionRegistryEntry {
  connectorId: string;
  capability: Capability;
  handler: (context: ActionContext) => Promise<ActionResult>;
}

/**
 * Scope definition
 */
export interface ScopeDefinition {
  scope: string;               // e.g., "trendyol:catalog:read"
  description: string;
  category: ActionCategory;
  dangerous: boolean;          // Requires explicit user consent?
}

/**
 * Zod schemas for validation
 */
export const RateLimitConfigSchema = z.object({
  maxRequests: z.number().positive(),
  windowMs: z.number().positive(),
  burstSize: z.number().positive().optional(),
  strategy: z.enum(['token_bucket', 'sliding_window', 'fixed_window']),
});

export const ConnectorStatusSchema = z.enum(['disabled', 'sandbox', 'partner_ok', 'production']);

export const VendorModeSchema = z.enum([
  'seller_api',
  'partner_required',
  'partner_or_affiliate',
  'affiliate/search',
  'affiliate/api',
]);

export const ActionCategorySchema = z.enum(['commerce', 'delivery', 'travel', 'finance', 'classifieds']);

export const AuthStrategySchema = z.enum(['oauth2', 'api_key', 'hmac', 'basic', 'bearer', 'custom']);
