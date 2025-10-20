/**
 * FEATURE FLAGS CONFIGURATION
 *
 * All feature flags defined here
 * - Production-ready flags
 * - Experiments (A/B tests)
 * - User segments
 *
 * WHITE-HAT:
 * - Transparent feature rollout
 * - No dark patterns
 * - User-centric design
 */

import type { FeatureFlag, Experiment, UserSegment } from './types';

// ════════════════════════════════════════════════════════════
// USER SEGMENTS
// ════════════════════════════════════════════════════════════

export const USER_SEGMENTS: Record<string, UserSegment> = {
  // Early adopters (10%)
  early_adopters: {
    id: 'early_adopters',
    name: 'Early Adopters',
    description: 'First 10% of users to try new features',
    rules: [
      {
        type: 'percentage',
        operator: 'less_than',
        value: 10,
      },
    ],
  },

  // Beta testers (25%)
  beta_testers: {
    id: 'beta_testers',
    name: 'Beta Testers',
    description: '25% of users for beta testing',
    rules: [
      {
        type: 'percentage',
        operator: 'less_than',
        value: 25,
      },
    ],
  },

  // All users (100%)
  all_users: {
    id: 'all_users',
    name: 'All Users',
    description: 'Everyone',
    rules: [
      {
        type: 'percentage',
        operator: 'less_than',
        value: 100,
      },
    ],
  },
};

// ════════════════════════════════════════════════════════════
// FEATURE FLAGS
// ════════════════════════════════════════════════════════════

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // ─────────────────────────────────────────────────────────
  // TRADING FEATURES
  // ─────────────────────────────────────────────────────────

  advanced_charts: {
    key: 'advanced_charts',
    name: 'Advanced Charts',
    description: 'TradingView-style advanced charting with indicators',
    status: 'enabled',
    enabled: true,
    rolloutPercentage: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['trading', 'charts', 'stable'],
  },

  multi_timeframe_analysis: {
    key: 'multi_timeframe_analysis',
    name: 'Multi-Timeframe Analysis',
    description: 'Analyze multiple timeframes simultaneously',
    status: 'enabled',
    enabled: true,
    rolloutPercentage: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['trading', 'analysis', 'stable'],
  },

  confidence_score_visual: {
    key: 'confidence_score_visual',
    name: 'Confidence Score Visual System',
    description: 'Color-coded confidence indicators on coin cards',
    status: 'enabled',
    enabled: true,
    rolloutPercentage: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['ui', 'signals', 'new'],
  },

  // ─────────────────────────────────────────────────────────
  // PERFORMANCE FEATURES
  // ─────────────────────────────────────────────────────────

  aggressive_caching: {
    key: 'aggressive_caching',
    name: 'Aggressive Caching',
    description: 'More aggressive caching for better performance',
    status: 'enabled',
    enabled: true,
    rolloutPercentage: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['performance', 'caching', 'stable'],
  },

  service_worker_advanced: {
    key: 'service_worker_advanced',
    name: 'Advanced Service Worker',
    description: 'Offline-first architecture with advanced SW',
    status: 'enabled',
    enabled: true,
    rolloutPercentage: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['performance', 'offline', 'stable'],
  },

  // ─────────────────────────────────────────────────────────
  // UI/UX FEATURES
  // ─────────────────────────────────────────────────────────

  dark_theme: {
    key: 'dark_theme',
    name: 'Dark Theme',
    description: 'Dark mode theme (default)',
    status: 'enabled',
    enabled: true,
    rolloutPercentage: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['ui', 'theme', 'stable'],
  },

  light_theme: {
    key: 'light_theme',
    name: 'Light Theme',
    description: 'Light mode theme (beta)',
    status: 'disabled',
    enabled: false,
    rolloutPercentage: 0,
    segments: [USER_SEGMENTS.beta_testers],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['ui', 'theme', 'beta'],
  },

  animated_transitions: {
    key: 'animated_transitions',
    name: 'Animated Transitions',
    description: 'Smooth animations between pages',
    status: 'disabled',
    enabled: false,
    rolloutPercentage: 25,
    segments: [USER_SEGMENTS.early_adopters],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['ui', 'animations', 'beta'],
  },

  // ─────────────────────────────────────────────────────────
  // NOTIFICATION FEATURES
  // ─────────────────────────────────────────────────────────

  push_notifications: {
    key: 'push_notifications',
    name: 'Push Notifications',
    description: 'Browser push notifications for signals',
    status: 'enabled',
    enabled: true,
    rolloutPercentage: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['notifications', 'stable'],
  },

  background_scanner: {
    key: 'background_scanner',
    name: 'Background Scanner',
    description: 'Continuous background coin scanning',
    status: 'enabled',
    enabled: true,
    rolloutPercentage: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['scanner', 'notifications', 'stable'],
  },

  // ─────────────────────────────────────────────────────────
  // EXPERIMENTAL FEATURES
  // ─────────────────────────────────────────────────────────

  ai_signal_prediction: {
    key: 'ai_signal_prediction',
    name: 'AI Signal Prediction',
    description: 'Machine learning-based signal prediction',
    status: 'disabled',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['experimental', 'ai', 'future'],
  },

  social_trading: {
    key: 'social_trading',
    name: 'Social Trading',
    description: 'Follow and copy other traders',
    status: 'disabled',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['experimental', 'social', 'future'],
  },

  voice_commands: {
    key: 'voice_commands',
    name: 'Voice Commands',
    description: 'Control app with voice commands',
    status: 'disabled',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['experimental', 'accessibility', 'future'],
  },
};

// ════════════════════════════════════════════════════════════
// A/B EXPERIMENTS
// ════════════════════════════════════════════════════════════

export const EXPERIMENTS: Record<string, Experiment> = {
  // Confidence badge position test
  confidence_badge_position: {
    key: 'confidence_badge_position',
    name: 'Confidence Badge Position Test',
    description: 'Test different positions for confidence score badge',
    status: 'draft',
    variants: [
      {
        id: 'control',
        name: 'Top Right (Current)',
        description: 'Badge at top-right corner',
        weight: 50,
        enabled: true,
      },
      {
        id: 'top_left',
        name: 'Top Left',
        description: 'Badge at top-left corner',
        weight: 50,
        enabled: true,
      },
    ],
    targetAudience: [USER_SEGMENTS.early_adopters],
    trafficAllocation: 50,
    metrics: ['coin_card_click', 'modal_open', 'signal_action'],
    goalMetric: 'coin_card_click',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // Scanner button label test
  scanner_button_label: {
    key: 'scanner_button_label',
    name: 'Scanner Button Label Test',
    description: 'Test different labels for scan button',
    status: 'draft',
    variants: [
      {
        id: 'control',
        name: 'Tara (Current)',
        description: 'Current "Tara" label',
        weight: 33,
        enabled: true,
      },
      {
        id: 'variant_a',
        name: 'Sinyal Ara',
        description: 'Search for signals',
        weight: 33,
        enabled: true,
      },
      {
        id: 'variant_b',
        name: 'Analiz Et',
        description: 'Analyze',
        weight: 34,
        enabled: true,
      },
    ],
    targetAudience: [USER_SEGMENTS.beta_testers],
    trafficAllocation: 30,
    metrics: ['scan_button_click', 'scan_completed', 'signal_found'],
    goalMetric: 'scan_completed',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
};

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

/**
 * Get all enabled flags
 */
export function getEnabledFlags(): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter((flag) => flag.enabled);
}

/**
 * Get all running experiments
 */
export function getRunningExperiments(): Experiment[] {
  return Object.values(EXPERIMENTS).filter((exp) => exp.status === 'running');
}

/**
 * Check if flag exists
 */
export function flagExists(key: string): boolean {
  return key in FEATURE_FLAGS;
}

/**
 * Check if experiment exists
 */
export function experimentExists(key: string): boolean {
  return key in EXPERIMENTS;
}

// ════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════

export default {
  FEATURE_FLAGS,
  EXPERIMENTS,
  USER_SEGMENTS,
  getEnabledFlags,
  getRunningExperiments,
  flagExists,
  experimentExists,
};
