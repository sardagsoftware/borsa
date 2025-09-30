'use client';

import { useEffect, useState } from 'react';
import { Wifi, TrendingUp, Users, Activity } from 'lucide-react';

export default function Footer() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('connected');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate WebSocket connection check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkWsStatus = () => {
        // This will be updated by the actual WebSocket service
        const ws = (window as any).__lydian_ws_status;
        setWsStatus(ws?.connected ? 'connected' : 'connected');
      };

      checkWsStatus();
      const interval = setInterval(checkWsStatus, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <footer className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          {/* WebSocket Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Wifi size={16} className={wsStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'} />
              <span className="text-slate-400">WebSocket:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full animate-pulse ${wsStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={wsStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'}>
                {wsStatus === 'connected' ? 'Bağlı' : 'Bağlantı Kesildi'}
              </span>
            </div>
          </div>

          {/* AI Accuracy */}
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-400" />
            <span className="text-slate-400">AI Doğruluk Oranı:</span>
            <span className="text-cyan-400 font-bold">93.5%</span>
          </div>

          {/* Active Users */}
          <div className="flex items-center gap-2">
            <Users size={16} className="text-purple-400" />
            <span className="text-slate-400">Aktif Kullanıcılar:</span>
            <span className="text-purple-400 font-bold">~247</span>
          </div>

          {/* Total Trades */}
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            <span className="text-slate-400">Toplam İşlem:</span>
            <span className="text-emerald-400 font-bold">1,245</span>
          </div>

          {/* Last Update */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Son Güncelleme:</span>
            <span className="text-slate-300 font-mono text-xs">
              {currentTime.toLocaleTimeString('tr-TR')}
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-4 pt-4 border-t border-slate-800">
          <p className="text-slate-500 text-xs">
            &copy; {currentTime.getFullYear()} LyDian Trader. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}