/**
 * 🔍 Global Search Component
 * Fuzzy search with intent suggestions
 * 
 * @module components/search/GlobalSearch
 * @white-hat Compliant
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../state/store';
import { trackAction } from '../../lib/telemetry';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const addMessage = useAppStore(state => state.addMessage);
  const setIntents = useAppStore(state => state.setIntents);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Debounced search
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      // Call intent engine
      const response = await fetch('/api/lydian-iq/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: searchQuery }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success && data.intents) {
        setResults(data.intents.slice(0, 5)); // Top 5
        setShowResults(true);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        selectResult(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  const selectResult = (result: any) => {
    // Add user message
    addMessage({
      role: 'user',
      content: query,
    });

    // Set intents
    setIntents([result]);

    // Track action
    trackAction('search_select', {
      query,
      intent: result.action,
      score: result.score,
    });

    // Clear search
    setQuery('');
    setShowResults(false);
    inputRef.current?.blur();

    // Execute intent (trigger connector)
    executeIntent(result);
  };

  const executeIntent = async (intent: any) => {
    try {
      const response = await fetch('/api/lydian-iq/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent }),
        credentials: 'include',
      });

      const data = await response.json();

      // Add AI response
      addMessage({
        role: 'ai',
        content: data.message || 'İşlem tamamlandı.',
        intentId: intent.id,
      });
    } catch (error) {
      console.error('Execute error:', error);
      addMessage({
        role: 'system',
        content: '❌ İşlem gerçekleştirilemedi.',
      });
    }
  };

  return (
    <div className="global-search">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Ne yapmak istersiniz? (örn: Trendyol''da fiyat ara, Hepsijet kargo takibi...)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {query && (
          <button
            className="clear-btn"
            onClick={() => {
              setQuery('');
              setShowResults(false);
              inputRef.current?.focus();
            }}
          >
            ✕
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((result, index) => (
            <div
              key={result.id || index}
              className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => selectResult(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="result-main">
                <span className="result-icon">{getIntentIcon(result.action)}</span>
                <div className="result-content">
                  <div className="result-title">{getIntentTitle(result.action)}</div>
                  <div className="result-subtitle">{result.reason || result.action}</div>
                </div>
              </div>
              <div className="result-score">
                <span className="score-bar" style={{ width: `${result.score * 100}%` }} />
                <span className="score-text">{Math.round(result.score * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .global-search {
          position: relative;
          width: 100%;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          transition: all 0.2s;
        }

        .search-input-wrapper:focus-within {
          background: rgba(0, 0, 0, 0.5);
          border-color: rgba(212, 175, 55, 0.5);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }

        .search-icon {
          font-size: 1.25rem;
          opacity: 0.6;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #f5f5f5;
          font-size: 0.9375rem;
          font-weight: 400;
        }

        .search-input::placeholder {
          color: rgba(245, 245, 245, 0.4);
        }

        .clear-btn {
          background: transparent;
          border: none;
          color: rgba(245, 245, 245, 0.6);
          font-size: 1rem;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
          transition: color 0.2s;
        }

        .clear-btn:hover {
          color: #f5f5f5;
        }

        .search-results {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          padding: 0.5rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          z-index: 1000;
          max-height: 400px;
          overflow-y: auto;
        }

        .result-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .result-item:hover,
        .result-item.selected {
          background: rgba(212, 175, 55, 0.1);
        }

        .result-main {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .result-icon {
          font-size: 1.5rem;
        }

        .result-content {
          flex: 1;
        }

        .result-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #f5f5f5;
          margin-bottom: 0.25rem;
        }

        .result-subtitle {
          font-size: 0.8125rem;
          color: rgba(245, 245, 245, 0.6);
        }

        .result-score {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .score-bar {
          width: 60px;
          height: 4px;
          background: rgba(212, 175, 55, 0.3);
          border-radius: 2px;
          position: relative;
        }

        .score-bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #d4af37 0%, #f4d03f 100%);
          border-radius: 2px;
          width: inherit;
        }

        .score-text {
          font-size: 0.75rem;
          color: rgba(212, 175, 55, 0.8);
          font-weight: 600;
          min-width: 40px;
          text-align: right;
        }

        /* Scrollbar */
        .search-results::-webkit-scrollbar {
          width: 6px;
        }

        .search-results::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }

        .search-results::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

// Helper: Get intent icon
function getIntentIcon(action: string): string {
  const icons: Record<string, string> = {
    price_search: '💰',
    price_compare: '⚖️',
    product_search: '🔍',
    shipment_track: '📦',
    inventory_sync: '📊',
    menu_view: '🍔',
    loan_check: '💳',
    travel_search: '✈️',
    esg_report: '🌱',
    unknown: '❓',
  };
  return icons[action] || icons.unknown;
}

// Helper: Get intent title
function getIntentTitle(action: string): string {
  const titles: Record<string, string> = {
    price_search: 'Fiyat Arama',
    price_compare: 'Fiyat Karşılaştırma',
    product_search: 'Ürün Arama',
    shipment_track: 'Kargo Takibi',
    inventory_sync: 'Stok Senkronizasyonu',
    menu_view: 'Menü Görüntüleme',
    loan_check: 'Kredi Sorgulama',
    travel_search: 'Seyahat Arama',
    esg_report: 'ESG Raporu',
    unknown: 'Bilinmeyen İşlem',
  };
  return titles[action] || action;
}
