/**
 * React Hook for Realtime Data Streaming
 * Automatically manages connection, subscriptions, and state
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeClient } from './client';
import type { Topic, RealtimeMessage } from './types';

interface UseRealtimeOptions {
  scopes?: string[];
  autoConnect?: boolean;
}

interface UseRealtimeResult<T> {
  data: T | null;
  connected: boolean;
  error: string | null;
  stats: {
    messagesReceived: number;
    reconnectCount: number;
  };
}

/**
 * React hook for realtime data streaming
 *
 * @example
 * ```tsx
 * const { data, connected } = useRealtime<KPIData>('kpis.s2');
 * ```
 */
export function useRealtime<T = any>(
  topic: Topic,
  options: UseRealtimeOptions = {}
): UseRealtimeResult<T> {
  const {
    scopes = ['ops.admin'],
    autoConnect = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    messagesReceived: 0,
    reconnectCount: 0,
  });

  const clientRef = useRef<RealtimeClient | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Get config from environment
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3100';
    const secret = process.env.NEXT_PUBLIC_RT_SECRET || 'dev-secret-change-in-production';

    // Create client if not exists
    if (!clientRef.current) {
      console.log('[useRealtime] Creating client for topic:', topic);

      clientRef.current = new RealtimeClient({
        url: baseUrl,
        secret,
        scopes,
      });

      // Set up message handler
      clientRef.current.onMessage((message: RealtimeMessage) => {
        if (message.t === topic) {
          console.log('[useRealtime] Data received for topic:', topic);
          setData(message.d as T);
          setError(null);
        } else if (message.t === 'error') {
          console.error('[useRealtime] Error:', message.message);
          setError(message.message || 'Unknown error');
        }
      });

      // Set up connection handler
      clientRef.current.onConnection((isConnected: boolean) => {
        console.log('[useRealtime] Connection status:', isConnected);
        setConnected(isConnected);

        if (isConnected) {
          setError(null);
        }
      });

      // Connect
      clientRef.current.connect();
    }

    // Subscribe to topic
    clientRef.current.subscribe(topic);

    // Update stats periodically
    const statsInterval = setInterval(() => {
      if (clientRef.current) {
        const currentStats = clientRef.current.getStats();
        setStats({
          messagesReceived: currentStats.messagesReceived,
          reconnectCount: currentStats.reconnectCount,
        });
      }
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(statsInterval);
      if (clientRef.current) {
        clientRef.current.unsubscribe(topic);
      }
    };
  }, [topic, scopes, autoConnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

  return {
    data,
    connected,
    error,
    stats,
  };
}

/**
 * Hook for multiple topics
 */
export function useRealtimeMulti<T = any>(
  topics: Topic[],
  options: UseRealtimeOptions = {}
): Record<Topic, UseRealtimeResult<T>> {
  const results: Record<string, UseRealtimeResult<T>> = {};

  for (const topic of topics) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[topic] = useRealtime<T>(topic, options);
  }

  return results as Record<Topic, UseRealtimeResult<T>>;
}

/**
 * Hook for connection status only (no data subscription)
 */
export function useRealtimeConnection(
  scopes: string[] = ['ops.admin']
): { connected: boolean; stats: any } {
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({ messagesReceived: 0, reconnectCount: 0 });

  const clientRef = useRef<RealtimeClient | null>(null);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3100';
    const secret = process.env.NEXT_PUBLIC_RT_SECRET || 'dev-secret-change-in-production';

    if (!clientRef.current) {
      clientRef.current = new RealtimeClient({
        url: baseUrl,
        secret,
        scopes,
      });

      clientRef.current.onConnection(setConnected);
      clientRef.current.connect();
    }

    const interval = setInterval(() => {
      if (clientRef.current) {
        const currentStats = clientRef.current.getStats();
        setStats({
          messagesReceived: currentStats.messagesReceived,
          reconnectCount: currentStats.reconnectCount,
        });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [scopes]);

  return { connected, stats };
}
