/**
 * SHARD_16.3 - Redis Delivery Integration Layer (Browser-Safe)
 * High-level API for message delivery in ChatContext
 *
 * Browser-compatible implementation using API calls
 * In production, would use WebSocket or SSE for real-time delivery
 *
 * White Hat: Encrypted messages, zero-knowledge
 */

import type { Message } from '../chat/ChatContext';

/**
 * Note: This is a browser-safe implementation.
 * For server-side, use ../delivery/queue directly which has real Redis.
 * In production, this would call API endpoints that interact with Redis.
 */

/**
 * Enqueue message for delivery
 * In production: POST to /api/messages/send which pushes to Redis
 * For now: Simulates successful send
 *
 * @param message - Message from ChatContext
 * @returns Success status
 */
export async function enqueueMessage(message: Message): Promise<boolean> {
  try {
    // TODO: POST /api/messages/send with encrypted message
    // const response = await fetch('/api/messages/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     id: message.id,
    //     chatId: message.chatId,
    //     encryptedContent: message.content,
    //     contentType: message.contentType,
    //     timestamp: message.timestamp
    //   })
    // });
    //
    // if (!response.ok) return false;

    // Demo: Simulate successful send
    console.log(`[Delivery] ✅ Enqueued message ${message.id} (demo mode)`);

    // Store in localStorage for demo (would be Redis in production)
    const storageKey = `pending-messages-${extractRecipientId(message.chatId, message.senderId)}`;
    const pending = JSON.parse(localStorage.getItem(storageKey) || '[]');
    pending.push(message);
    localStorage.setItem(storageKey, JSON.stringify(pending));

    return true;
  } catch (error) {
    console.error('[Delivery] ❌ Enqueue error:', error);
    return false;
  }
}

/**
 * Subscribe to incoming messages for current user
 * In production: WebSocket connection to /api/ws/messages
 * For now: Polls localStorage for demo messages
 *
 * @param userId - Current user ID
 * @param callback - Function to call with each new message
 * @returns Unsubscribe function
 */
export function subscribeToMessages(
  userId: string,
  callback: (message: Message) => void
): () => void {
  let isSubscribed = true;
  let pollInterval: ReturnType<typeof setTimeout>;

  // TODO: Real WebSocket connection
  // const ws = new WebSocket('ws://localhost:3200/api/ws/messages');
  // ws.onmessage = (event) => {
  //   const message = JSON.parse(event.data);
  //   callback(message);
  // };

  // Demo: Poll localStorage every 2 seconds
  const poll = () => {
    if (!isSubscribed) return;

    try {
      const storageKey = `pending-messages-${userId}`;
      const pending = JSON.parse(localStorage.getItem(storageKey) || '[]');

      if (pending.length > 0) {
        // Process all pending messages
        for (const message of pending) {
          callback(message);
        }

        // Clear processed messages
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('[Delivery] ❌ Poll error:', error);
    }

    // Schedule next poll
    if (isSubscribed) {
      pollInterval = setTimeout(poll, 2000);
    }
  };

  // Start polling after 1 second
  pollInterval = setTimeout(poll, 1000);

  // Return unsubscribe function
  return () => {
    isSubscribed = false;
    if (pollInterval) {
      clearTimeout(pollInterval);
    }
    console.log(`[Delivery] ✅ Unsubscribed ${userId}`);
  };
}

/**
 * Get pending message count for user
 */
export async function getPendingMessageCount(userId: string): Promise<number> {
  try {
    // TODO: GET /api/messages/pending/count
    const storageKey = `pending-messages-${userId}`;
    const pending = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return pending.length;
  } catch (error) {
    console.error('[Delivery] ❌ Pending count error:', error);
    return 0;
  }
}

/**
 * Peek at pending messages without removing them
 */
export async function previewPendingMessages(
  userId: string,
  limit: number = 10
): Promise<Message[]> {
  try {
    // TODO: GET /api/messages/pending?limit=X
    const storageKey = `pending-messages-${userId}`;
    const pending = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return pending.slice(0, limit);
  } catch (error) {
    console.error('[Delivery] ❌ Preview error:', error);
    return [];
  }
}

// ========== Helper Functions ==========

/**
 * Extract recipient ID from chatId
 * Format: "chat-{user1}-{user2}" or "chat-{groupId}"
 */
function extractRecipientId(chatId: string, senderId: string): string {
  // For 1-1 chats: chat-user1-user2
  const parts = chatId.split('-');
  if (parts.length === 3) {
    // Return the user ID that's not the sender
    return parts[1] === senderId ? parts[2] : parts[1];
  }

  // For group chats or unknown format, return chatId
  return chatId;
}


/**
 * Send delivery receipt
 * Updates message status to 'delivered' or 'read'
 */
export async function sendDeliveryReceipt(
  messageId: string,
  status: 'delivered' | 'read'
): Promise<void> {
  try {
    // TODO: Implement delivery receipt via Redis pub/sub
    // For now, just log
    console.log(`[Delivery] ✅ Receipt sent: ${messageId} → ${status}`);
  } catch (error) {
    console.error('[Delivery] ❌ Receipt error:', error);
  }
}

/**
 * Mark messages as read
 * Sends read receipts for multiple messages
 */
export async function markMessagesAsRead(messageIds: string[]): Promise<void> {
  try {
    await Promise.all(messageIds.map(id => sendDeliveryReceipt(id, 'read')));
    console.log(`[Delivery] ✅ Marked ${messageIds.length} messages as read`);
  } catch (error) {
    console.error('[Delivery] ❌ Mark read error:', error);
  }
}
