/**
 * = GlobalSearch - ChatGPT-style Persistent Top Search
 *
 * Features:
 * - Intent recognition with fuzzy matching
 * - Top-3 suggestions as chips
 * - Turkish placeholders by default
 * - Instant feedback on key press
 * - Glassmorphism design (Analydian Premium)
 *
 * @module components/unified/search
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { recognizeIntent, IntentResult } from '../../../intent/engine';
import { getActionDescription } from '../../../intent/registry';

// ============================================================================
// Types
// ============================================================================

interface GlobalSearchProps {
  /** Callback when user submits query */
  onSubmit: (query: string, intent: IntentResult) => void;

  /** Current locale (default: 'tr') */
  locale?: string;

  /** Placeholder text (optional, auto-selected by locale) */
  placeholder?: string;

  /** Auto-focus on mount? */
  autoFocus?: boolean;

  /** Disabled state */
  disabled?: boolean;
}

// ============================================================================
// Localized Placeholders
// ============================================================================

const PLACEHOLDERS: Record<string, string> = {
  tr: 'Kargo takibi, fiyat kar_1la_t1rma, ürün arama...',
  en: 'Track shipment, compare prices, search products...',
  ar: '**(9 'D4-F) EB'1F) 'D#39'1 'D(-+ 9F 'DEF*,'*...',
  de: 'Sendung verfolgen, Preise vergleichen, Produkte suchen...',
  ru: 'BA;56820=85 ?>AK;:8, A@02=5=85 F5=, ?>8A: B>20@>2...',
  nl: 'Track zending, prijzen vergelijken, producten zoeken...',
  bg: '@>A;54O20=5 =0 ?@0B:0, A@02=O20=5 =0 F5=8, BJ@A5=5 =0 ?@>4C:B8...',
  el: ' ±Á±º¿»¿Í¸·Ã· ±À¿ÃÄ¿»®Â, ÃÍ³ºÁ¹Ã· Ä¹¼Î½, ±½±¶®Ä·Ã· ÀÁ¿ÊÌ½ÄÉ½...',
};

// ============================================================================
// GlobalSearch Component
// ============================================================================

export function GlobalSearch({
  onSubmit,
  locale = 'tr',
  placeholder,
  autoFocus = false,
  disabled = false,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [intent, setIntent] = useState<IntentResult | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================
  // Intent Recognition (Debounced)
  // ========================================

  const recognizeQueryIntent = useCallback((q: string) => {
    if (!q || q.length < 2) {
      setIntent(null);
      return;
    }

    // Debounce intent recognition (300ms)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const result = recognizeIntent(q);
      setIntent(result);
    }, 300);
  }, []);

  // ========================================
  // Handlers
  // ========================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    recognizeQueryIntent(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || disabled || isProcessing) return;

    setIsProcessing(true);

    try {
      // Re-recognize intent at submit time (fresh)
      const finalIntent = recognizeIntent(query);
      await onSubmit(query, finalIntent);

      // Clear input after successful submit
      setQuery('');
      setIntent(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChipClick = (action: string) => {
    // Auto-fill with suggested action
    const description = getActionDescription(action, locale);
    setQuery(description);
    inputRef.current?.focus();
  };

  // ========================================
  // Effects
  // ========================================

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ========================================
  // Render
  // ========================================

  const selectedPlaceholder = placeholder || PLACEHOLDERS[locale] || PLACEHOLDERS['tr'];
  const topSuggestions = intent?.matches.slice(0, 3) || [];

  return (
    <div className="global-search">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="search-form">
        <div
          className={`search-input-container ${isFocused ? 'focused' : ''} ${
            disabled ? 'disabled' : ''
          }`}
        >
          {/* Search Icon */}
          <svg
            className="search-icon"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M12 12L17 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder={selectedPlaceholder}
            value={query}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled || isProcessing}
            autoComplete="off"
            spellCheck="false"
          />

          {/* Loading Spinner */}
          {isProcessing && (
            <div className="search-spinner">
              <div className="spinner" />
            </div>
          )}

          {/* Intent Indicator (if detected) */}
          {intent && intent.topMatch && (
            <div
              className="intent-indicator"
              title={`${intent.topMatch.confidence} confidence`}
            >
              <span className={`confidence-badge ${intent.topMatch.confidence}`}>
                {intent.topMatch.confidence === 'high' ? '' : '~'}
              </span>
            </div>
          )}
        </div>

        {/* Submit Button (Hidden, triggered by Enter) */}
        <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
      </form>

      {/* Top-3 Suggestions (Chips) */}
      {topSuggestions.length > 0 && query.length > 2 && (
        <div className="search-chips">
          {topSuggestions.map((match, index) => (
            <button
              key={match.action}
              className={`chip ${match.confidence}`}
              onClick={() => handleChipClick(match.action)}
              disabled={disabled}
            >
              <span className="chip-label">
                {getActionDescription(match.action, locale)}
              </span>
              <span className="chip-score">{Math.round(match.score * 100)}%</span>
            </button>
          ))}
        </div>
      )}

      {/* Styles (Scoped to GlobalSearch) */}
      <style jsx>{`
        .global-search {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 20px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 215, 0, 0.1);
        }

        .search-form {
          max-width: 800px;
          margin: 0 auto;
        }

        .search-input-container {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid rgba(255, 215, 0, 0.2);
          border-radius: 20px;
          transition: all 0.3s ease;
        }

        .search-input-container.focused {
          border-color: rgba(255, 215, 0, 0.6);
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
        }

        .search-input-container.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .search-icon {
          color: rgba(255, 215, 0, 0.6);
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #fff;
          font-size: 16px;
          font-weight: 400;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .search-spinner {
          flex-shrink: 0;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 215, 0, 0.2);
          border-top-color: rgba(255, 215, 0, 0.8);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .intent-indicator {
          flex-shrink: 0;
        }

        .confidence-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
        }

        .confidence-badge.high {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .confidence-badge.medium {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .confidence-badge.low {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .search-chips {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 16px;
          color: #fff;
          font-size: 14px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chip:hover:not(:disabled) {
          background: rgba(255, 215, 0, 0.2);
          border-color: rgba(255, 215, 0, 0.5);
          transform: scale(1.05);
        }

        .chip:active:not(:disabled) {
          transform: scale(0.98);
        }

        .chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chip-label {
          font-weight: 500;
        }

        .chip-score {
          font-size: 12px;
          opacity: 0.7;
        }

        .chip.high {
          border-color: rgba(34, 197, 94, 0.5);
        }

        .chip.medium {
          border-color: rgba(251, 191, 36, 0.5);
        }

        .chip.low {
          border-color: rgba(239, 68, 68, 0.5);
        }
      `}</style>
    </div>
  );
}

export default GlobalSearch;
