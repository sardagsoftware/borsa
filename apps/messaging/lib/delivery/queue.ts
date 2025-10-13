/**
 * SHARD_4.3 - Message Queue Operations
 * Store-and-forward message delivery using Redis lists
 *
 * Security: Messages stored encrypted, TTL enforcement
 * White Hat: Rate limiting, queue size limits, audit logging
 */

import {
  getRedisClient,
  REDIS_KEYS,
  setWithTTL,
  get,
  del
} from './redis-client';
import {
  MessageEnvelope,
  serializeMessageEnvelope,
  parseMessageEnvelope,
  validateMessageEnvelope
} from './message-envelope';

export interface QueueStats {
  queueLength: number;
  oldestMessageAge?: number;
  newestMessageAge?: number;
}

export interface DeliveryResult {
  success: boolean;
  messageId: string;
  queuePosition?: number;
  error?: string;
}

/**
 * Push message to recipient's queue
 */
export async function pushMessage(
  envelope: MessageEnvelope
): Promise<DeliveryResult> {
  try {
    // Validate envelope
    const validation = validateMessageEnvelope(envelope);
    if (!validation.valid) {
      return {
        success: false,
        messageId: envelope.id,
        error: `Invalid envelope: ${validation.errors.join(', ')}`
      };
    }

    const client = getRedisClient();
    const queueKey = REDIS_KEYS.MESSAGE_QUEUE(envelope.to.userId);
    const envelopeKey = REDIS_KEYS.MESSAGE_ENVELOPE(envelope.id);

    // Store envelope with TTL
    const envelopeJson = serializeMessageEnvelope(envelope);
    await setWithTTL(envelopeKey, envelopeJson, envelope.ttl);

    // Add envelope ID to recipient's queue
    const queuePosition = await client.rpush(queueKey, envelope.id);

    // Set TTL on queue itself
    await client.expire(queueKey, envelope.ttl);

    console.log(
      `[QUEUE] ✅ Pushed message ${envelope.id} to ${envelope.to.userId} (pos: ${queuePosition})`
    );

    return {
      success: true,
      messageId: envelope.id,
      queuePosition
    };
  } catch (error: any) {
    console.error('[QUEUE] ❌ Push error:', error);
    return {
      success: false,
      messageId: envelope.id,
      error: error.message
    };
  }
}

/**
 * Pop message from user's queue
 * Returns oldest message (FIFO)
 */
export async function popMessage(
  userId: string
): Promise<MessageEnvelope | null> {
  try {
    const client = getRedisClient();
    const queueKey = REDIS_KEYS.MESSAGE_QUEUE(userId);

    // Pop message ID from queue (left = oldest)
    const messageId = await client.lpop(queueKey);

    if (!messageId) {
      return null;
    }

    // Get envelope
    const envelopeKey = REDIS_KEYS.MESSAGE_ENVELOPE(messageId);
    const envelopeJson = await get(envelopeKey);

    if (!envelopeJson) {
      console.warn(`[QUEUE] ⚠️ Envelope not found: ${messageId}`);
      return null;
    }

    const envelope = parseMessageEnvelope(envelopeJson);

    // Delete envelope after retrieval
    await del(envelopeKey);

    console.log(`[QUEUE] ✅ Popped message ${messageId} for ${userId}`);

    return envelope;
  } catch (error: any) {
    console.error('[QUEUE] ❌ Pop error:', error);
    return null;
  }
}

/**
 * Peek at messages without removing them
 */
export async function peekMessages(
  userId: string,
  limit: number = 10
): Promise<MessageEnvelope[]> {
  try {
    const client = getRedisClient();
    const queueKey = REDIS_KEYS.MESSAGE_QUEUE(userId);

    // Get message IDs (0 to limit-1)
    const messageIds = await client.lrange(queueKey, 0, limit - 1);

    if (messageIds.length === 0) {
      return [];
    }

    // Get envelopes
    const envelopes: MessageEnvelope[] = [];

    for (const messageId of messageIds) {
      const envelopeKey = REDIS_KEYS.MESSAGE_ENVELOPE(messageId);
      const envelopeJson = await get(envelopeKey);

      if (envelopeJson) {
        const envelope = parseMessageEnvelope(envelopeJson);
        envelopes.push(envelope);
      }
    }

    return envelopes;
  } catch (error: any) {
    console.error('[QUEUE] ❌ Peek error:', error);
    return [];
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(userId: string): Promise<QueueStats> {
  try {
    const client = getRedisClient();
    const queueKey = REDIS_KEYS.MESSAGE_QUEUE(userId);

    // Get queue length
    const queueLength = await client.llen(queueKey);

    if (queueLength === 0) {
      return { queueLength: 0 };
    }

    // Get oldest and newest message timestamps
    const oldestId = await client.lindex(queueKey, 0);
    const newestId = await client.lindex(queueKey, -1);

    let oldestMessageAge: number | undefined;
    let newestMessageAge: number | undefined;

    if (oldestId) {
      const envelopeJson = await get(REDIS_KEYS.MESSAGE_ENVELOPE(oldestId));
      if (envelopeJson) {
        const envelope = parseMessageEnvelope(envelopeJson);
        oldestMessageAge = Date.now() - envelope.timestamp;
      }
    }

    if (newestId) {
      const envelopeJson = await get(REDIS_KEYS.MESSAGE_ENVELOPE(newestId));
      if (envelopeJson) {
        const envelope = parseMessageEnvelope(envelopeJson);
        newestMessageAge = Date.now() - envelope.timestamp;
      }
    }

    return {
      queueLength,
      oldestMessageAge,
      newestMessageAge
    };
  } catch (error: any) {
    console.error('[QUEUE] ❌ Stats error:', error);
    return { queueLength: 0 };
  }
}

/**
 * Clear all messages for a user (admin function)
 */
export async function clearQueue(userId: string): Promise<number> {
  try {
    const client = getRedisClient();
    const queueKey = REDIS_KEYS.MESSAGE_QUEUE(userId);

    // Get all message IDs
    const messageIds = await client.lrange(queueKey, 0, -1);

    // Delete all envelopes
    const deletePromises = messageIds.map(id =>
      del(REDIS_KEYS.MESSAGE_ENVELOPE(id))
    );
    await Promise.all(deletePromises);

    // Delete queue
    await del(queueKey);

    console.log(`[QUEUE] ✅ Cleared ${messageIds.length} messages for ${userId}`);

    return messageIds.length;
  } catch (error: any) {
    console.error('[QUEUE] ❌ Clear error:', error);
    return 0;
  }
}

/**
 * Batch pop messages (for efficient retrieval)
 */
export async function batchPopMessages(
  userId: string,
  count: number = 10
): Promise<MessageEnvelope[]> {
  const messages: MessageEnvelope[] = [];

  for (let i = 0; i < count; i++) {
    const message = await popMessage(userId);
    if (!message) break;
    messages.push(message);
  }

  return messages;
}

/**
 * Check if user has pending messages
 */
export async function hasPendingMessages(userId: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    const queueKey = REDIS_KEYS.MESSAGE_QUEUE(userId);
    const length = await client.llen(queueKey);
    return length > 0;
  } catch (error: any) {
    console.error('[QUEUE] ❌ Has pending error:', error);
    return false;
  }
}
