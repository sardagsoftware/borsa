/**
 * 🗂️ Intent Registry - Action to API Mapping
 * 
 * Maps intent actions to API endpoints and tool configurations
 * 
 * @module intent/registry
 */

// ============================================================================
// Types
// ============================================================================

export interface ActionConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  scopes: string[];
  description: string;
  descriptionTR: string;
  requiresVendor: boolean;
  requiresParams: string[];
  optionalParams: string[];
  cardType: string;
}

// ============================================================================
// Action Registry (All 72 Connectors)
// ============================================================================

export const ACTION_REGISTRY: Record<string, ActionConfig> = {
  // ========== Shipment Tracking ==========
  'shipment.track': {
    endpoint: '/api/shipment/track',
    method: 'POST',
    scopes: ['shipment:read'],
    description: 'Track shipment by tracking number',
    descriptionTR: 'Kargo takip numarasıyla gönderi takibi',
    requiresVendor: false,
    requiresParams: ['trackingNumber'],
    optionalParams: ['vendor'],
    cardType: 'ShipmentCardInline',
  },

  // ========== Product Management ==========
  'product.sync': {
    endpoint: '/api/product/sync',
    method: 'POST',
    scopes: ['product:write'],
    description: 'Sync products from marketplace',
    descriptionTR: 'Pazaryerinden ürün senkronizasyonu',
    requiresVendor: true,
    requiresParams: ['vendor'],
    optionalParams: ['category', 'limit'],
    cardType: 'ProductCardInline',
  },

  // ========== Price Management ==========
  'price.update': {
    endpoint: '/api/price/update',
    method: 'POST',
    scopes: ['price:write'],
    description: 'Update product prices',
    descriptionTR: 'Ürün fiyatlarını güncelle',
    requiresVendor: true,
    requiresParams: ['vendor'],
    optionalParams: ['percentage', 'direction', 'sku'],
    cardType: 'PriceSimInline',
  },

  'price.sync': {
    endpoint: '/api/price/sync',
    method: 'POST',
    scopes: ['price:write'],
    description: 'Sync prices with marketplace',
    descriptionTR: 'Pazaryeri ile fiyat senkronizasyonu',
    requiresVendor: true,
    requiresParams: ['vendor'],
    optionalParams: [],
    cardType: 'PriceCardInline',
  },

  // ========== Inventory Management ==========
  'inventory.sync': {
    endpoint: '/api/inventory/sync',
    method: 'POST',
    scopes: ['inventory:write'],
    description: 'Sync inventory with marketplace',
    descriptionTR: 'Pazaryeri ile stok senkronizasyonu',
    requiresVendor: true,
    requiresParams: ['vendor'],
    optionalParams: [],
    cardType: 'InventoryDiffInline',
  },

  // ========== Menu Management (Food Delivery) ==========
  'menu.update': {
    endpoint: '/api/menu/update',
    method: 'POST',
    scopes: ['menu:write'],
    description: 'Update restaurant menu',
    descriptionTR: 'Restoran menüsünü güncelle',
    requiresVendor: true,
    requiresParams: ['vendor'],
    optionalParams: ['items', 'prices'],
    cardType: 'MenuCardInline',
  },

  // ========== Loan Comparison ==========
  'loan.compare': {
    endpoint: '/api/loan/compare',
    method: 'POST',
    scopes: ['finance:read'],
    description: 'Compare loan offers',
    descriptionTR: 'Kredi tekliflerini karşılaştır',
    requiresVendor: false,
    requiresParams: ['amount'],
    optionalParams: ['term'],
    cardType: 'LoanOfferCardInline',
  },

  // ========== Travel Search ==========
  'trip.search': {
    endpoint: '/api/trip/search',
    method: 'POST',
    scopes: ['travel:read'],
    description: 'Search travel options',
    descriptionTR: 'Seyahat seçeneklerini ara',
    requiresVendor: false,
    requiresParams: [],
    optionalParams: ['vendor', 'destination', 'dates', 'pax'],
    cardType: 'TravelCardInline',
  },

  // ========== Insights & Analytics ==========
  'insights.price-trend': {
    endpoint: '/api/insights/price-trend',
    method: 'GET',
    scopes: ['insights:read'],
    description: 'View price trends',
    descriptionTR: 'Fiyat trendlerini görüntüle',
    requiresVendor: false,
    requiresParams: [],
    optionalParams: ['period', 'category'],
    cardType: 'InsightChartInline',
  },

  'insights.inventory-levels': {
    endpoint: '/api/insights/inventory-levels',
    method: 'GET',
    scopes: ['insights:read'],
    description: 'View inventory levels',
    descriptionTR: 'Stok seviyelerini görüntüle',
    requiresVendor: false,
    requiresParams: [],
    optionalParams: ['vendor', 'warehouse'],
    cardType: 'InsightChartInline',
  },

  'insights.sales-performance': {
    endpoint: '/api/insights/sales-performance',
    method: 'GET',
    scopes: ['insights:read'],
    description: 'View sales performance',
    descriptionTR: 'Satış performansını görüntüle',
    requiresVendor: false,
    requiresParams: [],
    optionalParams: ['period', 'vendor'],
    cardType: 'InsightChartInline',
  },

  'insights.general': {
    endpoint: '/api/insights/general',
    method: 'GET',
    scopes: ['insights:read'],
    description: 'View general insights',
    descriptionTR: 'Genel analizleri görüntüle',
    requiresVendor: false,
    requiresParams: [],
    optionalParams: [],
    cardType: 'InsightChartInline',
  },

  // ========== ESG & Sustainability ==========
  'esg.calculate-carbon': {
    endpoint: '/api/esg/calculate-carbon',
    method: 'POST',
    scopes: ['esg:read'],
    description: 'Calculate carbon footprint',
    descriptionTR: 'Karbon ayak izini hesapla',
    requiresVendor: false,
    requiresParams: [],
    optionalParams: ['shipments', 'period'],
    cardType: 'ESGCardInline',
  },

  // ========== Marketplace & Plugins ==========
  'marketplace.plugins': {
    endpoint: '/api/marketplace/plugins',
    method: 'GET',
    scopes: ['marketplace:read'],
    description: 'Browse marketplace plugins',
    descriptionTR: 'Marketplace eklentilerine göz at',
    requiresVendor: false,
    requiresParams: [],
    optionalParams: ['category', 'search'],
    cardType: 'PluginCardInline',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get action config by action name
 */
export function getActionConfig(action: string): ActionConfig | null {
  return ACTION_REGISTRY[action] || null;
}

/**
 * Check if action requires vendor
 */
export function requiresVendor(action: string): boolean {
  const config = getActionConfig(action);
  return config?.requiresVendor || false;
}

/**
 * Get missing required params
 */
export function getMissingParams(action: string, params: Record<string, any>): string[] {
  const config = getActionConfig(action);
  if (!config) return [];

  const missing: string[] = [];

  for (const required of config.requiresParams) {
    if (!params[required]) {
      missing.push(required);
    }
  }

  return missing;
}

/**
 * Get action description (i18n)
 */
export function getActionDescription(action: string, locale: string = 'tr'): string {
  const config = getActionConfig(action);
  if (!config) return action;

  if (locale === 'tr') {
    return config.descriptionTR || config.description;
  }

  return config.description;
}

/**
 * Get all actions for a specific scope
 */
export function getActionsByScope(scope: string): string[] {
  const actions: string[] = [];

  for (const [action, config] of Object.entries(ACTION_REGISTRY)) {
    if (config.scopes.includes(scope)) {
      actions.push(action);
    }
  }

  return actions;
}

console.log('✅ Intent registry loaded (action → endpoint mapping)');
