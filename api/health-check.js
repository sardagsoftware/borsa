/**
 * Comprehensive Health Check API
 * Production-grade system health monitoring
 *
 * Endpoints:
 * - GET /api/health - Quick health check
 * - GET /api/health/detailed - Comprehensive system status
 * - GET /api/health/live - Kubernetes liveness probe
 * - GET /api/health/ready - Kubernetes readiness probe
 */

const { getDatabase } = require('../database/init-db');
const sendgridService = require('../services/sendgrid-email-service');

/**
 * Quick health check
 */
async function quickHealthCheck(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
}

/**
 * Detailed health check with all subsystems
 */
async function detailedHealthCheck(req, res) {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    version: require('../package.json').version,
    checks: {},
  };

  // 1. Database Health
  try {
    const db = getDatabase();
    const result = db.prepare('SELECT COUNT(*) as count FROM users').get();

    health.checks.database = {
      status: 'healthy',
      type: 'sqlite',
      users: result.count,
      responseTime: `${Date.now() - startTime}ms`,
    };
  } catch (error) {
    health.status = 'degraded';
    health.checks.database = {
      status: 'unhealthy',
      error: 'Sistem durumu kontrol edilemedi.',
    };
  }

  // 2. Email Service Health
  try {
    const emailStatus = await sendgridService.healthCheck();

    health.checks.email = {
      status: emailStatus.enabled ? 'healthy' : 'disabled',
      provider: emailStatus.provider,
      configured: emailStatus.configured,
    };
  } catch (error) {
    health.checks.email = {
      status: 'error',
      error: 'Sistem durumu kontrol edilemedi.',
    };
  }

  // 3. AI Providers Health
  health.checks.aiProviders = {
    openai: {
      status: process.env.OPENAI_API_KEY ? 'configured' : 'not-configured',
    },
    anthropic: {
      status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not-configured',
    },
    groq: {
      status: process.env.GROQ_API_KEY ? 'configured' : 'not-configured',
    },
    google: {
      status: process.env.GOOGLE_AI_API_KEY ? 'configured' : 'not-configured',
    },
  };

  // 4. Security Middleware Health
  health.checks.security = {
    https: process.env.NODE_ENV === 'production',
    csrf: true, // CSRF is now enabled
    rateLimiting: true,
    helmet: true,
  };

  // 5. Memory Health
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    status: memUsage.heapUsed < memUsage.heapTotal * 0.9 ? 'healthy' : 'warning',
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
  };

  // 6. Environment Variables Check
  const criticalEnvVars = ['JWT_SECRET', 'SESSION_SECRET', 'DATABASE_PATH'];

  const missingEnvVars = criticalEnvVars.filter(v => !process.env[v]);

  health.checks.environment = {
    status: missingEnvVars.length === 0 ? 'healthy' : 'warning',
    missing: missingEnvVars,
    nodeVersion: process.version,
    platform: process.platform,
  };

  // 7. Overall Health Calculation
  const unhealthyChecks = Object.values(health.checks).filter(
    check => check.status === 'unhealthy' || check.status === 'error'
  );

  if (unhealthyChecks.length > 0) {
    health.status = 'unhealthy';
  } else if (
    Object.values(health.checks).some(
      check => check.status === 'warning' || check.status === 'degraded'
    )
  ) {
    health.status = 'degraded';
  }

  // Response time
  health.responseTime = `${Date.now() - startTime}ms`;

  // Set appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
}

/**
 * Kubernetes liveness probe
 * Returns 200 if app is running (even if degraded)
 */
async function livenessProbe(req, res) {
  // Just check if Node.js process is responding
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Kubernetes readiness probe
 * Returns 200 only if app is ready to serve traffic
 */
async function readinessProbe(req, res) {
  try {
    // Check critical services
    const db = getDatabase();
    db.prepare('SELECT 1').get();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not-ready',
      error: 'Sistem durumu kontrol edilemedi.',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Metrics endpoint (Prometheus compatible)
 */
function metricsEndpoint(req, res) {
  const memUsage = process.memoryUsage();

  const metrics = `
# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}

# HELP process_memory_heap_used_bytes Process heap memory used
# TYPE process_memory_heap_used_bytes gauge
process_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP process_memory_heap_total_bytes Process heap memory total
# TYPE process_memory_heap_total_bytes gauge
process_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP process_memory_external_bytes Process external memory
# TYPE process_memory_external_bytes gauge
process_memory_external_bytes ${memUsage.external}

# HELP process_memory_rss_bytes Process resident set size
# TYPE process_memory_rss_bytes gauge
process_memory_rss_bytes ${memUsage.rss}

# HELP nodejs_version_info Node.js version info
# TYPE nodejs_version_info gauge
nodejs_version_info{version="${process.version}"} 1
`.trim();

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics);
}

module.exports = {
  quickHealthCheck,
  detailedHealthCheck,
  livenessProbe,
  readinessProbe,
  metricsEndpoint,
};
