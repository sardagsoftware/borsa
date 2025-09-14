'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface MarketAnalysis {
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  signals: Array<{
    type: string;
    strength: number;
    description: string;
  }>;
  recommendations: string[];
  risk_level: 'low' | 'medium' | 'high';
  target_price?: number;
  stop_loss?: number;
}

interface MarketAnalysisWidgetProps {
  symbols?: string[];
}

export default function MarketAnalysisWidget({ symbols = ['BTC', 'ETH', 'SOL'] }: MarketAnalysisWidgetProps) {
  const [analyses, setAnalyses] = useState<Record<string, MarketAnalysis>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const analyzeSymbol = async (symbol: string) => {
    setLoading(prev => ({ ...prev, [symbol]: true }));

    try {
      // Simulated market data - production'da gerçek veriler kullanılacak
      const mockMarketData = {
        price: Math.random() * 50000 + 20000,
        volume: Math.random() * 1000000,
        change24h: (Math.random() - 0.5) * 20,
        rsi: Math.random() * 100,
        macd: Math.random() - 0.5,
        support: Math.random() * 45000 + 15000,
        resistance: Math.random() * 55000 + 25000
      };

      const response = await fetch('/api/ai/groq/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          marketData: mockMarketData
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalyses(prev => ({
          ...prev,
          [symbol]: data.analysis
        }));
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error(`Analysis error for ${symbol}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [symbol]: false }));
    }
  };

  const refreshAll = async () => {
    setLastUpdate(new Date());
    for (const symbol of symbols) {
      await analyzeSymbol(symbol);
    }
  };

  useEffect(() => {
    const initializeAnalysis = async () => {
      for (const symbol of symbols) {
        await analyzeSymbol(symbol);
      }
    };
    
    setLastUpdate(new Date());
    initializeAnalysis();
  }, [symbols]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />;
      case 'bearish':
        return <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ChartBarIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'high':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 border border-gray-700 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">AI Market Analysis</h3>
            <p className="text-gray-400 text-sm">Groq AI Powered Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
          </span>
          <button
            onClick={refreshAll}
            className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {symbols.map((symbol) => (
          <motion.div
            key={symbol}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-600 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{symbol}</span>
                {analyses[symbol] && getSentimentIcon(analyses[symbol].sentiment)}
              </div>
              {loading[symbol] && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {analyses[symbol] ? (
              <div className="space-y-3">
                {/* Sentiment & Confidence */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Sentiment:</span>
                  <span className={`text-sm font-medium ${
                    analyses[symbol].sentiment === 'bullish' ? 'text-green-500' :
                    analyses[symbol].sentiment === 'bearish' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {analyses[symbol].sentiment.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Güven:</span>
                  <span className="text-sm font-medium text-white">
                    {(analyses[symbol].confidence * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Risk Level */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Risk:</span>
                  <span className={`text-xs px-2 py-1 rounded border ${getRiskColor(analyses[symbol].risk_level)}`}>
                    {analyses[symbol].risk_level.toUpperCase()}
                  </span>
                </div>

                {/* Signals */}
                {analyses[symbol].signals && analyses[symbol].signals.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-400 block mb-2">Sinyaller:</span>
                    <div className="space-y-1">
                      {analyses[symbol].signals.slice(0, 2).map((signal, index) => (
                        <div key={index} className="text-xs text-gray-300 bg-gray-700 rounded p-2">
                          <div className="flex justify-between items-center">
                            <span>{signal.type}</span>
                            <span className="text-blue-400">{(signal.strength * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Targets */}
                {(analyses[symbol].target_price || analyses[symbol].stop_loss) && (
                  <div className="pt-2 border-t border-gray-700">
                    {analyses[symbol].target_price && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Hedef:</span>
                        <span className="text-green-400">${analyses[symbol].target_price?.toLocaleString()}</span>
                      </div>
                    )}
                    {analyses[symbol].stop_loss && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Stop Loss:</span>
                        <span className="text-red-400">${analyses[symbol].stop_loss?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : loading[symbol] ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-700 rounded animate-pulse w-1/2" />
              </div>
            ) : (
              <div className="text-center py-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Analiz yüklenemedi</p>
                <button
                  onClick={() => analyzeSymbol(symbol)}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                >
                  Tekrar dene
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-600/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-blue-300">
            Bu analizler Groq AI tarafından gerçek zamanlı olarak üretilmektedir. 
            Yatırım tavsiyesi değildir, sadece bilgilendirme amaçlıdır.
          </span>
        </div>
      </div>
    </motion.div>
  );
}
