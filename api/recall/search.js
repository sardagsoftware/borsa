/**
 * AILYDIAN Recall Search API
 * RAG-powered intelligent search endpoint
 *
 * @route POST /api/recall/search
 * @version 1.0.0
 */

const { getInstance, obfuscation } = require('../../services/localrecall');
const { getCorsOrigin } = require('../_middleware/cors');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const {
      query,
      domain = 'general',
      collection = null,
      topK = 5,
      modelCode = null,
      mode = 'hybrid',
      includeContext = true,
    } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    // Get LocalRecall instance
    const recall = getInstance({ mode });

    // Ensure service is running
    const health = await recall.healthCheck();
    if (health.status !== 'healthy') {
      // Try to start
      try {
        await recall.start();
      } catch (_startErr) {
        return res.status(503).json({
          success: false,
          error: 'Knowledge service unavailable',
          fallback: true,
        });
      }
    }

    // Smart search with automatic model selection
    const result = await recall.smartSearch(query, {
      domain,
      collection,
      topK,
      preferSpeed: mode === 'offline',
      preferAccuracy: mode === 'online',
    });

    // Select optimal model for response generation
    const optimalModel = modelCode
      ? obfuscation.getModel(modelCode)
      : obfuscation.selectOptimalModel({
          domain,
          isOnline: result.isOnline,
        });

    // Prepare response
    const response = {
      success: true,
      query: obfuscation.sanitizeModelNames(query),
      domain,
      mode: result.mode,
      isOnline: result.isOnline,
      model: {
        code: result.modelCode,
        tier: optimalModel?.tier || 1,
        category: optimalModel?.category || 'hybrid',
      },
      results: {
        count: result.results?.length || 0,
        items: (result.results || []).map(item => ({
          content: obfuscation.sanitizeModelNames(item.content || item.text || ''),
          score: item.score || item.similarity || 0,
          source: item.metadata?.source || 'knowledge_base',
        })),
      },
      timestamp: new Date().toISOString(),
    };

    // Include formatted context if requested
    if (includeContext && result.context) {
      response.context = obfuscation.sanitizeModelNames(result.context);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('[LYRA_SEARCH_ERR]', obfuscation.sanitizeModelNames(error.message));

    return res.status(500).json({
      success: false,
      error: 'Search operation failed',
      fallback: true,
      timestamp: new Date().toISOString(),
    });
  }
};
