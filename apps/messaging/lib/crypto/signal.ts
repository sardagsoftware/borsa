/**
 * SHARD_16.2 - Signal Protocol Integration Layer
 * High-level API for E2EE messaging in ChatContext
 *
 * Wraps X3DH key exchange and Double Ratchet encryption
 * Manages session state in IndexedDB
 *
 * White Hat: Zero-knowledge, client-side only
 */

import {
  encryptMessage as ratchetEncrypt,
  decryptMessage as ratchetDecrypt,
  initializeRatchet,
  RatchetState,
  EncryptedMessage,
  serializeRatchetState,
  deserializeRatchetState
} from './ratchet';
import {
  initiateX3DH,
  respondX3DH,
  X3DHBundle,
  X3DHResult
} from './x3dh';
import {
  generateKeyPair,
  generateRandomBytes,
  exportPublicKey,
  exportPrivateKey
} from './keys';

// IndexedDB database name
const DB_NAME = 'signal-sessions';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

interface SessionData {
  recipientId: string;
  ratchetState: RatchetState;
  ephemeralPublicKey: Uint8Array;
  lastUsed: number;
}

/**
 * Initialize Signal Protocol
 * Sets up IndexedDB and current user's keys
 */
export async function initializeSignal(): Promise<void> {
  try {
    // Open/create IndexedDB
    await openDatabase();

    // Generate identity key if not exists
    const hasIdentity = await hasIdentityKey();
    if (!hasIdentity) {
      await generateIdentityKey();
    }

    console.log('[Signal] ✅ Protocol initialized');
  } catch (error) {
    console.error('[Signal] ❌ Initialization failed:', error);
    throw new Error('Failed to initialize Signal Protocol');
  }
}

/**
 * Encrypt message for recipient
 * Automatically handles session creation via X3DH if needed
 *
 * @param recipientId - Recipient user ID
 * @param plaintext - Message to encrypt
 * @returns Base64-encoded encrypted message
 */
export async function encryptMessage(
  recipientId: string,
  plaintext: string
): Promise<string> {
  try {
    // Get or create session
    let session = await getSession(recipientId);

    if (!session) {
      // First message - perform X3DH key exchange
      session = await createSession(recipientId);
    }

    // Encrypt with Double Ratchet
    const plaintextBytes = new TextEncoder().encode(plaintext);
    const encrypted = await ratchetEncrypt(
      session.ratchetState,
      plaintextBytes,
      session.ephemeralPublicKey
    );

    // Update session
    session.lastUsed = Date.now();
    await saveSession(session);

    // Serialize encrypted message
    const serialized = serializeEncryptedMessage(encrypted);
    return btoa(String.fromCharCode(...serialized));
  } catch (error) {
    console.error('[Signal] ❌ Encrypt error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt message from sender
 *
 * @param senderId - Sender user ID
 * @param ciphertext - Base64-encoded encrypted message
 * @returns Decrypted plaintext
 */
export async function decryptMessage(
  senderId: string,
  ciphertext: string
): Promise<string> {
  try {
    // Get session
    let session = await getSession(senderId);

    if (!session) {
      // Respond to X3DH if this is first message
      session = await respondToSession(senderId, ciphertext);
    }

    // Deserialize encrypted message
    const encryptedBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const encrypted = deserializeEncryptedMessage(encryptedBytes);

    // Decrypt with Double Ratchet
    const plaintextBytes = await ratchetDecrypt(session.ratchetState, encrypted);

    // Update session
    session.lastUsed = Date.now();
    await saveSession(session);

    return new TextDecoder().decode(plaintextBytes);
  } catch (error) {
    console.error('[Signal] ❌ Decrypt error:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Create new session with recipient (X3DH initiator)
 */
async function createSession(recipientId: string): Promise<SessionData> {
  try {
    // Get recipient's pre-key bundle (would come from server)
    // For now, generate demo bundle
    const recipientBundle = await getRecipientBundle(recipientId);

    // Get our identity key
    const identityKeyPair = await getIdentityKey();
    if (!identityKeyPair) {
      throw new Error('Identity key not found');
    }

    // Generate ephemeral key pair
    const ephemeralKeyPair = await generateKeyPair();

    // Perform X3DH
    const x3dhResult = await initiateX3DH(
      identityKeyPair.privateKey,
      recipientBundle,
      ephemeralKeyPair.privateKey
    );

    // Initialize ratchet
    const ratchetState = initializeRatchet(x3dhResult.sharedSecret);

    const session: SessionData = {
      recipientId,
      ratchetState,
      ephemeralPublicKey: x3dhResult.ephemeralKey,
      lastUsed: Date.now()
    };

    await saveSession(session);

    console.log(`[Signal] ✅ Created session with ${recipientId}`);
    return session;
  } catch (error) {
    console.error('[Signal] ❌ Create session error:', error);
    throw new Error('Failed to create session');
  }
}

/**
 * Respond to incoming session (X3DH responder)
 */
async function respondToSession(
  senderId: string,
  ciphertext: string
): Promise<SessionData> {
  try {
    // In production, extract ephemeral key from message header
    // For now, generate demo session
    const ephemeralKey = generateRandomBytes(32);

    // Get our keys
    const identityKeyPair = await getIdentityKey();
    if (!identityKeyPair) {
      throw new Error('Identity key not found');
    }

    const signedPreKeyPair = await generateKeyPair(); // Would be pre-generated

    // Perform X3DH response
    const x3dhResult = await respondX3DH(
      identityKeyPair.privateKey,
      signedPreKeyPair.privateKey,
      null, // No one-time pre-key
      ephemeralKey, // Sender's identity key (from message)
      ephemeralKey  // Sender's ephemeral key (from message)
    );

    // Initialize ratchet
    const ratchetState = initializeRatchet(x3dhResult.sharedSecret);

    const session: SessionData = {
      recipientId: senderId,
      ratchetState,
      ephemeralPublicKey: x3dhResult.ephemeralKey,
      lastUsed: Date.now()
    };

    await saveSession(session);

    console.log(`[Signal] ✅ Responded to session from ${senderId}`);
    return session;
  } catch (error) {
    console.error('[Signal] ❌ Respond session error:', error);
    throw new Error('Failed to respond to session');
  }
}

// ========== IndexedDB Operations ==========

let dbInstance: IDBDatabase | null = null;

async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create sessions store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'recipientId' });
        store.createIndex('lastUsed', 'lastUsed', { unique: false });
      }

      // Create identity store
      if (!db.objectStoreNames.contains('identity')) {
        db.createObjectStore('identity', { keyPath: 'id' });
      }
    };
  });
}

async function getSession(recipientId: string): Promise<SessionData | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(recipientId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const data = request.result;
      if (!data) {
        resolve(null);
        return;
      }

      // Deserialize ratchet state
      const session: SessionData = {
        ...data,
        ratchetState: deserializeRatchetState(data.ratchetState)
      };
      resolve(session);
    };
  });
}

async function saveSession(session: SessionData): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Serialize ratchet state
    const data = {
      ...session,
      ratchetState: serializeRatchetState(session.ratchetState)
    };

    const request = store.put(data);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function hasIdentityKey(): Promise<boolean> {
  const key = await getIdentityKey();
  return key !== null;
}

async function getIdentityKey(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array } | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('identity', 'readonly');
    const store = transaction.objectStore('identity');
    const request = store.get('current');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const data = request.result;
      resolve(data || null);
    };
  });
}

async function generateIdentityKey(): Promise<void> {
  const keyPair = await generateKeyPair();
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('identity', 'readwrite');
    const store = transaction.objectStore('identity');
    const request = store.put({
      id: 'current',
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      createdAt: Date.now()
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log('[Signal] ✅ Generated identity key');
      resolve();
    };
  });
}

/**
 * Get recipient's pre-key bundle (would fetch from server)
 * For now, returns demo bundle
 */
async function getRecipientBundle(recipientId: string): Promise<X3DHBundle> {
  // TODO: GET /api/users/:id/prekey-bundle

  // Demo: Generate random bundle
  const identityKey = generateRandomBytes(32);
  const signedPreKey = generateRandomBytes(32);
  const signature = generateRandomBytes(64);

  return {
    identityKey,
    signedPreKey,
    signedPreKeySignature: signature,
    oneTimePreKey: generateRandomBytes(32)
  };
}

// ========== Serialization Helpers ==========

function serializeEncryptedMessage(encrypted: EncryptedMessage): Uint8Array {
  // Simple concatenation: counter (4 bytes) + iv length (2 bytes) + iv + pubkey length (2 bytes) + pubkey + ciphertext
  const counterBytes = new Uint8Array(4);
  new DataView(counterBytes.buffer).setUint32(0, encrypted.counter, true);

  const ivLengthBytes = new Uint8Array(2);
  new DataView(ivLengthBytes.buffer).setUint16(0, encrypted.iv.length, true);

  const pubkeyLengthBytes = new Uint8Array(2);
  new DataView(pubkeyLengthBytes.buffer).setUint16(0, encrypted.publicKey.length, true);

  const totalLength =
    4 + 2 + encrypted.iv.length + 2 + encrypted.publicKey.length + encrypted.ciphertext.length;
  const result = new Uint8Array(totalLength);

  let offset = 0;
  result.set(counterBytes, offset); offset += 4;
  result.set(ivLengthBytes, offset); offset += 2;
  result.set(encrypted.iv, offset); offset += encrypted.iv.length;
  result.set(pubkeyLengthBytes, offset); offset += 2;
  result.set(encrypted.publicKey, offset); offset += encrypted.publicKey.length;
  result.set(encrypted.ciphertext, offset);

  return result;
}

function deserializeEncryptedMessage(data: Uint8Array): EncryptedMessage {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;

  const counter = view.getUint32(offset, true); offset += 4;
  const ivLength = view.getUint16(offset, true); offset += 2;
  const iv = data.slice(offset, offset + ivLength); offset += ivLength;
  const pubkeyLength = view.getUint16(offset, true); offset += 2;
  const publicKey = data.slice(offset, offset + pubkeyLength); offset += pubkeyLength;
  const ciphertext = data.slice(offset);

  return { counter, iv, publicKey, ciphertext };
}

/**
 * Clear all sessions (for logout)
 */
export async function clearAllSessions(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log('[Signal] ✅ Cleared all sessions');
      resolve();
    };
  });
}

/**
 * Export public identity key (for sharing with contacts)
 */
export async function getPublicIdentityKey(): Promise<string | null> {
  const identityKey = await getIdentityKey();
  if (!identityKey) return null;

  return btoa(String.fromCharCode(...identityKey.publicKey));
}
