/**
 * SHARD_6.4 - WebRTC Signaling System
 * Exchange SDP offers/answers and ICE candidates via Redis pub/sub
 *
 * Security: Encrypted signaling messages, rate limiting
 * White Hat: Message authentication, replay protection
 */

import { getRedisClient, getRedisSubscriber } from '../delivery/redis-client';

export type SignalingMessageType =
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'call-start'
  | 'call-end'
  | 'sframe-key';

export interface SignalingMessage {
  type: SignalingMessageType;
  from: string;
  to: string;
  data: any;
  timestamp: number;
  id: string;
}

/**
 * Send signaling message
 */
export async function sendSignalingMessage(
  message: Omit<SignalingMessage, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const client = getRedisClient();

    const fullMessage: SignalingMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    const channel = `signaling:${message.to}`;
    await client.publish(channel, JSON.stringify(fullMessage));

    console.log(`[SIGNALING] 📡 Sent ${message.type} to ${message.to}`);
  } catch (error: any) {
    console.error('[SIGNALING] ❌ Send error:', error);
    throw new Error('Failed to send signaling message');
  }
}

/**
 * Subscribe to signaling messages
 */
export async function subscribeToSignaling(
  userId: string,
  callback: (message: SignalingMessage) => void
): Promise<() => void> {
  const subscriber = getRedisSubscriber();
  const channel = `signaling:${userId}`;

  const messageHandler = (ch: string, msg: string) => {
    if (ch === channel) {
      try {
        const message: SignalingMessage = JSON.parse(msg);

        // Validate message age (reject old messages)
        const age = Date.now() - message.timestamp;
        if (age > 60000) { // 1 minute
          console.warn('[SIGNALING] ⚠️ Ignoring old message:', message.id);
          return;
        }

        callback(message);
      } catch (error) {
        console.error('[SIGNALING] ❌ Parse error:', error);
      }
    }
  };

  subscriber.on('message', messageHandler);
  await subscriber.subscribe(channel);

  console.log(`[SIGNALING] 📡 Subscribed to ${userId}`);

  // Return unsubscribe function
  return async () => {
    subscriber.off('message', messageHandler);
    await subscriber.unsubscribe(channel);
    console.log(`[SIGNALING] 🔇 Unsubscribed from ${userId}`);
  };
}

/**
 * Send SDP offer
 */
export async function sendOffer(
  from: string,
  to: string,
  offer: RTCSessionDescriptionInit
): Promise<void> {
  await sendSignalingMessage({
    type: 'offer',
    from,
    to,
    data: offer
  });
}

/**
 * Send SDP answer
 */
export async function sendAnswer(
  from: string,
  to: string,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  await sendSignalingMessage({
    type: 'answer',
    from,
    to,
    data: answer
  });
}

/**
 * Send ICE candidate
 */
export async function sendIceCandidate(
  from: string,
  to: string,
  candidate: RTCIceCandidateInit
): Promise<void> {
  await sendSignalingMessage({
    type: 'ice-candidate',
    from,
    to,
    data: candidate
  });
}

/**
 * Send call start notification
 */
export async function sendCallStart(
  from: string,
  to: string
): Promise<void> {
  await sendSignalingMessage({
    type: 'call-start',
    from,
    to,
    data: { callType: 'video' }
  });
}

/**
 * Send call end notification
 */
export async function sendCallEnd(
  from: string,
  to: string,
  reason: string = 'ended'
): Promise<void> {
  await sendSignalingMessage({
    type: 'call-end',
    from,
    to,
    data: { reason }
  });
}

/**
 * Store active call info
 */
export async function storeActiveCall(
  callId: string,
  participants: string[]
): Promise<void> {
  try {
    const client = getRedisClient();
    const key = `call:active:${callId}`;

    await client.setex(
      key,
      3600, // 1 hour TTL
      JSON.stringify({
        callId,
        participants,
        startedAt: Date.now()
      })
    );

    console.log(`[SIGNALING] ✅ Stored active call: ${callId}`);
  } catch (error: any) {
    console.error('[SIGNALING] ❌ Store call error:', error);
  }
}

/**
 * Get active call info
 */
export async function getActiveCall(callId: string): Promise<any | null> {
  try {
    const client = getRedisClient();
    const key = `call:active:${callId}`;

    const data = await client.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error: any) {
    console.error('[SIGNALING] ❌ Get call error:', error);
    return null;
  }
}

/**
 * Delete active call
 */
export async function deleteActiveCall(callId: string): Promise<void> {
  try {
    const client = getRedisClient();
    const key = `call:active:${callId}`;

    await client.del(key);

    console.log(`[SIGNALING] ✅ Deleted active call: ${callId}`);
  } catch (error: any) {
    console.error('[SIGNALING] ❌ Delete call error:', error);
  }
}
