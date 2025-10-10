/**
 * 🌐 Mock Connector Data
 * Real-world connectors with white-hat compliance
 */

import { Connector } from '../types/connectors';

export const CONNECTORS: Connector[] = [
  // 🇹🇷 TURKEY - E-COMMERCE
  {
    id: 'trendyol-tr',
    name: 'Trendyol',
    slug: 'trendyol',
    description: 'Türkiye\'nin en büyük e-ticaret platformu',
    country: 'Türkiye',
    countryCode: 'TR',
    region: 'turkey',
    vertical: 'ecommerce',
    status: 'active',
    logoUrl: '/connectors/logos/trendyol.svg',
    websiteUrl: 'https://www.trendyol.com',
    docsUrl: 'https://developers.trendyol.com',
    apiEndpoint: 'https://api.trendyol.com/v1',
    health: {
      status: 'healthy',
      uptime: 99.9,
      latency: 45,
      lastCheck: new Date(),
      errorRate: 0.1
    },
    rateLimit: {
      limit: 1000,
      remaining: 847,
      reset: new Date(Date.now() + 3600000),
      period: '1 hour'
    },
    metrics: {
      totalRequests: 15247,
      successRate: 99.8,
      avgResponseTime: 52,
      lastSync: new Date()
    },
    partner: {
      required: true,
      name: 'Trendyol Partner API',
      contactEmail: 'partner@trendyol.com',
      docsUrl: 'https://partner.trendyol.com/docs',
      status: 'approved'
    },
    whiteHatVerified: true,
    kvkkCompliant: true,
    gdprCompliant: true,
    features: ['Product Catalog', 'Order Management', 'Inventory Sync', 'Price Updates'],
    capabilities: ['real-time-sync', 'webhook-support', 'bulk-operations'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },

  {
    id: 'hepsiburada-tr',
    name: 'Hepsiburada',
    slug: 'hepsiburada',
    description: 'Türkiye\'nin online alışveriş lideri',
    country: 'Türkiye',
    countryCode: 'TR',
    region: 'turkey',
    vertical: 'ecommerce',
    status: 'active',
    logoUrl: '/connectors/logos/hepsiburada.svg',
    websiteUrl: 'https://www.hepsiburada.com',
    docsUrl: 'https://developers.hepsiburada.com',
    apiEndpoint: 'https://api.hepsiburada.com/v2',
    health: {
      status: 'healthy',
      uptime: 99.95,
      latency: 38,
      lastCheck: new Date(),
      errorRate: 0.05
    },
    rateLimit: {
      limit: 2000,
      remaining: 1654,
      reset: new Date(Date.now() + 3600000),
      period: '1 hour'
    },
    metrics: {
      totalRequests: 28945,
      successRate: 99.9,
      avgResponseTime: 41,
      lastSync: new Date()
    },
    partner: {
      required: true,
      name: 'Hepsiburada Marketplace',
      status: 'approved'
    },
    whiteHatVerified: true,
    kvkkCompliant: true,
    gdprCompliant: true,
    features: ['Product Management', 'Order Tracking', 'Stock Control', 'Analytics'],
    capabilities: ['real-time-sync', 'webhook-support', 'batch-processing'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date()
  },

  // 🇹🇷 TURKEY - RETAIL
  {
    id: 'a101-tr',
    name: 'A101',
    slug: 'a101',
    description: 'A101 Market - Türkiye\'nin en büyük zincir marketlerinden',
    country: 'Türkiye',
    countryCode: 'TR',
    region: 'turkey',
    vertical: 'retail',
    status: 'partner_required',
    logoUrl: '/connectors/logos/a101.svg',
    websiteUrl: 'https://www.a101.com.tr',
    docsUrl: 'https://partner.a101.com.tr/docs',
    health: {
      status: 'healthy',
      uptime: 98.5,
      latency: 125,
      lastCheck: new Date(),
      errorRate: 1.5
    },
    metrics: {
      totalRequests: 0,
      successRate: 0,
      avgResponseTime: 0,
      lastSync: new Date()
    },
    partner: {
      required: true,
      name: 'A101 Partner Program',
      contactEmail: 'partner@a101.com.tr',
      status: 'pending'
    },
    whiteHatVerified: true,
    kvkkCompliant: true,
    gdprCompliant: false,
    features: ['Store Locator', 'Product Catalog', 'Campaign Management'],
    capabilities: ['store-locator', 'product-search'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date()
  },

  {
    id: 'bim-tr',
    name: 'BİM',
    slug: 'bim',
    description: 'BİM Birleşik Mağazalar - Türkiye market zinciri',
    country: 'Türkiye',
    countryCode: 'TR',
    region: 'turkey',
    vertical: 'retail',
    status: 'sandbox',
    logoUrl: '/connectors/logos/bim.svg',
    websiteUrl: 'https://www.bim.com.tr',
    docsUrl: 'https://developers.bim.com.tr',
    apiEndpoint: 'https://sandbox-api.bim.com.tr/v1',
    health: {
      status: 'healthy',
      uptime: 97.2,
      latency: 156,
      lastCheck: new Date(),
      errorRate: 2.8
    },
    metrics: {
      totalRequests: 523,
      successRate: 95.0,
      avgResponseTime: 168,
      lastSync: new Date()
    },
    whiteHatVerified: true,
    kvkkCompliant: true,
    gdprCompliant: false,
    features: ['Product Catalog', 'Weekly Campaigns', 'Store Finder'],
    capabilities: ['catalog-api', 'store-locator'],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date()
  },

  {
    id: 'sok-tr',
    name: 'ŞOK',
    slug: 'sok',
    description: 'ŞOK Market - Türkiye discount market zinciri',
    country: 'Türkiye',
    countryCode: 'TR',
    region: 'turkey',
    vertical: 'retail',
    status: 'sandbox',
    logoUrl: '/connectors/logos/sok.svg',
    websiteUrl: 'https://www.sokmarket.com.tr',
    docsUrl: 'https://api.sokmarket.com.tr/docs',
    apiEndpoint: 'https://sandbox-api.sokmarket.com.tr/v1',
    health: {
      status: 'healthy',
      uptime: 96.8,
      latency: 178,
      lastCheck: new Date(),
      errorRate: 3.2
    },
    metrics: {
      totalRequests: 412,
      successRate: 94.5,
      avgResponseTime: 185,
      lastSync: new Date()
    },
    whiteHatVerified: true,
    kvkkCompliant: true,
    gdprCompliant: false,
    features: ['Product Search', 'Campaign Data', 'Store Locations'],
    capabilities: ['product-api', 'store-api'],
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date()
  },

  {
    id: 'migros-tr',
    name: 'Migros',
    slug: 'migros',
    description: 'Migros - Türkiye\'nin önde gelen süpermarket zinciri',
    country: 'Türkiye',
    countryCode: 'TR',
    region: 'turkey',
    vertical: 'retail',
    status: 'active',
    logoUrl: '/connectors/logos/migros.svg',
    websiteUrl: 'https://www.migros.com.tr',
    docsUrl: 'https://developer.migros.com.tr',
    apiEndpoint: 'https://api.migros.com.tr/v1',
    health: {
      status: 'healthy',
      uptime: 99.1,
      latency: 89,
      lastCheck: new Date(),
      errorRate: 0.9
    },
    rateLimit: {
      limit: 500,
      remaining: 387,
      reset: new Date(Date.now() + 3600000),
      period: '1 hour'
    },
    metrics: {
      totalRequests: 8945,
      successRate: 98.7,
      avgResponseTime: 95,
      lastSync: new Date()
    },
    partner: {
      required: true,
      status: 'approved'
    },
    whiteHatVerified: true,
    kvkkCompliant: true,
    gdprCompliant: false,
    features: ['Online Shopping', 'MoneyCard Integration', 'Delivery Tracking'],
    capabilities: ['real-time-inventory', 'order-api'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date()
  },

  {
    id: 'carrefoursa-tr',
    name: 'CarrefourSA',
    slug: 'carrefoursa',
    description: 'CarrefourSA - Türkiye hipermarket zinciri',
    country: 'Türkiye',
    countryCode: 'TR',
    region: 'turkey',
    vertical: 'retail',
    status: 'active',
    logoUrl: '/connectors/logos/carrefour.svg',
    websiteUrl: 'https://www.carrefoursa.com',
    docsUrl: 'https://partner.carrefoursa.com/api',
    apiEndpoint: 'https://api.carrefoursa.com/v1',
    health: {
      status: 'healthy',
      uptime: 98.9,
      latency: 92,
      lastCheck: new Date(),
      errorRate: 1.1
    },
    rateLimit: {
      limit: 750,
      remaining: 542,
      reset: new Date(Date.now() + 3600000),
      period: '1 hour'
    },
    metrics: {
      totalRequests: 12458,
      successRate: 98.2,
      avgResponseTime: 98,
      lastSync: new Date()
    },
    whiteHatVerified: true,
    kvkkCompliant: true,
    gdprCompliant: true,
    features: ['Product Catalog', 'Order Management', 'Store Pickup'],
    capabilities: ['catalog-sync', 'order-tracking'],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date()
  },

  // 🇹🇷 TURKEY - LOGISTICS
  {
    id: 'aras-tr',
    name: 'Aras Kargo',
    slug: 'aras-kargo',
    description: 'Aras Kargo - Türkiye kargo ve lojistik hizmetleri',
    country: 'Türkiye',
    countryCode: 'TR',
    region: 'turkey',
    vertical: 'logistics',
    status: 'active',
    logoUrl: '/connectors/logos/aras.svg',
    websiteUrl: 'https://www.araskargo.com.tr',
    docsUrl: 'https://developers.araskargo.com.tr',
    apiEndpoint: 'https://api.araskargo.com.tr/v2',
    health: {
      status: 'healthy',
      uptime: 99.5,
      latency: 65,
      lastCheck: new Date(),
      errorRate: 0.5
    },
    rateLimit: {
      limit: 1500,
      remaining: 1234,
      reset: new Date(Date.now() + 3600000),
      period: '1 hour'
    },
    metrics: {
      totalRequests: 34521,
      successRate: 99.3,
      avgResponseTime: 71,
      lastSync: new Date()
    },
    partner: {
      required: true,
      status: 'approved'
    },
    whiteHatVerified: true,
    kvkkCompliant: true,
    gdprCompliant: false,
    features: ['Shipment Tracking', 'Label Generation', 'Branch Locator', 'Pricing'],
    capabilities: ['tracking-api', 'label-api', 'webhook-support'],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date()
  },

  {
    id: 'ups-global',
    name: 'UPS',
    slug: 'ups',
    description: 'UPS - Global shipping and logistics',
    country: 'Global',
    countryCode: 'US',
    region: 'global',
    vertical: 'logistics',
    status: 'active',
    logoUrl: '/connectors/logos/ups.svg',
    websiteUrl: 'https://www.ups.com',
    docsUrl: 'https://developer.ups.com',
    apiEndpoint: 'https://api.ups.com/v1',
    health: {
      status: 'healthy',
      uptime: 99.99,
      latency: 78,
      lastCheck: new Date(),
      errorRate: 0.01
    },
    rateLimit: {
      limit: 5000,
      remaining: 4521,
      reset: new Date(Date.now() + 3600000),
      period: '1 hour'
    },
    metrics: {
      totalRequests: 89542,
      successRate: 99.95,
      avgResponseTime: 82,
      lastSync: new Date()
    },
    partner: {
      required: true,
      status: 'approved'
    },
    whiteHatVerified: true,
    kvkkCompliant: true,
    gdprCompliant: true,
    features: ['Tracking', 'Rating', 'Address Validation', 'Time in Transit'],
    capabilities: ['tracking-api', 'rating-api', 'address-validation', 'oauth2'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },

  // 🇹🇷 TURKEY - FOOD DELIVERY
  {
    id: 'wolt-tr',
    name: 'Wolt',
    slug: 'wolt',
    description: 'Wolt - Yemek ve market siparişi',
    country: 'Türkiye',
    countryCode: 'TR',
    region: 'turkey',
    vertical: 'food_delivery',
    status: 'partner_required',
    logoUrl: '/connectors/logos/wolt.svg',
    websiteUrl: 'https://wolt.com/tr',
    docsUrl: 'https://partner.wolt.com/docs',
    health: {
      status: 'healthy',
      uptime: 98.7,
      latency: 112,
      lastCheck: new Date(),
      errorRate: 1.3
    },
    metrics: {
      totalRequests: 0,
      successRate: 0,
      avgResponseTime: 0,
      lastSync: new Date()
    },
    partner: {
      required: true,
      name: 'Wolt Partners',
      contactEmail: 'partners@wolt.com',
      status: 'pending'
    },
    whiteHatVerified: true,
    kvkkCompliant: true,
    gdprCompliant: true,
    features: ['Order Management', 'Menu Sync', 'Delivery Tracking'],
    capabilities: ['order-api', 'menu-api'],
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date()
  },

  // 🇪🇺 EUROPE - MARKETPLACE
  {
    id: 'noon-ae',
    name: 'Noon',
    slug: 'noon',
    description: 'Noon - Middle East e-commerce platform',
    country: 'UAE',
    countryCode: 'AE',
    region: 'mena',
    vertical: 'marketplace',
    status: 'active',
    logoUrl: '/connectors/logos/noon.svg',
    websiteUrl: 'https://www.noon.com',
    docsUrl: 'https://developer.noon.com',
    apiEndpoint: 'https://api.noon.com/v1',
    health: {
      status: 'healthy',
      uptime: 99.2,
      latency: 145,
      lastCheck: new Date(),
      errorRate: 0.8
    },
    rateLimit: {
      limit: 1000,
      remaining: 789,
      reset: new Date(Date.now() + 3600000),
      period: '1 hour'
    },
    metrics: {
      totalRequests: 15698,
      successRate: 98.9,
      avgResponseTime: 152,
      lastSync: new Date()
    },
    partner: {
      required: true,
      status: 'approved'
    },
    whiteHatVerified: true,
    kvkkCompliant: false,
    gdprCompliant: false,
    features: ['Product Listing', 'Order Management', 'Fulfillment'],
    capabilities: ['product-api', 'order-api', 'fulfillment-api'],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date()
  },

  {
    id: 'zalando-de',
    name: 'Zalando',
    slug: 'zalando',
    description: 'Zalando - Europe\'s leading online fashion platform',
    country: 'Germany',
    countryCode: 'DE',
    region: 'europe',
    vertical: 'ecommerce',
    status: 'sandbox',
    logoUrl: '/connectors/logos/zalando.svg',
    websiteUrl: 'https://www.zalando.com',
    docsUrl: 'https://developers.zalando.com',
    apiEndpoint: 'https://sandbox-api.zalando.com/v1',
    health: {
      status: 'healthy',
      uptime: 99.8,
      latency: 62,
      lastCheck: new Date(),
      errorRate: 0.2
    },
    metrics: {
      totalRequests: 1245,
      successRate: 97.8,
      avgResponseTime: 68,
      lastSync: new Date()
    },
    whiteHatVerified: true,
    kvkkCompliant: false,
    gdprCompliant: true,
    features: ['Product Catalog', 'Order Management', 'Returns API'],
    capabilities: ['catalog-api', 'order-api', 'returns-api'],
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date()
  }
];

// Helper functions
export function getConnectorsByStatus(status: string) {
  return CONNECTORS.filter(c => c.status === status);
}

export function getConnectorsByCountry(countryCode: string) {
  return CONNECTORS.filter(c => c.countryCode === countryCode);
}

export function getConnectorsByVertical(vertical: string) {
  return CONNECTORS.filter(c => c.vertical === vertical);
}

export function getActiveConnectors() {
  return CONNECTORS.filter(c => c.status === 'active');
}

export function getConnectorById(id: string) {
  return CONNECTORS.find(c => c.id === id);
}

export const CONNECTOR_STATS = {
  total: CONNECTORS.length,
  active: getActiveConnectors().length,
  sandbox: getConnectorsByStatus('sandbox').length,
  partnerRequired: getConnectorsByStatus('partner_required').length,
  whiteHatVerified: CONNECTORS.filter(c => c.whiteHatVerified).length,
  kvkkCompliant: CONNECTORS.filter(c => c.kvkkCompliant).length
};
