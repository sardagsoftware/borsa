/**
 * WebSocket Heartbeat / Keep-Alive System
 * Implements ping/pong mechanism for connection liveness
 */

import type { WebSocket } from 'ws';

const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const HEARTBEAT_TIMEOUT = 30000; // 30 seconds

interface HeartbeatWebSocket extends WebSocket {
  isAlive: boolean;
  _heartbeatInterval?: NodeJS.Timeout;
  _heartbeatTimeout?: NodeJS.Timeout;
}

/**
 * Enable heartbeat for WebSocket connection
 * Automatically terminates dead connections
 */
export function enableHeartbeat(ws: WebSocket): void {
  const hws = ws as HeartbeatWebSocket;

  // Mark as alive initially
  hws.isAlive = true;

  // Update alive status on pong
  hws.on('pong', () => {
    hws.isAlive = true;
    if (hws._heartbeatTimeout) {
      clearTimeout(hws._heartbeatTimeout);
    }
  });

  // Periodic ping
  hws._heartbeatInterval = setInterval(() => {
    if (!hws.isAlive) {
      console.log('[RT Heartbeat] Connection dead, terminating');
      clearInterval(hws._heartbeatInterval!);
      return hws.terminate();
    }

    // Mark as not alive, expecting pong
    hws.isAlive = false;

    try {
      hws.ping();

      // Set timeout for pong response
      hws._heartbeatTimeout = setTimeout(() => {
        console.log('[RT Heartbeat] Pong timeout, terminating');
        hws.terminate();
      }, HEARTBEAT_TIMEOUT);
    } catch (err) {
      console.error('[RT Heartbeat] Ping error:', err);
      hws.terminate();
    }
  }, HEARTBEAT_INTERVAL);

  // Cleanup on close
  hws.on('close', () => {
    if (hws._heartbeatInterval) {
      clearInterval(hws._heartbeatInterval);
    }
    if (hws._heartbeatTimeout) {
      clearTimeout(hws._heartbeatTimeout);
    }
  });
}

/**
 * Send heartbeat message (application-level)
 */
export function sendHeartbeat(ws: WebSocket): void {
  try {
    const message = JSON.stringify({
      t: 'heartbeat',
      ts: Date.now(),
    });
    (ws as any)._send?.(message) || ws.send(message);
  } catch (err) {
    console.error('[RT Heartbeat] Send error:', err);
  }
}
