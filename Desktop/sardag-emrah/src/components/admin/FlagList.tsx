'use client';

/**
 * FLAG LIST COMPONENT
 *
 * Display and manage feature flags
 * - Toggle flags on/off
 * - View flag details
 * - Filter by status/tags
 * - Override controls
 *
 * WHITE-HAT:
 * - Admin-only access
 * - Transparent controls
 * - Audit logging ready
 */

import { useState, useMemo } from 'react';
import type { FeatureFlag } from '@/lib/feature-flags/types';
import { FEATURE_FLAGS } from '@/lib/feature-flags/flags.config';
import { saveOverride, removeOverride, getOverride } from '@/lib/feature-flags/storage';

interface FlagListProps {
  searchQuery?: string;
  filterStatus?: 'all' | 'enabled' | 'disabled';
  filterTag?: string;
}

export function FlagList({ searchQuery = '', filterStatus = 'all', filterTag }: FlagListProps) {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>(FEATURE_FLAGS);
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);

  // Filter flags
  const filteredFlags = useMemo(() => {
    let result = Object.values(flags);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (flag) =>
          flag.key.toLowerCase().includes(query) ||
          flag.name.toLowerCase().includes(query) ||
          flag.description.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter((flag) =>
        filterStatus === 'enabled' ? flag.enabled : !flag.enabled
      );
    }

    // Tag filter
    if (filterTag) {
      result = result.filter((flag) => flag.tags?.includes(filterTag));
    }

    return result;
  }, [flags, searchQuery, filterStatus, filterTag]);

  // Toggle flag
  const handleToggle = (flagKey: string) => {
    const flag = flags[flagKey];
    const newEnabled = !flag.enabled;

    // Save override
    saveOverride({
      key: flagKey,
      enabled: newEnabled,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Update local state
    setFlags((prev) => ({
      ...prev,
      [flagKey]: {
        ...prev[flagKey],
        enabled: newEnabled,
      },
    }));

    console.log(`[Admin] Flag toggled: ${flagKey} → ${newEnabled}`);
  };

  // Remove override
  const handleRemoveOverride = (flagKey: string) => {
    removeOverride(flagKey);

    // Reset to original state
    const original = FEATURE_FLAGS[flagKey];
    setFlags((prev) => ({
      ...prev,
      [flagKey]: original,
    }));

    console.log(`[Admin] Override removed: ${flagKey}`);
  };

  // Check if flag has override
  const hasOverride = (flagKey: string): boolean => {
    return getOverride(flagKey) !== null;
  };

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
        <span>
          Toplam: <span className="font-mono text-white">{filteredFlags.length}</span>
        </span>
        <span>
          Aktif:{' '}
          <span className="font-mono text-green-400">
            {filteredFlags.filter((f) => f.enabled).length}
          </span>
        </span>
        <span>
          Kapalı:{' '}
          <span className="font-mono text-gray-500">
            {filteredFlags.filter((f) => !f.enabled).length}
          </span>
        </span>
      </div>

      {/* Flag list */}
      {filteredFlags.map((flag) => {
        const override = hasOverride(flag.key);
        const isExpanded = expandedFlag === flag.key;

        return (
          <div
            key={flag.key}
            className={`
              bg-gradient-to-br from-[#1a1f2e] to-[#0f1419]
              border rounded-lg p-4
              transition-all duration-200
              ${override ? 'border-yellow-500/40 shadow-lg shadow-yellow-500/10' : 'border-white/5'}
              ${flag.enabled ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-600'}
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Title */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-mono font-bold text-white truncate">{flag.key}</h3>
                  {override && (
                    <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                      OVERRIDE
                    </span>
                  )}
                  {flag.rolloutPercentage < 100 && (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                      {flag.rolloutPercentage}%
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-2">{flag.description}</p>

                {/* Tags */}
                {flag.tags && flag.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {flag.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-500 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(flag.key)}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${flag.enabled ? 'bg-green-500' : 'bg-gray-600'}
                  `}
                  title={flag.enabled ? 'Kapat' : 'Aç'}
                >
                  <div
                    className={`
                      absolute top-1 left-1 w-4 h-4 bg-white rounded-full
                      transition-transform
                      ${flag.enabled ? 'translate-x-6' : 'translate-x-0'}
                    `}
                  />
                </button>

                {/* Expand button */}
                <button
                  onClick={() => setExpandedFlag(isExpanded ? null : flag.key)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <svg
                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                {/* Status */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>{' '}
                    <span className="text-white font-mono">{flag.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rollout:</span>{' '}
                    <span className="text-white font-mono">{flag.rolloutPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>{' '}
                    <span className="text-white font-mono">
                      {new Date(flag.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>{' '}
                    <span className="text-white font-mono">
                      {new Date(flag.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Targeting */}
                {(flag.whitelist || flag.blacklist || flag.segments) && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase">Targeting</h4>
                    {flag.whitelist && (
                      <div className="text-sm">
                        <span className="text-gray-500">Whitelist:</span>{' '}
                        <span className="text-green-400 font-mono">{flag.whitelist.length} users</span>
                      </div>
                    )}
                    {flag.blacklist && (
                      <div className="text-sm">
                        <span className="text-gray-500">Blacklist:</span>{' '}
                        <span className="text-red-400 font-mono">{flag.blacklist.length} users</span>
                      </div>
                    )}
                    {flag.segments && (
                      <div className="text-sm">
                        <span className="text-gray-500">Segments:</span>{' '}
                        <span className="text-blue-400 font-mono">{flag.segments.length} segments</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {override && (
                  <button
                    onClick={() => handleRemoveOverride(flag.key)}
                    className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-sm transition-colors"
                  >
                    Override'ı Kaldır
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {filteredFlags.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <div>Sonuç bulunamadı</div>
        </div>
      )}
    </div>
  );
}
