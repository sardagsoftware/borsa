/**
 * 👥 AiLydian Ultra Pro - Cohort Analysis Engine
 * Phase Q: Advanced Analytics & Business Intelligence
 *
 * Features:
 * - User cohort segmentation by signup date
 * - Retention tracking (Day 1, 7, 30, 90)
 * - Engagement metrics per cohort
 * - Behavioral cohorts (power users, at-risk, churned)
 * - Cohort comparison
 * - A/B test cohorts
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
    apiEndpoint: '/api/analytics/cohorts',
    trackingEndpoint: '/api/analytics/engagement',
    debug: false,
    enableBeacon: true
  };

  // ============================
  // COHORT ANALYSIS ENGINE
  // ============================

  class CohortAnalysis {
    constructor(config = {}) {
      this.config = { ...CONFIG, ...config };
      this.userId = null;
      this.userCohort = null;
      this.signupDate = null;
      this.sessionCount = 0;
      this.lastActivity = null;

      this.init();
    }

    /**
     * Initialize cohort tracking
     */
    init() {
      if (this.config.debug) {
        console.log('[Cohort Analysis] Initializing...');
      }

      // Load user info from session/localStorage
      this.loadUserInfo();

      // Track current session
      if (this.userId) {
        this.trackSession();
      }

      if (this.config.debug) {
        console.log('[Cohort Analysis] ✅ Initialized');
      }
    }

    /**
     * Load user information
     */
    loadUserInfo() {
      try {
        const userInfo = localStorage.getItem('ailydian_user_info');
        if (userInfo) {
          const data = JSON.parse(userInfo);
          this.userId = data.userId;
          this.signupDate = data.signupDate;
          this.userCohort = this.calculateCohort(this.signupDate);
        }
      } catch (e) {
        // Ignore errors
      }
    }

    /**
     * Set user information
     */
    setUser(userId, signupDate) {
      this.userId = userId;
      this.signupDate = signupDate;
      this.userCohort = this.calculateCohort(signupDate);

      // Save to localStorage
      try {
        localStorage.setItem('ailydian_user_info', JSON.stringify({
          userId,
          signupDate
        }));
      } catch (e) {
        // Ignore errors
      }

      // Track cohort assignment
      this.trackEvent('cohort_assigned', {
        cohort: this.userCohort,
        signupDate
      });
    }

    /**
     * Calculate cohort from signup date
     */
    calculateCohort(signupDate) {
      const date = new Date(signupDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`; // Format: "2025-10"
    }

    /**
     * Track user session
     */
    trackSession() {
      this.sessionCount++;
      this.lastActivity = Date.now();

      // Calculate days since signup
      const daysSinceSignup = this.getDaysSinceSignup();

      // Determine retention milestone
      const retentionMilestone = this.getRetentionMilestone(daysSinceSignup);

      // Track session event
      this.trackEvent('cohort_session', {
        userId: this.userId,
        cohort: this.userCohort,
        daysSinceSignup,
        retentionMilestone,
        sessionCount: this.sessionCount,
        timestamp: Date.now()
      });
    }

    /**
     * Get days since signup
     */
    getDaysSinceSignup() {
      if (!this.signupDate) return 0;

      const signup = new Date(this.signupDate);
      const now = new Date();
      const diffTime = Math.abs(now - signup);
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Get retention milestone
     */
    getRetentionMilestone(daysSinceSignup) {
      if (daysSinceSignup === 0) return 'day_0';
      if (daysSinceSignup === 1) return 'day_1';
      if (daysSinceSignup === 7) return 'day_7';
      if (daysSinceSignup === 30) return 'day_30';
      if (daysSinceSignup === 90) return 'day_90';
      return null;
    }

    /**
     * Track user action for cohort analysis
     */
    trackAction(actionType, actionData = {}) {
      if (!this.userId) return;

      this.trackEvent('cohort_action', {
        userId: this.userId,
        cohort: this.userCohort,
        actionType,
        daysSinceSignup: this.getDaysSinceSignup(),
        ...actionData
      });
    }

    /**
     * Track event
     */
    trackEvent(eventType, data) {
      const payload = {
        type: eventType,
        timestamp: Date.now(),
        ...data
      };

      // Send to server
      if (this.config.enableBeacon && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(this.config.trackingEndpoint, blob);
      } else {
        fetch(this.config.trackingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      }
    }

    /**
     * Get user cohort info
     */
    getCohortInfo() {
      return {
        userId: this.userId,
        cohort: this.userCohort,
        signupDate: this.signupDate,
        daysSinceSignup: this.getDaysSinceSignup(),
        sessionCount: this.sessionCount,
        lastActivity: this.lastActivity
      };
    }

    /**
     * Identify user segment
     */
    identifySegment() {
      const daysSinceSignup = this.getDaysSinceSignup();
      const daysSinceLastActivity = this.lastActivity
        ? Math.floor((Date.now() - this.lastActivity) / (1000 * 60 * 60 * 24))
        : 0;

      // Power user: Active frequently
      if (this.sessionCount > 10 && daysSinceLastActivity <= 3) {
        return 'power_user';
      }

      // At risk: Haven't visited in 7+ days
      if (daysSinceLastActivity >= 7 && daysSinceLastActivity < 30) {
        return 'at_risk';
      }

      // Churned: Haven't visited in 30+ days
      if (daysSinceLastActivity >= 30) {
        return 'churned';
      }

      // New user: Signed up recently
      if (daysSinceSignup <= 7) {
        return 'new_user';
      }

      // Active: Regular usage
      if (this.sessionCount >= 3 && daysSinceLastActivity <= 7) {
        return 'active';
      }

      // Casual: Infrequent usage
      return 'casual';
    }
  }

  // ============================
  // BUSINESS METRICS TRACKER
  // ============================

  class BusinessMetrics {
    constructor() {
      this.metrics = {
        sessionsToday: 0,
        actionsToday: 0,
        featuresUsed: new Set(),
        totalTimeSpent: 0,
        sessionStart: Date.now()
      };
    }

    /**
     * Track feature usage
     */
    trackFeature(featureName, featureData = {}) {
      this.metrics.featuresUsed.add(featureName);
      this.metrics.actionsToday++;

      // Track to cohort analysis
      if (global.cohortAnalysis) {
        global.cohortAnalysis.trackAction('feature_used', {
          feature: featureName,
          ...featureData
        });
      }
    }

    /**
     * Track message sent
     */
    trackMessage(messageData = {}) {
      this.metrics.actionsToday++;

      if (global.cohortAnalysis) {
        global.cohortAnalysis.trackAction('message_sent', messageData);
      }
    }

    /**
     * Get session summary
     */
    getSessionSummary() {
      return {
        ...this.metrics,
        sessionDuration: Date.now() - this.metrics.sessionStart,
        featuresUsed: Array.from(this.metrics.featuresUsed)
      };
    }
  }

  // ============================
  // AUTO-INITIALIZATION
  // ============================

  // Create global instances
  global.cohortAnalysis = new CohortAnalysis();
  global.businessMetrics = new BusinessMetrics();

  // Expose classes
  global.CohortAnalysis = CohortAnalysis;
  global.BusinessMetrics = BusinessMetrics;

  // Convenience methods
  global.trackFeatureUsage = (featureName, data) => {
    global.businessMetrics.trackFeature(featureName, data);
  };

  global.trackMessage = (data) => {
    global.businessMetrics.trackMessage(data);
  };

  console.log('[Cohort Analysis] 👥 Cohort Analysis & Business Metrics loaded');

})(window);
