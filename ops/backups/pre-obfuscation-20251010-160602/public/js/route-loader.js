/**
 * Route-Based Code Splitter - Phase L
 *
 * Automatically loads page-specific JavaScript based on the current route.
 * Reduces initial bundle size by only loading code needed for the current page.
 *
 * Features:
 * - Automatic route detection
 * - Page-specific code loading
 * - Prefetching for likely next pages
 * - Loading state management
 * - Error handling
 *
 * Usage:
 *   Include this script in your HTML:
 *   <script src="/js/route-loader.js"></script>
 *
 *   It will automatically detect the current page and load required scripts.
 */

(function() {
  'use strict';

  // Route configuration: Maps paths to required scripts
  const ROUTE_CONFIG = {
    // Homepage - needs 3D visualization
    '/': {
      scripts: [],
      lazyScripts: ['/js/three.min.js'], // Load on user interaction
      preload: ['/js/chat-ailydian.js'],
      priority: 'high'
    },
    '/index.html': {
      scripts: [],
      lazyScripts: ['/js/three.min.js'],
      preload: ['/js/chat-ailydian.js'],
      priority: 'high'
    },

    // Chat page
    '/chat.html': {
      scripts: ['/js/chat-ailydian.js'],
      preload: ['/js/voice-module.js'],
      priority: 'high'
    },

    // LyDian IQ
    '/lydian-iq.html': {
      scripts: ['/js/lydian-iq.js', '/js/lydian-iq-enhancements.js'],
      preload: [],
      priority: 'high'
    },

    // Models page
    '/models.html': {
      scripts: ['/js/firildak-app.js'],
      preload: [],
      priority: 'medium'
    },

    // Knowledge base
    '/knowledge-base.html': {
      scripts: ['/js/knowledge-base.js', '/js/knowledge-categories-data.js'],
      preload: [],
      priority: 'medium'
    },

    // 3D pages
    '/hero-3d-lydian.html': {
      scripts: ['/js/three.min.js'],
      preload: [],
      priority: 'high'
    },

    // Default for unknown routes
    '_default': {
      scripts: [],
      preload: [],
      priority: 'low'
    }
  };

  class RouteLoader {
    constructor() {
      this.currentPath = window.location.pathname;
      this.loadedScripts = new Set();
      this.loadingPromises = new Map();
      this.stats = {
        totalScripts: 0,
        loadedScripts: 0,
        failedScripts: 0,
        totalLoadTime: 0
      };

      // Use LazyLoader if available
      this.lazyLoader = window.LazyLoader;

      this.init();
    }

    /**
     * Initialize the route loader
     */
    init() {
      console.log(`[RouteLoader] 🚀 Initializing for ${this.currentPath}`);
      this.loadRouteScripts();
    }

    /**
     * Get route configuration for current path
     * @returns {Object} Route config
     */
    getRouteConfig() {
      const config = ROUTE_CONFIG[this.currentPath] || ROUTE_CONFIG['_default'];
      console.log(`[RouteLoader] Route config:`, config);
      return config;
    }

    /**
     * Load scripts for current route
     */
    async loadRouteScripts() {
      const config = this.getRouteConfig();
      const startTime = performance.now();

      try {
        // Load required scripts immediately
        if (config.scripts && config.scripts.length > 0) {
          console.log(`[RouteLoader] Loading ${config.scripts.length} required scripts...`);
          await this.loadScripts(config.scripts);
        }

        // Preload scripts for faster subsequent navigation
        if (config.preload && config.preload.length > 0) {
          console.log(`[RouteLoader] Preloading ${config.preload.length} scripts...`);
          this.preloadScripts(config.preload);
        }

        // Setup lazy loading for deferred scripts
        if (config.lazyScripts && config.lazyScripts.length > 0) {
          console.log(`[RouteLoader] ${config.lazyScripts.length} scripts will lazy load`);
          this.setupLazyLoading(config.lazyScripts);
        }

        const loadTime = Math.round(performance.now() - startTime);
        this.stats.totalLoadTime = loadTime;
        console.log(`[RouteLoader] ✅ Route setup complete in ${loadTime}ms`);

        // Dispatch event
        window.dispatchEvent(new CustomEvent('route:loaded', {
          detail: { path: this.currentPath, loadTime }
        }));

      } catch (error) {
        console.error('[RouteLoader] ❌ Error loading route scripts:', error);
        this.stats.failedScripts++;
      }
    }

    /**
     * Load multiple scripts in sequence
     * @param {Array<string>} urls - Script URLs
     */
    async loadScripts(urls) {
      for (const url of urls) {
        try {
          await this.loadScript(url);
          this.stats.loadedScripts++;
        } catch (error) {
          console.error(`[RouteLoader] Failed to load ${url}:`, error);
          this.stats.failedScripts++;
        }
      }
    }

    /**
     * Load a single script
     * @param {string} url - Script URL
     * @returns {Promise}
     */
    loadScript(url) {
      // Skip if already loaded
      if (this.loadedScripts.has(url)) {
        return Promise.resolve();
      }

      // Return existing promise if loading
      if (this.loadingPromises.has(url)) {
        return this.loadingPromises.get(url);
      }

      // Use LazyLoader if available
      if (this.lazyLoader && this.lazyLoader.loadScript) {
        const promise = this.lazyLoader.loadScript(url);
        this.loadingPromises.set(url, promise);
        promise.then(() => {
          this.loadedScripts.add(url);
          this.loadingPromises.delete(url);
        });
        return promise;
      }

      // Fallback to manual script loading
      const promise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;

        script.onload = () => {
          console.log(`[RouteLoader] ✅ Loaded: ${url}`);
          this.loadedScripts.add(url);
          this.loadingPromises.delete(url);
          resolve();
        };

        script.onerror = () => {
          console.error(`[RouteLoader] ❌ Failed: ${url}`);
          this.loadingPromises.delete(url);
          reject(new Error(`Failed to load ${url}`));
        };

        document.head.appendChild(script);
      });

      this.loadingPromises.set(url, promise);
      this.stats.totalScripts++;
      return promise;
    }

    /**
     * Preload scripts using link[rel=preload]
     * @param {Array<string>} urls - Script URLs to preload
     */
    preloadScripts(urls) {
      urls.forEach(url => {
        if (this.loadedScripts.has(url)) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = url;
        document.head.appendChild(link);

        console.log(`[RouteLoader] 🔮 Preloading: ${url}`);
      });
    }

    /**
     * Setup lazy loading triggers
     * Loads scripts on first user interaction
     * @param {Array<string>} urls - Scripts to lazy load
     */
    setupLazyLoading(urls) {
      const events = ['mousedown', 'touchstart', 'keydown', 'wheel'];
      let loaded = false;

      const loadOnInteraction = async () => {
        if (loaded) return;
        loaded = true;

        // Remove event listeners
        events.forEach(event => {
          document.removeEventListener(event, loadOnInteraction, { passive: true });
        });

        console.log('[RouteLoader] 🖱️ User interaction detected, loading deferred scripts...');

        try {
          await this.loadScripts(urls);
          console.log('[RouteLoader] ✅ Lazy scripts loaded');
        } catch (error) {
          console.error('[RouteLoader] ❌ Lazy loading failed:', error);
        }
      };

      // Add event listeners with passive flag for better performance
      events.forEach(event => {
        document.addEventListener(event, loadOnInteraction, { passive: true, once: true });
      });

      // Fallback: Load after 5 seconds if no interaction
      setTimeout(() => {
        if (!loaded) {
          console.log('[RouteLoader] ⏰ Timeout reached, loading deferred scripts...');
          loadOnInteraction();
        }
      }, 5000);
    }

    /**
     * Get loading statistics
     * @returns {Object} Loading stats
     */
    getStats() {
      return {
        ...this.stats,
        path: this.currentPath,
        loadedScripts: Array.from(this.loadedScripts)
      };
    }
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.routeLoader = new RouteLoader();
    });
  } else {
    window.routeLoader = new RouteLoader();
  }

  // Expose RouteLoader class globally
  window.RouteLoader = RouteLoader;

})();
