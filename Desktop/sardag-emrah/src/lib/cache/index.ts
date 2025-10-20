/**
 * Advanced Caching System
 * Multi-layer caching with Memory + LocalStorage + IndexedDB
 */

// ============================================================
// 1. Memory Cache (Fastest, for hot data)
// ============================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 1000;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
  };

  set<T>(key: string, data: T, ttl: number = 300000): void {
    // 5 min default

    // Evict oldest if full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    });

    this.stats.sets++;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private getOldestKey(): string | undefined {
    let oldest: { key: string; timestamp: number } | undefined;

    this.cache.forEach((entry, key) => {
      if (!oldest || entry.timestamp < oldest.timestamp) {
        oldest = { key, timestamp: entry.timestamp };
      }
    });

    return oldest?.key;
  }

  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: (hitRate * 100).toFixed(2) + '%',
    };
  }
}

export const memoryCache = new MemoryCache();

// ============================================================
// 2. LocalStorage Cache (Persistent across sessions)
// ============================================================

class LocalStorageCache {
  private prefix: string = 'sardag_cache_';

  set<T>(key: string, data: T, ttl: number = 3600000): void {
    // 1 hour default
    if (typeof window === 'undefined') return;

    try {
      const entry = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      localStorage.setItem(
        this.prefix + key,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn('[LocalStorage] Set failed:', error);
    }
  }

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const entry = JSON.parse(item);

      // Check expiration
      if (Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return entry.data as T;
    } catch (error) {
      console.warn('[LocalStorage] Get failed:', error);
      return null;
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Cleanup expired entries
  cleanup(): void {
    if (typeof window === 'undefined') return;

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.prefix)) {
        try {
          const item = localStorage.getItem(key);
          if (!item) return;

          const entry = JSON.parse(item);
          if (Date.now() - entry.timestamp > entry.ttl) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    });
  }
}

export const localStorageCache = new LocalStorageCache();

// Cleanup on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    localStorageCache.cleanup();
  });
}

// ============================================================
// 3. IndexedDB Cache (Large datasets)
// ============================================================

class IndexedDBCache {
  private dbName: string = 'sardag_cache_db';
  private storeName: string = 'cache_store';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'key',
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async set<T>(key: string, data: T, ttl: number = 86400000): Promise<void> {
    // 24 hours default
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const entry = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
      };

      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result;

        if (!entry) {
          resolve(null);
          return;
        }

        // Check expiration
        if (Date.now() - entry.timestamp > entry.ttl) {
          this.delete(key); // Async delete
          resolve(null);
          return;
        }

        resolve(entry.data as T);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBCache = new IndexedDBCache();

// ============================================================
// 4. Unified Cache API (Smart multi-layer routing)
// ============================================================

export class CacheManager {
  /**
   * Intelligently cache data across layers
   * - Hot data (< 1KB): Memory only
   * - Warm data (< 100KB): Memory + LocalStorage
   * - Cold data (> 100KB): IndexedDB
   */
  async set<T>(key: string, data: T, options?: {
    ttl?: number;
    layer?: 'memory' | 'localStorage' | 'indexedDB' | 'auto';
  }): Promise<void> {
    const { ttl = 300000, layer = 'auto' } = options || {};

    // Auto-detect best layer
    let targetLayer = layer;
    if (layer === 'auto') {
      const dataSize = JSON.stringify(data).length;

      if (dataSize < 1024) {
        targetLayer = 'memory';
      } else if (dataSize < 102400) {
        targetLayer = 'localStorage';
      } else {
        targetLayer = 'indexedDB';
      }
    }

    // Write to appropriate layer(s)
    if (targetLayer === 'memory') {
      memoryCache.set(key, data, ttl);
    } else if (targetLayer === 'localStorage') {
      memoryCache.set(key, data, ttl); // Also cache in memory
      localStorageCache.set(key, data, ttl);
    } else if (targetLayer === 'indexedDB') {
      memoryCache.set(key, data, Math.min(ttl, 60000)); // Short memory cache
      await indexedDBCache.set(key, data, ttl);
    }
  }

  /**
   * Get from cache with automatic fallback
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory first (fastest)
    let data = memoryCache.get<T>(key);
    if (data !== null) return data;

    // Try localStorage
    data = localStorageCache.get<T>(key);
    if (data !== null) {
      // Promote to memory
      memoryCache.set(key, data, 60000);
      return data;
    }

    // Try IndexedDB
    data = await indexedDBCache.get<T>(key);
    if (data !== null) {
      // Promote to memory
      memoryCache.set(key, data, 60000);
      return data;
    }

    return null;
  }

  /**
   * Delete from all layers
   */
  async delete(key: string): Promise<void> {
    memoryCache.delete(key);
    localStorageCache.delete(key);
    await indexedDBCache.delete(key);
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    memoryCache.clear();
    localStorageCache.clear();
    await indexedDBCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memory: memoryCache.getStats(),
      localStorage: {
        size: typeof window !== 'undefined'
          ? Object.keys(localStorage).filter((k) =>
              k.startsWith('sardag_cache_')
            ).length
          : 0,
      },
    };
  }
}

export const cache = new CacheManager();

// ============================================================
// 5. Specialized Caches for Trading Data
// ============================================================

/**
 * Candles Cache - Aggressive caching for chart data
 */
export class CandlesCache {
  private getCacheKey(symbol: string, interval: string, limit: number): string {
    return `candles_${symbol}_${interval}_${limit}`;
  }

  async set(symbol: string, interval: string, limit: number, data: any[]): Promise<void> {
    const key = this.getCacheKey(symbol, interval, limit);
    await cache.set(key, data, {
      ttl: this.getTTL(interval),
      layer: 'auto',
    });
  }

  async get(symbol: string, interval: string, limit: number): Promise<any[] | null> {
    const key = this.getCacheKey(symbol, interval, limit);
    return cache.get<any[]>(key);
  }

  private getTTL(interval: string): number {
    // Dynamic TTL based on interval
    const ttls: Record<string, number> = {
      '1m': 30000,    // 30 seconds
      '5m': 60000,    // 1 minute
      '15m': 180000,  // 3 minutes
      '30m': 300000,  // 5 minutes
      '1h': 600000,   // 10 minutes
      '4h': 1800000,  // 30 minutes
      '1d': 3600000,  // 1 hour
      '1w': 7200000,  // 2 hours
    };

    return ttls[interval] || 300000;
  }
}

export const candlesCache = new CandlesCache();

/**
 * Indicator Cache - Expensive calculations
 */
export class IndicatorCache {
  private getCacheKey(symbol: string, interval: string, indicator: string): string {
    return `indicator_${symbol}_${interval}_${indicator}`;
  }

  async set(
    symbol: string,
    interval: string,
    indicator: string,
    data: any
  ): Promise<void> {
    const key = this.getCacheKey(symbol, interval, indicator);
    await cache.set(key, data, {
      ttl: 120000, // 2 minutes
      layer: 'memory',
    });
  }

  async get(symbol: string, interval: string, indicator: string): Promise<any | null> {
    const key = this.getCacheKey(symbol, interval, indicator);
    return cache.get(key);
  }
}

export const indicatorCache = new IndicatorCache();

// ============================================================
// Export All
// ============================================================

export const Cache = {
  memory: memoryCache,
  localStorage: localStorageCache,
  indexedDB: indexedDBCache,
  manager: cache,
  candles: candlesCache,
  indicator: indicatorCache,
};

export default Cache;
