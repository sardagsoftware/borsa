/**
 * 🧠 Intent Engine - Natural Language → Action Mapping
 * Lightweight NLU for Turkish-first, multi-locale support
 *
 * @author LyDian AI - Ultra Intelligence Platform
 * @license Proprietary
 */

import { synonyms, patterns } from './dictionaries';

export type Intent = {
  action: string;              // "shipment.track", "loan.compare", etc.
  score: number;               // 0..1 confidence
  params: Record<string, any>; // Extracted parameters
  locale: string;
  reason?: string;             // Human-readable explanation
};

/**
 * Parse user utterance into intents
 * Returns top 3 scored intents
 */
export function parseUtterance(utterance: string, locale: string = 'tr'): Intent[] {
  if (!utterance || utterance.trim().length < 3) {
    return [];
  }

  const normalized = normalizeText(utterance, locale);
  const localePatterns = patterns[locale as keyof typeof patterns] || patterns.tr;

  const results: Intent[] = [];

  // Try pattern matching
  for (const pattern of localePatterns) {
    const match = normalized.match(pattern.re);

    if (match) {
      const params = extractParams(match, pattern.params);
      const score = calculateScore(match, pattern);

      results.push({
        action: pattern.action,
        score,
        params,
        locale,
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
function normalizeText(text: string, locale: string): string {
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
function extractParams(match: RegExpMatchArray, paramNames: string[]): Record<string, any> {
  const params: Record<string, any> = {};

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
function parseValue(paramName: string, value: string): any {
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
function normalizeVendor(vendor: string): string {
  const vendorMap: Record<string, string> = {
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
function calculateScore(match: RegExpMatchArray, pattern: any): number {
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
function matchByKeywords(text: string, locale: string): Intent[] {
  const localeSynonyms = synonyms[locale as keyof typeof synonyms] || synonyms.tr;
  const results: Intent[] = [];

  // Shipment tracking
  if (localeSynonyms.shipment.some(kw => text.includes(kw)) &&
      localeSynonyms.track.some(kw => text.includes(kw))) {
    results.push({
      action: 'shipment.track',
      score: 0.6,
      params: {},
      locale,
      reason: 'Kargo takibi sorgusu tespit edildi'
    });
  }

  // Loan comparison
  if (localeSynonyms.loan.some(kw => text.includes(kw))) {
    results.push({
      action: 'loan.compare',
      score: 0.6,
      params: {},
      locale,
      reason: 'Kredi karşılaştırma sorgusu'
    });
  }

  // Price optimization
  if (localeSynonyms.price.some(kw => text.includes(kw)) &&
      (text.includes('optimiz') || text.includes('arttır') || text.includes('düşür'))) {
    results.push({
      action: 'economy.optimize',
      score: 0.6,
      params: {},
      locale,
      reason: 'Fiyat optimizasyonu isteği'
    });
  }

  // Trip search
  if (localeSynonyms.trip.some(kw => text.includes(kw))) {
    results.push({
      action: 'trip.search',
      score: 0.6,
      params: {},
      locale,
      reason: 'Seyahat/otel arama'
    });
  }

  // ESG carbon calculation
  if (localeSynonyms.esg.some(kw => text.includes(kw))) {
    results.push({
      action: 'esg.calculate-carbon',
      score: 0.6,
      params: {},
      locale,
      reason: 'Karbon ayak izi hesaplama'
    });
  }

  return results;
}

/**
 * Get default reason text by action
 */
function getDefaultReason(action: string, locale: string): string {
  const reasons: Record<string, Record<string, string>> = {
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
export function formatIntentChip(intent: Intent): string {
  const action = intent.action.split('.')[1] || intent.action;
  const params = Object.entries(intent.params)
    .map(([k, v]) => `${v}`)
    .join(' • ');

  return params ? `${intent.reason}: ${params}` : intent.reason || action;
}
