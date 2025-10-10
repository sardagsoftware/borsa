/**
 * 🎴 Connector Card Component
 * Premium card design with glassmorphism and animations
 */

import React from 'react';
import { Connector, ConnectorStatus } from '../../types/connectors';

interface ConnectorCardProps {
  connector: Connector;
  onClick?: (connector: Connector) => void;
  onTest?: (connector: Connector) => void;
  onSettings?: (connector: Connector) => void;
}

const STATUS_CONFIG: Record<ConnectorStatus, { icon: string; label: string; color: string; bg: string }> = {
  active: {
    icon: '✅',
    label: 'Active',
    color: 'text-green-500',
    bg: 'bg-green-500/10'
  },
  inactive: {
    icon: '💤',
    label: 'Inactive',
    color: 'text-gray-500',
    bg: 'bg-gray-500/10'
  },
  sandbox: {
    icon: '⚙️',
    label: 'Sandbox',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10'
  },
  partner_required: {
    icon: '🔒',
    label: 'Partner Required',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  }
};

const HEALTH_CONFIG = {
  healthy: { color: 'text-green-400', pulse: 'bg-green-400' },
  degraded: { color: 'text-yellow-400', pulse: 'bg-yellow-400' },
  down: { color: 'text-red-400', pulse: 'bg-red-400' }
};

export const ConnectorCard: React.FC<ConnectorCardProps> = ({
  connector,
  onClick,
  onTest,
  onSettings
}) => {
  const statusConfig = STATUS_CONFIG[connector.status];
  const healthConfig = HEALTH_CONFIG[connector.health.status];

  return (
    <div
      className="group relative overflow-hidden rounded-2xl cursor-pointer
                 bg-gradient-to-br from-white/5 to-white/[0.02]
                 dark:from-white/10 dark:to-white/[0.05]
                 backdrop-blur-xl border border-white/10
                 hover:border-amber-400/40 dark:hover:border-amber-400/60
                 transition-all duration-300 ease-out
                 hover:-translate-y-1 hover:scale-[1.02]
                 shadow-lg hover:shadow-xl hover:shadow-amber-400/20"
      onClick={() => onClick?.(connector)}
    >
      {/* Gradient Glow Border (appears on hover) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent blur-xl" />
      </div>

      {/* Card Content */}
      <div className="relative z-10 p-6 space-y-4">
        {/* Header: Logo + Status */}
        <div className="flex items-start justify-between">
          {/* Logo */}
          <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/10 dark:bg-white/5
                          flex items-center justify-center overflow-hidden
                          border border-white/20">
            {connector.logoUrl ? (
              <img
                src={connector.logoUrl}
                alt={connector.name}
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  // Fallback to emoji if image fails
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={`text-3xl ${connector.logoUrl ? 'hidden' : ''}`}>
              {connector.vertical === 'ecommerce' ? '🛒' :
               connector.vertical === 'logistics' ? '📦' :
               connector.vertical === 'retail' ? '🏪' :
               connector.vertical === 'food_delivery' ? '🍔' :
               connector.vertical === 'marketplace' ? '🏬' : '💼'}
            </span>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${statusConfig.bg}`}>
            <span className="text-sm">{statusConfig.icon}</span>
            <span className={`text-xs font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Title + Country */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
              {connector.name}
            </h3>
            <span className="text-xl">{getFlagEmoji(connector.countryCode)}</span>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2">
            {connector.description}
          </p>
        </div>

        {/* Health & Metrics */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {/* Live Status */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <div className={`w-2 h-2 rounded-full ${healthConfig.pulse}`} />
              <div className={`absolute inset-0 w-2 h-2 rounded-full ${healthConfig.pulse} animate-ping`} />
            </div>
            <span className={healthConfig.color}>
              {connector.health.uptime.toFixed(1)}% uptime
            </span>
          </div>

          {/* Latency */}
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span>{connector.health.latency}ms</span>
          </div>

          {/* Success Rate */}
          {connector.metrics.totalRequests > 0 && (
            <div className="flex items-center gap-1">
              <span>✓</span>
              <span>{connector.metrics.successRate.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Security Badges */}
        <div className="flex flex-wrap gap-2">
          {connector.whiteHatVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs
                           bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
              🛡️ White-Hat
            </span>
          )}
          {connector.kvkkCompliant && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs
                           bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">
              🔐 KVKK
            </span>
          )}
          {connector.gdprCompliant && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs
                           bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20">
              🇪🇺 GDPR
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t border-white/5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTest?.(connector);
            }}
            className="flex-1 px-3 py-2 text-xs font-medium rounded-lg
                     bg-white/5 hover:bg-white/10
                     text-gray-300 hover:text-white
                     transition-colors duration-200"
          >
            🔌 Test
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(connector.docsUrl, '_blank');
            }}
            className="flex-1 px-3 py-2 text-xs font-medium rounded-lg
                     bg-white/5 hover:bg-white/10
                     text-gray-300 hover:text-white
                     transition-colors duration-200"
          >
            📖 Docs
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSettings?.(connector);
            }}
            className="px-3 py-2 text-xs font-medium rounded-lg
                     bg-white/5 hover:bg-white/10
                     text-gray-300 hover:text-white
                     transition-colors duration-200"
          >
            ⚙️
          </button>
        </div>

        {/* Partner Warning */}
        {connector.partner?.required && connector.partner.status !== 'approved' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <span className="text-orange-400 flex-shrink-0">⚠️</span>
            <div className="text-xs text-orange-300">
              <p className="font-medium">Partner API Access Required</p>
              {connector.partner.contactEmail && (
                <p className="text-orange-400/70 mt-0.5">
                  Contact: {connector.partner.contactEmail}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  if (countryCode === 'US') return '🇺🇸';
  if (countryCode === 'TR') return '🇹🇷';
  if (countryCode === 'DE') return '🇩🇪';
  if (countryCode === 'GB') return '🇬🇧';
  if (countryCode === 'AE') return '🇦🇪';
  if (countryCode === 'NL') return '🇳🇱';

  // Convert country code to regional indicator symbols
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
