/**
 * CSS Route-Based Loader - Phase M
 *
 * Dynamically loads page-specific CSS based on the current route.
 * Reduces initial CSS bundle by loading styles only when needed.
 *
 * Features:
 * - Automatic route detection
 * - Page-specific CSS loading
 * - Deduplication (loads each file only once)
 * - Error handling
 * - Loading state management
 *
 * Usage:
 *   Include this script in your HTML:
 *   <script src="/js/css-route-loader.js"></script>
 *
 *   It will automatically detect the current page and load required CSS.
 */

(function() {
  'use strict';

  // Route configuration: Maps paths to required CSS files
  const CSS_ROUTE_CONFIG = {
    // Dashboard pages
    '/dashboard-old.html': {
      css: ['/css/dashboard-core.css'],
      priority: 'high'
    },

    // Chat pages
    '/chat.html': {
      css: ['/css/chat-ailydian.css'],
      priority: 'high'
    },
    '/chat-backup-20250930-182845.html': {
      css: ['/css/chat-ailydian.css'],
      priority: 'low'
    },

    // Firildak/Studio pages
    '/google-studio.html': {
      css: ['/css/firildak-premium.css'],
      priority: 'medium'
    },
    '/models.html': {
      css: ['/css/firildak-premium.css'],
      priority: 'high'
    },

    // Knowledge base
    '/knowledge-base.html': {
      css: ['/css/knowledge-base.css'],
      priority: 'high'
    },

    // Hero/Demo pages
    '/hero-cinematic-demo.html': {
      css: ['/css/hero-cinematic-film.css'],
      priority: 'medium'
    },
    '/cyborg-demo.html': {
      css: ['/css/cyborg-character.css'],
      priority: 'medium'
    },
    '/realistic-characters-demo.html': {
      css: ['/css/hero-realistic-characters.css'],
      priority: 'medium'
    },

    // Medical pages
    '/MEDICAL-EXPERT-INTEGRATION.html': {
      css: ['/css/rtl-support.css'],
      priority: 'medium'
    },

    // Cyborg pages
    '/cyborg-orbital-full.html': {
      css: ['/css/cyborg-orbital-hero.css'],
      priority: 'high'
    },

    // Default: no additional CSS needed
    '_default': {
      css: [],
      priority: 'low'
    }
  };

  class CSSRouteLoader {
    constructor() {
      this.currentPath = window.location.pathname;
      this.loadedCSS = new Set();
      this.loadingPromises = new Map();
      this.stats = {
        totalFiles: 0,
        loadedFiles: 0,
        failedFiles: 0,
        totalLoadTime: 0
      };

      this.init();
    }

    /**
     * Initialize the CSS route loader
     */
    init() {
      console.log(`[CSSRouteLoader] 🎨 Initializing for ${this.currentPath}`);
      this.loadRouteCSS();
    }

    /**
     * Get CSS configuration for current path
     */
    getRouteConfig() {
      const config = CSS_ROUTE_CONFIG[this.currentPath] || CSS_ROUTE_CONFIG['_default'];
      console.log(`[CSSRouteLoader] Route config:`, config);
      return config;
    }

    /**
     * Load CSS for current route
     */
    async loadRouteCSS() {
      const config = this.getRouteConfig();
      const startTime = performance.now();

      if (!config.css || config.css.length === 0) {
        console.log('[CSSRouteLoader] ℹ️  No additional CSS needed for this page');
        return;
      }

      try {
        console.log(`[CSSRouteLoader] Loading ${config.css.length} CSS file(s)...`);

        // Load all CSS files for this route
        await this.loadCSSFiles(config.css);

        const loadTime = Math.round(performance.now() - startTime);
        this.stats.totalLoadTime = loadTime;
        console.log(`[CSSRouteLoader] ✅ CSS loaded in ${loadTime}ms`);

        // Dispatch event
        window.dispatchEvent(new CustomEvent('css:loaded', {
          detail: { path: this.currentPath, loadTime, files: config.css }
        }));

      } catch (error) {
        console.error('[CSSRouteLoader] ❌ Error loading CSS:', error);
        this.stats.failedFiles++;
      }
    }

    /**
     * Load multiple CSS files
     */
    async loadCSSFiles(urls) {
      const promises = urls.map(url => this.loadCSS(url));
      await Promise.all(promises);
    }

    /**
     * Load a single CSS file
     */
    loadCSS(url) {
      // Skip if already loaded
      if (this.loadedCSS.has(url)) {
        console.log(`[CSSRouteLoader] ℹ️  CSS already loaded: ${url}`);
        return Promise.resolve();
      }

      // Return existing promise if loading
      if (this.loadingPromises.has(url)) {
        return this.loadingPromises.get(url);
      }

      // Create loading promise
      const promise = new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;

        link.onload = () => {
          console.log(`[CSSRouteLoader] ✅ Loaded: ${url}`);
          this.loadedCSS.add(url);
          this.loadingPromises.delete(url);
          this.stats.loadedFiles++;
          resolve();
        };

        link.onerror = () => {
          console.error(`[CSSRouteLoader] ❌ Failed: ${url}`);
          this.loadingPromises.delete(url);
          this.stats.failedFiles++;
          reject(new Error(`Failed to load CSS: ${url}`));
        };

        document.head.appendChild(link);
      });

      this.loadingPromises.set(url, promise);
      this.stats.totalFiles++;
      return promise;
    }

    /**
     * Get loading statistics
     */
    getStats() {
      return {
        ...this.stats,
        path: this.currentPath,
        loadedFiles: Array.from(this.loadedCSS)
      };
    }

    /**
     * Manually load CSS for a specific route
     * Useful for prefetching
     */
    async loadForRoute(routePath) {
      const config = CSS_ROUTE_CONFIG[routePath];
      if (!config || !config.css || config.css.length === 0) {
        return;
      }

      console.log(`[CSSRouteLoader] 🔮 Preloading CSS for ${routePath}`);
      await this.loadCSSFiles(config.css);
    }
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.cssRouteLoader = new CSSRouteLoader();
    });
  } else {
    window.cssRouteLoader = new CSSRouteLoader();
  }

  // Expose CSSRouteLoader class globally
  window.CSSRouteLoader = CSSRouteLoader;

  // Log initialization
  console.log('[CSSRouteLoader] 🎨 CSS Route Loader initialized');

})();
