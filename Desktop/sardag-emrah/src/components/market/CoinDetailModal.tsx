"use client";

import { useState, useEffect } from 'react';
import type { MarketData } from '@/hooks/useMarketData';
import SparklineChart from './SparklineChart';
import { getRiskText, getRiskEmoji, type RiskScore } from '@/lib/market/risk-calculator';

interface CoinDetailModalProps {
  coin: MarketData | null;
  onClose: () => void;
  signalStrength?: 'STRONG_BUY' | 'BUY' | 'NEUTRAL';
  confidenceScore?: number;
  riskScore?: RiskScore;
}

export default function CoinDetailModal({
  coin,
  onClose,
  signalStrength,
  confidenceScore,
  riskScore
}: CoinDetailModalProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coin) return;

    // Fetch detailed analysis
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/market/analyze?symbol=${coin.symbol}&timeframe=4h`);
        if (response.ok) {
          const data = await response.json();
          setAnalysis(data.analysis);
        }
      } catch (error) {
        console.error('[CoinDetailModal] Analysis fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [coin]);

  if (!coin) return null;

  const symbolDisplay = coin.symbol.replace('USDT', '');
  const changeColor = coin.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400';
  const sparklineColor = coin.changePercent7d >= 0 ? '#10b981' : '#ef4444';

  // Signal badge color
  const getSignalBadgeClass = () => {
    if (confidenceScore !== undefined) {
      if (confidenceScore >= 90) return 'bg-gradient-to-r from-emerald-400 to-emerald-600 animate-pulse';
      if (confidenceScore >= 80) return 'bg-gradient-to-r from-green-500 to-green-600 animate-pulse';
      if (confidenceScore >= 70) return 'bg-gradient-to-r from-green-600 to-green-700';
      if (confidenceScore >= 60) return 'bg-gradient-to-r from-lime-600 to-lime-700';
      if (confidenceScore >= 50) return 'bg-gradient-to-r from-yellow-600 to-yellow-700';
      return 'bg-gradient-to-r from-orange-600 to-orange-700';
    }
    return 'bg-gradient-to-r from-blue-600 to-blue-700';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto pointer-events-auto animate-in zoom-in-95 duration-300 border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-md border-b border-white/10 p-6 z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {symbolDisplay.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-white">
                    {symbolDisplay}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    #{coin.rank || 'N/A'} • 24h Volume: ${(coin.volume24h / 1e9).toFixed(2)}B
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Signal & Risk Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {confidenceScore !== undefined && confidenceScore >= 30 && (
                <div className={`px-4 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2 ${getSignalBadgeClass()}`}>
                  {confidenceScore >= 90 ? '💎' : confidenceScore >= 80 ? '🚀' : confidenceScore >= 70 ? '✅' : confidenceScore >= 60 ? '🟢' : confidenceScore >= 50 ? '🟡' : '🟠'}
                  <span>Sinyal Gücü: %{Math.floor(confidenceScore)}</span>
                </div>
              )}

              {riskScore && (
                <div className={`px-4 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2 ${
                  riskScore.level === 'VERY_HIGH' ? 'bg-gradient-to-r from-red-600 to-red-700 animate-pulse' :
                  riskScore.level === 'HIGH' ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
                  riskScore.level === 'MEDIUM' ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' :
                  riskScore.level === 'LOW' ? 'bg-gradient-to-r from-lime-600 to-lime-700' :
                  'bg-gradient-to-r from-green-600 to-green-700'
                }`}>
                  {getRiskEmoji(riskScore.level)}
                  <span>{getRiskText(riskScore.level)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Price & Change */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400 mb-1">Güncel Fiyat</div>
                <div className="text-2xl font-extrabold text-white">
                  ${coin.price.toLocaleString()}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400 mb-1">24h Değişim</div>
                <div className={`text-2xl font-extrabold ${changeColor}`}>
                  {coin.changePercent24h >= 0 ? '+' : ''}{coin.changePercent24h.toFixed(2)}%
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400 mb-1">7d Değişim</div>
                <div className={`text-2xl font-extrabold ${coin.changePercent7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {coin.changePercent7d >= 0 ? '+' : ''}{coin.changePercent7d.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Sparkline Chart */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">7 Günlük Fiyat Grafiği</h3>
              {coin.sparkline.length > 0 ? (
                <SparklineChart
                  data={coin.sparkline}
                  width={800}
                  height={200}
                  color={sparklineColor}
                  showArea={true}
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  Grafik yükleniyor...
                </div>
              )}
            </div>

            {/* Analysis Section */}
            {loading ? (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                {/* Strategy Results */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4">Strateji Analizi</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {analysis.strategies?.map((strategy: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          strategy.signal === 'BUY' ? 'bg-green-500/10 border-green-500/30' :
                          strategy.signal === 'SELL' ? 'bg-red-500/10 border-red-500/30' :
                          'bg-gray-500/10 border-gray-500/30'
                        }`}
                      >
                        <div className="text-xs text-gray-400 mb-1">{strategy.name}</div>
                        <div className={`text-sm font-bold ${
                          strategy.signal === 'BUY' ? 'text-green-400' :
                          strategy.signal === 'SELL' ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {strategy.signal}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trade Suggestions */}
                {analysis.suggestedStopLoss && analysis.suggestedTakeProfit && (
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">İşlem Önerileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Giriş Fiyatı</div>
                        <div className="text-lg font-bold text-blue-400">
                          ${analysis.entryPrice?.toLocaleString() || coin.price.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Stop-Loss</div>
                        <div className="text-lg font-bold text-red-400">
                          ${analysis.suggestedStopLoss.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Take-Profit</div>
                        <div className="text-lg font-bold text-green-400">
                          ${analysis.suggestedTakeProfit.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Groq AI Enhancement */}
                {analysis.aiEnhanced && analysis.aiReasoning && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-600/10 border border-purple-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🤖</span>
                      <h3 className="text-lg font-bold text-white">Groq AI Analizi</h3>
                      <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                        93-95% Başarı
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {analysis.aiReasoning}
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Market Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">24h Yüksek</div>
                <div className="text-sm font-bold text-white">${coin.high24h.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">24h Düşük</div>
                <div className="text-sm font-bold text-white">${coin.low24h.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">24h Hacim</div>
                <div className="text-sm font-bold text-white">
                  ${(coin.volume24h / 1e6).toFixed(2)}M
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Market Cap Rank</div>
                <div className="text-sm font-bold text-white">#{coin.rank || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-md border-t border-white/10 p-6">
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-bold text-white transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={() => window.open(`https://www.binance.com/en/trade/${coin.symbol}`, '_blank')}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-lg font-bold text-white transition-all shadow-lg hover:shadow-xl"
              >
                🚀 Binance'de İşlem Yap
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
