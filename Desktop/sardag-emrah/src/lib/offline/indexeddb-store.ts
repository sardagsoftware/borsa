/**
 * INDEXEDDB OFFLINE STORE
 *
 * Persistent storage for offline-first functionality
 * Stores:
 * - Market data (prices, sparklines)
 * - Signal analysis
 * - User preferences
 * - Scanner results
 */

const DB_NAME = 'ukalai-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
  MARKET_DATA: 'market_data',
  SIGNALS: 'signals',
  PREFERENCES: 'preferences',
  SCANNER_RESULTS: 'scanner_results',
  TRADITIONAL_MARKETS: 'traditional_markets',
} as const;

interface MarketDataEntry {
  symbol: string;
  data: any;
  timestamp: number;
}

interface SignalEntry {
  symbol: string;
  timeframe: string;
  analysis: any;
  timestamp: number;
}

interface PreferenceEntry {
  key: string;
  value: any;
  timestamp: number;
}

interface ScannerResultEntry {
  scanId: string;
  results: any[];
  timestamp: number;
}

interface TraditionalMarketEntry {
  symbol: string;
  data: any;
  timestamp: number;
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Market Data store
      if (!db.objectStoreNames.contains(STORES.MARKET_DATA)) {
        const marketStore = db.createObjectStore(STORES.MARKET_DATA, { keyPath: 'symbol' });
        marketStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Signals store
      if (!db.objectStoreNames.contains(STORES.SIGNALS)) {
        const signalStore = db.createObjectStore(STORES.SIGNALS, { keyPath: ['symbol', 'timeframe'] });
        signalStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Preferences store
      if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
        db.createObjectStore(STORES.PREFERENCES, { keyPath: 'key' });
      }

      // Scanner Results store
      if (!db.objectStoreNames.contains(STORES.SCANNER_RESULTS)) {
        const scannerStore = db.createObjectStore(STORES.SCANNER_RESULTS, { keyPath: 'scanId' });
        scannerStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Traditional Markets store
      if (!db.objectStoreNames.contains(STORES.TRADITIONAL_MARKETS)) {
        const tradStore = db.createObjectStore(STORES.TRADITIONAL_MARKETS, { keyPath: 'symbol' });
        tradStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Generic get operation
 */
export async function getFromStore<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[IndexedDB] Get error:', error);
    return null;
  }
}

/**
 * Generic put operation
 */
export async function putInStore<T>(storeName: string, value: T): Promise<boolean> {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(value);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[IndexedDB] Put error:', error);
    return false;
  }
}

/**
 * Generic delete operation
 */
export async function deleteFromStore(storeName: string, key: IDBValidKey): Promise<boolean> {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[IndexedDB] Delete error:', error);
    return false;
  }
}

/**
 * Get all from store
 */
export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[IndexedDB] GetAll error:', error);
    return [];
  }
}

/**
 * Clear old entries (older than 24 hours)
 */
export async function clearOldEntries(storeName: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const index = store.index('timestamp');

    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    return new Promise((resolve, reject) => {
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.timestamp < cutoff) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[IndexedDB] Clear old entries error:', error);
  }
}

/**
 * Market Data helpers
 */
export const MarketDataStore = {
  async get(symbol: string) {
    return getFromStore<MarketDataEntry>(STORES.MARKET_DATA, symbol);
  },

  async set(symbol: string, data: any) {
    return putInStore<MarketDataEntry>(STORES.MARKET_DATA, {
      symbol,
      data,
      timestamp: Date.now(),
    });
  },

  async getAll() {
    return getAllFromStore<MarketDataEntry>(STORES.MARKET_DATA);
  },

  async clearOld() {
    return clearOldEntries(STORES.MARKET_DATA);
  },
};

/**
 * Signal Store helpers
 */
export const SignalStore = {
  async get(symbol: string, timeframe: string) {
    return getFromStore<SignalEntry>(STORES.SIGNALS, [symbol, timeframe]);
  },

  async set(symbol: string, timeframe: string, analysis: any) {
    return putInStore<SignalEntry>(STORES.SIGNALS, {
      symbol,
      timeframe,
      analysis,
      timestamp: Date.now(),
    });
  },

  async getAll() {
    return getAllFromStore<SignalEntry>(STORES.SIGNALS);
  },

  async clearOld() {
    return clearOldEntries(STORES.SIGNALS);
  },
};

/**
 * Traditional Markets Store helpers
 */
export const TraditionalMarketStore = {
  async get(symbol: string) {
    return getFromStore<TraditionalMarketEntry>(STORES.TRADITIONAL_MARKETS, symbol);
  },

  async set(symbol: string, data: any) {
    return putInStore<TraditionalMarketEntry>(STORES.TRADITIONAL_MARKETS, {
      symbol,
      data,
      timestamp: Date.now(),
    });
  },

  async getAll() {
    return getAllFromStore<TraditionalMarketEntry>(STORES.TRADITIONAL_MARKETS);
  },

  async clearOld() {
    return clearOldEntries(STORES.TRADITIONAL_MARKETS);
  },
};

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Get database stats
 */
export async function getDBStats() {
  if (!isIndexedDBAvailable()) {
    return { available: false };
  }

  try {
    const marketData = await MarketDataStore.getAll();
    const signals = await SignalStore.getAll();
    const traditionalMarkets = await TraditionalMarketStore.getAll();

    return {
      available: true,
      marketDataCount: marketData.length,
      signalsCount: signals.length,
      traditionalMarketsCount: traditionalMarkets.length,
      totalEntries: marketData.length + signals.length + traditionalMarkets.length,
    };
  } catch (error) {
    console.error('[IndexedDB] Stats error:', error);
    return { available: true, error: true };
  }
}
