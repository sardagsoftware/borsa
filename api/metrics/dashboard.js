/**
 * 📊 Azure Metrics Dashboard API
 * Real-time system metrics and analytics
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const insightsService = require('../../azure-services/application-insights');

// In-memory metrics storage (will be replaced with Redis/Database)
const metricsStore = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    responseTimes: [],
  },
  aiModels: {
    requests: 0,
    totalTokens: 0,
    totalCost: 0,
  },
  cache: {
    hits: 0,
    misses: 0,
  },
  endpoints: {},
};

/**
 * GET /api/metrics/dashboard
 * Get comprehensive dashboard metrics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const metrics = {
      system: {
        healthy: true,
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
      },
      requests: {
        total: metricsStore.requests.total,
        successful: metricsStore.requests.successful,
        failed: metricsStore.requests.failed,
        errorRate: calculateErrorRate(),
        avgResponseTime: calculateAvgResponseTime(),
      },
      performance: {
        memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        memoryTotal: Math.round(os.totalmem() / 1024 / 1024),
        cpuPercent: await getCPUUsage(),
        activeConnections: metricsStore.requests.total, // Simplified
      },
      cache: {
        hits: metricsStore.cache.hits,
        misses: metricsStore.cache.misses,
        hitRate: calculateHitRate(),
      },
      aiModels: {
        requests: metricsStore.aiModels.requests,
        avgTokens: Math.round(
          metricsStore.aiModels.totalTokens / Math.max(metricsStore.aiModels.requests, 1)
        ),
        totalCost: metricsStore.aiModels.totalCost.toFixed(2),
      },
      endpoints: Object.entries(metricsStore.endpoints).map(([path, data]) => ({
        path,
        requests: data.count,
        avgResponseTime: Math.round(data.totalTime / data.count),
      })),
    };

    // Track this metrics request
    insightsService.trackEvent('DashboardViewed', {
      timestamp: new Date().toISOString(),
    });

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    insightsService.trackException(error, { endpoint: '/api/metrics/dashboard' });

    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * POST /api/metrics/track
 * Track custom metrics
 */
router.post('/track', (req, res) => {
  try {
    const { type, data } = req.body;

    switch (type) {
      case 'request':
        trackRequest(data);
        break;
      case 'aiModel':
        trackAIModel(data);
        break;
      case 'cache':
        trackCache(data);
        break;
      case 'endpoint':
        trackEndpoint(data);
        break;
      default:
        return res.status(400).json({ error: 'Invalid metric type' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking metric:', error);
    res.status(500).json({ error: 'Failed to track metric' });
  }
});

/**
 * GET /api/metrics/health
 * System health check with detailed metrics
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(os.totalmem() / 1024 / 1024),
        percentage: Math.round((process.memoryUsage().heapUsed / os.totalmem()) * 100),
      },
      cpu: {
        usage: await getCPUUsage(),
        cores: os.cpus().length,
      },
      requests: {
        total: metricsStore.requests.total,
        errorRate: calculateErrorRate(),
      },
    };

    // Track health check
    insightsService.trackEvent('HealthCheckPerformed', health);

    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    insightsService.trackException(error, { endpoint: '/api/metrics/health' });

    res.status(500).json({
      status: 'unhealthy',
      error: 'Metrik islemi basarisiz.',
    });
  }
});

/**
 * GET /api/metrics/realtime
 * Get real-time metrics stream (Server-Sent Events)
 */
router.get('/realtime', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendMetrics = () => {
    const data = {
      timestamp: Date.now(),
      requests: metricsStore.requests.total,
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      errorRate: calculateErrorRate(),
    };

    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send metrics every 2 seconds
  const interval = setInterval(sendMetrics, 2000);

  // Send initial metrics
  sendMetrics();

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Helper functions

function trackRequest(data) {
  metricsStore.requests.total++;
  if (data.statusCode < 400) {
    metricsStore.requests.successful++;
  } else {
    metricsStore.requests.failed++;
  }

  if (data.responseTime) {
    metricsStore.requests.responseTimes.push(data.responseTime);
    // Keep only last 100 response times
    if (metricsStore.requests.responseTimes.length > 100) {
      metricsStore.requests.responseTimes.shift();
    }
  }

  // Track in Application Insights
  insightsService.trackMetric('RequestCount', 1, {
    statusCode: data.statusCode,
    method: data.method,
  });
}

function trackAIModel(data) {
  metricsStore.aiModels.requests++;
  metricsStore.aiModels.totalTokens += data.tokens || 0;
  metricsStore.aiModels.totalCost += data.cost || 0;

  // Track in Application Insights
  insightsService.trackAIModelUsage(
    data.model,
    data.provider,
    data.tokens,
    data.duration,
    data.cost
  );
}

function trackCache(data) {
  if (data.hit) {
    metricsStore.cache.hits++;
  } else {
    metricsStore.cache.misses++;
  }

  // Track in Application Insights
  insightsService.trackCacheOperation(data.operation, data.hit, data.duration);
}

function trackEndpoint(data) {
  if (!metricsStore.endpoints[data.path]) {
    metricsStore.endpoints[data.path] = {
      count: 0,
      totalTime: 0,
    };
  }

  metricsStore.endpoints[data.path].count++;
  metricsStore.endpoints[data.path].totalTime += data.responseTime || 0;
}

function calculateErrorRate() {
  const total = metricsStore.requests.total;
  if (total === 0) return 0;

  return ((metricsStore.requests.failed / total) * 100).toFixed(2);
}

function calculateAvgResponseTime() {
  const times = metricsStore.requests.responseTimes;
  if (times.length === 0) return 0;

  const sum = times.reduce((a, b) => a + b, 0);
  return Math.round(sum / times.length);
}

function calculateHitRate() {
  const total = metricsStore.cache.hits + metricsStore.cache.misses;
  if (total === 0) return 0;

  return ((metricsStore.cache.hits / total) * 100).toFixed(2);
}

async function getCPUUsage() {
  return new Promise(resolve => {
    const startUsage = process.cpuUsage();
    const startTime = Date.now();

    setTimeout(() => {
      const elapseTime = Date.now() - startTime;
      const elapseUsage = process.cpuUsage(startUsage);
      const totalUsage = (elapseUsage.user + elapseUsage.system) / 1000;
      const cpuPercent = (totalUsage / elapseTime) * 100;

      resolve(Math.round(cpuPercent));
    }, 100);
  });
}

// Export metrics store for server.js integration
module.exports = router;
module.exports.metricsStore = metricsStore;
module.exports.trackRequest = trackRequest;
module.exports.trackAIModel = trackAIModel;
module.exports.trackCache = trackCache;
