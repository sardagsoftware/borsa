'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  BoltIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import AiLydianChat from './AiLydianChat';
import MarketAnalysisWidget from './MarketAnalysisWidget';
import TradingBotPanel from './TradingBotPanel';

export default function AiDashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* AI Dashboard Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AiLydian Intelligence Center</h2>
              <p className="text-blue-200">Groq AI ile güçlendirilmiş kripto trading platformu</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-blue-300">AI Model</p>
              <p className="text-sm font-semibold text-white">Llama 3.1 70B</p>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-black/30 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-blue-200 text-sm">Market Analysis</p>
                <p className="text-white font-semibold">Real-time AI Insights</p>
              </div>
            </div>
          </div>
          
          <div className="bg-black/30 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <BoltIcon className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-purple-200 text-sm">Smart Trading</p>
                <p className="text-white font-semibold">Automated Strategies</p>
              </div>
            </div>
          </div>
          
          <div className="bg-black/30 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-200 text-sm">AI Assistant</p>
                <p className="text-white font-semibold">24/7 Support</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Components Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Analysis Widget */}
        <MarketAnalysisWidget symbols={['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK']} />
        
        {/* Trading Bot Panel */}
        <TradingBotPanel />
      </div>

      {/* Chat Assistant Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center z-40 group"
      >
        <ChatBubbleLeftRightIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <SparklesIcon className="w-4 h-4 text-white" />
        </div>
      </motion.button>

      {/* AI Chat Assistant */}
      <AiLydianChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />

      {/* AI Features Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">AI Özellikleri</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">Market Analysis</h4>
            <p className="text-sm text-gray-400">
              Gerçek zamanlı piyasa analizi ve sentiment değerlendirmesi
            </p>
          </div>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-3">
              <BoltIcon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">Smart Trading</h4>
            <p className="text-sm text-gray-400">
              Otomatik trading sinyalleri ve risk yönetimi
            </p>
          </div>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">Security AI</h4>
            <p className="text-sm text-gray-400">
              Güvenlik tehditi tespiti ve portföy koruması
            </p>
          </div>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center mb-3">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-2">AI Assistant</h4>
            <p className="text-sm text-gray-400">
              7/24 akıllı trading danışmanı ve destek
            </p>
          </div>
        </div>
      </motion.div>

      {/* Performance Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">AI Accuracy</h4>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-2">94.7%</div>
          <p className="text-sm text-gray-400">Trading sinyali doğruluk oranı</p>
        </div>
        
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Response Time</h4>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-2">0.8s</div>
          <p className="text-sm text-gray-400">Ortalama AI yanıt süresi</p>
        </div>
        
        <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Active Bots</h4>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-2">1,247</div>
          <p className="text-sm text-gray-400">Aktif trading bot sayısı</p>
        </div>
      </motion.div>
    </div>
  );
}
