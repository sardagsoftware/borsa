/**
 * Cache Flush API
 * POST /api/cache/flush
 */

const { getCacheInstance } = require('./stats');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cache = getCacheInstance();
    const pattern = req.body?.pattern || '*';

    if (pattern === '*') {
      await cache.flush();
      return res.status(200).json({
        success: true,
        message: 'Tüm önbellek temizlendi'
      });
    } else {
      await cache.delete(pattern);
      return res.status(200).json({
        success: true,
        message: `Pattern temizlendi: ${pattern}`
      });
    }

  } catch (error) {
    console.error('Cache flush error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
