/**
 * Admin Dashboard - System Health Check API
 * GET /api/admin-dashboard/system/health
 *
 * Returns system health information:
 *   - Upstash Redis connectivity (PING + latency)
 *   - Process memory usage (process.memoryUsage())
 *   - Process uptime (process.uptime())
 *   - Node.js version
 *   - Environment (production/preview)
 *   - Redis memory info and key breakdown
 *
 * Protected by triple-layer admin authentication middleware.
 */

const { withAdminAuth } = require('../_middleware');
const { applySanitization } = require('../../_middleware/sanitize');

// ---------------------------------------------------------------------------
// Upstash Redis REST API
// ---------------------------------------------------------------------------

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Execute a Redis command via Upstash REST API
 */
async function redis(command, ...args) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return null;
  }

  try {
    const response = await fetch(`${UPSTASH_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([command, ...args]),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('[HEALTH_REDIS]', error.message);
    return null;
  }
}

/**
 * Count keys matching a pattern using SCAN (production-safe)
 */
async function countKeysByPattern(pattern) {
  let cursor = '0';
  let total = 0;
  const maxIterations = 200;
  let iterations = 0;

  do {
    const result = await redis('SCAN', cursor, 'MATCH', pattern, 'COUNT', 100);
    if (!result || !Array.isArray(result)) break;

    cursor = String(result[0]);
    const keys = result[1] || [];
    total += keys.length;

    iterations++;
    if (iterations >= maxIterations) {
      console.warn('[HEALTH] SCAN iteration limit reached for:', pattern);
      break;
    }
  } while (cursor !== '0');

  return total;
}

// ---------------------------------------------------------------------------
// Health Check Functions
// ---------------------------------------------------------------------------

/**
 * Check Redis connectivity via PING
 * Returns latency in milliseconds and connection status
 */
async function checkRedisConnectivity() {
  const start = Date.now();

  try {
    const result = await redis('PING');
    const latencyMs = Date.now() - start;

    return {
      status: result === 'PONG' ? 'connected' : 'degraded',
      latencyMs,
      response: result,
    };
  } catch (error) {
    console.error('[HEALTH_PING]', error.message);
    return {
      status: 'disconnected',
      latencyMs: Date.now() - start,
      response: null,
    };
  }
}

/**
 * Get Redis memory information via INFO memory
 * Upstash returns INFO as a single string; parse relevant fields.
 */
async function getRedisMemoryInfo() {
  try {
    const infoRaw = await redis('INFO', 'memory');
    if (!infoRaw || typeof infoRaw !== 'string') {
      return { available: false };
    }

    const lines = infoRaw.split('\r\n');
    const memInfo = {};

    for (const line of lines) {
      if (line.startsWith('#') || !line.includes(':')) continue;
      const [key, value] = line.split(':');
      if (key && value) {
        memInfo[key.trim()] = value.trim();
      }
    }

    return {
      available: true,
      usedMemory: memInfo['used_memory_human'] || null,
      usedMemoryBytes: parseInt(memInfo['used_memory']) || null,
      peakMemory: memInfo['used_memory_peak_human'] || null,
      peakMemoryBytes: parseInt(memInfo['used_memory_peak']) || null,
      memoryFragmentationRatio: parseFloat(memInfo['mem_fragmentation_ratio']) || null,
    };
  } catch (error) {
    console.error('[HEALTH_MEMORY]', error.message);
    return { available: false };
  }
}

/**
 * Count keys by known prefixes for a breakdown
 */
async function getKeyCountBreakdown() {
  const prefixes = [
    { prefix: 'chat:user:*', label: 'users' },
    { prefix: 'chat:email:*', label: 'emailMappings' },
    { prefix: 'chat:phone:*', label: 'phoneMappings' },
    { prefix: 'chat:conv:*', label: 'conversations' },
    { prefix: 'chat:msg:*', label: 'messages' },
    { prefix: 'chat:session:*', label: 'sessions' },
    { prefix: 'chat:settings:*', label: 'userSettings' },
    { prefix: 'chat:reset:*', label: 'passwordResets' },
  ];

  const breakdown = {};
  let totalKeys = 0;

  const results = await Promise.all(
    prefixes.map(async ({ prefix, label }) => {
      const count = await countKeysByPattern(prefix);
      return { label, count };
    })
  );

  for (const { label, count } of results) {
    breakdown[label] = count;
    totalKeys += count;
  }

  breakdown.totalTracked = totalKeys;

  try {
    const dbSize = await redis('DBSIZE');
    breakdown.totalInDatabase = typeof dbSize === 'number' ? dbSize : parseInt(dbSize) || null;
  } catch (error) {
    console.error('[HEALTH_DBSIZE]', error.message);
    breakdown.totalInDatabase = null;
  }

  return breakdown;
}

/**
 * Collect Node.js process memory usage
 */
function getProcessMemory() {
  const memUsage = process.memoryUsage();

  return {
    rss: formatBytes(memUsage.rss),
    heapTotal: formatBytes(memUsage.heapTotal),
    heapUsed: formatBytes(memUsage.heapUsed),
    external: formatBytes(memUsage.external),
    arrayBuffers: formatBytes(memUsage.arrayBuffers || 0),
    rssBytes: memUsage.rss,
    heapTotalBytes: memUsage.heapTotal,
    heapUsedBytes: memUsage.heapUsed,
    externalBytes: memUsage.external,
  };
}

/**
 * Format bytes into human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = (bytes / Math.pow(1024, i)).toFixed(2);
  return `${value} ${units[i] || 'TB'}`;
}

/**
 * Format uptime seconds into Turkish human-readable string
 */
function formatUptime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${hours}s ${minutes}dk ${seconds}sn`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = withAdminAuth(async (req, res) => {
  // Apply response sanitization (strips AI model names from all responses)
  applySanitization(req, res);

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Yalnizca GET istekleri kabul edilir',
    });
  }

  const healthStart = Date.now();

  try {
    const redisConfigured = !!(UPSTASH_URL && UPSTASH_TOKEN);

    // Process-level metrics (always available)
    const uptimeSeconds = Math.floor(process.uptime());
    const processMemory = getProcessMemory();

    if (!redisConfigured) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'degraded',
          checkDurationMs: Date.now() - healthStart,
          redis: {
            configured: false,
            connectivity: { status: 'not_configured' },
            memory: { available: false },
            keys: {},
          },
          runtime: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            uptime: formatUptime(uptimeSeconds),
            uptimeSeconds,
            memory: processMemory,
          },
          environment: process.env.NODE_ENV || 'production',
          provider: 'LyDian AI',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Run all Redis health checks in parallel
    const [connectivity, memoryInfo, keyBreakdown] = await Promise.all([
      checkRedisConnectivity(),
      getRedisMemoryInfo(),
      getKeyCountBreakdown(),
    ]);

    // Determine overall health status
    let overallStatus = 'healthy';
    if (connectivity.status === 'disconnected') {
      overallStatus = 'critical';
    } else if (connectivity.status === 'degraded' || connectivity.latencyMs > 1000) {
      overallStatus = 'degraded';
    }

    const healthDuration = Date.now() - healthStart;

    return res.status(200).json({
      success: true,
      data: {
        status: overallStatus,
        checkDurationMs: healthDuration,
        redis: {
          configured: true,
          connectivity,
          memory: memoryInfo,
          keys: keyBreakdown,
        },
        runtime: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: formatUptime(uptimeSeconds),
          uptimeSeconds,
          memory: processMemory,
        },
        environment: process.env.NODE_ENV || 'production',
        provider: 'LyDian AI',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HEALTH_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Sistem sagligi kontrol edilirken bir hata olustu',
    });
  }
});
