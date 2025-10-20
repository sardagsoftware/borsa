/**
 * SWIPEABLE CARD COMPONENT
 * Swipe gestures ile coin card navigasyonu
 */

'use client';

import { useRef, useState } from 'react';
import { useSwipeGesture } from '@/hooks/useMobile';
import { hapticFeedback } from '@/lib/mobile/touch-handler';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
}

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className = '',
}: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useSwipeGesture(cardRef, {
    onSwipeLeft: () => {
      if (onSwipeLeft) {
        hapticFeedback('light');
        animateSwipe(-100, 0);
        setTimeout(() => {
          onSwipeLeft();
          resetPosition();
        }, 200);
      }
    },
    onSwipeRight: () => {
      if (onSwipeRight) {
        hapticFeedback('light');
        animateSwipe(100, 0);
        setTimeout(() => {
          onSwipeRight();
          resetPosition();
        }, 200);
      }
    },
    onSwipeUp: () => {
      if (onSwipeUp) {
        hapticFeedback('medium');
        animateSwipe(0, -50);
        setTimeout(() => {
          onSwipeUp();
          resetPosition();
        }, 200);
      }
    },
    onSwipeDown: () => {
      if (onSwipeDown) {
        hapticFeedback('medium');
        animateSwipe(0, 50);
        setTimeout(() => {
          onSwipeDown();
          resetPosition();
        }, 200);
      }
    },
    minSwipeDistance: 50,
    maxSwipeDuration: 500,
  });

  const animateSwipe = (x: number, y: number) => {
    setIsAnimating(true);
    setTranslateX(x);
    setTranslateY(y);
  };

  const resetPosition = () => {
    setTimeout(() => {
      setTranslateX(0);
      setTranslateY(0);
      setIsAnimating(false);
    }, 200);
  };

  return (
    <div
      ref={cardRef}
      className={`touch-manipulation select-none-important ${className}`}
      style={{
        transform: `translate(${translateX}px, ${translateY}px)`,
        transition: isAnimating ? 'transform 0.2s ease-out' : 'none',
      }}
    >
      {children}
    </div>
  );
}
