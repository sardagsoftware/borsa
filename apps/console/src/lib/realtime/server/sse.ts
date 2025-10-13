/**
 * Server-Sent Events (SSE) Fallback Implementation
 * For clients that can't use WebSocket
 *
 * White-hat: KVKK/GDPR compliant, no PII
 */

import type { Request, Response } from 'express';
import crypto from 'crypto';
import { verifyHMAC, rbacHas, getTopicScopes, checkNonce } from './auth';
import { subscribers, type Subscriber, type Topic } from './topics';
import { WebSocket } from 'ws';

interface SSEConnection {
  id: string;
  res: Response;
  topics: Set<Topic>;
  scopes: string[];
  connectedAt: number;
  lastActivity: number;
  heartbeatInterval?: NodeJS.Timeout;
}

// SSE connection registry
const sseConnections = new Map<string, SSEConnection>();

/**
 * SSE endpoint handler
 */
export function createSSEHandler(secret: string) {
  return (req: Request, res: Response) => {
    // Extract auth parameters
    const { ts, nonce, sig, scopes: scopesParam } = req.query;
    const scopes = String(scopesParam || '').split(',').filter(Boolean);

    // Verify HMAC
    const authOk = verifyHMAC(
      String(sig || ''),
      String(ts || ''),
      String(nonce || ''),
      'connect',
      secret
    );

    if (!authOk) {
      console.warn('[RT SSE] Auth failed');
      res.status(403).end('Authentication failed');
      return;
    }

    // Check nonce for replay attacks
    if (!checkNonce(String(nonce || ''))) {
      console.warn('[RT SSE] Replay attack detected');
      res.status(403).end('Replay attack detected');
      return;
    }

    // Set up SSE response headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Create connection
    const id = crypto.randomUUID();
    const connection: SSEConnection = {
      id,
      res,
      topics: new Set(),
      scopes,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
    };

    sseConnections.set(id, connection);

    console.log('[RT SSE] Client connected:', { id, scopes });

    // Send hello event
    sendSSE(connection, 'hello', {
      id,
      ts: Date.now(),
      scopes,
    });

    // Set up heartbeat
    connection.heartbeatInterval = setInterval(() => {
      sendSSE(connection, 'ping', { ts: Date.now() });
    }, 15000);

    // Handle client disconnect
    req.on('close', () => {
      console.log('[RT SSE] Client disconnected:', { id });
      if (connection.heartbeatInterval) {
        clearInterval(connection.heartbeatInterval);
      }
      sseConnections.delete(id);
    });

    // Create fake WebSocket interface for compatibility with subscribers system
    const fakeWS = createFakeWebSocket(connection);

    // Add to subscribers (for fanout compatibility)
    subscribers.set(id, {
      id,
      ws: fakeWS as any,
      topics: connection.topics,
      scopes: connection.scopes,
      connectedAt: connection.connectedAt,
      lastActivity: connection.lastActivity,
    });
  };
}

/**
 * Send SSE message
 */
function sendSSE(connection: SSEConnection, event: string, data: any): void {
  try {
    const payload = JSON.stringify(data);
    connection.res.write(`event: ${event}\n`);
    connection.res.write(`data: ${payload}\n\n`);
    connection.lastActivity = Date.now();
  } catch (err) {
    console.error('[RT SSE] Send error:', err);
  }
}

/**
 * Create fake WebSocket interface for SSE
 * Allows SSE to work with the existing fanout system
 */
function createFakeWebSocket(connection: SSEConnection): Partial<WebSocket> {
  return {
    readyState: 1, // OPEN
    send: (data: string) => {
      try {
        const message = JSON.parse(data);
        sendSSE(connection, message.t || 'message', message);
      } catch {
        sendSSE(connection, 'message', { data });
      }
    },
    close: () => {
      connection.res.end();
    },
    _send: (data: string) => {
      try {
        const message = JSON.parse(data);
        sendSSE(connection, message.t || 'message', message);
      } catch {
        sendSSE(connection, 'message', { data });
      }
    },
  } as any;
}

/**
 * Handle SSE subscription (via query params or separate endpoint)
 */
export function handleSSESubscribe(
  connectionId: string,
  topic: Topic,
  scopes: string[]
): boolean {
  const connection = sseConnections.get(connectionId);
  if (!connection) return false;

  // Check RBAC
  const requiredScopes = getTopicScopes(topic);
  if (!rbacHas(scopes, requiredScopes)) {
    sendSSE(connection, 'error', {
      code: 403,
      message: `Insufficient permissions for topic ${topic}`,
      required: requiredScopes,
    });
    return false;
  }

  // Add topic
  connection.topics.add(topic);

  // Update subscriber
  const subscriber = subscribers.get(connectionId);
  if (subscriber) {
    subscriber.topics.add(topic);
  }

  console.log('[RT SSE] Subscribed:', { id: connectionId, topic });

  sendSSE(connection, 'sub.ok', {
    topic,
    ts: Date.now(),
  });

  return true;
}

/**
 * Cleanup stale SSE connections
 */
export function cleanupSSEConnections(): void {
  const now = Date.now();
  const STALE_TIMEOUT = 60000; // 1 minute

  for (const [id, conn] of sseConnections.entries()) {
    if (now - conn.lastActivity > STALE_TIMEOUT) {
      console.log('[RT SSE] Removing stale connection:', id);
      if (conn.heartbeatInterval) {
        clearInterval(conn.heartbeatInterval);
      }
      conn.res.end();
      sseConnections.delete(id);
      subscribers.delete(id);
    }
  }
}

// Cleanup stale SSE connections every 30 seconds
setInterval(cleanupSSEConnections, 30000);
