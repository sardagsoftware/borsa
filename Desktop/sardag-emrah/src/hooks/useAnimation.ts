/**
 * USE ANIMATION HOOKS
 *
 * React hooks for animations
 * - useAnimation: Apply animation to element
 * - useTransition: Apply transition
 * - useInView: Animate on scroll into view
 * - useMicroInteraction: Hover/click animations
 *
 * WHITE-HAT:
 * - Respects prefers-reduced-motion
 * - Performance-optimized
 * - Accessible
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { AnimationConfig, TransitionConfig } from '@/lib/animations/types';
import {
  getAnimationStyle,
  getTransitionStyle,
  getSafeAnimationConfig,
  injectKeyframes,
  prefersReducedMotion,
} from '@/lib/animations/animations';

/**
 * Use animation hook
 * Apply animation to element
 *
 * @example
 * const { ref, animate } = useAnimation({ type: 'slide-up', duration: 'normal' });
 *
 * <div ref={ref}>Content</div>
 * <button onClick={() => animate()}>Animate</button>
 */
export function useAnimation(config: AnimationConfig) {
  const ref = useRef<HTMLElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Inject keyframes on mount
  useEffect(() => {
    injectKeyframes(config.type);
  }, [config.type]);

  const animate = useCallback(() => {
    if (!ref.current) return;

    const safeConfig = getSafeAnimationConfig(config);
    const style = getAnimationStyle(safeConfig);

    setIsAnimating(true);

    // Apply animation styles
    Object.assign(ref.current.style, style);

    // Reset after animation completes
    const duration = typeof safeConfig.duration === 'number'
      ? safeConfig.duration
      : safeConfig.duration === 'fast'
        ? 150
        : safeConfig.duration === 'slow'
          ? 350
          : 250;

    setTimeout(() => {
      setIsAnimating(false);
    }, duration + (safeConfig.delay || 0));
  }, [config]);

  return {
    ref,
    animate,
    isAnimating,
  };
}

/**
 * Use transition hook
 * Apply smooth transitions to property changes
 *
 * @example
 * const { ref, props } = useTransition({ property: 'opacity', duration: 'fast' });
 * <div ref={ref} {...props}>Content</div>
 */
export function useTransition(config: TransitionConfig) {
  const ref = useRef<HTMLElement>(null);
  const style = getTransitionStyle(config);

  return {
    ref,
    props: {
      style,
    },
  };
}

/**
 * Use in view animation hook
 * Animate element when it enters viewport
 *
 * @example
 * const { ref } = useInView({ type: 'slide-up', duration: 'normal' });
 * <div ref={ref}>Animates on scroll</div>
 */
export function useInView(config: AnimationConfig, options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    injectKeyframes(config.type);
  }, [config.type]);

  useEffect(() => {
    if (!ref.current || hasAnimated) return;

    const safeConfig = getSafeAnimationConfig(config);
    const style = getAnimationStyle(safeConfig);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            // Apply animation
            Object.assign((entry.target as HTMLElement).style, style);
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [config, hasAnimated, options]);

  return { ref, hasAnimated };
}

/**
 * Use micro-interaction hook
 * Apply subtle animations on hover/click
 *
 * @example
 * const { props } = useMicroInteraction('scale');
 * <button {...props}>Hover me</button>
 */
export function useMicroInteraction(type: 'scale' | 'lift' | 'glow' | 'ripple' = 'scale') {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const getTransform = useCallback(() => {
    if (prefersReducedMotion()) return 'none';

    switch (type) {
      case 'scale':
        return isPressed
          ? 'scale(0.95)'
          : isHovered
            ? 'scale(1.05)'
            : 'scale(1)';
      case 'lift':
        return isPressed
          ? 'translateY(2px)'
          : isHovered
            ? 'translateY(-2px)'
            : 'translateY(0)';
      case 'glow':
        return 'none';
      case 'ripple':
        return 'none';
      default:
        return 'none';
    }
  }, [type, isHovered, isPressed]);

  const getBoxShadow = useCallback(() => {
    if (prefersReducedMotion()) return 'none';

    switch (type) {
      case 'lift':
        return isHovered
          ? '0 8px 16px rgba(0, 0, 0, 0.2)'
          : '0 2px 4px rgba(0, 0, 0, 0.1)';
      case 'glow':
        return isHovered
          ? '0 0 20px rgba(59, 130, 246, 0.5)'
          : 'none';
      default:
        return 'none';
    }
  }, [type, isHovered]);

  return {
    props: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => {
        setIsHovered(false);
        setIsPressed(false);
      },
      onMouseDown: () => setIsPressed(true),
      onMouseUp: () => setIsPressed(false),
      style: {
        transform: getTransform(),
        boxShadow: getBoxShadow(),
        transition: 'transform 150ms ease-out, box-shadow 150ms ease-out',
      },
    },
    isHovered,
    isPressed,
  };
}

/**
 * Use stagger animation hook
 * Animate list items with delay
 *
 * @example
 * const { getItemProps } = useStagger({ type: 'slide-up', stagger: 50 });
 *
 * {items.map((item, index) => (
 *   <div {...getItemProps(index)}>{item}</div>
 * ))}
 */
export function useStagger(config: AnimationConfig & { stagger?: number }) {
  const { stagger = 50, ...animationConfig } = config;

  useEffect(() => {
    injectKeyframes(animationConfig.type);
  }, [animationConfig.type]);

  const getItemProps = useCallback(
    (index: number) => {
      const safeConfig = getSafeAnimationConfig({
        ...animationConfig,
        delay: index * stagger,
      });
      const style = getAnimationStyle(safeConfig);

      return { style };
    },
    [animationConfig, stagger]
  );

  return { getItemProps };
}

/**
 * Use loading animation hook
 * Show loading state with animation
 *
 * @example
 * const { isLoading, startLoading, stopLoading } = useLoadingAnimation();
 */
export function useLoadingAnimation() {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  return {
    isLoading,
    startLoading,
    stopLoading,
  };
}

export default useAnimation;
