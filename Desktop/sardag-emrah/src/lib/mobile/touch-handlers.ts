/**
 * MOBILE TOUCH HANDLERS
 *
 * Optimized touch interactions for mobile devices
 * - Swipe gestures
 * - Pull-to-refresh
 * - Long press
 * - Double tap
 */

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface TouchHandlers {
  onSwipe?: (direction: SwipeDirection) => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onPullToRefresh?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  lastTapTime: number;
}

const SWIPE_THRESHOLD = 50; // pixels
const LONG_PRESS_DURATION = 500; // ms
const DOUBLE_TAP_DELAY = 300; // ms

/**
 * Create touch event handlers for an element
 */
export function createTouchHandlers(handlers: TouchHandlers) {
  const state: TouchState = {
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
  };

  let longPressTimer: NodeJS.Timeout | null = null;

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    state.startX = touch.clientX;
    state.startY = touch.clientY;
    state.startTime = Date.now();

    // Long press
    if (handlers.onLongPress) {
      longPressTimer = setTimeout(() => {
        handlers.onLongPress!();
        longPressTimer = null;
      }, LONG_PRESS_DURATION);
    }
  };

  const handleTouchMove = () => {
    // Cancel long press on move
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    // Cancel long press
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const deltaX = endX - state.startX;
    const deltaY = endY - state.startY;
    const duration = Date.now() - state.startTime;

    // Swipe detection
    if (handlers.onSwipe && duration < 300) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > SWIPE_THRESHOLD || absDeltaY > SWIPE_THRESHOLD) {
        let direction: SwipeDirection;

        if (absDeltaX > absDeltaY) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        handlers.onSwipe(direction);
        return;
      }
    }

    // Double tap detection
    if (handlers.onDoubleTap) {
      const now = Date.now();
      if (now - state.lastTapTime < DOUBLE_TAP_DELAY) {
        handlers.onDoubleTap();
        state.lastTapTime = 0; // Reset to prevent triple tap
        return;
      }
      state.lastTapTime = now;
    }

    // Pull to refresh (swipe down from top)
    if (handlers.onPullToRefresh && deltaY > 100 && state.startY < 100) {
      handlers.onPullToRefresh();
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

/**
 * Detect if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get device type
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;

  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Vibrate device (if supported)
 */
export function vibrate(pattern: number | number[] = 50): boolean {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return false;

  try {
    navigator.vibrate(pattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prevent iOS bounce scroll
 */
export function preventBounceScroll(element: HTMLElement) {
  let startY = 0;

  const handleTouchStart = (e: TouchEvent) => {
    startY = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const isAtTop = element.scrollTop === 0;
    const isAtBottom = element.scrollHeight - element.scrollTop === element.clientHeight;

    // Prevent pull-to-refresh at top
    if (isAtTop && currentY > startY) {
      e.preventDefault();
    }

    // Prevent bounce at bottom
    if (isAtBottom && currentY < startY) {
      e.preventDefault();
    }
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
  };
}
