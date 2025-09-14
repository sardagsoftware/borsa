'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  PauseIcon, 
  CogIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface BotConfig {
  symbols: string[];
  timeframe: string;
  riskLevel: 'low' | 'medium' | 'high';
  maxPosition: number;
  stopLoss: number;
  takeProfit: number;
}

interface BotStatus {
  status: 'stopped' | 'active' | 'error';
  uptime?: string;
  performance?: {
    totalTrades: number;
    successRate: string;
    currentPnL: string;
    lastSignal: string;
  };
  activePositions?: Array<{
    symbol: string;
    side: 'long' | 'short';
    size: number;
    pnl: string;
  }>;
}

export default function TradingBotPanel() {
  const [botStatus, setBotStatus] = useState<BotStatus>({ status: 'stopped' });
  const [config, setConfig] = useState<BotConfig>({
    symbols: ['BTC', 'ETH'],
    timeframe: '1h',
    riskLevel: 'medium',
    maxPosition: 0.1,
    stopLoss: 2,
    takeProfit: 5
  });
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const fetchBotStatus = async () => {
    try {
      const response = await fetch('/api/ai/groq/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'status' }),
      });

      const data = await response.json();
      if (data.success) {
        setBotStatus(data.result);
      }
    } catch (error) {
      console.error('Failed to fetch bot status:', error);
    }
  };

  const startBot = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/groq/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'start',
          config 
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBotStatus({ status: 'active', ...data.result });
      }
    } catch (error) {
      console.error('Failed to start bot:', error);
      setBotStatus({ status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const stopBot = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/groq/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stop' }),
      });

      const data = await response.json();
      if (data.success) {
        setBotStatus({ status: 'stopped' });
      }
    } catch (error) {
      console.error('Failed to stop bot:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/groq/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'configure',
          config 
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowConfig(false);
      }
    } catch (error) {
      console.error('Failed to update config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 30000); // Her 30 saniyede güncelle
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (botStatus.status) {
      case 'active':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (botStatus.status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <PauseIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 border border-gray-700 rounded-xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
            <BoltIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Smart Trading Bot</h3>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {botStatus.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
          >
            <CogIcon className="w-5 h-5" />
          </button>
          
          {botStatus.status === 'active' ? (
            <button
              onClick={stopBot}
              disabled={loading}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PauseIcon className="w-4 h-4" />
              Durdur
            </button>
          ) : (
            <button
              onClick={startBot}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PlayIcon className="w-4 h-4" />
              Başlat
            </button>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-800 border border-gray-600 rounded-lg"
          >
            <h4 className="text-lg font-semibold text-white mb-4">Bot Konfigürasyonu</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Trading Çiftleri</label>
                <input
                  type="text"
                  value={config.symbols.join(', ')}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    symbols: e.target.value.split(',').map(s => s.trim())
                  }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="BTC, ETH, SOL"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Zaman Aralığı</label>
                <select
                  value={config.timeframe}
                  onChange={(e) => setConfig(prev => ({ ...prev, timeframe: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="5m">5 Dakika</option>
                  <option value="15m">15 Dakika</option>
                  <option value="1h">1 Saat</option>
                  <option value="4h">4 Saat</option>
                  <option value="1d">1 Gün</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Risk Seviyesi</label>
                <select
                  value={config.riskLevel}
                  onChange={(e) => setConfig(prev => ({ ...prev, riskLevel: e.target.value as 'low' | 'medium' | 'high' }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Max Pozisyon (%)</label>
                <input
                  type="number"
                  value={config.maxPosition * 100}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxPosition: Number(e.target.value) / 100 }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  min="1"
                  max="50"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button
                onClick={updateConfig}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Kaydet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bot Performance */}
      {botStatus.status === 'active' && botStatus.performance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-center">
            <ChartBarIcon className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Toplam İşlem</p>
            <p className="text-lg font-bold text-white">{botStatus.performance.totalTrades}</p>
          </div>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-center">
            <CheckCircleIcon className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Başarı Oranı</p>
            <p className="text-lg font-bold text-white">{botStatus.performance.successRate}</p>
          </div>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-center">
            <CurrencyDollarIcon className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Güncel P&L</p>
            <p className={`text-lg font-bold ${
              botStatus.performance.currentPnL.startsWith('+') ? 'text-green-400' : 'text-red-400'
            }`}>
              {botStatus.performance.currentPnL}
            </p>
          </div>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-center">
            <ClockIcon className="w-6 h-6 text-purple-400 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Çalışma Süresi</p>
            <p className="text-lg font-bold text-white">{botStatus.uptime}</p>
          </div>
        </div>
      )}

      {/* Active Positions */}
      {botStatus.activePositions && botStatus.activePositions.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Aktif Pozisyonlar</h4>
          <div className="space-y-2">
            {botStatus.activePositions.map((position, index) => (
              <div key={index} className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{position.symbol}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      position.side === 'long' 
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : 'bg-red-600/20 text-red-400 border border-red-600/30'
                    }`}>
                      {position.side.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Miktar: {position.size}</p>
                    <p className={`text-sm font-bold ${
                      position.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {position.pnl}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bot Stopped State */}
      {botStatus.status === 'stopped' && (
        <div className="text-center py-8">
          <PauseIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">Trading Bot Durdu</h4>
          <p className="text-gray-400 mb-4">
            Bot şu anda aktif değil. Başlatmak için yukarıdaki &quot;Başlat&quot; butonuna tıklayın.
          </p>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-yellow-300">
            Trading bot yüksek risk içerir. Sadece kaybetmeyi göze alabileceğiniz fonlarla kullanın.
          </span>
        </div>
      </div>
    </motion.div>
  );
}
