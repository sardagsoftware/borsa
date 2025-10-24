/**
 * useTrackEvent Hook
 *
 * React hook for tracking events
 * - Track conversions
 * - Track impressions
 * - Track user interactions
 *
 * Usage:
 * const { trackEvent, trackConversion } = useTrackEvent();
 * trackEvent('button_click', { buttonId: 'scan' });
 *
 * WHITE-HAT:
 * - Client-side only
 * - Privacy-preserving
 * - User consent respected
 */

import { useCallback, useEffect } from 'react';
import { getTracker } from '@/lib/analytics/event-tracker';
import { useExperimentVariant } from './useFeatureFlag';
import type { AnalyticsEventType } from '@/lib/analytics/types';

// ════════════════════════════════════════════════════════════
// TRACK EVENT HOOK
// ════════════════════════════════════════════════════════════

/**
 * Track events hook
 *
 * @example
 * const { trackEvent, trackConversion, trackClick } = useTrackEvent();
 *
 * // Track custom event
 * trackEvent('coin_card_click', { symbol: 'BTC' });
 *
 * // Track conversion
 * trackConversion('scan_completed');
 *
 * // Track click
 * trackClick('scan_button');
 */
export function useTrackEvent() {
  const tracker = getTracker();

  const trackEvent = useCallback(
    (type: AnalyticsEventType, properties?: Record<string, any>) => {
      tracker.track(type, properties);
    },
    [tracker]
  );

  const trackConversion = useCallback(
    (goalName: string, properties?: Record<string, any>) => {
      tracker.trackConversion(goalName, properties);
    },
    [tracker]
  );

  const trackClick = useCallback(
    (elementId?: string, properties?: Record<string, any>) => {
      tracker.trackClick(elementId, properties);
    },
    [tracker]
  );

  const trackPageView = useCallback(() => {
    tracker.trackPageView();
  }, [tracker]);

  return {
    trackEvent,
    trackConversion,
    trackClick,
    trackPageView,
  };
}

// ════════════════════════════════════════════════════════════
// EXPERIMENT TRACKING HOOK
// ════════════════════════════════════════════════════════════

/**
 * Track experiment impressions/exposures automatically
 *
 * @param experimentKey - Experiment key
 * @param trackImpression - Whether to track impression on mount
 *
 * @example
 * const variant = useTrackExperiment('confidence_badge_position');
 * // Automatically tracks impression when component mounts
 */
export function useTrackExperiment(
  experimentKey: string,
  trackImpression: boolean = true
) {
  const variant = useExperimentVariant(experimentKey);
  const tracker = getTracker();

  useEffect(() => {
    if (variant && trackImpression) {
      tracker.trackExperimentImpression(experimentKey, variant);
    }
  }, [experimentKey, variant, trackImpression, tracker]);

  const trackExposure = useCallback(() => {
    if (variant) {
      tracker.trackExperimentExposure(experimentKey, variant);
    }
  }, [experimentKey, variant, tracker]);

  return {
    variant,
    trackExposure,
  };
}

// ════════════════════════════════════════════════════════════
// AUTO-TRACK PAGE VIEWS
// ════════════════════════════════════════════════════════════

/**
 * Auto-track page views on route change
 *
 * @example
 * // In root layout or _app.tsx
 * useAutoTrackPageViews();
 */
export function useAutoTrackPageViews() {
  const { trackPageView } = useTrackEvent();

  useEffect(() => {
    // Track initial page view
    trackPageView();

    // Track on route change (for SPA)
    const handleRouteChange = () => {
      trackPageView();
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [trackPageView]);
}

// ════════════════════════════════════════════════════════════
// CONVERSION TRACKING WITH GOAL
// ════════════════════════════════════════════════════════════

/**
 * Track conversion goal
 *
 * @param goalName - Goal name (e.g., 'scan_completed')
 *
 * @example
 * const trackScanCompleted = useConversionGoal('scan_completed');
 *
 * // When scan completes
 * trackScanCompleted({ coinCount: 200, signalsFound: 15 });
 */
export function useConversionGoal(goalName: string) {
  const { trackConversion } = useTrackEvent();

  return useCallback(
    (properties?: Record<string, any>) => {
      trackConversion(goalName, properties);
    },
    [goalName, trackConversion]
  );
}

// ════════════════════════════════════════════════════════════
// TRACK ELEMENT CLICKS
// ════════════════════════════════════════════════════════════

/**
 * Track element clicks with ref
 *
 * @param elementId - Element identifier
 * @param properties - Additional properties
 *
 * @example
 * const buttonRef = useTrackClick('scan_button', { section: 'market' });
 *
 * <button ref={buttonRef} onClick={handleScan}>
 *   Tara
 * </button>
 */
export function useTrackClick(
  elementId: string,
  properties?: Record<string, any>
) {
  const { trackClick } = useTrackEvent();

  const handleClick = useCallback(() => {
    trackClick(elementId, properties);
  }, [elementId, properties, trackClick]);

  return {
    onClick: handleClick,
  };
}

// ════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════

export default {
  useTrackEvent,
  useTrackExperiment,
  useAutoTrackPageViews,
  useConversionGoal,
  useTrackClick,
};
