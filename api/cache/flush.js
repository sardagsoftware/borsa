/**
 * Cache Flush API - SECURED
 * POST /api/cache/flush
 *
 * ⚠️ ADMIN ONLY ENDPOINT
 * Requires JWT authentication + ADMIN role
 *
 * Security: P0 Fix - 2025-10-26
 */

const { getCacheInstance } = require('./stats');
const { authenticate, requireRole } = require('../../middleware/api-auth');
const { auditMiddleware, EVENT_TYPES, SEVERITY } = require('../../middleware/audit-logger');
const { applySanitization } = require('../_middleware/sanitize');

module.exports = async (req, res) => {
  applySanitization(req, res);
  // Method check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 🔐 SECURITY CHECK #1: Authentication Required
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // 🔐 SECURITY CHECK #2: Admin Role Required
    if (req.user.role !== 'ADMIN' && req.user.role !== 'superadmin') {
      // Audit failed attempt
      await auditMiddleware(req, res, () => {});

      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'FORBIDDEN'
      });
    }

    const cache = getCacheInstance();
    const pattern = req.body?.pattern || '*';
    const reason = req.body?.reason || 'Manual cache flush';

    // Validate pattern for security
    if (typeof pattern !== 'string' || pattern.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pattern'
      });
    }

    // Log before flush
    const cacheStats = await cache.getStats();

    if (pattern === '*') {
      await cache.flush();

      // 📝 Audit log - Critical action
      await auditMiddleware(req, res, () => {});

      console.warn(`⚠️  CACHE FLUSH: Full cache cleared by uid=${req.user.id} - Reason: ${reason}`);

      return res.status(200).json({
        success: true,
        message: 'Tüm önbellek temizlendi',
        action: 'FULL_FLUSH',
        performedBy: req.user.id,
        timestamp: new Date().toISOString(),
        previousStats: cacheStats
      });
    } else {
      await cache.delete(pattern);

      // 📝 Audit log
      await auditMiddleware(req, res, () => {});

      console.warn(`⚠️  CACHE FLUSH: Pattern '${pattern}' cleared by uid=${req.user.id} - Reason: ${reason}`);

      return res.status(200).json({
        success: true,
        message: `Pattern temizlendi: ${pattern}`,
        action: 'PATTERN_FLUSH',
        pattern: pattern,
        performedBy: req.user.id,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Cache flush error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cache flush failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
