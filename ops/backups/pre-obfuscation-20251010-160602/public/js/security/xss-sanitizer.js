/**
 * XSS PROTECTION - CLIENT-SIDE SANITIZATION
 * Helper functions to safely handle user-generated content
 * SECURITY FIX: XSS-INNERHTML-2025
 */

/**
 * Sanitize HTML content (remove dangerous tags and attributes)
 * USE THIS instead of innerHTML for user-generated content
 */
function sanitizeHTML(dirty) {
  if (!dirty) return '';

  // Create temporary element
  const temp = document.createElement('div');
  temp.textContent = dirty; // This escapes all HTML

  return temp.innerHTML; // Returns escaped HTML
}

/**
 * Safe alternative to element.innerHTML = userContent
 * Automatically sanitizes content
 */
function setHTMLSafely(element, content) {
  if (!element) return;

  // For simple text content (recommended for user input)
  element.textContent = content;
}

/**
 * If you MUST allow some HTML tags (like markdown rendering)
 * Use this function which allows only safe tags
 */
function setSafeHTML(element, content, options = {}) {
  if (!element || !content) return;

  const allowedTags = options.allowedTags || [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br',
    'ul', 'ol', 'li', 'code', 'pre', 'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ];

  const allowedAttributes = options.allowedAttributes || {
    'a': ['href', 'title', 'target'],
    '*': ['class']
  };

  // Create temporary container
  const temp = document.createElement('div');
  temp.innerHTML = content;

  // Remove dangerous elements
  const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'];
  dangerousTags.forEach(tag => {
    const elements = temp.getElementsByTagName(tag);
    while (elements.length > 0) {
      elements[0].remove();
    }
  });

  // Clean attributes
  const allElements = temp.getElementsByTagName('*');
  for (let i = allElements.length - 1; i >= 0; i--) {
    const el = allElements[i];
    const tagName = el.tagName.toLowerCase();

    // Remove disallowed tags
    if (!allowedTags.includes(tagName)) {
      el.remove();
      continue;
    }

    // Clean attributes
    const allowedAttrs = [
      ...(allowedAttributes[tagName] || []),
      ...(allowedAttributes['*'] || [])
    ];

    for (let j = el.attributes.length - 1; j >= 0; j--) {
      const attr = el.attributes[j];
      const attrName = attr.name.toLowerCase();

      // Remove event handlers
      if (attrName.startsWith('on')) {
        el.removeAttribute(attrName);
        continue;
      }

      // Remove dangerous protocols
      if (attrName === 'href' || attrName === 'src') {
        const value = attr.value.toLowerCase().trim();
        if (value.startsWith('javascript:') ||
            value.startsWith('data:') ||
            value.startsWith('vbscript:')) {
          el.removeAttribute(attrName);
          continue;
        }
      }

      // Remove disallowed attributes
      if (!allowedAttrs.includes(attrName)) {
        el.removeAttribute(attrName);
      }
    }
  }

  // Set cleaned HTML
  element.innerHTML = temp.innerHTML;
}

/**
 * Escape HTML entities (for displaying user input as-is)
 */
function escapeHTML(text) {
  if (!text) return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return String(text).replace(/[&<>"'/]/g, (s) => map[s]);
}

/**
 * Sanitize URL (for href, src attributes)
 */
function sanitizeURL(url) {
  if (!url) return '';

  // Remove dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:'
  ];

  const urlLower = url.toLowerCase().trim();
  for (const protocol of dangerousProtocols) {
    if (urlLower.startsWith(protocol)) {
      return '#';
    }
  }

  // Only allow http, https, mailto, tel
  if (!/^(https?|mailto|tel):/.test(urlLower) && !urlLower.startsWith('/') && !urlLower.startsWith('#')) {
    return '#';
  }

  return url;
}

/**
 * Safe JSON parse (prevents XSS via JSON)
 */
function safeJSONParse(jsonString, defaultValue = null) {
  try {
    const parsed = JSON.parse(jsonString);

    // Deep sanitize strings in JSON
    const sanitize = (obj) => {
      if (typeof obj === 'string') {
        return escapeHTML(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (typeof obj === 'object' && obj !== null) {
        const sanitized = {};
        for (const key in obj) {
          sanitized[key] = sanitize(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };

    return sanitize(parsed);
  } catch (error) {
    console.warn('Invalid JSON:', error);
    return defaultValue;
  }
}

/**
 * Create safe element with text content
 */
function createSafeElement(tagName, textContent, attributes = {}) {
  const element = document.createElement(tagName);

  // Set text content (safe)
  if (textContent) {
    element.textContent = textContent;
  }

  // Set attributes (sanitized)
  for (const [key, value] of Object.entries(attributes)) {
    if (key.startsWith('on')) {
      console.warn(`Blocked event handler: ${key}`);
      continue;
    }
    if (key === 'href' || key === 'src') {
      element.setAttribute(key, sanitizeURL(value));
    } else {
      element.setAttribute(key, escapeHTML(value));
    }
  }

  return element;
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeHTML,
    setHTMLSafely,
    setSafeHTML,
    escapeHTML,
    sanitizeURL,
    safeJSONParse,
    createSafeElement
  };
}
