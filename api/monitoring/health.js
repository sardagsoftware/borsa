/**
 * Health Check & System Metrics Endpoint
 * /api/monitoring/health
 * /api/monitoring/metrics
 */

import { createClient } from '@supabase/supabase-js';
import os from 'os';
import { performanceMonitor } from '../../lib/monitoring/performance-monitor.js';
import { errorTracker } from '../../lib/monitoring/error-tracker.js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default async function handler(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // Health check endpoint (no auth required)
  if (pathname === '/api/monitoring/health') {
    return handleHealthCheck(req, res);
  }

  // Metrics endpoint (admin only)
  if (pathname === '/api/monitoring/metrics') {
    return handleMetrics(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}

/**
 * Health check endpoint
 */
async function handleHealthCheck(req, res) {
  const startTime = Date.now();
  const checks = {};

  try {
    // Check database connection
    try {
      const { error: dbError } = await supabase.from('users').select('count').limit(1);
      checks.database = {
        status: dbError ? 'unhealthy' : 'healthy',
        responseTime: Date.now() - startTime,
        error: dbError?.message || null,
      };
    } catch (err) {
      checks.database = {
        status: 'unhealthy',
        error: err.message,
      };
    }

    // Check Redis connection (if using Redis cache)
    checks.cache = {
      status: process.env.REDIS_URL ? 'healthy' : 'not_configured',
      enabled: !!process.env.REDIS_URL,
    };

    // System metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    checks.system = {
      status: 'healthy',
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        usagePercent: ((totalMem - freeMem) / totalMem) * 100,
      },
      uptime: os.uptime(),
    };

    // Overall status
    const allHealthy = Object.values(checks).every(check => check.status === 'healthy' || check.status === 'not_configured');
    const overallStatus = allHealthy ? 'healthy' : 'degraded';

    return res.status(overallStatus === 'healthy' ? 200 : 503).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
}

/**
 * Metrics endpoint (admin only)
 */
async function handleMetrics(req, res) {
  try {
    // TODO: Add admin authentication check
    // For now, require API key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const timeRange = req.query.range || '1h';

    // Get performance stats
    const perfStats = await performanceMonitor.getStats(timeRange);

    // Get error stats
    const errorStats = await errorTracker.getStats(timeRange);

    // Get system metrics
    const systemMetrics = performanceMonitor.getSystemMetrics();

    // Get slow queries
    const slowQueries = await performanceMonitor.getSlowQueries(10);

    // Get recent errors
    const recentErrors = await errorTracker.getRecentErrors(10);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      timeRange,
      performance: perfStats,
      errors: errorStats,
      system: systemMetrics,
      slowQueries,
      recentErrors: recentErrors.map(err => ({
        id: err.error_id,
        timestamp: err.timestamp,
        message: err.message,
        severity: err.severity,
        category: err.category,
      })),
    });
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}
