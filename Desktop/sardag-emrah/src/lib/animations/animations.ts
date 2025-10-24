/**
 * ANIMATION UTILITIES
 *
 * Generate animation CSS and classes
 * - Keyframe generation
 * - Class name generation
 * - Respect user preferences
 *
 * WHITE-HAT:
 * - prefers-reduced-motion support
 * - Performance-optimized (GPU-accelerated)
 * - Non-intrusive animations
 */

import type {
  AnimationType,
  AnimationDuration,
  AnimationEasing,
  AnimationConfig,
  TransitionConfig,
} from './types';
import { ANIMATION_DURATIONS, ANIMATION_EASINGS } from './types';

/**
 * Get duration value in milliseconds
 */
export function getDurationValue(duration: AnimationDuration): number {
  if (typeof duration === 'number') return duration;
  return ANIMATION_DURATIONS[duration];
}

/**
 * Get easing function
 */
export function getEasingValue(easing: AnimationEasing): string {
  return ANIMATION_EASINGS[easing];
}

/**
 * Generate animation class name
 */
export function getAnimationClassName(config: AnimationConfig): string {
  const {
    type,
    duration = 'normal',
    easing = 'ease-out',
    delay = 0,
    repeat = 1,
    direction = 'normal',
    fillMode = 'both',
  } = config;

  const durationMs = getDurationValue(duration);
  const easingValue = getEasingValue(easing);

  return `animate-${type}`;
}

/**
 * Generate animation style
 */
export function getAnimationStyle(config: AnimationConfig): React.CSSProperties {
  const {
    type,
    duration = 'normal',
    easing = 'ease-out',
    delay = 0,
    repeat = 1,
    direction = 'normal',
    fillMode = 'both',
  } = config;

  const durationMs = getDurationValue(duration);
  const easingValue = getEasingValue(easing);
  const iterationCount = repeat === 'infinite' ? 'infinite' : repeat;

  return {
    animationName: type,
    animationDuration: `${durationMs}ms`,
    animationTimingFunction: easingValue,
    animationDelay: delay ? `${delay}ms` : '0ms',
    animationIterationCount: iterationCount,
    animationDirection: direction,
    animationFillMode: fillMode,
  };
}

/**
 * Generate transition style
 */
export function getTransitionStyle(config: TransitionConfig): React.CSSProperties {
  const {
    property = 'all',
    duration = 'normal',
    easing = 'ease-out',
    delay = 0,
  } = config;

  const durationMs = getDurationValue(duration);
  const easingValue = getEasingValue(easing);
  const properties = Array.isArray(property) ? property.join(', ') : property;

  return {
    transition: `${properties} ${durationMs}ms ${easingValue} ${delay}ms`,
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Get safe animation config (respects prefers-reduced-motion)
 */
export function getSafeAnimationConfig(config: AnimationConfig): AnimationConfig {
  if (prefersReducedMotion()) {
    return {
      ...config,
      duration: 'fast',
      type: 'fade', // Fallback to simple fade
    };
  }
  return config;
}

/**
 * Generate keyframes for animation type
 */
export function getKeyframes(type: AnimationType): string {
  switch (type) {
    case 'fade':
      return `
        @keyframes fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;

    case 'slide-up':
      return `
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;

    case 'slide-down':
      return `
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;

    case 'slide-left':
      return `
        @keyframes slide-left {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `;

    case 'slide-right':
      return `
        @keyframes slide-right {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `;

    case 'scale':
      return `
        @keyframes scale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `;

    case 'scale-spring':
      return `
        @keyframes scale-spring {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `;

    case 'bounce':
      return `
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `;

    case 'shake':
      return `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `;

    case 'pulse':
      return `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `;

    case 'rotate':
      return `
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;

    case 'blur':
      return `
        @keyframes blur {
          from {
            opacity: 0;
            filter: blur(10px);
          }
          to {
            opacity: 1;
            filter: blur(0);
          }
        }
      `;

    case 'flip':
      return `
        @keyframes flip {
          from { transform: perspective(400px) rotateY(90deg); }
          to { transform: perspective(400px) rotateY(0); }
        }
      `;

    default:
      return '';
  }
}

/**
 * Inject keyframes into document
 * (Only injects once per animation type)
 */
const injectedKeyframes = new Set<AnimationType>();

export function injectKeyframes(type: AnimationType): void {
  if (typeof document === 'undefined') return;
  if (injectedKeyframes.has(type)) return;

  const style = document.createElement('style');
  style.textContent = getKeyframes(type);
  document.head.appendChild(style);
  injectedKeyframes.add(type);
}
