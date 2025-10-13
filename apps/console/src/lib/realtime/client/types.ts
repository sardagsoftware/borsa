/**
 * Realtime Client Type Definitions
 */

export type Topic = 'kpis.s2' | 'liveops.events' | 'economy.patch' | 'ab.status';

export interface RealtimeMessage {
  t: string; // type/topic
  d?: any; // data
  ts: number; // timestamp
  code?: number; // error code
  message?: string; // error message
}

export interface RealtimeConfig {
  url: string;
  secret: string;
  scopes: string[];
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export interface RealtimeStats {
  connected: boolean;
  reconnectCount: number;
  messagesReceived: number;
  messagesSent: number;
  lastMessageTime: number | null;
}

export type MessageHandler = (message: RealtimeMessage) => void;
export type ConnectionHandler = (connected: boolean) => void;
