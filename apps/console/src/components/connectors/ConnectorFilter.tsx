/**
 * 🔍 Connector Filter Component
 * Advanced filtering UI for connectors by country, vertical, status, region
 */

import React from 'react';
import { ConnectorFilters, ConnectorStatus, ConnectorVertical, ConnectorRegion } from '../../types/connectors';

interface ConnectorFilterProps {
  filters: ConnectorFilters;
  onFiltersChange: (filters: ConnectorFilters) => void;
  compact?: boolean;
}

const COUNTRY_OPTIONS = [
  { value: '', label: 'All Countries', flag: '🌍' },
  { value: 'TR', label: 'Türkiye', flag: '🇹🇷' },
  { value: 'US', label: 'United States', flag: '🇺🇸' },
  { value: 'DE', label: 'Germany', flag: '🇩🇪' },
  { value: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'AE', label: 'UAE', flag: '🇦🇪' },
  { value: 'NL', label: 'Netherlands', flag: '🇳🇱' }
];

const VERTICAL_OPTIONS: { value: ConnectorVertical | ''; label: string; icon: string }[] = [
  { value: '', label: 'All Verticals', icon: '🏢' },
  { value: 'ecommerce', label: 'E-Commerce', icon: '🛒' },
  { value: 'logistics', label: 'Logistics', icon: '📦' },
  { value: 'retail', label: 'Retail', icon: '🏪' },
  { value: 'food_delivery', label: 'Food Delivery', icon: '🍔' },
  { value: 'marketplace', label: 'Marketplace', icon: '🏬' },
  { value: 'fintech', label: 'Fintech', icon: '💳' }
];

const STATUS_OPTIONS: { value: ConnectorStatus | ''; label: string; icon: string }[] = [
  { value: '', label: 'All Statuses', icon: '📊' },
  { value: 'active', label: 'Active', icon: '✅' },
  { value: 'inactive', label: 'Inactive', icon: '💤' },
  { value: 'sandbox', label: 'Sandbox', icon: '⚙️' },
  { value: 'partner_required', label: 'Partner Required', icon: '🔒' }
];

const REGION_OPTIONS: { value: ConnectorRegion | ''; label: string; icon: string }[] = [
  { value: '', label: 'All Regions', icon: '🌎' },
  { value: 'EMEA', label: 'EMEA', icon: '🇪🇺' },
  { value: 'Americas', label: 'Americas', icon: '🌎' },
  { value: 'APAC', label: 'APAC', icon: '🌏' }
];

export const ConnectorFilter: React.FC<ConnectorFilterProps> = ({
  filters,
  onFiltersChange,
  compact = false
}) => {
  const updateFilter = <K extends keyof ConnectorFilters>(key: K, value: ConnectorFilters[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      country: undefined,
      vertical: undefined,
      status: undefined,
      region: undefined,
      whiteHatOnly: false
    });
  };

  const hasActiveFilters = !!(
    filters.country ||
    filters.vertical ||
    filters.status ||
    filters.region ||
    filters.whiteHatOnly
  );

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-white flex items-center gap-2`}>
          <span>🔍</span>
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-xs">
              Active
            </span>
          )}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Grid */}
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-3`}>
        {/* Country Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Country</label>
          <select
            value={filters.country || ''}
            onChange={(e) => updateFilter('country', e.target.value)}
            className="w-full px-3 py-2 rounded-lg
                     bg-white/5 border border-white/10
                     hover:bg-white/10 focus:bg-white/10 focus:border-amber-400/40
                     text-white text-sm
                     transition-all duration-200
                     outline-none cursor-pointer"
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.flag} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Vertical Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Vertical</label>
          <select
            value={filters.vertical || ''}
            onChange={(e) => updateFilter('vertical', e.target.value as ConnectorVertical)}
            className="w-full px-3 py-2 rounded-lg
                     bg-white/5 border border-white/10
                     hover:bg-white/10 focus:bg-white/10 focus:border-amber-400/40
                     text-white text-sm
                     transition-all duration-200
                     outline-none cursor-pointer"
          >
            {VERTICAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value as ConnectorStatus)}
            className="w-full px-3 py-2 rounded-lg
                     bg-white/5 border border-white/10
                     hover:bg-white/10 focus:bg-white/10 focus:border-amber-400/40
                     text-white text-sm
                     transition-all duration-200
                     outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Region Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Region</label>
          <select
            value={filters.region || ''}
            onChange={(e) => updateFilter('region', e.target.value as ConnectorRegion)}
            className="w-full px-3 py-2 rounded-lg
                     bg-white/5 border border-white/10
                     hover:bg-white/10 focus:bg-white/10 focus:border-amber-400/40
                     text-white text-sm
                     transition-all duration-200
                     outline-none cursor-pointer"
          >
            {REGION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* White-Hat Only Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">🛡️</span>
          <span className="text-sm text-white">White-Hat Verified Only</span>
        </div>
        <button
          onClick={() => updateFilter('whiteHatOnly', !filters.whiteHatOnly)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            filters.whiteHatOnly ? 'bg-emerald-500' : 'bg-gray-600'
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              filters.whiteHatOnly ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.country && (
            <FilterChip
              label={COUNTRY_OPTIONS.find((o) => o.value === filters.country)?.label || filters.country}
              onRemove={() => updateFilter('country', undefined)}
            />
          )}
          {filters.vertical && (
            <FilterChip
              label={VERTICAL_OPTIONS.find((o) => o.value === filters.vertical)?.label || filters.vertical}
              onRemove={() => updateFilter('vertical', undefined)}
            />
          )}
          {filters.status && (
            <FilterChip
              label={STATUS_OPTIONS.find((o) => o.value === filters.status)?.label || filters.status}
              onRemove={() => updateFilter('status', undefined)}
            />
          )}
          {filters.region && (
            <FilterChip
              label={filters.region}
              onRemove={() => updateFilter('region', undefined)}
            />
          )}
          {filters.whiteHatOnly && (
            <FilterChip
              label="White-Hat Only"
              onRemove={() => updateFilter('whiteHatOnly', false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Filter Chip Component
const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
                bg-amber-400/20 border border-amber-400/30 text-amber-400">
    <span className="text-xs font-medium">{label}</span>
    <button
      onClick={onRemove}
      className="hover:text-amber-300 transition-colors"
      title="Remove filter"
    >
      ✕
    </button>
  </div>
);
