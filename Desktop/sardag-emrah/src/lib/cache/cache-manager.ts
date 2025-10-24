/**
 * SMART CACHE MANAGER
 *
 * Multi-tier caching system for optimal performance:
 *
 * TIER 1: Memory Cache (fastest, volatile)
 * - In-memory Map for instant access
 * - Cleared on page reload
 * - Used for frequently accessed data
 *
 * TIER 2: localStorage (persistent, 5-10 MB limit)
 * - Persists across sessions
 * - Used for small, frequently used data
 * - Automatic eviction on quota exceeded
 *
 * TIER 3: IndexedDB (persistent, unlimited)
 * - Persists across sessions
 * - Used for large datasets (candles, signals)
 * - Structured storage with indexes
 *
 * STRATEGIES:
 * - Stale-While-Revalidate: Serve cached, fetch fresh in background
 * - Time-Based Invalidation: TTL (Time To Live)
 * - Manual Invalidation: Clear specific keys
 * - LRU Eviction: Least Recently Used
 *
 * WHITE-HAT:
 * - User can clear all cache
 * - Privacy-first (no external storage)
 * - Transparent data usage
 *
 * REDIS-READY:
 * - Interface designed for future Redis integration
 * - Same API works with Redis backend
 */

export interface CacheOptions {
  ttl?: number;           // Time to live (ms), default: 5 minutes
  tier?: 'memory' | 'localStorage' | 'indexedDB'; // Storage tier
  staleWhileRevalidate?: boolean; // Serve stale while fetching fresh
  maxAge?: number;        // Maximum age before considered stale (ms)
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  tier: 'memory' | 'localStorage' | 'indexedDB';
  accessCount: number;
  lastAccessed: number;
}

class CacheManager {
  // TIER 1: Memory cache
  private memoryCache = new Map<string, CacheEntry<any>>();

  // TIER 2: localStorage cache (managed separately)
  private readonly LOCAL_STORAGE_PREFIX = 'ukalai_cache_';

  // TIER 3: IndexedDB
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'UkalAICache';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'cache';

  // Default options
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_MAX_AGE = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.initIndexedDB();
    this.startCleanupInterval();
  }

  /**
   * Initialize IndexedDB
   */
  private async initIndexedDB(): Promise<void> {
    if (typeof window === 'undefined') return; // SSR safety

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('[Cache] IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[Cache] ✅ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('tier', 'tier', { unique: false });
        }
      };
    });
  }

  /**
   * Get value from cache
   *
   * Priority: memory → localStorage → IndexedDB
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    // Try memory first (fastest)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      this.updateAccessMetrics(memoryEntry);

      // Stale-while-revalidate
      if (options?.staleWhileRevalidate && this.isStale(memoryEntry, options.maxAge)) {
        console.log(`[Cache] 🔄 Serving stale data for "${key}", revalidating...`);
        // Return stale data immediately, caller should revalidate
      }

      return memoryEntry.value as T;
    }

    // Try localStorage (fast)
    try {
      const localStorageEntry = this.getFromLocalStorage<T>(key);
      if (localStorageEntry && this.isValid(localStorageEntry)) {
        // Promote to memory cache
        this.memoryCache.set(key, localStorageEntry);
        this.updateAccessMetrics(localStorageEntry);
        return localStorageEntry.value;
      }
    } catch (error) {
      console.warn('[Cache] localStorage read failed:', error);
    }

    // Try IndexedDB (slower but unlimited)
    try {
      const indexedDBEntry = await this.getFromIndexedDB<T>(key);
      if (indexedDBEntry && this.isValid(indexedDBEntry)) {
        // Promote to memory cache
        this.memoryCache.set(key, indexedDBEntry);
        this.updateAccessMetrics(indexedDBEntry);
        return indexedDBEntry.value;
      }
    } catch (error) {
      console.warn('[Cache] IndexedDB read failed:', error);
    }

    return null;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const tier = options?.tier || this.determineTier(value);
    const ttl = options?.ttl || this.DEFAULT_TTL;

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      tier,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Always cache in memory for fast access
    this.memoryCache.set(key, entry);

    // Also persist to selected tier
    if (tier === 'localStorage') {
      try {
        this.setToLocalStorage(entry);
      } catch (error) {
        console.warn('[Cache] localStorage write failed, falling back to IndexedDB:', error);
        await this.setToIndexedDB(entry);
      }
    } else if (tier === 'indexedDB') {
      await this.setToIndexedDB(entry);
    }

    console.log(`[Cache] ✅ Cached "${key}" in ${tier} (TTL: ${ttl}ms)`);
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    this.deleteFromLocalStorage(key);
    await this.deleteFromIndexedDB(key);
    console.log(`[Cache] 🗑️ Deleted "${key}"`);
  }

  /**
   * Clear all cache (user privacy control)
   */
  async clearAll(): Promise<void> {
    // Clear memory
    this.memoryCache.clear();

    // Clear localStorage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.LOCAL_STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }

    // Clear IndexedDB
    if (this.db) {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log('[Cache] 🗑️ All cache cleared');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memoryCount: number;
    localStorageCount: number;
    indexedDBCount: number;
    totalSize: number; // Approximate in bytes
  }> {
    const memoryCount = this.memoryCache.size;

    let localStorageCount = 0;
    let localStorageSize = 0;
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.LOCAL_STORAGE_PREFIX)) {
          localStorageCount++;
          localStorageSize += localStorage.getItem(key)?.length || 0;
        }
      });
    }

    let indexedDBCount = 0;
    if (this.db) {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      indexedDBCount = await new Promise<number>((resolve) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
    }

    return {
      memoryCount,
      localStorageCount,
      indexedDBCount,
      totalSize: localStorageSize,
    };
  }

  /**
   * Check if entry is valid (not expired)
   */
  private isValid(entry: CacheEntry<any>): boolean {
    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  /**
   * Check if entry is stale (valid but old)
   */
  private isStale(entry: CacheEntry<any>, maxAge?: number): boolean {
    const age = Date.now() - entry.timestamp;
    const threshold = maxAge || this.DEFAULT_MAX_AGE;
    return age > threshold && age < entry.ttl;
  }

  /**
   * Update access metrics for LRU
   */
  private updateAccessMetrics(entry: CacheEntry<any>): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  /**
   * Determine optimal storage tier based on data size
   */
  private determineTier(value: any): 'memory' | 'localStorage' | 'indexedDB' {
    const size = JSON.stringify(value).length;

    // Small data (< 1 KB): localStorage
    if (size < 1024) return 'localStorage';

    // Large data (> 100 KB): IndexedDB
    if (size > 100 * 1024) return 'indexedDB';

    // Medium data: localStorage (with IndexedDB fallback)
    return 'localStorage';
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 2: localStorage methods
  // ═══════════════════════════════════════════════════════════

  private getFromLocalStorage<T>(key: string): CacheEntry<T> | null {
    if (typeof window === 'undefined') return null;

    const item = localStorage.getItem(this.LOCAL_STORAGE_PREFIX + key);
    if (!item) return null;

    try {
      return JSON.parse(item) as CacheEntry<T>;
    } catch {
      return null;
    }
  }

  private setToLocalStorage<T>(entry: CacheEntry<T>): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        this.LOCAL_STORAGE_PREFIX + entry.key,
        JSON.stringify(entry)
      );
    } catch (error) {
      // Quota exceeded, evict LRU entries
      this.evictLRUFromLocalStorage();
      // Retry
      localStorage.setItem(
        this.LOCAL_STORAGE_PREFIX + entry.key,
        JSON.stringify(entry)
      );
    }
  }

  private deleteFromLocalStorage(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.LOCAL_STORAGE_PREFIX + key);
  }

  private evictLRUFromLocalStorage(): void {
    if (typeof window === 'undefined') return;

    const entries: Array<{ key: string; entry: CacheEntry<any> }> = [];
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(this.LOCAL_STORAGE_PREFIX)) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const entry = JSON.parse(item);
            entries.push({ key, entry });
          } catch {
            // Invalid entry, remove it
            localStorage.removeItem(key);
          }
        }
      }
    });

    // Sort by lastAccessed (LRU)
    entries.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

    // Remove oldest 25%
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key);
    }

    console.log(`[Cache] 🗑️ Evicted ${toRemove} LRU entries from localStorage`);
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 3: IndexedDB methods
  // ═══════════════════════════════════════════════════════════

  private async getFromIndexedDB<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async setToIndexedDB<T>(entry: CacheEntry<T>): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Cleanup & Maintenance
  // ═══════════════════════════════════════════════════════════

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    if (typeof window === 'undefined') return;

    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Remove expired entries from all tiers
   */
  private async cleanup(): Promise<void> {
    let removed = 0;

    // Cleanup memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key);
        removed++;
      }
    }

    // Cleanup localStorage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.LOCAL_STORAGE_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const entry = JSON.parse(item);
              if (!this.isValid(entry)) {
                localStorage.removeItem(key);
                removed++;
              }
            } catch {
              localStorage.removeItem(key);
              removed++;
            }
          }
        }
      });
    }

    // Cleanup IndexedDB
    if (this.db) {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value as CacheEntry<any>;
          if (!this.isValid(entry)) {
            cursor.delete();
            removed++;
          }
          cursor.continue();
        }
      };
    }

    if (removed > 0) {
      console.log(`[Cache] 🗑️ Cleanup: Removed ${removed} expired entries`);
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Export types
export type { CacheManager };
