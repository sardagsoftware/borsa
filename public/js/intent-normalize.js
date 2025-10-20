/**
 * 🧠 Intent Normalization - TR-Aware
 * Null/undefined safe text processing with Turkish locale support
 *
 * @module intent-normalize
 * @license MIT
 */

(function(window) {
  'use strict';

  /**
   * Safe text conversion with null/undefined guard
   * @param {unknown} x - Input value
   * @returns {string} Normalized string
   */
  function safeText(x) {
    if (x == null) return '';
    if (typeof x === 'string') return x;
    if (typeof x === 'number') return String(x);
    if (typeof x === 'boolean') return x ? 'true' : 'false';
    if (typeof x === 'object') {
      try {
        return JSON.stringify(x);
      } catch (e) {
        return String(x);
      }
    }
    return String(x);
  }

  /**
   * Turkish-aware lowercase conversion
   * Handles İ/I and ı/i correctly
   * @param {string} text - Input text
   * @returns {string} Lowercase text
   */
  function toTRLower(text) {
    const safe = safeText(text);
    // Turkish locale mappings
    return safe
      .replace(/İ/g, 'i')     // İ → i
      .replace(/I/g, 'ı')     // I → ı
      .toLowerCase();
  }

  /**
   * Turkish-aware uppercase conversion
   * @param {string} text - Input text
   * @returns {string} Uppercase text
   */
  function toTRUpper(text) {
    const safe = safeText(text);
    return safe
      .replace(/i/g, 'İ')     // i → İ
      .replace(/ı/g, 'I')     // ı → I
      .toUpperCase();
  }

  /**
   * Normalize text for comparison
   * - Removes diacritics
   * - Converts to lowercase
   * - Trims whitespace
   * - Removes multiple spaces
   * @param {string} text - Input text
   * @returns {string} Normalized text
   */
  function normalize(text) {
    const safe = safeText(text);
    return toTRLower(safe)
      .normalize('NFKC')           // Unicode normalization
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^\w\s]/g, ' ')    // Remove special chars
      .replace(/\s+/g, ' ')        // Collapse spaces
      .trim();
  }

  /**
   * Extract vendor name safely
   * @param {object} match - Regex match result
   * @returns {string} Vendor name
   */
  function extractVendor(match) {
    if (!match) return '';
    return safeText(match[1] || match.groups?.vendor || '').trim();
  }

  /**
   * Extract tracking number safely
   * @param {object} match - Regex match result
   * @returns {string} Tracking number
   */
  function extractTrackingNo(match) {
    if (!match) return '';
    return safeText(match[2] || match.groups?.trackingNo || '').trim();
  }

  /**
   * Extract amount safely
   * @param {object} match - Regex match result
   * @returns {number} Amount
   */
  function extractAmount(match) {
    if (!match) return 0;
    const raw = safeText(match[1] || match.groups?.amount || '0');
    const cleaned = raw.replace(/[^\d]/g, '');
    return parseInt(cleaned, 10) || 0;
  }

  /**
   * Extract term (duration) safely
   * @param {object} match - Regex match result
   * @returns {number} Term in months
   */
  function extractTerm(match) {
    if (!match) return 0;
    const raw = safeText(match[2] || match.groups?.term || '0');
    const cleaned = raw.replace(/[^\d]/g, '');
    return parseInt(cleaned, 10) || 0;
  }

  /**
   * Extract percentage safely
   * @param {object} match - Regex match result
   * @returns {number} Percentage (0-100)
   */
  function extractPercent(match) {
    if (!match) return 0;
    const raw = safeText(match[1] || match.groups?.percent || '0');
    const cleaned = raw.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned) || 0;
    return Math.max(0, Math.min(100, num)); // Clamp 0-100
  }

  // Export to window
  window.IntentNormalize = {
    safeText,
    toTRLower,
    toTRUpper,
    normalize,
    extractVendor,
    extractTrackingNo,
    extractAmount,
    extractTerm,
    extractPercent
  };

  console.log('✅ Intent Normalization loaded (TR-aware, null-safe)');

})(window);
