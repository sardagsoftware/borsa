"use client";

import { useState, useEffect } from 'react';
import { analyzeSymbol, type AggregatedSignal, type StrategyResult } from '@/lib/strategy-aggregator';

/**
 * MULTI-STRATEGY ANALYSIS MODAL
 *
 * Displays comprehensive analysis from all 6 trading strategies:
 * - MA7-25-99 Crossover Pullback
 * - RSI Divergence
 * - MACD Histogram
 * - Bollinger Squeeze
 * - EMA Ribbon
 * - Volume Profile
 *
 * Shows:
 * - Overall recommendation (STRONG BUY / BUY / NEUTRAL)
 * - Confidence score (0-100%)
 * - Individual strategy results
 * - Entry, stop loss, take profit levels
 * - Agreement count
 */

interface MultiStrategyModalProps {
  symbol: string;
  currentPrice: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function MultiStrategyModal({
  symbol,
  currentPrice,
  isOpen,
  onClose,
}: MultiStrategyModalProps) {
  const [analysis, setAnalysis] = useState<AggregatedSignal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadAnalysis = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`[Multi-Strategy Modal] Loading analysis for ${symbol}...`);
        const result = await analyzeSymbol(symbol, '4h');

        if (!result) {
          setError('Şu anda bu coin için aktif sinyal yok.');
        } else {
          setAnalysis(result);
        }
      } catch (err) {
        console.error('[Multi-Strategy Modal] Error:', err);
        setError('Analiz yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [isOpen, symbol]);

  if (!isOpen) return null;

  // Get overall color based on recommendation
  const getOverallColor = (overall: string) => {
    switch (overall) {
      case 'STRONG_BUY': return 'text-green-400 bg-green-500/20';
      case 'BUY': return 'text-green-300 bg-green-500/15';
      case 'NEUTRAL': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  // Get strategy status icon
  const getStrategyIcon = (strategy: StrategyResult) => {
    if (!strategy.active) return '⚪';
    if (strategy.strength >= 8) return '🟢';
    if (strategy.strength >= 6) return '🟡';
    return '🟠';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold">
              📊 {symbol.replace('USDT', '')} Kapsamlı Analiz
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              6 Strateji • {currentPrice.toFixed(2)} USDT
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-88px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">Tüm stratejiler analiz ediliyor...</p>
            </div>
          )}

          {error && (
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-gray-400">{error}</p>
            </div>
          )}

          {analysis && (
            <div className="p-6 space-y-6">
              {/* 🎯 NET KARAR - BÜY ÜK VE NET */}
              <div className="text-center p-8 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl border-2 border-white/20">
                {/* Ana Karar */}
                <div className="mb-4">
                  <div className="text-6xl font-black mb-2">
                    {analysis.overall === 'STRONG_BUY' ? '🚀 AL' :
                     analysis.overall === 'BUY' ? '✅ AL' :
                     analysis.overall === 'NEUTRAL' ? '⏳ BEKLE' :
                     '❌ ALMA'}
                  </div>
                  <div className="text-3xl font-bold opacity-90">
                    {analysis.overall === 'STRONG_BUY' ? 'GÜÇLÜ ALIŞ SİNYALİ' :
                     analysis.overall === 'BUY' ? 'ALIŞ SİNYALİ' :
                     analysis.overall === 'NEUTRAL' ? 'BEKLEME DURUMU' :
                     'ALIŞ YOK'}
                  </div>
                </div>

                {/* Güven Skoru */}
                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-5xl font-black text-cyan-400">
                      {analysis.finalConfidence ? analysis.finalConfidence.toFixed(0) : analysis.confidenceScore.toFixed(0)}%
                    </div>
                    <div className="text-sm opacity-60">Güven</div>
                  </div>
                  <div className="text-4xl">+</div>
                  <div className="text-center">
                    <div className="text-5xl font-black text-green-400">{analysis.agreementCount}/{analysis.totalStrategies}</div>
                    <div className="text-sm opacity-60">Strateji</div>
                  </div>
                  {analysis.aiEnhancement && (
                    <>
                      <div className="text-4xl">+</div>
                      <div className="text-center">
                        <div className="text-5xl font-black text-purple-400">🤖 AI</div>
                        <div className="text-sm opacity-60">
                          {analysis.aiEnhancement.confidenceBoost > 0 ? '+' : ''}
                          {analysis.aiEnhancement.confidenceBoost}%
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* İşlem Detayları */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-xs opacity-60 mb-1">GİRİŞ</div>
                    <div className="text-lg font-bold">{analysis.entryPrice.toFixed(2)}</div>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-xl">
                    <div className="text-xs opacity-60 mb-1">STOP</div>
                    <div className="text-lg font-bold text-red-400">{analysis.suggestedStopLoss.toFixed(2)}</div>
                    <div className="text-xs opacity-60">
                      ({((analysis.suggestedStopLoss - analysis.entryPrice) / analysis.entryPrice * 100).toFixed(1)}%)
                    </div>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-xl">
                    <div className="text-xs opacity-60 mb-1">HEDEF</div>
                    <div className="text-lg font-bold text-green-400">{analysis.suggestedTakeProfit.toFixed(2)}</div>
                    <div className="text-xs opacity-60">
                      ({((analysis.suggestedTakeProfit - analysis.entryPrice) / analysis.entryPrice * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Strategies */}
              <div>
                <h4 className="text-lg font-bold mb-4">📈 Strateji Detayları</h4>
                <div className="space-y-3">
                  {analysis.strategies.map((strategy, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border transition-all ${
                        strategy.active
                          ? 'bg-white/5 border-white/20 hover:bg-white/10'
                          : 'bg-white/[0.02] border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-2xl">{getStrategyIcon(strategy)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-bold">{strategy.name}</h5>
                              {strategy.active && (
                                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                  AKTIF
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">{strategy.description}</p>
                            {strategy.active && strategy.signal && (
                              <div className="mt-2 flex gap-4 text-xs">
                                <div>
                                  <span className="opacity-60">Giriş:</span>
                                  <span className="ml-1 font-medium">{strategy.signal.entryPrice?.toFixed(2) || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="opacity-60">Stop:</span>
                                  <span className="ml-1 font-medium text-red-400">{strategy.signal.stopLoss?.toFixed(2) || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="opacity-60">Target:</span>
                                  <span className="ml-1 font-medium text-green-400">{strategy.signal.takeProfit?.toFixed(2) || 'N/A'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{strategy.strength}/10</div>
                          <div className="text-xs opacity-60">Güç</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Warning */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="text-xl">⚠️</div>
                  <div className="flex-1 text-sm">
                    <div className="font-bold text-yellow-400 mb-1">Risk Uyarısı</div>
                    <div className="text-gray-400">
                      Bu analiz otomatik olarak üretilmiştir. Yatırım kararı vermeden önce kendi araştırmanızı yapın.
                      Stop loss kullanmayı unutmayın. Kaldıraçlı işlemlerde dikkatli olun.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Open charts page with this symbol
                    window.location.href = `/charts?symbol=${symbol}`;
                  }}
                  className="flex-1 py-3 bg-accent-blue hover:bg-accent-blue/80 rounded-xl font-medium transition-colors"
                >
                  📊 Grafikte Aç
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors"
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
