"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { analyzeComprehensive, type ComprehensiveAnalysis, type TimeframeAnalysis } from "@/lib/market/coin-analyzer";

// Format price helper
function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 });
}

/**
 * QUICK INFO MODAL
 *
 * Comprehensive coin analysis
 * - All timeframes (1d, 4h, 1h)
 * - MA/SR/Volume signals
 * - Buy/Sell recommendation
 * - Entry/Exit suggestions
 */

interface QuickInfoModalProps {
  symbol: string;
  currentPrice: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickInfoModal({
  symbol,
  currentPrice,
  isOpen,
  onClose,
}: QuickInfoModalProps) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analyze on open
  useEffect(() => {
    if (!isOpen) return;

    const analyze = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await analyzeComprehensive(symbol, currentPrice);

        if (!result) {
          throw new Error('Analiz başarısız');
        }

        setAnalysis(result);
        setLoading(false);
      } catch (err) {
        console.error('[QuickInfoModal] Analysis error:', err);
        setError('Analiz yapılamadı');
        setLoading(false);
      }
    };

    analyze();
  }, [isOpen, symbol, currentPrice]);

  if (!isOpen) return null;

  // Backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Navigate to detailed chart
  const goToChart = () => {
    router.push(`/charts?symbol=${symbol}`);
    onClose();
  };

  // Recommendation color & emoji
  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case 'STRONG_BUY':
        return { color: 'text-green-400', bg: 'bg-green-500/20', emoji: '🚀' };
      case 'BUY':
        return { color: 'text-green-500', bg: 'bg-green-500/10', emoji: '📈' };
      case 'NEUTRAL':
        return { color: 'text-gray-400', bg: 'bg-gray-500/10', emoji: '⚪' };
      case 'SELL':
        return { color: 'text-red-500', bg: 'bg-red-500/10', emoji: '📉' };
      case 'STRONG_SELL':
        return { color: 'text-red-400', bg: 'bg-red-500/20', emoji: '🔻' };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-500/10', emoji: '❓' };
    }
  };

  // Trend emoji
  const getTrendEmoji = (trend: string) => {
    switch (trend) {
      case 'BULLISH': return '🟢';
      case 'BEARISH': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1a1f2e] to-[#0f1419] border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {symbol.replace('USDT', '')} Detaylı Analiz
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Tüm zaman dilimleri • Kapsamlı sinyal analizi
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-lg font-medium">Analiz ediliyor...</div>
              <div className="text-sm text-gray-500 mt-2">Tüm timeframe'ler kontrol ediliyor</div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-red-500 text-lg mb-4">❌ {error}</div>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-accent-blue hover:bg-accent-blue/80 rounded-lg font-medium transition-colors"
              >
                Kapat
              </button>
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* Recommendation Card */}
              <div className={`${getRecommendationStyle(analysis.recommendation).bg} border ${getRecommendationStyle(analysis.recommendation).color.replace('text-', 'border-')} rounded-lg p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">ÖNERİ</div>
                    <div className={`text-3xl font-bold ${getRecommendationStyle(analysis.recommendation).color} flex items-center gap-2`}>
                      <span>{getRecommendationStyle(analysis.recommendation).emoji}</span>
                      <span>{analysis.recommendation.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Skor</div>
                    <div className="text-3xl font-bold">{analysis.compositeScore}/10</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Risk Seviyesi</div>
                    <div className={`text-sm font-medium ${
                      analysis.riskLevel === 'LOW' ? 'text-green-400' :
                      analysis.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {analysis.riskLevel === 'LOW' ? '🟢 DÜŞÜK' :
                       analysis.riskLevel === 'MEDIUM' ? '🟡 ORTA' :
                       '🔴 YÜKSEK'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">MTF Uyum</div>
                    <div className="text-sm font-medium">
                      {analysis.mtfAlignment}/3 {analysis.mtfAlignment >= 2 ? '✅' : '⚠️'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Timeframe Analysis */}
              <div>
                <h3 className="text-lg font-bold mb-4">🕐 Çoklu Zaman Dilimi Analizi</h3>

                <div className="space-y-3">
                  {Object.entries(analysis.timeframes).map(([tf, data]) => (
                    <TimeframeCard key={tf} timeframe={tf} data={data} currentPrice={currentPrice} />
                  ))}
                </div>
              </div>

              {/* Entry/Exit Suggestions */}
              {analysis.suggestedEntry && analysis.suggestedStopLoss && analysis.suggestedTakeProfit && (
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">💡 Giriş/Çıkış Önerileri</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Giriş Noktası</div>
                      <div className="text-xl font-mono font-bold text-white">
                        ${formatPrice(analysis.suggestedEntry)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Stop Loss</div>
                      <div className="text-xl font-mono font-bold text-red-400">
                        ${formatPrice(analysis.suggestedStopLoss)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(((analysis.suggestedStopLoss - analysis.suggestedEntry) / analysis.suggestedEntry) * 100).toFixed(2)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Take Profit</div>
                      <div className="text-xl font-mono font-bold text-green-400">
                        ${formatPrice(analysis.suggestedTakeProfit)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(((analysis.suggestedTakeProfit - analysis.suggestedEntry) / analysis.suggestedEntry) * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Risk/Reward Oranı:</span>
                      <span className="text-lg font-bold text-accent-blue">{analysis.riskRewardRatio}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={goToChart}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-accent-blue to-blue-600 hover:from-accent-blue/80 hover:to-blue-600/80 rounded-lg font-bold text-lg transition-all shadow-lg"
                >
                  📈 Detaylı Chart'a Git
                </button>

                <button
                  onClick={onClose}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Timeframe Analysis Card Component
function TimeframeCard({
  timeframe,
  data,
  currentPrice,
}: {
  timeframe: string;
  data: TimeframeAnalysis;
  currentPrice: number;
}) {
  const getTrendEmoji = (trend: string) => {
    switch (trend) {
      case 'BULLISH': return '🟢';
      case 'BEARISH': return '🔴';
      default: return '⚪';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'BULLISH': return 'text-green-400';
      case 'BEARISH': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-gray-400">{timeframe.toUpperCase()}</div>
          <div className={`text-lg font-bold ${getTrendColor(data.trend)} flex items-center gap-2`}>
            <span>{getTrendEmoji(data.trend)}</span>
            <span>{data.trend}</span>
          </div>
        </div>

        {data.maCrossover && (
          <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-xs font-bold text-purple-300">
            🚀 MA CROSS
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-gray-500 mb-1">Moving Averages</div>
          <div className="space-y-0.5 font-mono">
            <div className={currentPrice > data.ma7 ? 'text-green-400' : 'text-red-400'}>
              MA7: ${formatPrice(data.ma7)}
            </div>
            <div className={currentPrice > data.ma25 ? 'text-green-400' : 'text-red-400'}>
              MA25: ${formatPrice(data.ma25)}
            </div>
            <div className={currentPrice > data.ma99 ? 'text-green-400' : 'text-red-400'}>
              MA99: ${formatPrice(data.ma99)}
            </div>
          </div>
        </div>

        <div>
          <div className="text-gray-500 mb-1">Teknik Göstergeler</div>
          <div className="space-y-0.5">
            {data.rsi && (
              <div className={`
                ${data.rsi > 70 ? 'text-red-400' :
                  data.rsi < 30 ? 'text-green-400' :
                  'text-gray-300'}
              `}>
                RSI: {data.rsi.toFixed(1)}
              </div>
            )}
            <div className={`
              ${data.macdTrend === 'POSITIVE' ? 'text-green-400' :
                data.macdTrend === 'NEGATIVE' ? 'text-red-400' :
                'text-gray-400'}
            `}>
              MACD: {data.macdTrend}
            </div>
            <div className={`
              ${data.volumeStatus === 'HIGH' ? 'text-green-400' :
                data.volumeStatus === 'LOW' ? 'text-red-400' :
                'text-gray-400'}
            `}>
              Hacim: {data.volumeStatus}
            </div>
          </div>
        </div>
      </div>

      {(data.supportLevel || data.resistanceLevel) && (
        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
          {data.supportLevel && (
            <div>
              <div className="text-gray-500">Destek</div>
              <div className="font-mono text-green-400">${formatPrice(data.supportLevel)}</div>
            </div>
          )}
          {data.resistanceLevel && (
            <div>
              <div className="text-gray-500">Direnç</div>
              <div className="font-mono text-red-400">${formatPrice(data.resistanceLevel)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
