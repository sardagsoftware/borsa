/**
 * XSS Protection Module
 * DOMPurify wrapper for sanitizing user input
 *
 * Usage:
 *   import { sanitizeHTML, sanitizeText } from './xss-protection.js';
 *   element.innerHTML = sanitizeHTML(userInput);
 */

// DOMPurify CDN fallback
const loadDOMPurify = () => {
  return new Promise((resolve, reject) => {
    if (window.DOMPurify) {
      resolve(window.DOMPurify);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.2.7/dist/purify.min.js';
    script.onload = () => {
      if (window.DOMPurify) {
        resolve(window.DOMPurify);
      } else {
        reject(new Error('DOMPurify failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load DOMPurify script'));
    document.head.appendChild(script);
  });
};

// Initialize DOMPurify
let purify;
loadDOMPurify().then(DOMPurify => {
  purify = DOMPurify;
  console.log('✅ XSS Protection Active (DOMPurify loaded)');
}).catch(err => {
  console.error('❌ XSS Protection Failed:', err);
});

/**
 * Sanitize HTML content (allows safe HTML tags)
 * @param {string} dirty - Potentially unsafe HTML
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHTML(dirty) {
  if (!purify) {
    console.warn('⚠️ DOMPurify not loaded yet, using text sanitization');
    return sanitizeText(dirty);
  }

  if (typeof dirty !== 'string') {
    return '';
  }

  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    SAFE_FOR_TEMPLATES: true
  });
}

/**
 * Sanitize text only (strips all HTML)
 * @param {string} dirty - Potentially unsafe text
 * @returns {string} - Plain text only
 */
export function sanitizeText(dirty) {
  if (typeof dirty !== 'string') {
    return '';
  }

  // Remove all HTML tags and decode entities
  const temp = document.createElement('div');
  temp.textContent = dirty;
  return temp.textContent || temp.innerText || '';
}

/**
 * Sanitize URL (prevents javascript: and data: URLs)
 * @param {string} url - Potentially unsafe URL
 * @returns {string} - Safe URL or empty string
 */
export function sanitizeURL(url) {
  if (typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('vbscript:') ||
      trimmed.startsWith('file:')) {
    console.warn('⚠️ Blocked dangerous URL:', url);
    return '';
  }

  // Only allow http, https, mailto, tel
  if (!trimmed.match(/^(https?|mailto|tel):/)) {
    // Relative URLs are ok
    if (!trimmed.startsWith('/') && !trimmed.startsWith('#')) {
      console.warn('⚠️ Blocked suspicious URL:', url);
      return '';
    }
  }

  return url;
}

/**
 * Safe innerHTML setter
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML content to set
 */
export function safeSetInnerHTML(element, html) {
  if (!element || !(element instanceof HTMLElement)) {
    console.error('❌ Invalid element provided to safeSetInnerHTML');
    return;
  }

  element.innerHTML = sanitizeHTML(html);
}

/**
 * Safe textContent setter (no HTML allowed)
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text content to set
 */
export function safeSetTextContent(element, text) {
  if (!element || !(element instanceof HTMLElement)) {
    console.error('❌ Invalid element provided to safeSetTextContent');
    return;
  }

  element.textContent = sanitizeText(text);
}

/**
 * Create safe element with sanitized content
 * @param {string} tagName - HTML tag name
 * @param {object} options - Element options
 * @returns {HTMLElement} - Safe element
 */
export function createSafeElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  if (options.text) {
    element.textContent = sanitizeText(options.text);
  }

  if (options.html) {
    element.innerHTML = sanitizeHTML(options.html);
  }

  if (options.className) {
    element.className = sanitizeText(options.className);
  }

  if (options.id) {
    element.id = sanitizeText(options.id);
  }

  if (options.href) {
    element.href = sanitizeURL(options.href);
  }

  if (options.src) {
    element.src = sanitizeURL(options.src);
  }

  return element;
}

// Export for global usage (backward compatibility)
if (typeof window !== 'undefined') {
  window.XSSProtection = {
    sanitizeHTML,
    sanitizeText,
    sanitizeURL,
    safeSetInnerHTML,
    safeSetTextContent,
    createSafeElement
  };
}

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeURL,
  safeSetInnerHTML,
  safeSetTextContent,
  createSafeElement
};
