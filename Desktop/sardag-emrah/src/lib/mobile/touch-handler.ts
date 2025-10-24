/**
 * MOBILE TOUCH HANDLERS
 * Touch ve swipe gesture yönetimi
 */

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
  velocity: number;
}

export interface TouchHandlerOptions {
  onSwipe?: (event: SwipeEvent) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  maxSwipeDuration?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isSwiping: boolean;
}

/**
 * Create touch handler for swipe gestures
 */
export function createTouchHandler(options: TouchHandlerOptions) {
  const {
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    maxSwipeDuration = 500,
  } = options;

  let touchState: TouchState = {
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwiping: false,
  };

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchState = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isSwiping: true,
    };
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchState.isSwiping) return;

    // Prevent default scroll behavior during swipe
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchState.startX);
    const deltaY = Math.abs(touch.clientY - touchState.startY);

    // Horizontal swipe dominates
    if (deltaX > deltaY && deltaX > minSwipeDistance / 2) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchState.isSwiping) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    const duration = Date.now() - touchState.startTime;

    touchState.isSwiping = false;

    // Check if it's a valid swipe
    if (duration > maxSwipeDuration) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < minSwipeDistance) return;

    // Determine direction (horizontal or vertical)
    const isHorizontal = absX > absY;
    const direction = isHorizontal
      ? deltaX > 0 ? 'right' : 'left'
      : deltaY > 0 ? 'down' : 'up';

    const velocity = distance / duration;

    const swipeEvent: SwipeEvent = {
      direction,
      distance,
      duration,
      velocity,
    };

    // Call callbacks
    onSwipe?.(swipeEvent);

    if (direction === 'left') onSwipeLeft?.();
    if (direction === 'right') onSwipeRight?.();
    if (direction === 'up') onSwipeUp?.();
    if (direction === 'down') onSwipeDown?.();
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

/**
 * Detect if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Detect if device has touch support
 */
export function hasTouchSupport(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

/**
 * Get optimal touch target size
 */
export function getTouchTargetSize(): number {
  // Apple HIG: 44x44pt minimum
  // Material Design: 48x48dp minimum
  // We use 44px as minimum for better iOS compatibility
  return 44;
}

/**
 * Add haptic feedback (vibration)
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'medium'): void {
  if (typeof window === 'undefined') return;
  if (!navigator.vibrate) return;

  const patterns = {
    light: 10,
    medium: 20,
    heavy: 30,
  };

  navigator.vibrate(patterns[type]);
}

/**
 * Lock scroll (for modals, full-screen views)
 */
export function lockScroll(): void {
  if (typeof document === 'undefined') return;

  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
}

/**
 * Unlock scroll
 */
export function unlockScroll(): void {
  if (typeof document === 'undefined') return;

  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Smooth scroll to element
 */
export function smoothScrollTo(element: HTMLElement, offset: number = 0): void {
  const top = element.getBoundingClientRect().top + window.pageYOffset + offset;

  window.scrollTo({
    top,
    behavior: 'smooth',
  });
}
