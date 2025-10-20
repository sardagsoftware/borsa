"use client";

import type { MarketData } from "@/hooks/useMarketData";
import SparklineChart from "./SparklineChart";

// Helper functions
function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 });
}

function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

function getChangeColor(changePercent: number): string {
  if (changePercent >= 5) return 'text-green-400';
  if (changePercent > 0) return 'text-green-500';
  if (changePercent > -2) return 'text-gray-400';
  return 'text-red-500';
}

function getChangeEmoji(changePercent: number): string {
  if (changePercent >= 10) return '🚀';
  if (changePercent >= 5) return '📈';
  if (changePercent > 0) return '🟢';
  if (changePercent > -2) return '⚪';
  if (changePercent > -5) return '🔴';
  return '💥';
}

/**
 * COIN CARD COMPONENT
 *
 * Ekran görüntüsündeki gibi compact card
 * - Symbol & price
 * - 7d change
 * - Sparkline chart
 * - Volume & rank
 */

interface CoinCardProps {
  coin: MarketData;
  onClick?: () => void;
  isTopPerformer?: boolean;
  hasSignal?: boolean; // Active trading signal detected
}

export default function CoinCard({ coin, onClick, isTopPerformer, hasSignal }: CoinCardProps) {
  const {
    symbol,
    price,
    changePercent7d,
    changePercent24h,
    volume24h,
    sparkline,
    rank,
  } = coin;

  // Symbol display (remove USDT)
  const symbolDisplay = symbol.replace('USDT', '');

  // Color based on 7d change
  const changeColor = getChangeColor(changePercent7d || changePercent24h);
  const changeEmoji = getChangeEmoji(changePercent7d || changePercent24h);

  // Sparkline color
  const sparklineColor = changePercent7d >= 0 ? "#10b981" : "#ef4444";

  return (
    <div
      onClick={onClick}
      className={`
        group relative
        bg-gradient-to-br from-[#1a1f2e] to-[#0f1419]
        rounded-lg p-3
        cursor-pointer
        transition-all duration-200
        hover:scale-[1.02]
        ${isTopPerformer
          ? 'border-2 border-red-500/60 shadow-lg shadow-red-500/20 hover:border-red-400 hover:shadow-red-400/30'
          : hasSignal
            ? 'border-2 border-red-600/80 shadow-lg shadow-red-600/30 hover:border-red-500 hover:shadow-red-500/40 animate-pulse'
            : 'border border-white/5 hover:border-accent-blue/50 hover:shadow-lg hover:shadow-accent-blue/10'
        }
      `}
    >
      {/* Top Performer Badge */}
      {isTopPerformer && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
          🏆 TOP
        </div>
      )}

      {/* Signal Badge */}
      {!isTopPerformer && hasSignal && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
          🚨 SİNYAL
        </div>
      )}

      {/* Header: Symbol + 7d Change */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Rank */}
          {rank && rank <= 20 && (
            <div className="text-[10px] text-gray-500 font-mono">
              #{rank}
            </div>
          )}

          {/* Symbol */}
          <div className="font-mono font-bold text-sm text-white">
            {symbolDisplay}
          </div>
        </div>

        {/* 7d Change */}
        <div className={`flex items-center gap-1 text-xs font-bold ${changeColor}`}>
          <span>{changeEmoji}</span>
          <span>
            {changePercent7d ? `${changePercent7d >= 0 ? '+' : ''}${changePercent7d.toFixed(2)}%` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
        {sparkline.length > 0 ? (
          <SparklineChart
            data={sparkline}
            width={140}
            height={35}
            color={sparklineColor}
            showArea={true}
          />
        ) : (
          <div className="h-[35px] flex items-center justify-center text-gray-600 text-xs">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>

      {/* Footer: Price + Volume */}
      <div className="space-y-1">
        {/* Price */}
        <div className="font-mono text-base font-bold text-white">
          ${formatPrice(price)}
        </div>

        {/* Volume */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Vol:</span>
          <span className="text-gray-400 font-mono">{formatLargeNumber(volume24h)}</span>
        </div>

        {/* 24h Change (small) */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-600">24h:</span>
          <span className={`font-mono ${getChangeColor(changePercent24h)}`}>
            {changePercent24h >= 0 ? '+' : ''}{changePercent24h.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Hover Effect: Click Hint */}
      <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/0 via-accent-blue/5 to-accent-blue/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
    </div>
  );
}
