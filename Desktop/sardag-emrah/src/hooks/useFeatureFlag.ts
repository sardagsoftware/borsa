/**
 * useFeatureFlag Hook
 *
 * React hook for feature flags
 * - Easy flag checking
 * - A/B test variants
 * - Real-time updates
 *
 * Usage:
 * const isEnabled = useFeatureFlag('my_feature');
 * const variant = useExperimentVariant('my_experiment');
 *
 * WHITE-HAT:
 * - Client-side only
 * - No server calls
 * - Privacy-preserving
 */

import { useState, useEffect } from 'react';
import { getFlagManager } from '@/lib/feature-flags/flag-manager';
import type { FlagEvaluation } from '@/lib/feature-flags/types';

// ════════════════════════════════════════════════════════════
// FEATURE FLAG HOOK
// ════════════════════════════════════════════════════════════

/**
 * Check if feature flag is enabled
 *
 * @param flagKey - Feature flag key
 * @returns boolean - Whether flag is enabled
 *
 * @example
 * const isDarkTheme = useFeatureFlag('dark_theme');
 * if (isDarkTheme) {
 *   // Show dark theme
 * }
 */
export function useFeatureFlag(flagKey: string): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const manager = getFlagManager();
    const evaluation = manager.evaluate(flagKey);
    setEnabled(evaluation.enabled);
  }, [flagKey]);

  return enabled;
}

/**
 * Get detailed flag evaluation
 *
 * @param flagKey - Feature flag key
 * @returns FlagEvaluation - Detailed evaluation with reason
 *
 * @example
 * const { enabled, reason, metadata } = useFlagEvaluation('advanced_charts');
 * console.log(`Flag enabled: ${enabled}, reason: ${reason}`);
 */
export function useFlagEvaluation(flagKey: string): FlagEvaluation {
  const [evaluation, setEvaluation] = useState<FlagEvaluation>({
    key: flagKey,
    enabled: false,
    reason: 'default',
  });

  useEffect(() => {
    const manager = getFlagManager();
    const result = manager.evaluate(flagKey);
    setEvaluation(result);
  }, [flagKey]);

  return evaluation;
}

// ════════════════════════════════════════════════════════════
// EXPERIMENT / A/B TEST HOOK
// ════════════════════════════════════════════════════════════

/**
 * Get variant for A/B test experiment
 *
 * @param experimentKey - Experiment key
 * @returns string | null - Variant ID or null if not in experiment
 *
 * @example
 * const variant = useExperimentVariant('confidence_badge_position');
 * if (variant === 'top_left') {
 *   // Show badge on top left
 * } else {
 *   // Show badge on top right (control)
 * }
 */
export function useExperimentVariant(experimentKey: string): string | null {
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    const manager = getFlagManager();
    const result = manager.getVariant(experimentKey);
    setVariant(result);
  }, [experimentKey]);

  return variant;
}

/**
 * Check if user is in experiment
 *
 * @param experimentKey - Experiment key
 * @returns boolean - Whether user is in experiment
 *
 * @example
 * const isInExperiment = useIsInExperiment('scanner_button_label');
 * if (isInExperiment) {
 *   // User is in experiment, show variant
 * }
 */
export function useIsInExperiment(experimentKey: string): boolean {
  const variant = useExperimentVariant(experimentKey);
  return variant !== null;
}

// ════════════════════════════════════════════════════════════
// MULTIPLE FLAGS HOOK
// ════════════════════════════════════════════════════════════

/**
 * Check multiple feature flags at once
 *
 * @param flagKeys - Array of flag keys
 * @returns Record<string, boolean> - Map of flag key to enabled status
 *
 * @example
 * const flags = useFeatureFlags(['dark_theme', 'advanced_charts', 'push_notifications']);
 * if (flags.dark_theme && flags.advanced_charts) {
 *   // Both enabled
 * }
 */
export function useFeatureFlags(flagKeys: string[]): Record<string, boolean> {
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const manager = getFlagManager();
    const result: Record<string, boolean> = {};

    for (const key of flagKeys) {
      result[key] = manager.isEnabled(key);
    }

    setFlags(result);
  }, [flagKeys]);

  return flags;
}

// ════════════════════════════════════════════════════════════
// USER INFO HOOK
// ════════════════════════════════════════════════════════════

/**
 * Get current user's flag info
 *
 * @returns User info with enabled flags
 *
 * @example
 * const { userId, userHash, enabledFlags } = useUserFlagInfo();
 * console.log(`User ${userId} has ${enabledFlags.length} flags enabled`);
 */
export function useUserFlagInfo() {
  const [info, setInfo] = useState({
    userId: '',
    userHash: 0,
    enabledFlags: [] as string[],
  });

  useEffect(() => {
    const manager = getFlagManager();
    const result = manager.getUserInfo();
    setInfo(result);
  }, []);

  return info;
}

// ════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════

export default {
  useFeatureFlag,
  useFlagEvaluation,
  useExperimentVariant,
  useIsInExperiment,
  useFeatureFlags,
  useUserFlagInfo,
};
