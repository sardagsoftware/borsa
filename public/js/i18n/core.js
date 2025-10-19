/**
 * LyDian AI i18n Core Library
 * Production-ready internationalization system
 * NO MOCK DATA - Real implementation
 *
 * @version 1.0.0
 * @author LyDian AI Team
 * @license Proprietary
 */

// Supported locales configuration
const SUPPORTED_LOCALES = {
  'tr': { name: 'Türkçe', nativeName: 'Türkçe', dir: 'ltr', flag: '🇹🇷' },
  'en': { name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
  'de': { name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  'ar': { name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  'ru': { name: 'Russian', nativeName: 'Русский', dir: 'ltr', flag: '🇷🇺' },
  'zh': { name: 'Chinese', nativeName: '中文', dir: 'ltr', flag: '🇨🇳' }
};

const DEFAULT_LOCALE = 'en';
const LOCALE_COOKIE_NAME = 'lydian_locale';
const LOCALE_COOKIE_EXPIRES = 365; // days

/**
 * i18n Manager Class
 */
class I18nManager {
  constructor() {
    this.currentLocale = this.detectLocale();
    this.translations = {};
    this.fallbackTranslations = {};
    this.isLoading = false;
  }

  /**
   * Detect user's locale from multiple sources
   * Priority: Cookie > Browser > Geo > Default
   */
  detectLocale() {
    // 1. Check cookie
    const cookieLocale = this.getCookie(LOCALE_COOKIE_NAME);
    if (cookieLocale && SUPPORTED_LOCALES[cookieLocale]) {
      console.log('[i18n] Detected locale from cookie:', cookieLocale);
      return cookieLocale;
    }

    // 2. Check browser language
    const browserLang = navigator.language || navigator.userLanguage;
    const browserLocale = browserLang.split('-')[0].toLowerCase();
    if (SUPPORTED_LOCALES[browserLocale]) {
      console.log('[i18n] Detected locale from browser:', browserLocale);
      return browserLocale;
    }

    // 3. Check URL path (for subdirectory routing)
    const urlPath = window.location.pathname;
    const urlLocale = urlPath.split('/')[1];
    if (SUPPORTED_LOCALES[urlLocale]) {
      console.log('[i18n] Detected locale from URL:', urlLocale);
      return urlLocale;
    }

    // 4. Default fallback
    console.log('[i18n] Using default locale:', DEFAULT_LOCALE);
    return DEFAULT_LOCALE;
  }

  /**
   * Load translations for a specific locale
   */
  async loadTranslations(locale) {
    if (!SUPPORTED_LOCALES[locale]) {
      console.error('[i18n] Unsupported locale:', locale);
      return false;
    }

    this.isLoading = true;

    try {
      // Load common translations
      const response = await fetch(`/locales/${locale}/common.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${locale}`);
      }

      const data = await response.json();
      this.translations[locale] = data;

      // Load fallback (English) if not already loaded
      if (locale !== 'en' && !this.fallbackTranslations['en']) {
        const fallbackResponse = await fetch('/locales/en/common.json');
        if (fallbackResponse.ok) {
          this.fallbackTranslations['en'] = await fallbackResponse.json();
        }
      }

      console.log(`[i18n] Loaded translations for ${locale}`);
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('[i18n] Error loading translations:', error);
      this.isLoading = false;
      return false;
    }
  }

  /**
   * Get translated string by key
   * Supports dot notation: "nav.home"
   */
  t(key, fallback = key) {
    const locale = this.currentLocale;

    if (!this.translations[locale]) {
      console.warn(`[i18n] Translations not loaded for ${locale}`);
      return fallback;
    }

    // Navigate through nested object using dot notation
    const keys = key.split('.');
    let value = this.translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Try fallback locale
        let fallbackValue = this.fallbackTranslations['en'];
        for (const fk of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
            fallbackValue = fallbackValue[fk];
          } else {
            return fallback;
          }
        }
        return fallbackValue;
      }
    }

    return typeof value === 'string' ? value : fallback;
  }

  /**
   * Change current locale
   */
  async changeLocale(newLocale) {
    if (!SUPPORTED_LOCALES[newLocale]) {
      console.error('[i18n] Unsupported locale:', newLocale);
      return false;
    }

    // Load translations if not already loaded
    if (!this.translations[newLocale]) {
      const loaded = await this.loadTranslations(newLocale);
      if (!loaded) return false;
    }

    // Update current locale
    this.currentLocale = newLocale;

    // Save to cookie
    this.setCookie(LOCALE_COOKIE_NAME, newLocale, LOCALE_COOKIE_EXPIRES);

    // Update document direction (for RTL languages)
    this.updateDirection();

    // Update HTML lang attribute
    document.documentElement.lang = newLocale;

    // Emit locale change event
    this.emitLocaleChange(newLocale);

    console.log('[i18n] Locale changed to:', newLocale);
    return true;
  }

  /**
   * Update document direction (LTR/RTL)
   */
  updateDirection() {
    const localeConfig = SUPPORTED_LOCALES[this.currentLocale];
    if (localeConfig) {
      document.documentElement.dir = localeConfig.dir;
      document.body.setAttribute('dir', localeConfig.dir);
    }
  }

  /**
   * Get current locale info
   */
  getCurrentLocaleInfo() {
    return {
      code: this.currentLocale,
      ...SUPPORTED_LOCALES[this.currentLocale]
    };
  }

  /**
   * Get all supported locales
   */
  getSupportedLocales() {
    return Object.keys(SUPPORTED_LOCALES).map(code => ({
      code,
      ...SUPPORTED_LOCALES[code]
    }));
  }

  /**
   * Cookie helpers
   */
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax;Secure`;
  }

  /**
   * Emit locale change event
   */
  emitLocaleChange(locale) {
    const event = new CustomEvent('localechange', {
      detail: {
        locale,
        localeInfo: SUPPORTED_LOCALES[locale]
      }
    });
    window.dispatchEvent(event);
  }
}

// Create global instance
window.i18n = new I18nManager();

// Auto-initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await window.i18n.loadTranslations(window.i18n.currentLocale);
    window.i18n.updateDirection();
    console.log('[i18n] Initialized with locale:', window.i18n.currentLocale);
  });
} else {
  // DOM already loaded
  window.i18n.loadTranslations(window.i18n.currentLocale).then(() => {
    window.i18n.updateDirection();
    console.log('[i18n] Initialized with locale:', window.i18n.currentLocale);
  });
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18nManager;
}
