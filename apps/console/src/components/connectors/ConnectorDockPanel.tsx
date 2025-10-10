/**
 * 🔧 Connector Dock Panel Component
 * Right sidebar panel (380px) showing detailed connector information
 * Features: Overview, Health, Rate Limit, Logs, Settings tabs
 */

import React, { useState } from 'react';
import { Connector } from '../../types/connectors';

interface ConnectorDockPanelProps {
  connector: Connector | null;
  onClose?: () => void;
  isOpen?: boolean;
}

type TabType = 'overview' | 'health' | 'rateLimit' | 'logs' | 'settings';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📋' },
  { id: 'health', label: 'Health', icon: '💚' },
  { id: 'rateLimit', label: 'Rate Limit', icon: '⚡' },
  { id: 'logs', label: 'Logs', icon: '📜' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

const STATUS_CONFIG = {
  active: { icon: '✅', label: 'Active', color: 'text-green-500', bg: 'bg-green-500/10' },
  inactive: { icon: '💤', label: 'Inactive', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  sandbox: { icon: '⚙️', label: 'Sandbox', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  partner_required: { icon: '🔒', label: 'Partner Required', color: 'text-orange-500', bg: 'bg-orange-500/10' }
};

const HEALTH_CONFIG = {
  healthy: { color: 'text-green-400', pulse: 'bg-green-400', label: 'Healthy' },
  degraded: { color: 'text-yellow-400', pulse: 'bg-yellow-400', label: 'Degraded' },
  down: { color: 'text-red-400', pulse: 'bg-red-400', label: 'Down' }
};

export const ConnectorDockPanel: React.FC<ConnectorDockPanelProps> = ({
  connector,
  onClose,
  isOpen = true
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!connector || !isOpen) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[connector.status];
  const healthConfig = HEALTH_CONFIG[connector.health.status];

  return (
    <div className="w-[380px] h-full flex flex-col bg-gradient-to-br from-gray-900/95 to-black/95
                   backdrop-blur-xl border-l border-white/10
                   shadow-2xl shadow-black/50">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <div className="flex items-start justify-between mb-4">
          {/* Logo + Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center
                          overflow-hidden border border-white/20">
              {connector.logoUrl ? (
                <img
                  src={connector.logoUrl}
                  alt={connector.name}
                  className="w-9 h-9 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`text-2xl ${connector.logoUrl ? 'hidden' : ''}`}>
                {connector.vertical === 'ecommerce' ? '🛒' :
                 connector.vertical === 'logistics' ? '📦' :
                 connector.vertical === 'retail' ? '🏪' :
                 connector.vertical === 'food_delivery' ? '🍔' :
                 connector.vertical === 'marketplace' ? '🏬' : '💼'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {connector.name}
                <span className="text-xl">{getFlagEmoji(connector.countryCode)}</span>
              </h2>
              <p className="text-xs text-gray-400">{connector.country}</p>
            </div>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10
                       text-gray-400 hover:text-white transition-colors"
              title="Close Panel"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConfig.bg}`}>
          <span>{statusConfig.icon}</span>
          <span className={`text-sm font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex items-center gap-1 px-4 py-3 border-b border-white/10
                     bg-white/[0.02] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                       transition-all duration-200 whitespace-nowrap
                       ${activeTab === tab.id
                         ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                         : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                       }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'overview' && <OverviewTab connector={connector} healthConfig={healthConfig} />}
        {activeTab === 'health' && <HealthTab connector={connector} healthConfig={healthConfig} />}
        {activeTab === 'rateLimit' && <RateLimitTab connector={connector} />}
        {activeTab === 'logs' && <LogsTab connector={connector} />}
        {activeTab === 'settings' && <SettingsTab connector={connector} />}
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC<{ connector: Connector; healthConfig: any }> = ({ connector, healthConfig }) => (
  <div className="space-y-6">
    {/* Description */}
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
      <p className="text-sm text-white leading-relaxed">{connector.description}</p>
    </div>

    {/* Quick Stats */}
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="text-xs text-gray-400 mb-1">Uptime</div>
        <div className={`text-xl font-bold ${healthConfig.color}`}>
          {connector.health.uptime.toFixed(1)}%
        </div>
      </div>
      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="text-xs text-gray-400 mb-1">Latency</div>
        <div className="text-xl font-bold text-white">
          {connector.health.latency}ms
        </div>
      </div>
      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="text-xs text-gray-400 mb-1">Success Rate</div>
        <div className="text-xl font-bold text-white">
          {connector.metrics.successRate.toFixed(1)}%
        </div>
      </div>
      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="text-xs text-gray-400 mb-1">Total Requests</div>
        <div className="text-xl font-bold text-white">
          {connector.metrics.totalRequests.toLocaleString()}
        </div>
      </div>
    </div>

    {/* Security & Compliance */}
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Security & Compliance</h3>
      <div className="flex flex-wrap gap-2">
        {connector.whiteHatVerified && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg
                        bg-emerald-500/10 border border-emerald-500/20">
            <span>🛡️</span>
            <span className="text-xs font-medium text-emerald-400">White-Hat Verified</span>
          </div>
        )}
        {connector.kvkkCompliant && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg
                        bg-blue-500/10 border border-blue-500/20">
            <span>🔐</span>
            <span className="text-xs font-medium text-blue-400">KVKK Compliant</span>
          </div>
        )}
        {connector.gdprCompliant && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg
                        bg-purple-500/10 border border-purple-500/20">
            <span>🇪🇺</span>
            <span className="text-xs font-medium text-purple-400">GDPR Compliant</span>
          </div>
        )}
      </div>
    </div>

    {/* API Endpoint */}
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-2">API Endpoint</h3>
      <div className="p-3 rounded-lg bg-white/5 border border-white/10
                    font-mono text-xs text-amber-400 break-all">
        {connector.apiEndpoint}
      </div>
    </div>

    {/* Documentation */}
    <div>
      <a
        href={connector.docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                 bg-gradient-to-r from-amber-400/20 to-amber-500/20
                 hover:from-amber-400/30 hover:to-amber-500/30
                 text-amber-400 hover:text-amber-300
                 border border-amber-400/30 hover:border-amber-400/50
                 transition-all duration-200 font-medium text-sm"
      >
        <span>📖</span>
        <span>View Documentation</span>
        <span>↗</span>
      </a>
    </div>

    {/* Partner Info (if applicable) */}
    {connector.partner?.required && (
      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-orange-400">⚠️</span>
          <h3 className="text-sm font-semibold text-orange-400">Partner API Access Required</h3>
        </div>
        <p className="text-xs text-orange-300/80 mb-3">
          This connector requires special partner API credentials. Contact the vendor to request access.
        </p>
        {connector.partner.contactEmail && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Contact:</span>
            <a
              href={`mailto:${connector.partner.contactEmail}`}
              className="text-amber-400 hover:text-amber-300 hover:underline"
            >
              {connector.partner.contactEmail}
            </a>
          </div>
        )}
        {connector.partner.status && (
          <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded
                        bg-white/10 text-xs text-gray-300">
            <span>Status:</span>
            <span className="capitalize">{connector.partner.status}</span>
          </div>
        )}
      </div>
    )}
  </div>
);

// Health Tab
const HealthTab: React.FC<{ connector: Connector; healthConfig: any }> = ({ connector, healthConfig }) => (
  <div className="space-y-6">
    {/* Overall Health */}
    <div className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className={`w-4 h-4 rounded-full ${healthConfig.pulse}`} />
          <div className={`absolute inset-0 w-4 h-4 rounded-full ${healthConfig.pulse} animate-ping`} />
        </div>
        <h3 className={`text-lg font-bold ${healthConfig.color}`}>{healthConfig.label}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-400">Uptime:</span>
          <span className={`ml-2 font-semibold ${healthConfig.color}`}>
            {connector.health.uptime.toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="text-gray-400">Latency:</span>
          <span className="ml-2 font-semibold text-white">
            {connector.health.latency}ms
          </span>
        </div>
      </div>
    </div>

    {/* Metrics */}
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Performance Metrics</h3>
      <div className="space-y-3">
        <MetricBar
          label="Success Rate"
          value={connector.metrics.successRate}
          max={100}
          color="emerald"
        />
        <MetricBar
          label="Error Rate"
          value={connector.metrics.errorRate}
          max={100}
          color="red"
        />
        {connector.metrics.avgResponseTime && (
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Avg Response Time</span>
              <span className="font-semibold text-white">
                {connector.metrics.avgResponseTime}ms
              </span>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Request Stats */}
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Request Statistics</h3>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total" value={connector.metrics.totalRequests.toLocaleString()} />
        <StatCard label="Success" value={connector.metrics.successfulRequests.toLocaleString()} color="green" />
        <StatCard label="Failed" value={connector.metrics.failedRequests.toLocaleString()} color="red" />
        <StatCard label="Last 24h" value="—" color="blue" />
      </div>
    </div>

    {/* Last Checked */}
    {connector.health.lastChecked && (
      <div className="text-xs text-gray-400 text-center">
        Last checked: {new Date(connector.health.lastChecked).toLocaleString()}
      </div>
    )}
  </div>
);

// Rate Limit Tab
const RateLimitTab: React.FC<{ connector: Connector }> = ({ connector }) => {
  if (!connector.rateLimit) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-5xl mb-3">⚡</div>
        <h3 className="text-lg font-bold text-white mb-2">No Rate Limit Info</h3>
        <p className="text-sm text-gray-400 max-w-xs">
          Rate limit information is not available for this connector.
        </p>
      </div>
    );
  }

  const { limit, remaining, reset, period } = connector.rateLimit;
  const usedPercentage = ((limit - remaining) / limit) * 100;

  return (
    <div className="space-y-6">
      {/* Rate Limit Overview */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
        <h3 className="text-sm font-semibold text-amber-400 mb-3">Rate Limit Status</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Limit</div>
            <div className="text-2xl font-bold text-white">{limit}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Remaining</div>
            <div className="text-2xl font-bold text-amber-400">{remaining}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Used: {limit - remaining}</span>
            <span>{usedPercentage.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usedPercentage > 90 ? 'bg-red-400' : usedPercentage > 70 ? 'bg-yellow-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${usedPercentage}%` }}
            />
          </div>
        </div>

        {/* Reset Time */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Resets at:</span>
          <span className="text-white font-medium">
            {new Date(reset).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Period Info */}
      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Rate Limit Period</span>
          <span className="text-white font-medium capitalize">{period}</span>
        </div>
      </div>

      {/* Warning (if close to limit) */}
      {usedPercentage > 80 && (
        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-start gap-2">
            <span className="text-orange-400 flex-shrink-0">⚠️</span>
            <div className="text-xs text-orange-300">
              <p className="font-medium mb-1">Rate Limit Warning</p>
              <p className="text-orange-400/70">
                You've used {usedPercentage.toFixed(0)}% of your rate limit.
                Consider implementing request throttling or waiting for the reset.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Logs Tab
const LogsTab: React.FC<{ connector: Connector }> = ({ connector }) => {
  // Mock logs for demonstration
  const mockLogs = [
    { id: 1, timestamp: new Date(Date.now() - 5 * 60000), method: 'GET', endpoint: '/api/products', status: 200, duration: 145 },
    { id: 2, timestamp: new Date(Date.now() - 12 * 60000), method: 'POST', endpoint: '/api/orders', status: 201, duration: 230 },
    { id: 3, timestamp: new Date(Date.now() - 23 * 60000), method: 'GET', endpoint: '/api/inventory', status: 200, duration: 98 },
    { id: 4, timestamp: new Date(Date.now() - 45 * 60000), method: 'GET', endpoint: '/api/products/123', status: 404, duration: 67 },
    { id: 5, timestamp: new Date(Date.now() - 67 * 60000), method: 'PUT', endpoint: '/api/products/456', status: 200, duration: 189 }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">Recent API Calls</h3>
        <button className="text-xs text-amber-400 hover:text-amber-300">
          View All →
        </button>
      </div>

      <div className="space-y-2">
        {mockLogs.map((log) => (
          <div
            key={log.id}
            className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  log.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                  log.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                  log.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {log.method}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  log.status < 300 ? 'bg-green-500/20 text-green-400' :
                  log.status < 400 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {log.status}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {log.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="font-mono text-xs text-white mb-1">{log.endpoint}</div>
            <div className="text-xs text-gray-400">Duration: {log.duration}ms</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Settings Tab
const SettingsTab: React.FC<{ connector: Connector }> = ({ connector }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Connector Settings</h3>
      <div className="space-y-3">
        <SettingToggle label="Auto-sync enabled" enabled={true} />
        <SettingToggle label="Webhook notifications" enabled={false} />
        <SettingToggle label="Error alerts" enabled={true} />
        <SettingToggle label="Rate limit warnings" enabled={true} />
      </div>
    </div>

    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Data Retention</h3>
      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Logs retention</span>
          <span className="text-white font-medium">7 days</span>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Actions</h3>
      <div className="space-y-2">
        <button className="w-full px-4 py-3 rounded-lg bg-amber-400/20 hover:bg-amber-400/30
                         text-amber-400 hover:text-amber-300 border border-amber-400/30
                         font-medium text-sm transition-all">
          🔌 Test Connection
        </button>
        <button className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10
                         text-white border border-white/10
                         font-medium text-sm transition-all">
          🔄 Refresh Credentials
        </button>
        <button className="w-full px-4 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20
                         text-red-400 hover:text-red-300 border border-red-500/20
                         font-medium text-sm transition-all">
          🗑️ Disconnect
        </button>
      </div>
    </div>
  </div>
);

// Helper Components
const MetricBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
    <div className="flex items-center justify-between text-sm mb-2">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-white">{value.toFixed(1)}%</span>
    </div>
    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className={`h-full rounded-full bg-${color}-400 transition-all duration-500`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);

const StatCard: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = 'white' }) => (
  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
    <div className="text-xs text-gray-400 mb-1">{label}</div>
    <div className={`text-lg font-bold text-${color}-400`}>{value}</div>
  </div>
);

const SettingToggle: React.FC<{ label: string; enabled: boolean }> = ({ label, enabled }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
    <span className="text-sm text-white">{label}</span>
    <button
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-emerald-500' : 'bg-gray-600'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

// Helper function to get flag emoji
function getFlagEmoji(countryCode: string): string {
  if (countryCode === 'US') return '🇺🇸';
  if (countryCode === 'TR') return '🇹🇷';
  if (countryCode === 'DE') return '🇩🇪';
  if (countryCode === 'GB') return '🇬🇧';
  if (countryCode === 'AE') return '🇦🇪';
  if (countryCode === 'NL') return '🇳🇱';

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
