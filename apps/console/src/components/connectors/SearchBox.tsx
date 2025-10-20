/**
 * 🔎 Search Box Component
 * Reusable search input with debouncing and clear functionality
 */

import React, { useState, useEffect, useRef } from 'react';

interface SearchBoxProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  icon?: string;
  compact?: boolean;
  initialValue?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  icon = '🔍',
  compact = false,
  initialValue = ''
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, onSearch, debounceMs]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative">
      {/* Search Icon */}
      <div className={`absolute ${compact ? 'left-3' : 'left-5'} top-1/2 -translate-y-1/2
                     text-gray-400 ${compact ? 'text-base' : 'text-xl'}
                     transition-colors duration-200
                     ${isFocused ? 'text-amber-400' : ''}`}>
        {icon}
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`w-full ${compact ? 'px-4 py-2.5 pl-10 text-sm' : 'px-6 py-4 pl-14 text-base'} rounded-xl
                   bg-white/5 border border-white/10
                   focus:bg-white/10 focus:border-amber-400/40
                   text-white placeholder-gray-400
                   transition-all duration-200
                   outline-none
                   hover:border-white/20`}
      />

      {/* Clear Button */}
      {query && (
        <button
          onClick={handleClear}
          className={`absolute ${compact ? 'right-3' : 'right-5'} top-1/2 -translate-y-1/2
                     ${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg
                     bg-white/10 hover:bg-white/20
                     text-gray-400 hover:text-white
                     transition-all duration-200
                     flex items-center justify-center
                     ${compact ? 'text-xs' : 'text-sm'}`}
          title="Clear search"
        >
          ✕
        </button>
      )}

      {/* Search Results Count (optional, can be passed as prop in future) */}
      {isFocused && query && (
        <div className="absolute left-0 right-0 top-full mt-2 z-10">
          <div className="p-2 rounded-lg bg-gray-900/95 backdrop-blur-xl
                        border border-white/10 shadow-xl">
            <div className="text-xs text-gray-400 text-center">
              Searching for "{query}"...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Advanced Search Box with suggestions
interface SearchBoxWithSuggestionsProps extends SearchBoxProps {
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export const SearchBoxWithSuggestions: React.FC<SearchBoxWithSuggestionsProps> = ({
  suggestions = [],
  onSuggestionClick,
  ...searchBoxProps
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState(searchBoxProps.initialValue || '');

  const filteredSuggestions = suggestions.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    searchBoxProps.onSearch(suggestion);
    onSuggestionClick?.(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <SearchBox
        {...searchBoxProps}
        initialValue={query}
        onSearch={(q) => {
          setQuery(q);
          searchBoxProps.onSearch(q);
          setShowSuggestions(q.length > 0 && filteredSuggestions.length > 0);
        }}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50">
          <div className="p-2 rounded-xl bg-gray-900/95 backdrop-blur-xl
                        border border-white/10 shadow-2xl shadow-black/50
                        max-h-64 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 rounded-lg text-left text-sm
                         text-white hover:bg-white/10
                         transition-colors duration-150
                         flex items-center gap-2"
              >
                <span className="text-gray-400">🔍</span>
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
