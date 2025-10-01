'use client';

import { useState, useEffect } from 'react';

interface LiveStats {
  btcPrice: number;
  ethPrice: number;
  activeBots: number;
  activeSignals: number;
}

export default function Footer() {
  const [liveStats, setLiveStats] = useState<LiveStats>({
    btcPrice: 0,
    ethPrice: 0,
    activeBots: 0,
    activeSignals: 0
  });

  // Fetch live stats from APIs
  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        // Fetch market data
        const marketRes = await fetch('/api/market/crypto');
        const marketData = await marketRes.json();

        // Fetch bot data
        const botsRes = await fetch('/api/quantum-pro/bots');
        const botsData = await botsRes.json();

        // Fetch signals
        const signalsRes = await fetch('/api/quantum-pro/signals');
        const signalsData = await signalsRes.json();

        setLiveStats({
          btcPrice: marketData.data?.[0]?.price || 0,
          ethPrice: marketData.data?.[1]?.price || 0,
          activeBots: botsData.bots?.filter((b: any) => b.status === 'running').length || 0,
          activeSignals: signalsData.count || 0
        });
      } catch (error) {
        console.error('Error fetching live stats:', error);
      }
    };

    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 fixed bottom-0 w-full z-40">
      <div className="container mx-auto px-4 py-3">
        {/* Live Stats Ticker - Desktop */}
        <div className="hidden md:flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <span className="text-green-400 text-xl">₿</span>
            <span className="text-slate-400 text-sm">BTC:</span>
            <span className="text-green-400 font-mono font-bold text-base">
              ${liveStats.btcPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <span className="text-blue-400 text-xl">Ξ</span>
            <span className="text-slate-400 text-sm">ETH:</span>
            <span className="text-blue-400 font-mono font-bold text-base">
              ${liveStats.ethPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <span className="text-purple-400 text-lg">🤖</span>
            <span className="text-slate-400 text-sm">Active Bots:</span>
            <span className="text-purple-400 font-mono font-bold text-base">
              {liveStats.activeBots}
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <span className="text-orange-400 text-lg">📡</span>
            <span className="text-slate-400 text-sm">Signals:</span>
            <span className="text-orange-400 font-mono font-bold text-base">
              {liveStats.activeSignals}
            </span>
          </div>

          {/* Last Update */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg">
            <span className="text-slate-500 text-xs">
              🔄 Updated: {new Date().toLocaleTimeString('tr-TR')}
            </span>
          </div>
        </div>

        {/* Mobile Live Stats - Scrollable */}
        <div className="md:hidden flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20 whitespace-nowrap">
            <span className="text-green-400">₿</span>
            <span className="text-slate-400 text-xs">BTC:</span>
            <span className="text-green-400 font-mono text-sm font-bold">
              ${liveStats.btcPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20 whitespace-nowrap">
            <span className="text-blue-400">Ξ</span>
            <span className="text-slate-400 text-xs">ETH:</span>
            <span className="text-blue-400 font-mono text-sm font-bold">
              ${liveStats.ethPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20 whitespace-nowrap">
            <span className="text-purple-400">🤖</span>
            <span className="text-slate-400 text-xs">Bots:</span>
            <span className="text-purple-400 font-mono text-sm font-bold">
              {liveStats.activeBots}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 rounded-lg border border-orange-500/20 whitespace-nowrap">
            <span className="text-orange-400">📡</span>
            <span className="text-slate-400 text-xs">Signals:</span>
            <span className="text-orange-400 font-mono text-sm font-bold">
              {liveStats.activeSignals}
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-slate-500 text-xs mt-2 pt-2 border-t border-slate-800/50">
          © 2024 LyDian Trader • AI-Powered Trading Platform • All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
