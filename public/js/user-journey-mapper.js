/**
 * 🗺️ AiLydian Ultra Pro - User Journey Mapper
 * Phase Q: Advanced Analytics & Business Intelligence
 *
 * Features:
 * - Page view tracking with referrer
 * - Action tracking (clicks, form submissions, features used)
 * - Session path reconstruction
 * - Entry/exit page analysis
 * - Time spent per page
 * - User flow visualization data
 * - Drop-off point identification
 *
 * @version 1.0.0
 * @author LyDian AI Platform
 */

(function(global) {
  'use strict';

  // ============================
  // CONFIGURATION
  // ============================

  const CONFIG = {
    apiEndpoint: '/api/analytics/journey',
    batchSize: 10,
    batchTimeout: 5000, // 5 seconds
    trackPageViews: true,
    trackActions: true,
    trackScrollDepth: true,
    trackTimeOnPage: true,
    debug: false,
    enableBeacon: true
  };

  // ============================
  // USER JOURNEY MAPPER
  // ============================

  class UserJourneyMapper {
    constructor(config = {}) {
      this.config = { ...CONFIG, ...config };
      this.eventQueue = [];
      this.sendTimeout = null;
      this.sessionId = this.generateSessionId();
      this.sessionStart = Date.now();
      this.journeyPath = [];
      this.currentPage = null;
      this.pageStartTime = null;
      this.maxScrollDepth = 0;
      this.actions = [];

      this.init();
    }

    /**
     * Initialize journey mapper
     */
    init() {
      if (this.config.debug) {
        console.log('[Journey Mapper] Initializing...');
      }

      // Track initial page view
      if (this.config.trackPageViews) {
        this.trackPageView();
      }

      // Setup event listeners
      if (this.config.trackActions) {
        this.setupActionTracking();
      }

      if (this.config.trackScrollDepth) {
        this.setupScrollTracking();
      }

      if (this.config.trackTimeOnPage) {
        this.setupTimeTracking();
      }

      // Handle page unload
      window.addEventListener('beforeunload', () => {
        this.trackPageExit();
        this.flush();
      });

      // Handle visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.trackPageExit();
          this.flush();
        }
      });

      // Handle popstate (back/forward navigation)
      window.addEventListener('popstate', () => {
        this.trackPageView();
      });

      if (this.config.debug) {
        console.log('[Journey Mapper] ✅ Initialized');
      }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
      return `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Track page view
     */
    trackPageView() {
      // Track exit from previous page
      if (this.currentPage) {
        this.trackPageExit();
      }

      const pageData = {
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        title: document.title,
        referrer: document.referrer,
        timestamp: Date.now()
      };

      this.currentPage = pageData;
      this.pageStartTime = Date.now();
      this.maxScrollDepth = 0;

      // Add to journey path
      this.journeyPath.push({
        ...pageData,
        type: 'page_view',
        sequence: this.journeyPath.length + 1
      });

      // Track event
      this.trackEvent('journey_page_view', pageData);

      if (this.config.debug) {
        console.log('[Journey Mapper] Page view:', pageData.pathname);
      }
    }

    /**
     * Track page exit
     */
    trackPageExit() {
      if (!this.currentPage) return;

      const timeOnPage = Date.now() - this.pageStartTime;
      const exitData = {
        url: this.currentPage.url,
        pathname: this.currentPage.pathname,
        timeOnPage,
        maxScrollDepth: this.maxScrollDepth,
        actions: this.actions.length,
        exitType: this.getExitType()
      };

      // Track event
      this.trackEvent('journey_page_exit', exitData);

      // Reset page-specific tracking
      this.actions = [];
      this.maxScrollDepth = 0;

      if (this.config.debug) {
        console.log('[Journey Mapper] Page exit:', exitData.pathname, `${timeOnPage}ms`);
      }
    }

    /**
     * Get exit type
     */
    getExitType() {
      if (document.visibilityState === 'hidden') {
        return 'visibility_change';
      } else if (window.location.href !== this.currentPage.url) {
        return 'navigation';
      } else {
        return 'unload';
      }
    }

    /**
     * Setup action tracking
     */
    setupActionTracking() {
      // Track clicks
      document.addEventListener('click', (e) => {
        const target = e.target;
        const actionData = {
          type: 'click',
          element: target.tagName,
          id: target.id,
          className: target.className,
          text: target.textContent?.substring(0, 50),
          href: target.href,
          timestamp: Date.now()
        };

        this.trackAction(actionData);
      }, true);

      // Track form submissions
      document.addEventListener('submit', (e) => {
        const form = e.target;
        const actionData = {
          type: 'form_submit',
          formId: form.id,
          formName: form.name,
          action: form.action,
          method: form.method,
          timestamp: Date.now()
        };

        this.trackAction(actionData);
      }, true);

      // Track input focus (form interaction)
      document.addEventListener('focus', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          const actionData = {
            type: 'input_focus',
            inputType: e.target.type,
            inputName: e.target.name,
            timestamp: Date.now()
          };

          this.trackAction(actionData);
        }
      }, true);
    }

    /**
     * Track user action
     */
    trackAction(actionData) {
      this.actions.push(actionData);

      const enrichedAction = {
        ...actionData,
        pathname: window.location.pathname,
        timeOnPage: Date.now() - this.pageStartTime,
        sequence: this.actions.length
      };

      this.trackEvent('journey_action', enrichedAction);

      if (this.config.debug) {
        console.log('[Journey Mapper] Action:', actionData.type);
      }
    }

    /**
     * Setup scroll depth tracking
     */
    setupScrollTracking() {
      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.updateScrollDepth();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }

    /**
     * Update scroll depth
     */
    updateScrollDepth() {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      const scrollPercentage = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);

      if (scrollPercentage > this.maxScrollDepth) {
        this.maxScrollDepth = scrollPercentage;

        // Track milestone depths (25%, 50%, 75%, 100%)
        const milestones = [25, 50, 75, 100];
        const previousMilestone = milestones.find(m => m > this.maxScrollDepth - 5 && m <= this.maxScrollDepth);

        if (previousMilestone) {
          this.trackEvent('journey_scroll_depth', {
            depth: previousMilestone,
            pathname: window.location.pathname,
            timeOnPage: Date.now() - this.pageStartTime
          });
        }
      }
    }

    /**
     * Setup time tracking
     */
    setupTimeTracking() {
      // Track time milestones (10s, 30s, 60s, 120s)
      const milestones = [10000, 30000, 60000, 120000];

      milestones.forEach(milestone => {
        setTimeout(() => {
          if (this.currentPage && Date.now() - this.pageStartTime >= milestone) {
            this.trackEvent('journey_time_milestone', {
              milestone: milestone / 1000,
              pathname: window.location.pathname,
              engaged: this.actions.length > 0
            });
          }
        }, milestone);
      });
    }

    /**
     * Track custom event
     */
    trackEvent(eventType, data = {}) {
      const event = {
        type: eventType,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        url: window.location.href,
        pathname: window.location.pathname,
        ...data
      };

      this.eventQueue.push(event);

      // Send batch if threshold reached
      if (this.eventQueue.length >= this.config.batchSize) {
        this.flush();
      } else {
        // Schedule batch send
        this.scheduleBatchSend();
      }
    }

    /**
     * Track custom journey step
     */
    trackStep(stepName, stepData = {}) {
      this.trackEvent('journey_custom_step', {
        stepName,
        ...stepData
      });
    }

    /**
     * Track conversion event
     */
    trackConversion(conversionName, conversionData = {}) {
      this.trackEvent('journey_conversion', {
        conversionName,
        journeyLength: this.journeyPath.length,
        sessionDuration: Date.now() - this.sessionStart,
        ...conversionData
      });
    }

    /**
     * Schedule batch send
     */
    scheduleBatchSend() {
      clearTimeout(this.sendTimeout);

      this.sendTimeout = setTimeout(() => {
        this.flush();
      }, this.config.batchTimeout);
    }

    /**
     * Send all queued events
     */
    flush() {
      if (this.eventQueue.length === 0) return;

      const events = [...this.eventQueue];
      this.eventQueue = [];
      clearTimeout(this.sendTimeout);

      this.sendEvents(events);
    }

    /**
     * Send events to server
     */
    sendEvents(events) {
      const payload = {
        events,
        sessionInfo: {
          sessionId: this.sessionId,
          sessionStart: this.sessionStart,
          sessionDuration: Date.now() - this.sessionStart,
          journeyPath: this.journeyPath.map(p => ({
            pathname: p.pathname,
            timestamp: p.timestamp,
            sequence: p.sequence
          }))
        }
      };

      // Use sendBeacon if available and enabled
      if (this.config.enableBeacon && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const sent = navigator.sendBeacon(this.config.apiEndpoint, blob);

        if (this.config.debug) {
          console.log('[Journey Mapper] Sent via beacon:', sent, events.length, 'events');
        }
      } else {
        // Fallback to fetch
        fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch((error) => {
          if (this.config.debug) {
            console.error('[Journey Mapper] Send error:', error);
          }
        });
      }
    }

    /**
     * Get journey summary
     */
    getJourneySummary() {
      return {
        sessionId: this.sessionId,
        sessionStart: this.sessionStart,
        sessionDuration: Date.now() - this.sessionStart,
        currentPage: this.currentPage?.pathname,
        journeyPath: this.journeyPath,
        totalPages: this.journeyPath.length,
        totalActions: this.actions.length,
        queuedEvents: this.eventQueue.length
      };
    }

    /**
     * Get current journey path
     */
    getJourneyPath() {
      return this.journeyPath.map(step => ({
        pathname: step.pathname,
        title: step.title,
        timestamp: step.timestamp,
        sequence: step.sequence
      }));
    }
  }

  // ============================
  // AUTO-INITIALIZATION
  // ============================

  // Create global instance
  global.userJourneyMapper = new UserJourneyMapper();

  // Expose class
  global.UserJourneyMapper = UserJourneyMapper;

  // Convenience methods
  global.trackJourneyStep = (stepName, data) => {
    global.userJourneyMapper.trackStep(stepName, data);
  };

  global.trackConversion = (conversionName, data) => {
    global.userJourneyMapper.trackConversion(conversionName, data);
  };

  console.log('[User Journey Mapper] 🗺️ User Journey Mapper loaded');

})(window);
