'use client';

import { useState, useEffect } from 'react';
import { Brain, Zap, Activity, TrendingUp, AlertCircle, RefreshCw, Cpu, Eye } from 'lucide-react';

interface QuantumSignal {
  action: 'BUY' | 'HOLD' | 'PASS';
  confidence: number;
  probability: number;
  uncertainty: number;
  regime: {
    type: string;
    confidence: number;
    features: Record<string, number>;
  };
  explanation: {
    feature_importance: Record<string, number>;
    attention_weights: number[][];
    quantum_state: {
      amplitude: number;
      phase: number;
      entanglement: number;
    };
    reasoning: string[];
  };
  meta: {
    model_version: string;
    timestamp: number;
    latency_ms: number;
    training_samples: number;
  };
}

const DEMO_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'AVAXUSDT'];

export default function QuantumNexusPage() {
  const [signals, setSignals] = useState<Record<string, QuantumSignal>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [engineStatus, setEngineStatus] = useState<any>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');

  useEffect(() => {
    // Check engine status
    fetch('/api/quantum-nexus/predict')
      .then(r => r.json())
      .then(setEngineStatus)
      .catch(console.error);

    // Initial predictions
    fetchAllSignals();
  }, []);

  const fetchSignal = async (symbol: string) => {
    setLoading(prev => ({ ...prev, [symbol]: true }));

    try {
      // Generate mock features (in production, fetch real market data)
      const features = generateMockFeatures();

      const response = await fetch('/api/quantum-nexus/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe: '1h', features })
      });

      const data = await response.json();

      if (response.ok) {
        setSignals(prev => ({ ...prev, [symbol]: data }));
      } else {
        console.error(`Failed to fetch signal for ${symbol}:`, data.error);
      }
    } catch (error) {
      console.error(`Error fetching signal for ${symbol}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [symbol]: false }));
    }
  };

  const fetchAllSignals = async () => {
    for (const symbol of DEMO_SYMBOLS) {
      await fetchSignal(symbol);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const generateMockFeatures = (): number[][] => {
    const seqLength = 128;
    const numFeatures = 50;
    const features: number[][] = [];

    for (let i = 0; i < seqLength; i++) {
      const row: number[] = [];
      for (let j = 0; j < numFeatures; j++) {
        row.push(Math.random() * 2 - 1); // Random values between -1 and 1
      }
      features.push(row);
    }

    return features;
  };

  const selectedSignal = signals[selectedSymbol];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <Brain size={48} className="text-purple-400" />
              Quantum Nexus
            </h1>
            <p className="text-slate-400 text-lg">
              Self-Learning AI • Quantum-Inspired Attention • Zero Tolerance
            </p>
          </div>

          <button
            onClick={fetchAllSignals}
            disabled={Object.values(loading).some(Boolean)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <RefreshCw size={20} className={Object.values(loading).some(Boolean) ? 'animate-spin' : ''} />
            Refresh All
          </button>
        </div>

        {/* Engine Status */}
        {engineStatus && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 text-purple-400 mb-1">
                <Cpu size={16} />
                <span className="text-xs font-semibold">STATUS</span>
              </div>
              <div className="text-2xl font-bold text-white capitalize">{engineStatus.status}</div>
            </div>

            <div className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 rounded-xl p-4 border border-pink-500/30">
              <div className="flex items-center gap-2 text-pink-400 mb-1">
                <Activity size={16} />
                <span className="text-xs font-semibold">TRAINING SAMPLES</span>
              </div>
              <div className="text-2xl font-bold text-white">{engineStatus.training_samples}</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 rounded-xl p-4 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <Zap size={16} />
                <span className="text-xs font-semibold">MODEL VERSION</span>
              </div>
              <div className="text-lg font-bold text-white">{engineStatus.model_version}</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-xl p-4 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Eye size={16} />
                <span className="text-xs font-semibold">FEATURES</span>
              </div>
              <div className="text-xs text-white space-y-0.5">
                {engineStatus.features?.quantum_attention && <div>✓ Quantum Attention</div>}
                {engineStatus.features?.continual_learning && <div>✓ Continual Learning</div>}
                {engineStatus.features?.explainability && <div>✓ Full Explainability</div>}
              </div>
            </div>
          </div>
        )}

        {/* Symbol Selector */}
        <div className="flex gap-2 mb-4">
          {DEMO_SYMBOLS.map(sym => (
            <button
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedSymbol === sym
                  ? 'bg-purple-500/30 text-purple-300 border-2 border-purple-400'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-600/30 hover:bg-slate-700'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Signal Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={24} className="text-purple-400" />
            Signal for {selectedSymbol}
          </h2>

          {loading[selectedSymbol] && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={48} className="animate-spin text-purple-400" />
            </div>
          )}

          {!loading[selectedSymbol] && selectedSignal && (
            <>
              {/* Action Badge */}
              <div className="mb-6">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-lg text-2xl font-bold ${
                  selectedSignal.action === 'BUY'
                    ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400'
                    : selectedSignal.action === 'HOLD'
                    ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-400'
                    : 'bg-slate-500/20 text-slate-400 border-2 border-slate-400'
                }`}>
                  {selectedSignal.action === 'BUY' && '🚀'}
                  {selectedSignal.action === 'HOLD' && '⏸️'}
                  {selectedSignal.action === 'PASS' && '⛔'}
                  {selectedSignal.action}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">Probability</div>
                  <div className="text-3xl font-bold text-white">{(selectedSignal.probability * 100).toFixed(1)}%</div>
                  <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${selectedSignal.probability * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">Confidence</div>
                  <div className="text-3xl font-bold text-white">{(selectedSignal.confidence * 100).toFixed(1)}%</div>
                  <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ width: `${selectedSignal.confidence * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">Uncertainty</div>
                  <div className="text-3xl font-bold text-orange-400">{(selectedSignal.uncertainty * 100).toFixed(1)}%</div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">Latency</div>
                  <div className="text-3xl font-bold text-emerald-400">{selectedSignal.meta.latency_ms}ms</div>
                </div>
              </div>

              {/* Market Regime */}
              <div className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 rounded-lg p-4 border border-purple-500/30 mb-6">
                <div className="text-sm font-semibold text-purple-400 mb-2">MARKET REGIME</div>
                <div className="text-xl font-bold text-white mb-2 capitalize">
                  {selectedSignal.regime.type.replace(/_/g, ' ')}
                </div>
                <div className="text-sm text-slate-400">
                  Confidence: {(selectedSignal.regime.confidence * 100).toFixed(1)}%
                </div>
              </div>

              {/* Quantum State */}
              <div className="bg-gradient-to-br from-pink-900/30 to-slate-900/30 rounded-lg p-4 border border-pink-500/30">
                <div className="text-sm font-semibold text-pink-400 mb-3">QUANTUM STATE</div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Amplitude</div>
                    <div className="text-lg font-bold text-white">
                      {selectedSignal.explanation.quantum_state.amplitude.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Phase</div>
                    <div className="text-lg font-bold text-white">
                      {selectedSignal.explanation.quantum_state.phase.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Entanglement</div>
                    <div className="text-lg font-bold text-white">
                      {selectedSignal.explanation.quantum_state.entanglement.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Explanation Panel */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle size={24} className="text-cyan-400" />
            Explainability
          </h2>

          {!loading[selectedSymbol] && selectedSignal && (
            <>
              {/* Feature Importance */}
              <div className="mb-6">
                <div className="text-sm font-semibold text-cyan-400 mb-3">FEATURE IMPORTANCE</div>
                <div className="space-y-2">
                  {Object.entries(selectedSignal.explanation.feature_importance)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([feature, importance]) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="w-24 text-xs text-slate-400 uppercase">{feature}</div>
                        <div className="flex-1 h-6 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-end px-2"
                            style={{ width: `${importance * 100}%` }}
                          >
                            <span className="text-xs font-bold text-white">
                              {(importance * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-gradient-to-br from-cyan-900/30 to-slate-900/30 rounded-lg p-4 border border-cyan-500/30">
                <div className="text-sm font-semibold text-cyan-400 mb-3">AI REASONING</div>
                <ul className="space-y-2">
                  {selectedSignal.explanation.reasoning.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-cyan-400 mt-0.5">●</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* All Signals Grid */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold text-white mb-4">All Signals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {DEMO_SYMBOLS.map(symbol => {
            const signal = signals[symbol];
            const isLoading = loading[symbol];

            return (
              <div
                key={symbol}
                onClick={() => setSelectedSymbol(symbol)}
                className={`bg-slate-800/50 backdrop-blur-xl rounded-xl border p-4 cursor-pointer transition-all hover:scale-105 ${
                  selectedSymbol === symbol
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'border-slate-700/50'
                }`}
              >
                <div className="text-lg font-bold text-white mb-2">{symbol}</div>

                {isLoading && (
                  <div className="flex justify-center py-4">
                    <RefreshCw size={24} className="animate-spin text-purple-400" />
                  </div>
                )}

                {!isLoading && signal && (
                  <>
                    <div className={`text-2xl font-bold mb-2 ${
                      signal.action === 'BUY' ? 'text-emerald-400' :
                      signal.action === 'HOLD' ? 'text-yellow-400' :
                      'text-slate-400'
                    }`}>
                      {signal.action}
                    </div>
                    <div className="text-sm text-slate-400">
                      Prob: {(signal.probability * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {signal.regime.type.replace(/_/g, ' ')}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}