/**
 * 🛡️ DOMPURIFY CDN LOADER
 *
 * Loads DOMPurify from CDN with fallback mechanism
 *
 * @version 1.0.0
 */

(function() {
  'use strict';

  // Skip if already loaded
  if (typeof DOMPurify !== 'undefined') {
    console.log('✅ DOMPurify already loaded');
    return;
  }

  // CDN URLs (primary + fallback)
  const CDN_URLS = [
    'https://cdn.jsdelivr.net/npm/dompurify@3.3.0/dist/purify.min.js',
    'https://unpkg.com/dompurify@3.3.0/dist/purify.min.js'
  ];

  let currentIndex = 0;

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;

      script.onload = () => {
        console.log('✅ DOMPurify loaded from:', url);
        resolve();
      };

      script.onerror = () => {
        console.warn('⚠️ Failed to load DOMPurify from:', url);
        reject(new Error(`Failed to load: ${url}`));
      };

      document.head.appendChild(script);
    });
  }

  async function loadWithFallback() {
    while (currentIndex < CDN_URLS.length) {
      try {
        await loadScript(CDN_URLS[currentIndex]);
        return; // Success
      } catch (error) {
        currentIndex++;
      }
    }

    // All CDNs failed
    console.error('❌ All DOMPurify CDN sources failed. XSS protection disabled!');
  }

  // Start loading
  loadWithFallback();
})();
