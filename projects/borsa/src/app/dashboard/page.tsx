'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Coins, Activity } from 'lucide-react';
import { MarketSummaryComponent } from '@/components/dashboard/market-summary';
import { StockTracker } from '@/components/dashboard/stock-tracker';
import { CryptoTracker } from '@/components/dashboard/crypto-tracker';

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-dark-bg via-dark-bg to-gray-900 py-20"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-1 rounded-full blur-3xl orbit"></div>
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent-2 rounded-full blur-3xl orbit" style={{ animationDelay: '5s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-4 neon-text"
          >
            BORSA PRO
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300 mb-8"
          >
            Profesyonel Piyasa Takip Platformu
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 px-4 py-2 neon-border rounded-lg bg-gray-900/50 backdrop-blur-sm inline-flex"
          >
            <div className="w-2 h-2 bg-gain rounded-full pulse-glow"></div>
            <span className="text-sm font-medium text-gain">CANLI PIYASA VERILERI</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Market Overview
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track stocks and cryptocurrencies in real-time with comprehensive market data.
          </p>
        </motion.div>

        {/* Market Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <MarketSummaryComponent />
        </motion.div>

        {/* Trackers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stock Tracker */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StockTracker />
          </motion.div>

          {/* Crypto Tracker */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <CryptoTracker />
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Top Gainers</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Best performing assets</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">TSLA</span>
                <span className="text-green-500 font-medium">+3.72%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">SOL</span>
                <span className="text-green-500 font-medium">+6.63%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">BNB</span>
                <span className="text-green-500 font-medium">+2.11%</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Most Active</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">High volume trading</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">TSLA</span>
                <span className="text-blue-500 font-medium">67.9M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">AAPL</span>
                <span className="text-blue-500 font-medium">45.7M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">BTC</span>
                <span className="text-blue-500 font-medium">15.7B</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <Coins className="h-8 w-8 text-orange-500" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Market Status</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Trading sessions</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">US Markets</span>
                <span className="text-green-500 font-medium">Open</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Crypto</span>
                <span className="text-green-500 font-medium">24/7</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Next Update</span>
                <span className="text-blue-500 font-medium">30s</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2024 Borsa Dashboard. Real-time market data for educational purposes.
            </p>
            <p className="text-sm text-gray-500">
              Data refreshes every 30 seconds
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}