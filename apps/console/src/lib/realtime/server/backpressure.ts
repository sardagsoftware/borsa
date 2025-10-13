/**
 * Backpressure & Batching System
 * Prevents buffer overflow and implements message dropping strategy
 */

import type { WebSocket } from 'ws';

const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB
const MAX_QUEUE_SIZE = 200; // Max queued messages
const FLUSH_INTERVAL = 50; // Flush every 50ms

interface BufferedWebSocket extends WebSocket {
  _buf: string[];
  _send: (data: string) => void;
  _flushInterval?: NodeJS.Timeout;
}

/**
 * Apply backpressure handling to WebSocket
 * Implements buffering, batching, and drop-oldest strategy
 */
export function applyBackpressure(ws: WebSocket): void {
  const bws = ws as BufferedWebSocket;

  // Initialize buffer
  bws._buf = [];

  // Custom send function with backpressure
  bws._send = (data: string): void => {
    // Check current buffer size
    if (bws.bufferedAmount > MAX_BUFFER_SIZE) {
      // Buffer is full, queue message
      bws._buf.push(data);

      // Drop oldest if queue too large (drop-oldest strategy)
      if (bws._buf.length > MAX_QUEUE_SIZE) {
        const dropped = bws._buf.shift();
        console.warn('[RT Backpressure] Dropped message (buffer full):', {
          queueSize: bws._buf.length,
          bufferedAmount: bws.bufferedAmount,
        });
      }
      return;
    }

    // Buffer has space, send immediately
    try {
      bws.send(data);
    } catch (err) {
      console.error('[RT Backpressure] Send error:', err);
    }
  };

  // Flush buffer periodically
  const flush = (): void => {
    if (bws.readyState !== 1) return; // Not OPEN

    while (bws._buf.length > 0 && bws.bufferedAmount < MAX_BUFFER_SIZE) {
      const data = bws._buf.shift();
      if (data) {
        try {
          bws.send(data);
        } catch (err) {
          console.error('[RT Backpressure] Flush error:', err);
          break;
        }
      }
    }
  };

  bws._flushInterval = setInterval(flush, FLUSH_INTERVAL);

  // Cleanup on close
  bws.on('close', () => {
    if (bws._flushInterval) {
      clearInterval(bws._flushInterval);
    }
    bws._buf = [];
  });
}

/**
 * Batch multiple messages into one
 * Useful for high-frequency updates
 */
export function batchMessages(messages: any[]): string {
  return JSON.stringify({
    t: 'batch',
    d: messages,
    ts: Date.now(),
    count: messages.length,
  });
}
