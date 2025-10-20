/**
 * 🛡️ AILYDIAN XSS PROTECTION - DOMPurify Global Helper
 *
 * SECURITY: This module provides centralized XSS protection using DOMPurify
 * for all client-side HTML sanitization across the Ailydian platform.
 *
 * White-Hat Compliance: ✅ Defensive security only
 *
 * @version 1.0.0
 * @date 2025-10-17
 */

(function(window) {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================

  /**
   * DOMPurify configuration presets for different use cases
   */
  const CONFIG_PRESETS = {
    // Strict: Only basic text formatting (default)
    STRICT: {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span'],
      ALLOWED_ATTR: ['class'],
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false
    },

    // Standard: Common HTML elements for content
    STANDARD: {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'code', 'pre'],
      ALLOWED_ATTR: ['class', 'id', 'href', 'src', 'alt', 'title', 'style'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false
    },

    // Rich: Full HTML support for rich content (medical reports, legal docs)
    RICH: {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'code', 'pre', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'small', 'mark', 'del', 'ins', 'sub', 'sup'],
      ALLOWED_ATTR: ['class', 'id', 'href', 'src', 'alt', 'title', 'style', 'colspan', 'rowspan', 'target', 'rel'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false,
      ADD_ATTR: ['target', 'rel']
    },

    // SVG: For SVG content (charts, diagrams)
    SVG: {
      USE_PROFILES: { svg: true, svgFilters: true },
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false
    },

    // None: Strip all HTML (text only)
    NONE: {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false
    }
  };

  // ==========================================
  // CORE SANITIZATION FUNCTIONS
  // ==========================================

  /**
   * Sanitize HTML content using DOMPurify
   *
   * @param {string} dirty - Untrusted HTML string
   * @param {string} preset - Configuration preset ('STRICT', 'STANDARD', 'RICH', 'SVG', 'NONE')
   * @param {object} customConfig - Optional custom DOMPurify configuration
   * @returns {string} Sanitized HTML string
   *
   * @example
   * const clean = sanitizeHTML('<script>alert("XSS")</script><p>Hello</p>');
   * // Returns: '<p>Hello</p>'
   */
  function sanitizeHTML(dirty, preset = 'STANDARD', customConfig = {}) {
    if (!dirty || typeof dirty !== 'string') {
      return '';
    }

    // Check if DOMPurify is loaded
    if (typeof DOMPurify === 'undefined') {
      console.error('❌ DOMPurify not loaded! Falling back to text-only mode.');
      return sanitizeText(dirty);
    }

    try {
      const config = { ...CONFIG_PRESETS[preset], ...customConfig };
      return DOMPurify.sanitize(dirty, config);
    } catch (error) {
      console.error('❌ Sanitization failed:', error);
      return sanitizeText(dirty); // Fallback to text-only
    }
  }

  /**
   * Sanitize text content (removes all HTML)
   *
   * @param {string} dirty - Untrusted text string
   * @returns {string} Plain text (HTML entities encoded)
   *
   * @example
   * const clean = sanitizeText('<script>alert("XSS")</script>');
   * // Returns: '&lt;script&gt;alert("XSS")&lt;/script&gt;'
   */
  function sanitizeText(dirty) {
    if (!dirty || typeof dirty !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = dirty;
    return div.innerHTML;
  }

  /**
   * Safely set innerHTML with sanitization
   *
   * @param {HTMLElement} element - Target DOM element
   * @param {string} html - HTML content to set
   * @param {string} preset - Configuration preset
   * @returns {boolean} Success status
   *
   * @example
   * const success = safeSetInnerHTML(container, userContent, 'STANDARD');
   */
  function safeSetInnerHTML(element, html, preset = 'STANDARD') {
    if (!element || !(element instanceof HTMLElement)) {
      console.error('❌ Invalid element provided to safeSetInnerHTML');
      return false;
    }

    try {
      const sanitized = sanitizeHTML(html, preset);
      element.innerHTML = sanitized;
      return true;
    } catch (error) {
      console.error('❌ safeSetInnerHTML failed:', error);
      element.textContent = sanitizeText(html); // Fallback
      return false;
    }
  }

  /**
   * Safely append HTML with sanitization
   *
   * @param {HTMLElement} element - Target DOM element
   * @param {string} html - HTML content to append
   * @param {string} preset - Configuration preset
   * @returns {boolean} Success status
   */
  function safeAppendHTML(element, html, preset = 'STANDARD') {
    if (!element || !(element instanceof HTMLElement)) {
      console.error('❌ Invalid element provided to safeAppendHTML');
      return false;
    }

    try {
      const sanitized = sanitizeHTML(html, preset);
      const temp = document.createElement('div');
      temp.innerHTML = sanitized;

      while (temp.firstChild) {
        element.appendChild(temp.firstChild);
      }
      return true;
    } catch (error) {
      console.error('❌ safeAppendHTML failed:', error);
      return false;
    }
  }

  /**
   * Sanitize URL to prevent javascript: and data: injection
   *
   * @param {string} url - Untrusted URL
   * @returns {string} Sanitized URL or empty string if dangerous
   *
   * @example
   * const safe = sanitizeURL('javascript:alert(1)'); // Returns: ''
   * const safe2 = sanitizeURL('https://example.com'); // Returns: 'https://example.com'
   */
  function sanitizeURL(url) {
    if (!url || typeof url !== 'string') {
      return '';
    }

    // Remove leading/trailing whitespace
    url = url.trim();

    // Block dangerous protocols
    const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
    if (dangerousProtocols.test(url)) {
      console.warn('⚠️ Blocked dangerous URL protocol:', url);
      return '';
    }

    // Allow safe protocols
    const safeProtocols = /^(https?|mailto|tel|sms):/i;
    if (safeProtocols.test(url)) {
      return url;
    }

    // Relative URLs are safe
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }

    // Fragment identifiers are safe
    if (url.startsWith('#')) {
      return url;
    }

    // Default: assume https for protocol-less URLs
    if (!url.includes(':')) {
      return url; // Relative URL
    }

    console.warn('⚠️ URL protocol not recognized:', url);
    return '';
  }

  /**
   * Sanitize CSS to prevent style-based XSS
   *
   * @param {string} css - Untrusted CSS
   * @returns {string} Sanitized CSS
   */
  function sanitizeCSS(css) {
    if (!css || typeof css !== 'string') {
      return '';
    }

    // Remove dangerous CSS properties
    const dangerous = /(expression|javascript|behavior|binding|import|@import)/gi;
    return css.replace(dangerous, '');
  }

  // ==========================================
  // VALIDATION HELPERS
  // ==========================================

  /**
   * Check if string contains potential XSS
   *
   * @param {string} input - String to check
   * @returns {boolean} True if potentially dangerous
   */
  function containsXSS(input) {
    if (!input || typeof input !== 'string') {
      return false;
    }

    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /onclick=/i,
      /onmouseover=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\(/i,
      /alert\(/i
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Log sanitization event (for security monitoring)
   *
   * @param {string} type - Event type
   * @param {string} input - Original input
   * @param {string} output - Sanitized output
   */
  function logSanitization(type, input, output) {
    if (window.AILYDIAN_DEBUG === true) {
      console.log(`🛡️ Sanitized ${type}:`, {
        original: input.substring(0, 100),
        sanitized: output.substring(0, 100),
        removed: input.length - output.length
      });
    }
  }

  // ==========================================
  // GLOBAL API EXPORT
  // ==========================================

  window.AilydianSanitizer = {
    // Core functions
    sanitizeHTML,
    sanitizeText,
    sanitizeURL,
    sanitizeCSS,

    // DOM manipulation
    safeSetInnerHTML,
    safeAppendHTML,

    // Validation
    containsXSS,

    // Configuration
    CONFIG_PRESETS,

    // Version
    version: '1.0.0'
  };

  // Legacy aliases for backward compatibility
  window.sanitize = sanitizeHTML;
  window.sanitizeHTML = sanitizeHTML;
  window.sanitizeText = sanitizeText;

  console.log('✅ Ailydian Sanitizer v1.0.0 loaded');

})(window);
