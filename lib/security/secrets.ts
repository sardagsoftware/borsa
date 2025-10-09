/**
 * LYDIAN-IQ ENVELOPE ENCRYPTION
 *
 * Purpose: Secure secret storage using KEK/DEK pattern
 * Algorithm: AES-256-GCM (Data Encryption Key) + Azure KMS/Vault (Key Encryption Key)
 *
 * Architecture:
 * 1. KEK (Key Encryption Key): Stored in Azure Key Vault or HashiCorp Vault
 * 2. DEK (Data Encryption Key): Generated per-secret, encrypted with KEK
 * 3. Encrypted blob: AES-256-GCM(plaintext, DEK)
 * 4. Envelope: { encryptedDEK, encryptedBlob, iv, authTag }
 *
 * Security Properties:
 * - KEK never leaves KMS/Vault
 * - DEK rotated every 24 hours (or per secret)
 * - In-memory only: DEK zeroized on process exit
 * - Perfect forward secrecy: old DEKs can't decrypt new data
 *
 * Compliance:
 * - FIPS 140-2 (AES-256-GCM)
 * - NIST SP 800-57 (Key management)
 * - SOC 2 (Encryption at rest)
 */

import crypto from 'crypto';

/**
 * Envelope encryption container
 */
export interface EnvelopeEncryptedBlob {
  version: string; // "1.0"
  kek_ref: string; // Reference to KEK in Vault/KMS (e.g., "vault://secret/kek/main")
  encrypted_dek: string; // Base64-encoded encrypted DEK
  encrypted_blob: string; // Base64-encoded ciphertext
  iv: string; // Base64-encoded initialization vector (12 bytes for GCM)
  auth_tag: string; // Base64-encoded authentication tag (16 bytes for GCM)
  algorithm: string; // "AES-256-GCM"
  created_at: string; // ISO 8601
}

/**
 * DEK (Data Encryption Key) cache
 * - Keys: kek_ref
 * - Values: { dek: Buffer, created_at: number }
 * - TTL: 24 hours (86400000 ms)
 */
interface DEKCacheEntry {
  dek: Buffer;
  created_at: number;
}

const dekCache: Map<string, DEKCacheEntry> = new Map();
const DEK_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * KEK provider interface
 *
 * Implement this interface to integrate with Azure Key Vault, HashiCorp Vault, etc.
 */
export interface KEKProvider {
  /**
   * Decrypt DEK using KEK
   *
   * @param kekRef - KEK reference (e.g., "vault://secret/kek/main")
   * @param encryptedDEK - Encrypted DEK (Base64)
   * @returns Decrypted DEK (Buffer)
   */
  decryptDEK(kekRef: string, encryptedDEK: string): Promise<Buffer>;

  /**
   * Encrypt DEK using KEK
   *
   * @param kekRef - KEK reference
   * @param dek - DEK to encrypt (Buffer)
   * @returns Encrypted DEK (Base64)
   */
  encryptDEK(kekRef: string, dek: Buffer): Promise<string>;
}

/**
 * Mock KEK provider (for testing)
 *
 * ⚠️ WARNING: Do NOT use in production. Use Azure Key Vault or HashiCorp Vault.
 */
class MockKEKProvider implements KEKProvider {
  private mockKEK: Buffer;

  constructor() {
    // Generate a mock KEK (32 bytes for AES-256)
    this.mockKEK = crypto.randomBytes(32);
    console.warn('⚠️  Using MockKEKProvider - NOT FOR PRODUCTION');
  }

  async decryptDEK(kekRef: string, encryptedDEK: string): Promise<Buffer> {
    const encryptedBuffer = Buffer.from(encryptedDEK, 'base64');

    // Simple XOR decryption (mock only)
    const dek = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      dek[i] = encryptedBuffer[i] ^ this.mockKEK[i % this.mockKEK.length];
    }

    return dek;
  }

  async encryptDEK(kekRef: string, dek: Buffer): Promise<string> {
    // Simple XOR encryption (mock only)
    const encrypted = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      encrypted[i] = dek[i] ^ this.mockKEK[i % this.mockKEK.length];
    }

    return encrypted.toString('base64');
  }
}

/**
 * Global KEK provider (default: mock)
 */
let kekProvider: KEKProvider = new MockKEKProvider();

/**
 * Set KEK provider
 *
 * @param provider - KEK provider implementation
 *
 * @example
 * ```typescript
 * import { AzureKeyVaultProvider } from './azure-kek-provider';
 * setKEKProvider(new AzureKeyVaultProvider({
 *   vaultUrl: process.env.AZURE_KEY_VAULT_URL,
 *   credential: new DefaultAzureCredential()
 * }));
 * ```
 */
export function setKEKProvider(provider: KEKProvider): void {
  kekProvider = provider;
}

/**
 * Envelope encrypt
 *
 * @param plaintext - Data to encrypt (Buffer or string)
 * @param kekRef - KEK reference in Vault/KMS
 * @returns Envelope encrypted blob
 *
 * @example
 * ```typescript
 * const envelope = await envelopeEncrypt(
 *   Buffer.from('my-api-key-12345'),
 *   'vault://secret/kek/main'
 * );
 *
 * // Store envelope in database
 * await db.secrets.create({ data: envelope });
 * ```
 */
export async function envelopeEncrypt(
  plaintext: Buffer | string,
  kekRef: string
): Promise<EnvelopeEncryptedBlob> {
  const plaintextBuffer = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf-8') : plaintext;

  // Generate new DEK (32 bytes for AES-256)
  const dek = crypto.randomBytes(32);

  // Encrypt DEK with KEK
  const encryptedDEK = await kekProvider.encryptDEK(kekRef, dek);

  // Generate IV (12 bytes for GCM)
  const iv = crypto.randomBytes(12);

  // Encrypt plaintext with DEK using AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
  const encryptedBlob = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Zeroize DEK in memory
  dek.fill(0);

  return {
    version: '1.0',
    kek_ref: kekRef,
    encrypted_dek: encryptedDEK,
    encrypted_blob: encryptedBlob.toString('base64'),
    iv: iv.toString('base64'),
    auth_tag: authTag.toString('base64'),
    algorithm: 'AES-256-GCM',
    created_at: new Date().toISOString(),
  };
}

/**
 * Envelope decrypt
 *
 * @param envelope - Envelope encrypted blob
 * @returns Decrypted plaintext (Buffer)
 *
 * @example
 * ```typescript
 * const envelope = await db.secrets.findUnique({ where: { id } });
 * const plaintext = await envelopeDecrypt(envelope);
 * console.log(plaintext.toString('utf-8')); // "my-api-key-12345"
 *
 * // Zeroize plaintext after use
 * plaintext.fill(0);
 * ```
 */
export async function envelopeDecrypt(envelope: EnvelopeEncryptedBlob): Promise<Buffer> {
  // Get DEK from cache or decrypt with KEK
  let dek: Buffer;

  const cacheEntry = dekCache.get(envelope.kek_ref);
  const now = Date.now();

  if (cacheEntry && now - cacheEntry.created_at < DEK_TTL_MS) {
    // Use cached DEK
    dek = cacheEntry.dek;
  } else {
    // Decrypt DEK with KEK
    dek = await kekProvider.decryptDEK(envelope.kek_ref, envelope.encrypted_dek);

    // Cache DEK
    dekCache.set(envelope.kek_ref, { dek, created_at: now });

    // Schedule cache eviction after TTL
    setTimeout(() => {
      const entry = dekCache.get(envelope.kek_ref);
      if (entry && entry.created_at === now) {
        // Zeroize and delete
        entry.dek.fill(0);
        dekCache.delete(envelope.kek_ref);
      }
    }, DEK_TTL_MS);
  }

  // Decrypt blob with DEK using AES-256-GCM
  const iv = Buffer.from(envelope.iv, 'base64');
  const authTag = Buffer.from(envelope.auth_tag, 'base64');
  const encryptedBlob = Buffer.from(envelope.encrypted_blob, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(encryptedBlob), decipher.final()]);

  return plaintext;
}

/**
 * Rotate DEK for existing envelope
 *
 * Re-encrypts the plaintext with a new DEK.
 *
 * @param oldEnvelope - Existing envelope
 * @param newKekRef - New KEK reference (optional, defaults to old KEK)
 * @returns New envelope with rotated DEK
 *
 * @example
 * ```typescript
 * const oldEnvelope = await db.secrets.findUnique({ where: { id } });
 * const newEnvelope = await rotateDEK(oldEnvelope);
 * await db.secrets.update({ where: { id }, data: newEnvelope });
 * ```
 */
export async function rotateDEK(
  oldEnvelope: EnvelopeEncryptedBlob,
  newKekRef?: string
): Promise<EnvelopeEncryptedBlob> {
  // Decrypt with old envelope
  const plaintext = await envelopeDecrypt(oldEnvelope);

  // Re-encrypt with new DEK
  const newEnvelope = await envelopeEncrypt(plaintext, newKekRef || oldEnvelope.kek_ref);

  // Zeroize plaintext
  plaintext.fill(0);

  return newEnvelope;
}

/**
 * Clear DEK cache (zeroize all cached keys)
 *
 * Call this on process exit or periodically for security.
 */
export function clearDEKCache(): void {
  for (const [kekRef, entry] of dekCache.entries()) {
    entry.dek.fill(0); // Zeroize DEK
  }
  dekCache.clear();
}

/**
 * Process exit handler: Zeroize DEKs
 */
process.on('exit', () => {
  clearDEKCache();
});

process.on('SIGINT', () => {
  clearDEKCache();
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearDEKCache();
  process.exit(0);
});

/**
 * Get DEK cache stats (for monitoring)
 *
 * @returns Object with cache size and oldest entry age
 */
export function getDEKCacheStats(): { size: number; oldest_age_ms: number | null } {
  if (dekCache.size === 0) {
    return { size: 0, oldest_age_ms: null };
  }

  const now = Date.now();
  let oldestAge = 0;

  for (const entry of dekCache.values()) {
    const age = now - entry.created_at;
    if (age > oldestAge) {
      oldestAge = age;
    }
  }

  return { size: dekCache.size, oldest_age_ms: oldestAge };
}

/**
 * Example Azure Key Vault KEK Provider (reference implementation)
 *
 * Install: npm install @azure/keyvault-keys @azure/identity
 *
 * Usage:
 * ```typescript
 * import { DefaultAzureCredential } from '@azure/identity';
 * import { KeyClient, CryptographyClient } from '@azure/keyvault-keys';
 *
 * class AzureKeyVaultProvider implements KEKProvider {
 *   private keyClient: KeyClient;
 *
 *   constructor(vaultUrl: string) {
 *     const credential = new DefaultAzureCredential();
 *     this.keyClient = new KeyClient(vaultUrl, credential);
 *   }
 *
 *   async decryptDEK(kekRef: string, encryptedDEK: string): Promise<Buffer> {
 *     const keyName = kekRef.split('/').pop()!;
 *     const key = await this.keyClient.getKey(keyName);
 *     const cryptoClient = new CryptographyClient(key, new DefaultAzureCredential());
 *
 *     const result = await cryptoClient.decrypt({
 *       algorithm: 'RSA-OAEP-256',
 *       ciphertext: Buffer.from(encryptedDEK, 'base64')
 *     });
 *
 *     return Buffer.from(result.result);
 *   }
 *
 *   async encryptDEK(kekRef: string, dek: Buffer): Promise<string> {
 *     const keyName = kekRef.split('/').pop()!;
 *     const key = await this.keyClient.getKey(keyName);
 *     const cryptoClient = new CryptographyClient(key, new DefaultAzureCredential());
 *
 *     const result = await cryptoClient.encrypt({
 *       algorithm: 'RSA-OAEP-256',
 *       plaintext: dek
 *     });
 *
 *     return Buffer.from(result.result).toString('base64');
 *   }
 * }
 *
 * // Setup
 * setKEKProvider(new AzureKeyVaultProvider(process.env.AZURE_KEY_VAULT_URL!));
 * ```
 */
