/**
 * 📊 AiLydian Ultra Pro - PWA Analytics Tracker
 * Phase P: Performance Monitoring & Analytics
 *
 * Tracks PWA-specific metrics:
 * - Installation rate & flow
 * - Standalone mode usage
 * - Offline/online transitions
 * - Service worker lifecycle
 * - User engagement (sessions, retention)
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
    apiEndpoint: '/api/analytics/pwa',
    batchSize: 10,
    batchTimeout: 5000, // 5 seconds
    debug: false,
    enableBeacon: true,
  };

  // ============================
  // PWA ANALYTICS TRACKER
  // ============================

  class PWAAnalytics {
    constructor(config = {}) {
      this.config = { ...CONFIG, ...config };
      this.eventQueue = [];
      this.sendTimeout = null;
      this.sessionId = this.generateSessionId();
      this.sessionStart = Date.now();
      this.isStandalone = this.detectStandalone();
      this.installPromptShown = false;

      this.init();
    }

    /**
     * Initialize PWA analytics tracking
     */
    init() {
      if (this.config.debug) {
        console.log('[PWA Analytics] Initializing...');
      }

      // Track initial state
      this.trackEvent('pwa_session_start', {
        standalone: this.isStandalone,
        displayMode: this.getDisplayMode(),
        referrer: document.referrer,
        userAgent: navigator.userAgent
      });

      // Setup listeners
      this.setupInstallTracking();
      this.setupServiceWorkerTracking();
      this.setupNetworkTracking();
      this.setupEngagementTracking();
      this.setupVisibilityTracking();

      // Send queued events before page unload
      window.addEventListener('beforeunload', () => {
        this.flush();
      });

      // Send queued events on visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });

      if (this.config.debug) {
        console.log('[PWA Analytics] ✅ Initialized');
      }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
      return `pwa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Detect if running in standalone mode
     */
    detectStandalone() {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.navigator.standalone === true;
    }

    /**
     * Get display mode
     */
    getDisplayMode() {
      const modes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];

      for (const mode of modes) {
        if (window.matchMedia(`(display-mode: ${mode})`).matches) {
          return mode;
        }
      }

      return 'browser';
    }

    /**
     * Track PWA install prompt events
     */
    setupInstallTracking() {
      // beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        this.trackEvent('pwa_install_prompt_available', {
          platforms: e.platforms
        });
      });

      // appinstalled event
      window.addEventListener('appinstalled', () => {
        this.trackEvent('pwa_installed', {
          fromPrompt: this.installPromptShown,
          sessionDuration: Date.now() - this.sessionStart
        });
      });

      // Listen for custom install prompt events from pwa-installer.js
      window.addEventListener('pwa:install:shown', () => {
        this.installPromptShown = true;
        this.trackEvent('pwa_install_banner_shown');
      });

      window.addEventListener('pwa:install:clicked', () => {
        this.trackEvent('pwa_install_banner_clicked');
      });

      window.addEventListener('pwa:install:dismissed', () => {
        this.trackEvent('pwa_install_banner_dismissed');
      });

      window.addEventListener('pwa:install:outcome', (e) => {
        this.trackEvent('pwa_install_prompt_outcome', {
          outcome: e.detail.outcome // 'accepted' or 'dismissed'
        });
      });
    }

    /**
     * Track service worker lifecycle
     */
    setupServiceWorkerTracking() {
      if (!('serviceWorker' in navigator)) return;

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.trackEvent('pwa_sw_controller_change');
      });

      // Track service worker registration
      navigator.serviceWorker.ready.then((registration) => {
        this.trackEvent('pwa_sw_ready', {
          scope: registration.scope,
          updateViaCache: registration.updateViaCache
        });

        // Track updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          this.trackEvent('pwa_sw_update_found');

          newWorker.addEventListener('statechange', () => {
            this.trackEvent('pwa_sw_state_change', {
              state: newWorker.state
            });

            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.trackEvent('pwa_sw_update_available');
            }
          });
        });
      }).catch((error) => {
        this.trackEvent('pwa_sw_registration_error', {
          error: error.message
        });
      });
    }

    /**
     * Track network status changes
     */
    setupNetworkTracking() {
      let onlineAt = navigator.onLine ? Date.now() : null;
      let offlineAt = null;

      // Track initial state
      this.trackEvent('pwa_network_status', {
        online: navigator.onLine,
        connectionType: this.getConnectionType()
      });

      window.addEventListener('online', () => {
        onlineAt = Date.now();
        const offlineDuration = offlineAt ? onlineAt - offlineAt : null;

        this.trackEvent('pwa_network_online', {
          offlineDuration,
          connectionType: this.getConnectionType()
        });
      });

      window.addEventListener('offline', () => {
        offlineAt = Date.now();
        const onlineDuration = onlineAt ? offlineAt - onlineAt : null;

        this.trackEvent('pwa_network_offline', {
          onlineDuration
        });
      });

      // Track connection type changes
      if (navigator.connection) {
        navigator.connection.addEventListener('change', () => {
          this.trackEvent('pwa_connection_change', {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData
          });
        });
      }
    }

    /**
     * Get connection type
     */
    getConnectionType() {
      if (!navigator.connection) return null;

      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }

    /**
     * Track user engagement metrics
     */
    setupEngagementTracking() {
      // Track session duration periodically
      setInterval(() => {
        const sessionDuration = Date.now() - this.sessionStart;

        this.trackEvent('pwa_session_heartbeat', {
          sessionDuration,
          standalone: this.isStandalone,
          visible: document.visibilityState === 'visible'
        });
      }, 60000); // Every minute

      // Track page visibility time
      let visibleStart = document.visibilityState === 'visible' ? Date.now() : null;

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          visibleStart = Date.now();
        } else if (visibleStart) {
          const visibleDuration = Date.now() - visibleStart;

          this.trackEvent('pwa_visibility_hidden', {
            visibleDuration,
            sessionDuration: Date.now() - this.sessionStart
          });
        }
      });

      // Track interactions
      let interactionCount = 0;
      const interactionEvents = ['click', 'keydown', 'touchstart', 'scroll'];

      const trackInteraction = () => {
        interactionCount++;

        // Log every 10 interactions
        if (interactionCount % 10 === 0) {
          this.trackEvent('pwa_user_interaction', {
            count: interactionCount,
            sessionDuration: Date.now() - this.sessionStart
          });
        }
      };

      interactionEvents.forEach(event => {
        window.addEventListener(event, trackInteraction, { passive: true, once: false });
      });
    }

    /**
     * Track page visibility for engagement
     */
    setupVisibilityTracking() {
      let hiddenAt = null;

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          hiddenAt = Date.now();
        } else if (hiddenAt) {
          const hiddenDuration = Date.now() - hiddenAt;

          this.trackEvent('pwa_returned_from_background', {
            hiddenDuration,
            standalone: this.isStandalone
          });
        }
      });
    }

    /**
     * Track PWA event
     */
    trackEvent(eventName, data = {}) {
      const event = {
        event: eventName,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        standalone: this.isStandalone,
        displayMode: this.getDisplayMode(),
        online: navigator.onLine,
        url: window.location.href,
        pathname: window.location.pathname,
        ...data
      };

      this.eventQueue.push(event);

      if (this.config.debug) {
        console.log('[PWA Analytics]', eventName, data);
      }

      // Send batch if threshold reached
      if (this.eventQueue.length >= this.config.batchSize) {
        this.flush();
      } else {
        // Schedule batch send
        this.scheduleBatchSend();
      }
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
          standalone: this.isStandalone,
          displayMode: this.getDisplayMode()
        }
      };

      // Use sendBeacon if available and enabled (for reliable delivery on page unload)
      if (this.config.enableBeacon && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const sent = navigator.sendBeacon(this.config.apiEndpoint, blob);

        if (this.config.debug) {
          console.log('[PWA Analytics] Sent via beacon:', sent, events.length, 'events');
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
            console.error('[PWA Analytics] Send error:', error);
          }
        });
      }
    }

    /**
     * Get current analytics state
     */
    getState() {
      return {
        sessionId: this.sessionId,
        sessionStart: this.sessionStart,
        sessionDuration: Date.now() - this.sessionStart,
        isStandalone: this.isStandalone,
        displayMode: this.getDisplayMode(),
        online: navigator.onLine,
        queuedEvents: this.eventQueue.length
      };
    }

    /**
     * Manually track custom event
     */
    track(eventName, data = {}) {
      this.trackEvent(`pwa_custom_${eventName}`, data);
    }
  }

  // ============================
  // AUTO-INITIALIZATION
  // ============================

  // Create global instance
  global.pwaAnalytics = new PWAAnalytics();

  // Expose class for custom instances
  global.PWAAnalytics = PWAAnalytics;

  console.log('[PWA Analytics] 📊 PWA Analytics loaded');

})(window);
