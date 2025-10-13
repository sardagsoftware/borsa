/**
 * SHARD_8.2 - Encrypted Location Streaming
 * End-to-end encrypted location data transmission
 *
 * Security: AES-256-GCM for location data, ephemeral keys
 * White Hat: No server-side plaintext access
 */

import { Location } from './geolocation';
import { toArrayBuffer, createUint8Array } from '../crypto/utils';

export interface EncryptedLocation {
  ciphertext: string; // Base64
  iv: string; // Base64
  authTag: string; // Base64
  timestamp: number;
}

/**
 * Encrypt location data
 */
export async function encryptLocation(
  location: Location,
  key: Uint8Array
): Promise<EncryptedLocation> {
  try {
    // Serialize location
    const plaintext = JSON.stringify(location);
    const plaintextBytes = new TextEncoder().encode(plaintext);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(key),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(iv),
        tagLength: 128
      },
      cryptoKey,
      toArrayBuffer(plaintextBytes)
    );

    const encryptedBytes = createUint8Array(encrypted);
    const ciphertext = encryptedBytes.slice(0, -16);
    const authTag = encryptedBytes.slice(-16);

    return {
      ciphertext: arrayToBase64(ciphertext),
      iv: arrayToBase64(iv),
      authTag: arrayToBase64(authTag),
      timestamp: Date.now()
    };
  } catch (error: any) {
    console.error('[LOCATION-CRYPTO] Encryption error:', error);
    throw new Error('Failed to encrypt location');
  }
}

/**
 * Decrypt location data
 */
export async function decryptLocation(
  encrypted: EncryptedLocation,
  key: Uint8Array
): Promise<Location> {
  try {
    // Parse Base64
    const ciphertext = base64ToArray(encrypted.ciphertext);
    const iv = base64ToArray(encrypted.iv);
    const authTag = base64ToArray(encrypted.authTag);

    // Combine ciphertext + authTag
    const combined = new Uint8Array(ciphertext.length + authTag.length);
    combined.set(ciphertext, 0);
    combined.set(authTag, ciphertext.length);

    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(key),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(iv),
        tagLength: 128
      },
      cryptoKey,
      toArrayBuffer(combined)
    );

    // Parse location
    const plaintext = new TextDecoder().decode(decrypted);
    return JSON.parse(plaintext);
  } catch (error: any) {
    console.error('[LOCATION-CRYPTO] Decryption error:', error);
    throw new Error('Failed to decrypt location');
  }
}

/**
 * Generate ephemeral location key
 */
export function generateLocationKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Convert array to Base64
 */
function arrayToBase64(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array));
}

/**
 * Convert Base64 to array
 */
function base64ToArray(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
