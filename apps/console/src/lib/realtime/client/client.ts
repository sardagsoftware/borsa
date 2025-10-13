/**
 * Realtime WebSocket Client
 * Auto-reconnection, heartbeat, SSE fallback
 *
 * White-hat: Client-side component for secure realtime communication
 */

'use client';

import { signBrowser } from '@/lib/security/hmac-browser';
import type {
  Topic,
  RealtimeMessage,
  RealtimeConfig,
  RealtimeStats,
  MessageHandler,
  ConnectionHandler,
} from './types';

export class RealtimeClient {
  private config: RealtimeConfig;
  private ws?: WebSocket;
  private sse?: EventSource;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private subscribedTopics: Set<Topic> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private stats: RealtimeStats = {
    connected: false,
    reconnectCount: 0,
    messagesReceived: 0,
    messagesSent: 0,
    lastMessageTime: null,
  };

  constructor(config: RealtimeConfig) {
    this.config = {
      reconnectDelay: 2000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    try {
      // Generate HMAC auth parameters
      const { ts, nonce, sig } = await signBrowser('connect', this.config.secret);

      // Build WebSocket URL
      const wsUrl = this.config.url.replace(/^http/, 'ws');
      const params = new URLSearchParams({
        ts,
        nonce,
        sig,
        scopes: this.config.scopes.join(','),
      });

      const url = `${wsUrl}/rt?${params}`;

      console.log('[RT Client] Connecting to WebSocket:', wsUrl);

      // Create WebSocket connection
      this.ws = new WebSocket(url);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onclose = () => this.handleClose();
      this.ws.onerror = (error) => this.handleError(error);

      // Set connection timeout
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.warn('[RT Client] Connection timeout, trying SSE fallback');
          this.connectSSE();
        }
      }, 5000);
    } catch (error) {
      console.error('[RT Client] Connection error:', error);
      this.connectSSE();
    }
  }

  /**
   * Connect using SSE fallback
   */
  private async connectSSE(): Promise<void> {
    try {
      // Generate HMAC auth parameters
      const { ts, nonce, sig } = await signBrowser('connect', this.config.secret);

      // Build SSE URL
      const params = new URLSearchParams({
        ts,
        nonce,
        sig,
        scopes: this.config.scopes.join(','),
      });

      const url = `${this.config.url}/rt/sse?${params}`;

      console.log('[RT Client] Connecting to SSE:', url);

      // Create EventSource connection
      this.sse = new EventSource(url);

      this.sse.onopen = () => {
        console.log('[RT Client] SSE connected');
        this.stats.connected = true;
        this.notifyConnectionHandlers(true);
        this.resubscribe();
      };

      this.sse.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          this.handleRealtimeMessage(message);
        } catch (err) {
          console.error('[RT Client] SSE message parse error:', err);
        }
      };

      this.sse.onerror = () => {
        console.error('[RT Client] SSE error');
        this.handleClose();
      };
    } catch (error) {
      console.error('[RT Client] SSE connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket open
   */
  private handleOpen(): void {
    console.log('[RT Client] WebSocket connected');
    this.stats.connected = true;
    this.reconnectAttempts = 0;
    this.notifyConnectionHandlers(true);

    // Start heartbeat
    this.startHeartbeat();

    // Resubscribe to topics
    this.resubscribe();
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: RealtimeMessage = JSON.parse(event.data);
      this.handleRealtimeMessage(message);
    } catch (err) {
      console.error('[RT Client] Message parse error:', err);
    }
  }

  /**
   * Handle realtime message
   */
  private handleRealtimeMessage(message: RealtimeMessage): void {
    this.stats.messagesReceived++;
    this.stats.lastMessageTime = Date.now();

    console.log('[RT Client] Received:', message.t);

    // Handle system messages
    if (message.t === 'hello') {
      console.log('[RT Client] Hello received:', message.d);
      return;
    }

    if (message.t === 'pong' || message.t === 'heartbeat') {
      return; // Ignore heartbeat messages
    }

    if (message.t === 'error') {
      console.error('[RT Client] Server error:', message);
      return;
    }

    // Notify handlers
    for (const handler of this.messageHandlers) {
      try {
        handler(message);
      } catch (err) {
        console.error('[RT Client] Handler error:', err);
      }
    }
  }

  /**
   * Handle connection close
   */
  private handleClose(): void {
    console.log('[RT Client] Connection closed');
    this.stats.connected = false;
    this.stopHeartbeat();
    this.notifyConnectionHandlers(false);

    // Clean up
    if (this.ws) {
      this.ws = undefined;
    }
    if (this.sse) {
      this.sse.close();
      this.sse = undefined;
    }

    // Schedule reconnect
    this.scheduleReconnect();
  }

  /**
   * Handle connection error
   */
  private handleError(error: Event): void {
    console.error('[RT Client] WebSocket error:', error);
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      console.error('[RT Client] Max reconnect attempts reached');
      return;
    }

    const delay = this.config.reconnectDelay! * Math.pow(2, this.reconnectAttempts);
    console.log(`[RT Client] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.stats.reconnectCount++;
      this.connect();
    }, delay);
  }

  /**
   * Subscribe to topic
   */
  subscribe(topic: Topic): void {
    this.subscribedTopics.add(topic);

    if (this.stats.connected && this.ws) {
      this.send({ cmd: 'subscribe', topic });
    }
  }

  /**
   * Unsubscribe from topic
   */
  unsubscribe(topic: Topic): void {
    this.subscribedTopics.delete(topic);

    if (this.stats.connected && this.ws) {
      this.send({ cmd: 'unsubscribe', topic });
    }
  }

  /**
   * Resubscribe to all topics (after reconnection)
   */
  private resubscribe(): void {
    for (const topic of this.subscribedTopics) {
      this.send({ cmd: 'subscribe', topic });
    }
  }

  /**
   * Send message to server
   */
  private send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[RT Client] Cannot send, not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
      this.stats.messagesSent++;
    } catch (err) {
      console.error('[RT Client] Send error:', err);
    }
  }

  /**
   * Add message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Add connection handler
   */
  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Notify connection handlers
   */
  private notifyConnectionHandlers(connected: boolean): void {
    for (const handler of this.connectionHandlers) {
      try {
        handler(connected);
      } catch (err) {
        console.error('[RT Client] Connection handler error:', err);
      }
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ cmd: 'ping' });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Get connection stats
   */
  getStats(): RealtimeStats {
    return { ...this.stats };
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    console.log('[RT Client] Disconnecting');

    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.stopHeartbeat();

    // Close connections
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    if (this.sse) {
      this.sse.close();
      this.sse = undefined;
    }

    // Clear state
    this.stats.connected = false;
    this.messageHandlers.clear();
    this.connectionHandlers.clear();
    this.subscribedTopics.clear();
  }
}
