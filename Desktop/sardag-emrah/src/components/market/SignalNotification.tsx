/**
 * SIGNAL NOTIFICATION
 *
 * Toast notification for new trading signals
 */

"use client";

import { useEffect, useState } from "react";
import type { CoinSignal } from "@/lib/market/coin-scanner";

interface SignalNotificationProps {
  signals: CoinSignal[];
  onClose: () => void;
}

export default function SignalNotification({ signals, onClose }: SignalNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (signals.length > 0) {
      setIsVisible(true);

      // Auto-hide after 10 seconds
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [signals.length, onClose]);

  if (!isVisible || signals.length === 0) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50
      bg-gradient-to-br from-red-600 to-red-700
      border border-red-400
      rounded-lg shadow-2xl
      p-4 max-w-sm
      transform transition-all duration-300
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-2xl animate-pulse">🚨</div>
          <div>
            <div className="font-bold text-white">Yeni Sinyaller Tespit Edildi!</div>
            <div className="text-xs text-red-100">
              {signals.length} coin için alım/satım sinyali
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="text-red-200 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Signal List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {signals.slice(0, 5).map((signal) => (
          <div
            key={signal.symbol}
            className="bg-white/10 rounded p-2 flex items-center justify-between"
          >
            <div>
              <div className="font-mono font-bold text-white">
                {signal.symbol.replace('USDT', '')}
              </div>
              <div className="text-xs text-red-100">
                {signal.signalCount} aktif sinyal
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-red-100">
                {signal.signals.maCrossover24h && '📈 MA'}
                {signal.signals.volumeSpike24h && ' 💥'}
                {signal.signals.mtfAlignment && ' ✅'}
              </div>
            </div>
          </div>
        ))}

        {signals.length > 5 && (
          <div className="text-center text-xs text-red-100 pt-2">
            +{signals.length - 5} diğer sinyal
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-red-400/30">
        <button
          onClick={handleClose}
          className="w-full px-3 py-2 bg-white/20 hover:bg-white/30 rounded text-sm font-medium text-white transition-colors"
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
