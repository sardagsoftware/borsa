/**
 * 🔧 Connector Dock Panel - Vanilla JS
 * Right sidebar panel showing detailed connector information with tabs
 */

(function(window) {
  'use strict';

  const TABS = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'health', label: 'Health', icon: '💚' },
    { id: 'rateLimit', label: 'Rate Limit', icon: '⚡' },
    { id: 'logs', label: 'Logs', icon: '📜' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const HEALTH_CONFIG = {
    healthy: { color: 'green', pulse: 'bg-green-400', label: 'Healthy' },
    degraded: { color: 'yellow', pulse: 'bg-yellow-400', label: 'Degraded' },
    down: { color: 'red', pulse: 'bg-red-400', label: 'Down' }
  };

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
    const flagMap = {
      'US': '🇺🇸',
      'TR': '🇹🇷',
      'DE': '🇩🇪',
      'GB': '🇬🇧',
      'AE': '🇦🇪',
      'NL': '🇳🇱'
    };
    return flagMap[countryCode] || countryCode;
  }

  class ConnectorDockPanel {
    constructor(connectorManager) {
      this.manager = connectorManager;
      this.activeTab = 'overview';
      this.panelElement = null;
      this.init();
    }

    init() {
      // Create dock panel element
      this.createPanelElement();

      // Listen for dock toggle events
      this.manager.on('dockToggle', (isOpen, connector) => {
        if (isOpen && connector) {
          this.show(connector);
        } else {
          this.hide();
        }
      });
    }

    createPanelElement() {
      const panel = document.createElement('div');
      panel.className = 'connector-dock-panel';
      panel.id = 'connector-dock-panel';
      document.body.appendChild(panel);
      this.panelElement = panel;
    }

    show(connector) {
      if (!this.panelElement) this.createPanelElement();

      this.renderPanel(connector);
      this.panelElement.classList.add('open');
      this.attachEventListeners();
    }

    hide() {
      if (this.panelElement) {
        this.panelElement.classList.remove('open');
      }
    }

    renderPanel(connector) {
      const icon = VERTICAL_ICONS[connector.vertical] || '💼';
      const flag = getFlagEmoji(connector.countryCode);
      const healthConfig = HEALTH_CONFIG[connector.health.status];

      this.panelElement.innerHTML = `
        <!-- Dock Header -->
        <div class="dock-header">
          <div class="dock-header-top">
            <div class="dock-connector-info">
              <div class="dock-connector-logo">
                <span>${icon}</span>
              </div>
              <div class="dock-connector-title">
                <h2>
                  ${connector.name}
                  <span>${flag}</span>
                </h2>
                <div class="dock-connector-country">${connector.country}</div>
              </div>
            </div>
            <button class="btn-close-dock" id="close-dock" title="Close Panel">✕</button>
          </div>

          <div class="status-badge status-${connector.status === 'active' ? 'green' : 'yellow'}">
            ${connector.status === 'active' ? '✅' : '⚙️'}
            ${connector.status === 'active' ? 'Active' : 'Sandbox'}
          </div>
        </div>

        <!-- Dock Tabs -->
        <div class="dock-tabs">
          ${TABS.map(tab => `
            <button class="dock-tab ${tab.id === this.activeTab ? 'active' : ''}" data-tab="${tab.id}">
              <span>${tab.icon}</span>
              <span>${tab.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- Dock Content -->
        <div class="dock-content" id="dock-content">
          ${this.renderTabContent(connector)}
        </div>
      `;
    }

    renderTabContent(connector) {
      switch (this.activeTab) {
        case 'overview':
          return this.renderOverviewTab(connector);
        case 'health':
          return this.renderHealthTab(connector);
        case 'rateLimit':
          return this.renderRateLimitTab(connector);
        case 'logs':
          return this.renderLogsTab(connector);
        case 'settings':
          return this.renderSettingsTab(connector);
        default:
          return '';
      }
    }

    renderOverviewTab(connector) {
      return `
        <div class="dock-section">
          <h3 class="dock-section-title">Description</h3>
          <div class="dock-section-content">${connector.description}</div>
        </div>

        <div class="dock-section">
          <h3 class="dock-section-title">Quick Stats</h3>
          <div class="dock-stat-grid">
            <div class="dock-stat-card">
              <div class="dock-stat-label">Uptime</div>
              <div class="dock-stat-value" style="color: #22c55e">${connector.health.uptime.toFixed(1)}%</div>
            </div>
            <div class="dock-stat-card">
              <div class="dock-stat-label">Latency</div>
              <div class="dock-stat-value">${connector.health.latency}ms</div>
            </div>
            <div class="dock-stat-card">
              <div class="dock-stat-label">Success Rate</div>
              <div class="dock-stat-value">${connector.metrics.successRate.toFixed(1)}%</div>
            </div>
            <div class="dock-stat-card">
              <div class="dock-stat-label">Total Requests</div>
              <div class="dock-stat-value">${connector.metrics.totalRequests.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div class="dock-section">
          <h3 class="dock-section-title">Security & Compliance</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${connector.whiteHatVerified ? `
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); color: #22c55e; font-size: 12px; font-weight: 500;">
                <span>🛡️</span>
                <span>White-Hat Verified</span>
              </div>
            ` : ''}
            ${connector.kvkkCompliant ? `
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); color: #3b82f6; font-size: 12px; font-weight: 500;">
                <span>🔐</span>
                <span>KVKK Compliant</span>
              </div>
            ` : ''}
            ${connector.gdprCompliant ? `
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); color: #a855f7; font-size: 12px; font-weight: 500;">
                <span>🇪🇺</span>
                <span>GDPR Compliant</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="dock-section">
          <h3 class="dock-section-title">API Endpoint</h3>
          <div style="padding: 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #C4A962; word-break: break-all;">
            ${connector.apiEndpoint}
          </div>
        </div>

        <div class="dock-section">
          <a href="${connector.docsUrl}" target="_blank" rel="noopener noreferrer"
             style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; border-radius: 8px; background: linear-gradient(to right, rgba(196, 169, 98, 0.2), rgba(196, 169, 98, 0.15)); border: 1px solid rgba(196, 169, 98, 0.3); color: #C4A962; font-weight: 500; font-size: 14px; text-decoration: none; transition: all 0.2s;">
            <span>📖</span>
            <span>View Documentation</span>
            <span>↗</span>
          </a>
        </div>
      `;
    }

    renderHealthTab(connector) {
      const healthConfig = HEALTH_CONFIG[connector.health.status];

      return `
        <div class="dock-section">
          <div style="padding: 16px; border-radius: 12px; background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); border: 1px solid rgba(255, 255, 255, 0.1);">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <div style="position: relative;">
                <div class="pulse ${healthConfig.pulse}" style="width: 16px; height: 16px;"></div>
              </div>
              <h3 style="font-size: 18px; font-weight: 700; color: ${healthConfig.color === 'green' ? '#22c55e' : healthConfig.color === 'yellow' ? '#eab308' : '#ef4444'}; margin: 0;">
                ${healthConfig.label}
              </h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 14px;">
              <div>
                <span style="color: rgba(255, 255, 255, 0.6);">Uptime:</span>
                <span style="margin-left: 8px; font-weight: 600; color: ${healthConfig.color === 'green' ? '#22c55e' : healthConfig.color === 'yellow' ? '#eab308' : '#ef4444'};">
                  ${connector.health.uptime.toFixed(2)}%
                </span>
              </div>
              <div>
                <span style="color: rgba(255, 255, 255, 0.6);">Latency:</span>
                <span style="margin-left: 8px; font-weight: 600; color: #fff;">
                  ${connector.health.latency}ms
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="dock-section">
          <h3 class="dock-section-title">Performance Metrics</h3>
          <div style="display: grid; gap: 12px;">
            <div style="padding: 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="display: flex; justify-content: between; margin-bottom: 8px; font-size: 14px;">
                <span style="color: rgba(255, 255, 255, 0.6);">Success Rate</span>
                <span style="font-weight: 600; color: #fff;">${connector.metrics.successRate.toFixed(1)}%</span>
              </div>
              <div style="height: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.1); overflow: hidden;">
                <div style="height: 100%; border-radius: 4px; background: #22c55e; width: ${connector.metrics.successRate}%; transition: width 0.5s;"></div>
              </div>
            </div>
            <div style="padding: 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                <span style="color: rgba(255, 255, 255, 0.6);">Error Rate</span>
                <span style="font-weight: 600; color: #fff;">${connector.metrics.errorRate.toFixed(1)}%</span>
              </div>
              <div style="height: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.1); overflow: hidden;">
                <div style="height: 100%; border-radius: 4px; background: #ef4444; width: ${connector.metrics.errorRate}%; transition: width 0.5s;"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="dock-section">
          <h3 class="dock-section-title">Request Statistics</h3>
          <div class="dock-stat-grid">
            <div class="dock-stat-card">
              <div class="dock-stat-label">Total</div>
              <div class="dock-stat-value" style="font-size: 18px;">${connector.metrics.totalRequests.toLocaleString()}</div>
            </div>
            <div class="dock-stat-card">
              <div class="dock-stat-label">Success</div>
              <div class="dock-stat-value" style="font-size: 18px; color: #22c55e;">${connector.metrics.successfulRequests.toLocaleString()}</div>
            </div>
            <div class="dock-stat-card">
              <div class="dock-stat-label">Failed</div>
              <div class="dock-stat-value" style="font-size: 18px; color: #ef4444;">${connector.metrics.failedRequests.toLocaleString()}</div>
            </div>
            <div class="dock-stat-card">
              <div class="dock-stat-label">Last 24h</div>
              <div class="dock-stat-value" style="font-size: 18px; color: #3b82f6;">—</div>
            </div>
          </div>
        </div>

        ${connector.health.lastChecked ? `
          <div style="text-align: center; font-size: 12px; color: rgba(255, 255, 255, 0.6);">
            Last checked: ${new Date(connector.health.lastChecked).toLocaleString()}
          </div>
        ` : ''}
      `;
    }

    renderRateLimitTab(connector) {
      if (!connector.rateLimit) {
        return `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px;">⚡</div>
            <h3 style="font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 8px;">No Rate Limit Info</h3>
            <p style="font-size: 14px; color: rgba(255, 255, 255, 0.6); max-width: 300px;">
              Rate limit information is not available for this connector.
            </p>
          </div>
        `;
      }

      const { limit, remaining, reset, period } = connector.rateLimit;
      const usedPercentage = ((limit - remaining) / limit) * 100;

      return `
        <div class="dock-section">
          <div style="padding: 16px; border-radius: 12px; background: linear-gradient(to bottom right, rgba(196, 169, 98, 0.1), rgba(196, 169, 98, 0.05)); border: 1px solid rgba(196, 169, 98, 0.2);">
            <h3 style="font-size: 14px; font-weight: 600; color: #C4A962; margin-bottom: 12px;">Rate Limit Status</h3>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
              <div>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px;">Limit</div>
                <div style="font-size: 28px; font-weight: 700; color: #fff;">${limit}</div>
              </div>
              <div>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px;">Remaining</div>
                <div style="font-size: 28px; font-weight: 700; color: #C4A962;">${remaining}</div>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 8px;">
                <span>Used: ${limit - remaining}</span>
                <span>${usedPercentage.toFixed(1)}%</span>
              </div>
              <div style="height: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.1); overflow: hidden;">
                <div style="height: 100%; border-radius: 4px; background: ${usedPercentage > 90 ? '#ef4444' : usedPercentage > 70 ? '#eab308' : '#22c55e'}; width: ${usedPercentage}%; transition: width 0.5s;"></div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="color: rgba(255, 255, 255, 0.6);">Resets at:</span>
              <span style="color: #fff; font-weight: 500;">${new Date(reset).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div class="dock-section">
          <div style="padding: 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
            <div style="display: flex; justify-content: space-between; font-size: 14px;">
              <span style="color: rgba(255, 255, 255, 0.6);">Rate Limit Period</span>
              <span style="color: #fff; font-weight: 500; text-transform: capitalize;">${period}</span>
            </div>
          </div>
        </div>

        ${usedPercentage > 80 ? `
          <div class="dock-section">
            <div style="padding: 16px; border-radius: 8px; background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.2);">
              <div style="display: flex; gap: 8px;">
                <span style="color: #f97316; flex-shrink: 0;">⚠️</span>
                <div style="font-size: 12px; color: #f97316;">
                  <p style="font-weight: 500; margin-bottom: 4px;">Rate Limit Warning</p>
                  <p style="color: rgba(249, 115, 22, 0.7);">
                    You've used ${usedPercentage.toFixed(0)}% of your rate limit.
                    Consider implementing request throttling or waiting for the reset.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ` : ''}
      `;
    }

    renderLogsTab(connector) {
      // Mock logs
      const mockLogs = [
        { id: 1, timestamp: new Date(Date.now() - 5 * 60000), method: 'GET', endpoint: '/api/products', status: 200, duration: 145 },
        { id: 2, timestamp: new Date(Date.now() - 12 * 60000), method: 'POST', endpoint: '/api/orders', status: 201, duration: 230 },
        { id: 3, timestamp: new Date(Date.now() - 23 * 60000), method: 'GET', endpoint: '/api/inventory', status: 200, duration: 98 },
        { id: 4, timestamp: new Date(Date.now() - 45 * 60000), method: 'GET', endpoint: '/api/products/123', status: 404, duration: 67 },
        { id: 5, timestamp: new Date(Date.now() - 67 * 60000), method: 'PUT', endpoint: '/api/products/456', status: 200, duration: 189 }
      ];

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 14px; font-weight: 600; color: rgba(255, 255, 255, 0.6); margin: 0;">Recent API Calls</h3>
          <button style="font-size: 12px; color: #C4A962; background: none; border: none; cursor: pointer;">View All →</button>
        </div>

        <div style="display: grid; gap: 8px;">
          ${mockLogs.map(log => `
            <div style="padding: 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); transition: background 0.2s;" onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <div style="display: flex; gap: 8px;">
                  <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; ${
                    log.method === 'GET' ? 'background: rgba(59, 130, 246, 0.2); color: #3b82f6;' :
                    log.method === 'POST' ? 'background: rgba(34, 197, 94, 0.2); color: #22c55e;' :
                    log.method === 'PUT' ? 'background: rgba(234, 179, 8, 0.2); color: #eab308;' :
                    'background: rgba(168, 85, 247, 0.2); color: #a855f7;'
                  }">${log.method}</span>
                  <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; ${
                    log.status < 300 ? 'background: rgba(34, 197, 94, 0.2); color: #22c55e;' :
                    log.status < 400 ? 'background: rgba(234, 179, 8, 0.2); color: #eab308;' :
                    'background: rgba(239, 68, 68, 0.2); color: #ef4444;'
                  }">${log.status}</span>
                </div>
                <span style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                  ${log.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #fff; margin-bottom: 4px;">${log.endpoint}</div>
              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">Duration: ${log.duration}ms</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    renderSettingsTab(connector) {
      return `
        <div class="dock-section">
          <h3 class="dock-section-title">Connector Settings</h3>
          <div style="display: grid; gap: 12px;">
            ${this.renderToggle('Auto-sync enabled', true)}
            ${this.renderToggle('Webhook notifications', false)}
            ${this.renderToggle('Error alerts', true)}
            ${this.renderToggle('Rate limit warnings', true)}
          </div>
        </div>

        <div class="dock-section">
          <h3 class="dock-section-title">Data Retention</h3>
          <div style="padding: 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
            <div style="display: flex; justify-content: space-between; font-size: 14px;">
              <span style="color: rgba(255, 255, 255, 0.6);">Logs retention</span>
              <span style="color: #fff; font-weight: 500;">7 days</span>
            </div>
          </div>
        </div>

        <div class="dock-section">
          <h3 class="dock-section-title">Actions</h3>
          <div style="display: grid; gap: 8px;">
            <button style="width: 100%; padding: 12px 16px; border-radius: 8px; background: rgba(196, 169, 98, 0.2); border: 1px solid rgba(196, 169, 98, 0.3); color: #C4A962; font-weight: 500; font-size: 14px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(196, 169, 98, 0.3)'" onmouseout="this.style.background='rgba(196, 169, 98, 0.2)'">
              🔌 Test Connection
            </button>
            <button style="width: 100%; padding: 12px 16px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; font-weight: 500; font-size: 14px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'">
              🔄 Refresh Credentials
            </button>
            <button style="width: 100%; padding: 12px 16px; border-radius: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; font-weight: 500; font-size: 14px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'">
              🗑️ Disconnect
            </button>
          </div>
        </div>
      `;
    }

    renderToggle(label, enabled) {
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
          <span style="font-size: 14px; color: #fff;">${label}</span>
          <button style="position: relative; width: 44px; height: 24px; border-radius: 12px; border: none; background: ${enabled ? '#22c55e' : '#6b7280'}; cursor: pointer; transition: background 0.2s;">
            <div style="position: absolute; top: 4px; width: 16px; height: 16px; border-radius: 8px; background: #fff; transition: transform 0.2s; transform: ${enabled ? 'translateX(24px)' : 'translateX(4px)'};">
            </div>
          </button>
        </div>
      `;
    }

    attachEventListeners() {
      // Close button
      const closeBtn = this.panelElement.querySelector('#close-dock');
      if (closeBtn) {
        closeBtn.onclick = () => this.manager.closeDock();
      }

      // Tab buttons
      const tabButtons = this.panelElement.querySelectorAll('.dock-tab');
      tabButtons.forEach(btn => {
        btn.onclick = () => {
          this.activeTab = btn.dataset.tab;
          const connector = this.manager.activeConnector;
          if (connector) {
            this.renderPanel(connector);
          }
        };
      });
    }
  }

  // Export to window
  window.ConnectorDockPanel = ConnectorDockPanel;

  // Auto-initialize if manager exists
  if (window.connectorManager && !window.connectorDockPanel) {
    window.connectorDockPanel = new ConnectorDockPanel(window.connectorManager);
  }

})(window);
