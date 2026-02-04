/**
 * AILYDIAN Recall API Index
 * Main entry point for RAG knowledge management
 *
 * @route /api/recall
 * @version 1.0.0
 */

const { getInstance, obfuscation, MODES, COLLECTIONS } = require('../../services/localrecall');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - API info and status
  if (req.method === 'GET') {
    try {
      const recall = getInstance();
      const health = await recall.healthCheck();
      const isOnline = await recall.isOnline();

      return res.status(200).json({
        success: true,
        service: 'AILYDIAN Recall',
        version: '1.0.0',
        status: health.status,
        mode: recall.getMode(),
        isOnline,
        endpoints: {
          search: '/api/recall/search',
          hybrid: '/api/recall/hybrid',
          collections: '/api/recall/collections',
          status: '/api/recall',
        },
        modes: Object.values(MODES),
        collections: Object.keys(COLLECTIONS),
        models: {
          local: ['LYRA_CORE_7X', 'MNEMO_LOCAL_9K'],
          cloud: ['MNEMO_CLOUD_5R', 'SYNAPTIC_BRIDGE_3Z'],
          specialized: ['NOVA_IQ_4M', 'HELIX_MED_8Q', 'LEXIS_LAW_2P'],
        },
        timestamp: new Date().toISOString(),
      });
    } catch (_error) {
      return res.status(500).json({
        success: false,
        service: 'AILYDIAN Recall',
        status: 'error',
        error: 'Service initialization failed',
      });
    }
  }

  // POST - Quick search (convenience endpoint)
  if (req.method === 'POST') {
    try {
      const { query, message, domain = 'general' } = req.body;
      const userQuery = query || message;

      if (!userQuery) {
        return res.status(400).json({
          success: false,
          error: 'Query or message is required',
        });
      }

      const recall = getInstance();
      const result = await recall.smartSearch(userQuery, { domain });

      return res.status(200).json({
        success: true,
        query: obfuscation.sanitizeModelNames(userQuery),
        domain,
        mode: result.mode,
        isOnline: result.isOnline,
        model: result.modelCode,
        results: result.results?.length || 0,
        context: result.context ? obfuscation.sanitizeModelNames(result.context) : null,
        timestamp: new Date().toISOString(),
      });
    } catch (_error) {
      return res.status(500).json({
        success: false,
        error: 'Search failed',
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
  });
};
