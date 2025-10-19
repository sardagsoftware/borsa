/**
 * hreflang Generator for Multilingual SEO
 * Dynamically generates hreflang tags for all supported locales
 * CRITICAL for Google multilingual SEO
 *
 * @version 1.0.0
 * @license Proprietary
 */

const SUPPORTED_LOCALES = ['tr', 'en', 'de', 'ar', 'ru', 'zh'];
const BASE_URL = 'https://www.ailydian.com';

/**
 * Generate hreflang tags for current page
 */
function generateHreflangTags() {
  // Get current path
  const currentPath = window.location.pathname;

  // Remove existing hreflang tags (if any)
  const existingTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
  existingTags.forEach(tag => tag.remove());

  // Generate hreflang tags for each locale
  SUPPORTED_LOCALES.forEach(locale => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = locale;

    // Generate URL for this locale
    // If current path already has locale, replace it
    let localizedPath = currentPath;
    const pathParts = currentPath.split('/').filter(Boolean);

    if (SUPPORTED_LOCALES.includes(pathParts[0])) {
      // Replace existing locale
      pathParts[0] = locale;
      localizedPath = '/' + pathParts.join('/');
    } else {
      // Add locale prefix
      localizedPath = `/${locale}${currentPath}`;
    }

    link.href = `${BASE_URL}${localizedPath}`;
    document.head.appendChild(link);
  });

  // Add x-default hreflang (points to English)
  const xDefaultLink = document.createElement('link');
  xDefaultLink.rel = 'alternate';
  xDefaultLink.hreflang = 'x-default';

  let defaultPath = currentPath;
  const pathParts = currentPath.split('/').filter(Boolean);
  if (SUPPORTED_LOCALES.includes(pathParts[0])) {
    pathParts[0] = 'en';
    defaultPath = '/' + pathParts.join('/');
  } else {
    defaultPath = `/en${currentPath}`;
  }

  xDefaultLink.href = `${BASE_URL}${defaultPath}`;
  document.head.appendChild(xDefaultLink);

  console.log('[hreflang] Generated tags for', SUPPORTED_LOCALES.length, 'locales');
}

/**
 * Update canonical tag for current locale
 */
function updateCanonicalTag() {
  const currentLocale = window.i18n ? window.i18n.currentLocale : 'en';
  const currentPath = window.location.pathname;

  // Remove existing canonical
  const existingCanonical = document.querySelector('link[rel="canonical"]');
  if (existingCanonical) {
    existingCanonical.remove();
  }

  // Create new canonical
  const canonical = document.createElement('link');
  canonical.rel = 'canonical';

  // Generate canonical URL for current locale
  let canonicalPath = currentPath;
  const pathParts = currentPath.split('/').filter(Boolean);

  if (!SUPPORTED_LOCALES.includes(pathParts[0])) {
    // Add current locale prefix if not present
    canonicalPath = `/${currentLocale}${currentPath}`;
  }

  canonical.href = `${BASE_URL}${canonicalPath}`;
  document.head.appendChild(canonical);

  console.log('[hreflang] Updated canonical:', canonical.href);
}

/**
 * Initialize hreflang tags
 */
function initHreflang() {
  // Generate hreflang tags
  generateHreflangTags();

  // Update canonical
  updateCanonicalTag();

  // Re-generate on locale change
  if (window.i18n) {
    window.addEventListener('localechange', () => {
      generateHreflangTags();
      updateCanonicalTag();
    });
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHreflang);
} else {
  initHreflang();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateHreflangTags, updateCanonicalTag };
}
