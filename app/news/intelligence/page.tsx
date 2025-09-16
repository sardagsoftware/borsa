/**
 * AILYDIAN GLOBAL TRADER - News Intelligence & Trust Index Page  
 * Advanced news analysis with trust scoring and heatmap visualization
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react';
import NewsIntelligenceDashboard from '@/components/news/NewsIntelligenceDashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Newspaper, Shield, TrendingUp, Globe, Activity, Brain } from 'lucide-react';

export default function NewsIntelligencePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link href="/trading">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Trading
                </Button>
              </Link>
              
              <div className="h-6 w-px bg-gray-700"></div>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-green-400 bg-clip-text text-transparent">
                  News Intelligence & Trust Index
                </h1>
                <p className="text-gray-400 mt-1">
                  Advanced news analysis with AI-powered trust scoring and sentiment heatmaps
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-900/20 border border-green-700 rounded-lg">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Trust Verified</span>
              </div>
              
              <Link href="/social/sentiment">
                <Button variant="primary" size="sm">
                  <Brain className="w-4 h-4 mr-2" />
                  Social Sentiment
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-black/50 border border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Multi-Source</h3>
                  <p className="text-gray-400 text-sm">Bloomberg, Reuters, WSJ, Financial Times</p>
                </div>
              </div>
            </div>

            <div className="bg-black/50 border border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Trust Index</h3>
                  <p className="text-gray-400 text-sm">AI-powered credibility scoring</p>
                </div>
              </div>
            </div>

            <div className="bg-black/50 border border-purple-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Sentiment Heatmap</h3>
                  <p className="text-gray-400 text-sm">Real-time news sentiment visualization</p>
                </div>
              </div>
            </div>

            <div className="bg-black/50 border border-yellow-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Trend Analysis</h3>
                  <p className="text-gray-400 text-sm">Temporal sentiment patterns</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* News Intelligence Dashboard Component */}
        <NewsIntelligenceDashboard />

        {/* Trust Scoring Methodology */}
        <div className="mt-8 p-6 bg-black/50 border border-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Trust Scoring Algorithm</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-green-400 mr-3"></div>
                  Source Credibility: Base trust scores for major outlets
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-green-400 mr-3"></div>
                  Content Quality: Article length, financial relevance, structure
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-green-400 mr-3"></div>
                  Author Reputation: Institutional credentials, byline analysis
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-green-400 mr-3"></div>
                  Temporal Freshness: Recency boost for breaking news
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-green-400 mr-3"></div>
                  Sentiment Consistency: Bias detection and neutrality scoring
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">News Sources</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">📈 Bloomberg</span>
                    <span className="text-green-400 font-medium">95%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">📊 Reuters</span>
                    <span className="text-green-400 font-medium">93%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">💼 Financial Times</span>
                    <span className="text-blue-400 font-medium">91%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">💰 Wall Street Journal</span>
                    <span className="text-blue-400 font-medium">89%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">📺 CNBC</span>
                    <span className="text-yellow-400 font-medium">78%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">⏰ MarketWatch</span>
                    <span className="text-yellow-400 font-medium">75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">🌐 Yahoo Finance</span>
                    <span className="text-yellow-400 font-medium">65%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">🔍 Seeking Alpha</span>
                    <span className="text-orange-400 font-medium">62%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-white font-medium mb-2">Data Collection</h4>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• Real-time RSS feed monitoring</li>
                  <li>• Premium news API integration</li>
                  <li>• Web scraping with respect for robots.txt</li>
                  <li>• Rate limiting and ethical data usage</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Analysis Features</h4>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• NLP-powered sentiment analysis</li>
                  <li>• Keyword and entity extraction</li>
                  <li>• Symbol mention detection</li>
                  <li>• Article categorization</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Visualization</h4>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• Hourly sentiment heatmaps</li>
                  <li>• Source distribution charts</li>
                  <li>• Trust score histograms</li>
                  <li>• Temporal trend analysis</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-center text-gray-400 text-sm">
              <span className="font-medium text-blue-400">AILYDIAN News Intelligence</span> - 
              Advanced news aggregation, AI-powered trust scoring, and real-time sentiment analysis. 
              Combining multiple premium sources for comprehensive market intelligence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
