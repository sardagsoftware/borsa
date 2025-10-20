/**
 * 🌍 i18n Manager
 * Handles multi-language support for Intent UI
 * Supports: TR, EN, AR with RTL
 */

class I18nManager {
  constructor(options = {}) {
    this.currentLocale = options.defaultLocale || 'tr';
    this.fallbackLocale = options.fallbackLocale || 'en';
    this.translations = {};
    this.rtlLocales = ['ar', 'he', 'fa', 'ur'];
    this.basePath = options.basePath || '/i18n/locales';
    this.loadedLocales = new Set();
    this.onLocaleChangeCallbacks = [];
  }

  /**
   * Load translation file for a locale
   */
  async loadLocale(locale) {
    if (this.loadedLocales.has(locale)) {
      return this.translations[locale];
    }

    try {
      const response = await fetch(`${this.basePath}/${locale}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${locale} translations`);
      }

      const translations = await response.json();
      this.translations[locale] = translations;
      this.loadedLocales.add(locale);

      console.log(`✅ Loaded ${locale} translations`);
      return translations;
    } catch (error) {
      console.error(`❌ Failed to load ${locale}:`, error);

      // Try fallback
      if (locale !== this.fallbackLocale && !this.loadedLocales.has(this.fallbackLocale)) {
        return this.loadLocale(this.fallbackLocale);
      }

      return null;
    }
  }

  /**
   * Set current locale
   */
  async setLocale(locale) {
    await this.loadLocale(locale);
    this.currentLocale = locale;

    // Update HTML dir attribute for RTL
    document.documentElement.dir = this.isRTL(locale) ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;

    // Notify listeners
    this.onLocaleChangeCallbacks.forEach(callback => callback(locale));

    console.log(`🌍 Locale set to: ${locale}`);
  }

  /**
   * Get translation for a key
   * @param {string} key - Dot notation key (e.g., 'ui.composer.placeholder')
   * @param {object} params - Replacement parameters (e.g., {count: 5})
   */
  t(key, params = {}) {
    const translation = this.getNestedValue(this.translations[this.currentLocale], key);

    if (!translation) {
      // Try fallback locale
      const fallbackTranslation = this.getNestedValue(this.translations[this.fallbackLocale], key);
      if (!fallbackTranslation) {
        console.warn(`⚠️ Missing translation: ${key}`);
        return key;
      }
      return this.interpolate(fallbackTranslation, params);
    }

    return this.interpolate(translation, params);
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    if (!obj) return null;

    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Interpolate parameters in translation string
   * Example: "Hello {name}" with {name: "Ali"} => "Hello Ali"
   */
  interpolate(str, params) {
    if (typeof str !== 'string') return str;

    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Check if locale is RTL
   */
  isRTL(locale = this.currentLocale) {
    return this.rtlLocales.includes(locale);
  }

  /**
   * Get current locale
   */
  getCurrentLocale() {
    return this.currentLocale;
  }

  /**
   * Get available locales
   */
  getAvailableLocales() {
    return Array.from(this.loadedLocales);
  }

  /**
   * Subscribe to locale changes
   */
  onLocaleChange(callback) {
    this.onLocaleChangeCallbacks.push(callback);
    return () => {
      this.onLocaleChangeCallbacks = this.onLocaleChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Format number according to locale
   */
  formatNumber(num, options = {}) {
    try {
      return new Intl.NumberFormat(this.currentLocale, options).format(num);
    } catch (error) {
      console.error('Number formatting error:', error);
      return num.toString();
    }
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(amount, currency = 'TRY', options = {}) {
    try {
      return new Intl.NumberFormat(this.currentLocale, {
        style: 'currency',
        currency,
        ...options
      }).format(amount);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return `${amount} ${currency}`;
    }
  }

  /**
   * Format date according to locale
   */
  formatDate(date, options = {}) {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat(this.currentLocale, options).format(dateObj);
    } catch (error) {
      console.error('Date formatting error:', error);
      return date.toString();
    }
  }

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  getRelativeTime(date) {
    const now = new Date();
    const past = date instanceof Date ? date : new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return this.t('date.justnow');
    } else if (diffMins < 60) {
      return this.t('date.minutesAgo', { count: diffMins });
    } else if (diffHours < 24) {
      return this.t('date.hoursAgo', { count: diffHours });
    } else if (diffDays === 1) {
      return this.t('date.yesterday');
    } else if (diffDays < 7) {
      return this.t('date.daysAgo', { count: diffDays });
    } else {
      return this.formatDate(past, { month: 'short', day: 'numeric' });
    }
  }

  /**
   * Pluralize based on count
   * Example: getPlural('item', 5) => 'items'
   */
  getPlural(key, count) {
    // Simple pluralization - can be extended for complex rules
    const plural = this.t(`${key}_plural`);
    const singular = this.t(key);

    return count === 1 ? singular : (plural || singular);
  }

  /**
   * Get locale metadata
   */
  getLocaleInfo(locale = this.currentLocale) {
    const trans = this.translations[locale];
    if (!trans) return null;

    return {
      locale: trans.locale,
      name: trans.name,
      rtl: trans.rtl || false
    };
  }

  /**
   * Batch translate multiple keys
   */
  tBatch(keys, params = {}) {
    const result = {};
    keys.forEach(key => {
      result[key] = this.t(key, params);
    });
    return result;
  }

  /**
   * Get entire translation object for a path
   */
  getSection(path) {
    return this.getNestedValue(this.translations[this.currentLocale], path) || {};
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.I18nManager = I18nManager;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18nManager;
}
