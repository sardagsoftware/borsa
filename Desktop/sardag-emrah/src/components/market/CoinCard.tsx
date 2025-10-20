"use client";

import type { MarketData } from "@/hooks/useMarketData";
import SparklineChart from "./SparklineChart";
import { getRiskColorPalette, getRiskEmoji, getRiskText, type RiskScore } from "@/lib/market/risk-calculator";

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
  signalStrength?: 'STRONG_BUY' | 'BUY' | 'NEUTRAL'; // Signal type
  confidenceScore?: number; // 0-100, signal confidence
  riskScore?: RiskScore; // Risk assessment
  scanCount?: number; // For color palette rotation
}

export default function CoinCard({ coin, onClick, isTopPerformer, hasSignal, signalStrength, confidenceScore, riskScore, scanCount = 0 }: CoinCardProps) {
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

  // Border color based on RISK level (changes on each scan)
  const getBorderClass = () => {
    // Top performer takes priority
    if (isTopPerformer) {
      return 'border-3 border-yellow-500 hover:border-yellow-400 transition-colors';
    }

    // ⚠️ CRITICAL: Risk-based styling with STATIC Tailwind classes (NO SHADOWS - border only!)
    if (riskScore) {
      // Get palette index for rotation
      const paletteIndex = scanCount % 4;
      const level = riskScore.level;

      // PALETTE 0: Green -> Yellow -> Red
      if (paletteIndex === 0) {
        if (level === 'VERY_LOW') return 'border-3 border-emerald-500 hover:border-emerald-400 transition-colors';
        if (level === 'LOW') return 'border-3 border-lime-500 hover:border-lime-400 transition-colors';
        if (level === 'MEDIUM') return 'border-3 border-yellow-500 hover:border-yellow-400 transition-colors';
        if (level === 'HIGH') return 'border-3 border-orange-500 hover:border-orange-400 transition-colors';
        if (level === 'VERY_HIGH') return 'border-3 border-red-500 hover:border-red-400 animate-pulse transition-colors';
      }

      // PALETTE 1: Blue -> Purple -> Pink
      if (paletteIndex === 1) {
        if (level === 'VERY_LOW') return 'border-3 border-cyan-500 hover:border-cyan-400 transition-colors';
        if (level === 'LOW') return 'border-3 border-blue-500 hover:border-blue-400 transition-colors';
        if (level === 'MEDIUM') return 'border-3 border-purple-500 hover:border-purple-400 transition-colors';
        if (level === 'HIGH') return 'border-3 border-fuchsia-500 hover:border-fuchsia-400 transition-colors';
        if (level === 'VERY_HIGH') return 'border-3 border-pink-500 hover:border-pink-400 animate-pulse transition-colors';
      }

      // PALETTE 2: Teal -> Indigo -> Rose
      if (paletteIndex === 2) {
        if (level === 'VERY_LOW') return 'border-3 border-teal-500 hover:border-teal-400 transition-colors';
        if (level === 'LOW') return 'border-3 border-sky-500 hover:border-sky-400 transition-colors';
        if (level === 'MEDIUM') return 'border-3 border-indigo-500 hover:border-indigo-400 transition-colors';
        if (level === 'HIGH') return 'border-3 border-rose-500 hover:border-rose-400 transition-colors';
        if (level === 'VERY_HIGH') return 'border-3 border-red-600 hover:border-red-500 animate-pulse transition-colors';
      }

      // PALETTE 3: Mint -> Amber -> Crimson
      if (paletteIndex === 3) {
        if (level === 'VERY_LOW') return 'border-3 border-green-400 hover:border-green-300 transition-colors';
        if (level === 'LOW') return 'border-3 border-yellow-400 hover:border-yellow-300 transition-colors';
        if (level === 'MEDIUM') return 'border-3 border-amber-500 hover:border-amber-400 transition-colors';
        if (level === 'HIGH') return 'border-3 border-orange-600 hover:border-orange-500 transition-colors';
        if (level === 'VERY_HIGH') return 'border-3 border-red-700 hover:border-red-600 animate-pulse transition-colors';
      }

      // Fallback (default palette)
      if (level === 'VERY_HIGH') return 'border-3 border-red-500 hover:border-red-400 animate-pulse transition-colors';
      if (level === 'HIGH') return 'border-3 border-orange-500 hover:border-orange-400 transition-colors';
      if (level === 'MEDIUM') return 'border-3 border-yellow-500 hover:border-yellow-400 transition-colors';
      if (level === 'LOW') return 'border-3 border-lime-500 hover:border-lime-400 transition-colors';
      return 'border-3 border-emerald-500 hover:border-emerald-400 transition-colors';
    }

    // Fallback: Confidence score-based styling (if no risk score)
    if (confidenceScore !== undefined && confidenceScore >= 30) {
      if (confidenceScore >= 90) {
        return 'border-3 border-emerald-400 hover:border-emerald-300 animate-pulse transition-colors';
      }
      if (confidenceScore >= 80) {
        return 'border-3 border-green-500 hover:border-green-400 transition-colors';
      }
      if (confidenceScore >= 70) {
        return 'border-3 border-green-600 hover:border-green-500 transition-colors';
      }
      if (confidenceScore >= 60) {
        return 'border-3 border-lime-600 hover:border-lime-500 transition-colors';
      }
      if (confidenceScore >= 50) {
        return 'border-3 border-yellow-600 hover:border-yellow-500 transition-colors';
      }
      if (confidenceScore >= 40) {
        return 'border-3 border-orange-600 hover:border-orange-500 transition-colors';
      }
      if (confidenceScore >= 30) {
        return 'border-3 border-red-600 hover:border-red-500 transition-colors';
      }
    }

    // Fallback to signal strength (legacy)
    if (hasSignal && signalStrength === 'STRONG_BUY') {
      return 'border-3 border-green-500 hover:border-green-400 animate-pulse transition-colors';
    }
    if (hasSignal && signalStrength === 'BUY') {
      return 'border-3 border-green-600 hover:border-green-500 transition-colors';
    }
    if (hasSignal) {
      return 'border-3 border-blue-600 hover:border-blue-500 transition-colors';
    }

    // Default: No signal, no risk
    return 'border border-white/10 hover:border-accent-blue/50 transition-colors';
  };

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
        ${getBorderClass()}
      `}
    >
      {/* Risk Badge (shows on top-left for all coins) */}
      {!isTopPerformer && riskScore && (
        <div
          className={`absolute -top-2 -left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg ${
            riskScore.level === 'VERY_HIGH' ? 'bg-gradient-to-r from-red-600 to-red-700 animate-pulse' :
            riskScore.level === 'HIGH' ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
            riskScore.level === 'MEDIUM' ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' :
            riskScore.level === 'LOW' ? 'bg-gradient-to-r from-lime-600 to-lime-700' :
            'bg-gradient-to-r from-green-600 to-green-700'
          }`}
          title={`${getRiskText(riskScore.level)} (${riskScore.score}/100)`}
        >
          {getRiskEmoji(riskScore.level)}
        </div>
      )}

      {/* Top Performer Badge */}
      {isTopPerformer && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
          🏆 TOP
        </div>
      )}

      {/* Signal Badge with Confidence Score */}
      {!isTopPerformer && hasSignal && confidenceScore !== undefined && confidenceScore >= 30 && (
        <div className={`absolute -top-2 -right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg ${
          confidenceScore >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 animate-pulse' :
          confidenceScore >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600 animate-pulse' :
          confidenceScore >= 70 ? 'bg-gradient-to-r from-green-600 to-green-700' :
          confidenceScore >= 60 ? 'bg-gradient-to-r from-lime-600 to-lime-700' :
          confidenceScore >= 50 ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' :
          confidenceScore >= 40 ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
          'bg-gradient-to-r from-red-600 to-red-700'
        }`}>
          {confidenceScore >= 90 ? '💎' :
           confidenceScore >= 80 ? '🚀' :
           confidenceScore >= 70 ? '✅' :
           confidenceScore >= 60 ? '🟢' :
           confidenceScore >= 50 ? '🟡' :
           confidenceScore >= 40 ? '🟠' :
           '⚠️'}
          {' '}
          %{Math.floor(confidenceScore)}
        </div>
      )}

      {/* Legacy Signal Badge (if no confidence score) */}
      {!isTopPerformer && hasSignal && confidenceScore === undefined && signalStrength === 'STRONG_BUY' && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
          🚀 AL
        </div>
      )}
      {!isTopPerformer && hasSignal && confidenceScore === undefined && signalStrength === 'BUY' && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
          ✅ AL
        </div>
      )}
      {!isTopPerformer && hasSignal && confidenceScore === undefined && signalStrength === 'NEUTRAL' && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
          ⏳ BEKLE
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
