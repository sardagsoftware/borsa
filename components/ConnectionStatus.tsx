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
    let healthCheckInterval: NodeJS.Timeout | null = null;
    
    // WebSocket yerine simple health check kullan
    const checkConnectionHealth = async () => {
      try {
        setConnectionStatus('connecting');
        const startTime = Date.now();
        
        // Health check API endpoint'ine ping at
        const response = await fetch('/api/healthz', {
          method: 'GET',
          cache: 'no-cache'
        });
        
        const endTime = Date.now();
        const currentLatency = endTime - startTime;
        
        if (response.ok) {
          setIsConnected(true);
          setConnectionStatus('connected');
          setLatency(currentLatency);
          setLastUpdate(new Date());
        } else {
          throw new Error('Health check failed');
        }
      } catch (error) {
        console.error('Connection health check error:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        setLatency(null);
      }
    };

    // İlk kontrol
    checkConnectionHealth();
    
    // Periyodik kontrol (her 10 saniyede bir)
    healthCheckInterval = setInterval(checkConnectionHealth, 10000);

    // Cleanup
    return () => {
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
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
