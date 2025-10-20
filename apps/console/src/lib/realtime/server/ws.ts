/**
 * WebSocket Server Implementation
 * Real-time gateway with HMAC auth, RBAC, and backpressure
 *
 * White-hat: KVKK/GDPR compliant, no PII, attested logs
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import crypto from 'crypto';
import { verifyHMAC, rbacHas, getTopicScopes, checkNonce } from './auth';
import { subscribers, fanout, send, getStats, type Subscriber, type Topic } from './topics';
import { applyBackpressure } from './backpressure';
import { enableHeartbeat } from './heartbeat';

interface WSMessage {
  cmd: 'subscribe' | 'unsubscribe' | 'ping';
  topic?: Topic;
  data?: any;
}

/**
 * Start WebSocket server on /rt path
 */
export function startWebSocketServer(server: HttpServer, secret: string): WebSocketServer {
  const wss = new WebSocketServer({
    noServer: true,
    path: '/rt',
    perMessageDeflate: true, // Enable compression
    clientTracking: true,
  });

  // Handle HTTP upgrade requests
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url!, `http://${request.headers.host}`);

    if (url.pathname !== '/rt') {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, url);
    });
  });

  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket, request: any, url: URL) => {
    handleConnection(ws, url, secret);
  });

  // Log server status
  console.log('[RT WS] WebSocket server started on /rt');

  // Periodic stats logging
  setInterval(() => {
    const stats = getStats();
    console.log('[RT WS] Stats:', stats);
  }, 60000); // Every minute

  return wss;
}

/**
 * Handle individual WebSocket connection
 */
function handleConnection(ws: WebSocket, url: URL, secret: string): void {
  // Apply backpressure handling
  applyBackpressure(ws);

  // Enable heartbeat
  enableHeartbeat(ws);

  // Extract auth parameters
  const ts = url.searchParams.get('ts') || '';
  const nonce = url.searchParams.get('nonce') || '';
  const sig = url.searchParams.get('sig') || '';
  const scopesParam = url.searchParams.get('scopes') || '';
  const scopes = scopesParam.split(',').filter(Boolean);

  // Verify HMAC signature
  const authOk = verifyHMAC(sig, ts, nonce, 'connect', secret);

  if (!authOk) {
    console.warn('[RT WS] Auth failed:', { ts, nonce: nonce.substring(0, 8) });
    ws.close(4403, 'Authentication failed');
    return;
  }

  // Check nonce for replay attacks
  if (!checkNonce(nonce)) {
    console.warn('[RT WS] Replay attack detected:', { nonce: nonce.substring(0, 8) });
    ws.close(4403, 'Replay attack detected');
    return;
  }

  // Create subscriber
  const id = crypto.randomUUID();
  const subscriber: Subscriber = {
    id,
    ws,
    topics: new Set(),
    scopes,
    connectedAt: Date.now(),
    lastActivity: Date.now(),
  };

  subscribers.set(id, subscriber);

  console.log('[RT WS] Client connected:', { id, scopes });

  // Send hello message
  send(id, {
    t: 'hello',
    id,
    ts: Date.now(),
    scopes,
  });

  // Handle incoming messages
  ws.on('message', (raw: Buffer) => {
    try {
      const message: WSMessage = JSON.parse(raw.toString());
      handleMessage(id, message);
      subscriber.lastActivity = Date.now();
    } catch (err) {
      console.error('[RT WS] Message parse error:', err);
      send(id, {
        t: 'error',
        code: 400,
        message: 'Invalid message format',
      });
    }
  });

  // Handle close
  ws.on('close', () => {
    console.log('[RT WS] Client disconnected:', { id });
    subscribers.delete(id);
  });

  // Handle error
  ws.on('error', (err) => {
    console.error('[RT WS] WebSocket error:', { id, error: err.message });
    subscribers.delete(id);
  });
}

/**
 * Handle WebSocket message
 */
function handleMessage(subscriberId: string, message: WSMessage): void {
  const subscriber = subscribers.get(subscriberId);
  if (!subscriber) return;

  switch (message.cmd) {
    case 'subscribe':
      handleSubscribe(subscriber, message.topic!);
      break;

    case 'unsubscribe':
      handleUnsubscribe(subscriber, message.topic!);
      break;

    case 'ping':
      send(subscriberId, { t: 'pong', ts: Date.now() });
      break;

    default:
      send(subscriberId, {
        t: 'error',
        code: 400,
        message: 'Unknown command',
      });
  }
}

/**
 * Handle topic subscription
 */
function handleSubscribe(subscriber: Subscriber, topic: Topic): void {
  // Check RBAC
  const requiredScopes = getTopicScopes(topic);
  if (!rbacHas(subscriber.scopes, requiredScopes)) {
    send(subscriber.id, {
      t: 'error',
      code: 403,
      message: `Insufficient permissions for topic ${topic}`,
      required: requiredScopes,
    });
    return;
  }

  // Add topic
  subscriber.topics.add(topic);

  console.log('[RT WS] Subscribed:', { id: subscriber.id, topic });

  send(subscriber.id, {
    t: 'sub.ok',
    topic,
    ts: Date.now(),
  });
}

/**
 * Handle topic unsubscription
 */
function handleUnsubscribe(subscriber: Subscriber, topic: Topic): void {
  subscriber.topics.delete(topic);

  console.log('[RT WS] Unsubscribed:', { id: subscriber.id, topic });

  send(subscriber.id, {
    t: 'unsub.ok',
    topic,
    ts: Date.now(),
  });
}

/**
 * Graceful shutdown
 */
export function shutdownWebSocketServer(wss: WebSocketServer): Promise<void> {
  return new Promise((resolve) => {
    console.log('[RT WS] Shutting down...');

    // Close all client connections
    for (const subscriber of subscribers.values()) {
      try {
        subscriber.ws.close(1001, 'Server shutting down');
      } catch {}
    }

    subscribers.clear();

    // Close server
    wss.close(() => {
      console.log('[RT WS] Shutdown complete');
      resolve();
    });
  });
}
