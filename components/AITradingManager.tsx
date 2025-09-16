/**
 * AI Trading Manager Component - Dashboard AI Query Interface
 * Z.AI GLM-4.5 ile entegre edilmiş akıllı trading asistanı
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIQuery {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
  category: 'ANALYSIS' | 'TRADING' | 'RISK' | 'PORTFOLIO';
  confidence?: number;
  actions?: AIAction[];
}

interface AIAction {
  type: 'BUY' | 'SELL' | 'MONITOR' | 'ALERT';
  symbol: string;
  parameters: Record<string, any>;
  executed: boolean;
}

interface TradingScenario {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  performance: {
    total_trades: number;
    win_rate: number;
    avg_return: number;
  };
}

interface MarketInsight {
  symbol: string;
  action: string;
  confidence: number;
  reasoning: string;
  risk_level: string;
}

const AITradingManager = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiQueries, setAiQueries] = useState<AIQuery[]>([]);
  const [tradingScenarios, setTradingScenarios] = useState<TradingScenario[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('query');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto trading engine status
  const [engineStatus, setEngineStatus] = useState({
    is_running: false,
    active_scenarios: 0,
    total_scenarios: 0,
    active_signals: 0,
    monitored_symbols: 0
  });

  useEffect(() => {
    loadTradingScenarios();
    loadMarketInsights();
    checkEngineStatus();
    
    // Real-time updates
    const interval = setInterval(() => {
      checkEngineStatus();
      loadMarketInsights();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [aiQueries]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTradingScenarios = async () => {
    try {
      const response = await fetch('/api/ai/trading-scenarios');
      if (response.ok) {
        const scenarios = await response.json();
        setTradingScenarios(scenarios);
      }
    } catch (error) {
      console.error('Failed to load trading scenarios:', error);
    }
  };

  const loadMarketInsights = async () => {
    try {
      const response = await fetch('/api/ai/market-insights');
      if (response.ok) {
        const insights = await response.json();
        setMarketInsights(insights);
      }
    } catch (error) {
      console.error('Failed to load market insights:', error);
    }
  };

  const checkEngineStatus = async () => {
    try {
      const response = await fetch('/api/ai/engine-status');
      if (response.ok) {
        const status = await response.json();
        setEngineStatus(status);
        setIsEngineRunning(status.is_running);
      }
    } catch (error) {
      console.error('Failed to check engine status:', error);
    }
  };

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const currentQuery = query.trim();
    setQuery('');
    setIsLoading(true);

    // Yeni query'yi listeye ekle
    const newQuery: AIQuery = {
      id: Date.now().toString(),
      query: currentQuery,
      response: '',
      timestamp: new Date(),
      category: detectQueryCategory(currentQuery)
    };

    setAiQueries(prev => [...prev, newQuery]);

    try {
      // AI'ya query gönder
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: currentQuery,
          context: {
            market_data: marketInsights,
            scenarios: tradingScenarios
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Response'u güncelle
        setAiQueries(prev => 
          prev.map(q => 
            q.id === newQuery.id 
              ? { 
                  ...q, 
                  response: result.response,
                  confidence: result.confidence,
                  actions: result.actions 
                }
              : q
          )
        );

        // Otomatik actionları uygula
        if (result.actions && result.actions.length > 0) {
          await executeAIActions(result.actions);
        }
      } else {
        throw new Error('AI query failed');
      }
    } catch (error) {
      console.error('AI query error:', error);
      setAiQueries(prev => 
        prev.map(q => 
          q.id === newQuery.id 
            ? { 
                ...q, 
                response: `Üzgünüm, şu anda analiz yapamıyorum. Hata: ${(error as Error).message}` 
              }
            : q
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const detectQueryCategory = (query: string): AIQuery['category'] => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('analiz') || lowerQuery.includes('grafik')) return 'ANALYSIS';
    if (lowerQuery.includes('al') || lowerQuery.includes('sat') || lowerQuery.includes('trade')) return 'TRADING';
    if (lowerQuery.includes('risk') || lowerQuery.includes('güvenlik')) return 'RISK';
    if (lowerQuery.includes('portföy') || lowerQuery.includes('portfolio')) return 'PORTFOLIO';
    return 'ANALYSIS';
  };

  const executeAIActions = async (actions: AIAction[]) => {
    for (const action of actions) {
      try {
        await fetch('/api/ai/execute-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action)
        });
      } catch (error) {
        console.error('Action execution error:', error);
      }
    }
  };

  const toggleEngine = async () => {
    try {
      const response = await fetch('/api/ai/toggle-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: !isEngineRunning })
      });

      if (response.ok) {
        setIsEngineRunning(!isEngineRunning);
        checkEngineStatus();
      }
    } catch (error) {
      console.error('Engine toggle error:', error);
    }
  };

  const toggleScenario = async (scenarioId: string, active: boolean) => {
    try {
      const response = await fetch('/api/ai/toggle-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, active })
      });

      if (response.ok) {
        loadTradingScenarios();
      }
    } catch (error) {
      console.error('Scenario toggle error:', error);
    }
  };

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery);
    setActiveTab('query');
  };

  const getCategoryColor = (category: AIQuery['category']) => {
    const colors = {
      'ANALYSIS': 'bg-blue-500/20 text-blue-300',
      'TRADING': 'bg-green-500/20 text-green-300',
      'RISK': 'bg-red-500/20 text-red-300',
      'PORTFOLIO': 'bg-purple-500/20 text-purple-300'
    };
    return colors[category];
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      'LOW': 'text-green-400',
      'MEDIUM': 'text-yellow-400',
      'HIGH': 'text-red-400'
    };
    return colors[risk as keyof typeof colors] || 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Engine Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            🤖 AI Trading Engine
            <Badge variant={isEngineRunning ? 'positive' : 'secondary'}>
              {isEngineRunning ? 'AKTIF' : 'DURDURULDU'}
            </Badge>
          </h3>
          <Button 
            onClick={toggleEngine}
            variant={isEngineRunning ? 'danger' : 'positive'}
          >
            {isEngineRunning ? '⏹️ Durdur' : '▶️ Başlat'}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{engineStatus.active_scenarios}</div>
            <div className="text-sm text-muted-foreground">Aktif Senaryo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-positive">{engineStatus.active_signals}</div>
            <div className="text-sm text-muted-foreground">Aktif Sinyal</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">{engineStatus.monitored_symbols}</div>
            <div className="text-sm text-muted-foreground">İzlenen Coin</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{engineStatus.total_scenarios}</div>
            <div className="text-sm text-muted-foreground">Toplam Senaryo</div>
          </div>
        </div>
      </Card>

      {/* AI Interface */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="query">🔍 AI Sorgu</TabsTrigger>
            <TabsTrigger value="scenarios">⚙️ Senaryolar</TabsTrigger>
            <TabsTrigger value="insights">📊 İçgörüler</TabsTrigger>
            <TabsTrigger value="history">📝 Geçmiş</TabsTrigger>
          </TabsList>

          <TabsContent value="query" className="space-y-4">
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  'Bitcoin analizi yap',
                  'Portfolio riskini değerlendir', 
                  'En iyi alım fırsatını bul',
                  'Stop loss önerileri ver',
                  'Piyasa trendini analiz et',
                  'Arbitraj fırsatları ara',
                  'Risk/reward hesapla',
                  'Likidite analizi yap'
                ].map((quickQuery) => (
                  <Button
                    key={quickQuery}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickQuery(quickQuery)}
                    className="text-xs p-2"
                  >
                    {quickQuery}
                  </Button>
                ))}
              </div>

              {/* Query Form */}
              <form onSubmit={handleSubmitQuery} className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="AI asistanına trading sorusu sor... (örn: Bitcoin'de kısa vadeli al-sat fırsatı var mı?)"
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !query.trim()}
                >
                  {isLoading ? '🤖 Analiz ediliyor...' : '📤 Gönder'}
                </Button>
              </form>

              {/* Query Results */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {aiQueries.map((aiQuery) => (
                  <div key={aiQuery.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(aiQuery.category)}>
                        {aiQuery.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {aiQuery.timestamp.toLocaleTimeString()}
                      </span>
                      {aiQuery.confidence && (
                        <Badge variant="outline">
                          %{aiQuery.confidence} güven
                        </Badge>
                      )}
                    </div>
                    
                    <div className="bg-panel/50 rounded-lg p-3">
                      <div className="font-medium text-primary mb-2">
                        ❓ {aiQuery.query}
                      </div>
                      <div className="text-sm">
                        {aiQuery.response || '🤖 Analiz ediliyor...'}
                      </div>
                      
                      {aiQuery.actions && aiQuery.actions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-sm font-medium">📋 Önerilen Aksiyonlar:</div>
                          {aiQuery.actions.map((action, idx) => (
                            <div key={idx} className="bg-primary/10 rounded p-2 text-sm">
                              {action.type} {action.symbol} - {JSON.stringify(action.parameters)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-4">
            <div className="grid gap-4">
              {tradingScenarios.map((scenario) => (
                <div key={scenario.id} className="bg-panel/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{scenario.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={scenario.is_active ? 'positive' : 'secondary'}>
                        {scenario.is_active ? 'Aktif' : 'Deaktif'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleScenario(scenario.id, !scenario.is_active)}
                      >
                        {scenario.is_active ? 'Durdur' : 'Başlat'}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">İşlemler: </span>
                      {scenario.performance.total_trades}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Başarı: </span>
                      %{scenario.performance.win_rate.toFixed(1)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Return: </span>
                      %{scenario.performance.avg_return.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4">
              {marketInsights.map((insight, idx) => (
                <div key={idx} className="bg-panel/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      {insight.symbol}
                      <Badge variant={
                        insight.action === 'BUY' ? 'positive' :
                        insight.action === 'SELL' ? 'negative' : 'secondary'
                      }>
                        {insight.action}
                      </Badge>
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        %{insight.confidence} güven
                      </Badge>
                      <span className={`text-sm ${getRiskColor(insight.risk_level)}`}>
                        {insight.risk_level} Risk
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.reasoning}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {aiQueries.slice().reverse().map((aiQuery) => (
                <div key={aiQuery.id} className="bg-panel/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getCategoryColor(aiQuery.category)}>
                      {aiQuery.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {aiQuery.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <strong>Q:</strong> {aiQuery.query}
                  </div>
                  <div className="text-sm mt-1">
                    <strong>A:</strong> {aiQuery.response || 'Yanıt bekleniyor...'}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AITradingManager;
