/**
 * 🔧 Tool Registry - Action → API Endpoint Mapping
 * Maps intent actions to executable API calls with RBAC scopes
 *
 * @author LyDian AI - Ultra Intelligence Platform
 */

import { actionMetadata } from '../intent/dictionaries';

export type ToolDefinition = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  scopes: string[];
  description: string;

  // Optional: connector-specific config
  connector?: {
    type: 'commerce' | 'delivery' | 'logistics';
    vendor?: string;
    action?: string;
  };

  // Optional: transformation function
  transformParams?: (params: Record<string, any>) => Record<string, any>;
};

/**
 * Tool Registry
 * Maps action names (from intent engine) to API endpoints
 */
export const ToolRegistry: Record<string, ToolDefinition> = {
  // Logistics - Shipment Tracking
  'shipment.track': {
    method: 'POST',
    path: '/api/connectors/execute',
    scopes: [],
    description: 'Track shipment using logistics provider API',
    connector: {
      type: 'logistics',
      // vendor will be set dynamically from params.vendor
      action: 'shipment.track'
    },
    transformParams: (params) => ({
      connector: params.vendor || 'aras', // Default to Aras
      action: 'shipment.track',
      payload: {
        trackingNumber: params.trackingNo
      }
    })
  },

  // Finance - Loan Comparison
  'loan.compare': {
    method: 'POST',
    path: '/api/finance/loan/compare',
    scopes: [],
    description: 'Compare loan offers from multiple banks',
    transformParams: (params) => ({
      amount: params.amount,
      term: params.term, // in months
      loanType: params.loanType || 'consumer'
    })
  },

  // Economy - Price Optimization
  'economy.optimize': {
    method: 'POST',
    path: '/api/economy/optimize',
    scopes: ['economy.optimize'],
    description: 'Optimize pricing strategy with margin targets',
    transformParams: (params) => ({
      marginTarget: params.marginTarget,
      category: params.category,
      competitorData: params.competitorData
    })
  },

  // Travel - Trip Search
  'trip.search': {
    method: 'POST',
    path: '/api/travel/search',
    scopes: [],
    description: 'Search hotels and flights for travel planning',
    transformParams: (params) => ({
      destination: params.place,
      nights: params.days,
      guests: params.pax,
      checkIn: params.checkIn,
      checkOut: params.checkOut
    })
  },

  // Insights - Price Trend Analysis
  'insights.price-trend': {
    method: 'GET',
    path: '/api/insights/price-trend',
    scopes: ['insights.read'],
    description: 'Analyze price trends and statistics',
    transformParams: (params) => ({
      sku: params.sku,
      category: params.category,
      timeRange: params.timeRange || '30d'
    })
  },

  // ESG - Carbon Footprint Calculation
  'esg.calculate-carbon': {
    method: 'POST',
    path: '/api/esg/calculate-carbon',
    scopes: ['esg.read'],
    description: 'Calculate carbon footprint for shipments or operations',
    transformParams: (params) => ({
      orderId: params.orderId,
      shipmentId: params.shipmentId,
      distance: params.distance,
      transportMode: params.transportMode || 'road'
    })
  },

  // Commerce - Product Sync
  'product.sync': {
    method: 'POST',
    path: '/api/connectors/execute',
    scopes: ['economy.optimize'],
    description: 'Sync products to e-commerce platforms',
    connector: {
      type: 'commerce',
      action: 'product.list' // or inventory.update
    },
    transformParams: (params) => ({
      connector: params.vendor || 'trendyol',
      action: params.action || 'product.list',
      payload: {
        sku: params.sku,
        products: params.products
      }
    })
  },

  // Delivery - Menu Update
  'menu.update': {
    method: 'POST',
    path: '/api/connectors/execute',
    scopes: ['economy.optimize'],
    description: 'Update restaurant menu on delivery platforms',
    connector: {
      type: 'delivery',
      action: 'menu.get'
    },
    transformParams: (params) => ({
      connector: params.vendor || 'yemeksepeti',
      action: 'menu.get',
      payload: {
        restaurantId: params.restaurantId,
        menuItems: params.menuItems
      }
    })
  },

  // Trust - Explainability
  'trust.explain': {
    method: 'POST',
    path: '/api/trust/explain',
    scopes: [],
    description: 'Explain AI decision with SHAP values',
    transformParams: (params) => ({
      modelId: params.modelId,
      predictionId: params.predictionId,
      inputFeatures: params.inputFeatures
    })
  },

  // Marketplace - Plugin Discovery
  'marketplace.plugins': {
    method: 'GET',
    path: '/api/marketplace/plugins',
    scopes: ['marketplace.read'],
    description: 'Discover available plugins and integrations',
    transformParams: (params) => ({
      category: params.category,
      search: params.search
    })
  }
};

/**
 * Get tool definition by action name
 */
export function getTool(action: string): ToolDefinition | undefined {
  return ToolRegistry[action];
}

/**
 * Check if user has required scopes for action
 */
export function hasRequiredScopes(
  action: string,
  userScopes: string[]
): boolean {
  const tool = getTool(action);
  if (!tool) return false;

  // No scopes required = public action
  if (tool.scopes.length === 0) return true;

  // Check if user has ALL required scopes
  return tool.scopes.every(scope => userScopes.includes(scope));
}

/**
 * Execute action via API
 * Returns API call configuration
 */
export function prepareApiCall(
  action: string,
  params: Record<string, any>
): {
  method: string;
  path: string;
  body?: any;
  headers?: Record<string, string>;
} | null {
  const tool = getTool(action);
  if (!tool) return null;

  // Transform parameters using tool's transform function
  const transformedParams = tool.transformParams
    ? tool.transformParams(params)
    : params;

  // For GET requests, convert params to query string
  if (tool.method === 'GET') {
    const queryString = new URLSearchParams(transformedParams).toString();
    return {
      method: 'GET',
      path: queryString ? `${tool.path}?${queryString}` : tool.path
    };
  }

  // For POST/PUT/DELETE, send params in body
  return {
    method: tool.method,
    path: tool.path,
    body: transformedParams,
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

/**
 * Get all available actions grouped by category
 */
export function getActionsByCategory(): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const [action, _] of Object.entries(ToolRegistry)) {
    const metadata = actionMetadata[action];
    if (!metadata) continue;

    const category = metadata.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(action);
  }

  return grouped;
}

/**
 * Validate required parameters for action
 */
export function validateParams(
  action: string,
  params: Record<string, any>
): { valid: boolean; missing?: string[] } {
  const metadata = actionMetadata[action];
  if (!metadata) {
    return { valid: false };
  }

  const missing: string[] = [];
  for (const requiredParam of metadata.requiredParams) {
    if (!(requiredParam in params) || params[requiredParam] === undefined) {
      missing.push(requiredParam);
    }
  }

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Get action metadata (icon, category, params)
 */
export function getActionMetadata(action: string) {
  return actionMetadata[action];
}
