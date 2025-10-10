/**
 * 🧠 Intent Engine - Natural Language → Action Mapping (Vanilla JS)
 * Lightweight NLU for Turkish-first, multi-locale support
 *
 * @author LyDian AI - Ultra Intelligence Platform
 */

(function(window) {
  'use strict';

  // Import dictionaries (will be loaded separately)
  const IntentDictionaries = window.IntentDictionaries || {};

  /**
   * Parse user utterance into intents
   * Returns top 3 scored intents
   */
  function parseUtterance(utterance, locale = 'tr') {
    if (!utterance || utterance.trim().length < 3) {
      return [];
    }

    const normalized = normalizeText(utterance, locale);
    const localePatterns = IntentDictionaries.patterns?.[locale] || IntentDictionaries.patterns?.tr || [];

    const results = [];

    // Try pattern matching
    for (const pattern of localePatterns) {
      const match = normalized.match(pattern.re);

      if (match) {
        const params = extractParams(match, pattern.params);
        const score = calculateScore(match, pattern);

        results.push({
          action: pattern.action,
          score: score,
          params: params,
          locale: locale,
          reason: pattern.reason || getDefaultReason(pattern.action, locale)
        });
      }
    }

    // Fallback: keyword-based matching
    if (results.length === 0) {
      const keywordIntents = matchByKeywords(normalized, locale);
      results.push(...keywordIntents);
    }

    // Sort by score (descending) and return top 3
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  /**
   * Normalize text for matching
   * - Lowercase (TR-aware)
   * - Trim whitespace
   * - Normalize Turkish characters
   */
  function normalizeText(text, locale) {
    let normalized = text.trim();

    if (locale === 'tr') {
      // Turkish-specific lowercasing
      normalized = normalized
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .toLowerCase();
    } else {
      normalized = normalized.toLowerCase();
    }

    return normalized;
  }

  /**
   * Extract parameters from regex match
   */
  function extractParams(match, paramNames) {
    const params = {};

    // Skip first element (full match), map to param names
    paramNames.forEach((name, index) => {
      const value = match[index + 1];
      if (value !== undefined) {
        params[name] = parseValue(name, value);
      }
    });

    return params;
  }

  /**
   * Parse value based on param name
   */
  function parseValue(paramName, value) {
    // Amount/Money
    if (paramName === 'amount') {
      return parseFloat(value.replace(/\./g, '').replace(/,/g, '.'));
    }

    // Numbers
    if (paramName === 'term' || paramName === 'days' || paramName === 'pax') {
      return parseInt(value, 10);
    }

    // Vendor normalization
    if (paramName === 'vendor') {
      return normalizeVendor(value);
    }

    return value.trim();
  }

  /**
   * Normalize vendor names
   */
  function normalizeVendor(vendor) {
    const vendorMap = {
      'hepsijet': 'hepsijet',
      'aras': 'aras',
      'yurtiçi': 'yurtici',
      'yurtici': 'yurtici',
      'mng': 'mng',
      'sürat': 'surat',
      'surat': 'surat',
      'ups': 'ups'
    };

    return vendorMap[vendor.toLowerCase()] || vendor;
  }

  /**
   * Calculate confidence score
   */
  function calculateScore(match, pattern) {
    let score = 0.7; // Base score

    // Boost score based on match quality
    const matchedGroups = match.slice(1).filter(g => g !== undefined).length;
    score += matchedGroups * 0.05;

    // Cap at 0.99
    return Math.min(score, 0.99);
  }

  /**
   * Fallback: keyword-based matching
   */
  function matchByKeywords(text, locale) {
    const localeSynonyms = IntentDictionaries.synonyms?.[locale] || IntentDictionaries.synonyms?.tr || {};
    const results = [];

    // Shipment tracking
    if (localeSynonyms.shipment?.some(kw => text.includes(kw)) &&
        localeSynonyms.track?.some(kw => text.includes(kw))) {
      results.push({
        action: 'shipment.track',
        score: 0.6,
        params: {},
        locale: locale,
        reason: 'Kargo takibi sorgusu tespit edildi'
      });
    }

    // Loan comparison
    if (localeSynonyms.loan?.some(kw => text.includes(kw))) {
      results.push({
        action: 'loan.compare',
        score: 0.6,
        params: {},
        locale: locale,
        reason: 'Kredi karşılaştırma sorgusu'
      });
    }

    // Price optimization
    if (localeSynonyms.price?.some(kw => text.includes(kw)) &&
        (text.includes('optimiz') || text.includes('arttır') || text.includes('düşür'))) {
      results.push({
        action: 'economy.optimize',
        score: 0.6,
        params: {},
        locale: locale,
        reason: 'Fiyat optimizasyonu isteği'
      });
    }

    // Trip search
    if (localeSynonyms.trip?.some(kw => text.includes(kw))) {
      results.push({
        action: 'trip.search',
        score: 0.6,
        params: {},
        locale: locale,
        reason: 'Seyahat/otel arama'
      });
    }

    // ESG carbon calculation
    if (localeSynonyms.esg?.some(kw => text.includes(kw))) {
      results.push({
        action: 'esg.calculate-carbon',
        score: 0.6,
        params: {},
        locale: locale,
        reason: 'Karbon ayak izi hesaplama'
      });
    }

    return results;
  }

  /**
   * Get default reason text by action
   */
  function getDefaultReason(action, locale) {
    const reasons = {
      'shipment.track': {
        tr: 'Kargo takibi',
        en: 'Shipment tracking',
        ar: 'تتبع الشحنة'
      },
      'loan.compare': {
        tr: 'Kredi karşılaştırma',
        en: 'Loan comparison',
        ar: 'مقارنة القروض'
      },
      'economy.optimize': {
        tr: 'Fiyat optimizasyonu',
        en: 'Price optimization',
        ar: 'تحسين السعر'
      },
      'trip.search': {
        tr: 'Seyahat arama',
        en: 'Trip search',
        ar: 'البحث عن رحلة'
      },
      'esg.calculate-carbon': {
        tr: 'Karbon hesaplama',
        en: 'Carbon calculation',
        ar: 'حساب الكربون'
      }
    };

    return reasons[action]?.[locale] || action;
  }

  /**
   * Format intent for display
   */
  function formatIntentChip(intent) {
    const action = intent.action.split('.')[1] || intent.action;
    const params = Object.entries(intent.params)
      .filter(([k]) => !k.startsWith('_'))
      .map(([k, v]) => `${v}`)
      .join(' • ');

    return params ? `${intent.reason}: ${params}` : intent.reason || action;
  }

  // Export to window
  window.IntentEngine = {
    parseUtterance: parseUtterance,
    formatIntentChip: formatIntentChip,
    normalizeText: normalizeText
  };

})(window);
