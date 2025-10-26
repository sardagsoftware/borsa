/**
 * XSS Shield - Global XSS Protection
 * 🔐 Security: P0-5 Fix - 2025-10-26
 *
 * Provides global DOMPurify-based XSS protection
 * Auto-loads DOMPurify and provides safe HTML utilities
 *
 * Usage:
 *   <script src="/js/security/xss-shield.js"></script>
 *
 *   // Sanitize HTML before insertion
 *   element.innerHTML = XSSShield.sanitize(userInput);
 *
 *   // Safe text insertion (recommended)
 *   XSSShield.setText(element, userInput);
 *
 *   // Safe HTML insertion with custom config
 *   XSSShield.setHTML(element, htmlString, { ALLOWED_TAGS: ['b', 'i'] });
 */

(function(window) {
  'use strict';

  // XSS Shield namespace
  const XSSShield = {
    version: '1.0.0',
    initialized: false,
    dompurifyLoaded: false
  };

  /**
   * Default DOMPurify configuration
   */
  const DEFAULT_CONFIG = {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 's', 'strike',
      'p', 'br', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'class', 'id', 'style',
      'src', 'alt', 'width', 'height',
      'data-*'
    ],
    ALLOW_DATA_ATTR: true,
    SAFE_FOR_TEMPLATES: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    RETURN_TRUSTED_TYPE: false,
    FORCE_BODY: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    IN_PLACE: false
  };

  /**
   * Strict configuration for user-generated content
   */
  const STRICT_CONFIG = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'a'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_TEMPLATES: false
  };

  /**
   * Load DOMPurify from CDN
   */
  function loadDOMPurify() {
    return new Promise((resolve, reject) => {
      if (window.DOMPurify) {
        XSSShield.dompurifyLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js';
      script.integrity = 'sha384-rOddNDR72oPxXDaTIzNaRjPNO0pQSe7DvYCU+1qEKpvLEd8H5QDXJ6GsqoVt4/qH';
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        XSSShield.dompurifyLoaded = true;
        console.info('✅ XSS Shield: DOMPurify loaded successfully');
        resolve();
      };

      script.onerror = (error) => {
        console.error('❌ XSS Shield: Failed to load DOMPurify', error);
        reject(new Error('Failed to load DOMPurify'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Initialize XSS Shield
   */
  XSSShield.init = async function() {
    if (this.initialized) {
      return;
    }

    try {
      await loadDOMPurify();
      this.initialized = true;
      console.info('✅ XSS Shield initialized');

      // Add CSP violation reporter
      if (window.addEventListener) {
        window.addEventListener('securitypolicyviolation', (e) => {
          console.warn('🔐 CSP Violation:', {
            blockedURI: e.blockedURI,
            violatedDirective: e.violatedDirective,
            originalPolicy: e.originalPolicy
          });

          // Send to monitoring service if available
          if (window.reportCSPViolation) {
            window.reportCSPViolation(e);
          }
        });
      }

    } catch (error) {
      console.error('❌ XSS Shield initialization failed:', error);
      throw error;
    }
  };

  /**
   * Sanitize HTML string
   * @param {string} dirty - Untrusted HTML
   * @param {object} config - Optional DOMPurify config
   * @returns {string} - Safe HTML
   */
  XSSShield.sanitize = function(dirty, config = {}) {
    if (!this.dompurifyLoaded) {
      console.error('❌ XSS Shield: DOMPurify not loaded yet');
      // Fallback: return text content only (no HTML)
      const div = document.createElement('div');
      div.textContent = dirty;
      return div.innerHTML;
    }

    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    return window.DOMPurify.sanitize(dirty, finalConfig);
  };

  /**
   * Sanitize with strict config (user content)
   */
  XSSShield.sanitizeStrict = function(dirty) {
    return this.sanitize(dirty, STRICT_CONFIG);
  };

  /**
   * Safely set text content (no HTML parsing)
   * @param {HTMLElement} element
   * @param {string} text
   */
  XSSShield.setText = function(element, text) {
    if (!element) {
      console.error('❌ XSS Shield: Invalid element');
      return;
    }
    element.textContent = text;
  };

  /**
   * Safely set HTML content (with sanitization)
   * @param {HTMLElement} element
   * @param {string} html
   * @param {object} config
   */
  XSSShield.setHTML = function(element, html, config = {}) {
    if (!element) {
      console.error('❌ XSS Shield: Invalid element');
      return;
    }
    element.innerHTML = this.sanitize(html, config);
  };

  /**
   * Safely set attribute
   * @param {HTMLElement} element
   * @param {string} name
   * @param {string} value
   */
  XSSShield.setAttribute = function(element, name, value) {
    if (!element) {
      console.error('❌ XSS Shield: Invalid element');
      return;
    }

    // Block dangerous attributes
    const dangerous = ['onclick', 'onerror', 'onload', 'onmouseover'];
    if (dangerous.includes(name.toLowerCase())) {
      console.warn(`🔐 XSS Shield: Blocked dangerous attribute: ${name}`);
      return;
    }

    // Block javascript: protocol in href/src
    if ((name === 'href' || name === 'src') && value.toLowerCase().startsWith('javascript:')) {
      console.warn(`🔐 XSS Shield: Blocked javascript: protocol in ${name}`);
      return;
    }

    element.setAttribute(name, value);
  };

  /**
   * Create safe HTML element from template
   * @param {string} html - HTML template
   * @param {object} config - DOMPurify config
   * @returns {HTMLElement}
   */
  XSSShield.createSafeElement = function(html, config = {}) {
    const clean = this.sanitize(html, config);
    const template = document.createElement('template');
    template.innerHTML = clean;
    return template.content.firstElementChild;
  };

  /**
   * Escape HTML special characters
   * @param {string} str
   * @returns {string}
   */
  XSSShield.escapeHTML = function(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  /**
   * Check if string contains potential XSS
   * @param {string} str
   * @returns {boolean}
   */
  XSSShield.detectXSS = function(str) {
    if (typeof str !== 'string') return false;

    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,  // Event handlers
      /<iframe/i,
      /<embed/i,
      /<object/i,
      /data:text\/html/i,
      /vbscript:/i
    ];

    return xssPatterns.some(pattern => pattern.test(str));
  };

  /**
   * Report XSS attempt
   * @param {string} payload - Suspicious content
   * @param {string} location - Where it was detected
   */
  XSSShield.reportXSSAttempt = function(payload, location) {
    console.warn('🔐 XSS Attempt Detected:', {
      location,
      payload: payload.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });

    // Send to security monitoring if available
    if (window.sendSecurityAlert) {
      window.sendSecurityAlert({
        type: 'XSS_ATTEMPT',
        location,
        payload,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => XSSShield.init());
  } else {
    XSSShield.init();
  }

  // Export to global scope
  window.XSSShield = XSSShield;

  // Legacy compatibility - maintain sanitize() global function
  window.sanitize = function(html, config) {
    return XSSShield.sanitize(html, config);
  };

  console.info('🔐 XSS Shield v' + XSSShield.version + ' loaded');

})(window);
