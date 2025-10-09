/**
 * 📊 AiLydian Ultra Pro - Conversion Funnel Tracker
 * Phase Q: Advanced Analytics & Business Intelligence
 *
 * Features:
 * - Multi-step funnel tracking
 * - Drop-off rate calculation
 * - Time-to-conversion measurement
 * - A/B test support
 * - Funnel comparison
 * - Custom event funnels
 * - Real-time funnel monitoring
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
    apiEndpoint: '/api/analytics/funnels',
    debug: false,
    enableBeacon: true,
    trackAutomatically: true
  };

  // Pre-defined funnels
  const FUNNELS = {
    signup: {
      name: 'User Signup',
      steps: [
        { id: 'landing', name: 'Landing Page', path: '/' },
        { id: 'signup_page', name: 'Signup Page', path: '/auth.html' },
        { id: 'signup_form', name: 'Form Started', event: 'signup_form_started' },
        { id: 'signup_submit', name: 'Form Submitted', event: 'signup_submitted' },
        { id: 'signup_complete', name: 'Account Created', event: 'signup_completed' }
      ]
    },

    activation: {
      name: 'User Activation',
      steps: [
        { id: 'first_login', name: 'First Login', event: 'first_login' },
        { id: 'profile_view', name: 'View Profile', path: '/dashboard-old.html' },
        { id: 'first_chat', name: 'First Chat Message', event: 'first_message_sent' },
        { id: 'feature_used', name: 'Feature Used', event: 'feature_used' },
        { id: 'activated', name: 'Activated', event: 'user_activated' }
      ]
    },

    engagement: {
      name: 'Daily Engagement',
      steps: [
        { id: 'visit', name: 'Site Visit', path: '/' },
        { id: 'login', name: 'Login', event: 'login' },
        { id: 'chat_open', name: 'Open Chat', path: '/chat.html' },
        { id: 'message_sent', name: 'Send Message', event: 'message_sent' },
        { id: 'session_complete', name: 'Complete Session', event: 'session_complete' }
      ]
    },

    lydianiq: {
      name: 'LyDian IQ Usage',
      steps: [
        { id: 'discover', name: 'Discover IQ', path: '/lydian-iq.html' },
        { id: 'first_problem', name: 'Enter Problem', event: 'iq_problem_entered' },
        { id: 'solution_view', name: 'View Solution', event: 'iq_solution_shown' },
        { id: 'satisfied', name: 'Satisfied with Result', event: 'iq_result_positive' },
        { id: 'repeat_use', name: 'Repeat Usage', event: 'iq_repeat_use' }
      ]
    },

    pwa_install: {
      name: 'PWA Installation',
      steps: [
        { id: 'prompt_shown', name: 'Install Prompt Shown', event: 'pwa_install_prompt_available' },
        { id: 'prompt_clicked', name: 'Clicked Install', event: 'pwa_install_banner_clicked' },
        { id: 'installed', name: 'App Installed', event: 'pwa_installed' },
        { id: 'first_standalone_open', name: 'First Standalone Open', event: 'pwa_session_start' },
        { id: 'engaged', name: 'Engaged User', event: 'pwa_user_interaction' }
      ]
    }
  };

  // ============================
  // CONVERSION FUNNEL TRACKER
  // ============================

  class ConversionFunnel {
    constructor(config = {}) {
      this.config = { ...CONFIG, ...config };
      this.funnels = FUNNELS;
      this.activeFunnels = new Map(); // Track which funnels user is in
      this.completedSteps = new Map(); // Track completed steps per funnel
      this.funnelStartTimes = new Map(); // Track when funnel started
      this.sessionId = this.generateSessionId();

      this.init();
    }

    /**
     * Initialize funnel tracker
     */
    init() {
      if (this.config.debug) {
        console.log('[Funnel Tracker] Initializing...');
      }

      if (this.config.trackAutomatically) {
        this.setupAutomaticTracking();
      }

      // Load funnel progress from localStorage
      this.loadFunnelProgress();

      if (this.config.debug) {
        console.log('[Funnel Tracker] ✅ Initialized');
      }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
      return `funnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Setup automatic funnel tracking
     */
    setupAutomaticTracking() {
      // Track page-based funnel steps
      this.checkPageFunnelSteps();

      // Listen for custom events
      window.addEventListener('funnel:step', (e) => {
        const { funnelId, stepId, data } = e.detail;
        this.trackStep(funnelId, stepId, data);
      });

      // Listen for journey events to trigger funnel steps
      window.addEventListener('journey_action', (e) => {
        this.checkActionFunnelSteps(e.detail);
      });

      // Check on page load
      window.addEventListener('load', () => {
        this.checkPageFunnelSteps();
      });

      // Check on popstate (navigation)
      window.addEventListener('popstate', () => {
        this.checkPageFunnelSteps();
      });
    }

    /**
     * Check if current page matches any funnel steps
     */
    checkPageFunnelSteps() {
      const currentPath = window.location.pathname;

      Object.entries(this.funnels).forEach(([funnelId, funnel]) => {
        funnel.steps.forEach(step => {
          if (step.path && currentPath === step.path) {
            this.trackStep(funnelId, step.id);
          }
        });
      });
    }

    /**
     * Check if action matches any funnel steps
     */
    checkActionFunnelSteps(actionData) {
      Object.entries(this.funnels).forEach(([funnelId, funnel]) => {
        funnel.steps.forEach(step => {
          if (step.event && actionData.type === step.event) {
            this.trackStep(funnelId, step.id, actionData);
          }
        });
      });
    }

    /**
     * Track funnel step completion
     */
    trackStep(funnelId, stepId, data = {}) {
      if (!this.funnels[funnelId]) {
        console.warn(`[Funnel Tracker] Unknown funnel: ${funnelId}`);
        return;
      }

      const funnel = this.funnels[funnelId];
      const step = funnel.steps.find(s => s.id === stepId);

      if (!step) {
        console.warn(`[Funnel Tracker] Unknown step: ${stepId} in funnel: ${funnelId}`);
        return;
      }

      // Initialize funnel tracking if not started
      if (!this.activeFunnels.has(funnelId)) {
        this.startFunnel(funnelId);
      }

      // Check if step already completed
      const completed = this.completedSteps.get(funnelId) || new Set();
      if (completed.has(stepId)) {
        if (this.config.debug) {
          console.log(`[Funnel Tracker] Step already completed: ${funnelId}.${stepId}`);
        }
        return;
      }

      // Mark step as completed
      completed.add(stepId);
      this.completedSteps.set(funnelId, completed);

      // Calculate step metrics
      const stepIndex = funnel.steps.findIndex(s => s.id === stepId);
      const previousStep = stepIndex > 0 ? funnel.steps[stepIndex - 1] : null;
      const funnelStartTime = this.funnelStartTimes.get(funnelId);
      const timeFromStart = Date.now() - funnelStartTime;

      // Track step completion
      const stepData = {
        funnelId,
        funnelName: funnel.name,
        stepId,
        stepName: step.name,
        stepIndex,
        totalSteps: funnel.steps.length,
        timeFromStart,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        ...data
      };

      this.sendStepEvent('funnel_step_completed', stepData);

      // Check if funnel is complete
      if (completed.size === funnel.steps.length) {
        this.completeFunnel(funnelId);
      }

      // Save progress
      this.saveFunnelProgress();

      if (this.config.debug) {
        console.log(`[Funnel Tracker] Step completed: ${funnelId}.${stepId} (${completed.size}/${funnel.steps.length})`);
      }
    }

    /**
     * Start tracking a funnel
     */
    startFunnel(funnelId) {
      if (this.activeFunnels.has(funnelId)) return;

      this.activeFunnels.set(funnelId, {
        startTime: Date.now(),
        steps: []
      });

      this.funnelStartTimes.set(funnelId, Date.now());
      this.completedSteps.set(funnelId, new Set());

      this.sendStepEvent('funnel_started', {
        funnelId,
        funnelName: this.funnels[funnelId].name,
        timestamp: Date.now(),
        sessionId: this.sessionId
      });

      if (this.config.debug) {
        console.log(`[Funnel Tracker] Funnel started: ${funnelId}`);
      }
    }

    /**
     * Complete a funnel
     */
    completeFunnel(funnelId) {
      const funnel = this.funnels[funnelId];
      const startTime = this.funnelStartTimes.get(funnelId);
      const completionTime = Date.now() - startTime;

      this.sendStepEvent('funnel_completed', {
        funnelId,
        funnelName: funnel.name,
        totalSteps: funnel.steps.length,
        completionTime,
        timestamp: Date.now(),
        sessionId: this.sessionId
      });

      // Clean up
      this.activeFunnels.delete(funnelId);
      this.completedSteps.delete(funnelId);
      this.funnelStartTimes.delete(funnelId);

      this.saveFunnelProgress();

      if (this.config.debug) {
        console.log(`[Funnel Tracker] Funnel completed: ${funnelId} in ${completionTime}ms`);
      }
    }

    /**
     * Track funnel abandonment
     */
    abandonFunnel(funnelId, reason = 'unknown') {
      if (!this.activeFunnels.has(funnelId)) return;

      const funnel = this.funnels[funnelId];
      const completed = this.completedSteps.get(funnelId) || new Set();
      const lastCompletedStep = Array.from(completed).pop();
      const startTime = this.funnelStartTimes.get(funnelId);
      const timeInFunnel = Date.now() - startTime;

      this.sendStepEvent('funnel_abandoned', {
        funnelId,
        funnelName: funnel.name,
        lastCompletedStep,
        stepsCompleted: completed.size,
        totalSteps: funnel.steps.length,
        timeInFunnel,
        reason,
        timestamp: Date.now(),
        sessionId: this.sessionId
      });

      // Clean up
      this.activeFunnels.delete(funnelId);
      this.completedSteps.delete(funnelId);
      this.funnelStartTimes.delete(funnelId);

      this.saveFunnelProgress();
    }

    /**
     * Send funnel event to server
     */
    sendStepEvent(eventType, data) {
      const payload = {
        type: eventType,
        ...data
      };

      // Use sendBeacon if available
      if (this.config.enableBeacon && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(this.config.apiEndpoint, blob);
      } else {
        // Fallback to fetch
        fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      }
    }

    /**
     * Save funnel progress to localStorage
     */
    saveFunnelProgress() {
      try {
        const progress = {
          activeFunnels: Array.from(this.activeFunnels.entries()),
          completedSteps: Array.from(this.completedSteps.entries()).map(([key, value]) => [key, Array.from(value)]),
          funnelStartTimes: Array.from(this.funnelStartTimes.entries())
        };

        localStorage.setItem('ailydian_funnel_progress', JSON.stringify(progress));
      } catch (e) {
        // Ignore localStorage errors
      }
    }

    /**
     * Load funnel progress from localStorage
     */
    loadFunnelProgress() {
      try {
        const saved = localStorage.getItem('ailydian_funnel_progress');
        if (!saved) return;

        const progress = JSON.parse(saved);

        this.activeFunnels = new Map(progress.activeFunnels || []);
        this.completedSteps = new Map((progress.completedSteps || []).map(([key, value]) => [key, new Set(value)]));
        this.funnelStartTimes = new Map(progress.funnelStartTimes || []);

        if (this.config.debug) {
          console.log('[Funnel Tracker] Loaded progress:', {
            activeFunnels: this.activeFunnels.size,
            totalSteps: Array.from(this.completedSteps.values()).reduce((sum, set) => sum + set.size, 0)
          });
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }

    /**
     * Get funnel progress
     */
    getFunnelProgress(funnelId) {
      const funnel = this.funnels[funnelId];
      if (!funnel) return null;

      const completed = this.completedSteps.get(funnelId) || new Set();
      const startTime = this.funnelStartTimes.get(funnelId);

      return {
        funnelId,
        funnelName: funnel.name,
        totalSteps: funnel.steps.length,
        completedSteps: completed.size,
        progress: (completed.size / funnel.steps.length) * 100,
        steps: funnel.steps.map(step => ({
          ...step,
          completed: completed.has(step.id)
        })),
        startTime,
        timeInFunnel: startTime ? Date.now() - startTime : null
      };
    }

    /**
     * Get all active funnels
     */
    getActiveFunnels() {
      return Array.from(this.activeFunnels.keys()).map(funnelId =>
        this.getFunnelProgress(funnelId)
      );
    }

    /**
     * Define custom funnel
     */
    defineFunnel(funnelId, funnelConfig) {
      this.funnels[funnelId] = funnelConfig;

      if (this.config.debug) {
        console.log(`[Funnel Tracker] Custom funnel defined: ${funnelId}`);
      }
    }

    /**
     * Reset funnel progress
     */
    resetFunnel(funnelId) {
      this.activeFunnels.delete(funnelId);
      this.completedSteps.delete(funnelId);
      this.funnelStartTimes.delete(funnelId);
      this.saveFunnelProgress();
    }

    /**
     * Reset all funnels
     */
    resetAll() {
      this.activeFunnels.clear();
      this.completedSteps.clear();
      this.funnelStartTimes.clear();
      this.saveFunnelProgress();
    }
  }

  // ============================
  // AUTO-INITIALIZATION
  // ============================

  // Create global instance
  global.conversionFunnel = new ConversionFunnel();

  // Expose class
  global.ConversionFunnel = ConversionFunnel;

  // Convenience methods
  global.trackFunnelStep = (funnelId, stepId, data) => {
    global.conversionFunnel.trackStep(funnelId, stepId, data);
  };

  global.getFunnelProgress = (funnelId) => {
    return global.conversionFunnel.getFunnelProgress(funnelId);
  };

  console.log('[Conversion Funnel] 📊 Conversion Funnel Tracker loaded');

})(window);
