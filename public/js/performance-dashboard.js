/**
 * 📊 AiLydian Ultra Pro - Performance Dashboard
 * Phase P: Performance Monitoring & Analytics
 *
 * Unified analytics dashboard displaying:
 * - Core Web Vitals (LCP, CLS, INP, FCP, TTFB)
 * - PWA metrics (installs, engagement, offline usage)
 * - Error tracking (JS errors, API failures, resources)
 * - User analytics (sessions, interactions)
 * - Real-time system health
 *
 * @version 1.0.0
 * @author LyDian AI Platform
 */

(function(global) {
  'use strict';

  // ============================
  // CONFIGURATION
  // ============================

  const CONFIG = {
    refreshInterval: 30000, // 30 seconds
    endpoints: {
      vitals: '/api/analytics/vitals',
      pwa: '/api/analytics/pwa',
      errors: '/api/analytics/errors',
      stats: '/api/analytics/stats',
      system: '/api/analytics/system'
    },
    debug: false
  };

  // Core Web Vitals thresholds
  const THRESHOLDS = {
    LCP: { good: 2500, needsImprovement: 4000 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    INP: { good: 200, needsImprovement: 500 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 }
  };

  // ============================
  // PERFORMANCE DASHBOARD
  // ============================

  class PerformanceDashboard {
    constructor(config = {}) {
      this.config = { ...CONFIG, ...config };
      this.data = {
        vitals: {},
        pwa: {},
        errors: {},
        stats: {},
        system: {}
      };
      this.refreshTimer = null;
      this.isLoading = false;

      this.init();
    }

    /**
     * Initialize dashboard
     */
    async init() {
      if (this.config.debug) {
        console.log('[Dashboard] Initializing...');
      }

      // Initial load
      await this.loadAllData();

      // Render dashboard
      this.render();

      // Setup auto-refresh
      this.setupAutoRefresh();

      if (this.config.debug) {
        console.log('[Dashboard] ✅ Initialized');
      }
    }

    /**
     * Load all analytics data
     */
    async loadAllData() {
      this.isLoading = true;
      this.updateLoadingState(true);

      const promises = [
        this.loadWebVitals(),
        this.loadPWAMetrics(),
        this.loadErrors(),
        this.loadUserStats(),
        this.loadSystemHealth()
      ];

      try {
        await Promise.allSettled(promises);
      } catch (error) {
        console.error('[Dashboard] Error loading data:', error);
      }

      this.isLoading = false;
      this.updateLoadingState(false);
    }

    /**
     * Load Core Web Vitals
     */
    async loadWebVitals() {
      try {
        const metrics = ['LCP', 'CLS', 'INP', 'FCP', 'TTFB'];
        const vitalsData = {};

        for (const metric of metrics) {
          const response = await fetch(`${this.config.endpoints.vitals}?metric=${metric}`);

          if (response.ok) {
            const data = await response.json();
            vitalsData[metric] = data.stats;
          }
        }

        this.data.vitals = vitalsData;

        if (this.config.debug) {
          console.log('[Dashboard] Web Vitals loaded:', vitalsData);
        }
      } catch (error) {
        console.error('[Dashboard] Error loading web vitals:', error);
      }
    }

    /**
     * Load PWA metrics
     */
    async loadPWAMetrics() {
      try {
        const response = await fetch(this.config.endpoints.pwa);

        if (response.ok) {
          const data = await response.json();
          this.data.pwa = data;

          if (this.config.debug) {
            console.log('[Dashboard] PWA metrics loaded:', data);
          }
        }
      } catch (error) {
        console.error('[Dashboard] Error loading PWA metrics:', error);
      }
    }

    /**
     * Load error statistics
     */
    async loadErrors() {
      try {
        const response = await fetch(this.config.endpoints.errors);

        if (response.ok) {
          const data = await response.json();
          this.data.errors = data;

          if (this.config.debug) {
            console.log('[Dashboard] Errors loaded:', data);
          }
        }
      } catch (error) {
        console.error('[Dashboard] Error loading errors:', error);
      }
    }

    /**
     * Load user analytics
     */
    async loadUserStats() {
      try {
        const response = await fetch(this.config.endpoints.stats);

        if (response.ok) {
          const data = await response.json();
          this.data.stats = data;

          if (this.config.debug) {
            console.log('[Dashboard] User stats loaded:', data);
          }
        }
      } catch (error) {
        console.error('[Dashboard] Error loading user stats:', error);
      }
    }

    /**
     * Load system health
     */
    async loadSystemHealth() {
      try {
        const response = await fetch(this.config.endpoints.system);

        if (response.ok) {
          const data = await response.json();
          this.data.system = data;

          if (this.config.debug) {
            console.log('[Dashboard] System health loaded:', data);
          }
        }
      } catch (error) {
        console.error('[Dashboard] Error loading system health:', error);
      }
    }

    /**
     * Setup auto-refresh
     */
    setupAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
      }

      this.refreshTimer = setInterval(async () => {
        if (!this.isLoading) {
          await this.loadAllData();
          this.render();
        }
      }, this.config.refreshInterval);
    }

    /**
     * Render dashboard
     */
    render() {
      this.renderWebVitals();
      this.renderPWAMetrics();
      this.renderErrors();
      this.renderUserStats();
      this.renderSystemHealth();
      this.updateLastUpdated();
    }

    /**
     * Render Core Web Vitals section
     */
    renderWebVitals() {
      const container = document.getElementById('web-vitals-container');
      if (!container) return;

      const metrics = ['LCP', 'CLS', 'INP', 'FCP', 'TTFB'];
      const metricsHTML = metrics.map(metric => {
        const data = this.data.vitals[metric];

        if (!data) {
          return this.renderMetricCard(metric, null, 'No data');
        }

        const value = data.p75; // Use 75th percentile
        const rating = this.getRating(metric, value);

        return this.renderMetricCard(metric, value, rating, data);
      }).join('');

      container.innerHTML = metricsHTML;
    }

    /**
     * Render metric card
     */
    renderMetricCard(metric, value, rating, data = null) {
      const displayValue = value !== null ? this.formatMetricValue(metric, value) : 'N/A';
      const ratingClass = rating ? `rating-${rating}` : 'rating-unknown';

      return `
        <div class="metric-card ${ratingClass}">
          <div class="metric-header">
            <h3 class="metric-name">${metric}</h3>
            <span class="metric-rating">${rating || 'Unknown'}</span>
          </div>
          <div class="metric-value">${displayValue}</div>
          ${data ? `
            <div class="metric-details">
              <div class="metric-stat">
                <span class="label">p50:</span>
                <span class="value">${this.formatMetricValue(metric, data.p50)}</span>
              </div>
              <div class="metric-stat">
                <span class="label">p95:</span>
                <span class="value">${this.formatMetricValue(metric, data.p95)}</span>
              </div>
              <div class="metric-stat">
                <span class="label">p99:</span>
                <span class="value">${this.formatMetricValue(metric, data.p99)}</span>
              </div>
              <div class="metric-stat">
                <span class="label">Samples:</span>
                <span class="value">${data.count || 0}</span>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    /**
     * Format metric value
     */
    formatMetricValue(metric, value) {
      if (value === null || value === undefined) return 'N/A';

      if (metric === 'CLS') {
        return value.toFixed(3);
      } else {
        return `${Math.round(value)}ms`;
      }
    }

    /**
     * Get rating for metric value
     */
    getRating(metric, value) {
      if (value === null || value === undefined) return 'unknown';

      const threshold = THRESHOLDS[metric];
      if (!threshold) return 'unknown';

      if (value <= threshold.good) {
        return 'good';
      } else if (value <= threshold.needsImprovement) {
        return 'needs-improvement';
      } else {
        return 'poor';
      }
    }

    /**
     * Render PWA metrics section
     */
    renderPWAMetrics() {
      const container = document.getElementById('pwa-metrics-container');
      if (!container) return;

      const pwa = this.data.pwa;

      container.innerHTML = `
        <div class="pwa-stat">
          <div class="stat-icon">📱</div>
          <div class="stat-content">
            <div class="stat-value">${pwa.totalInstalls || 0}</div>
            <div class="stat-label">Total Installs</div>
          </div>
        </div>
        <div class="pwa-stat">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-value">${pwa.activeUsers || 0}</div>
            <div class="stat-label">Active Users</div>
          </div>
        </div>
        <div class="pwa-stat">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">${pwa.engagementRate || 0}%</div>
            <div class="stat-label">Engagement Rate</div>
          </div>
        </div>
        <div class="pwa-stat">
          <div class="stat-icon">🔌</div>
          <div class="stat-content">
            <div class="stat-value">${pwa.offlineSessions || 0}</div>
            <div class="stat-label">Offline Sessions</div>
          </div>
        </div>
      `;
    }

    /**
     * Render errors section
     */
    renderErrors() {
      const container = document.getElementById('errors-container');
      if (!container) return;

      const errors = this.data.errors;

      container.innerHTML = `
        <div class="error-summary">
          <div class="error-stat">
            <div class="stat-value error-total">${errors.totalErrors || 0}</div>
            <div class="stat-label">Total Errors</div>
          </div>
          <div class="error-stat">
            <div class="stat-value error-js">${errors.javascriptErrors || 0}</div>
            <div class="stat-label">JavaScript Errors</div>
          </div>
          <div class="error-stat">
            <div class="stat-value error-api">${errors.apiErrors || 0}</div>
            <div class="stat-label">API Errors</div>
          </div>
          <div class="error-stat">
            <div class="stat-value error-resource">${errors.resourceErrors || 0}</div>
            <div class="stat-label">Resource Errors</div>
          </div>
        </div>
        ${errors.recentErrors && errors.recentErrors.length > 0 ? `
          <div class="recent-errors">
            <h4>Recent Errors</h4>
            <div class="error-list">
              ${errors.recentErrors.slice(0, 5).map(err => `
                <div class="error-item">
                  <div class="error-type">${err.type}</div>
                  <div class="error-message">${err.message}</div>
                  <div class="error-time">${new Date(err.timestamp).toLocaleString()}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `;
    }

    /**
     * Render user statistics
     */
    renderUserStats() {
      const container = document.getElementById('user-stats-container');
      if (!container) return;

      const stats = this.data.stats;

      container.innerHTML = `
        <div class="user-stat">
          <div class="stat-icon">👤</div>
          <div class="stat-content">
            <div class="stat-value">${stats.totalUsers || 0}</div>
            <div class="stat-label">Total Users</div>
          </div>
        </div>
        <div class="user-stat">
          <div class="stat-icon">🔥</div>
          <div class="stat-content">
            <div class="stat-value">${stats.activeUsers || 0}</div>
            <div class="stat-label">Active Users (7d)</div>
          </div>
        </div>
        <div class="user-stat">
          <div class="stat-icon">💬</div>
          <div class="stat-content">
            <div class="stat-value">${stats.totalMessages || 0}</div>
            <div class="stat-label">Total Messages</div>
          </div>
        </div>
        <div class="user-stat">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <div class="stat-value">${this.formatDuration(stats.avgSessionDuration)}</div>
            <div class="stat-label">Avg Session</div>
          </div>
        </div>
      `;
    }

    /**
     * Render system health
     */
    renderSystemHealth() {
      const container = document.getElementById('system-health-container');
      if (!container) return;

      const system = this.data.system;
      const overallHealth = system.healthy ? 'healthy' : 'degraded';

      container.innerHTML = `
        <div class="health-badge ${overallHealth}">
          <div class="health-icon">${system.healthy ? '✅' : '⚠️'}</div>
          <div class="health-text">${system.healthy ? 'All Systems Operational' : 'Some Systems Degraded'}</div>
        </div>
        <div class="health-services">
          ${Object.entries(system.services || {}).map(([service, status]) => `
            <div class="service-status ${status}">
              <span class="service-name">${service}</span>
              <span class="service-badge">${status}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    /**
     * Format duration
     */
    formatDuration(ms) {
      if (!ms) return 'N/A';

      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);

      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    }

    /**
     * Update last updated timestamp
     */
    updateLastUpdated() {
      const element = document.getElementById('last-updated');
      if (element) {
        element.textContent = new Date().toLocaleTimeString();
      }
    }

    /**
     * Update loading state
     */
    updateLoadingState(loading) {
      const element = document.getElementById('dashboard-loading');
      if (element) {
        element.style.display = loading ? 'block' : 'none';
      }
    }

    /**
     * Refresh dashboard data
     */
    async refresh() {
      await this.loadAllData();
      this.render();
    }

    /**
     * Destroy dashboard
     */
    destroy() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    }
  }

  // ============================
  // AUTO-INITIALIZATION
  // ============================

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      global.performanceDashboard = new PerformanceDashboard();
    });
  } else {
    global.performanceDashboard = new PerformanceDashboard();
  }

  // Expose class
  global.PerformanceDashboard = PerformanceDashboard;

  console.log('[Performance Dashboard] 📊 Dashboard loaded');

})(window);
