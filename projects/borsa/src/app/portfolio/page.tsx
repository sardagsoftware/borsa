'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useRealTimeData } from '@/hooks/useRealtimeData';

interface PortfolioItem {
  symbol: string;
  type: 'stock' | 'crypto';
  quantity: number;
  averagePrice: number;
  purchaseDate: string;
}

interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  percentageChange: number;
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'stock' | 'crypto'>('stock');
  const { stocks, cryptos } = useRealTimeData();

  // Form states
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  // Load portfolio from localStorage
  useEffect(() => {
    const savedPortfolio = localStorage.getItem('portfolio');
    if (savedPortfolio) {
      try {
        setPortfolio(JSON.parse(savedPortfolio));
      } catch (e) {
        console.error('Failed to parse portfolio data:', e);
      }
    }
  }, []);

  // Save portfolio to localStorage
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  const addToPortfolio = () => {
    if (!symbol || !quantity || !price) return;

    const newItem: PortfolioItem = {
      symbol: symbol.toUpperCase(),
      type: selectedType,
      quantity: parseFloat(quantity),
      averagePrice: parseFloat(price),
      purchaseDate: new Date().toISOString().split('T')[0]
    };

    setPortfolio(prev => [...prev, newItem]);
    setSymbol('');
    setQuantity('');
    setPrice('');
    setShowAddModal(false);
  };

  const removeFromPortfolio = (index: number) => {
    setPortfolio(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentPrice = (symbol: string, type: 'stock' | 'crypto') => {
    if (type === 'stock') {
      const stock = stocks.find(s => s.symbol === symbol);
      return stock?.price || 0;
    } else {
      const crypto = cryptos.find(c => c.symbol === symbol.toLowerCase());
      return crypto?.price || 0;
    }
  };

  const calculatePortfolioStats = (): PortfolioStats => {
    let totalValue = 0;
    let totalCost = 0;

    portfolio.forEach(item => {
      const currentPrice = getCurrentPrice(item.symbol, item.type);
      const cost = item.quantity * item.averagePrice;
      const value = item.quantity * currentPrice;
      
      totalCost += cost;
      totalValue += value;
    });

    const totalGainLoss = totalValue - totalCost;
    const percentageChange = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      percentageChange
    };
  };

  const stats = calculatePortfolioStats();

  return (
    <div className="min-h-screen bg-bg-0 p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ac-1 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-ac-2 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-tx-1 mb-2 neon-text">
              Portfolio
            </h1>
            <p className="text-tx-1/70">Track your investments and performance</p>
          </div>
          
          <Button 
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Position
          </Button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl p-6">
            <h3 className="text-sm text-tx-1/70 mb-2">Total Value</h3>
            <p className="text-2xl font-bold text-tx-1">
              ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl p-6">
            <h3 className="text-sm text-tx-1/70 mb-2">Total Cost</h3>
            <p className="text-2xl font-bold text-tx-1">
              ${stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl p-6">
            <h3 className="text-sm text-tx-1/70 mb-2">Total P&L</h3>
            <div className={`flex items-center ${stats.totalGainLoss >= 0 ? 'text-green-400' : 'text-ac-1'}`}>
              {stats.totalGainLoss >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
              <p className="text-2xl font-bold">
                ${Math.abs(stats.totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl p-6">
            <h3 className="text-sm text-tx-1/70 mb-2">Total Return</h3>
            <div className={`flex items-center ${stats.percentageChange >= 0 ? 'text-green-400' : 'text-ac-1'}`}>
              {stats.percentageChange >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
              <p className="text-2xl font-bold">
                {Math.abs(stats.percentageChange).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Items */}
        <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-tx-1/10">
            <h2 className="text-xl font-semibold text-tx-1">Your Positions</h2>
          </div>

          {portfolio.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-tx-1/50 mb-4">No positions in your portfolio yet</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Position
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-tx-1/10">
                    <th className="px-6 py-4 text-left text-sm text-tx-1/70 uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-4 text-left text-sm text-tx-1/70 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-sm text-tx-1/70 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-4 text-left text-sm text-tx-1/70 uppercase tracking-wider">Avg Price</th>
                    <th className="px-6 py-4 text-left text-sm text-tx-1/70 uppercase tracking-wider">Current Price</th>
                    <th className="px-6 py-4 text-left text-sm text-tx-1/70 uppercase tracking-wider">Market Value</th>
                    <th className="px-6 py-4 text-left text-sm text-tx-1/70 uppercase tracking-wider">P&L</th>
                    <th className="px-6 py-4 text-left text-sm text-tx-1/70 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((item, index) => {
                    const currentPrice = getCurrentPrice(item.symbol, item.type);
                    const marketValue = item.quantity * currentPrice;
                    const cost = item.quantity * item.averagePrice;
                    const pnl = marketValue - cost;
                    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

                    return (
                      <tr key={index} className="border-b border-tx-1/5 hover:bg-tx-1/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-tx-1 font-medium">{item.symbol}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.type === 'stock' ? 'bg-blue-500/20 text-blue-300' : 'bg-orange-500/20 text-orange-300'
                          }`}>
                            {item.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-tx-1">{item.quantity.toLocaleString()}</td>
                        <td className="px-6 py-4 text-tx-1">
                          ${item.averagePrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-tx-1">
                          ${currentPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-tx-1">
                          ${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center ${pnl >= 0 ? 'text-green-400' : 'text-ac-1'}`}>
                            {pnl >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                            <div>
                              <div className="font-medium">
                                ${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs">
                                {Math.abs(pnlPercent).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeFromPortfolio(index)}
                          >
                            <Minus className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Position Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSymbol('');
          setQuantity('');
          setPrice('');
        }}
        title="Add New Position"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-tx-1/70 mb-2">
              Asset Type
            </label>
            <div className="flex space-x-2">
              <Button
                variant={selectedType === 'stock' ? 'primary' : 'ghost'}
                onClick={() => setSelectedType('stock')}
              >
                Stock
              </Button>
              <Button
                variant={selectedType === 'crypto' ? 'primary' : 'ghost'}
                onClick={() => setSelectedType('crypto')}
              >
                Crypto
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-tx-1/70 mb-2">
              Symbol
            </label>
            <Input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder={selectedType === 'stock' ? "e.g., AAPL" : "e.g., BTC"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-tx-1/70 mb-2">
              Quantity
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              step="0.0001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-tx-1/70 mb-2">
              Average Purchase Price
            </label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter average price"
              step="0.01"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button onClick={addToPortfolio} className="flex-1">
              Add Position
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowAddModal(false);
                setSymbol('');
                setQuantity('');
                setPrice('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}