/**
 * ANALYTICS - MAIN EXPORT
 *
 * Central export for all analytics functionality
 */

// Types
export type {
  AnalyticsEventType,
  AnalyticsEvent,
  VariantMetrics,
  ExperimentResults,
  ConversionGoal,
  StoredEvent,
  EventBatch,
  AnalyticsConfig,
  ChiSquareResult,
  ConfidenceInterval,
  SampleSizeCalculation,
} from './types';

// Event Tracker
export {
  EventTracker,
  getTracker,
  resetTracker,
  trackEvent,
  trackPageView,
  trackClick,
  trackConversion,
} from './event-tracker';

// Metrics Calculator
export {
  MetricsCalculator,
  getMetricsCalculator,
} from './metrics-calculator';

// Default export
export { default } from './event-tracker';
