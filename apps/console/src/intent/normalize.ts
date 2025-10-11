/**
 * 🔤 Intent Normalization - TR-Aware Text Processing
 * 
 * Null-safe, Turkish locale-aware normalization with NFKC
 * 
 * @module intent/normalize
 */

/**
 * Safe text normalization with null/undefined guards
 */
export function safeText(input: unknown): string {
  if (input === null || input === undefined) {
    return '';
  }

  if (typeof input === 'string') {
    return input.trim();
  }

  if (typeof input === 'number') {
    return String(input);
  }

  if (typeof input === 'object') {
    return JSON.stringify(input);
  }

  return String(input);
}

/**
 * Turkish-aware lowercase conversion
 * Handles İ/i and I/ı correctly
 */
export function toTRLower(text: string): string {
  if (!text) return '';

  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase();
}

/**
 * Turkish-aware uppercase conversion
 */
export function toTRUpper(text: string): string {
  if (!text) return '';

  return text
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toUpperCase();
}

/**
 * Normalize text with NFKC and Turkish rules
 */
export function normalize(text: unknown): string {
  const safe = safeText(text);
  if (!safe) return '';

  // NFKC normalization
  const nfkc = safe.normalize('NFKC');

  // Turkish lowercase
  const lower = toTRLower(nfkc);

  // Remove extra whitespace
  return lower.replace(/\s+/g, ' ').trim();
}

/**
 * Remove Turkish diacritics for fuzzy matching
 */
export function removeDiacritics(text: string): string {
  if (!text) return '';

  const map: Record<string, string> = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'i': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'C', 'Ğ': 'G', 'I': 'I', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
  };

  return text.split('').map(char => map[char] || char).join('');
}

/**
 * Extract numbers from text
 */
export function extractNumbers(text: string): number[] {
  if (!text) return [];

  const matches = text.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

/**
 * Extract tracking number patterns
 * Supports: numeric, alphanumeric, mixed formats
 */
export function extractTrackingNumber(text: string): string | null {
  if (!text) return null;

  // Common tracking number patterns
  const patterns = [
    /\b\d{10,15}\b/,                    // 10-15 digits (Aras, Yurtiçi, MNG)
    /\b[A-Z]{2}\d{9}[A-Z]{2}\b/,        // 2 letters + 9 digits + 2 letters
    /\b1Z[A-Z0-9]{16}\b/,               // UPS format
    /\b\d{12,}\b/,                       // Generic long number
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

/**
 * Extract amount (money) from text
 * Supports: "250 bin", "1.5M", "500K", "1000 TL"
 */
export function extractAmount(text: string): number | null {
  if (!text) return null;

  const normalized = normalize(text);

  // "250 bin" = 250,000
  const binMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*bin/);
  if (binMatch) {
    return parseFloat(binMatch[1].replace(',', '.')) * 1000;
  }

  // "1.5M" = 1,500,000
  const mMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*m\b/);
  if (mMatch) {
    return parseFloat(mMatch[1].replace(',', '.')) * 1000000;
  }

  // "500K" = 500,000
  const kMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
  if (kMatch) {
    return parseFloat(kMatch[1].replace(',', '.')) * 1000;
  }

  // Plain numbers with TL/USD/EUR
  const currencyMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:tl|usd|eur|₺|\$|€)/);
  if (currencyMatch) {
    return parseFloat(currencyMatch[1].replace(',', '.'));
  }

  // Plain numbers >= 1000
  const plainMatch = normalized.match(/\b(\d{4,})\b/);
  if (plainMatch) {
    return parseInt(plainMatch[1], 10);
  }

  return null;
}

/**
 * Extract term (loan period) from text
 * Supports: "24 ay", "12 month", "36 months"
 */
export function extractTerm(text: string): number | null {
  if (!text) return null;

  const normalized = normalize(text);

  const match = normalized.match(/(\d+)\s*(?:ay|month|months|mo)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
}

/**
 * Extract percentage from text
 * Supports: "5%", "%5", "yüzde 5"
 */
export function extractPercentage(text: string): number | null {
  if (!text) return null;

  const normalized = normalize(text);

  const match = normalized.match(/(?:yuzde|percent|%)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*%/);
  if (match) {
    const value = match[1] || match[2];
    return parseFloat(value.replace(',', '.'));
  }

  return null;
}

console.log('✅ Intent normalization module loaded (TR-aware, null-safe)');
