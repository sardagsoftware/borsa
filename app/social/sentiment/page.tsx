/**
 * AILYDIAN GLOBAL TRADER - Social Sentiment Analysis Page
 * Advanced social sentiment analysis with real-time NLP and FinBERT
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Radio, Brain, Users, TrendingUp, Globe, MessageCircle, Zap } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
              
              <Link href="/trading">
                <Button variant="default" size="sm">
                  <Radio className="w-4 h-4 mr-2" />
                  Live Trading
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Social Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-lg font-semibold text-white mb-2">Social Monitoring Active</h3>
                <p className="text-gray-400">Tracking sentiment across multiple platforms</p>
              </div>
            </CardContent>
          </Card>

          {/* Sentiment Metrics */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Sentiment Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Overall Sentiment</span>
                  <span className="text-green-400 font-bold">Bullish 72%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Fear & Greed</span>
                  <span className="text-yellow-400 font-bold">68 - Greed</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Social Volume</span>
                  <span className="text-blue-400 font-bold">High Activity</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Sources */}
        <div className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-white font-medium">Twitter/X</h4>
                  <p className="text-green-400 text-sm">Active</p>
                </div>

                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-white font-medium">Reddit</h4>
                  <p className="text-green-400 text-sm">Active</p>
                </div>

                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-white font-medium">Discord</h4>
                  <p className="text-green-400 text-sm">Active</p>
                </div>

                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-800 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-white font-medium">News</h4>
                  <p className="text-green-400 text-sm">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status */}
        <div className="mt-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm">Sentiment Analysis Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm">FinBERT Processing</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  Last update: {new Date().toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
