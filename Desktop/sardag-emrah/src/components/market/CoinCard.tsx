"use client";

import type { MarketData } from "@/hooks/useMarketData";
import SparklineChart from "./SparklineChart";
import { getRiskColorPalette, getRiskEmoji, getRiskText, type RiskScore } from "@/lib/market/risk-calculator";
import WatchlistButton from "@/components/watchlist/WatchlistButton";

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

  // 🎯 ALIM SİNYALİ GÜÇ SEVİYESİ BAZLI BORDER + GLOW SİSTEMİ
  // Border + box-shadow ile tam görünürlük - köşelerde kesilme yok!
  const getBorderAndGlowClass = () => {
    // 🏆 Top Performer - Sadece altın border (glow yok)
    if (isTopPerformer) {
      return 'border-4 border-yellow-500 hover:border-yellow-400 transition-all';
    }

    // 💎 SİNYAL GÜCÜ BAZLI RENK SİSTEMİ (Confidence Score)
    // Zayıf → Orta → Buy → Strong Buy → Diamond
    if (confidenceScore !== undefined && confidenceScore >= 30) {
      // 💎 DIAMOND (90-100%): Ultra güçlü AL - Yeşil patlama
      if (confidenceScore >= 90) {
        return 'border-4 border-emerald-400 hover:border-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.7),0_0_50px_rgba(52,211,153,0.4),0_0_75px_rgba(52,211,153,0.2)] hover:shadow-[0_0_35px_rgba(52,211,153,0.9),0_0_70px_rgba(52,211,153,0.5)] animate-pulse transition-all';
      }

      // 🚀 STRONG BUY (80-89%): Çok güçlü AL - Yeşil güçlü glow
      if (confidenceScore >= 80) {
        return 'border-4 border-green-500 hover:border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.6),0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.8),0_0_60px_rgba(34,197,94,0.4)] transition-all';
      }

      // ✅ BUY (70-79%): Güçlü AL - Lime glow
      if (confidenceScore >= 70) {
        return 'border-4 border-lime-500 hover:border-lime-400 shadow-[0_0_18px_rgba(132,204,22,0.5),0_0_35px_rgba(132,204,22,0.25)] hover:shadow-[0_0_25px_rgba(132,204,22,0.7),0_0_50px_rgba(132,204,22,0.35)] transition-all';
      }

      // 🟢 MODERATE BUY (60-69%): Orta seviye AL - Sarı hafif glow
      if (confidenceScore >= 60) {
        return 'border-4 border-yellow-500 hover:border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4),0_0_30px_rgba(234,179,8,0.2)] hover:shadow-[0_0_20px_rgba(234,179,8,0.6),0_0_40px_rgba(234,179,8,0.3)] transition-all';
      }

      // 🟡 WEAK (50-59%): Zayıf sinyal - Turuncu, glow yok
      if (confidenceScore >= 50) {
        return 'border-4 border-orange-500 hover:border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)] hover:shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all';
      }

      // ⚠️ VERY WEAK (30-49%): Çok zayıf - Kırmızı, glow yok
      if (confidenceScore >= 30) {
        return 'border-4 border-red-500 hover:border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)] hover:shadow-[0_0_12px_rgba(239,68,68,0.5)] transition-all';
      }
    }

    // 🔄 Fallback: Legacy signal strength (eski sistem uyumluluğu)
    if (hasSignal && signalStrength === 'STRONG_BUY') {
      return 'border-4 border-green-500 hover:border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.6),0_0_40px_rgba(34,197,94,0.3)] animate-pulse transition-all';
    }
    if (hasSignal && signalStrength === 'BUY') {
      return 'border-4 border-lime-500 hover:border-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.5)] transition-all';
    }
    if (hasSignal) {
      return 'border-4 border-blue-600 hover:border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)] transition-all';
    }

    // 🔘 Default: Sinyal yok - Minimal border
    return 'border-2 border-white/10 hover:border-white/20 transition-all';
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative
        bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-sm
        rounded-xl p-4 md:p-5
        cursor-pointer
        hover:scale-[1.03] hover:-translate-y-1
        transition-all duration-300 ease-out
        overflow-hidden
        ${getBorderAndGlowClass()}
      `}
    >
      {/* Glass reflection overlay - adds premium depth effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />

      {/* Watchlist Button (top-left corner) */}
      <div className="absolute top-2 left-2 z-10">
        <WatchlistButton symbol={symbol} size="sm" />
      </div>

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

      {/* Signal Badge - SADECE BUY/STRONG_BUY GÖSTER */}
      {!isTopPerformer && hasSignal && confidenceScore !== undefined && (
        <>
          {/* STRONG BUY Badge (80-100%) */}
          {confidenceScore >= 80 && (
            <div className={`absolute -top-2 -right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg ${
              confidenceScore >= 90
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 animate-pulse'
                : 'bg-gradient-to-r from-green-500 to-green-600 animate-pulse'
            }`}>
              {confidenceScore >= 90 ? '💎' : '🚀'} STRONG BUY
            </div>
          )}

          {/* BUY Badge (65-79%) */}
          {confidenceScore >= 65 && confidenceScore < 80 && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
              ✅ BUY
            </div>
          )}
        </>
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
          <div className="font-mono font-extrabold text-base md:text-lg text-white tracking-tight">
            {symbolDisplay}
          </div>
        </div>

        {/* 7d Change */}
        <div className={`flex items-center gap-1 text-sm font-semibold ${changeColor}`}>
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
        <div className="font-mono text-lg md:text-xl font-extrabold text-white tracking-tight">
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

      {/* Hover Effect: Click Hint - subtle blue glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/0 via-accent-blue/5 to-accent-blue/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
    </div>
  );
}
