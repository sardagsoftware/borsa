/**
 * AILYDIAN GLOBAL TRADER - Quantum Portfolio Optimization Page
 * Advanced portfolio optimization with quantum machine learning
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react';
import QuantumPortfolioOptimizer from '@/components/quantum/QuantumPortfolioOptimizer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Atom, Zap, Brain } from 'lucide-react';

export default function QuantumPortfolioPage() {
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
                  Quantum Portfolio Optimizer
                </h1>
                <p className="text-gray-400 mt-1">
                  Advanced portfolio optimization using quantum machine learning algorithms
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-purple-900/20 border border-purple-700 rounded-lg">
                <Atom className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">Quantum Enhanced</span>
              </div>
              
              <Link href="/ai-lens/trader">
                <Button variant="primary" size="sm">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Terminal
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-black/50 border border-purple-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Atom className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Quantum VQE</h3>
                  <p className="text-gray-400 text-sm">Variational Quantum Eigensolver for portfolio optimization</p>
                </div>
              </div>
            </div>

            <div className="bg-black/50 border border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Risk Analytics</h3>
                  <p className="text-gray-400 text-sm">Advanced VaR, CVaR, and drawdown analysis</p>
                </div>
              </div>
            </div>

            <div className="bg-black/50 border border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Multi-Objective</h3>
                  <p className="text-gray-400 text-sm">Sharpe, Sortino, return, and risk optimization</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quantum Portfolio Optimizer Component */}
        <QuantumPortfolioOptimizer />

        {/* Footer Info */}
        <div className="mt-8 p-6 bg-black/50 border border-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Quantum Algorithms</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-purple-400 mr-3"></div>
                  Variational Quantum Eigensolver (VQE) for optimization
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-purple-400 mr-3"></div>
                  Quantum Feature Enhancement with ZZFeatureMap
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-purple-400 mr-3"></div>
                  Quantum-Classical hybrid optimization with SPSA
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-purple-400 mr-3"></div>
                  Quantum amplitude encoding for market data
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Risk Metrics</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mr-3"></div>
                  Value at Risk (VaR) and Conditional VaR (CVaR)
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mr-3"></div>
                  Maximum Drawdown and Volatility Analysis
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mr-3"></div>
                  Sharpe and Sortino Ratio Optimization
                </li>
                <li className="flex items-center">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mr-3"></div>
                  Portfolio Correlation and Diversification Metrics
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-center text-gray-400 text-sm">
              <span className="font-medium text-purple-400">AILYDIAN Quantum-ML</span> - 
              Powered by IBM Qiskit and advanced machine learning algorithms. 
              Classical fallback ensures reliable optimization even without quantum hardware.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
