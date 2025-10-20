/**
 * SECURITY HELPERS
 * XSS Protection and Input Sanitization
 * White-Hat Security Implementation
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Use this instead of directly setting innerHTML
 *
 * @param {string} dirty - Untrusted HTML string
 * @returns {string} - Sanitized HTML string
 */
function sanitizeHTML(dirty) {
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.textContent = dirty;
  return temp.innerHTML;
}

/**
 * Advanced HTML sanitization with allowed tags
 * Similar to DOMPurify but lightweight
 *
 * @param {string} dirty - Untrusted HTML
 * @param {Object} options - Sanitization options
 * @returns {string} - Sanitized HTML
 */
function sanitizeHTMLAdvanced(dirty, options = {}) {
  const {
    allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    allowedAttributes = { 'a': ['href', 'title'], 'img': ['src', 'alt'] }
  } = options;

  // Create temporary element
  const temp = document.createElement('div');
  temp.innerHTML = dirty;

  // Recursive sanitization
  function sanitizeNode(node) {
    // Text nodes are safe
    if (node.nodeType === Node.TEXT_NODE) {
      return node;
    }

    // Only allow whitelisted tags
    const tagName = node.tagName ? node.tagName.toLowerCase() : '';
    if (!allowedTags.includes(tagName)) {
      // Replace with text content
      return document.createTextNode(node.textContent);
    }

    // Create clean element
    const clean = document.createElement(tagName);

    // Copy allowed attributes only
    if (allowedAttributes[tagName]) {
      Array.from(node.attributes).forEach(attr => {
        if (allowedAttributes[tagName].includes(attr.name)) {
          // Sanitize href to prevent javascript: protocol
          if (attr.name === 'href') {
            const href = attr.value;
            if (href.startsWith('javascript:') || href.startsWith('data:')) {
              return; // Block dangerous URLs
            }
          }
          clean.setAttribute(attr.name, attr.value);
        }
      });
    }

    // Recursively sanitize children
    Array.from(node.childNodes).forEach(child => {
      clean.appendChild(sanitizeNode(child));
    });

    return clean;
  }

  // Sanitize all nodes
  const sanitized = document.createElement('div');
  Array.from(temp.childNodes).forEach(child => {
    sanitized.appendChild(sanitizeNode(child));
  });

  return sanitized.innerHTML;
}

/**
 * Escape HTML entities
 * Use for displaying user input as text
 */
function escapeHTML(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;'
  };
  return String(text).replace(/[&<>"'\/]/g, s => map[s]);
}

/**
 * Strip all HTML tags
 * Most secure option - converts everything to plain text
 */
function stripHTML(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

/**
 * Validate and sanitize URL
 * Prevents javascript:, data:, and other dangerous protocols
 */
function sanitizeURL(url) {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:'];

    if (!allowedProtocols.includes(parsed.protocol)) {
      console.warn('⚠️ Blocked dangerous URL protocol:', parsed.protocol);
      return '';
    }

    return parsed.href;
  } catch (e) {
    console.warn('⚠️ Invalid URL:', url);
    return '';
  }
}

/**
 * Safe innerHTML setter
 * Automatically sanitizes before setting
 */
function setSafeHTML(element, html) {
  if (!element) {
    console.error('❌ Element not found');
    return;
  }

  element.innerHTML = sanitizeHTMLAdvanced(html);
}

/**
 * Safe textContent setter
 * Safest option - no HTML rendering
 */
function setSafeText(element, text) {
  if (!element) {
    console.error('❌ Element not found');
    return;
  }

  element.textContent = text;
}

/**
 * Sanitize JSON data before displaying
 * Recursively sanitizes all string values
 */
function sanitizeJSON(obj) {
  if (typeof obj === 'string') {
    return escapeHTML(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeJSON);
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = sanitizeJSON(obj[key]);
    }
    return sanitized;
  }

  return obj;
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeHTML,
    sanitizeHTMLAdvanced,
    escapeHTML,
    stripHTML,
    sanitizeURL,
    setSafeHTML,
    setSafeText,
    sanitizeJSON
  };
}

/**
 * USAGE EXAMPLES:
 *
 * // WRONG - XSS vulnerable:
 * element.innerHTML = userInput;
 *
 * // CORRECT - Sanitized:
 * setSafeHTML(element, userInput);
 *
 * // MOST SECURE - Text only:
 * setSafeText(element, userInput);
 *
 * // For URLs:
 * linkElement.href = sanitizeURL(userProvidedURL);
 */
