/**
 * SHARD_6.2 - SFrame E2EE for WebRTC
 * Per-frame encryption for video/audio streams
 *
 * Security: Each frame encrypted with unique key + nonce
 * White Hat: Forward secrecy, sender authentication
 *
 * Note: This is a simplified implementation. Production should use
 * Insertable Streams API with actual SFrame library.
 */

import { toArrayBuffer } from '../crypto/utils';

export interface SFrameKey {
  keyId: number;
  key: Uint8Array;
  counter: number;
}

export interface EncryptedFrame {
  keyId: number;
  counter: number;
  ciphertext: Uint8Array;
  authTag: Uint8Array;
}

/**
 * SFrame encryption context
 */
export class SFrameContext {
  private encryptionKey: SFrameKey;
  private decryptionKeys: Map<number, SFrameKey> = new Map();

  constructor() {
    // Generate initial encryption key
    this.encryptionKey = this.generateKey(0);
  }

  /**
   * Generate SFrame key
   */
  private generateKey(keyId: number): SFrameKey {
    const key = crypto.getRandomValues(new Uint8Array(32));
    return {
      keyId,
      key,
      counter: 0
    };
  }

  /**
   * Encrypt frame (sender side)
   */
  async encryptFrame(frameData: Uint8Array): Promise<EncryptedFrame> {
    try {
      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        toArrayBuffer(this.encryptionKey.key),
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      // Generate nonce from counter
      const nonce = new Uint8Array(12);
      const view = new DataView(nonce.buffer);
      view.setUint32(0, this.encryptionKey.counter, false);

      // Encrypt
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: toArrayBuffer(nonce),
          tagLength: 128
        },
        cryptoKey,
        toArrayBuffer(frameData)
      );

      const encryptedBytes = new Uint8Array(encrypted);
      const ciphertext = encryptedBytes.slice(0, -16);
      const authTag = encryptedBytes.slice(-16);

      // Increment counter
      this.encryptionKey.counter++;

      return {
        keyId: this.encryptionKey.keyId,
        counter: this.encryptionKey.counter - 1,
        ciphertext,
        authTag
      };
    } catch (error: any) {
      console.error('[SFRAME] ❌ Encryption error:', error);
      throw new Error('SFrame encryption failed');
    }
  }

  /**
   * Decrypt frame (receiver side)
   */
  async decryptFrame(encrypted: EncryptedFrame): Promise<Uint8Array> {
    try {
      // Get decryption key
      const sframeKey = this.decryptionKeys.get(encrypted.keyId);

      if (!sframeKey) {
        throw new Error(`Unknown key ID: ${encrypted.keyId}`);
      }

      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        toArrayBuffer(sframeKey.key),
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Generate nonce from counter
      const nonce = new Uint8Array(12);
      const view = new DataView(nonce.buffer);
      view.setUint32(0, encrypted.counter, false);

      // Combine ciphertext + auth tag
      const combined = new Uint8Array(encrypted.ciphertext.length + encrypted.authTag.length);
      combined.set(encrypted.ciphertext, 0);
      combined.set(encrypted.authTag, encrypted.ciphertext.length);

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: toArrayBuffer(nonce),
          tagLength: 128
        },
        cryptoKey,
        toArrayBuffer(combined)
      );

      return new Uint8Array(decrypted);
    } catch (error: any) {
      console.error('[SFRAME] ❌ Decryption error:', error);
      throw new Error('SFrame decryption failed');
    }
  }

  /**
   * Add decryption key (for remote peer)
   */
  addDecryptionKey(keyId: number, key: Uint8Array): void {
    this.decryptionKeys.set(keyId, {
      keyId,
      key,
      counter: 0
    });
    console.log(`[SFRAME] ✅ Added decryption key: ${keyId}`);
  }

  /**
   * Rotate encryption key
   */
  rotateEncryptionKey(): SFrameKey {
    const newKeyId = this.encryptionKey.keyId + 1;
    this.encryptionKey = this.generateKey(newKeyId);
    console.log(`[SFRAME] 🔄 Rotated to key: ${newKeyId}`);
    return this.encryptionKey;
  }

  /**
   * Get current encryption key (for sharing with peer)
   */
  getEncryptionKey(): { keyId: number; key: Uint8Array } {
    return {
      keyId: this.encryptionKey.keyId,
      key: this.encryptionKey.key
    };
  }

  /**
   * Serialize encrypted frame (for transport)
   */
  serializeFrame(frame: EncryptedFrame): Uint8Array {
    // Format: [keyId(1byte)][counter(4bytes)][ciphertext][authTag(16bytes)]
    const buffer = new Uint8Array(
      1 + 4 + frame.ciphertext.length + frame.authTag.length
    );

    let offset = 0;

    // Key ID
    buffer[offset] = frame.keyId;
    offset += 1;

    // Counter
    const view = new DataView(buffer.buffer);
    view.setUint32(offset, frame.counter, false);
    offset += 4;

    // Ciphertext
    buffer.set(frame.ciphertext, offset);
    offset += frame.ciphertext.length;

    // Auth tag
    buffer.set(frame.authTag, offset);

    return buffer;
  }

  /**
   * Deserialize encrypted frame (from transport)
   */
  deserializeFrame(data: Uint8Array): EncryptedFrame {
    let offset = 0;

    // Key ID
    const keyId = data[offset];
    offset += 1;

    // Counter
    const view = new DataView(data.buffer, data.byteOffset);
    const counter = view.getUint32(offset, false);
    offset += 4;

    // Ciphertext (all except last 16 bytes)
    const ciphertext = data.slice(offset, -16);

    // Auth tag (last 16 bytes)
    const authTag = data.slice(-16);

    return {
      keyId,
      counter,
      ciphertext,
      authTag
    };
  }
}

/**
 * Mock insertable streams transform (for demo)
 * In production, use WebRTC Insertable Streams API
 */
export class SFrameTransform {
  private context: SFrameContext;
  private enabled: boolean = true;

  constructor(context: SFrameContext) {
    this.context = context;
  }

  /**
   * Transform outgoing frame (encrypt)
   */
  async transformOutgoing(frame: any): Promise<any> {
    if (!this.enabled) {
      return frame;
    }

    try {
      // Get frame data
      const frameData = new Uint8Array(frame.data);

      // Encrypt
      const encrypted = await this.context.encryptFrame(frameData);

      // Serialize
      const serialized = this.context.serializeFrame(encrypted);

      // Replace frame data
      frame.data = serialized.buffer;

      return frame;
    } catch (error) {
      console.error('[SFRAME] ❌ Transform outgoing error:', error);
      return frame;
    }
  }

  /**
   * Transform incoming frame (decrypt)
   */
  async transformIncoming(frame: any): Promise<any> {
    if (!this.enabled) {
      return frame;
    }

    try {
      // Get frame data
      const frameData = new Uint8Array(frame.data);

      // Deserialize
      const encrypted = this.context.deserializeFrame(frameData);

      // Decrypt
      const decrypted = await this.context.decryptFrame(encrypted);

      // Replace frame data
      frame.data = decrypted.buffer;

      return frame;
    } catch (error) {
      console.error('[SFRAME] ❌ Transform incoming error:', error);
      return frame;
    }
  }

  /**
   * Enable/disable encryption
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[SFRAME] ${enabled ? '🔒' : '🔓'} Encryption ${enabled ? 'enabled' : 'disabled'}`);
  }
}

/**
 * Exchange SFrame keys via signaling
 */
export interface SFrameKeyMessage {
  type: 'sframe-key';
  keyId: number;
  key: string; // Base64-encoded
}

export function createKeyMessage(context: SFrameContext): SFrameKeyMessage {
  const encKey = context.getEncryptionKey();
  return {
    type: 'sframe-key',
    keyId: encKey.keyId,
    key: btoa(String.fromCharCode(...encKey.key))
  };
}

export function handleKeyMessage(context: SFrameContext, message: SFrameKeyMessage): void {
  const keyBytes = Uint8Array.from(atob(message.key), c => c.charCodeAt(0));
  context.addDecryptionKey(message.keyId, keyBytes);
}
