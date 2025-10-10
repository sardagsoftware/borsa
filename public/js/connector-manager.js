/**
 * 🔌 Connector Manager - Vanilla JS
 * Manages global connector network integration in Lydian-IQ single-screen interface
 *
 * Features:
 * - Connector data management
 * - Inline card rendering in chat messages
 * - Dock panel for detailed connector view
 * - Search and filtering
 * - Real-time health monitoring
 * - RBAC/Scopes integration
 */

(function(window) {
  'use strict';

  // Mock connector data (same as TypeScript version)
  const CONNECTORS = [
    {
      id: 'trendyol-tr',
      name: 'Trendyol',
      description: 'Leading Turkish e-commerce platform with 30M+ products',
      country: 'Türkiye',
      countryCode: 'TR',
      region: 'EMEA',
      vertical: 'ecommerce',
      status: 'active',
      logoUrl: null,
      apiEndpoint: 'https://api.trendyol.com/v1',
      docsUrl: 'https://developers.trendyol.com',
      health: {
        status: 'healthy',
        uptime: 99.9,
        latency: 45,
        lastChecked: new Date().toISOString()
      },
      rateLimit: {
        limit: 1000,
        remaining: 847,
        reset: Date.now() + 3600000,
        period: 'hourly'
      },
      metrics: {
        totalRequests: 15432,
        successfulRequests: 15398,
        failedRequests: 34,
        successRate: 99.78,
        errorRate: 0.22,
        avgResponseTime: 145
      },
      whiteHatVerified: true,
      kvkkCompliant: true,
      gdprCompliant: true
    },
    {
      id: 'hepsiburada-tr',
      name: 'Hepsiburada',
      description: 'Turkey\'s largest online shopping platform with 150M+ visits',
      country: 'Türkiye',
      countryCode: 'TR',
      region: 'EMEA',
      vertical: 'ecommerce',
      status: 'active',
      logoUrl: null,
      apiEndpoint: 'https://api.hepsiburada.com/v2',
      docsUrl: 'https://developer.hepsiburada.com',
      health: {
        status: 'healthy',
        uptime: 99.95,
        latency: 38,
        lastChecked: new Date().toISOString()
      },
      rateLimit: {
        limit: 2000,
        remaining: 1654,
        reset: Date.now() + 3600000,
        period: 'hourly'
      },
      metrics: {
        totalRequests: 23891,
        successfulRequests: 23856,
        failedRequests: 35,
        successRate: 99.85,
        errorRate: 0.15,
        avgResponseTime: 120
      },
      whiteHatVerified: true,
      kvkkCompliant: true,
      gdprCompliant: true
    },
    {
      id: 'migros-tr',
      name: 'Migros Sanal Market',
      description: 'Online grocery shopping with same-day delivery',
      country: 'Türkiye',
      countryCode: 'TR',
      region: 'EMEA',
      vertical: 'retail',
      status: 'active',
      logoUrl: null,
      apiEndpoint: 'https://api.migros.com.tr/v1',
      docsUrl: 'https://developers.migros.com.tr',
      health: {
        status: 'healthy',
        uptime: 99.7,
        latency: 52,
        lastChecked: new Date().toISOString()
      },
      rateLimit: {
        limit: 500,
        remaining: 387,
        reset: Date.now() + 3600000,
        period: 'hourly'
      },
      metrics: {
        totalRequests: 8945,
        successfulRequests: 8912,
        failedRequests: 33,
        successRate: 99.63,
        errorRate: 0.37,
        avgResponseTime: 165
      },
      whiteHatVerified: true,
      kvkkCompliant: true,
      gdprCompliant: true
    },
    {
      id: 'wolt-tr',
      name: 'Wolt',
      description: 'Food delivery platform with restaurant and grocery delivery',
      country: 'Türkiye',
      countryCode: 'TR',
      region: 'EMEA',
      vertical: 'food_delivery',
      status: 'active',
      logoUrl: null,
      apiEndpoint: 'https://api.wolt.com/v1',
      docsUrl: 'https://developers.wolt.com',
      health: {
        status: 'healthy',
        uptime: 99.85,
        latency: 42,
        lastChecked: new Date().toISOString()
      },
      rateLimit: {
        limit: 1500,
        remaining: 1123,
        reset: Date.now() + 3600000,
        period: 'hourly'
      },
      metrics: {
        totalRequests: 12456,
        successfulRequests: 12421,
        failedRequests: 35,
        successRate: 99.72,
        errorRate: 0.28,
        avgResponseTime: 132
      },
      whiteHatVerified: true,
      kvkkCompliant: true,
      gdprCompliant: true
    },
    {
      id: 'ups-global',
      name: 'UPS',
      description: 'Global logistics and package delivery tracking',
      country: 'United States',
      countryCode: 'US',
      region: 'Americas',
      vertical: 'logistics',
      status: 'active',
      logoUrl: null,
      apiEndpoint: 'https://onlinetools.ups.com/api',
      docsUrl: 'https://developer.ups.com',
      health: {
        status: 'healthy',
        uptime: 99.99,
        latency: 65,
        lastChecked: new Date().toISOString()
      },
      rateLimit: {
        limit: 5000,
        remaining: 4321,
        reset: Date.now() + 3600000,
        period: 'hourly'
      },
      metrics: {
        totalRequests: 45678,
        successfulRequests: 45632,
        failedRequests: 46,
        successRate: 99.90,
        errorRate: 0.10,
        avgResponseTime: 178
      },
      whiteHatVerified: true,
      kvkkCompliant: true,
      gdprCompliant: true
    }
  ];

  // Status config for badges
  const STATUS_CONFIG = {
    active: { icon: '✅', label: 'Active', color: 'green' },
    inactive: { icon: '💤', label: 'Inactive', color: 'gray' },
    sandbox: { icon: '⚙️', label: 'Sandbox', color: 'yellow' },
    partner_required: { icon: '🔒', label: 'Partner Required', color: 'orange' }
  };

  const HEALTH_CONFIG = {
    healthy: { color: 'green', pulse: 'bg-green-400', label: 'Healthy' },
    degraded: { color: 'yellow', pulse: 'bg-yellow-400', label: 'Degraded' },
    down: { color: 'red', pulse: 'bg-red-400', label: 'Down' }
  };

  // Vertical icons
  const VERTICAL_ICONS = {
    ecommerce: '🛒',
    logistics: '📦',
    retail: '🏪',
    food_delivery: '🍔',
    marketplace: '🏬',
    fintech: '💳'
  };

  // Flag emoji helper
  function getFlagEmoji(countryCode) {
    // Guard against undefined/null
    if (!countryCode) return '🏳️';

    const flagMap = {
      'US': '🇺🇸',
      'TR': '🇹🇷',
      'DE': '🇩🇪',
      'GB': '🇬🇧',
      'AE': '🇦🇪',
      'NL': '🇳🇱'
    };
    if (flagMap[countryCode]) return flagMap[countryCode];

    // Convert to regional indicator symbols
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  // Connector Manager Class
  class ConnectorManager {
    constructor() {
      this.connectors = CONNECTORS;
      this.activeConnector = null;
      this.isDockOpen = false;
      this.filters = {
        search: '',
        country: null,
        vertical: null,
        status: null,
        region: null,
        whiteHatOnly: false
      };
      this.callbacks = {
        onConnectorSelect: null,
        onDockToggle: null,
        onFilterChange: null
      };
    }

    // Get connector by ID
    getConnector(id) {
      return this.connectors.find(c => c.id === id);
    }

    // Get all connectors
    getAllConnectors() {
      return this.connectors;
    }

    // Get filtered connectors
    getFilteredConnectors() {
      return this.connectors.filter(connector => {
        if (this.filters.country && connector.countryCode !== this.filters.country) return false;
        if (this.filters.vertical && connector.vertical !== this.filters.vertical) return false;
        if (this.filters.status && connector.status !== this.filters.status) return false;
        if (this.filters.region && connector.region !== this.filters.region) return false;
        if (this.filters.whiteHatOnly && !connector.whiteHatVerified) return false;

        if (this.filters.search) {
          const searchLower = this.filters.search.toLowerCase();
          const matchesName = connector.name.toLowerCase().includes(searchLower);
          const matchesDescription = connector.description.toLowerCase().includes(searchLower);
          const matchesCountry = connector.country.toLowerCase().includes(searchLower);
          if (!matchesName && !matchesDescription && !matchesCountry) return false;
        }

        return true;
      });
    }

    // Get connector stats
    getStats() {
      const total = this.connectors.length;
      const active = this.connectors.filter(c => c.status === 'active').length;
      const avgUptime = this.connectors.reduce((sum, c) => sum + c.health.uptime, 0) / total;
      const avgLatency = Math.round(this.connectors.reduce((sum, c) => sum + c.health.latency, 0) / total);

      return { total, active, avgUptime: avgUptime.toFixed(1), avgLatency };
    }

    // Open connector in dock
    openInDock(connectorId) {
      const connector = this.getConnector(connectorId);
      if (connector) {
        this.activeConnector = connector;
        this.isDockOpen = true;
        if (this.callbacks.onDockToggle) {
          this.callbacks.onDockToggle(true, connector);
        }
      }
    }

    // Close dock
    closeDock() {
      this.isDockOpen = false;
      this.activeConnector = null;
      if (this.callbacks.onDockToggle) {
        this.callbacks.onDockToggle(false, null);
      }
    }

    // Update filters
    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters };
      if (this.callbacks.onFilterChange) {
        this.callbacks.onFilterChange(this.filters);
      }
    }

    // Register callbacks
    on(event, callback) {
      if (event === 'connectorSelect') this.callbacks.onConnectorSelect = callback;
      if (event === 'dockToggle') this.callbacks.onDockToggle = callback;
      if (event === 'filterChange') this.callbacks.onFilterChange = callback;
    }

    // Render inline connector card (for embedding in chat messages)
    renderInlineCard(connectorId, compact = false) {
      const connector = this.getConnector(connectorId);
      if (!connector) return '';

      const statusConfig = STATUS_CONFIG[connector.status];
      const healthConfig = HEALTH_CONFIG[connector.health.status];
      const icon = VERTICAL_ICONS[connector.vertical] || '💼';
      const flag = getFlagEmoji(connector.countryCode);

      return `
        <div class="connector-card-inline ${compact ? 'compact' : ''}" data-connector-id="${connector.id}">
          <div class="connector-card-inline-content">
            <!-- Logo -->
            <div class="connector-logo">
              <span class="connector-icon">${icon}</span>
            </div>

            <!-- Info -->
            <div class="connector-info">
              <div class="connector-header">
                <h4 class="connector-name">${connector.name}</h4>
                <span class="connector-flag">${flag}</span>
                ${!compact ? `<span class="status-badge status-${statusConfig.color}">${statusConfig.icon} ${statusConfig.label}</span>` : ''}
              </div>

              <div class="connector-metrics">
                <span class="metric health-${healthConfig.color}">
                  <span class="pulse ${healthConfig.pulse}"></span>
                  ${connector.health.uptime.toFixed(1)}%
                </span>
                <span class="metric">⚡ ${connector.health.latency}ms</span>
                ${connector.metrics.totalRequests > 0 ? `<span class="metric">✓ ${connector.metrics.successRate.toFixed(1)}%</span>` : ''}

                ${!compact && (connector.whiteHatVerified || connector.kvkkCompliant || connector.gdprCompliant) ? `
                  <div class="security-badges">
                    ${connector.whiteHatVerified ? '<span title="White-Hat Verified">🛡️</span>' : ''}
                    ${connector.kvkkCompliant ? '<span title="KVKK Compliant">🔐</span>' : ''}
                    ${connector.gdprCompliant ? '<span title="GDPR Compliant">🇪🇺</span>' : ''}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Actions -->
            <div class="connector-actions">
              <button class="btn-open-dock" data-connector-id="${connector.id}" title="Open in Dock">
                <span>📋</span>
                ${!compact ? '<span>Open</span>' : ''}
              </button>
              ${!compact ? `
                <button class="btn-test" data-connector-id="${connector.id}" title="Test Connection">🔌</button>
                <button class="btn-docs" data-connector-id="${connector.id}" title="Documentation">📖</button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }

    // Initialize event listeners
    initEventListeners() {
      const self = this;

      // Delegate click events for inline cards
      document.addEventListener('click', function(e) {
        // Open in dock button
        if (e.target.closest('.btn-open-dock')) {
          const connectorId = e.target.closest('.btn-open-dock').dataset.connectorId;
          self.openInDock(connectorId);
        }

        // Test button
        if (e.target.closest('.btn-test')) {
          const connectorId = e.target.closest('.btn-test').dataset.connectorId;
          const connector = self.getConnector(connectorId);
          console.log('Testing connector:', connector.name);
          // TODO: Implement test connection
        }

        // Docs button
        if (e.target.closest('.btn-docs')) {
          const connectorId = e.target.closest('.btn-docs').dataset.connectorId;
          const connector = self.getConnector(connectorId);
          window.open(connector.docsUrl, '_blank');
        }
      });
    }
  }

  // Export to window
  window.ConnectorManager = ConnectorManager;

  // Auto-initialize if not already done
  if (!window.connectorManager) {
    window.connectorManager = new ConnectorManager();
    window.connectorManager.initEventListeners();
  }

})(window);
