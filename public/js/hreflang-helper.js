/**
 * hreflang Helper - SEO Multi-language Support
 * Beyaz Şapkalı (White-Hat) SEO Implementation
 *
 * Purpose: Generate hreflang tags for international SEO
 * Reference: https://developers.google.com/search/docs/specialty/international/localized-versions
 */

const SUPPORTED_LANGUAGES = [
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', region: 'TR' },
  { code: 'en', name: 'English', nativeName: 'English', region: 'US' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'DE' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'SA', rtl: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'RU' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', region: 'CN' }
];

const BASE_URL = 'https://www.ailydian.com';

/**
 * Generate hreflang tags for a given path
 * @param {string} currentPath - Current page path (e.g., "/products")
 * @param {string} currentLang - Current language code (e.g., "tr")
 * @returns {string} HTML string with hreflang link tags
 */
function generateHreflangTags(currentPath = '', currentLang = 'en') {
  const cleanPath = currentPath.replace(/^\//, ''); // Remove leading slash

  let hreflangHTML = '';

  // Generate hreflang for each supported language
  SUPPORTED_LANGUAGES.forEach(lang => {
    const url = `${BASE_URL}/${lang.code}${cleanPath ? '/' + cleanPath : ''}`;
    hreflangHTML += `<link rel="alternate" hreflang="${lang.code}" href="${url}" />\n`;
  });

  // Add x-default (fallback for unknown languages)
  const defaultUrl = `${BASE_URL}/en${cleanPath ? '/' + cleanPath : ''}`;
  hreflangHTML += `<link rel="alternate" hreflang="x-default" href="${defaultUrl}" />\n`;

  return hreflangHTML;
}

/**
 * Inject hreflang tags into document head
 * Call this function on page load
 */
function injectHreflangTags() {
  // Detect current language from URL or browser
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const currentLang = pathParts[0] || detectBrowserLanguage();
  const currentPath = pathParts.slice(1).join('/');

  // Generate and inject tags
  const hreflangHTML = generateHreflangTags(currentPath, currentLang);
  document.head.insertAdjacentHTML('beforeend', hreflangHTML);

  console.log('[SEO] hreflang tags injected for path:', currentPath, 'language:', currentLang);
}

/**
 * Detect browser language preference
 * @returns {string} Language code
 */
function detectBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  const langCode = browserLang.split('-')[0].toLowerCase();

  // Check if detected language is supported
  const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === langCode);
  return isSupported ? langCode : 'en';
}

/**
 * Get language display name
 * @param {string} code - Language code
 * @returns {object} Language info
 */
function getLanguageInfo(code) {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[1]; // Default to English
}

/**
 * Create language switcher HTML
 * @returns {string} HTML for language switcher
 */
function createLanguageSwitcher() {
  const currentPath = window.location.pathname.split('/').slice(2).join('/'); // Remove /lang/ prefix
  const currentLang = window.location.pathname.split('/')[1] || 'en';

  let switcherHTML = '<div class="language-switcher">';
  switcherHTML += '<select id="lang-selector" class="lang-select" aria-label="Select Language">';

  SUPPORTED_LANGUAGES.forEach(lang => {
    const selected = lang.code === currentLang ? 'selected' : '';
    const url = `/${lang.code}${currentPath ? '/' + currentPath : ''}`;
    switcherHTML += `<option value="${url}" ${selected}>${lang.nativeName}</option>`;
  });

  switcherHTML += '</select>';
  switcherHTML += '</div>';

  // Add event listener to handle language change
  setTimeout(() => {
    const selector = document.getElementById('lang-selector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        window.location.href = e.target.value;
      });
    }
  }, 100);

  return switcherHTML;
}

/**
 * SEO-friendly canonical URL
 * @returns {string} Canonical URL
 */
function getCanonicalUrl() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const currentLang = pathParts[0] || 'en';
  const currentPath = pathParts.slice(1).join('/');

  return `${BASE_URL}/${currentLang}${currentPath ? '/' + currentPath : ''}`;
}

/**
 * Inject canonical tag
 */
function injectCanonicalTag() {
  const canonicalUrl = getCanonicalUrl();
  const existingCanonical = document.querySelector('link[rel="canonical"]');

  if (existingCanonical) {
    existingCanonical.href = canonicalUrl;
  } else {
    const canonicalTag = document.createElement('link');
    canonicalTag.rel = 'canonical';
    canonicalTag.href = canonicalUrl;
    document.head.appendChild(canonicalTag);
  }

  console.log('[SEO] Canonical URL set:', canonicalUrl);
}

/**
 * Load translations from JSON
 * @param {string} lang - Language code
 * @returns {Promise<object>} Translation data
 */
async function loadTranslations(lang) {
  try {
    const response = await fetch(`/locales/${lang}/common.json`);
    if (!response.ok) {
      console.warn(`[i18n] Translation not found for ${lang}, falling back to English`);
      const fallbackResponse = await fetch('/locales/en/common.json');
      return await fallbackResponse.json();
    }
    return await response.json();
  } catch (error) {
    console.error('[i18n] Error loading translations:', error);
    return {};
  }
}

/**
 * Initialize SEO and i18n on page load
 */
function initSEO() {
  injectHreflangTags();
  injectCanonicalTag();
  console.log('[SEO] Multi-language SEO initialized ✅');
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSEO);
  } else {
    initSEO();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateHreflangTags,
    injectHreflangTags,
    detectBrowserLanguage,
    getLanguageInfo,
    createLanguageSwitcher,
    loadTranslations,
    initSEO,
    SUPPORTED_LANGUAGES
  };
}
