/**
 * AILYDIAN Social Sentiment Radar Component
 * Advanced social sentiment analysis with real-time heatmaps
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  MessageCircle, 
  Repeat2, 
  ExternalLink,
  Search,
  Brain,
  Zap,
  Radio,
  Users,
  BarChart3,
  Globe
} from 'lucide-react';

interface SentimentAnalysisResult {
  sentiment_score: number;
  sentiment_label: string;
  confidence: number;
  finbert_score?: any;
  vader_score?: any;
  textblob_score?: number;
}

interface SocialMention {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  source: string;
  symbol?: string;
  engagement?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    comments?: number;
    upvotes?: number;
  };
  url?: string;
}

interface SentimentTrendData {
  symbol: string;
  period_days: number;
  total_mentions: number;
  average_sentiment: number;
  sentiment_volatility: number;
  trend_direction: string;
  daily_data?: any;
  source_breakdown?: any;
}

const SocialSentimentRadar: React.FC = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Data states
  const [sentimentResult, setSentimentResult] = useState<SentimentAnalysisResult | null>(null);
  const [socialMentions, setSocialMentions] = useState<SocialMention[]>([]);
  const [trendData, setTrendData] = useState<SentimentTrendData | null>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  
  const [selectedSources, setSelectedSources] = useState(['twitter', 'reddit', 'stocktwits']);
  const [testText, setTestText] = useState('Apple stock is looking very bullish with strong earnings!');

  // Check service health on mount
  useEffect(() => {
    checkServiceHealth();
  }, []);

  const checkServiceHealth = async () => {
    try {
      const response = await fetch('/api/social-sentiment/health');
      const data = await response.json();
      setServiceStatus(data);
    } catch (error) {
      console.error('Service health check failed:', error);
      setServiceStatus({ status: 'offline' });
    }
  };

  const analyzeSentiment = async () => {
    if (!testText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/social-sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          symbol: symbol,
          use_finbert: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSentimentResult(result);
      } else {
        console.error('Sentiment analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    }
    setIsAnalyzing(false);
  };

  const collectSocialMentions = async () => {
    setIsCollecting(true);
    try {
      const response = await fetch('/api/social-sentiment/collect-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol,
          sources: selectedSources,
          limit: 50,
          hours_back: 24
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSocialMentions(result.mentions || []);
      } else {
        console.error('Social collection failed');
      }
    } catch (error) {
      console.error('Error collecting social mentions:', error);
    }
    setIsCollecting(false);
  };

  const analyzeTrends = async () => {
    try {
      const response = await fetch('/api/social-sentiment/sentiment-trend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol,
          days_back: 7
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTrendData(result);
      } else {
        console.error('Trend analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing trends:', error);
    }
  };

  const startMonitoring = async () => {
    setIsMonitoring(true);
    try {
      const response = await fetch('/api/social-sentiment/start-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Monitoring started:', result);
      } else {
        console.error('Failed to start monitoring');
      }
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
    setIsMonitoring(false);
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.6) return 'text-green-400';
    if (score >= 0.2) return 'text-green-300';
    if (score >= -0.2) return 'text-yellow-400';
    if (score >= -0.6) return 'text-red-300';
    return 'text-red-400';
  };

  const getSentimentBadge = (label: string) => {
    const colors = {
      very_positive: 'bg-green-600',
      positive: 'bg-green-500',
      neutral: 'bg-yellow-500',
      negative: 'bg-red-500',
      very_negative: 'bg-red-600'
    };
    return colors[label as keyof typeof colors] || 'bg-gray-500';
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'twitter': return '🐦';
      case 'reddit': return '🤖';
      case 'stocktwits': return '💬';
      default: return '📱';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="bg-black/50 border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Radio className="w-6 h-6 text-purple-400" />
            <span className="text-white">Social Sentiment Radar</span>
            <div className={`w-3 h-3 rounded-full ${serviceStatus?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-gray-300 text-sm font-medium">Symbol:</label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="w-24 bg-gray-800 border-gray-600"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-300 text-sm">Sources:</span>
              {['twitter', 'reddit', 'stocktwits'].map(source => (
                <button
                  key={source}
                  onClick={() => {
                    if (selectedSources.includes(source)) {
                      setSelectedSources(prev => prev.filter(s => s !== source));
                    } else {
                      setSelectedSources(prev => [...prev, source]);
                    }
                  }}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedSources.includes(source) 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {getSourceIcon(source)} {source}
                </button>
              ))}
            </div>

            <Button
              onClick={collectSocialMentions}
              disabled={isCollecting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Search className="w-4 h-4 mr-2" />
              {isCollecting ? 'Collecting...' : 'Collect Data'}
            </Button>

            <Button
              onClick={analyzeTrends}
              variant="outline"
              className="border-blue-600 text-blue-400"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyze Trends
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Test */}
      <Card className="bg-black/50 border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-400" />
            <span className="text-white">Sentiment Analysis Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-gray-300 text-sm font-medium">Test Text:</label>
            <Input
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to analyze sentiment..."
              className="bg-gray-800 border-gray-600"
            />
          </div>

          <Button
            onClick={analyzeSentiment}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
          </Button>

          {sentimentResult && (
            <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-gray-400 text-xs">Overall Score</div>
                  <div className={`text-lg font-bold ${getSentimentColor(sentimentResult.sentiment_score)}`}>
                    {sentimentResult.sentiment_score.toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Label</div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSentimentBadge(sentimentResult.sentiment_label)}`}>
                    {sentimentResult.sentiment_label.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Confidence</div>
                  <div className="text-white font-medium">{(sentimentResult.confidence * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">FinBERT Available</div>
                  <div className="text-white">{sentimentResult.finbert_score ? '✅' : '❌'}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trend Analysis Results */}
      {trendData && (
        <Card className="bg-black/50 border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-white">Sentiment Trends for {trendData.symbol}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{trendData.total_mentions}</div>
                <div className="text-gray-400 text-sm">Total Mentions</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getSentimentColor(trendData.average_sentiment)}`}>
                  {trendData.average_sentiment.toFixed(3)}
                </div>
                <div className="text-gray-400 text-sm">Avg Sentiment</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {trendData.sentiment_volatility.toFixed(3)}
                </div>
                <div className="text-gray-400 text-sm">Volatility</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  trendData.trend_direction === 'positive' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trendData.trend_direction === 'positive' ? '↗️' : '↘️'}
                </div>
                <div className="text-gray-400 text-sm">Trend</div>
              </div>
            </div>

            {trendData.source_breakdown && (
              <div className="mt-6">
                <h4 className="text-white font-medium mb-3">Source Breakdown</h4>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(trendData.source_breakdown).map(([source, score]) => (
                    <div key={source} className="bg-gray-900 p-3 rounded border border-gray-700">
                      <div className="flex items-center space-x-2 mb-1">
                        <span>{getSourceIcon(source)}</span>
                        <span className="text-gray-300 text-sm capitalize">{source}</span>
                      </div>
                      <div className={`font-medium ${getSentimentColor(score as number)}`}>
                        {(score as number).toFixed(3)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Social Mentions */}
      {socialMentions.length > 0 && (
        <Card className="bg-black/50 border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-yellow-400" />
              <span className="text-white">Recent Social Mentions</span>
              <span className="text-gray-400 text-sm">({socialMentions.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {socialMentions.slice(0, 10).map((mention) => (
                <div key={mention.id} className="bg-gray-900 p-4 rounded border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span>{getSourceIcon(mention.source)}</span>
                      <span className="text-gray-300 text-sm font-medium">@{mention.author}</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(mention.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {mention.url && (
                      <a 
                        href={mention.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-2 line-clamp-3">
                    {mention.text}
                  </p>
                  
                  {mention.engagement && (
                    <div className="flex items-center space-x-4 text-gray-500 text-xs">
                      {mention.engagement.likes !== undefined && (
                        <span className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{mention.engagement.likes}</span>
                        </span>
                      )}
                      {mention.engagement.retweets !== undefined && (
                        <span className="flex items-center space-x-1">
                          <Repeat2 className="w-3 h-3" />
                          <span>{mention.engagement.retweets}</span>
                        </span>
                      )}
                      {mention.engagement.comments !== undefined && (
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{mention.engagement.comments}</span>
                        </span>
                      )}
                      {mention.engagement.upvotes !== undefined && (
                        <span className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>{mention.engagement.upvotes}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Status */}
      <Card className="bg-black/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <span className="text-white">Service Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Status</div>
              <div className={`font-medium ${serviceStatus?.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
                {serviceStatus?.status || 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">FinBERT</div>
              <div className={`font-medium ${serviceStatus?.finbert_available ? 'text-green-400' : 'text-yellow-400'}`}>
                {serviceStatus?.finbert_available ? 'Available' : 'Loading...'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Redis</div>
              <div className={`font-medium ${serviceStatus?.redis_available ? 'text-green-400' : 'text-red-400'}`}>
                {serviceStatus?.redis_available ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Version</div>
              <div className="text-gray-300 font-medium">{serviceStatus?.version || 'Unknown'}</div>
            </div>
          </div>

          <div className="mt-4 flex space-x-2">
            <Button
              onClick={checkServiceHealth}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              <Activity className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
            
            <Button
              onClick={startMonitoring}
              disabled={isMonitoring}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Globe className="w-4 h-4 mr-2" />
              {isMonitoring ? 'Starting...' : 'Start Monitoring'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialSentimentRadar;
