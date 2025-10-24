/**
 * FEATURE FLAGS - TYPE DEFINITIONS
 *
 * Production-grade feature flag system
 * - Type-safe flag definitions
 * - User segmentation
 * - Gradual rollout
 * - A/B testing support
 *
 * WHITE-HAT:
 * - Transparent to users
 * - No tracking without consent
 * - Privacy-preserving
 */

// ════════════════════════════════════════════════════════════
// CORE TYPES
// ════════════════════════════════════════════════════════════

/**
 * Feature flag status
 */
export type FlagStatus = 'enabled' | 'disabled' | 'experiment';

/**
 * User segment for targeting
 */
export interface UserSegment {
  id: string;
  name: string;
  description: string;
  rules: SegmentRule[];
}

/**
 * Segment rule (AND logic)
 */
export interface SegmentRule {
  type: 'user_id' | 'percentage' | 'date_range' | 'custom';
  operator: 'equals' | 'contains' | 'in' | 'between' | 'greater_than' | 'less_than';
  value: string | number | string[] | number[];
}

/**
 * Feature flag definition
 */
export interface FeatureFlag {
  // Identity
  key: string;
  name: string;
  description: string;

  // Status
  status: FlagStatus;
  enabled: boolean;

  // Rollout
  rolloutPercentage: number; // 0-100

  // Targeting
  segments?: UserSegment[];
  whitelist?: string[]; // User IDs always enabled
  blacklist?: string[]; // User IDs always disabled

  // Metadata
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  tags?: string[];
}

/**
 * A/B Test variant
 */
export interface Variant {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-100 (percentage)
  enabled: boolean;
}

/**
 * Experiment (A/B test) definition
 */
export interface Experiment {
  // Identity
  key: string;
  name: string;
  description: string;

  // Status
  status: 'draft' | 'running' | 'paused' | 'completed';

  // Variants
  variants: Variant[];

  // Targeting
  targetAudience: UserSegment[];
  trafficAllocation: number; // 0-100 (percentage of users in experiment)

  // Analytics
  metrics: string[]; // Event names to track
  goalMetric?: string; // Primary success metric

  // Dates
  startDate?: number;
  endDate?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * User assignment (which variant they see)
 */
export interface UserAssignment {
  userId: string;
  experimentKey: string;
  variantId: string;
  assignedAt: number;
}

/**
 * Flag evaluation result
 */
export interface FlagEvaluation {
  key: string;
  enabled: boolean;
  reason: EvaluationReason;
  variant?: string;
  metadata?: Record<string, any>;
}

/**
 * Why was this flag enabled/disabled?
 */
export type EvaluationReason =
  | 'default'
  | 'disabled'
  | 'enabled'
  | 'whitelisted'
  | 'blacklisted'
  | 'segment_match'
  | 'percentage_rollout'
  | 'experiment_assigned'
  | 'override';

/**
 * Flag override (for testing/admin)
 */
export interface FlagOverride {
  key: string;
  enabled: boolean;
  variant?: string;
  expiresAt?: number;
}

/**
 * Feature flags configuration
 */
export interface FeatureFlagsConfig {
  flags: Record<string, FeatureFlag>;
  experiments: Record<string, Experiment>;
  segments: Record<string, UserSegment>;
  overrides: Record<string, FlagOverride>;
}

// ════════════════════════════════════════════════════════════
// UTILITY TYPES
// ════════════════════════════════════════════════════════════

/**
 * Flag keys (type-safe)
 */
export type FlagKey = string;

/**
 * Variant key (type-safe)
 */
export type VariantKey = string;

/**
 * Event for analytics
 */
export interface FlagEvent {
  type: 'flag_evaluated' | 'variant_assigned' | 'conversion' | 'impression';
  timestamp: number;
  userId?: string;
  sessionId?: string;
  flagKey?: string;
  experimentKey?: string;
  variantId?: string;
  metadata?: Record<string, any>;
}

// ════════════════════════════════════════════════════════════
// TYPES EXPORTED ABOVE
// ════════════════════════════════════════════════════════════

// All types are already exported with their declarations above
// No need to re-export
