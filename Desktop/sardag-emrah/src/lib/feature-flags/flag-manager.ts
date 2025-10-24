/**
 * FEATURE FLAG MANAGER
 *
 * Core flag evaluation engine
 * - Evaluate flags based on rules
 * - Handle overrides
 * - User segmentation
 * - Percentage rollout
 * - A/B test variant assignment
 *
 * WHITE-HAT:
 * - Deterministic assignment
 * - Privacy-preserving
 * - Transparent logic
 */

import type {
  FeatureFlag,
  Experiment,
  FlagEvaluation,
  EvaluationReason,
  UserAssignment,
  Variant,
} from './types';
import {
  getUserId,
  getUserHash,
  getOverride,
  getAssignment,
  saveAssignment,
} from './storage';
import { FEATURE_FLAGS, EXPERIMENTS } from './flags.config';

// ════════════════════════════════════════════════════════════
// FLAG MANAGER CLASS
// ════════════════════════════════════════════════════════════

export class FlagManager {
  private userId: string;
  private userHash: number;

  constructor(userId?: string) {
    this.userId = userId || getUserId();
    this.userHash = getUserHash(this.userId);
  }

  /**
   * Evaluate a feature flag
   */
  evaluate(flagKey: string): FlagEvaluation {
    // Check if flag exists
    const flag = FEATURE_FLAGS[flagKey];
    if (!flag) {
      console.warn(`[FlagManager] Flag not found: ${flagKey}`);
      return {
        key: flagKey,
        enabled: false,
        reason: 'default',
      };
    }

    // Check for override (highest priority)
    const override = getOverride(flagKey);
    if (override) {
      console.log(`[FlagManager] Override active: ${flagKey} → ${override.enabled}`);
      return {
        key: flagKey,
        enabled: override.enabled,
        reason: 'override',
        variant: override.variant,
      };
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return {
        key: flagKey,
        enabled: false,
        reason: 'disabled',
      };
    }

    // Check whitelist
    if (flag.whitelist && flag.whitelist.includes(this.userId)) {
      return {
        key: flagKey,
        enabled: true,
        reason: 'whitelisted',
      };
    }

    // Check blacklist
    if (flag.blacklist && flag.blacklist.includes(this.userId)) {
      return {
        key: flagKey,
        enabled: false,
        reason: 'blacklisted',
      };
    }

    // Check percentage rollout
    if (flag.rolloutPercentage < 100) {
      const isInRollout = this.userHash < flag.rolloutPercentage;
      return {
        key: flagKey,
        enabled: isInRollout,
        reason: 'percentage_rollout',
        metadata: {
          rolloutPercentage: flag.rolloutPercentage,
          userHash: this.userHash,
        },
      };
    }

    // Default: flag is enabled
    return {
      key: flagKey,
      enabled: true,
      reason: 'enabled',
    };
  }

  /**
   * Check if flag is enabled (simple boolean)
   */
  isEnabled(flagKey: string): boolean {
    return this.evaluate(flagKey).enabled;
  }

  /**
   * Get variant for A/B test
   */
  getVariant(experimentKey: string): string | null {
    const experiment = EXPERIMENTS[experimentKey];
    if (!experiment) {
      console.warn(`[FlagManager] Experiment not found: ${experimentKey}`);
      return null;
    }

    // Check if experiment is running
    if (experiment.status !== 'running') {
      console.log(`[FlagManager] Experiment not running: ${experimentKey}`);
      return null;
    }

    // Check if user already assigned
    const existing = getAssignment(experimentKey, this.userId);
    if (existing) {
      console.log(`[FlagManager] Existing assignment: ${experimentKey} → ${existing.variantId}`);
      return existing.variantId;
    }

    // Check if user is in traffic allocation
    const isInExperiment = this.userHash < experiment.trafficAllocation;
    if (!isInExperiment) {
      console.log(`[FlagManager] User not in experiment: ${experimentKey} (hash: ${this.userHash}, allocation: ${experiment.trafficAllocation})`);
      return null;
    }

    // Assign variant based on weights
    const variant = this.assignVariant(experiment.variants);
    if (!variant) {
      return null;
    }

    // Save assignment
    const assignment: UserAssignment = {
      userId: this.userId,
      experimentKey,
      variantId: variant.id,
      assignedAt: Date.now(),
    };
    saveAssignment(assignment);

    console.log(`[FlagManager] New assignment: ${experimentKey} → ${variant.id}`);
    return variant.id;
  }

  /**
   * Assign variant based on weights
   */
  private assignVariant(variants: Variant[]): Variant | null {
    // Filter enabled variants
    const enabled = variants.filter((v) => v.enabled);
    if (enabled.length === 0) return null;

    // Calculate total weight
    const totalWeight = enabled.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight === 0) return null;

    // Normalize weights to 0-100
    const normalized = enabled.map((v) => ({
      ...v,
      normalizedWeight: (v.weight / totalWeight) * 100,
    }));

    // Assign based on user hash
    let cumulative = 0;
    for (const variant of normalized) {
      cumulative += variant.normalizedWeight;
      if (this.userHash < cumulative) {
        return variant;
      }
    }

    // Fallback to last variant
    return normalized[normalized.length - 1];
  }

  /**
   * Get all enabled flags for user
   */
  getEnabledFlags(): string[] {
    return Object.keys(FEATURE_FLAGS).filter((key) => this.isEnabled(key));
  }

  /**
   * Get user info
   */
  getUserInfo() {
    return {
      userId: this.userId,
      userHash: this.userHash,
      enabledFlags: this.getEnabledFlags(),
    };
  }
}

// ════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ════════════════════════════════════════════════════════════

let globalManager: FlagManager | null = null;

/**
 * Get global flag manager instance
 */
export function getFlagManager(): FlagManager {
  if (!globalManager) {
    globalManager = new FlagManager();
  }
  return globalManager;
}

/**
 * Reset global manager (for testing)
 */
export function resetFlagManager(): void {
  globalManager = null;
}

// ════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ════════════════════════════════════════════════════════════

/**
 * Check if flag is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  return getFlagManager().isEnabled(flagKey);
}

/**
 * Get experiment variant
 */
export function getExperimentVariant(experimentKey: string): string | null {
  return getFlagManager().getVariant(experimentKey);
}

/**
 * Evaluate flag
 */
export function evaluateFlag(flagKey: string): FlagEvaluation {
  return getFlagManager().evaluate(flagKey);
}

// ════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════

export default {
  FlagManager,
  getFlagManager,
  resetFlagManager,
  isFeatureEnabled,
  getExperimentVariant,
  evaluateFlag,
};
