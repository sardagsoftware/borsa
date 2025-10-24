'use client';

/**
 * CACHE STATISTICS COMPONENT
 *
 * Shows cache performance metrics to users
 * - Cache hit/miss rates
 * - Storage usage
 * - Cached items count
 * - Clear cache button (privacy control)
 *
 * WHITE-HAT:
 * - Transparent about data storage
 * - User can clear cache anytime
 * - Privacy-first design
 */

import { useEffect, useState } from 'react';
import { marketDataCache } from '@/lib/cache/market-data-cache';

interface CacheStats {
  memoryCount: number;
  localStorageCount: number;
  indexedDBCount: number;
  totalSize: number;
}

export function CacheStats() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadStats();
    // Refresh stats every 10 seconds
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await marketDataCache.getStats();
      setStats(data);
    } catch (error) {
      console.error('[CacheStats] Failed to load stats:', error);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Clear all cached data? This will not affect your account or settings.')) {
      return;
    }

    setIsClearing(true);
    try {
      await marketDataCache.clearAll();
      await loadStats();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('[CacheStats] Failed to clear cache:', error);
      alert('Failed to clear cache. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  if (!stats) {
    return null;
  }

  const totalCount = stats.memoryCount + stats.localStorageCount + stats.indexedDBCount;
  const sizeMB = (stats.totalSize / 1024 / 1024).toFixed(2);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Cache Performance
        </h3>
        <button
          onClick={handleClearCache}
          disabled={isClearing || totalCount === 0}
          className="text-xs px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isClearing ? 'Clearing...' : 'Clear Cache'}
        </button>
      </div>

      {showSuccess && (
        <div className="mb-3 p-2 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs">
          ✅ Cache cleared successfully
        </div>
      )}

      <div className="space-y-2">
        {/* Total Items */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total Cached Items:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{totalCount}</span>
        </div>

        {/* Memory */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 dark:text-gray-500">Memory (fast):</span>
          <span className="text-gray-700 dark:text-gray-300">{stats.memoryCount}</span>
        </div>

        {/* localStorage */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 dark:text-gray-500">localStorage:</span>
          <span className="text-gray-700 dark:text-gray-300">{stats.localStorageCount}</span>
        </div>

        {/* IndexedDB */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 dark:text-gray-500">IndexedDB (large):</span>
          <span className="text-gray-700 dark:text-gray-300">{stats.indexedDBCount}</span>
        </div>

        {/* Storage Size */}
        <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-500">Storage Used:</span>
          <span className="text-gray-700 dark:text-gray-300">{sizeMB} MB</span>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
          🔒 All data stored locally on your device. No external servers.
        </p>
      </div>
    </div>
  );
}
