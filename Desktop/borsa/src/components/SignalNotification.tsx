'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, TrendingUp, TrendingDown, Activity, Clock, Zap } from 'lucide-react';

export interface SignalData {
  id: string;
  botName: string;
  botRoute: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  timestamp: Date;
  reasoning: string[];
}

interface SignalNotificationProps {
  signal: SignalData;
  onClose: () => void;
  autoClose?: number; // milliseconds
}

export function SignalNotification({ signal, onClose, autoClose = 10000 }: SignalNotificationProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!autoClose) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (autoClose / 100));
        if (newProgress <= 0) {
          onClose();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [autoClose, onClose]);

  const handleClick = () => {
    router.push(signal.botRoute);
    onClose();
  };

  const getActionColor = () => {
    switch (signal.action) {
      case 'BUY':
        return 'from-emerald-500 to-green-600';
      case 'SELL':
        return 'from-red-500 to-pink-600';
      case 'HOLD':
        return 'from-yellow-500 to-orange-600';
      default:
        return 'from-blue-500 to-cyan-600';
    }
  };

  const getActionIcon = () => {
    switch (signal.action) {
      case 'BUY':
        return <TrendingUp className="w-6 h-6" />;
      case 'SELL':
        return <TrendingDown className="w-6 h-6" />;
      case 'HOLD':
        return <Activity className="w-6 h-6" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative w-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden cursor-pointer transform transition-all hover:scale-105 hover:shadow-emerald-500/20 animate-in slide-in-from-right duration-300"
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700">
        <div
          className={`h-full bg-gradient-to-r ${getActionColor()} transition-all duration-100`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${getActionColor()}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            {getActionIcon()}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{signal.botName}</h3>
            <p className="text-white/80 text-sm">{signal.action} Signal Generated</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Symbol & Price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs">Symbol</p>
            <p className="text-white font-bold text-xl">{signal.symbol}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs">Current Price</p>
            <p className="text-white font-bold text-xl">
              ${signal.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </p>
          </div>
        </div>

        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-slate-400 text-xs">Confidence</p>
            <p className="text-white font-bold text-sm">{signal.confidence}%</p>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getActionColor()} transition-all duration-500`}
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
        </div>

        {/* Top Reasoning */}
        {signal.reasoning.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <p className="text-slate-400 text-xs mb-1">Key Reason</p>
            <p className="text-slate-200 text-sm">{signal.reasoning[0]}</p>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Clock className="w-3 h-3" />
          <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
        </div>

        {/* Click to view */}
        <div className="text-center pt-2 border-t border-slate-700/50">
          <p className="text-emerald-400 text-sm font-semibold animate-pulse">
            Click to view full analysis →
          </p>
        </div>
      </div>
    </div>
  );
}

// Signal Notifications Container
export function SignalNotificationsContainer() {
  const [signals, setSignals] = useState<SignalData[]>([]);

  useEffect(() => {
    // Listen for signal events from WebSocket or custom events
    const handleSignal = (event: CustomEvent<SignalData>) => {
      const newSignal = event.detail;
      setSignals(prev => [newSignal, ...prev].slice(0, 5)); // Keep max 5 notifications
    };

    window.addEventListener('trading-signal' as any, handleSignal);
    return () => window.removeEventListener('trading-signal' as any, handleSignal);
  }, []);

  const removeSignal = (id: string) => {
    setSignals(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-[9999] space-y-3 pointer-events-none">
      {signals.map(signal => (
        <div key={signal.id} className="pointer-events-auto">
          <SignalNotification
            signal={signal}
            onClose={() => removeSignal(signal.id)}
          />
        </div>
      ))}
    </div>
  );
}

// Helper function to emit signal notifications
export function emitSignalNotification(signal: SignalData) {
  const event = new CustomEvent('trading-signal', { detail: signal });
  window.dispatchEvent(event);
}