/**
 * CSRF Token Management
 * Fetches and automatically includes CSRF tokens in all forms and AJAX requests
 */

(function() {
  'use strict';

  let csrfToken = null;

  /**
   * Fetch CSRF token from server
   */
  async function fetchCSRFToken() {
    try {
      const response = await fetch('/api/csrf-token', {
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      csrfToken = data.csrfToken;

      console.log('✅ CSRF token fetched');
      return csrfToken;
    } catch (error) {
      console.error('❌ CSRF token fetch failed:', error);
      return null;
    }
  }

  /**
   * Get current CSRF token (fetch if not available)
   */
  async function getCSRFToken() {
    if (!csrfToken) {
      await fetchCSRFToken();
    }
    return csrfToken;
  }

  /**
   * Add CSRF token to all forms
   */
  function injectCSRFTokenToForms() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      // Skip if already has CSRF token
      if (form.querySelector('input[name="_csrf"]')) {
        return;
      }

      // Create hidden input for CSRF token
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = '_csrf';
      input.value = csrfToken || '';

      form.appendChild(input);
    });
  }

  /**
   * Override fetch to include CSRF token
   */
  const originalFetch = window.fetch;

  window.fetch = async function(url, options = {}) {
    // Only add CSRF token to same-origin requests
    const isSameOrigin = !url.startsWith('http') || url.startsWith(window.location.origin);

    // Only add to POST, PUT, DELETE, PATCH
    const method = (options.method || 'GET').toUpperCase();
    const needsCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    if (isSameOrigin && needsCSRF) {
      const token = await getCSRFToken();

      if (token) {
        // Add CSRF token to headers
        options.headers = {
          ...options.headers,
          'CSRF-Token': token
        };
      }
    }

    return originalFetch(url, options);
  };

  /**
   * Override XMLHttpRequest to include CSRF token
   */
  const originalXHROpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._method = method.toUpperCase();
    this._url = url;

    return originalXHROpen.call(this, method, url, ...rest);
  };

  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.send = async function(...args) {
    const needsCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(this._method);
    const isSameOrigin = !this._url.startsWith('http') || this._url.startsWith(window.location.origin);

    if (needsCSRF && isSameOrigin) {
      const token = await getCSRFToken();

      if (token) {
        this.setRequestHeader('CSRF-Token', token);
      }
    }

    return originalXHRSend.apply(this, args);
  };

  /**
   * Initialize on page load
   */
  async function init() {
    console.log('🔒 CSRF Protection initializing...');

    // Fetch token
    await fetchCSRFToken();

    // Inject to existing forms
    if (csrfToken) {
      injectCSRFTokenToForms();
    }

    // Watch for dynamically added forms
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'FORM') {
            injectCSRFTokenToForms();
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('✅ CSRF Protection active');
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose to window for manual use
  window.CSRF = {
    getToken: getCSRFToken,
    refreshToken: fetchCSRFToken
  };
})();
