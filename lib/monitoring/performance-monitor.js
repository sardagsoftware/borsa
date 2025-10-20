/**
 * Application Performance Monitoring (APM)
 * Tracks request/response times, database queries, and system metrics
 *
 * White-Hat Policy: Performance monitoring only, no data collection
 */

import { createClient } from '@supabase/supabase-js';
import os from 'os';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * Metric types
 */
export const MetricType = {
  HTTP_REQUEST: 'http_request',
  DATABASE_QUERY: 'database_query',
  EXTERNAL_API: 'external_api',
  CACHE_HIT: 'cache_hit',
  CACHE_MISS: 'cache_miss',
  CUSTOM: 'custom',
};

/**
 * Performance Monitor class
 */
export class PerformanceMonitor {
  constructor(options = {}) {
    this.appName = options.appName || 'LyDian Platform';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.sampleRate = options.sampleRate || 1.0; // 1.0 = 100% sampling
    this.enableConsole = options.enableConsole !== false;
    this.enableDatabase = options.enableDatabase !== false;
    this.metricsBuffer = [];
    this.bufferSize = options.bufferSize || 100;
    this.flushInterval = options.flushInterval || 60000; // 1 minute

    // Start auto-flush
    if (this.enableDatabase) {
      this._startAutoFlush();
    }
  }

  /**
   * Track HTTP request
   */
  async trackRequest(req, res, duration) {
    if (!this._shouldSample()) return;

    const metric = {
      type: MetricType.HTTP_REQUEST,
      timestamp: new Date().toISOString(),
      duration,
      method: req.method,
      path: this._normalizePath(req.url),
      statusCode: res.statusCode,
      contentLength: res.get('content-length') || 0,
      userId: req.user?.id || null,
      ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
      userAgent: req.headers['user-agent'] || null,
    };

    await this._recordMetric(metric);
    return metric;
  }

  /**
   * Track database query
   */
  async trackQuery(query, duration, rows = 0) {
    if (!this._shouldSample()) return;

    const metric = {
      type: MetricType.DATABASE_QUERY,
      timestamp: new Date().toISOString(),
      duration,
      query: this._sanitizeQuery(query),
      rows,
    };

    await this._recordMetric(metric);
    return metric;
  }

  /**
   * Track external API call
   */
  async trackExternalAPI(url, duration, statusCode) {
    if (!this._shouldSample()) return;

    const metric = {
      type: MetricType.EXTERNAL_API,
      timestamp: new Date().toISOString(),
      duration,
      url: this._sanitizeURL(url),
      statusCode,
    };

    await this._recordMetric(metric);
    return metric;
  }

  /**
   * Track cache operation
   */
  async trackCache(key, hit) {
    if (!this._shouldSample()) return;

    const metric = {
      type: hit ? MetricType.CACHE_HIT : MetricType.CACHE_MISS,
      timestamp: new Date().toISOString(),
      key: this._sanitizeKey(key),
    };

    await this._recordMetric(metric);
    return metric;
  }

  /**
   * Track custom metric
   */
  async trackCustom(name, value, tags = {}) {
    if (!this._shouldSample()) return;

    const metric = {
      type: MetricType.CUSTOM,
      timestamp: new Date().toISOString(),
      name,
      value,
      tags,
    };

    await this._recordMetric(metric);
    return metric;
  }

  /**
   * Get system metrics (CPU, Memory, etc.)
   */
  getSystemMetrics() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      timestamp: new Date().toISOString(),
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model || 'unknown',
        usage: this._calculateCPUUsage(cpus),
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: (usedMem / totalMem) * 100,
      },
      os: {
        platform: os.platform(),
        release: os.release(),
        uptime: os.uptime(),
      },
    };
  }

  /**
   * Get performance statistics
   */
  async getStats(timeRange = '1h') {
    try {
      const minutes = timeRange === '1h' ? 60 : timeRange === '24h' ? 1440 : timeRange === '7d' ? 10080 : 60;
      const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('timestamp', since);

      if (error) throw error;

      // Calculate statistics
      const stats = {
        total: data.length,
        byType: {},
        httpRequests: {
          total: 0,
          avgDuration: 0,
          p50: 0,
          p95: 0,
          p99: 0,
          errorRate: 0,
        },
        databaseQueries: {
          total: 0,
          avgDuration: 0,
          avgRows: 0,
        },
        cache: {
          hits: 0,
          misses: 0,
          hitRate: 0,
        },
      };

      // Group by type
      data.forEach(metric => {
        stats.byType[metric.type] = (stats.byType[metric.type] || 0) + 1;
      });

      // HTTP requests stats
      const httpMetrics = data.filter(m => m.type === MetricType.HTTP_REQUEST);
      if (httpMetrics.length > 0) {
        const durations = httpMetrics.map(m => m.duration).sort((a, b) => a - b);
        const errors = httpMetrics.filter(m => m.status_code >= 400).length;

        stats.httpRequests.total = httpMetrics.length;
        stats.httpRequests.avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        stats.httpRequests.p50 = durations[Math.floor(durations.length * 0.5)];
        stats.httpRequests.p95 = durations[Math.floor(durations.length * 0.95)];
        stats.httpRequests.p99 = durations[Math.floor(durations.length * 0.99)];
        stats.httpRequests.errorRate = errors / httpMetrics.length;
      }

      // Database queries stats
      const dbMetrics = data.filter(m => m.type === MetricType.DATABASE_QUERY);
      if (dbMetrics.length > 0) {
        stats.databaseQueries.total = dbMetrics.length;
        stats.databaseQueries.avgDuration = dbMetrics.reduce((sum, m) => sum + m.duration, 0) / dbMetrics.length;
        stats.databaseQueries.avgRows = dbMetrics.reduce((sum, m) => sum + (m.rows || 0), 0) / dbMetrics.length;
      }

      // Cache stats
      const cacheHits = stats.byType[MetricType.CACHE_HIT] || 0;
      const cacheMisses = stats.byType[MetricType.CACHE_MISS] || 0;
      stats.cache.hits = cacheHits;
      stats.cache.misses = cacheMisses;
      stats.cache.hitRate = cacheHits + cacheMisses > 0
        ? cacheHits / (cacheHits + cacheMisses)
        : 0;

      return stats;
    } catch (error) {
      console.error('Failed to get performance stats:', error);
      return null;
    }
  }

  /**
   * Get slow queries (> 1s)
   */
  async getSlowQueries(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('type', MetricType.DATABASE_QUERY)
        .gte('duration', 1000)
        .order('duration', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get slow queries:', error);
      return [];
    }
  }

  /**
   * Record metric (buffered)
   */
  async _recordMetric(metric) {
    this.metricsBuffer.push({
      ...metric,
      environment: this.environment,
      app_name: this.appName,
    });

    // Log to console in development
    if (this.enableConsole && this.environment === 'development') {
      console.log('[APM]', metric.type, `${metric.duration}ms`);
    }

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.bufferSize) {
      await this._flush();
    }
  }

  /**
   * Flush metrics to database
   */
  async _flush() {
    if (this.metricsBuffer.length === 0) return;

    try {
      const batch = [...this.metricsBuffer];
      this.metricsBuffer = [];

      const { error } = await supabase
        .from('performance_metrics')
        .insert(batch.map(m => ({
          timestamp: m.timestamp,
          environment: m.environment,
          app_name: m.app_name,
          type: m.type,
          duration: m.duration || null,
          method: m.method || null,
          path: m.path || null,
          status_code: m.statusCode || null,
          content_length: m.contentLength || null,
          user_id: m.userId || null,
          ip_address: m.ip || null,
          user_agent: m.userAgent || null,
          query: m.query || null,
          rows: m.rows || null,
          url: m.url || null,
          cache_key: m.key || null,
          custom_name: m.name || null,
          custom_value: m.value || null,
          custom_tags: m.tags || null,
        })));

      if (error) {
        console.error('Failed to flush metrics:', error);
        // Re-add to buffer on failure
        this.metricsBuffer.push(...batch);
      }
    } catch (error) {
      console.error('Error flushing metrics:', error);
    }
  }

  /**
   * Start auto-flush timer
   */
  _startAutoFlush() {
    setInterval(() => {
      this._flush();
    }, this.flushInterval);
  }

  /**
   * Normalize URL path (remove IDs)
   */
  _normalizePath(path) {
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .split('?')[0]; // Remove query parameters
  }

  /**
   * Sanitize database query
   */
  _sanitizeQuery(query) {
    if (typeof query !== 'string') return String(query).substring(0, 500);
    return query.substring(0, 500); // Limit length
  }

  /**
   * Sanitize URL
   */
  _sanitizeURL(url) {
    try {
      const parsed = new URL(url);
      // Remove sensitive query parameters
      parsed.searchParams.delete('api_key');
      parsed.searchParams.delete('token');
      parsed.searchParams.delete('password');
      return parsed.toString();
    } catch {
      return url;
    }
  }

  /**
   * Sanitize cache key
   */
  _sanitizeKey(key) {
    return String(key).substring(0, 255);
  }

  /**
   * Calculate CPU usage
   */
  _calculateCPUUsage(cpus) {
    const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const totalTick = cpus.reduce((acc, cpu) =>
      acc + Object.values(cpu.times).reduce((a, b) => a + b, 0), 0);
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    return usage;
  }

  /**
   * Should sample this metric
   */
  _shouldSample() {
    return Math.random() < this.sampleRate;
  }
}

// Create default instance
export const performanceMonitor = new PerformanceMonitor({
  appName: 'LyDian Platform',
  environment: process.env.NODE_ENV,
  sampleRate: process.env.APM_SAMPLE_RATE || 1.0,
});

// Express/Next.js middleware for automatic request tracking
export function performanceMiddleware(req, res, next) {
  const startTime = Date.now();

  // Hook into response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    performanceMonitor.trackRequest(req, res, duration);
  });

  next();
}

export default PerformanceMonitor;
