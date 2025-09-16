/**
 * AILYDIAN News Intelligence Dashboard
 * Advanced news analysis with trust scoring and heatmap visualization
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Newspaper, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  Clock, 
  ExternalLink,
  Search,
  Filter,
  BarChart3,
  Activity,
  Star,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  author?: string;
  published_at: string;
  url?: string;
  symbols: string[];
  sentiment_score: number;
  sentiment_label: string;
  trust_score: number;
  trust_level: string;
  keywords: string[];
}

interface NewsResponse {
  articles: NewsArticle[];
  total_count: number;
  avg_sentiment: number;
  avg_trust_score: number;
  source_breakdown: Record<string, number>;
}

interface HeatmapData {
  symbol: string;
  period_days: number;
  total_articles: number;
  heatmap_data: {
    date: string;
    hour: number;
    sentiment_score: number;
    trust_score: number;
    weighted_sentiment: number;
    article_count: number;
    intensity: number;
  }[];
  source_breakdown: Record<string, number>;
}

const NewsIntelligenceDashboard: React.FC = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [isCollecting, setIsCollecting] = useState(false);
  const [isGeneratingHeatmap, setIsGeneratingHeatmap] = useState(false);
  
  // Data states
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [trustSources, setTrustSources] = useState<any>(null);
  
  const [selectedSources, setSelectedSources] = useState([
    'bloomberg', 'reuters', 'yahoo_finance', 'marketwatch'
  ]);
  const [minTrustScore, setMinTrustScore] = useState(0.6);
  const [hoursBack, setHoursBack] = useState(24);

  // Available news sources
  const newsSources = [
    { id: 'bloomberg', name: 'Bloomberg', icon: '📈', trustScore: 0.95 },
    { id: 'reuters', name: 'Reuters', icon: '📊', trustScore: 0.93 },
    { id: 'financial_times', name: 'Financial Times', icon: '💼', trustScore: 0.91 },
    { id: 'wall_street_journal', name: 'WSJ', icon: '💰', trustScore: 0.89 },
    { id: 'cnbc', name: 'CNBC', icon: '📺', trustScore: 0.78 },
    { id: 'marketwatch', name: 'MarketWatch', icon: '⏰', trustScore: 0.75 },
    { id: 'yahoo_finance', name: 'Yahoo Finance', icon: '🌐', trustScore: 0.65 },
    { id: 'seeking_alpha', name: 'Seeking Alpha', icon: '🔍', trustScore: 0.62 },
  ];

  // Check service health on mount
  useEffect(() => {
    checkServiceHealth();
    getTrustSources();
  }, []);

  const checkServiceHealth = async () => {
    try {
      const response = await fetch('/api/news-intelligence/health');
      const data = await response.json();
      setServiceStatus(data);
    } catch (error) {
      console.error('Service health check failed:', error);
      setServiceStatus({ status: 'offline' });
    }
  };

  const getTrustSources = async () => {
    try {
      const response = await fetch('/api/news-intelligence/trust-sources');
      const data = await response.json();
      setTrustSources(data);
    } catch (error) {
      console.error('Failed to get trust sources:', error);
    }
  };

  const collectNews = async () => {
    setIsCollecting(true);
    try {
      const response = await fetch('/api/news-intelligence/collect-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: [symbol],
          sources: selectedSources,
          limit: 50,
          hours_back: hoursBack,
          min_trust_score: minTrustScore
        })
      });

      if (response.ok) {
        const result = await response.json();
        setNewsData(result);
      } else {
        console.error('News collection failed');
      }
    } catch (error) {
      console.error('Error collecting news:', error);
    }
    setIsCollecting(false);
  };

  const generateHeatmap = async () => {
    setIsGeneratingHeatmap(true);
    try {
      const response = await fetch('/api/news-intelligence/heatmap-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol,
          days_back: 7,
          sources: selectedSources
        })
      });

      if (response.ok) {
        const result = await response.json();
        setHeatmapData(result);
      } else {
        console.error('Heatmap generation failed');
      }
    } catch (error) {
      console.error('Error generating heatmap:', error);
    }
    setIsGeneratingHeatmap(false);
  };

  const getTrustColor = (trustScore: number) => {
    if (trustScore >= 0.9) return 'text-green-400';
    if (trustScore >= 0.8) return 'text-blue-400';
    if (trustScore >= 0.6) return 'text-yellow-400';
    if (trustScore >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getTrustBadge = (trustLevel: string) => {
    const colors = {
      very_high: 'bg-green-600',
      high: 'bg-blue-600',
      medium: 'bg-yellow-600',
      low: 'bg-orange-600',
      very_low: 'bg-red-600'
    };
    return colors[trustLevel as keyof typeof colors] || 'bg-gray-600';
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.6) return 'text-green-400';
    if (score >= 0.2) return 'text-green-300';
    if (score >= -0.2) return 'text-yellow-400';
    if (score >= -0.6) return 'text-red-300';
    return 'text-red-400';
  };

  const getSourceIcon = (source: string) => {
    const sourceInfo = newsSources.find(s => s.id === source);
    return sourceInfo?.icon || '📰';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="bg-black/50 border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Newspaper className="w-6 h-6 text-blue-400" />
            <span className="text-white">News Intelligence Dashboard</span>
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
              <label className="text-gray-300 text-sm font-medium">Hours Back:</label>
              <select 
                value={hoursBack}
                onChange={(e) => setHoursBack(Number(e.target.value))}
                className="bg-gray-800 border-gray-600 rounded px-2 py-1 text-white text-sm"
              >
                <option value={6}>6h</option>
                <option value={12}>12h</option>
                <option value={24}>24h</option>
                <option value={48}>48h</option>
                <option value={72}>3d</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-gray-300 text-sm font-medium">Min Trust:</label>
              <select 
                value={minTrustScore}
                onChange={(e) => setMinTrustScore(Number(e.target.value))}
                className="bg-gray-800 border-gray-600 rounded px-2 py-1 text-white text-sm"
              >
                <option value={0.9}>90%</option>
                <option value={0.8}>80%</option>
                <option value={0.6}>60%</option>
                <option value={0.4}>40%</option>
              </select>
            </div>

            <Button
              onClick={collectNews}
              disabled={isCollecting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="w-4 h-4 mr-2" />
              {isCollecting ? 'Collecting...' : 'Collect News'}
            </Button>

            <Button
              onClick={generateHeatmap}
              disabled={isGeneratingHeatmap}
              variant="outline"
              className="border-purple-600 text-purple-400"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {isGeneratingHeatmap ? 'Generating...' : 'Heatmap'}
            </Button>
          </div>

          {/* News Source Selection */}
          <div className="space-y-2">
            <label className="text-gray-300 text-sm font-medium">News Sources:</label>
            <div className="flex flex-wrap gap-2">
              {newsSources.map(source => (
                <button
                  key={source.id}
                  onClick={() => {
                    if (selectedSources.includes(source.id)) {
                      setSelectedSources(prev => prev.filter(s => s !== source.id));
                    } else {
                      setSelectedSources(prev => [...prev, source.id]);
                    }
                  }}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                    selectedSources.includes(source.id) 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <span>{source.icon}</span>
                  <span>{source.name}</span>
                  <span className={`text-xs ${getTrustColor(source.trustScore)}`}>
                    ({(source.trustScore * 100).toFixed(0)}%)
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Statistics */}
      {newsData && (
        <Card className="bg-black/50 border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <span className="text-white">News Analysis Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{newsData.total_count}</div>
                <div className="text-gray-400 text-sm">Total Articles</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getSentimentColor(newsData.avg_sentiment)}`}>
                  {newsData.avg_sentiment.toFixed(3)}
                </div>
                <div className="text-gray-400 text-sm">Avg Sentiment</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getTrustColor(newsData.avg_trust_score)}`}>
                  {(newsData.avg_trust_score * 100).toFixed(0)}%
                </div>
                <div className="text-gray-400 text-sm">Avg Trust</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {Object.keys(newsData.source_breakdown).length}
                </div>
                <div className="text-gray-400 text-sm">Sources</div>
              </div>
            </div>

            {/* Source Breakdown */}
            <div className="mt-6">
              <h4 className="text-white font-medium mb-3">Source Distribution</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(newsData.source_breakdown).map(([source, count]) => (
                  <div key={source} className="bg-gray-900 p-3 rounded border border-gray-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center space-x-1">
                        <span>{getSourceIcon(source)}</span>
                        <span className="text-gray-300 text-xs capitalize">
                          {source.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                    <div className="text-white font-medium">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Heatmap Visualization */}
      {heatmapData && (
        <Card className="bg-black/50 border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span className="text-white">News Sentiment Heatmap - {heatmapData.symbol}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-gray-300 text-sm">
                {heatmapData.total_articles} articles over {heatmapData.period_days} days
              </div>
            </div>

            {/* Simple heatmap grid */}
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="text-center text-gray-400 text-sm mb-4">
                Hourly Sentiment Intensity (24h format)
              </div>
              
              <div className="grid grid-cols-8 gap-1 mb-4">
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="text-center text-xs text-gray-400 p-1">
                    {hour.toString().padStart(2, '0')}
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                {Array.from({ length: Math.ceil(heatmapData.heatmap_data.length / 24) }, (_, dayIndex) => (
                  <div key={dayIndex} className="grid grid-cols-24 gap-px">
                    {Array.from({ length: 24 }, (_, hourIndex) => {
                      const dataPoint = heatmapData.heatmap_data.find(d => 
                        d.hour === hourIndex && 
                        new Date(d.date).getDate() === new Date().getDate() - dayIndex
                      );
                      
                      const intensity = dataPoint?.intensity || 0;
                      const sentiment = dataPoint?.weighted_sentiment || 0;
                      
                      let bgColor = 'bg-gray-800';
                      if (dataPoint) {
                        if (sentiment > 0.2) bgColor = `bg-green-500 opacity-${Math.round(intensity * 100)}`;
                        else if (sentiment < -0.2) bgColor = `bg-red-500 opacity-${Math.round(intensity * 100)}`;
                        else bgColor = `bg-yellow-500 opacity-${Math.round(intensity * 50)}`;
                      }
                      
                      return (
                        <div
                          key={`${dayIndex}-${hourIndex}`}
                          className={`h-4 ${bgColor} rounded-sm`}
                          title={dataPoint ? 
                            `${hourIndex}:00 - Sentiment: ${sentiment.toFixed(3)}, Articles: ${dataPoint.article_count}` : 
                            'No data'
                          }
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="flex justify-center items-center mt-4 space-x-4 text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Positive</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Neutral</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Negative</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* News Articles */}
      {newsData && newsData.articles.length > 0 && (
        <Card className="bg-black/50 border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Newspaper className="w-5 h-5 text-yellow-400" />
              <span className="text-white">Recent News Articles</span>
              <span className="text-gray-400 text-sm">({newsData.articles.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {newsData.articles.slice(0, 10).map((article) => (
                <div key={article.id} className="bg-gray-900 p-4 rounded border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span>{getSourceIcon(article.source)}</span>
                      <span className="text-gray-300 text-sm font-medium capitalize">
                        {article.source.replace('_', ' ')}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatDate(article.published_at)}
                      </span>
                      
                      {/* Trust Score Badge */}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTrustBadge(article.trust_level)}`}>
                        {(article.trust_score * 100).toFixed(0)}% Trust
                      </span>
                    </div>
                    
                    {article.url && (
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  
                  <h3 className="text-white font-medium mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                    {article.summary}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span className={`font-medium ${getSentimentColor(article.sentiment_score)}`}>
                          {article.sentiment_score.toFixed(3)}
                        </span>
                      </div>
                      
                      {article.symbols.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Globe className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-400">
                            {article.symbols.join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {article.author && (
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-400">by {article.author}</span>
                        </div>
                      )}
                    </div>
                    
                    {article.keywords.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="text-xs text-gray-500">
                          {article.keywords.slice(0, 3).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Status & Trust Sources */}
      <Card className="bg-black/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-gray-400" />
            <span className="text-white">Service Status & Trust Index</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
            <div>
              <div className="text-gray-400">Status</div>
              <div className={`font-medium ${serviceStatus?.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
                {serviceStatus?.status || 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">RSS Feeds</div>
              <div className="text-blue-400 font-medium">{serviceStatus?.sources_available || 0}</div>
            </div>
            <div>
              <div className="text-gray-400">Redis Cache</div>
              <div className={`font-medium ${serviceStatus?.redis_available ? 'text-green-400' : 'text-red-400'}`}>
                {serviceStatus?.redis_available ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Version</div>
              <div className="text-gray-300 font-medium">{serviceStatus?.version || 'Unknown'}</div>
            </div>
          </div>

          {/* Trust Score Legend */}
          {trustSources && (
            <div className="space-y-3">
              <h4 className="text-white font-medium">Trust Score Methodology</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                {Object.entries(trustSources.trust_levels).map(([level, range]) => (
                  <div key={level} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded ${getTrustBadge(level)}`}></div>
                    <span className="text-gray-300 capitalize">{level.replace('_', ' ')}: {range}</span>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-gray-400 mt-4">
                Trust scores based on source credibility, content quality, author reputation, 
                publication freshness, and sentiment consistency.
              </div>
            </div>
          )}

          <div className="mt-4">
            <Button
              onClick={checkServiceHealth}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              <Activity className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsIntelligenceDashboard;
