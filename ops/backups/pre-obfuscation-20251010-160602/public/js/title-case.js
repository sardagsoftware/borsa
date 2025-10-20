/**
 * Title Case Utility
 * Converts strings to Title Case format (first letter of each word capitalized)
 * Usage: toTitleCase("api keys") -> "Api Keys"
 */

function toTitleCase(str) {
  if (!str) return '';

  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Apply Title Case to all elements with data-title-case attribute
 * Can be called on DOMContentLoaded to normalize all menu items
 */
function applyTitleCaseToElements() {
  const elements = document.querySelectorAll('[data-title-case]');
  elements.forEach(el => {
    el.textContent = toTitleCase(el.textContent);
  });
}

/**
 * Apply Title Case to navigation menus
 * Automatically finds common menu selectors and normalizes them
 */
function normalizMenus() {
  const menuSelectors = [
    'nav a',
    '.menu-item',
    '.nav-link',
    '[role="menuitem"]',
    '[data-testid="menu-item"]'
  ];

  menuSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      // Skip if already processed
      if (el.dataset.titleCaseApplied) return;

      // Apply title case to text content (not HTML)
      const text = el.textContent.trim();
      if (text) {
        el.textContent = toTitleCase(text);
        el.dataset.titleCaseApplied = 'true';
      }
    });
  });
}

// Auto-apply on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    applyTitleCaseToElements();
    normalizeMenus();
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { toTitleCase, applyTitleCaseToElements, normalizeMenus };
}
