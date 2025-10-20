/**
 * Watchlist Button Component
 * Add/remove coin from watchlist
 */

'use client';

import { useState } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';

interface WatchlistButtonProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WatchlistButton({ symbol, size = 'md' }: WatchlistButtonProps) {
  const { isCoinInWatchlist, toggleCoin } = useWatchlist();
  const [isAnimating, setIsAnimating] = useState(false);

  const isInWatchlist = isCoinInWatchlist(symbol);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent coin card click

    setIsAnimating(true);
    toggleCoin(symbol);

    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-lg transition-all ${
        isInWatchlist
          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-yellow-400'
      } ${isAnimating ? 'scale-125' : 'scale-100'}`}
      title={isInWatchlist ? 'Watchlist\'ten çıkar' : 'Watchlist\'e ekle'}
    >
      {isInWatchlist ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )}
    </button>
  );
}
