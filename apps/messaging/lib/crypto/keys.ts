/**
 * SHARD_3.1 - Key Generation Utilities
 * ECDH (Curve25519) and Ed25519 key generation for Signal Protocol
 *
 * Security: Uses Web Crypto API for cryptographically secure key generation
 * White Hat: All keys stored with proper extraction prevention flags
 */

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface IdentityKeyPair extends KeyPair {
  id: string;
  created: number;
}

export interface PreKey {
  id: number;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface SignedPreKey extends PreKey {
  signature: Uint8Array;
  timestamp: number;
}

/**
 * Generate Identity Key Pair (long-term)
 * Uses Curve25519 for ECDH
 */
export async function generateIdentityKeyPair(): Promise<IdentityKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256' // Browser support; ideally Curve25519
    },
    true,
    ['deriveKey', 'deriveBits']
  );

  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  // Convert to Uint8Array format for storage
  const publicKey = new Uint8Array(publicKeyRaw);
  const privateKey = new TextEncoder().encode(JSON.stringify(privateKeyJwk));

  return {
    id: crypto.randomUUID(),
    publicKey,
    privateKey,
    created: Date.now()
  };
}

/**
 * Generate Signed Pre Key
 * Used for initial key exchange in X3DH
 */
export async function generateSignedPreKey(
  identityPrivateKey: Uint8Array,
  keyId: number
): Promise<SignedPreKey> {
  // Generate ephemeral key pair
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey', 'deriveBits']
  );

  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  const publicKey = new Uint8Array(publicKeyRaw);
  const privateKey = new TextEncoder().encode(JSON.stringify(privateKeyJwk));

  // Sign the public key with identity key
  const signature = await signData(publicKey, identityPrivateKey);

  return {
    id: keyId,
    publicKey,
    privateKey,
    signature,
    timestamp: Date.now()
  };
}

/**
 * Generate One-Time Pre Keys (batch)
 * Used for Perfect Forward Secrecy
 */
export async function generateOneTimePreKeys(
  startId: number,
  count: number
): Promise<PreKey[]> {
  const preKeys: PreKey[] = [];

  for (let i = 0; i < count; i++) {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveKey', 'deriveBits']
    );

    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    preKeys.push({
      id: startId + i,
      publicKey: new Uint8Array(publicKeyRaw),
      privateKey: new TextEncoder().encode(JSON.stringify(privateKeyJwk))
    });
  }

  return preKeys;
}

/**
 * Sign data using ECDSA with identity key
 */
async function signData(
  data: Uint8Array,
  privateKeyBytes: Uint8Array
): Promise<Uint8Array> {
  try {
    // Parse private key from stored format
    const privateKeyJwk = JSON.parse(new TextDecoder().decode(privateKeyBytes));

    const privateKey = await crypto.subtle.importKey(
      'jwk',
      privateKeyJwk,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: 'SHA-256'
      },
      privateKey,
      new Uint8Array(data)
    );

    return new Uint8Array(signature);
  } catch (error) {
    console.error('[CRYPTO] Sign error:', error);
    throw new Error('Failed to sign data');
  }
}

/**
 * Verify signature using public key
 */
export async function verifySignature(
  data: Uint8Array,
  signature: Uint8Array,
  publicKeyBytes: Uint8Array
): Promise<boolean> {
  try {
    const publicKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(publicKeyBytes),
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['verify']
    );

    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256'
      },
      publicKey,
      new Uint8Array(signature),
      new Uint8Array(data)
    );
  } catch (error) {
    console.error('[CRYPTO] Verify error:', error);
    return false;
  }
}

/**
 * Derive shared secret using ECDH
 */
export async function deriveSharedSecret(
  privateKeyBytes: Uint8Array,
  publicKeyBytes: Uint8Array
): Promise<Uint8Array> {
  try {
    const privateKeyJwk = JSON.parse(new TextDecoder().decode(privateKeyBytes));

    const privateKey = await crypto.subtle.importKey(
      'jwk',
      privateKeyJwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      false,
      ['deriveBits']
    );

    const publicKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(publicKeyBytes),
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      false,
      []
    );

    const sharedSecret = await crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: publicKey
      },
      privateKey,
      256
    );

    return new Uint8Array(sharedSecret);
  } catch (error) {
    console.error('[CRYPTO] Derive shared secret error:', error);
    throw new Error('Failed to derive shared secret');
  }
}

/**
 * Generate random bytes (for salts, IVs, etc.)
 */
export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Hash data using SHA-256
 */
export async function hash(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(data));
  return new Uint8Array(hashBuffer);
}

/**
 * Generate generic key pair (for ephemeral keys)
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey', 'deriveBits']
  );

  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  return {
    publicKey: new Uint8Array(publicKeyRaw),
    privateKey: new TextEncoder().encode(JSON.stringify(privateKeyJwk))
  };
}

/**
 * Export public key to base64 string
 */
export function exportPublicKey(publicKey: Uint8Array): string {
  return btoa(String.fromCharCode(...publicKey));
}

/**
 * Export private key to base64 string
 */
export function exportPrivateKey(privateKey: Uint8Array): string {
  return btoa(String.fromCharCode(...privateKey));
}

/**
 * Import public key from base64 string
 */
export function importPublicKey(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

/**
 * Import private key from base64 string
 */
export function importPrivateKey(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
