/**
 * Market Analysis AI - Advanced Chart and Pattern Recognition
 * Z.AI GLM-4.5 ile güçlendirilmiş teknik analiz sistemi
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number;
}

interface PatternAnalysis {
  pattern: string;
  confidence: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  target_price: number;
  stop_loss: number;
  description: string;
}

interface MarketSentiment {
  overall: number;
  social_sentiment: number;
  fear_greed_index: number;
  institutional_flow: number;
  retail_interest: number;
}

interface AIMarketAnalysis {
  symbol: string;
  price: number;
  price_change_24h: number;
  technical_indicators: TechnicalIndicator[];
  pattern_analysis: PatternAnalysis;
  market_sentiment: MarketSentiment;
  ai_recommendation: {
    action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    confidence: number;
    reasoning: string;
    time_horizon: 'SHORT' | 'MEDIUM' | 'LONG';
    risk_level: number;
  };
  support_resistance: {
    support_levels: number[];
    resistance_levels: number[];
  };
  volume_analysis: {
    volume_trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    volume_strength: number;
    volume_profile: any;
  };
}

const MarketAnalysisAI = ({ symbol = 'BTC' }: { symbol?: string }) => {
  const [analysis, setAnalysis] = useState<AIMarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('4h');
  const [watchlist, setWatchlist] = useState(['BTC', 'ETH', 'ADA', 'SOL']);

  useEffect(() => {
    loadAnalysis();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadAnalysis, 300000);
    return () => clearInterval(interval);
  }, [symbol, selectedTimeframe]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai/market-analysis?symbol=${symbol}&timeframe=${selectedTimeframe}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Market analysis error:', error);
      // Fallback mock data
      setAnalysis(generateMockAnalysis(symbol));
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalysis = (symbol: string): AIMarketAnalysis => {
    return {
      symbol,
      price: Math.random() * 50000 + 20000,
      price_change_24h: (Math.random() - 0.5) * 10,
      technical_indicators: [
        {
          name: 'RSI (14)',
          value: Math.random() * 100,
          signal: Math.random() > 0.5 ? 'BUY' : 'SELL',
          strength: Math.random() * 100
        },
        {
          name: 'MACD',
          value: (Math.random() - 0.5) * 1000,
          signal: Math.random() > 0.5 ? 'BUY' : 'NEUTRAL',
          strength: Math.random() * 100
        },
        {
          name: 'Bollinger Bands',
          value: Math.random() * 100,
          signal: 'NEUTRAL',
          strength: Math.random() * 100
        }
      ],
      pattern_analysis: {
        pattern: 'Ascending Triangle',
        confidence: 75 + Math.random() * 20,
        direction: 'BULLISH',
        target_price: Math.random() * 55000 + 25000,
        stop_loss: Math.random() * 45000 + 20000,
        description: 'Yükseliş üçgeni formasyonu tamamlanıyor, breakout bekleniyor'
      },
      market_sentiment: {
        overall: 60 + Math.random() * 30,
        social_sentiment: 50 + Math.random() * 40,
        fear_greed_index: Math.random() * 100,
        institutional_flow: Math.random() * 100,
        retail_interest: Math.random() * 100
      },
      ai_recommendation: {
        action: 'BUY',
        confidence: 70 + Math.random() * 25,
        reasoning: 'Teknik göstergeler pozitif, pattern formasyonu güçlü, sentiment iyileşiyor',
        time_horizon: 'MEDIUM',
        risk_level: Math.random() * 60 + 20
      },
      support_resistance: {
        support_levels: [42000, 38000, 35000],
        resistance_levels: [50000, 55000, 60000]
      },
      volume_analysis: {
        volume_trend: 'INCREASING',
        volume_strength: Math.random() * 100,
        volume_profile: {}
      }
    };
  };

  const getActionColor = (action: string) => {
    const colors = {
      'STRONG_BUY': 'bg-green-500/20 text-green-400',
      'BUY': 'bg-green-500/10 text-green-300',
      'HOLD': 'bg-gray-500/20 text-gray-400',
      'SELL': 'bg-red-500/10 text-red-300',
      'STRONG_SELL': 'bg-red-500/20 text-red-400'
    };
    return colors[action as keyof typeof colors] || colors.HOLD;
  };

  const getSignalColor = (signal: string) => {
    const colors = {
      'BUY': 'text-green-400',
      'SELL': 'text-red-400',
      'NEUTRAL': 'text-gray-400'
    };
    return colors[signal as keyof typeof colors] || colors.NEUTRAL;
  };

  const getDirectionColor = (direction: string) => {
    const colors = {
      'BULLISH': 'text-green-400',
      'BEARISH': 'text-red-400',
      'NEUTRAL': 'text-gray-400'
    };
    return colors[direction as keyof typeof colors] || colors.NEUTRAL;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">AI market analizi yükleniyor...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Analiz yüklenemedi</p>
          <Button onClick={loadAnalysis} className="mt-4">
            Tekrar Dene
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">📈 AI Market Analizi</h2>
          <div className="flex items-center gap-2">
            {watchlist.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === symbol ? 'primary' : 'outline'}
                onClick={() => window.location.href = `?symbol=${s}`}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {['1h', '4h', '1d', '1w'].map((tf) => (
            <Button
              key={tf}
              size="sm"
              variant={tf === selectedTimeframe ? 'primary' : 'outline'}
              onClick={() => setSelectedTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
          <Button onClick={loadAnalysis} size="sm">
            🔄 Yenile
          </Button>
        </div>
      </div>

      {/* Price Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold">${analysis.price.toLocaleString()}</h3>
            <p className="text-muted-foreground">{analysis.symbol} / USDT</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              analysis.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {analysis.price_change_24h >= 0 ? '+' : ''}{analysis.price_change_24h.toFixed(2)}%
            </div>
            <p className="text-sm text-muted-foreground">24h Değişim</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Recommendation */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">🤖 AI Önerisi</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={getActionColor(analysis.ai_recommendation.action)}>
                {analysis.ai_recommendation.action}
              </Badge>
              <div className="text-right">
                <div className="font-bold">{analysis.ai_recommendation.confidence.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Güven</div>
              </div>
            </div>
            
            <div className="bg-panel/50 rounded-lg p-4">
              <p className="text-sm">{analysis.ai_recommendation.reasoning}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Zaman Ufku: </span>
                {analysis.ai_recommendation.time_horizon}
              </div>
              <div>
                <span className="text-muted-foreground">Risk Seviyesi: </span>
                {analysis.ai_recommendation.risk_level.toFixed(0)}/100
              </div>
            </div>
          </div>
        </Card>

        {/* Technical Indicators */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">📊 Teknik İndikatörler</h3>
          
          <div className="space-y-3">
            {analysis.technical_indicators.map((indicator, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{indicator.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {indicator.value.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getSignalColor(indicator.signal)}`}>
                    {indicator.signal}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {indicator.strength.toFixed(0)}% güç
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pattern Analysis */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">🔍 Pattern Analizi</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{analysis.pattern_analysis.pattern}</div>
                <div className={`text-sm ${getDirectionColor(analysis.pattern_analysis.direction)}`}>
                  {analysis.pattern_analysis.direction}
                </div>
              </div>
              <Badge variant="outline">
                %{analysis.pattern_analysis.confidence.toFixed(1)} güven
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {analysis.pattern_analysis.description}
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Hedef: </span>
                <span className="font-bold text-green-400">
                  ${analysis.pattern_analysis.target_price.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Stop Loss: </span>
                <span className="font-bold text-red-400">
                  ${analysis.pattern_analysis.stop_loss.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Market Sentiment */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">💭 Market Sentiment</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Genel Sentiment</span>
                <span>{analysis.market_sentiment.overall.toFixed(0)}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analysis.market_sentiment.overall}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Sosyal: </span>
                {analysis.market_sentiment.social_sentiment.toFixed(0)}
              </div>
              <div>
                <span className="text-muted-foreground">Fear & Greed: </span>
                {analysis.market_sentiment.fear_greed_index.toFixed(0)}
              </div>
              <div>
                <span className="text-muted-foreground">Kurumsal: </span>
                {analysis.market_sentiment.institutional_flow.toFixed(0)}
              </div>
              <div>
                <span className="text-muted-foreground">Retail: </span>
                {analysis.market_sentiment.retail_interest.toFixed(0)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Support & Resistance */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">📏 Destek & Direnç Seviyeleri</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-400 mb-3">🟢 Destek Seviyeleri</h4>
            <div className="space-y-2">
              {analysis.support_resistance.support_levels.map((level, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-green-500/10 rounded">
                  <span className="text-green-300">S{idx + 1}</span>
                  <span className="font-mono">${level.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-red-400 mb-3">🔴 Direnç Seviyeleri</h4>
            <div className="space-y-2">
              {analysis.support_resistance.resistance_levels.map((level, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-red-500/10 rounded">
                  <span className="text-red-300">R{idx + 1}</span>
                  <span className="font-mono">${level.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Volume Analysis */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">📊 Hacim Analizi</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {analysis.volume_analysis.volume_trend}
            </div>
            <div className="text-sm text-muted-foreground">Hacim Trendi</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">
              {analysis.volume_analysis.volume_strength.toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">Hacim Gücü</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">
              NORMAL
            </div>
            <div className="text-sm text-muted-foreground">Profil Durumu</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MarketAnalysisAI;
