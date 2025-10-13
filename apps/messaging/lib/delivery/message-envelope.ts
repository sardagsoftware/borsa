/**
 * SHARD_4.2 - Message Envelope Format
 * Encrypted message wrapper for delivery
 *
 * Security: Only metadata visible, content fully encrypted
 * White Hat: Version field for future compatibility, timestamps for auditing
 */

export interface MessageEnvelope {
  // Envelope metadata (not encrypted)
  id: string;
  version: number;
  timestamp: number;

  // Routing information
  from: {
    userId: string;
    deviceId: string;
  };
  to: {
    userId: string;
    deviceId?: string; // Optional: specific device or all devices
  };

  // Encryption metadata
  type: 'prekey' | 'regular' | 'system';
  registrationId?: number; // For prekey messages

  // Encrypted payload
  ciphertext: string; // Base64-encoded encrypted content
  iv: string; // Initialization vector (Base64)

  // Double Ratchet state
  counter: number;
  previousCounter: number;
  publicKey?: string; // Ephemeral public key (for ratcheting)

  // Delivery tracking
  ttl: number; // Time-to-live in seconds (default: 30 days)
  priority: 'high' | 'normal' | 'low';
}

export interface MessageContent {
  // Message type
  contentType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location';

  // Content data
  text?: string;
  mediaUrl?: string;
  mediaKey?: string; // For decrypting media
  mediaMimeType?: string;
  mediaSize?: number;

  // Location data
  latitude?: number;
  longitude?: number;

  // Metadata
  quotedMessageId?: string; // For replies
  reactions?: string[]; // Emoji reactions

  // Client timestamp
  clientTimestamp: number;
}

/**
 * Create message envelope
 */
export function createMessageEnvelope(params: {
  fromUserId: string;
  fromDeviceId: string;
  toUserId: string;
  toDeviceId?: string;
  ciphertext: Uint8Array;
  iv: Uint8Array;
  counter: number;
  previousCounter: number;
  publicKey?: Uint8Array;
  type?: 'prekey' | 'regular' | 'system';
  priority?: 'high' | 'normal' | 'low';
}): MessageEnvelope {
  const envelope: MessageEnvelope = {
    id: crypto.randomUUID(),
    version: 1,
    timestamp: Date.now(),
    from: {
      userId: params.fromUserId,
      deviceId: params.fromDeviceId
    },
    to: {
      userId: params.toUserId,
      deviceId: params.toDeviceId
    },
    type: params.type || 'regular',
    ciphertext: arrayBufferToBase64(params.ciphertext),
    iv: arrayBufferToBase64(params.iv),
    counter: params.counter,
    previousCounter: params.previousCounter,
    publicKey: params.publicKey ? arrayBufferToBase64(params.publicKey) : undefined,
    ttl: 30 * 24 * 60 * 60, // 30 days
    priority: params.priority || 'normal'
  };

  return envelope;
}

/**
 * Parse message envelope
 */
export function parseMessageEnvelope(json: string): MessageEnvelope {
  return JSON.parse(json);
}

/**
 * Serialize message envelope
 */
export function serializeMessageEnvelope(envelope: MessageEnvelope): string {
  return JSON.stringify(envelope);
}

/**
 * Validate message envelope
 */
export function validateMessageEnvelope(envelope: MessageEnvelope): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!envelope.id) errors.push('Missing envelope ID');
  if (!envelope.version) errors.push('Missing version');
  if (!envelope.from?.userId) errors.push('Missing sender user ID');
  if (!envelope.from?.deviceId) errors.push('Missing sender device ID');
  if (!envelope.to?.userId) errors.push('Missing recipient user ID');
  if (!envelope.ciphertext) errors.push('Missing ciphertext');
  if (!envelope.iv) errors.push('Missing IV');

  // Check TTL hasn't expired
  if (envelope.ttl > 0) {
    const expiresAt = envelope.timestamp + (envelope.ttl * 1000);
    if (Date.now() > expiresAt) {
      errors.push('Message expired (TTL exceeded)');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create text message content
 */
export function createTextMessage(text: string): MessageContent {
  return {
    contentType: 'text',
    text,
    clientTimestamp: Date.now()
  };
}

/**
 * Create media message content
 */
export function createMediaMessage(params: {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  key: string;
  mimeType: string;
  size: number;
}): MessageContent {
  return {
    contentType: params.type,
    mediaUrl: params.url,
    mediaKey: params.key,
    mediaMimeType: params.mimeType,
    mediaSize: params.size,
    clientTimestamp: Date.now()
  };
}

/**
 * Create location message content
 */
export function createLocationMessage(
  latitude: number,
  longitude: number
): MessageContent {
  return {
    contentType: 'location',
    latitude,
    longitude,
    clientTimestamp: Date.now()
  };
}

/**
 * Helper: Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper: Convert Base64 to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
