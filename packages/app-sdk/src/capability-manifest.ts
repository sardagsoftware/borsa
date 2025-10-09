// ========================================
// CAPABILITY MANIFEST - VENDOR REGISTRY
// Central registry for all connector capabilities
// White-Hat: Legal Gate enforcement
// ========================================

import type { ConnectorManifest, Capability } from './types';

/**
 * Capability Manifest Manager
 * Single source of truth for all vendor capabilities
 */
export class CapabilityManifestManager {
  private manifests: Map<string, ConnectorManifest> = new Map();

  /**
   * Register a connector manifest
   */
  register(manifest: ConnectorManifest): void {
    // Validation: Check Legal Gate status
    if (manifest.mode === 'partner_required' && manifest.status !== 'partner_ok') {
      console.warn(
        `[Legal Gate] Connector "${manifest.id}" requires partner agreement but status is "${manifest.status}"`
      );

      // Block production registration without partner approval
      if (process.env.NODE_ENV === 'production' && manifest.status !== 'partner_ok') {
        throw new Error(
          `[Legal Gate] Cannot register connector "${manifest.id}" in production without partner approval`
        );
      }
    }

    // Check for duplicate IDs
    if (this.manifests.has(manifest.id)) {
      throw new Error(`Connector manifest with ID "${manifest.id}" already registered`);
    }

    this.manifests.set(manifest.id, manifest);
    console.log(`✅ Registered connector: ${manifest.id} (${manifest.name}) - ${manifest.status}`);
  }

  /**
   * Get manifest by connector ID
   */
  get(connectorId: string): ConnectorManifest | undefined {
    return this.manifests.get(connectorId);
  }

  /**
   * Get all registered manifests
   */
  getAll(): ConnectorManifest[] {
    return Array.from(this.manifests.values());
  }

  /**
   * Get production-ready connectors only
   * Legal Gate: Filters out non-approved connectors
   */
  getProductionReady(): ConnectorManifest[] {
    return this.getAll().filter((manifest) => {
      // Disabled connectors
      if (manifest.status === 'disabled') {
        return false;
      }

      // Partner-required connectors MUST have partner_ok status
      if (manifest.mode === 'partner_required' && manifest.status !== 'partner_ok') {
        return false;
      }

      return true;
    });
  }

  /**
   * Get capabilities for a connector
   */
  getCapabilities(connectorId: string): Capability[] {
    const manifest = this.get(connectorId);
    return manifest?.capabilities || [];
  }

  /**
   * Find capability by action ID
   * Returns { connectorId, capability } or undefined
   */
  findCapability(actionId: string): { connectorId: string; capability: Capability } | undefined {
    for (const [connectorId, manifest] of this.manifests.entries()) {
      const capability = manifest.capabilities.find((cap) => cap.id === actionId);
      if (capability) {
        return { connectorId, capability };
      }
    }
    return undefined;
  }

  /**
   * Get all capabilities across all connectors
   */
  getAllCapabilities(): Array<{ connectorId: string; capability: Capability }> {
    const results: Array<{ connectorId: string; capability: Capability }> = [];

    for (const [connectorId, manifest] of this.manifests.entries()) {
      for (const capability of manifest.capabilities) {
        results.push({ connectorId, capability });
      }
    }

    return results;
  }

  /**
   * Check if an action requires partner approval
   * Legal Gate helper
   */
  requiresPartnerApproval(actionId: string): boolean {
    const result = this.findCapability(actionId);
    if (!result) return false;

    const manifest = this.get(result.connectorId);
    return manifest?.mode === 'partner_required' || result.capability.requiresPartner;
  }

  /**
   * Get connector status summary (for health dashboard)
   */
  getSummary(): {
    total: number;
    byStatus: Record<string, number>;
    byMode: Record<string, number>;
    productionReady: number;
  } {
    const manifests = this.getAll();

    const byStatus: Record<string, number> = {};
    const byMode: Record<string, number> = {};

    for (const manifest of manifests) {
      byStatus[manifest.status] = (byStatus[manifest.status] || 0) + 1;
      byMode[manifest.mode] = (byMode[manifest.mode] || 0) + 1;
    }

    return {
      total: manifests.length,
      byStatus,
      byMode,
      productionReady: this.getProductionReady().length,
    };
  }
}

// Singleton instance
export const capabilityRegistry = new CapabilityManifestManager();
