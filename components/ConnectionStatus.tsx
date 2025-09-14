'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConnectionStatusProps {
  className?: string;
}

export default function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  useEffect(() => {
    let ws: WebSocket | null = null;
    let pingInterval: NodeJS.Timeout | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      try {
        // WebSocket bağlantısı kurulumu
        const wsUrl = process.env.NODE_ENV === 'production' 
          ? 'wss://your-ws-server.com/ws' 
          : 'ws://localhost:3001/ws';
        
        ws = new WebSocket(wsUrl);
        setConnectionStatus('connecting');

        ws.onopen = () => {
          console.log('WebSocket bağlantısı kuruldu');
          setIsConnected(true);
          setConnectionStatus('connected');
          setLastUpdate(new Date());
          
          // Ping/pong ile bağlantı kalitesini ölç
          if (pingInterval) clearInterval(pingInterval);
          pingInterval = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              const startTime = Date.now();
              ws.send(JSON.stringify({ type: 'ping', timestamp: startTime }));
            }
          }, 5000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'pong') {
              const currentLatency = Date.now() - data.timestamp;
              setLatency(currentLatency);
            }
            
            setLastUpdate(new Date());
          } catch (error) {
            console.error('WebSocket mesaj ayrıştırma hatası:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket bağlantısı kapandı:', event.code, event.reason);
          setIsConnected(false);
          setConnectionStatus('disconnected');
          
          if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
          }

          // Otomatik yeniden bağlanma
          if (!event.wasClean) {
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, 3000);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket hatası:', error);
          setConnectionStatus('error');
          setIsConnected(false);
        };

      } catch (error) {
        console.error('WebSocket bağlantı hatası:', error);
        setConnectionStatus('error');
        setIsConnected(false);
        
        // Hata durumunda yeniden deneme
        reconnectTimeout = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      }
    };

    // İlk bağlantı
    connectWebSocket();

    // Cleanup
    return () => {
      if (ws) {
        ws.close();
      }
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-orange-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4" />;
      case 'connecting':
        return <Activity className="w-4 h-4 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Wifi className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Bağlı';
      case 'connecting':
        return 'Bağlanıyor...';
      case 'disconnected':
        return 'Bağlantı Kesildi';
      case 'error':
        return 'Bağlantı Hatası';
      default:
        return 'Bilinmiyor';
    }
  };

  const getLatencyColor = () => {
    if (!latency) return 'text-gray-500';
    if (latency < 50) return 'text-green-500';
    if (latency < 150) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Indicator */}
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>

      {/* Connection Details */}
      {isConnected && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
          <span>Canlı</span>
          
          {latency && (
            <>
              <span className="text-gray-400">•</span>
              <span className={getLatencyColor()}>
                {latency}ms
              </span>
            </>
          )}
          
          {lastUpdate && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">
                {lastUpdate.toLocaleTimeString('tr-TR')}
              </span>
            </>
          )}
        </div>
      )}

      {/* Reconnecting Animation */}
      {connectionStatus === 'connecting' && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce animation-delay-100"></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce animation-delay-200"></div>
        </div>
      )}
    </div>
  );
}
