/**
 * 🎯 Intent Recognition Engine
 * 
 * ChatGPT-style intent detection with Turkish support
 * - Regex + Fuzzy matching + Domain priority
 * - Min score: 0.55
 * - Top-3 suggestions as chips
 * 
 * @module intent/engine
 */

import {
  normalize,
  toTRLower,
  extractTrackingNumber,
  extractAmount,
  extractTerm,
  extractPercentage,
} from './normalize';

import {
  ALL_VENDORS,
  VENDOR_ID_MAP,
  KEYWORDS_SHIPMENT_TRACK,
  KEYWORDS_PRODUCT_SYNC,
  KEYWORDS_PRICE_UPDATE,
  KEYWORDS_INVENTORY_SYNC,
  KEYWORDS_MENU_UPDATE,
  KEYWORDS_LOAN_COMPARE,
  KEYWORDS_TRIP_SEARCH,
  KEYWORDS_INSIGHTS,
  KEYWORDS_ESG,
} from './dictionaries';

// ============================================================================
// Types
// ============================================================================

export interface IntentMatch {
  action: string;
  score: number;
  params: Record<string, any>;
  vendor?: string;
  vendorId?: string;
  confidence: 'high' | 'medium' | 'low';
  suggestions?: string[];
}

export interface IntentResult {
  matches: IntentMatch[];
  topMatch: IntentMatch | null;
  query: string;
  normalized: string;
}

// ============================================================================
// Scoring Weights
// ============================================================================

const WEIGHTS = {
  EXACT_VENDOR: 0.4,
  KEYWORD_MATCH: 0.3,
  PARAM_EXTRACTED: 0.2,
  DOMAIN_PRIORITY: 0.1,
};

const MIN_SCORE = 0.55;

// ============================================================================
// Fuzzy Matching (Levenshtein Distance)
// ============================================================================

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function fuzzyMatch(query: string, target: string): number {
  const distance = levenshtein(query, target);
  const maxLength = Math.max(query.length, target.length);
  return 1 - (distance / maxLength);
}

// ============================================================================
// Vendor Detection
// ============================================================================

function detectVendor(normalized: string): { vendor: string; vendorId: string; score: number } | null {
  let bestMatch: { vendor: string; score: number } | null = null;

  for (const vendor of ALL_VENDORS) {
    // Exact match
    if (normalized.includes(vendor)) {
      bestMatch = { vendor, score: 1.0 };
      break;
    }

    // Fuzzy match
    const words = normalized.split(/\s+/);
    for (const word of words) {
      const similarity = fuzzyMatch(word, vendor);
      if (similarity > 0.8) {
        if (!bestMatch || similarity > bestMatch.score) {
          bestMatch = { vendor, score: similarity };
        }
      }
    }
  }

  if (!bestMatch) return null;

  const vendorId = VENDOR_ID_MAP[bestMatch.vendor];
  if (!vendorId) return null;

  return {
    vendor: bestMatch.vendor,
    vendorId,
    score: bestMatch.score,
  };
}

// ============================================================================
// Intent Matchers
// ============================================================================

function matchShipmentTrack(normalized: string): IntentMatch | null {
  const hasKeyword = KEYWORDS_SHIPMENT_TRACK.some(kw => normalized.includes(kw));
  if (!hasKeyword) return null;

  const trackingNumber = extractTrackingNumber(normalized);
  const vendor = detectVendor(normalized);

  let score = 0;
  if (vendor) score += WEIGHTS.EXACT_VENDOR * vendor.score;
  if (hasKeyword) score += WEIGHTS.KEYWORD_MATCH;
  if (trackingNumber) score += WEIGHTS.PARAM_EXTRACTED;

  if (score < MIN_SCORE) return null;

  return {
    action: 'shipment.track',
    score,
    params: {
      trackingNumber,
      vendor: vendor?.vendorId || null,
    },
    vendor: vendor?.vendor,
    vendorId: vendor?.vendorId,
    confidence: score > 0.8 ? 'high' : score > 0.65 ? 'medium' : 'low',
  };
}

function matchProductSync(normalized: string): IntentMatch | null {
  const hasKeyword = KEYWORDS_PRODUCT_SYNC.some(kw => normalized.includes(kw));
  if (!hasKeyword) return null;

  const vendor = detectVendor(normalized);

  let score = 0;
  if (vendor) score += WEIGHTS.EXACT_VENDOR * vendor.score;
  if (hasKeyword) score += WEIGHTS.KEYWORD_MATCH;

  if (score < MIN_SCORE) return null;

  return {
    action: 'product.sync',
    score,
    params: {
      vendor: vendor?.vendorId || null,
    },
    vendor: vendor?.vendor,
    vendorId: vendor?.vendorId,
    confidence: score > 0.8 ? 'high' : score > 0.65 ? 'medium' : 'low',
  };
}

function matchPriceUpdate(normalized: string): IntentMatch | null {
  const hasKeyword = KEYWORDS_PRICE_UPDATE.some(kw => normalized.includes(kw));
  if (!hasKeyword) return null;

  const percentage = extractPercentage(normalized);
  const vendor = detectVendor(normalized);

  // Detect increase/decrease
  const isDecrease = /düşür|azalt|indir|decrease|reduce|lower/.test(normalized);
  const isIncrease = /artır|yükselt|arttır|increase|raise|higher/.test(normalized);

  let score = 0;
  if (vendor) score += WEIGHTS.EXACT_VENDOR * vendor.score;
  if (hasKeyword) score += WEIGHTS.KEYWORD_MATCH;
  if (percentage) score += WEIGHTS.PARAM_EXTRACTED;

  if (score < MIN_SCORE) return null;

  return {
    action: 'price.update',
    score,
    params: {
      vendor: vendor?.vendorId || null,
      percentage,
      direction: isDecrease ? 'decrease' : isIncrease ? 'increase' : null,
    },
    vendor: vendor?.vendor,
    vendorId: vendor?.vendorId,
    confidence: score > 0.8 ? 'high' : score > 0.65 ? 'medium' : 'low',
  };
}

function matchInventorySync(normalized: string): IntentMatch | null {
  const hasKeyword = KEYWORDS_INVENTORY_SYNC.some(kw => normalized.includes(kw));
  if (!hasKeyword) return null;

  const vendor = detectVendor(normalized);

  let score = 0;
  if (vendor) score += WEIGHTS.EXACT_VENDOR * vendor.score;
  if (hasKeyword) score += WEIGHTS.KEYWORD_MATCH;

  if (score < MIN_SCORE) return null;

  return {
    action: 'inventory.sync',
    score,
    params: {
      vendor: vendor?.vendorId || null,
    },
    vendor: vendor?.vendor,
    vendorId: vendor?.vendorId,
    confidence: score > 0.8 ? 'high' : score > 0.65 ? 'medium' : 'low',
  };
}

function matchMenuUpdate(normalized: string): IntentMatch | null {
  const hasKeyword = KEYWORDS_MENU_UPDATE.some(kw => normalized.includes(kw));
  if (!hasKeyword) return null;

  const vendor = detectVendor(normalized);

  let score = 0;
  if (vendor) score += WEIGHTS.EXACT_VENDOR * vendor.score;
  if (hasKeyword) score += WEIGHTS.KEYWORD_MATCH;

  if (score < MIN_SCORE) return null;

  return {
    action: 'menu.update',
    score,
    params: {
      vendor: vendor?.vendorId || null,
    },
    vendor: vendor?.vendor,
    vendorId: vendor?.vendorId,
    confidence: score > 0.8 ? 'high' : score > 0.65 ? 'medium' : 'low',
  };
}

function matchLoanCompare(normalized: string): IntentMatch | null {
  const hasKeyword = KEYWORDS_LOAN_COMPARE.some(kw => normalized.includes(kw));
  if (!hasKeyword) return null;

  const amount = extractAmount(normalized);
  const term = extractTerm(normalized);

  let score = 0;
  if (hasKeyword) score += WEIGHTS.KEYWORD_MATCH;
  if (amount) score += WEIGHTS.PARAM_EXTRACTED;
  if (term) score += WEIGHTS.PARAM_EXTRACTED * 0.5;

  if (score < MIN_SCORE) return null;

  return {
    action: 'loan.compare',
    score,
    params: {
      amount,
      term,
    },
    confidence: score > 0.8 ? 'high' : score > 0.65 ? 'medium' : 'low',
  };
}

function matchTripSearch(normalized: string): IntentMatch | null {
  const hasKeyword = KEYWORDS_TRIP_SEARCH.some(kw => normalized.includes(kw));
  if (!hasKeyword) return null;

  const vendor = detectVendor(normalized);

  let score = 0;
  if (vendor) score += WEIGHTS.EXACT_VENDOR * vendor.score;
  if (hasKeyword) score += WEIGHTS.KEYWORD_MATCH;

  if (score < MIN_SCORE) return null;

  return {
    action: 'trip.search',
    score,
    params: {
      vendor: vendor?.vendorId || null,
    },
    vendor: vendor?.vendor,
    vendorId: vendor?.vendorId,
    confidence: score > 0.8 ? 'high' : score > 0.65 ? 'medium' : 'low',
  };
}

function matchInsights(normalized: string): IntentMatch | null {
  const hasKeyword = KEYWORDS_INSIGHTS.some(kw => normalized.includes(kw));
  if (!hasKeyword) return null;

  // Detect insight type
  let insightType = 'general';
  if (/fiyat|price/.test(normalized)) insightType = 'price-trend';
  if (/stok|inventory/.test(normalized)) insightType = 'inventory-levels';
  if (/satış|sales/.test(normalized)) insightType = 'sales-performance';

  let score = 0;
  if (hasKeyword) score += WEIGHTS.KEYWORD_MATCH;
  score += WEIGHTS.DOMAIN_PRIORITY;

  if (score < MIN_SCORE) return null;

  return {
    action: `insights.${insightType}`,
    score,
    params: {
      type: insightType,
    },
    confidence: score > 0.8 ? 'high' : score > 0.65 ? 'medium' : 'low',
  };
}

function matchESG(normalized: string): IntentMatch | null {
  const hasKeyword = KEYWORDS_ESG.some(kw => normalized.includes(kw));
  if (!hasKeyword) return null;

  let score = 0;
  if (hasKeyword) score += WEIGHTS.KEYWORD_MATCH;
  score += WEIGHTS.DOMAIN_PRIORITY;

  if (score < MIN_SCORE) return null;

  return {
    action: 'esg.calculate-carbon',
    score,
    params: {},
    confidence: score > 0.8 ? 'high' : score > 0.65 ? 'medium' : 'low',
  };
}

// ============================================================================
// Main Intent Recognition
// ============================================================================

export function recognizeIntent(query: string): IntentResult {
  if (!query || typeof query !== 'string') {
    return {
      matches: [],
      topMatch: null,
      query: '',
      normalized: '',
    };
  }

  const normalized = normalize(query);

  // Run all matchers
  const matches: IntentMatch[] = [];

  const shipmentMatch = matchShipmentTrack(normalized);
  if (shipmentMatch) matches.push(shipmentMatch);

  const productMatch = matchProductSync(normalized);
  if (productMatch) matches.push(productMatch);

  const priceMatch = matchPriceUpdate(normalized);
  if (priceMatch) matches.push(priceMatch);

  const inventoryMatch = matchInventorySync(normalized);
  if (inventoryMatch) matches.push(inventoryMatch);

  const menuMatch = matchMenuUpdate(normalized);
  if (menuMatch) matches.push(menuMatch);

  const loanMatch = matchLoanCompare(normalized);
  if (loanMatch) matches.push(loanMatch);

  const tripMatch = matchTripSearch(normalized);
  if (tripMatch) matches.push(tripMatch);

  const insightsMatch = matchInsights(normalized);
  if (insightsMatch) matches.push(insightsMatch);

  const esgMatch = matchESG(normalized);
  if (esgMatch) matches.push(esgMatch);

  // Sort by score (descending)
  matches.sort((a, b) => b.score - a.score);

  // Top-3 for chip suggestions
  const topMatch = matches[0] || null;
  const suggestions = matches.slice(0, 3).map(m => m.action);

  return {
    matches,
    topMatch,
    query,
    normalized,
  };
}

// ============================================================================
// Export All
// ============================================================================

// Alias IntentMatch as Intent for compatibility
export type Intent = IntentMatch;

// Wrapper function for backwards compatibility
export function parseUtterance(query: string, locale: string = 'tr'): Intent[] {
  const result = recognizeIntent(query);
  return result.matches;
}

export { detectVendor, fuzzyMatch };

console.log('✅ Intent engine loaded (regex + fuzzy + scoring, min=0.55)');
