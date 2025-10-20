/**
 * SHARD_3.3 - Double Ratchet Algorithm
 * Core encryption mechanism for Signal Protocol
 * Provides Perfect Forward Secrecy and Break-in Recovery
 *
 * Security: Each message encrypted with unique key, ratcheted forward
 * White Hat: All used keys are immediately deleted
 */

import { deriveSharedSecret, generateRandomBytes, hash } from './keys';

export interface RatchetState {
  rootKey: Uint8Array;
  chainKey: Uint8Array;
  sendingKey: Uint8Array;
  receivingKey: Uint8Array;
  sendCounter: number;
  receiveCounter: number;
  previousCounter: number;
}

export interface MessageKey {
  key: Uint8Array;
  iv: Uint8Array;
  counter: number;
}

export interface EncryptedMessage {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  counter: number;
  publicKey: Uint8Array;
}

/**
 * Initialize ratchet state from shared secret
 */
export function initializeRatchet(sharedSecret: Uint8Array): RatchetState {
  const rootKey = sharedSecret.slice(0, 32);
  const chainKey = sharedSecret.slice(32, 64);

  return {
    rootKey,
    chainKey,
    sendingKey: new Uint8Array(32),
    receivingKey: new Uint8Array(32),
    sendCounter: 0,
    receiveCounter: 0,
    previousCounter: 0
  };
}

/**
 * Ratchet forward when sending a message
 */
export async function ratchetForward(
  state: RatchetState,
  dhRatchetKey: Uint8Array
): Promise<RatchetState> {
  // KDF on root key
  const [newRootKey, newChainKey] = await kdfRootKey(state.rootKey, dhRatchetKey);

  return {
    ...state,
    rootKey: newRootKey,
    chainKey: newChainKey,
    sendingKey: newChainKey,
    sendCounter: 0
  };
}

/**
 * Derive message key from chain key
 */
export async function deriveMessageKey(chainKey: Uint8Array): Promise<MessageKey> {
  const messageKeyData = await hmacSha256(
    chainKey,
    new TextEncoder().encode('message-key')
  );

  const key = messageKeyData.slice(0, 32);
  const iv = generateRandomBytes(16);

  return {
    key,
    iv,
    counter: 0
  };
}

/**
 * Advance chain key (for forward secrecy)
 */
export async function advanceChainKey(chainKey: Uint8Array): Promise<Uint8Array> {
  return await hmacSha256(
    chainKey,
    new TextEncoder().encode('chain-key')
  );
}

/**
 * Encrypt message using Double Ratchet
 */
export async function encryptMessage(
  state: RatchetState,
  plaintext: Uint8Array,
  ephemeralPublicKey: Uint8Array
): Promise<EncryptedMessage> {
  // Derive message key
  const messageKey = await deriveMessageKey(state.chainKey);

  // Encrypt with AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(messageKey.key),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(messageKey.iv)
    },
    cryptoKey,
    new Uint8Array(plaintext)
  );

  // Advance chain key for next message
  state.chainKey = await advanceChainKey(state.chainKey);
  state.sendCounter++;

  // Clear used message key
  clearBytes(messageKey.key);

  return {
    ciphertext: new Uint8Array(ciphertext),
    iv: messageKey.iv,
    counter: state.sendCounter - 1,
    publicKey: ephemeralPublicKey
  };
}

/**
 * Decrypt message using Double Ratchet
 */
export async function decryptMessage(
  state: RatchetState,
  encrypted: EncryptedMessage
): Promise<Uint8Array> {
  try {
    // Derive message key for this counter
    let workingChainKey = state.chainKey;

    // Skip forward if counter is ahead (message reordering)
    while (state.receiveCounter < encrypted.counter) {
      workingChainKey = await advanceChainKey(workingChainKey);
      state.receiveCounter++;
    }

    const messageKey = await deriveMessageKey(workingChainKey);

    // Decrypt with AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(messageKey.key),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(encrypted.iv)
      },
      cryptoKey,
      new Uint8Array(encrypted.ciphertext)
    );

    // Update state
    state.chainKey = await advanceChainKey(workingChainKey);
    state.receiveCounter++;
    state.previousCounter = encrypted.counter;

    // Clear used message key
    clearBytes(messageKey.key);

    return new Uint8Array(plaintext);
  } catch (error) {
    console.error('[RATCHET] Decrypt error:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * KDF for root key ratchet
 */
async function kdfRootKey(
  rootKey: Uint8Array,
  dhOutput: Uint8Array
): Promise<[Uint8Array, Uint8Array]> {
  const input = concatenateBytes([rootKey, dhOutput]);
  const output = await hmacSha256(rootKey, input);

  const newRootKey = output.slice(0, 32);
  const newChainKey = output.slice(32, 64);

  return [newRootKey, newChainKey];
}

/**
 * HMAC-SHA256
 */
async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new Uint8Array(data));
  return new Uint8Array(signature);
}

/**
 * Concatenate bytes
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
 * Clear sensitive bytes (White Hat security)
 */
function clearBytes(bytes: Uint8Array): void {
  crypto.getRandomValues(bytes);
  bytes.fill(0);
}

/**
 * Serialize ratchet state for storage
 */
export function serializeRatchetState(state: RatchetState): string {
  return JSON.stringify({
    rootKey: Array.from(state.rootKey),
    chainKey: Array.from(state.chainKey),
    sendingKey: Array.from(state.sendingKey),
    receivingKey: Array.from(state.receivingKey),
    sendCounter: state.sendCounter,
    receiveCounter: state.receiveCounter,
    previousCounter: state.previousCounter
  });
}

/**
 * Deserialize ratchet state from storage
 */
export function deserializeRatchetState(json: string): RatchetState {
  const obj = JSON.parse(json);
  return {
    rootKey: new Uint8Array(obj.rootKey),
    chainKey: new Uint8Array(obj.chainKey),
    sendingKey: new Uint8Array(obj.sendingKey),
    receivingKey: new Uint8Array(obj.receivingKey),
    sendCounter: obj.sendCounter,
    receiveCounter: obj.receiveCounter,
    previousCounter: obj.previousCounter
  };
}
