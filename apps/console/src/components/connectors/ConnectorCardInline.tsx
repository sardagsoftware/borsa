/**
 * 🎴 Connector Card Inline Component
 * Horizontal, compact connector card for embedding in chat messages
 * Used in MessageList to display connector info inline with conversations
 */

import React from 'react';
import { Connector, ConnectorStatus } from '../../types/connectors';

interface ConnectorCardInlineProps {
  connector: Connector;
  onOpenInDock?: (connector: Connector) => void;
  onQuickAction?: (connector: Connector, action: 'test' | 'docs' | 'settings') => void;
  showActions?: boolean;
  compact?: boolean;
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

export const ConnectorCardInline: React.FC<ConnectorCardInlineProps> = ({
  connector,
  onOpenInDock,
  onQuickAction,
  showActions = true,
  compact = false
}) => {
  const statusConfig = STATUS_CONFIG[connector.status];
  const healthConfig = HEALTH_CONFIG[connector.health.status];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl ${compact ? 'p-3' : 'p-4'}
                 bg-gradient-to-r from-white/5 via-white/[0.03] to-white/5
                 dark:from-white/10 dark:via-white/[0.06] dark:to-white/10
                 backdrop-blur-xl border border-white/10
                 hover:border-amber-400/40 dark:hover:border-amber-400/60
                 transition-all duration-200 ease-out
                 hover:shadow-lg hover:shadow-amber-400/10`}
    >
      {/* Gradient Glow (subtle on hover) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-transparent to-amber-400/10 blur-lg" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center gap-3">
        {/* Logo */}
        <div className={`flex-shrink-0 ${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg bg-white/10 dark:bg-white/5
                        flex items-center justify-center overflow-hidden border border-white/20`}>
          {connector.logoUrl ? (
            <img
              src={connector.logoUrl}
              alt={connector.name}
              className={`${compact ? 'w-7 h-7' : 'w-9 h-9'} object-contain`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={`${compact ? 'text-xl' : 'text-2xl'} ${connector.logoUrl ? 'hidden' : ''}`}>
            {connector.vertical === 'ecommerce' ? '🛒' :
             connector.vertical === 'logistics' ? '📦' :
             connector.vertical === 'retail' ? '🏪' :
             connector.vertical === 'food_delivery' ? '🍔' :
             connector.vertical === 'marketplace' ? '🏬' : '💼'}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name + Flag */}
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-white truncate group-hover:text-amber-400 transition-colors`}>
              {connector.name}
            </h4>
            <span className={compact ? 'text-base' : 'text-lg'}>{getFlagEmoji(connector.countryCode)}</span>
            {!compact && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${statusConfig.bg} ml-auto`}>
                <span className="text-xs">{statusConfig.icon}</span>
                <span className={`text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {/* Health Status */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <div className={`w-1.5 h-1.5 rounded-full ${healthConfig.pulse}`} />
                <div className={`absolute inset-0 w-1.5 h-1.5 rounded-full ${healthConfig.pulse} animate-ping`} />
              </div>
              <span className={healthConfig.color}>
                {connector.health.uptime.toFixed(1)}%
              </span>
            </div>

            {/* Latency */}
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>{connector.health.latency}ms</span>
            </div>

            {/* Success Rate (if available) */}
            {connector.metrics.totalRequests > 0 && (
              <div className="flex items-center gap-1">
                <span>✓</span>
                <span>{connector.metrics.successRate.toFixed(1)}%</span>
              </div>
            )}

            {/* Security Badges (compact mode) */}
            {!compact && (
              <div className="flex items-center gap-1 ml-auto">
                {connector.whiteHatVerified && (
                  <span className="text-xs" title="White-Hat Verified">🛡️</span>
                )}
                {connector.kvkkCompliant && (
                  <span className="text-xs" title="KVKK Compliant">🔐</span>
                )}
                {connector.gdprCompliant && (
                  <span className="text-xs" title="GDPR Compliant">🇪🇺</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex-shrink-0 flex items-center gap-2">
            {onOpenInDock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInDock(connector);
                }}
                className={`${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'} font-medium rounded-lg
                           bg-gradient-to-r from-amber-400/20 to-amber-500/20
                           hover:from-amber-400/30 hover:to-amber-500/30
                           text-amber-400 hover:text-amber-300
                           border border-amber-400/30 hover:border-amber-400/50
                           transition-all duration-200
                           flex items-center gap-1.5`}
                title="Open in Dock Panel"
              >
                <span>📋</span>
                {!compact && <span>Open</span>}
              </button>
            )}

            {onQuickAction && (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAction(connector, 'test');
                  }}
                  className={`${compact ? 'p-1.5' : 'p-2'} text-xs rounded-lg
                             bg-white/5 hover:bg-white/10
                             text-gray-300 hover:text-white
                             transition-colors duration-200`}
                  title="Test Connection"
                >
                  🔌
                </button>
                {!compact && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(connector.docsUrl, '_blank');
                      }}
                      className="p-2 text-xs rounded-lg
                               bg-white/5 hover:bg-white/10
                               text-gray-300 hover:text-white
                               transition-colors duration-200"
                      title="Documentation"
                    >
                      📖
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAction(connector, 'settings');
                      }}
                      className="p-2 text-xs rounded-lg
                               bg-white/5 hover:bg-white/10
                               text-gray-300 hover:text-white
                               transition-colors duration-200"
                      title="Settings"
                    >
                      ⚙️
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Partner Warning (if applicable) */}
      {connector.partner?.required && connector.partner.status !== 'approved' && !compact && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-start gap-2 text-xs text-orange-300">
            <span className="flex-shrink-0">⚠️</span>
            <div>
              <span className="font-medium">Partner API access required</span>
              {connector.partner.contactEmail && (
                <span className="text-orange-400/70 ml-1">
                  • {connector.partner.contactEmail}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
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
