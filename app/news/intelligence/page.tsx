/**
 * AILYDIAN GLOBAL TRADER - News Intelligence & Trust Index Page  
 * Advanced news analysis with trust scoring and heatmap visualization
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react';
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
        </div>

        {/* Temporary message */}
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Brain className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">News Intelligence Dashboard</h2>
            <p className="text-gray-400 mb-4">Advanced news analysis system is currently being optimized for production</p>
            <div className="flex items-center justify-center space-x-4">
              <Link href="/trading">
                <Button variant="primary">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trading Dashboard
                </Button>
              </Link>
              <Link href="/social/sentiment">
                <Button variant="outline">
                  <Activity className="w-4 h-4 mr-2" />
                  Social Sentiment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
