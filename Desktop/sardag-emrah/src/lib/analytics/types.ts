/**
 * ANALYTICS TYPES
 *
 * Type definitions for A/B testing analytics
 * - Event tracking
 * - Conversion metrics
 * - Statistical analysis
 *
 * WHITE-HAT:
 * - Privacy-preserving
 * - No PII collection
 * - User consent respected
 */

// ════════════════════════════════════════════════════════════
// EVENT TYPES
// ════════════════════════════════════════════════════════════

/**
 * Analytics event types
 */
export type AnalyticsEventType =
  // Flag events
  | 'flag_evaluated'
  | 'flag_enabled'
  | 'flag_disabled'

  // Experiment events
  | 'experiment_assigned'
  | 'experiment_impression'
  | 'experiment_exposure'

  // Conversion events
  | 'conversion'
  | 'primary_goal'
  | 'secondary_goal'

  // User interaction events
  | 'click'
  | 'page_view'
  | 'button_click'
  | 'form_submit'

  // Trading-specific events
  | 'coin_card_click'
  | 'modal_open'
  | 'scan_button_click'
  | 'scan_completed'
  | 'signal_action'
  | 'signal_found';

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  // Identity
  id: string;
  type: AnalyticsEventType;
  timestamp: number;

  // User context
  userId: string;
  sessionId: string;

  // Experiment context (if in A/B test)
  experimentKey?: string;
  variantId?: string;

  // Flag context (if flag-related)
  flagKey?: string;
  flagEnabled?: boolean;

  // Event metadata
  properties?: Record<string, any>;

  // Page context
  page?: {
    path: string;
    title: string;
    referrer?: string;
  };

  // Device context
  device?: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    viewport: string;
  };
}

// ════════════════════════════════════════════════════════════
// METRICS TYPES
// ════════════════════════════════════════════════════════════

/**
 * Variant metrics (for A/B test)
 */
export interface VariantMetrics {
  variantId: string;
  variantName: string;

  // Sample size
  totalUsers: number;
  uniqueUsers: Set<string>; // For deduplication

  // Impressions
  impressions: number;

  // Conversions
  conversions: number;
  uniqueConversions: Set<string>;

  // Calculated metrics
  conversionRate: number; // conversions / totalUsers
  confidenceLevel: number; // 0-100

  // Statistical significance
  isSignificant: boolean;
  pValue: number;
}

/**
 * Experiment results
 */
export interface ExperimentResults {
  experimentKey: string;
  startDate: number;
  endDate?: number;
  status: 'running' | 'completed';

  // Variant metrics
  variants: Record<string, VariantMetrics>;

  // Overall metrics
  totalUsers: number;
  totalImpressions: number;
  totalConversions: number;

  // Winner (if determined)
  winner?: {
    variantId: string;
    uplift: number; // % improvement over control
    confidence: number; // 0-100
  };

  // Statistical test results
  chiSquare?: number;
  degreesOfFreedom?: number;
  pValue?: number;
}

/**
 * Conversion goal
 */
export interface ConversionGoal {
  name: string;
  eventType: AnalyticsEventType;
  properties?: Record<string, any>; // Filters
}

// ════════════════════════════════════════════════════════════
// STORAGE TYPES
// ════════════════════════════════════════════════════════════

/**
 * Stored event (in IndexedDB)
 */
export interface StoredEvent extends AnalyticsEvent {
  synced: boolean;
  retries: number;
}

/**
 * Event batch (for sending to server)
 */
export interface EventBatch {
  batchId: string;
  events: AnalyticsEvent[];
  createdAt: number;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  // Tracking
  enabled: boolean;
  trackPageViews: boolean;
  trackClicks: boolean;

  // Batching
  batchSize: number;
  flushInterval: number; // ms

  // Storage
  maxStoredEvents: number;
  retentionDays: number;

  // Privacy
  respectDoNotTrack: boolean;
  anonymizeIPs: boolean;
}

// ════════════════════════════════════════════════════════════
// STATISTICAL TYPES
// ════════════════════════════════════════════════════════════

/**
 * Chi-square test result
 */
export interface ChiSquareResult {
  chiSquare: number;
  degreesOfFreedom: number;
  pValue: number;
  isSignificant: boolean; // p < 0.05
}

/**
 * Confidence interval
 */
export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number; // 0.95 for 95%
}

/**
 * Sample size calculation
 */
export interface SampleSizeCalculation {
  requiredSampleSize: number;
  currentSampleSize: number;
  progress: number; // 0-100%
  estimatedDaysRemaining?: number;
}
