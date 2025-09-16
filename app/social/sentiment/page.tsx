/**
 * AILYDIAN GLOBAL TRADER - Social Sentiment Analysis Page
 * Advanced social sentiment analysis with real-time NLP and FinBERT
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react';
import SocialSentimentRadar from '@/components/social/SocialSentimentRadar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Radio, Brain, Users, TrendingUp, Globe, MessageCircle } from 'lucide-react';

export default function SocialSentimentPage() {
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
                  Social Sentiment Radar
                </h1>
                <p className="text-gray-400 mt-1">
                  Real-time social sentiment analysis with advanced NLP and FinBERT models
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-900/20 border border-blue-700 rounded-lg">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">FinBERT Powered</span>
              </div>
              
              <Link href="/quantum/portfolio">
                <Button variant="primary" size="sm">
                  <Radio className="w-4 h-4 mr-2" />
                  Quantum ML
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-black/50 border border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">FinBERT NLP</h3>
                  <p className="text-gray-400 text-sm">Financial sentiment with transformer models</p>
                </div>
              </div>
            </div>

            <div className="bg-black/50 border border-purple-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Multi-Platform</h3>
                  <p className="text-gray-400 text-sm">Twitter, Reddit, StockTwits integration</p>
                </div>
              </div>
            </div>

            <div className="bg-black/50 border border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Trend Analysis</h3>
                  <p className="text-gray-400 text-sm">Historical sentiment patterns and volatility</p>
                </div>
              </div>
            </div>

            <div className="bg-black/50 border border-yellow-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-600 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Real-time</h3>
                  <p className="text-gray-400 text-sm">Live monitoring and alerts</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Sentiment Radar Component */}
        <SocialSentimentRadar />

        {/* Algorithm Information */}
        <div className="mt-8 p-6 bg-black/50 border border-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">NLP Models & Algorithms</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mr-3"></div>
                  FinBERT: Financial sentiment transformer model
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mr-3"></div>
                  VADER: Rule-based sentiment analysis
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mr-3"></div>
                  TextBlob: Statistical NLP processing
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mr-3"></div>
                  Ensemble scoring with weighted averages
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Data Sources</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-purple-400 mr-3"></div>
                  Twitter API v2: Real-time tweets and engagement
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-purple-400 mr-3"></div>
                  Reddit API: Discussion threads and comments
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-purple-400 mr-3"></div>
                  StockTwits: Financial social network data
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-purple-400 mr-3"></div>
                  Real-time monitoring with Redis caching
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-white font-medium mb-2">Sentiment Scoring</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Very Positive</span>
                    <span className="text-green-400">+0.6 to +1.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Positive</span>
                    <span className="text-green-300">+0.2 to +0.6</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Neutral</span>
                    <span className="text-yellow-400">-0.2 to +0.2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Negative</span>
                    <span className="text-red-300">-0.6 to -0.2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Very Negative</span>
                    <span className="text-red-400">-1.0 to -0.6</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Processing Features</h4>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• Multi-model ensemble analysis</li>
                  <li>• Confidence scoring and validation</li>
                  <li>• Temporal trend analysis</li>
                  <li>• Source-specific sentiment breakdown</li>
                  <li>• Engagement-weighted scoring</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Real-time Capabilities</h4>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• Background data collection</li>
                  <li>• Redis-based caching</li>
                  <li>• API rate limit management</li>
                  <li>• Continuous sentiment monitoring</li>
                  <li>• Alert system integration</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-center text-gray-400 text-sm">
              <span className="font-medium text-blue-400">AILYDIAN Social Sentiment</span> - 
              Powered by FinBERT transformers, multi-platform data collection, and advanced NLP algorithms. 
              Real-time sentiment analysis for informed trading decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
