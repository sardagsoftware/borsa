/**
 * CJK Font Optimizer for Chinese/Japanese/Korean
 * Dynamically loads optimal fonts for CJK languages
 * NO MOCK DATA - Production-ready
 *
 * @version 1.0.0
 * @license Proprietary
 */

// CJK Language Detection
const CJK_LOCALES = ['zh', 'ja', 'ko'];

// Google Fonts CDN for CJK
const CJK_FONTS = {
  'zh': 'Noto+Sans+SC:wght@300;400;500;600;700',  // Simplified Chinese
  'ja': 'Noto+Sans+JP:wght@300;400;500;600;700',  // Japanese
  'ko': 'Noto+Sans+KR:wght@300;400;500;600;700'   // Korean
};

/**
 * Load CJK font for specific locale
 */
function loadCJKFont(locale) {
  // Check if locale is CJK
  if (!CJK_LOCALES.includes(locale)) {
    console.log(`[FontOptimizer] ${locale} is not a CJK language, skipping`);
    return false;
  }

  // Check if font already loaded
  const fontId = `cjk-font-${locale}`;
  if (document.getElementById(fontId)) {
    console.log(`[FontOptimizer] CJK font for ${locale} already loaded`);
    return true;
  }

  // Get font URL
  const fontFamily = CJK_FONTS[locale];
  if (!fontFamily) {
    console.error(`[FontOptimizer] No font defined for ${locale}`);
    return false;
  }

  // Create link element
  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}&display=swap`;

  // Add to document head
  document.head.appendChild(link);

  // Add font-family to body
  const fontFamilyName = fontFamily.split(':')[0].replace(/\+/g, ' ');
  document.body.style.fontFamily = `'${fontFamilyName}', 'Inter', sans-serif`;

  console.log(`[FontOptimizer] Loaded CJK font for ${locale}: ${fontFamilyName}`);
  return true;
}

/**
 * Remove CJK fonts
 */
function removeCJKFonts() {
  CJK_LOCALES.forEach(locale => {
    const fontId = `cjk-font-${locale}`;
    const link = document.getElementById(fontId);
    if (link) {
      link.remove();
      console.log(`[FontOptimizer] Removed CJK font for ${locale}`);
    }
  });

  // Reset body font
  document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
}

/**
 * Initialize font optimizer
 */
function initFontOptimizer() {
  // Load font for current locale if CJK
  if (window.i18n && CJK_LOCALES.includes(window.i18n.currentLocale)) {
    loadCJKFont(window.i18n.currentLocale);
  }

  // Listen for locale changes
  window.addEventListener('localechange', (e) => {
    const newLocale = e.detail.locale;

    // If switching to CJK, load font
    if (CJK_LOCALES.includes(newLocale)) {
      loadCJKFont(newLocale);
    } else {
      // If switching away from CJK, remove fonts
      removeCJKFonts();
    }
  });

  console.log('[FontOptimizer] Initialized');
}

// Auto-initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFontOptimizer);
} else {
  // Wait for i18n to be ready
  const checkI18n = setInterval(() => {
    if (window.i18n) {
      clearInterval(checkI18n);
      initFontOptimizer();
    }
  }, 100);

  // Timeout after 5 seconds
  setTimeout(() => clearInterval(checkI18n), 5000);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadCJKFont, removeCJKFonts };
}
