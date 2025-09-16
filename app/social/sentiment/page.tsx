/**
 * AILYDIAN GLOBAL TRADER - Social Sentiment Analysis Page
 * Advanced social sentiment analysis with real-time NLP and FinBERT
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react';
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
              
              <Link href="/trading">
                <Button variant="primary" size="sm">
                  <Radio className="w-4 h-4 mr-2" />
                  Trading
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Temporary message */}
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Social Sentiment Radar</h2>
            <p className="text-gray-400 mb-4">Advanced social sentiment analysis system is currently being optimized for production</p>
            <div className="flex items-center justify-center space-x-4">
              <Link href="/trading">
                <Button variant="primary">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trading Dashboard
                </Button>
              </Link>
              <Link href="/news/intelligence">
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  News Intelligence
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
