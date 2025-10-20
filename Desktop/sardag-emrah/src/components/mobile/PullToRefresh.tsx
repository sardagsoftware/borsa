/**
 * PULL TO REFRESH COMPONENT
 * Mobile için pull-to-refresh özelliği
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  pullDistance?: number;
  refreshThreshold?: number;
}

export default function PullToRefresh({
  onRefresh,
  children,
  pullDistance = 80,
  refreshThreshold = 60,
}: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only allow pull if at top of page
    if (window.scrollY === 0) {
      setCanPull(true);
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!canPull || isRefreshing) return;

    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY.current;

    if (deltaY > 0) {
      isPulling.current = true;
      // Apply resistance curve (slower as you pull more)
      const resistance = Math.min(deltaY / 2.5, pullDistance);
      setPullY(resistance);

      // Prevent default scroll if pulling
      if (deltaY > 10) {
        e.preventDefault();
      }
    }
  }, [canPull, isRefreshing, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    setCanPull(false);

    if (isPulling.current && pullY >= refreshThreshold && !isRefreshing) {
      setIsRefreshing(true);

      try {
        await onRefresh();
      } catch (error) {
        console.error('[PullToRefresh] Error:', error);
      } finally {
        // Delay to show completion animation
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
          isPulling.current = false;
        }, 300);
      }
    } else {
      setPullY(0);
      isPulling.current = false;
    }
  }, [pullY, refreshThreshold, isRefreshing, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const isTriggered = pullY >= refreshThreshold;
  const progress = Math.min((pullY / refreshThreshold) * 100, 100);

  return (
    <div className="relative">
      {/* Pull indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-opacity"
        style={{
          height: `${pullY}px`,
          opacity: pullY > 0 ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        <div className="relative w-12 h-12 flex items-center justify-center">
          {/* Loading spinner */}
          {isRefreshing ? (
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          ) : (
            <>
              {/* Progress circle */}
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-white/20"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className={`transition-colors ${
                    isTriggered ? 'text-green-400' : 'text-blue-400'
                  }`}
                />
              </svg>

              {/* Arrow icon */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-transform ${
                  isTriggered ? 'rotate-180' : 'rotate-0'
                }`}
              >
                <svg
                  className={`w-6 h-6 ${isTriggered ? 'text-green-400' : 'text-blue-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content with transform */}
      <div
        className="transition-transform"
        style={{
          transform: `translateY(${isRefreshing ? pullDistance / 2 : pullY}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
