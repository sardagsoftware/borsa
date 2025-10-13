/**
 * SHARD_4.4 - Delivery Receipts & Tracking
 * Track message delivery, read status, and typing indicators
 *
 * Security: Only sender can query receipt status
 * White Hat: Metadata-only (no message content), privacy-preserving
 */

import {
  getRedisClient,
  getRedisSubscriber,
  REDIS_KEYS,
  setWithTTL,
  get
} from './redis-client';

export type ReceiptType = 'sent' | 'delivered' | 'read';

export interface DeliveryReceipt {
  messageId: string;
  status: ReceiptType;
  timestamp: number;
  deviceId: string;
}

export interface TypingIndicator {
  userId: string;
  chatId: string;
  isTyping: boolean;
  timestamp: number;
}

/**
 * Store delivery receipt
 */
export async function storeReceipt(
  messageId: string,
  status: ReceiptType,
  deviceId: string
): Promise<void> {
  try {
    const receipt: DeliveryReceipt = {
      messageId,
      status,
      timestamp: Date.now(),
      deviceId
    };

    const key = REDIS_KEYS.DELIVERY_RECEIPT(messageId);
    const ttl = 7 * 24 * 60 * 60; // 7 days

    await setWithTTL(key, JSON.stringify(receipt), ttl);

    console.log(`[RECEIPT] ✅ Stored ${status} receipt for ${messageId}`);

    // Publish receipt event for real-time updates
    await publishReceiptEvent(receipt);
  } catch (error: any) {
    console.error('[RECEIPT] ❌ Store error:', error);
  }
}

/**
 * Get delivery receipt
 */
export async function getReceipt(
  messageId: string
): Promise<DeliveryReceipt | null> {
  try {
    const key = REDIS_KEYS.DELIVERY_RECEIPT(messageId);
    const json = await get(key);

    if (!json) {
      return null;
    }

    return JSON.parse(json);
  } catch (error: any) {
    console.error('[RECEIPT] ❌ Get error:', error);
    return null;
  }
}

/**
 * Publish receipt event to pub/sub channel
 */
async function publishReceiptEvent(receipt: DeliveryReceipt): Promise<void> {
  try {
    const client = getRedisClient();
    const channel = `receipts:${receipt.messageId}`;
    await client.publish(channel, JSON.stringify(receipt));
  } catch (error: any) {
    console.error('[RECEIPT] ❌ Publish error:', error);
  }
}

/**
 * Subscribe to receipt events for a message
 */
export async function subscribeToReceipts(
  messageId: string,
  callback: (receipt: DeliveryReceipt) => void
): Promise<() => void> {
  const subscriber = getRedisSubscriber();
  const channel = `receipts:${messageId}`;

  const messageHandler = (ch: string, message: string) => {
    if (ch === channel) {
      try {
        const receipt: DeliveryReceipt = JSON.parse(message);
        callback(receipt);
      } catch (error) {
        console.error('[RECEIPT] ❌ Parse error:', error);
      }
    }
  };

  subscriber.on('message', messageHandler);
  await subscriber.subscribe(channel);

  console.log(`[RECEIPT] 📡 Subscribed to receipts for ${messageId}`);

  // Return unsubscribe function
  return async () => {
    subscriber.off('message', messageHandler);
    await subscriber.unsubscribe(channel);
    console.log(`[RECEIPT] 🔇 Unsubscribed from ${messageId}`);
  };
}

/**
 * Set typing indicator
 */
export async function setTypingIndicator(
  userId: string,
  chatId: string,
  isTyping: boolean
): Promise<void> {
  try {
    const client = getRedisClient();
    const key = REDIS_KEYS.TYPING_INDICATOR(chatId);

    if (isTyping) {
      // Store typing status with short TTL (5 seconds)
      await client.hset(key, userId, Date.now().toString());
      await client.expire(key, 5);
    } else {
      // Remove typing status
      await client.hdel(key, userId);
    }

    // Publish typing event
    const indicator: TypingIndicator = {
      userId,
      chatId,
      isTyping,
      timestamp: Date.now()
    };

    await client.publish(`typing:${chatId}`, JSON.stringify(indicator));

    console.log(`[TYPING] ${isTyping ? '⌨️' : '🛑'} ${userId} in ${chatId}`);
  } catch (error: any) {
    console.error('[TYPING] ❌ Set error:', error);
  }
}

/**
 * Get typing users in a chat
 */
export async function getTypingUsers(chatId: string): Promise<string[]> {
  try {
    const client = getRedisClient();
    const key = REDIS_KEYS.TYPING_INDICATOR(chatId);

    const typingData = await client.hgetall(key);
    const now = Date.now();
    const typingUsers: string[] = [];

    // Filter out stale typing indicators (>5 seconds old)
    for (const [userId, timestamp] of Object.entries(typingData)) {
      if (now - parseInt(timestamp) < 5000) {
        typingUsers.push(userId);
      }
    }

    return typingUsers;
  } catch (error: any) {
    console.error('[TYPING] ❌ Get error:', error);
    return [];
  }
}

/**
 * Subscribe to typing indicators in a chat
 */
export async function subscribeToTyping(
  chatId: string,
  callback: (indicator: TypingIndicator) => void
): Promise<() => void> {
  const subscriber = getRedisSubscriber();
  const channel = `typing:${chatId}`;

  const messageHandler = (ch: string, message: string) => {
    if (ch === channel) {
      try {
        const indicator: TypingIndicator = JSON.parse(message);
        callback(indicator);
      } catch (error) {
        console.error('[TYPING] ❌ Parse error:', error);
      }
    }
  };

  subscriber.on('message', messageHandler);
  await subscriber.subscribe(channel);

  console.log(`[TYPING] 📡 Subscribed to typing in ${chatId}`);

  // Return unsubscribe function
  return async () => {
    subscriber.off('message', messageHandler);
    await subscriber.unsubscribe(channel);
    console.log(`[TYPING] 🔇 Unsubscribed from ${chatId}`);
  };
}

/**
 * Set device presence (online/offline)
 */
export async function setDevicePresence(
  deviceId: string,
  isOnline: boolean
): Promise<void> {
  try {
    const client = getRedisClient();
    const key = REDIS_KEYS.DEVICE_PRESENCE(deviceId);

    if (isOnline) {
      // Set presence with 60 second TTL (refreshed by heartbeat)
      await setWithTTL(key, Date.now().toString(), 60);
    } else {
      // Remove presence
      await client.del(key);
    }

    console.log(`[PRESENCE] ${isOnline ? '🟢' : '🔴'} Device ${deviceId}`);
  } catch (error: any) {
    console.error('[PRESENCE] ❌ Set error:', error);
  }
}

/**
 * Check if device is online
 */
export async function isDeviceOnline(deviceId: string): Promise<boolean> {
  try {
    const key = REDIS_KEYS.DEVICE_PRESENCE(deviceId);
    const presence = await get(key);
    return presence !== null;
  } catch (error: any) {
    console.error('[PRESENCE] ❌ Check error:', error);
    return false;
  }
}

/**
 * Get device last seen timestamp
 */
export async function getDeviceLastSeen(deviceId: string): Promise<number | null> {
  try {
    const key = REDIS_KEYS.DEVICE_PRESENCE(deviceId);
    const presence = await get(key);

    if (!presence) {
      return null;
    }

    return parseInt(presence);
  } catch (error: any) {
    console.error('[PRESENCE] ❌ Last seen error:', error);
    return null;
  }
}
