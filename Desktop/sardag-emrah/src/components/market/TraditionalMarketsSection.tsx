/**
 * TRADITIONAL MARKETS SECTION
 *
 * Display Gold, Silver, Platinum, BIST100 with same UI as crypto
 * Supports all 9 strategies + Groq AI
 */

'use client';

import { useState, useEffect } from 'react';
import { type TraditionalMarketData } from '@/types/traditional-markets';
import CoinCard from './CoinCard';

interface TraditionalMarketsResponse {
  success: boolean;
  count: number;
  data: TraditionalMarketData[];
  sources?: {
    binance: string;
    metalpriceapi: string;
    yahoo: string;
  };
  timestamp: number;
}

export function TraditionalMarketsSection() {
  const [markets, setMarkets] = useState<TraditionalMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTraditionalMarkets();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTraditionalMarkets, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchTraditionalMarkets() {
    try {
      const response = await fetch('/api/traditional-markets/overview');
      if (!response.ok) {
        throw new Error('Failed to fetch traditional markets');
      }

      const data: TraditionalMarketsResponse = await response.json();

      if (data.success) {
        setMarkets(data.data);
        setError(null);
      } else {
        setError('No data available');
      }
    } catch (err) {
      console.error('[Traditional Markets] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">
          📊 Traditional Markets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-800 rounded-lg h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">
          📊 Traditional Markets
        </h2>
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  if (markets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          📊 Traditional Markets
          <span className="text-sm font-normal text-gray-400">
            ({markets.length} markets)
          </span>
        </h2>
        <div className="text-xs text-gray-500">
          🟢 Live Data • Binance • MetalpriceAPI • Yahoo Finance
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {markets.map((market) => (
          <div key={market.symbol} className="relative">
            {/* Badge overlay */}
            <div className="absolute top-2 left-2 z-10 bg-yellow-500/20 backdrop-blur-sm px-2 py-1 rounded-md border border-yellow-500/30">
              <span className="text-xs font-medium text-yellow-400">
                {market.icon || '📊'} {market.category || 'Traditional'}
              </span>
            </div>

            <CoinCard
              coin={{
                symbol: market.symbol,
                price: market.price,
                change24h: (market.price * market.changePercent24h) / 100,
                changePercent24h: market.changePercent24h,
                change7d: market.changePercent7d
                  ? (market.price * market.changePercent7d) / 100
                  : 0,
                changePercent7d: market.changePercent7d || 0,
                high24h: market.high24h || market.price * 1.02,
                low24h: market.low24h || market.price * 0.98,
                volume24h: market.volume24h,
                quoteVolume: market.volume24h,
                sparkline: market.sparkline,
              }}
            />
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <p>
          💡 <strong>Pro Tip:</strong> Traditional markets use the same 9 strategies + Groq AI as crypto!
        </p>
        <p>
          🔍 <strong>Data Sources:</strong>
        </p>
        <ul className="list-disc list-inside ml-4 space-y-0.5">
          <li>Gold (PAXG): Binance tokenized gold</li>
          <li>Silver, Platinum: MetalpriceAPI (free tier, 100 req/month)</li>
          <li>BIST100: Yahoo Finance</li>
          <li>Forex: Binance Spot pairs</li>
        </ul>
      </div>
    </div>
  );
}
