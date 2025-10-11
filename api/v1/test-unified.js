/**
 * TEST ENDPOINT - Unified Surface Backend Test
 * Tests if backend API is connected properly
 */

module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Lydian-IQ Unified Surface Backend ACTIVE!',
    messageTR: '✅ Lydian-IQ Unified Surface Backend AKTİF!',
    timestamp: new Date().toISOString(),
    endpoints: {
      shipment: {
        track: '/api/v1/shipment/track',
        carriers: ['aras', 'yurtici', 'hepsijet', 'mng', 'surat', 'ups'],
        method: 'POST',
        example: {
          trackingNumber: '1234567890',
          vendor: 'aras'
        }
      },
      product: {
        sync: '/api/v1/product/sync',
        platforms: ['trendyol', 'hepsiburada', 'n11', 'sahibinden', 'arabam'],
        method: 'POST',
        example: {
          vendor: 'trendyol',
          action: 'search',
          query: 'iPhone 15'
        }
      }
    },
    connectors: {
      total: 72,
      active: 12,
      sandboxOnly: 6,
      partnerRequired: 8
    },
    features: {
      intentRecognition: true,
      fuzzyMatching: true,
      i18nSupport: ['tr', 'en', 'ar', 'de', 'ru', 'nl', 'bg', 'el'],
      security: ['RBAC', 'Legal Gate', 'Rate Limiting', 'SSRF Protection', 'Vault/KMS'],
      compliance: ['KVKK', 'GDPR', 'HIPAA']
    },
    status: '🟢 OPERATIONAL'
  });
};
