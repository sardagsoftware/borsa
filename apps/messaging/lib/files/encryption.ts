/**
 * SHARD_5.1 - Client-Side File Encryption
 * AES-256-GCM encryption for file attachments
 *
 * Security: Files encrypted before upload, server never sees plaintext
 * White Hat: Authenticated encryption (AEAD), random IVs, key derivation
 */

import { toArrayBuffer, createUint8Array } from '../crypto/utils';

export interface EncryptedFile {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  key: Uint8Array;
  authTag: Uint8Array;
  filename: string;
  mimeType: string;
  size: number;
  originalSize: number;
}

export interface FileMetadata {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  encryptedSize: number;
  uploadedAt: number;
  expiresAt: number;
}

/**
 * Encrypt file using AES-256-GCM
 * Client-side encryption before upload
 */
export async function encryptFile(
  file: File
): Promise<EncryptedFile> {
  try {
    console.log(`[FILE-CRYPTO] 🔒 Encrypting: ${file.name} (${file.size} bytes)`);

    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer();
    const plaintext = new Uint8Array(fileData);

    // Generate random encryption key (256-bit)
    const key = crypto.getRandomValues(new Uint8Array(32));

    // Generate random IV (96-bit for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Import key for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(key),
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    );

    // Encrypt with AES-GCM (includes authentication tag)
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(iv),
        tagLength: 128 // 16 bytes auth tag
      },
      cryptoKey,
      toArrayBuffer(plaintext)
    );

    const encryptedBytes = createUint8Array(encrypted);

    // GCM appends auth tag at the end
    const ciphertext = encryptedBytes.slice(0, -16);
    const authTag = encryptedBytes.slice(-16);

    console.log(`[FILE-CRYPTO] ✅ Encrypted: ${ciphertext.length} bytes`);

    return {
      ciphertext,
      iv,
      key,
      authTag,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: ciphertext.length + authTag.length,
      originalSize: plaintext.length
    };
  } catch (error: any) {
    console.error('[FILE-CRYPTO] ❌ Encryption error:', error);
    throw new Error(`Failed to encrypt file: ${error.message}`);
  }
}

/**
 * Decrypt file using AES-256-GCM
 * Client-side decryption after download
 */
export async function decryptFile(
  encrypted: EncryptedFile
): Promise<Uint8Array> {
  try {
    console.log(`[FILE-CRYPTO] 🔓 Decrypting: ${encrypted.filename}`);

    // Import key for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(encrypted.key),
      { name: 'AES-GCM', length: 256 },
      true,
      ['decrypt']
    );

    // Combine ciphertext + auth tag
    const combined = new Uint8Array(encrypted.ciphertext.length + encrypted.authTag.length);
    combined.set(encrypted.ciphertext, 0);
    combined.set(encrypted.authTag, encrypted.ciphertext.length);

    // Decrypt with AES-GCM (verifies auth tag)
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(encrypted.iv),
        tagLength: 128
      },
      cryptoKey,
      toArrayBuffer(combined)
    );

    console.log(`[FILE-CRYPTO] ✅ Decrypted: ${decrypted.byteLength} bytes`);

    return createUint8Array(decrypted);
  } catch (error: any) {
    console.error('[FILE-CRYPTO] ❌ Decryption error:', error);
    throw new Error('Failed to decrypt file (invalid key or corrupted data)');
  }
}

/**
 * Encrypt file chunk (for streaming large files)
 */
export async function encryptChunk(
  chunk: Uint8Array,
  key: Uint8Array,
  chunkIndex: number
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array; authTag: Uint8Array }> {
  // Generate unique IV for each chunk (use chunk index as nonce)
  const iv = new Uint8Array(12);
  const view = new DataView(iv.buffer);
  view.setUint32(0, chunkIndex, false);
  crypto.getRandomValues(iv.subarray(4)); // Random for remaining bytes

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(key),
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
      tagLength: 128
    },
    cryptoKey,
    toArrayBuffer(chunk)
  );

  const encryptedBytes = createUint8Array(encrypted);
  const ciphertext = encryptedBytes.slice(0, -16);
  const authTag = encryptedBytes.slice(-16);

  return { ciphertext, iv, authTag };
}

/**
 * Decrypt file chunk
 */
export async function decryptChunk(
  ciphertext: Uint8Array,
  authTag: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(key),
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  );

  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
      tagLength: 128
    },
    cryptoKey,
    toArrayBuffer(combined)
  );

  return createUint8Array(decrypted);
}

/**
 * Generate file encryption key from password (PBKDF2)
 */
export async function deriveFileKey(
  password: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    256
  );

  return createUint8Array(derivedBits);
}

/**
 * Hash file for integrity check (SHA-256)
 */
export async function hashFile(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', toArrayBuffer(data));
  const hashArray = Array.from(createUint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create downloadable blob from decrypted data
 */
export function createDownloadBlob(
  data: Uint8Array,
  mimeType: string
): Blob {
  return new Blob([toArrayBuffer(data)], { type: mimeType });
}

/**
 * Create object URL for download
 */
export function createDownloadURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke object URL (cleanup)
 */
export function revokeDownloadURL(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Trigger browser download
 */
export function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file icon emoji based on MIME type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  if (mimeType.includes('text/')) return '📝';
  return '📎';
}
