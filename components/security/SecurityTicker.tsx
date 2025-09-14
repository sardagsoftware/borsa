'use client';

import { useState, useEffect } from 'react';
import { Shield, Clock, Activity } from 'lucide-react';

interface SecurityTickerProps {
  className?: string;
}

export function SecurityTicker({ className = '' }: SecurityTickerProps) {
  const [securityScore, setSecurityScore] = useState<number>(85);
  const [lastScan, setLastScan] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Load initial security status
    loadSecurityStatus();
    
    // Update every 30 seconds
    const interval = setInterval(loadSecurityStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityStatus = async () => {
    try {
      const response = await fetch('/api/sec/scan/status');
      if (response.ok) {
        const data = await response.json();
        if (data.lastScan) {
          setSecurityScore(data.lastScan.score);
          setLastScan(new Date(data.lastScan.timestamp).toLocaleTimeString());
        }
      }
    } catch (error) {
      console.error('Failed to load security status:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={`flex items-center gap-4 px-4 py-2 bg-binance-panel rounded-lg border border-gray-600 ${className}`}>
      {/* Security Shield Icon */}
      <div className="flex items-center gap-2">
        <Shield className={`w-5 h-5 ${getScoreColor(securityScore)}`} />
        <span className="text-binance-textSecondary text-sm">Security</span>
      </div>

      {/* Security Score */}
      <div className="flex items-center gap-1">
        <span className={`font-bold text-lg ${getScoreColor(securityScore)}`}>
          {securityScore}
        </span>
        <span className="text-binance-textSecondary text-xs">/100</span>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        {isScanning ? (
          <Activity className="w-4 h-4 text-binance-yellow animate-pulse" />
        ) : (
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        )}
      </div>

      {/* Last Scan Time */}
      {lastScan && (
        <div className="flex items-center gap-1 text-xs text-binance-textSecondary">
          <Clock className="w-3 h-3" />
          <span>{lastScan}</span>
        </div>
      )}
    </div>
  );
}
