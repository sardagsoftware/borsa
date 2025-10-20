/**
 * Vercel Serverless Models API
 * Returns available AI models
 *
 * ⚡ CACHED: 5 minutes TTL
 */

const { withCache } = require('../lib/middleware/cache-middleware');
const { handleCORS } = require('../middleware/cors-handler');

// Base handler
async function modelsHandler(req, res) {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const models = [
      // Premium Enterprise Models
      { id: 'premium-model-1', name: 'Premium Model 1', provider: 'enterprise', premium: true },
      { id: 'premium-model-2', name: 'Premium Model 2', provider: 'enterprise', premium: true },
      { id: 'premium-model-3', name: 'Premium Model 3', provider: 'enterprise', premium: true },
      { id: 'premium-model-4', name: 'Premium Model 4', provider: 'enterprise', premium: true },
      { id: 'premium-model-5', name: 'Premium Model 5', provider: 'enterprise', premium: true },

      // Advanced AI Models
      { id: 'advanced-model-1', name: 'Advanced Model 1', provider: 'enterprise', premium: true },
      { id: 'advanced-model-2', name: 'Advanced Model 2', provider: 'enterprise', premium: true },
      { id: 'advanced-model-3', name: 'Advanced Model 3', provider: 'enterprise', premium: true },

      // Standard Models
      { id: 'standard-model-1', name: 'Standard Model 1', provider: 'enterprise', premium: false },
      { id: 'standard-model-2', name: 'Standard Model 2', provider: 'enterprise', premium: false },
      { id: 'standard-model-3', name: 'Standard Model 3', provider: 'enterprise', premium: false },

      // Reasoning Models
      { id: 'reasoning-model-1', name: 'Reasoning Model 1', provider: 'enterprise', premium: true },
      { id: 'reasoning-model-2', name: 'Reasoning Model 2', provider: 'enterprise', premium: true },

      // Fast Processing Models
      { id: 'fast-model-1', name: 'Fast Model 1', provider: 'enterprise', premium: false },
      { id: 'fast-model-2', name: 'Fast Model 2', provider: 'enterprise', premium: false },
      { id: 'fast-model-3', name: 'Fast Model 3', provider: 'enterprise', premium: false },

      // Research Models
      { id: 'research-model-1', name: 'Research Model 1', provider: 'enterprise', premium: true },
      { id: 'research-model-2', name: 'Research Model 2', provider: 'enterprise', premium: false },

      // Specialized Models
      { id: 'specialized-model-1', name: 'Specialized Model 1', provider: 'enterprise', premium: false },
      { id: 'specialized-model-2', name: 'Specialized Model 2', provider: 'enterprise', premium: true },
      { id: 'specialized-model-3', name: 'Specialized Model 3', provider: 'enterprise', premium: true },
      { id: 'specialized-model-4', name: 'Specialized Model 4', provider: 'enterprise', premium: true },
      { id: 'specialized-model-5', name: 'Specialized Model 5', provider: 'enterprise', premium: true }
    ];

    res.status(200).json({
      models,
      total: models.length,
      providers: ['enterprise'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}

// Export with cache middleware
module.exports = withCache({
  ttl: 300, // 5 minutes
  keyPrefix: 'models',
  debug: process.env.NODE_ENV !== 'production'
})(modelsHandler);
