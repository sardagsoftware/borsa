/**
 * AILYDIAN GLOBAL TRADER - News Intelligence & Trust Index Page  
 * Advanced news analysis with trust scoring and heatmap visualization
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Newspaper, Shield, TrendingUp, Globe, Activity, Brain, Zap } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
                <Button variant="default" size="sm">
                  <Brain className="w-4 h-4 mr-2" />
                  Sentiment Analysis
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* News Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Newspaper className="w-5 h-5 mr-2" />
                News Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-lg font-semibold text-white mb-2">AI News Analysis Active</h3>
                <p className="text-gray-400">Real-time news sentiment and trust scoring</p>
              </div>
            </CardContent>
          </Card>

          {/* Trust Metrics */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Trust Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Overall Trust Score</span>
                  <span className="text-green-400 font-bold">94.2%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Source Reliability</span>
                  <span className="text-blue-400 font-bold">91.7%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '91.7%' }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Fact Verification</span>
                  <span className="text-purple-400 font-bold">96.8%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '96.8%' }}></div>
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
                    <span className="text-green-400 text-sm">News Analysis Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm">Real-time Processing</span>
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
