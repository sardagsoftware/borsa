/**
 * AILYDIAN Recall Collections API
 * Manage knowledge base collections
 *
 * @route /api/recall/collections
 * @version 1.0.0
 */

const { getInstance, obfuscation, COLLECTIONS } = require('../../services/localrecall');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const recall = getInstance();

  try {
    // GET - List all collections
    if (req.method === 'GET') {
      const health = await recall.healthCheck();

      if (health.status !== 'healthy') {
        // Return predefined collections even if service is down
        return res.status(200).json({
          success: true,
          serviceStatus: 'offline',
          collections: Object.entries(COLLECTIONS).map(([key, name]) => ({
            id: key,
            name,
            status: 'pending',
          })),
          timestamp: new Date().toISOString(),
        });
      }

      const result = await recall.listCollections();

      return res.status(200).json({
        success: true,
        serviceStatus: 'online',
        collections: result.data || [],
        predefined: Object.entries(COLLECTIONS).map(([key, name]) => ({
          id: key,
          name,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // POST - Create new collection or add document
    if (req.method === 'POST') {
      const { action, name, content, filePath, collection } = req.body;

      // Create collection
      if (action === 'create' || (!action && name && !content)) {
        if (!name) {
          return res.status(400).json({
            success: false,
            error: 'Collection name is required',
          });
        }

        const sanitizedName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const result = await recall.createCollection(sanitizedName);

        return res.status(201).json({
          success: true,
          message: 'Collection created',
          collection: sanitizedName,
          data: result.data,
          timestamp: new Date().toISOString(),
        });
      }

      // Add document to collection
      if (action === 'upload' || content) {
        const targetCollection = collection || name || COLLECTIONS.CHAT_GENERAL;

        if (!content && !filePath) {
          return res.status(400).json({
            success: false,
            error: 'Content or filePath is required',
          });
        }

        const result = await recall.uploadToCollection(targetCollection, filePath, content);

        return res.status(200).json({
          success: true,
          message: 'Document added to collection',
          collection: targetCollection,
          data: result.data,
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use "create" or "upload"',
      });
    }

    // DELETE - Remove collection entry
    if (req.method === 'DELETE') {
      const { collection, entry } = req.body;

      if (!collection || !entry) {
        return res.status(400).json({
          success: false,
          error: 'Collection and entry are required',
        });
      }

      // Note: This would need implementation in LocalRecall service
      return res.status(501).json({
        success: false,
        error: 'Delete not yet implemented',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  } catch (error) {
    console.error('[LYRA_COLLECTIONS_ERR]', obfuscation.sanitizeModelNames(error.message));

    return res.status(500).json({
      success: false,
      error: 'Collection operation failed',
      timestamp: new Date().toISOString(),
    });
  }
};
