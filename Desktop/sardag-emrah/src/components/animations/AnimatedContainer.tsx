/**
 * ANIMATED CONTAINER COMPONENT
 *
 * Wrapper component with built-in animations
 * - Fade in on mount
 * - Slide in from direction
 * - Scale in
 * - Customizable animations
 *
 * WHITE-HAT:
 * - Accessible
 * - Respects prefers-reduced-motion
 * - Performance-optimized
 */

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useInView } from '@/hooks/useAnimation';
import type { AnimationConfig } from '@/lib/animations/types';
import { ANIMATION_PRESETS } from '@/lib/animations/types';

interface AnimatedContainerProps {
  children: ReactNode;
  animation?: keyof typeof ANIMATION_PRESETS | AnimationConfig;
  delay?: number;
  threshold?: number;
  triggerOnce?: boolean;
  className?: string;
}

/**
 * Animated Container
 * Animates children when entering viewport
 */
export function AnimatedContainer({
  children,
  animation = 'fadeIn',
  delay = 0,
  threshold = 0.1,
  triggerOnce = true,
  className = '',
}: AnimatedContainerProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Get animation config
  const config = typeof animation === 'string'
    ? { ...ANIMATION_PRESETS[animation], delay }
    : { ...animation, delay };

  const { ref } = useInView(config, { threshold });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {children}
    </div>
  );
}

/**
 * Staggered List
 * Animate list items with stagger delay
 */
export function StaggeredList({
  children,
  staggerDelay = 50,
  animation = 'slideUp',
  className = '',
}: {
  children: ReactNode[];
  staggerDelay?: number;
  animation?: keyof typeof ANIMATION_PRESETS;
  className?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedContainer
          key={index}
          animation={animation}
          delay={index * staggerDelay}
        >
          {child}
        </AnimatedContainer>
      ))}
    </div>
  );
}

/**
 * Fade In Container
 * Simple fade in on mount
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 'normal',
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  duration?: 'fast' | 'normal' | 'slow';
  className?: string;
}) {
  return (
    <AnimatedContainer
      animation={{ type: 'fade', duration, delay }}
      className={className}
    >
      {children}
    </AnimatedContainer>
  );
}

/**
 * Slide Up Container
 * Slide up from bottom
 */
export function SlideUp({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <AnimatedContainer
      animation="slideUp"
      delay={delay}
      className={className}
    >
      {children}
    </AnimatedContainer>
  );
}

/**
 * Scale In Container
 * Scale in with spring
 */
export function ScaleIn({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <AnimatedContainer
      animation="scaleSpring"
      delay={delay}
      className={className}
    >
      {children}
    </AnimatedContainer>
  );
}

export default AnimatedContainer;
