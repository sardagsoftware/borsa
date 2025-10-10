/**
 * Capabilities & Health Loader
 * Always returns capabilities with fallback for menu visibility
 */

import { apiFetch } from './api';

export interface Capabilities {
  features: string[];
  roles?: string[];
  scopes?: string[];
}

/**
 * Default fallback capabilities
 * Ensures menus are always visible
 */
const DEFAULT_CAPABILITIES: Capabilities = {
  features: [
    'dashboard',
    'economy',
    'civic',
    'trust',
    'personas',
    'shipments',
    'marketplace',
    'esg',
    'compliance',
    'health',
    'connectors',
    'settings',
  ],
  roles: ['user'],
  scopes: [],
};

/**
 * Load capabilities from API with fallback
 */
export async function loadCapabilities(): Promise<Capabilities> {
  try {
    const response = await apiFetch('/api/capabilities', {
      skipThrottle: true, // Bypass throttling for critical endpoint
      skipRetry: false,
      maxRetries: 1,
    });

    if (!response.ok) {
      console.warn(\`Capabilities endpoint returned \${response.status}, using fallback\`);
      return DEFAULT_CAPABILITIES;
    }

    const data = await response.json();

    // Validate response structure
    if (!data.features || !Array.isArray(data.features)) {
      console.warn('Invalid capabilities response, using fallback');
      return DEFAULT_CAPABILITIES;
    }

    return data;
  } catch (error) {
    console.warn('Failed to load capabilities, using fallback:', error);
    return DEFAULT_CAPABILITIES;
  }
}

/**
 * Check if a feature is enabled
 */
export function hasFeature(capabilities: Capabilities, feature: string): boolean {
  return capabilities.features.includes(feature);
}

/**
 * Check if user has a role
 */
export function hasRole(capabilities: Capabilities, role: string): boolean {
  return capabilities.roles?.includes(role) || false;
}
