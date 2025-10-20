/**
 * 🔧 Tool Registry - 72 Connector Configuration
 *
 * Maps connector actions to their runtime configurations:
 * - API endpoints and methods
 * - Required secrets from Vault/KMS
 * - RBAC scopes
 * - Rate limits and timeouts
 * - Idempotency requirements
 *
 * @module core/tool-registry
 */

// ============================================================================
// Types
// ============================================================================

export interface ToolConfig {
  /** Unique tool identifier (matches ACTION_REGISTRY keys) */
  id: string;

  /** Display name (Turkish default) */
  name: string;

  /** English name */
  nameEN: string;

  /** Connector vendor ID (e.g., 'trendyol-tr', 'aras-tr') */
  connectorId: string | null;

  /** API endpoint (can use {vendor} placeholder) */
  endpoint: string;

  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

  /** RBAC/ABAC scopes required */
  scopes: string[];

  /** Required secrets from Vault (key names) */
  secrets: string[];

  /** Requires idempotency key? */
  idempotent: boolean;

  /** Timeout in milliseconds */
  timeout: number;

  /** Rate limit (requests per minute) */
  rateLimit: number;

  /** Retry strategy */
  retry: {
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
    jitterMs: number;
  };

  /** Response streaming? */
  streaming: boolean;

  /** Legal/compliance flags */
  legal: {
    kvkk: boolean;
    gdpr: boolean;
    pdpl: boolean;
    sanctions: boolean;
  };

  /** Inline card component to render results */
  cardType: string;
}

// ============================================================================
// Tool Registry - All 72 Connectors
// ============================================================================

export const TOOL_REGISTRY: Record<string, ToolConfig> = {
  // ==========================================================================
  // SHIPMENT TRACKING (6 connectors)
  // ==========================================================================

  'shipment.track': {
    id: 'shipment.track',
    name: 'Kargo Takip',
    nameEN: 'Shipment Tracking',
    connectorId: null, // Multi-vendor (detected from query)
    endpoint: '/api/shipment/track',
    method: 'POST',
    scopes: ['shipment:read'],
    secrets: ['SHIPMENT_API_KEY'],
    idempotent: true,
    timeout: 15000,
    rateLimit: 60,
    retry: {
      maxAttempts: 3,
      backoffMs: 1000,
      backoffMultiplier: 2,
      jitterMs: 500,
    },
    streaming: false,
    legal: {
      kvkk: true,
      gdpr: true,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'ShipmentCardInline',
  },

  // ==========================================================================
  // E-COMMERCE - PRODUCT MANAGEMENT
  // ==========================================================================

  'product.sync': {
    id: 'product.sync',
    name: 'Ürün Senkronizasyonu',
    nameEN: 'Product Sync',
    connectorId: null, // Multi-vendor
    endpoint: '/api/product/sync',
    method: 'POST',
    scopes: ['product:write', 'marketplace:write'],
    secrets: ['MARKETPLACE_{VENDOR}_API_KEY', 'MARKETPLACE_{VENDOR}_SECRET'],
    idempotent: true,
    timeout: 30000,
    rateLimit: 10,
    retry: {
      maxAttempts: 2,
      backoffMs: 2000,
      backoffMultiplier: 2,
      jitterMs: 1000,
    },
    streaming: true,
    legal: {
      kvkk: true,
      gdpr: true,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'ProductCardInline',
  },

  // ==========================================================================
  // PRICE MANAGEMENT
  // ==========================================================================

  'price.update': {
    id: 'price.update',
    name: 'Fiyat Güncelleme',
    nameEN: 'Price Update',
    connectorId: null,
    endpoint: '/api/price/update',
    method: 'POST',
    scopes: ['price:write', 'marketplace:write'],
    secrets: ['MARKETPLACE_{VENDOR}_API_KEY'],
    idempotent: true,
    timeout: 20000,
    rateLimit: 20,
    retry: {
      maxAttempts: 3,
      backoffMs: 1500,
      backoffMultiplier: 2,
      jitterMs: 750,
    },
    streaming: false,
    legal: {
      kvkk: true,
      gdpr: true,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'PriceSimInline',
  },

  'price.sync': {
    id: 'price.sync',
    name: 'Fiyat Senkronizasyonu',
    nameEN: 'Price Sync',
    connectorId: null,
    endpoint: '/api/price/sync',
    method: 'POST',
    scopes: ['price:write', 'marketplace:write'],
    secrets: ['MARKETPLACE_{VENDOR}_API_KEY'],
    idempotent: true,
    timeout: 25000,
    rateLimit: 15,
    retry: {
      maxAttempts: 2,
      backoffMs: 2000,
      backoffMultiplier: 2,
      jitterMs: 1000,
    },
    streaming: true,
    legal: {
      kvkk: true,
      gdpr: true,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'PriceCardInline',
  },

  // ==========================================================================
  // INVENTORY MANAGEMENT
  // ==========================================================================

  'inventory.sync': {
    id: 'inventory.sync',
    name: 'Stok Senkronizasyonu',
    nameEN: 'Inventory Sync',
    connectorId: null,
    endpoint: '/api/inventory/sync',
    method: 'POST',
    scopes: ['inventory:write', 'marketplace:write'],
    secrets: ['MARKETPLACE_{VENDOR}_API_KEY'],
    idempotent: true,
    timeout: 25000,
    rateLimit: 15,
    retry: {
      maxAttempts: 3,
      backoffMs: 2000,
      backoffMultiplier: 2,
      jitterMs: 1000,
    },
    streaming: true,
    legal: {
      kvkk: true,
      gdpr: true,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'InventoryDiffInline',
  },

  // ==========================================================================
  // FOOD DELIVERY - MENU MANAGEMENT
  // ==========================================================================

  'menu.update': {
    id: 'menu.update',
    name: 'Menü Güncelleme',
    nameEN: 'Menu Update',
    connectorId: null,
    endpoint: '/api/menu/update',
    method: 'POST',
    scopes: ['menu:write', 'food:write'],
    secrets: ['FOOD_{VENDOR}_API_KEY'],
    idempotent: true,
    timeout: 20000,
    rateLimit: 10,
    retry: {
      maxAttempts: 2,
      backoffMs: 2000,
      backoffMultiplier: 2,
      jitterMs: 1000,
    },
    streaming: false,
    legal: {
      kvkk: true,
      gdpr: true,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'MenuCardInline',
  },

  // ==========================================================================
  // FINANCE - LOAN COMPARISON
  // ==========================================================================

  'loan.compare': {
    id: 'loan.compare',
    name: 'Kredi Karşılaştırma',
    nameEN: 'Loan Comparison',
    connectorId: 'hangikredi-tr',
    endpoint: '/api/loan/compare',
    method: 'POST',
    scopes: ['finance:read'],
    secrets: ['FINANCE_HANGIKREDI_API_KEY'],
    idempotent: false,
    timeout: 10000,
    rateLimit: 30,
    retry: {
      maxAttempts: 2,
      backoffMs: 1000,
      backoffMultiplier: 2,
      jitterMs: 500,
    },
    streaming: false,
    legal: {
      kvkk: true,
      gdpr: true,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'LoanOfferCardInline',
  },

  // ==========================================================================
  // TRAVEL
  // ==========================================================================

  'trip.search': {
    id: 'trip.search',
    name: 'Seyahat Arama',
    nameEN: 'Travel Search',
    connectorId: null,
    endpoint: '/api/trip/search',
    method: 'POST',
    scopes: ['travel:read'],
    secrets: ['TRAVEL_{VENDOR}_API_KEY'],
    idempotent: false,
    timeout: 15000,
    rateLimit: 20,
    retry: {
      maxAttempts: 2,
      backoffMs: 1500,
      backoffMultiplier: 2,
      jitterMs: 750,
    },
    streaming: false,
    legal: {
      kvkk: true,
      gdpr: true,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'TravelCardInline',
  },

  // ==========================================================================
  // INSIGHTS & ANALYTICS
  // ==========================================================================

  'insights.price-trend': {
    id: 'insights.price-trend',
    name: 'Fiyat Trend Analizi',
    nameEN: 'Price Trend Analysis',
    connectorId: null,
    endpoint: '/api/insights/price-trend',
    method: 'GET',
    scopes: ['insights:read'],
    secrets: [],
    idempotent: false,
    timeout: 8000,
    rateLimit: 30,
    retry: {
      maxAttempts: 2,
      backoffMs: 1000,
      backoffMultiplier: 2,
      jitterMs: 500,
    },
    streaming: false,
    legal: {
      kvkk: false,
      gdpr: false,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'InsightChartInline',
  },

  'insights.inventory-levels': {
    id: 'insights.inventory-levels',
    name: 'Stok Seviyesi Analizi',
    nameEN: 'Inventory Levels Analysis',
    connectorId: null,
    endpoint: '/api/insights/inventory-levels',
    method: 'GET',
    scopes: ['insights:read'],
    secrets: [],
    idempotent: false,
    timeout: 8000,
    rateLimit: 30,
    retry: {
      maxAttempts: 2,
      backoffMs: 1000,
      backoffMultiplier: 2,
      jitterMs: 500,
    },
    streaming: false,
    legal: {
      kvkk: false,
      gdpr: false,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'InsightChartInline',
  },

  'insights.sales-performance': {
    id: 'insights.sales-performance',
    name: 'Satış Performans Analizi',
    nameEN: 'Sales Performance Analysis',
    connectorId: null,
    endpoint: '/api/insights/sales-performance',
    method: 'GET',
    scopes: ['insights:read'],
    secrets: [],
    idempotent: false,
    timeout: 8000,
    rateLimit: 30,
    retry: {
      maxAttempts: 2,
      backoffMs: 1000,
      backoffMultiplier: 2,
      jitterMs: 500,
    },
    streaming: false,
    legal: {
      kvkk: false,
      gdpr: false,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'InsightChartInline',
  },

  'insights.general': {
    id: 'insights.general',
    name: 'Genel Analizler',
    nameEN: 'General Insights',
    connectorId: null,
    endpoint: '/api/insights/general',
    method: 'GET',
    scopes: ['insights:read'],
    secrets: [],
    idempotent: false,
    timeout: 8000,
    rateLimit: 30,
    retry: {
      maxAttempts: 2,
      backoffMs: 1000,
      backoffMultiplier: 2,
      jitterMs: 500,
    },
    streaming: false,
    legal: {
      kvkk: false,
      gdpr: false,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'InsightChartInline',
  },

  // ==========================================================================
  // ESG & SUSTAINABILITY
  // ==========================================================================

  'esg.calculate-carbon': {
    id: 'esg.calculate-carbon',
    name: 'Karbon Ayak İzi Hesaplama',
    nameEN: 'Carbon Footprint Calculation',
    connectorId: null,
    endpoint: '/api/esg/calculate-carbon',
    method: 'POST',
    scopes: ['esg:read'],
    secrets: [],
    idempotent: false,
    timeout: 10000,
    rateLimit: 20,
    retry: {
      maxAttempts: 2,
      backoffMs: 1000,
      backoffMultiplier: 2,
      jitterMs: 500,
    },
    streaming: false,
    legal: {
      kvkk: false,
      gdpr: false,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'ESGCardInline',
  },

  // ==========================================================================
  // MARKETPLACE & PLUGINS
  // ==========================================================================

  'marketplace.plugins': {
    id: 'marketplace.plugins',
    name: 'Marketplace Eklentileri',
    nameEN: 'Marketplace Plugins',
    connectorId: null,
    endpoint: '/api/marketplace/plugins',
    method: 'GET',
    scopes: ['marketplace:read'],
    secrets: [],
    idempotent: false,
    timeout: 5000,
    rateLimit: 60,
    retry: {
      maxAttempts: 2,
      backoffMs: 500,
      backoffMultiplier: 2,
      jitterMs: 250,
    },
    streaming: false,
    legal: {
      kvkk: false,
      gdpr: false,
      pdpl: false,
      sanctions: false,
    },
    cardType: 'PluginCardInline',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get tool configuration by ID
 */
export function getToolConfig(toolId: string): ToolConfig | null {
  return TOOL_REGISTRY[toolId] || null;
}

/**
 * Get all tools for a specific scope
 */
export function getToolsByScope(scope: string): ToolConfig[] {
  return Object.values(TOOL_REGISTRY).filter(tool => tool.scopes.includes(scope));
}

/**
 * Get all tools requiring specific secrets
 */
export function getToolsBySecret(secretKey: string): ToolConfig[] {
  return Object.values(TOOL_REGISTRY).filter(tool =>
    tool.secrets.some(s => s.includes(secretKey))
  );
}

/**
 * Check if tool requires KVKK compliance
 */
export function requiresKVKK(toolId: string): boolean {
  const config = getToolConfig(toolId);
  return config?.legal.kvkk || false;
}

/**
 * Get all tool IDs
 */
export function getAllToolIds(): string[] {
  return Object.keys(TOOL_REGISTRY);
}

/**
 * Resolve secret placeholders (e.g., {VENDOR} → trendyol)
 */
export function resolveSecrets(tool: ToolConfig, vendor?: string): string[] {
  if (!vendor) return tool.secrets;

  return tool.secrets.map(secret =>
    secret.replace('{VENDOR}', vendor.toUpperCase().replace(/-/g, '_'))
  );
}

console.log('✅ Tool registry loaded (72 connectors, RBAC + Vault + Legal gates)');
