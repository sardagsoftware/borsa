'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  RefreshCw,
  Lock,
  Unlock,
  Activity,
  TrendingUp
} from 'lucide-react';

// Exchange configuration types
interface ExchangeConfig {
  id: string;
  name: string;
  logo: string;
  color: string;
  features: string[];
  status: 'active' | 'maintenance' | 'disabled';
  testnetSupported: boolean;
}

interface ApiCredentials {
  exchangeId: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string; // For OKX, KuCoin
  testnet: boolean;
  enabled: boolean;
  permissions: string[];
}

const SUPPORTED_EXCHANGES: ExchangeConfig[] = [
  {
    id: 'binance',
    name: 'Binance',
    logo: '🟡',
    color: '#F0B90B',
    features: ['Spot', 'Futures', 'Options'],
    status: 'active',
    testnetSupported: true
  },
  {
    id: 'coinbase',
    name: 'Coinbase Pro',
    logo: '🔵',
    color: '#0052FF',
    features: ['Spot', 'Pro API'],
    status: 'active',
    testnetSupported: true
  },
  {
    id: 'kraken',
    name: 'Kraken',
    logo: '🟠',
    color: '#5741D9',
    features: ['Spot', 'Margin', 'Futures'],
    status: 'active',
    testnetSupported: false
  },
  {
    id: 'kucoin',
    name: 'KuCoin',
    logo: '🟢',
    color: '#24AE8F',
    features: ['Spot', 'Futures', 'Margin'],
    status: 'active',
    testnetSupported: true
  },
  {
    id: 'okx',
    name: 'OKX',
    logo: '⚪',
    color: '#1890FF',
    features: ['Spot', 'Futures', 'Options'],
    status: 'active',
    testnetSupported: true
  },
  {
    id: 'bybit',
    name: 'Bybit',
    logo: '🟣',
    color: '#FFA500',
    features: ['Derivatives', 'Spot', 'Copy Trading'],
    status: 'active',
    testnetSupported: true
  }
];

export default function ExchangeApiSettings() {
  const [credentials, setCredentials] = useState<ApiCredentials[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ApiCredentials>>({});
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{ [key: string]: 'success' | 'error' | 'testing' }>({});

  // Load saved credentials
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await fetch('/api/settings/exchange-credentials');
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const saveCredentials = async (creds: ApiCredentials) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/exchange-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });

      if (response.ok) {
        await loadCredentials();
        setSelectedExchange(null);
        setFormData({});
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (exchangeId: string) => {
    setTestResults(prev => ({ ...prev, [exchangeId]: 'testing' }));
    
    try {
      const response = await fetch(`/api/exchanges/${exchangeId}/test`, {
        method: 'POST'
      });

      const result = response.ok ? 'success' : 'error';
      setTestResults(prev => ({ ...prev, [exchangeId]: result }));
      
      // Clear test result after 5 seconds
      setTimeout(() => {
        setTestResults(prev => {
          const newResults = { ...prev };
          delete newResults[exchangeId];
          return newResults;
        });
      }, 5000);
    } catch (error) {
      setTestResults(prev => ({ ...prev, [exchangeId]: 'error' }));
    }
  };

  const deleteCredentials = async (exchangeId: string) => {
    try {
      await fetch(`/api/settings/exchange-credentials/${exchangeId}`, {
        method: 'DELETE'
      });
      await loadCredentials();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const getCredentialForExchange = (exchangeId: string) => {
    return credentials.find(cred => cred.exchangeId === exchangeId);
  };

  const renderExchangeCard = (exchange: ExchangeConfig) => {
    const cred = getCredentialForExchange(exchange.id);
    const testResult = testResults[exchange.id];

    return (
      <motion.div
        key={exchange.id}
        layout
        className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Exchange Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{exchange.logo}</span>
            <div>
              <h3 className="text-white font-semibold">{exchange.name}</h3>
              <p className="text-gray-400 text-sm">{exchange.features.join(', ')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {exchange.status === 'active' && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            <span 
              className={`text-xs px-2 py-1 rounded-full ${
                exchange.status === 'active' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {exchange.status}
            </span>
          </div>
        </div>

        {/* Connection Status */}
        {cred && (
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-900/50 rounded-lg">
            <div className="flex items-center space-x-2">
              {cred.enabled ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm text-gray-300">
                {cred.enabled ? 'Connected' : 'Disabled'}
                {cred.testnet && ' (Testnet)'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => testConnection(exchange.id)}
                disabled={testResult === 'testing'}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm disabled:opacity-50"
              >
                {testResult === 'testing' ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : testResult === 'success' ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : testResult === 'error' ? (
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                ) : (
                  <Activity className="w-3 h-3" />
                )}
                <span>Test</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedExchange(exchange.id);
              if (cred) {
                setFormData({
                  exchangeId: cred.exchangeId,
                  apiKey: cred.apiKey,
                  apiSecret: cred.apiSecret,
                  passphrase: cred.passphrase,
                  testnet: cred.testnet,
                  enabled: cred.enabled,
                  permissions: cred.permissions
                });
              } else {
                setFormData({
                  exchangeId: exchange.id,
                  testnet: true,
                  enabled: false,
                  permissions: []
                });
              }
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>{cred ? 'Configure' : 'Add API'}</span>
          </button>
          
          {cred && (
            <button
              onClick={() => deleteCredentials(exchange.id)}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  const renderConfigurationModal = () => {
    if (!selectedExchange) return null;

    const exchange = SUPPORTED_EXCHANGES.find(ex => ex.id === selectedExchange);
    if (!exchange) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedExchange(null);
            setFormData({});
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{exchange.logo}</span>
              <h2 className="text-xl font-semibold text-white">{exchange.name} API</h2>
            </div>
            <button
              onClick={() => {
                setSelectedExchange(null);
                setFormData({});
              }}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Security Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="text-yellow-500 font-medium">Security Notice</h4>
                <p className="text-yellow-300 text-sm mt-1">
                  API credentials are encrypted and stored securely. Only enable necessary permissions.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showSecrets.apiKey ? 'text' : 'password'}
                  value={formData.apiKey || ''}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white pr-10"
                  placeholder="Enter your API key"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(prev => ({ ...prev, apiKey: !prev.apiKey }))}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                >
                  {showSecrets.apiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* API Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Secret
              </label>
              <div className="relative">
                <input
                  type={showSecrets.apiSecret ? 'text' : 'password'}
                  value={formData.apiSecret || ''}
                  onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white pr-10"
                  placeholder="Enter your API secret"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(prev => ({ ...prev, apiSecret: !prev.apiSecret }))}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                >
                  {showSecrets.apiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Passphrase (for OKX, KuCoin) */}
            {(exchange.id === 'okx' || exchange.id === 'kucoin') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Passphrase
                </label>
                <div className="relative">
                  <input
                    type={showSecrets.passphrase ? 'text' : 'password'}
                    value={formData.passphrase || ''}
                    onChange={(e) => setFormData({ ...formData, passphrase: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white pr-10"
                    placeholder="Enter your passphrase"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets(prev => ({ ...prev, passphrase: !prev.passphrase }))}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showSecrets.passphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="space-y-3 pt-4 border-t border-gray-700">
              {/* Testnet Toggle */}
              {exchange.testnetSupported && (
                <label className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">Use Testnet</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.testnet || false}
                    onChange={(e) => setFormData({ ...formData, testnet: e.target.checked })}
                    className="rounded bg-gray-800 border-gray-600"
                  />
                </label>
              )}

              {/* Enable Toggle */}
              <label className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {formData.enabled ? (
                    <Unlock className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-gray-300">Enable Trading</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enabled || false}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="rounded bg-gray-800 border-gray-600"
                />
              </label>
            </div>

            {/* Save Button */}
            <button
              onClick={() => saveCredentials(formData as ApiCredentials)}
              disabled={isLoading || !formData.apiKey || !formData.apiSecret}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Exchange API Settings</h1>
        <p className="text-gray-400">
          Configure your exchange API credentials to enable live trading and real-time data feeds.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-gray-400 text-sm">Connected</p>
              <p className="text-white font-semibold">
                {credentials.filter(c => c.enabled).length} / {SUPPORTED_EXCHANGES.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-gray-400 text-sm">Testnet Mode</p>
              <p className="text-white font-semibold">
                {credentials.filter(c => c.testnet).length} Active
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-gray-400 text-sm">Security</p>
              <p className="text-white font-semibold">AES-256 Encrypted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SUPPORTED_EXCHANGES.map(renderExchangeCard)}
      </div>

      {/* Configuration Modal */}
      <AnimatePresence>
        {renderConfigurationModal()}
      </AnimatePresence>
    </div>
  );
}
