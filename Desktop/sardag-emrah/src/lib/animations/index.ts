/**
 * ANIMATION SYSTEM
 *
 * Barrel exports for animation functionality
 */

// Types
export type {
  AnimationType,
  AnimationDuration,
  AnimationEasing,
  AnimationConfig,
  TransitionConfig,
  SpringConfig,
} from './types';

// Constants
export {
  ANIMATION_PRESETS,
  ANIMATION_DURATIONS,
  ANIMATION_EASINGS,
} from './types';

// Utilities
export {
  getDurationValue,
  getEasingValue,
  getAnimationClassName,
  getAnimationStyle,
  getTransitionStyle,
  prefersReducedMotion,
  getSafeAnimationConfig,
  getKeyframes,
  injectKeyframes,
} from './animations';
