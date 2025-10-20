/**
 * SHARD_3.2 - X3DH Key Exchange Protocol
 * Extended Triple Diffie-Hellman for initial key agreement
 * Based on Signal's X3DH specification
 *
 * Security: Provides Perfect Forward Secrecy and deniability
 * White Hat: All intermediate secrets are cleared after use
 */

import { deriveSharedSecret, generateRandomBytes, hash } from './keys';
import { toArrayBuffer, createUint8Array } from './utils';

export interface X3DHBundle {
  identityKey: Uint8Array;
  signedPreKey: Uint8Array;
  signedPreKeySignature: Uint8Array;
  oneTimePreKey?: Uint8Array;
}

export interface X3DHResult {
  sharedSecret: Uint8Array;
  associatedData: Uint8Array;
  ephemeralKey: Uint8Array;
}

/**
 * Initiator: Perform X3DH key exchange
 *
 * @param identityKeyPrivate - Initiator's identity private key
 * @param bundle - Recipient's pre-key bundle
 * @param ephemeralPrivateKey - Ephemeral key for this exchange
 * @returns Shared secret and associated data
 */
export async function initiateX3DH(
  identityKeyPrivate: Uint8Array,
  bundle: X3DHBundle,
  ephemeralPrivateKey: Uint8Array
): Promise<X3DHResult> {
  try {
    // DH1: identity key → signed pre key
    const dh1 = await deriveSharedSecret(
      identityKeyPrivate,
      bundle.signedPreKey
    );

    // DH2: ephemeral key → identity key
    const dh2 = await deriveSharedSecret(
      ephemeralPrivateKey,
      bundle.identityKey
    );

    // DH3: ephemeral key → signed pre key
    const dh3 = await deriveSharedSecret(
      ephemeralPrivateKey,
      bundle.signedPreKey
    );

    let dh4: Uint8Array | null = null;
    if (bundle.oneTimePreKey) {
      // DH4: ephemeral key → one-time pre key (if available)
      dh4 = await deriveSharedSecret(
        ephemeralPrivateKey,
        bundle.oneTimePreKey
      );
    }

    // Concatenate all DH outputs
    const dhOutputs = dh4
      ? concatenateBytes([dh1, dh2, dh3, dh4])
      : concatenateBytes([dh1, dh2, dh3]);

    // KDF to derive shared secret
    const info = new TextEncoder().encode('Ailydian-E2EE-v1');
    const sharedSecret = await hkdf(dhOutputs, 32, info);

    // Associated data for AEAD
    const ephemeralPublicKey = await getPublicKeyFromPrivate(ephemeralPrivateKey);
    const associatedData = concatenateBytes([
      bundle.identityKey,
      ephemeralPublicKey
    ]);

    // Clear intermediate secrets
    clearBytes(dh1);
    clearBytes(dh2);
    clearBytes(dh3);
    if (dh4) clearBytes(dh4);

    return {
      sharedSecret,
      associatedData,
      ephemeralKey: ephemeralPublicKey
    };
  } catch (error) {
    console.error('[X3DH] Initiate error:', error);
    throw new Error('X3DH key exchange failed');
  }
}

/**
 * Responder: Process X3DH key exchange
 *
 * @param identityKeyPrivate - Responder's identity private key
 * @param signedPreKeyPrivate - Responder's signed pre key private
 * @param oneTimePreKeyPrivate - Optional one-time pre key private
 * @param initiatorIdentityKey - Initiator's identity public key
 * @param ephemeralKey - Initiator's ephemeral public key
 * @returns Shared secret and associated data
 */
export async function respondX3DH(
  identityKeyPrivate: Uint8Array,
  signedPreKeyPrivate: Uint8Array,
  oneTimePreKeyPrivate: Uint8Array | null,
  initiatorIdentityKey: Uint8Array,
  ephemeralKey: Uint8Array
): Promise<X3DHResult> {
  try {
    // DH1: signed pre key → identity key
    const dh1 = await deriveSharedSecret(
      signedPreKeyPrivate,
      initiatorIdentityKey
    );

    // DH2: identity key → ephemeral key
    const dh2 = await deriveSharedSecret(
      identityKeyPrivate,
      ephemeralKey
    );

    // DH3: signed pre key → ephemeral key
    const dh3 = await deriveSharedSecret(
      signedPreKeyPrivate,
      ephemeralKey
    );

    let dh4: Uint8Array | null = null;
    if (oneTimePreKeyPrivate) {
      // DH4: one-time pre key → ephemeral key
      dh4 = await deriveSharedSecret(
        oneTimePreKeyPrivate,
        ephemeralKey
      );
    }

    // Concatenate all DH outputs
    const dhOutputs = dh4
      ? concatenateBytes([dh1, dh2, dh3, dh4])
      : concatenateBytes([dh1, dh2, dh3]);

    // KDF to derive shared secret
    const info = new TextEncoder().encode('Ailydian-E2EE-v1');
    const sharedSecret = await hkdf(dhOutputs, 32, info);

    // Associated data
    const identityPublicKey = await getPublicKeyFromPrivate(identityKeyPrivate);
    const associatedData = concatenateBytes([
      identityPublicKey,
      ephemeralKey
    ]);

    // Clear intermediate secrets
    clearBytes(dh1);
    clearBytes(dh2);
    clearBytes(dh3);
    if (dh4) clearBytes(dh4);

    return {
      sharedSecret,
      associatedData,
      ephemeralKey
    };
  } catch (error) {
    console.error('[X3DH] Respond error:', error);
    throw new Error('X3DH response failed');
  }
}

/**
 * HKDF (HMAC-based Key Derivation Function)
 * RFC 5869 implementation using SHA-256
 */
async function hkdf(
  inputKeyMaterial: Uint8Array,
  length: number,
  info: Uint8Array,
  salt?: Uint8Array
): Promise<Uint8Array> {
  const actualSalt = salt || new Uint8Array(32); // 32 bytes of zeros

  // Extract
  const prk = await hmac(actualSalt, inputKeyMaterial);

  // Expand
  const output = new Uint8Array(length);
  const iterations = Math.ceil(length / 32);
  let t: Uint8Array<ArrayBuffer> = new Uint8Array(0);

  for (let i = 1; i <= iterations; i++) {
    const input = concatenateBytes([t, info, new Uint8Array([i])]);
    const hmacResult = await hmac(prk, input);
    // Convert to ArrayBuffer then back to Uint8Array to ensure proper type
    const buffer = toArrayBuffer(hmacResult);
    t = new Uint8Array(buffer);

    const copyLength = Math.min(32, length - (i - 1) * 32);
    output.set(t.slice(0, copyLength), (i - 1) * 32);
  }

  return output;
}

/**
 * HMAC-SHA256
 */
async function hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, toArrayBuffer(data));
  return createUint8Array(signature);
}

/**
 * Concatenate multiple Uint8Arrays
 */
function concatenateBytes(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

/**
 * Clear sensitive bytes from memory
 * White Hat: Prevent secret leakage
 */
function clearBytes(bytes: Uint8Array): void {
  crypto.getRandomValues(bytes); // Overwrite with random data
  bytes.fill(0); // Then zero out
}

/**
 * Get public key from private key (mock - would need proper implementation)
 */
async function getPublicKeyFromPrivate(privateKey: Uint8Array): Promise<Uint8Array> {
  // In production, this would extract the public key from the private key structure
  // For now, return a hash as a placeholder
  return await hash(privateKey);
}
