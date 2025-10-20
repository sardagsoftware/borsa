/**
 * 🎛️ Connector Grid Component
 * Responsive grid layout with filtering
 */

import React, { useState } from 'react';
import { Connector, ConnectorFilters } from '../../types/connectors';
import { ConnectorCard } from './ConnectorCard';

interface ConnectorGridProps {
  connectors: Connector[];
  filters: ConnectorFilters;
  onConnectorClick: (connector: Connector) => void;
  onTest?: (connector: Connector) => void;
  onSettings?: (connector: Connector) => void;
}

export const ConnectorGrid: React.FC<ConnectorGridProps> = ({
  connectors,
  filters,
  onConnectorClick,
  onTest,
  onSettings
}) => {
  // Filter connectors
  const filteredConnectors = connectors.filter((connector) => {
    if (filters.country && connector.countryCode !== filters.country) return false;
    if (filters.vertical && connector.vertical !== filters.vertical) return false;
    if (filters.status && connector.status !== filters.status) return false;
    if (filters.region && connector.region !== filters.region) return false;
    if (filters.whiteHatOnly && !connector.whiteHatVerified) return false;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = connector.name.toLowerCase().includes(searchLower);
      const matchesDescription = connector.description.toLowerCase().includes(searchLower);
      const matchesCountry = connector.country.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesDescription && !matchesCountry) return false;
    }

    return true;
  });

  if (filteredConnectors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-white mb-2">No Connectors Found</h3>
        <p className="text-gray-400 max-w-md">
          No connectors match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredConnectors.map((connector) => (
        <ConnectorCard
          key={connector.id}
          connector={connector}
          onClick={onConnectorClick}
          onTest={onTest}
          onSettings={onSettings}
        />
      ))}
    </div>
  );
};
