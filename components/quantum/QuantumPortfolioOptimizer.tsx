/**
 * AILYDIAN GLOBAL TRADER - Quantum Portfolio Optimizer
 * Quantum-enhanced portfolio optimization interface
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Zap, 
  TrendingUp, 
  Target, 
  Brain, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Settings,
  Atom
} from 'lucide-react';

interface Asset {
  symbol: string;
  name: string;
  prices: number[];
  timestamp: string[];
  selected: boolean;
}

interface OptimizationResult {
  weights: number[];
  assets: string[];
  metrics: {
    expected_return: number;
    volatility: number;
    sharpe_ratio: number;
    var_95: number;
    cvar_95: number;
    max_drawdown: number;
  };
  optimization_method: string;
  quantum_enhanced: boolean;
}

interface QuantumStatus {
  quantum_available: boolean;
  backend: string;
  supported_algorithms: string[];
}

export default function QuantumPortfolioOptimizer() {
  const [assets, setAssets] = useState<Asset[]>([
    { symbol: 'AAPL', name: 'Apple Inc.', prices: [], timestamp: [], selected: true },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', prices: [], timestamp: [], selected: true },
    { symbol: 'MSFT', name: 'Microsoft Corp.', prices: [], timestamp: [], selected: true },
    { symbol: 'TSLA', name: 'Tesla Inc.', prices: [], timestamp: [], selected: false },
    { symbol: 'BTC/USD', name: 'Bitcoin', prices: [], timestamp: [], selected: false },
    { symbol: 'ETH/USD', name: 'Ethereum', prices: [], timestamp: [], selected: false },
  ]);

  const [optimizationSettings, setOptimizationSettings] = useState({
    objective: 'sharpe' as 'sharpe' | 'risk' | 'return' | 'sortino',
    riskTolerance: 0.5,
    quantumEnhanced: true
  });

  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [quantumStatus, setQuantumStatus] = useState<QuantumStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load quantum status
  useEffect(() => {
    loadQuantumStatus();
  }, []);

  // Generate mock price data for demonstration
  const generateMockPrices = useCallback((symbol: string, days: number = 365): { prices: number[], timestamp: string[] } => {
    const prices = [];
    const timestamp = [];
    let basePrice = 100;
    
    // Different base prices for different assets
    if (symbol === 'AAPL') basePrice = 150;
    else if (symbol === 'GOOGL') basePrice = 2500;
    else if (symbol === 'MSFT') basePrice = 300;
    else if (symbol === 'TSLA') basePrice = 200;
    else if (symbol === 'BTC/USD') basePrice = 45000;
    else if (symbol === 'ETH/USD') basePrice = 2500;

    for (let i = 0; i < days; i++) {
      // Random walk with drift
      const drift = 0.001; // Small positive drift
      const volatility = symbol.includes('/') ? 0.05 : 0.02; // Higher volatility for crypto
      const change = drift + volatility * (Math.random() - 0.5);
      
      basePrice *= (1 + change);
      prices.push(basePrice);
      
      const date = new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000);
      timestamp.push(date.toISOString());
    }
    
    return { prices, timestamp };
  }, []);

  // Load asset data
  const loadAssetData = useCallback(async () => {
    setIsLoadingData(true);
    setError(null);

    try {
      // Generate mock data for selected assets
      const updatedAssets = assets.map(asset => {
        if (asset.selected) {
          const { prices, timestamp } = generateMockPrices(asset.symbol);
          return { ...asset, prices, timestamp };
        }
        return asset;
      });

      setAssets(updatedAssets);
    } catch (error) {
      console.error('Failed to load asset data:', error);
      setError('Failed to load asset data');
    } finally {
      setIsLoadingData(false);
    }
  }, [assets, generateMockPrices]);

  // Load quantum status
  const loadQuantumStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/quantum-ml/quantum/status');
      const data = await response.json();
      
      if (data.success) {
        setQuantumStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to load quantum status:', error);
    }
  }, []);

  // Optimize portfolio
  const optimizePortfolio = useCallback(async () => {
    const selectedAssets = assets.filter(asset => asset.selected && asset.prices.length > 0);
    
    if (selectedAssets.length < 2) {
      setError('Please select at least 2 assets with data');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestData = {
        assets: selectedAssets.map(asset => ({
          symbol: asset.symbol,
          prices: asset.prices,
          timestamp: asset.timestamp
        })),
        objective: optimizationSettings.objective,
        riskTolerance: optimizationSettings.riskTolerance,
        quantumEnhanced: optimizationSettings.quantumEnhanced
      };

      const response = await fetch('/api/quantum-ml/portfolio/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        setOptimizationResult(data.data);
      } else {
        throw new Error(data.message || 'Optimization failed');
      }
    } catch (error) {
      console.error('Portfolio optimization failed:', error);
      setError(error.message || 'Portfolio optimization failed');
    } finally {
      setIsLoading(false);
    }
  }, [assets, optimizationSettings]);

  // Toggle asset selection
  const toggleAssetSelection = useCallback((index: number) => {
    setAssets(prev => prev.map((asset, i) => 
      i === index ? { ...asset, selected: !asset.selected } : asset
    ));
  }, []);

  // Format percentage
  const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-black/90 border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Atom className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Quantum Portfolio Optimizer</h2>
              <p className="text-gray-400">AILYDIAN Ultra Pro - Quantum-enhanced portfolio optimization</p>
            </div>
          </div>
          
          {quantumStatus && (
            <div className="flex items-center space-x-2">
              {quantumStatus.quantum_available ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">Quantum Ready</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-yellow-400 text-sm font-medium">Classical Mode</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Selection */}
        <Card className="bg-black/90 border-gray-800 p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            Select Assets
          </h3>
          
          <div className="space-y-2">
            {assets.map((asset, index) => (
              <div
                key={asset.symbol}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 cursor-pointer"
                onClick={() => toggleAssetSelection(index)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={asset.selected}
                    onChange={() => toggleAssetSelection(index)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                  />
                  <div>
                    <p className="text-white font-medium">{asset.symbol}</p>
                    <p className="text-xs text-gray-400">{asset.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  {asset.prices.length > 0 ? (
                    <div>
                      <p className="text-green-400 text-sm">✓ Data Ready</p>
                      <p className="text-xs text-gray-400">{asset.prices.length} points</p>
                    </div>
                  ) : asset.selected ? (
                    <p className="text-yellow-400 text-sm">Loading...</p>
                  ) : (
                    <p className="text-gray-500 text-sm">No data</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={loadAssetData}
            disabled={isLoadingData || assets.filter(a => a.selected).length === 0}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
          >
            {isLoadingData ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Data...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Load Asset Data
              </>
            )}
          </Button>
        </Card>

        {/* Optimization Settings */}
        <Card className="bg-black/90 border-gray-800 p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-purple-400" />
            Optimization Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Objective Function
              </label>
              <select
                value={optimizationSettings.objective}
                onChange={(e) => setOptimizationSettings(prev => ({
                  ...prev,
                  objective: e.target.value as any
                }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
              >
                <option value="sharpe">Maximize Sharpe Ratio</option>
                <option value="return">Maximize Return</option>
                <option value="risk">Minimize Risk</option>
                <option value="sortino">Maximize Sortino Ratio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Risk Tolerance: {optimizationSettings.riskTolerance.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={optimizationSettings.riskTolerance}
                onChange={(e) => setOptimizationSettings(prev => ({
                  ...prev,
                  riskTolerance: parseFloat(e.target.value)
                }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="quantumEnhanced"
                checked={optimizationSettings.quantumEnhanced}
                onChange={(e) => setOptimizationSettings(prev => ({
                  ...prev,
                  quantumEnhanced: e.target.checked
                }))}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded mr-2"
              />
              <label htmlFor="quantumEnhanced" className="text-white text-sm font-medium">
                Enable Quantum Enhancement
              </label>
            </div>
          </div>

          <Button
            onClick={optimizePortfolio}
            disabled={isLoading || assets.filter(a => a.selected && a.prices.length > 0).length < 2}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Optimize Portfolio
              </>
            )}
          </Button>

          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-400 mr-2" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </Card>

        {/* Results */}
        <Card className="bg-black/90 border-gray-800 p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-400" />
            Optimization Results
          </h3>

          {optimizationResult ? (
            <div className="space-y-4">
              {/* Method Info */}
              <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Method:</span>
                  <span className="text-white text-sm font-medium">
                    {optimizationResult.optimization_method}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Quantum Enhanced:</span>
                  <span className={`text-sm font-medium ${
                    optimizationResult.quantum_enhanced ? 'text-purple-400' : 'text-gray-400'
                  }`}>
                    {optimizationResult.quantum_enhanced ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Portfolio Metrics */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Expected Return:</span>
                  <span className="text-green-400 font-medium">
                    {formatPercent(optimizationResult.metrics.expected_return)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volatility:</span>
                  <span className="text-orange-400 font-medium">
                    {formatPercent(optimizationResult.metrics.volatility)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sharpe Ratio:</span>
                  <span className="text-blue-400 font-medium">
                    {optimizationResult.metrics.sharpe_ratio.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">VaR (95%):</span>
                  <span className="text-red-400 font-medium">
                    {formatPercent(Math.abs(optimizationResult.metrics.var_95))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Drawdown:</span>
                  <span className="text-red-400 font-medium">
                    {formatPercent(Math.abs(optimizationResult.metrics.max_drawdown))}
                  </span>
                </div>
              </div>

              {/* Asset Allocation */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Asset Allocation</h4>
                <div className="space-y-2">
                  {optimizationResult.assets.map((symbol, index) => {
                    const weight = optimizationResult.weights[index];
                    return (
                      <div key={symbol} className="flex items-center justify-between">
                        <span className="text-white text-sm">{symbol}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${weight * 100}%` }}
                            />
                          </div>
                          <span className="text-white text-sm font-medium w-12 text-right">
                            {formatPercent(weight)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-700 flex items-center text-green-400 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Portfolio optimization completed successfully</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <PieChart className="w-12 h-12 mb-4" />
              <p className="text-center">
                Configure settings and click "Optimize Portfolio" to see results
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
