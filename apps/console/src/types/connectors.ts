/**
 * 🌐 Connector Network Types
 * Type definitions for global connector system
 */

export type ConnectorStatus = 'active' | 'inactive' | 'sandbox' | 'partner_required';

export type ConnectorVertical =
  | 'ecommerce'
  | 'logistics'
  | 'retail'
  | 'food_delivery'
  | 'marketplace'
  | 'fintech';

export type ConnectorRegion =
  | 'turkey'
  | 'europe'
  | 'mena'
  | 'global';

export interface ConnectorHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number; // percentage
  latency: number; // ms
  lastCheck: Date;
  errorRate: number; // percentage
}

export interface ConnectorRateLimit {
  limit: number;
  remaining: number;
  reset: Date;
  period: string; // e.g., '1 hour', '1 day'
}

export interface ConnectorPartner {
  required: boolean;
  name?: string;
  contactEmail?: string;
  docsUrl?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface ConnectorMetrics {
  totalRequests: number;
  successRate: number; // percentage
  avgResponseTime: number; // ms
  lastSync: Date;
}

export interface Connector {
  id: string;
  name: string;
  slug: string;
  description: string;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2 (TR, GB, etc.)
  region: ConnectorRegion;
  vertical: ConnectorVertical;
  status: ConnectorStatus;
  logoUrl: string;
  websiteUrl: string;
  docsUrl: string;
  apiEndpoint?: string;

  // Health & Performance
  health: ConnectorHealth;
  rateLimit?: ConnectorRateLimit;
  metrics: ConnectorMetrics;

  // Partnership
  partner?: ConnectorPartner;

  // Security & Compliance
  whiteHatVerified: boolean;
  kvkkCompliant: boolean;
  gdprCompliant: boolean;

  // Features
  features: string[];
  capabilities: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectorFilters {
  country?: string;
  vertical?: ConnectorVertical;
  status?: ConnectorStatus;
  region?: ConnectorRegion;
  search?: string;
  whiteHatOnly?: boolean;
}

export interface ConnectorCardProps {
  connector: Connector;
  onClick?: (connector: Connector) => void;
  onTest?: (connector: Connector) => void;
  onSettings?: (connector: Connector) => void;
}

export interface ConnectorGridProps {
  connectors: Connector[];
  filters: ConnectorFilters;
  onFilterChange: (filters: ConnectorFilters) => void;
  onConnectorClick: (connector: Connector) => void;
}

export interface ConnectorHeaderProps {
  totalConnectors: number;
  activeConnectors: number;
  onSearch: (query: string) => void;
}

export interface ConnectorFilterProps {
  filters: ConnectorFilters;
  onChange: (filters: ConnectorFilters) => void;
  availableCountries: string[];
  availableVerticals: ConnectorVertical[];
}

export interface ConnectorModalProps {
  connector: Connector | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface RealtimeStatusProps {
  connectorId: string;
  health: ConnectorHealth;
}
