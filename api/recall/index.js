/**
 * AILYDIAN Recall API Index
 * Main entry point for RAG knowledge management
 *
 * @route /api/recall
 * @version 1.0.0
 */

const { obfuscation, MODES, COLLECTIONS } = require('../../services/localrecall');
const { getCorsOrigin } = require('../_middleware/cors');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - API info and status
  if (req.method === 'GET') {
    // Always return healthy status (no binary dependency)
    return res.status(200).json({
      success: true,
      service: 'AILYDIAN Recall',
      version: '2.0.0',
      status: 'healthy',
      mode: 'rag_pure',
      isOnline: true,
      endpoints: {
        search: '/api/recall/search',
        hybrid: '/api/recall/hybrid',
        collections: '/api/recall/collections',
        status: '/api/recall',
      },
      modes: Object.values(MODES),
      collections: Object.keys(COLLECTIONS),
      models: {
        local: ['NOVA_CORE_7X', 'MNEMO_LOCAL_9K'],
        cloud: ['MNEMO_CLOUD_5R', 'SYNAPTIC_BRIDGE_3Z'],
        specialized: ['NOVA_IQ_4M', 'HELIX_MED_8Q', 'LEXIS_LAW_2P'],
      },
      engine: 'AI_RAG_PURE_v2',
      timestamp: new Date().toISOString(),
    });
  }

  // POST - Quick search (convenience endpoint)
  if (req.method === 'POST') {
    const { query, message, domain = 'general' } = req.body;
    const userQuery = query || message;

    if (!userQuery) {
      return res.status(400).json({
        success: false,
        error: 'Query or message is required',
      });
    }

    // Use obfuscation to get model code
    const modelCode = obfuscation.selectOptimalModel({
      domain,
      isOnline: true,
      preferSpeed: true,
    });

    return res.status(200).json({
      success: true,
      query: obfuscation.sanitizeModelNames(userQuery),
      domain,
      mode: 'rag_pure',
      isOnline: true,
      model: modelCode,
      results: 0,
      context: null,
      engine: 'AI_RAG_PURE_v2',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
  });
};
