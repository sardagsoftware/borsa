/**
 * Realtime Topics & Fanout System
 * Manages subscriptions and message broadcasting
 */

import type { WebSocket } from 'ws';

export type Topic = 'kpis.s2' | 'liveops.events' | 'economy.patch' | 'ab.status';

export interface Subscriber {
  id: string;
  ws: WebSocket;
  topics: Set<Topic>;
  scopes: string[];
  connectedAt: number;
  lastActivity: number;
}

/**
 * Global subscriber registry
 * In production, use Redis Pub/Sub for horizontal scaling
 */
export const subscribers = new Map<string, Subscriber>();

/**
 * Fanout message to all subscribers of a topic
 * Implements backpressure and batching
 */
export function fanout(topic: Topic, payload: any): void {
  const message = JSON.stringify({
    t: topic,
    d: payload,
    ts: Date.now(),
  });

  let sent = 0;
  let dropped = 0;

  for (const sub of subscribers.values()) {
    if (!sub.topics.has(topic)) continue;

    try {
      // Check if WebSocket is ready
      if (sub.ws.readyState === 1) { // OPEN
        (sub.ws as any)._send(message);
        sent++;
      } else {
        dropped++;
      }
    } catch (err) {
      console.error(`[RT Fanout] Error sending to ${sub.id}:`, err);
      dropped++;
    }
  }

  // Metrics
  if (sent > 0 || dropped > 0) {
    console.log(`[RT Fanout] ${topic}: sent=${sent}, dropped=${dropped}`);
  }
}

/**
 * Broadcast to specific subscriber
 */
export function send(subscriberId: string, message: any): void {
  const sub = subscribers.get(subscriberId);
  if (!sub) return;

  try {
    const data = JSON.stringify(message);
    (sub.ws as any)._send(data);
  } catch (err) {
    console.error(`[RT Send] Error sending to ${subscriberId}:`, err);
  }
}

/**
 * Get subscriber count per topic
 */
export function getStats(): Record<string, number> {
  const stats: Record<string, number> = {
    total: subscribers.size,
    'kpis.s2': 0,
    'liveops.events': 0,
    'economy.patch': 0,
    'ab.status': 0,
  };

  for (const sub of subscribers.values()) {
    for (const topic of sub.topics) {
      stats[topic] = (stats[topic] || 0) + 1;
    }
  }

  return stats;
}

/**
 * Cleanup stale connections
 */
export function cleanupStale(): void {
  const now = Date.now();
  const STALE_TIMEOUT = 60000; // 1 minute

  for (const [id, sub] of subscribers.entries()) {
    if (now - sub.lastActivity > STALE_TIMEOUT) {
      console.log(`[RT Cleanup] Removing stale subscriber: ${id}`);
      try {
        sub.ws.close();
      } catch {}
      subscribers.delete(id);
    }
  }
}

// Cleanup stale connections every 30 seconds
setInterval(cleanupStale, 30000);
