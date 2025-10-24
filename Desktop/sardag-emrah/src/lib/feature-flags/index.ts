/**
 * FEATURE FLAGS - MAIN EXPORT
 *
 * Central export for all feature flag functionality
 */

// Types
export type {
  FlagStatus,
  UserSegment,
  SegmentRule,
  FeatureFlag,
  Variant,
  Experiment,
  UserAssignment,
  FlagEvaluation,
  EvaluationReason,
  FlagOverride,
  FeatureFlagsConfig,
  FlagKey,
  VariantKey,
  FlagEvent,
} from './types';

// Configuration
export {
  FEATURE_FLAGS,
  EXPERIMENTS,
  USER_SEGMENTS,
  getEnabledFlags,
  getRunningExperiments,
  flagExists,
  experimentExists,
} from './flags.config';

// Storage
export {
  getUserId,
  getSessionId,
  getUserHash,
  saveOverride,
  getOverrides,
  getOverride,
  removeOverride,
  clearOverrides,
  saveAssignment,
  getAssignments,
  getAssignment,
  clearAssignments,
  setCookie,
  getCookie,
  deleteCookie,
} from './storage';

// Flag Manager
export {
  FlagManager,
  getFlagManager,
  resetFlagManager,
  isFeatureEnabled,
  getExperimentVariant,
  evaluateFlag,
} from './flag-manager';

// Default export
export { default } from './flag-manager';
