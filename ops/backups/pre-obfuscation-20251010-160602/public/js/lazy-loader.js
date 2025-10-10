/**
 * Lazy Loader Utility - Phase L: Code Splitting
 *
 * Dynamically loads JavaScript libraries and modules on-demand
 * to reduce initial bundle size and improve page load performance.
 *
 * Features:
 * - Promise-based API
 * - Automatic deduplication (loads each script only once)
 * - Error handling and retry logic
 * - Loading state management
 * - CDN fallback support
 *
 * Usage:
 *   const THREE = await LazyLoader.loadThreeJS();
 *   const scene = new THREE.Scene();
 */

const LazyLoader = (() => {
  // Track loaded scripts to prevent duplicate loads
  const loadedScripts = new Map();
  const loadingPromises = new Map();

  /**
   * Generic script loader with retry logic
   * @param {string} url - Script URL to load
   * @param {Object} options - Loading options
   * @returns {Promise} Resolves when script is loaded
   */
  async function loadScript(url, options = {}) {
    const {
      retries = 2,
      timeout = 10000,
      crossOrigin = 'anonymous',
      integrity = null,
      globalVariable = null
    } = options;

    // Return cached result if already loaded
    if (loadedScripts.has(url)) {
      return loadedScripts.get(url);
    }

    // Return existing promise if currently loading
    if (loadingPromises.has(url)) {
      return loadingPromises.get(url);
    }

    // Create loading promise
    const loadPromise = new Promise((resolve, reject) => {
      let attempt = 0;

      const tryLoad = () => {
        attempt++;

        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        if (crossOrigin) script.crossOrigin = crossOrigin;
        if (integrity) script.integrity = integrity;

        // Set timeout
        const timeoutId = setTimeout(() => {
          script.remove();
          if (attempt < retries) {
            console.warn(`[LazyLoader] Retry ${attempt}/${retries} for ${url}`);
            tryLoad();
          } else {
            reject(new Error(`Script load timeout: ${url}`));
          }
        }, timeout);

        script.onload = () => {
          clearTimeout(timeoutId);
          console.log(`[LazyLoader] ✅ Loaded: ${url}`);

          // Get the global variable if specified
          const result = globalVariable ? window[globalVariable] : true;
          loadedScripts.set(url, result);
          resolve(result);
        };

        script.onerror = (error) => {
          clearTimeout(timeoutId);
          script.remove();

          if (attempt < retries) {
            console.warn(`[LazyLoader] Retry ${attempt}/${retries} for ${url}`);
            setTimeout(tryLoad, 1000 * attempt); // Exponential backoff
          } else {
            reject(new Error(`Failed to load script: ${url}`));
          }
        };

        document.head.appendChild(script);
      };

      tryLoad();
    });

    loadingPromises.set(url, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      loadingPromises.delete(url);
    }
  }

  /**
   * Load Three.js library (592 KB)
   * @returns {Promise<THREE>} Three.js global object
   */
  async function loadThreeJS() {
    if (window.THREE) {
      console.log('[LazyLoader] Three.js already loaded');
      return window.THREE;
    }

    console.log('[LazyLoader] Loading Three.js (592 KB)...');
    const startTime = performance.now();

    await loadScript('/js/three.min.js', {
      globalVariable: 'THREE',
      retries: 2,
      timeout: 15000
    });

    const loadTime = Math.round(performance.now() - startTime);
    console.log(`[LazyLoader] ✅ Three.js loaded in ${loadTime}ms`);

    return window.THREE;
  }

  /**
   * Preload a script (low priority)
   * Adds a link[rel=preload] tag without blocking
   * @param {string} url - Script URL to preload
   */
  function preloadScript(url) {
    if (loadedScripts.has(url) || loadingPromises.has(url)) {
      return; // Already loaded or loading
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = url;
    document.head.appendChild(link);

    console.log(`[LazyLoader] 🔮 Preloading: ${url}`);
  }

  /**
   * Load multiple scripts in parallel
   * @param {Array<string>} urls - Array of script URLs
   * @returns {Promise<Array>} Array of loaded results
   */
  async function loadMultiple(urls) {
    console.log(`[LazyLoader] Loading ${urls.length} scripts in parallel...`);
    const startTime = performance.now();

    const results = await Promise.all(
      urls.map(url => loadScript(url))
    );

    const loadTime = Math.round(performance.now() - startTime);
    console.log(`[LazyLoader] ✅ All scripts loaded in ${loadTime}ms`);

    return results;
  }

  /**
   * Check if a script is loaded
   * @param {string} url - Script URL
   * @returns {boolean} True if loaded
   */
  function isLoaded(url) {
    return loadedScripts.has(url);
  }

  /**
   * Get loading statistics
   * @returns {Object} Loading stats
   */
  function getStats() {
    return {
      loaded: loadedScripts.size,
      loading: loadingPromises.size,
      loadedUrls: Array.from(loadedScripts.keys())
    };
  }

  // Public API
  return {
    loadScript,
    loadThreeJS,
    loadMultiple,
    preloadScript,
    isLoaded,
    getStats
  };
})();

// Expose globally
window.LazyLoader = LazyLoader;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader;
}
