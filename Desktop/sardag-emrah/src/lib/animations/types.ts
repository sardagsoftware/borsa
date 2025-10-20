/**
 * ANIMATION TYPES
 *
 * Type definitions for animation system
 * - Animation variants
 * - Timing functions
 * - Transition options
 *
 * WHITE-HAT:
 * - Respect prefers-reduced-motion
 * - Smooth, non-jarring animations
 * - Performance-optimized
 */

export type AnimationType =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale'
  | 'scale-spring'
  | 'bounce'
  | 'rotate'
  | 'shake'
  | 'pulse'
  | 'blur'
  | 'flip';

export type AnimationDuration = 'fast' | 'normal' | 'slow' | number;

export type AnimationEasing =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring'
  | 'bounce';

export interface AnimationConfig {
  type: AnimationType;
  duration?: AnimationDuration;
  easing?: AnimationEasing;
  delay?: number;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface TransitionConfig {
  property?: string | string[];
  duration?: AnimationDuration;
  easing?: AnimationEasing;
  delay?: number;
}

export interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

// Animation presets
export const ANIMATION_PRESETS = {
  // Fade animations
  fadeIn: { type: 'fade' as const, duration: 'normal' as const },
  fadeOut: { type: 'fade' as const, duration: 'normal' as const, direction: 'reverse' as const },

  // Slide animations
  slideUp: { type: 'slide-up' as const, duration: 'normal' as const },
  slideDown: { type: 'slide-down' as const, duration: 'normal' as const },
  slideLeft: { type: 'slide-left' as const, duration: 'normal' as const },
  slideRight: { type: 'slide-right' as const, duration: 'normal' as const },

  // Scale animations
  scaleIn: { type: 'scale' as const, duration: 'fast' as const, easing: 'ease-out' as const },
  scaleOut: { type: 'scale' as const, duration: 'fast' as const, direction: 'reverse' as const },
  scaleSpring: { type: 'scale-spring' as const, duration: 'normal' as const },

  // Bounce animations
  bounce: { type: 'bounce' as const, duration: 'slow' as const },

  // Utility animations
  shake: { type: 'shake' as const, duration: 'fast' as const },
  pulse: { type: 'pulse' as const, duration: 'slow' as const, repeat: 'infinite' as const },
  rotate: { type: 'rotate' as const, duration: 'normal' as const },
  flip: { type: 'flip' as const, duration: 'normal' as const },
} as const;

// Duration values in milliseconds
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

// Easing functions (cubic-bezier)
export const ANIMATION_EASINGS = {
  linear: 'linear',
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;
