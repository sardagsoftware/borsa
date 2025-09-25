'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Settings, 
  Shield, 
  Activity,
  DollarSign,
  BarChart3,
  Target,
  Zap,
  Globe,
  Coins,
  Building2,
  Wheat,
  Banknote,
  ArrowUpDown,
  Lock,
  Unlock,
  Plus
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { GlobalExchangeRegistry, ExchangeType, Region } from '@/lib/exchanges/GlobalExchangeConfig';
import GlobalAITradingBot from '@/lib/ai/GlobalAITradingBot';

interface TradingBotStatus {
  running: boolean;
  paused: boolean;
  emergencyStop: boolean;
  activePositions: number;
  performance: {
    totalTrades: number;
    winRate: number;
    totalReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    aiAccuracy: number;
  };
  riskMetrics: {
    currentDrawdown: number;
    dailyPnL: number;
    portfolioValue: number;
    riskScore: number;
  };
}

interface TradeSignal {
  id: string;
  symbol: string;
  action: string;
  confidence: number;
  price: number;
  reasoning: string[];
  timestamp: Date;
}

interface Position {
  symbol: string;
  side: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export default function TradingAdminPage() {
  const [botStatus, setBotStatus] = useState<TradingBotStatus>({
    running: false,
    paused: false,
    emergencyStop: false,
    activePositions: 0,
    performance: {
      totalTrades: 0,
      winRate: 0,
      totalReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      aiAccuracy: 0
    },
    riskMetrics: {
      currentDrawdown: 0,
      dailyPnL: 0,
      portfolioValue: 100000,
      riskScore: 0
    }
  });

  const [recentSignals, setRecentSignals] = useState<TradeSignal[]>([]);
  const [activePositions, setActivePositions] = useState<Position[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Global Exchange States
  const [connectedExchanges, setConnectedExchanges] = useState<any[]>([]);
  const [availableExchanges, setAvailableExchanges] = useState<any[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<any>(null);
  const [exchangeCredentials, setExchangeCredentials] = useState<any>({});
  const [globalAIBot, setGlobalAIBot] = useState<GlobalAITradingBot | null>(null);

  // Configuration states
  const [config, setConfig] = useState({
    enabled: false,
    mode: 'paper', // 'paper' | 'live'
    maxRiskPerTrade: 2,
    maxDailyLoss: 5,
    maxDrawdown: 15,
    aiConfidenceThreshold: 0.7,
    maxConcurrentTrades: 10
  });

  // Initialize Global AI Bot
  useEffect(() => {
    const initializeBot = async () => {
      try {
        GlobalExchangeRegistry.initialize();
        const allExchanges = GlobalExchangeRegistry.getAllExchanges();
        setAvailableExchanges(allExchanges);
        
        const bot = new GlobalAITradingBot();
        setGlobalAIBot(bot);
        
        // Setup bot event listeners
        bot.on('botStarted', () => {
          setLogs(prev => [`${new Date().toLocaleTimeString()} - 🤖 Global AI Bot başlatıldı`, ...prev]);
        });
        
        bot.on('exchangeConnected', (exchangeId: string) => {
          setLogs(prev => [`${new Date().toLocaleTimeString()} - 🔗 ${exchangeId} borsası bağlandı`, ...prev]);
          setConnectedExchanges(prev => {
            const exchange = GlobalExchangeRegistry.getExchange(exchangeId);
            if (exchange && !prev.some(e => e.id === exchangeId)) {
              return [...prev, exchange];
            }
            return prev;
          });
        });
        
        bot.on('newSignal', (signal: any) => {
          setRecentSignals(prev => [{
            id: signal.id,
            symbol: signal.symbol,
            action: signal.action,
            confidence: signal.confidence,
            price: signal.price,
            reasoning: signal.reasoning,
            timestamp: new Date(signal.timestamp)
          }, ...prev.slice(0, 9)]);
        });
        
        bot.on('arbitrageOpportunity', (opportunity: any) => {
          setLogs(prev => [`${new Date().toLocaleTimeString()} - 🎯 Arbitraj fırsatı: ${opportunity.symbol}`, ...prev]);
        });
        
      } catch (error) {
        console.error('❌ Global AI Bot initialization error:', error);
      }
    };
    
    initializeBot();
  }, []);

  // Simulated real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      updateBotStatus();
      updateRecentSignals();
      updateActivePositions();
      updateLogs();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const updateBotStatus = useCallback(() => {
    setBotStatus(prev => ({
      ...prev,
      performance: {
        ...prev.performance,
        totalTrades: prev.performance.totalTrades + (Math.random() > 0.8 ? 1 : 0),
        winRate: 65 + Math.random() * 20,
        totalReturn: prev.performance.totalReturn + (Math.random() - 0.5) * 0.1,
        aiAccuracy: 72 + Math.random() * 8
      },
      riskMetrics: {
        ...prev.riskMetrics,
        dailyPnL: prev.riskMetrics.dailyPnL + (Math.random() - 0.5) * 100,
        currentDrawdown: Math.max(0, Math.random() * 8),
        riskScore: Math.floor(Math.random() * 10)
      }
    }));
  }, []);

  const updateRecentSignals = useCallback(() => {
    if (Math.random() > 0.7) {
      const symbols = ['BTC/USDT', 'ETH/USDT', 'AAPL', 'TSLA', 'MSFT'];
      const actions = ['BUY', 'SELL'];
      const newSignal: TradeSignal = {
        id: Math.random().toString(36),
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        confidence: 0.6 + Math.random() * 0.3,
        price: 100 + Math.random() * 1000,
        reasoning: [
          'Strong AI signal detected',
          'Technical indicators align',
          'Market volatility favorable'
        ],
        timestamp: new Date()
      };

      setRecentSignals(prev => [newSignal, ...prev.slice(0, 9)]);
    }
  }, []);

  const updateActivePositions = useCallback(() => {
    const positions = [
      { symbol: 'BTC/USDT', side: 'LONG', size: 0.5, entryPrice: 43000 },
      { symbol: 'AAPL', side: 'LONG', size: 100, entryPrice: 175 },
      { symbol: 'TSLA', side: 'SHORT', size: 50, entryPrice: 240 }
    ];

    setActivePositions(positions.map(pos => {
      const currentPrice = pos.entryPrice * (1 + (Math.random() - 0.5) * 0.02);
      const pnl = (currentPrice - pos.entryPrice) * pos.size * (pos.side === 'LONG' ? 1 : -1);
      const pnlPercent = (pnl / (pos.entryPrice * pos.size)) * 100;

      return {
        ...pos,
        currentPrice,
        pnl,
        pnlPercent
      };
    }));
  }, []);

  const updateLogs = useCallback(() => {
    if (Math.random() > 0.6) {
      const logMessages = [
        '✅ Market data stream connected',
        '📊 AI model prediction completed',
        '🛡️ Risk check passed',
        '💰 Order executed successfully',
        '📈 Position updated',
        '🔍 Technical analysis complete',
        '⚠️ Volatility spike detected',
        '🎯 Stop loss adjusted'
      ];

      const newLog = `${new Date().toLocaleTimeString()} - ${logMessages[Math.floor(Math.random() * logMessages.length)]}`;
      setLogs(prev => [newLog, ...prev.slice(0, 49)]);
    }
  }, []);

  const handleStartBot = async () => {
    if (!globalAIBot) return;
    
    setLogs(prev => [`${new Date().toLocaleTimeString()} - 🚀 Global AI Trading Bot başlatılıyor...`, ...prev]);
    
    try {
      await globalAIBot.start();
      setBotStatus(prev => ({ ...prev, running: true, paused: false, emergencyStop: false }));
      setLogs(prev => [`${new Date().toLocaleTimeString()} - ✅ Global AI Trading Bot başarıyla başlatıldı`, ...prev]);
    } catch (error) {
      console.error('Bot start error:', error);
      setLogs(prev => [`${new Date().toLocaleTimeString()} - ❌ Bot başlatma hatası`, ...prev]);
    }
  };

  const handlePauseBot = () => {
    if (!globalAIBot) return;
    
    globalAIBot.pause();
    setBotStatus(prev => ({ ...prev, paused: !prev.paused }));
    const action = botStatus.paused ? 'devam ediyor' : 'duraklatıldı';
    setLogs(prev => [`${new Date().toLocaleTimeString()} - ⏸️ Global AI Bot ${action}`, ...prev]);
  };

  const handleStopBot = async () => {
    if (!globalAIBot) return;
    
    try {
      await globalAIBot.stop();
      setBotStatus(prev => ({ ...prev, running: false, paused: false }));
      setLogs(prev => [`${new Date().toLocaleTimeString()} - 🛑 Global AI Bot durduruldu`, ...prev]);
    } catch (error) {
      console.error('Bot stop error:', error);
    }
  };

  const handleEmergencyStop = () => {
    if (!globalAIBot) return;
    
    if (!botStatus.emergencyStop) {
      globalAIBot.emergencyStopActivate();
      setBotStatus(prev => ({ ...prev, emergencyStop: true, running: false, paused: false }));
      setLogs(prev => [`${new Date().toLocaleTimeString()} - 🚨 ACİL DURDURMA AKTİF`, ...prev]);
    } else {
      setBotStatus(prev => ({ ...prev, emergencyStop: false }));
      setLogs(prev => [`${new Date().toLocaleTimeString()} - 🔄 Acil durdurma sıfırlandı`, ...prev]);
    }
  };

  const handleConfigSave = () => {
    setLogs(prev => [`${new Date().toLocaleTimeString()} - ⚙️ Configuration updated`, ...prev]);
    setShowConfigModal(false);
  };

  const getStatusColor = () => {
    if (botStatus.emergencyStop) return 'text-red-500';
    if (botStatus.paused) return 'text-yellow-500';
    if (botStatus.running) return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (botStatus.emergencyStop) return 'EMERGENCY STOP';
    if (botStatus.paused) return 'PAUSED';
    if (botStatus.running) return 'RUNNING';
    return 'STOPPED';
  };

  const getRiskColor = (score: number) => {
    if (score >= 7) return 'text-red-500';
    if (score >= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="min-h-screen bg-bg-0 p-6 pt-24">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ac-1 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-ac-2 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-1000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-tx-1 mb-2 neon-text">
              🤖 AI Trading Bot Control Center
            </h1>
            <p className="text-tx-1/70">Advanced autonomous trading system for borsa.ailydian.com</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`px-4 py-2 rounded-lg border ${getStatusColor()}`}>
              <span className="font-bold">{getStatusText()}</span>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-tx-1 mb-4">Bot Controls</h3>
            <div className="space-y-3">
              {!botStatus.running ? (
                <Button 
                  onClick={handleStartBot}
                  disabled={botStatus.emergencyStop}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Bot
                </Button>
              ) : (
                <Button 
                  onClick={handlePauseBot}
                  variant="ghost"
                  className="w-full"
                >
                  {botStatus.paused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                  {botStatus.paused ? 'Resume' : 'Pause'}
                </Button>
              )}
              
              <Button 
                onClick={handleStopBot}
                variant="secondary" 
                className="w-full"
                disabled={!botStatus.running && !botStatus.paused}
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Bot
              </Button>
              
              <Button 
                onClick={handleEmergencyStop}
                variant={botStatus.emergencyStop ? "secondary" : "danger"}
                className="w-full"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                {botStatus.emergencyStop ? 'Reset E-Stop' : 'Emergency Stop'}
              </Button>
            </div>
          </div>

          <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-tx-1 mb-4">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-tx-1/70">Total Trades:</span>
                <span className="text-tx-1">{botStatus.performance.totalTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tx-1/70">Win Rate:</span>
                <span className="text-green-400">{botStatus.performance.winRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tx-1/70">Total Return:</span>
                <span className={botStatus.performance.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {botStatus.performance.totalReturn.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tx-1/70">AI Accuracy:</span>
                <span className="text-blue-400">{botStatus.performance.aiAccuracy.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-tx-1 mb-4">Risk Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-tx-1/70">Portfolio Value:</span>
                <span className="text-tx-1">${botStatus.riskMetrics.portfolioValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tx-1/70">Daily P&L:</span>
                <span className={botStatus.riskMetrics.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                  ${botStatus.riskMetrics.dailyPnL.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tx-1/70">Drawdown:</span>
                <span className="text-orange-400">{botStatus.riskMetrics.currentDrawdown.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tx-1/70">Risk Score:</span>
                <span className={getRiskColor(botStatus.riskMetrics.riskScore)}>
                  {botStatus.riskMetrics.riskScore}/10
                </span>
              </div>
            </div>
          </div>

          <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-tx-1 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                onClick={() => setShowConfigModal(true)}
                variant="ghost"
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configuration
              </Button>
              
              <Button 
                onClick={() => setShowRiskModal(true)}
                variant="ghost"
                className="w-full justify-start"
              >
                <Shield className="w-4 h-4 mr-2" />
                Risk Settings
              </Button>
              
              <Button 
                variant="ghost"
                className="w-full justify-start"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Logs
              </Button>
              
              <Button 
                variant="ghost"
                className="w-full justify-start"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Performance
              </Button>
            </div>
          </div>
        </div>

        {/* Global Exchanges Section */}
        <div className="mb-8">
          <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-ac-1" />
                <h3 className="text-xl font-semibold text-tx-1">Global Borsalar</h3>
                <span className="text-sm text-tx-1/60">(🌍 {availableExchanges.length} borsa mevcut)</span>
              </div>
              <Button 
                onClick={() => setShowExchangeModal(true)}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Borsa Bağla
              </Button>
            </div>

            {/* Exchange Type Tabs */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button variant="ghost" className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Kripto ({availableExchanges.filter(e => e.type.includes('crypto')).length})
              </Button>
              <Button variant="ghost" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Hisse ({availableExchanges.filter(e => e.type.includes('stock')).length})
              </Button>
              <Button variant="ghost" className="flex items-center gap-2">
                <Wheat className="w-4 h-4" />
                Emtia ({availableExchanges.filter(e => e.type.includes('commodity')).length})
              </Button>
              <Button variant="ghost" className="flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Forex ({availableExchanges.filter(e => e.type.includes('forex')).length})
              </Button>
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Tümü ({availableExchanges.length})
              </Button>
            </div>

            {/* Connected Exchanges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedExchanges.map((exchange, idx) => (
                <div key={exchange.id} className="border border-green-500/20 bg-green-500/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {exchange.type.includes('crypto') && <Coins className="w-4 h-4 text-yellow-400" />}
                      {exchange.type.includes('stock') && <Building2 className="w-4 h-4 text-blue-400" />}
                      {exchange.type.includes('commodity') && <Wheat className="w-4 h-4 text-orange-400" />}
                      {exchange.type.includes('forex') && <Banknote className="w-4 h-4 text-green-400" />}
                      <span className="font-semibold text-tx-1">{exchange.displayName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400">Aktif</span>
                    </div>
                  </div>
                  <div className="text-sm text-tx-1/70 mb-2">{exchange.country}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-tx-1/60">{exchange.supportedAssets.slice(0, 3).join(', ')}...</span>
                    <span className="text-ac-1">AI Uyumlu</span>
                  </div>
                </div>
              ))}
              
              {/* Available but not connected exchanges */}
              {availableExchanges.filter(e => !connectedExchanges.some(c => c.id === e.id)).slice(0, 6).map((exchange, idx) => (
                <div key={exchange.id} className="border border-tx-1/10 bg-tx-1/5 rounded-lg p-4 opacity-60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {exchange.type.includes('crypto') && <Coins className="w-4 h-4 text-yellow-400" />}
                      {exchange.type.includes('stock') && <Building2 className="w-4 h-4 text-blue-400" />}
                      {exchange.type.includes('commodity') && <Wheat className="w-4 h-4 text-orange-400" />}
                      {exchange.type.includes('forex') && <Banknote className="w-4 h-4 text-green-400" />}
                      <span className="font-semibold text-tx-1">{exchange.displayName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">Bağlı Değil</span>
                    </div>
                  </div>
                  <div className="text-sm text-tx-1/70 mb-2">{exchange.country}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-tx-1/60">{exchange.supportedAssets.slice(0, 3).join(', ')}...</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setSelectedExchange(exchange);
                        setShowExchangeModal(true);
                      }}
                      className="text-ac-1 hover:bg-ac-1/20"
                    >
                      Bağla
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Exchange Statistics */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{connectedExchanges.length}</div>
                <div className="text-xs text-tx-1/70">Bağlı Borsa</div>
              </div>
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{availableExchanges.length}</div>
                <div className="text-xs text-tx-1/70">Toplam Borsa</div>
              </div>
              <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  {connectedExchanges.reduce((acc, e) => acc + e.supportedAssets.length, 0)}
                </div>
                <div className="text-xs text-tx-1/70">Desteklenen Varlık</div>
              </div>
              <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">24/7</div>
                <div className="text-xs text-tx-1/70">Kesintisiz İzleme</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent AI Signals */}
          <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-tx-1">Recent AI Signals</h3>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Activity className="w-4 h-4" />
                Live
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentSignals.map((signal) => (
                <div key={signal.id} className="border border-tx-1/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-tx-1">{signal.symbol}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        signal.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {signal.action}
                      </span>
                    </div>
                    <div className="text-sm text-tx-1/70">
                      {signal.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-tx-1">${signal.price.toFixed(2)}</span>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400">{(signal.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {signal.reasoning.map((reason, idx) => (
                      <div key={idx} className="text-xs text-tx-1/60 flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {recentSignals.length === 0 && (
                <div className="text-center py-8 text-tx-1/50">
                  No signals generated yet. Start the bot to see AI predictions.
                </div>
              )}
            </div>
          </div>

          {/* Active Positions */}
          <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-tx-1">Active Positions</h3>
              <span className="text-sm text-tx-1/70">{activePositions.length} positions</span>
            </div>
            
            <div className="space-y-4">
              {activePositions.map((position, idx) => (
                <div key={idx} className="border border-tx-1/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-tx-1">{position.symbol}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        position.side === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {position.side}
                      </span>
                    </div>
                    <div className={`text-sm ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.pnl >= 0 ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                      {position.pnlPercent.toFixed(2)}%
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-tx-1/70">Size: </span>
                      <span className="text-tx-1">{position.size}</span>
                    </div>
                    <div>
                      <span className="text-tx-1/70">Entry: </span>
                      <span className="text-tx-1">${position.entryPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-tx-1/70">Current: </span>
                      <span className="text-tx-1">${position.currentPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-tx-1/70">P&L: </span>
                      <span className={position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        ${position.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {activePositions.length === 0 && (
                <div className="text-center py-8 text-tx-1/50">
                  No active positions. The bot will open positions based on AI signals.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Logs */}
        <div className="mt-6">
          <div className="bg-bg-0/50 backdrop-blur-xl border border-tx-1/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-tx-1">System Logs</h3>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Activity className="w-4 h-4 animate-pulse" />
                Live
              </div>
            </div>
            
            <div className="bg-black/20 rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-sm">
              {logs.map((log, idx) => (
                <div key={idx} className="text-tx-1/80 mb-1">
                  {log}
                </div>
              ))}
              
              {logs.length === 0 && (
                <div className="text-tx-1/50">Waiting for system activity...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Bot Configuration"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-tx-1/70 mb-2">
              Trading Mode
            </label>
            <div className="flex space-x-2">
              <Button
                variant={config.mode === 'paper' ? 'primary' : 'ghost'}
                onClick={() => setConfig(prev => ({ ...prev, mode: 'paper' }))}
              >
                Paper Trading
              </Button>
              <Button
                variant={config.mode === 'live' ? 'primary' : 'ghost'}
                onClick={() => setConfig(prev => ({ ...prev, mode: 'live' }))}
              >
                Live Trading
              </Button>
            </div>
            {config.mode === 'live' && (
              <p className="text-sm text-yellow-400 mt-2">
                ⚠️ Live trading involves real money. Use with caution.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-tx-1/70 mb-2">
              Max Risk Per Trade (%)
            </label>
            <Input
              type="number"
              value={config.maxRiskPerTrade}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                maxRiskPerTrade: parseFloat(e.target.value) || 0 
              }))}
              min="0.1"
              max="10"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-tx-1/70 mb-2">
              Max Daily Loss (%)
            </label>
            <Input
              type="number"
              value={config.maxDailyLoss}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                maxDailyLoss: parseFloat(e.target.value) || 0 
              }))}
              min="1"
              max="20"
              step="0.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-tx-1/70 mb-2">
              AI Confidence Threshold
            </label>
            <Input
              type="number"
              value={config.aiConfidenceThreshold}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                aiConfidenceThreshold: parseFloat(e.target.value) || 0 
              }))}
              min="0.1"
              max="0.99"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-tx-1/70 mb-2">
              Max Concurrent Trades
            </label>
            <Input
              type="number"
              value={config.maxConcurrentTrades}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                maxConcurrentTrades: parseInt(e.target.value) || 1 
              }))}
              min="1"
              max="50"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleConfigSave} className="flex-1">
              Save Configuration
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowConfigModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Exchange Connection Modal */}
      <Modal
        isOpen={showExchangeModal}
        onClose={() => {
          setShowExchangeModal(false);
          setSelectedExchange(null);
          setExchangeCredentials({});
        }}
        title={selectedExchange ? `${selectedExchange.displayName} Borsası Bağla` : 'Borsa Seç'}
      >
        {!selectedExchange ? (
          <div className="space-y-4">
            <p className="text-tx-1/70">Bağlamak istediğiniz borsayı seçin:</p>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {availableExchanges.filter(e => !connectedExchanges.some(c => c.id === e.id)).map((exchange) => (
                <div 
                  key={exchange.id}
                  className="border border-tx-1/20 rounded-lg p-4 hover:bg-tx-1/5 cursor-pointer transition-colors"
                  onClick={() => setSelectedExchange(exchange)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {exchange.type.includes('crypto') && <Coins className="w-5 h-5 text-yellow-400" />}
                      {exchange.type.includes('stock') && <Building2 className="w-5 h-5 text-blue-400" />}
                      {exchange.type.includes('commodity') && <Wheat className="w-5 h-5 text-orange-400" />}
                      {exchange.type.includes('forex') && <Banknote className="w-5 h-5 text-green-400" />}
                      <div>
                        <div className="font-semibold text-tx-1">{exchange.displayName}</div>
                        <div className="text-sm text-tx-1/60">{exchange.country} • {exchange.type.join(', ')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-ac-1">AI Uyumlu</div>
                      <div className="text-xs text-tx-1/60">{exchange.supportedAssets.length} varlık</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-tx-1/5 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                {selectedExchange.type.includes('crypto') && <Coins className="w-6 h-6 text-yellow-400" />}
                {selectedExchange.type.includes('stock') && <Building2 className="w-6 h-6 text-blue-400" />}
                {selectedExchange.type.includes('commodity') && <Wheat className="w-6 h-6 text-orange-400" />}
                {selectedExchange.type.includes('forex') && <Banknote className="w-6 h-6 text-green-400" />}
                <div>
                  <div className="text-lg font-semibold text-tx-1">{selectedExchange.displayName}</div>
                  <div className="text-sm text-tx-1/60">{selectedExchange.country}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-tx-1/70">Tür:</span>
                  <span className="text-tx-1 ml-2">{selectedExchange.type.join(', ')}</span>
                </div>
                <div>
                  <span className="text-tx-1/70">Varlık Sayısı:</span>
                  <span className="text-tx-1 ml-2">{selectedExchange.supportedAssets.length}</span>
                </div>
                <div>
                  <span className="text-tx-1/70">Maker Fee:</span>
                  <span className="text-tx-1 ml-2">{(selectedExchange.fees.maker * 100).toFixed(3)}%</span>
                </div>
                <div>
                  <span className="text-tx-1/70">Taker Fee:</span>
                  <span className="text-tx-1 ml-2">{(selectedExchange.fees.taker * 100).toFixed(3)}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-tx-1 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                API Kimlik Bilgileri
              </h4>
              
              {selectedExchange.authentication.requiredFields.map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-tx-1/70 mb-2">
                    {field === 'apiKey' ? 'API Anahtarı' : 
                     field === 'secretKey' ? 'Gizli Anahtar' :
                     field === 'passphrase' ? 'Parola' : field}
                  </label>
                  <Input
                    type={field.toLowerCase().includes('secret') || field.toLowerCase().includes('pass') ? 'password' : 'text'}
                    placeholder={`${selectedExchange.displayName} ${field}`}
                    value={exchangeCredentials[field] || ''}
                    onChange={(e) => setExchangeCredentials(prev => ({
                      ...prev,
                      [field]: e.target.value
                    }))}
                  />
                </div>
              ))}
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium text-yellow-400">Güvenlik Uyarısı</span>
                </div>
                <p className="text-sm text-tx-1/70">
                  • API anahtarlarınız şifrelenerek güvenli bir şekilde saklanır<br/>
                  • Sadece gerekli izinleri veren API anahtarları kullanın<br/>
                  • Test modu ile başlamanızı öneririz<br/>
                  • IP kısıtlaması ayarlayarak güvenliği artırın
                </p>
              </div>
              
              <div className="bg-ac-1/10 border border-ac-1/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-ac-1" />
                  <span className="font-medium text-ac-1">AI Özellikleri</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {selectedExchange.aiCompatibility.realTimeData ? 
                      <Unlock className="w-3 h-3 text-green-400" /> : 
                      <Lock className="w-3 h-3 text-gray-400" />
                    }
                    <span className={selectedExchange.aiCompatibility.realTimeData ? 'text-green-400' : 'text-gray-400'}>
                      Gerçek Zamanlı Veri
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedExchange.aiCompatibility.orderExecution ? 
                      <Unlock className="w-3 h-3 text-green-400" /> : 
                      <Lock className="w-3 h-3 text-gray-400" />
                    }
                    <span className={selectedExchange.aiCompatibility.orderExecution ? 'text-green-400' : 'text-gray-400'}>
                      Otomatik Emir
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedExchange.aiCompatibility.portfolioSync ? 
                      <Unlock className="w-3 h-3 text-green-400" /> : 
                      <Lock className="w-3 h-3 text-gray-400" />
                    }
                    <span className={selectedExchange.aiCompatibility.portfolioSync ? 'text-green-400' : 'text-gray-400'}>
                      Portföy Senkronizasyonu
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedExchange.aiCompatibility.riskManagement ? 
                      <Unlock className="w-3 h-3 text-green-400" /> : 
                      <Lock className="w-3 h-3 text-gray-400" />
                    }
                    <span className={selectedExchange.aiCompatibility.riskManagement ? 'text-green-400' : 'text-gray-400'}>
                      Risk Yönetimi
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={async () => {
                  try {
                    if (globalAIBot && selectedExchange) {
                      await globalAIBot.configureExchange(
                        selectedExchange.id,
                        exchangeCredentials,
                        {
                          paperTrading: true,
                          maxRiskPerTrade: 2,
                          maxDailyRisk: 5,
                          aiEnabled: true,
                          confidenceThreshold: 0.7
                        }
                      );
                      
                      // Simulate connection
                      setConnectedExchanges(prev => {
                        if (!prev.some(e => e.id === selectedExchange.id)) {
                          return [...prev, selectedExchange];
                        }
                        return prev;
                      });
                      
                      setLogs(prev => [`${new Date().toLocaleTimeString()} - ✅ ${selectedExchange.displayName} borsası başarıyla bağlandı`, ...prev]);
                      setShowExchangeModal(false);
                      setSelectedExchange(null);
                      setExchangeCredentials({});
                    }
                  } catch (error) {
                    console.error('Exchange connection error:', error);
                    setLogs(prev => [`${new Date().toLocaleTimeString()} - ❌ Borsa bağlantı hatası`, ...prev]);
                  }
                }} 
                className="flex-1"
                disabled={!selectedExchange?.authentication.requiredFields.every(field => exchangeCredentials[field])}
              >
                Borsayı Bağla
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedExchange(null)}
                className="flex-1"
              >
                Geri Dön
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}