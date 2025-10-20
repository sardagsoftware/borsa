/**
 * MOBILE HOOKS
 * React hooks for mobile-specific functionality
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isMobileDevice,
  hasTouchSupport,
  createTouchHandler,
  type SwipeEvent,
  type TouchHandlerOptions,
} from '@/lib/mobile/touch-handler';

/**
 * Hook to detect if device is mobile
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());

    // Also check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768 || isMobileDevice());
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return isMobile;
}

/**
 * Hook to detect touch support
 */
export function useHasTouch(): boolean {
  const [hasTouch, setHasTouch] = useState(false);

  useEffect(() => {
    setHasTouch(hasTouchSupport());
  }, []);

  return hasTouch;
}

/**
 * Hook for swipe gestures
 */
export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement>,
  options: TouchHandlerOptions
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const { handleTouchStart, handleTouchMove, handleTouchEnd } = createTouchHandler(options);

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, options]);
}

/**
 * Hook for screen orientation
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return orientation;
}

/**
 * Hook for viewport height (handles mobile address bar)
 */
export function useViewportHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      // Use visualViewport for accurate mobile height
      const vh = window.visualViewport?.height || window.innerHeight;
      setHeight(vh);

      // Update CSS custom property
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
    };

    updateHeight();

    window.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, []);

  return height;
}

/**
 * Hook for network status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook for device memory (if available)
 */
export function useDeviceMemory(): number | undefined {
  const [memory, setMemory] = useState<number | undefined>(undefined);

  useEffect(() => {
    // @ts-ignore - navigator.deviceMemory is not in TypeScript definitions
    if ('deviceMemory' in navigator) {
      // @ts-ignore
      setMemory(navigator.deviceMemory);
    }
  }, []);

  return memory;
}

/**
 * Hook for connection speed
 */
export function useConnectionSpeed(): 'slow' | 'medium' | 'fast' | 'unknown' {
  const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast' | 'unknown'>('unknown');

  useEffect(() => {
    // @ts-ignore - navigator.connection is not in all TypeScript definitions
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!connection) {
      setSpeed('unknown');
      return;
    }

    const updateSpeed = () => {
      const effectiveType = connection.effectiveType;

      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        setSpeed('slow');
      } else if (effectiveType === '3g') {
        setSpeed('medium');
      } else if (effectiveType === '4g') {
        setSpeed('fast');
      } else {
        setSpeed('unknown');
      }
    };

    updateSpeed();
    connection.addEventListener('change', updateSpeed);

    return () => {
      connection.removeEventListener('change', updateSpeed);
    };
  }, []);

  return speed;
}

/**
 * Hook to lock body scroll
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (locked) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }, [locked]);
}
