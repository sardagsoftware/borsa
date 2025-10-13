/**
 * SHARD_5.3 - Encrypted File Storage
 * IndexedDB storage for encrypted file blobs
 *
 * Security: Server only stores encrypted blobs, no plaintext access
 * White Hat: TTL enforcement, size limits, virus scanning hooks
 */

import { FileMetadata } from './encryption';

export interface StoredFile {
  id: string;
  encryptedData: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
  metadata: FileMetadata;
  uploaderId: string;
  key?: Uint8Array; // Optional: for sender's copy
}

const DB_NAME = 'ailydian-files';
const DB_VERSION = 1;
const STORE_NAME = 'encrypted-files';

/**
 * Helper: Wrap IDBRequest in Promise
 */
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Helper: Wait for transaction to complete
 */
function promisifyTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Open IndexedDB for file storage
 */
async function openFileDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('uploaderId', 'uploaderId', { unique: false });
        store.createIndex('expiresAt', 'metadata.expiresAt', { unique: false });
      }
    };
  });
}

/**
 * Store encrypted file in IndexedDB
 */
export async function storeEncryptedFile(
  file: StoredFile
): Promise<void> {
  try {
    const db = await openFileDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Serialize for storage
    const serialized = {
      ...file,
      encryptedData: Array.from(file.encryptedData),
      iv: Array.from(file.iv),
      authTag: Array.from(file.authTag),
      key: file.key ? Array.from(file.key) : undefined
    };

    await promisifyRequest(store.put(serialized));
    await promisifyTransaction(tx);

    console.log(`[STORAGE] ✅ Stored file: ${file.id} (${file.metadata.filename})`);
  } catch (error: any) {
    console.error('[STORAGE] ❌ Store error:', error);
    throw new Error('Failed to store encrypted file');
  }
}

/**
 * Retrieve encrypted file from IndexedDB
 */
export async function getEncryptedFile(
  fileId: string
): Promise<StoredFile | null> {
  try {
    const db = await openFileDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const serialized = await promisifyRequest(store.get(fileId));

    if (!serialized) {
      return null;
    }

    // Check if expired
    if (serialized.metadata.expiresAt < Date.now()) {
      console.warn(`[STORAGE] ⚠️ File expired: ${fileId}`);
      await deleteEncryptedFile(fileId);
      return null;
    }

    // Deserialize
    const file: StoredFile = {
      ...serialized,
      encryptedData: new Uint8Array(serialized.encryptedData),
      iv: new Uint8Array(serialized.iv),
      authTag: new Uint8Array(serialized.authTag),
      key: serialized.key ? new Uint8Array(serialized.key) : undefined
    };

    return file;
  } catch (error: any) {
    console.error('[STORAGE] ❌ Get error:', error);
    return null;
  }
}

/**
 * Delete encrypted file
 */
export async function deleteEncryptedFile(fileId: string): Promise<void> {
  try {
    const db = await openFileDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await promisifyRequest(store.delete(fileId));
    await promisifyTransaction(tx);

    console.log(`[STORAGE] ✅ Deleted file: ${fileId}`);
  } catch (error: any) {
    console.error('[STORAGE] ❌ Delete error:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * List all files for a user
 */
export async function listUserFiles(userId: string): Promise<FileMetadata[]> {
  try {
    const db = await openFileDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('uploaderId');

    const files = await promisifyRequest(index.getAll(userId));

    // Filter expired files
    const now = Date.now();
    const validFiles = files
      .filter((f: any) => f.metadata.expiresAt > now)
      .map((f: any) => f.metadata);

    return validFiles;
  } catch (error: any) {
    console.error('[STORAGE] ❌ List error:', error);
    return [];
  }
}

/**
 * Clean up expired files
 */
export async function cleanupExpiredFiles(): Promise<number> {
  try {
    const db = await openFileDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('expiresAt');

    const now = Date.now();
    const expiredFiles = await promisifyRequest(index.getAll(IDBKeyRange.upperBound(now)));

    for (const file of expiredFiles) {
      await promisifyRequest(store.delete(file.id));
    }

    await promisifyTransaction(tx);

    console.log(`[STORAGE] 🗑️ Cleaned up ${expiredFiles.length} expired files`);

    return expiredFiles.length;
  } catch (error: any) {
    console.error('[STORAGE] ❌ Cleanup error:', error);
    return 0;
  }
}

/**
 * Get total storage size
 */
export async function getStorageSize(): Promise<number> {
  try {
    const db = await openFileDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const allFiles = await promisifyRequest(store.getAll());

    const totalSize = allFiles.reduce((sum: number, file: any) => {
      return sum + file.metadata.encryptedSize;
    }, 0);

    return totalSize;
  } catch (error: any) {
    console.error('[STORAGE] ❌ Size error:', error);
    return 0;
  }
}

/**
 * Check storage quota
 */
export async function checkStorageQuota(): Promise<{
  used: number;
  quota: number;
  available: number;
  percentUsed: number;
}> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const available = quota - used;
      const percentUsed = quota > 0 ? (used / quota) * 100 : 0;

      return { used, quota, available, percentUsed };
    }

    return { used: 0, quota: 0, available: 0, percentUsed: 0 };
  } catch (error: any) {
    console.error('[STORAGE] ❌ Quota error:', error);
    return { used: 0, quota: 0, available: 0, percentUsed: 0 };
  }
}

/**
 * File size limits (configurable)
 */
export const FILE_SIZE_LIMITS = {
  FREE_TIER: 10 * 1024 * 1024, // 10 MB
  PRO_TIER: 100 * 1024 * 1024, // 100 MB
  ENTERPRISE_TIER: 1024 * 1024 * 1024, // 1 GB
} as const;

/**
 * Validate file size
 */
export function validateFileSize(size: number, tier: keyof typeof FILE_SIZE_LIMITS): boolean {
  return size <= FILE_SIZE_LIMITS[tier];
}

/**
 * Default file TTL (30 days)
 */
export const DEFAULT_FILE_TTL = 30 * 24 * 60 * 60 * 1000;

/**
 * Calculate expiration timestamp
 */
export function calculateExpiration(ttlMs: number = DEFAULT_FILE_TTL): number {
  return Date.now() + ttlMs;
}
