'use client';

/**
 * EXPERIMENT RESULTS DASHBOARD
 *
 * Display A/B test results
 * - Variant metrics
 * - Conversion rates
 * - Statistical significance
 * - Winner detection
 *
 * WHITE-HAT:
 * - Transparent metrics
 * - No p-hacking
 * - Honest reporting
 */

import { useState, useEffect } from 'react';
import type { Experiment } from '@/lib/feature-flags/types';
import type { ExperimentResults } from '@/lib/analytics/types';
import { EXPERIMENTS } from '@/lib/feature-flags/flags.config';
import { getTracker } from '@/lib/analytics/event-tracker';
import { getMetricsCalculator } from '@/lib/analytics/metrics-calculator';

export function ExperimentResults() {
  const [experiments, setExperiments] = useState<Record<string, ExperimentResults>>({});
  const [loading, setLoading] = useState(true);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);

  // Load experiment results
  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setLoading(true);
    try {
      const tracker = getTracker();
      const calculator = getMetricsCalculator();

      const results: Record<string, ExperimentResults> = {};

      for (const [key, experiment] of Object.entries(EXPERIMENTS)) {
        // Get events for experiment
        const events = await tracker.getEventsByExperiment(key);

        if (events.length === 0) continue;

        // Calculate metrics
        const variantNames: Record<string, string> = {};
        for (const variant of experiment.variants) {
          variantNames[variant.id] = variant.name;
        }

        const result = calculator.calculateExperimentResults(key, events, variantNames);
        results[key] = result;
      }

      setExperiments(results);
    } catch (error) {
      console.error('[Admin] Failed to load experiment results:', error);
    } finally {
      setLoading(false);
    }
  };

  const experimentKeys = Object.keys(experiments);
  const currentExperiment = selectedExperiment
    ? experiments[selectedExperiment]
    : experimentKeys.length > 0
    ? experiments[experimentKeys[0]]
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-sm text-gray-500">Loading results...</div>
        </div>
      </div>
    );
  }

  if (experimentKeys.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <div>Henüz experiment verisi yok</div>
        <div className="text-sm mt-2">Experiment başlatıldıktan sonra sonuçlar burada görünecek</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Experiment selector */}
      {experimentKeys.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {experimentKeys.map((key) => {
            const exp = EXPERIMENTS[key];
            const isSelected = selectedExperiment === key || (!selectedExperiment && key === experimentKeys[0]);

            return (
              <button
                key={key}
                onClick={() => setSelectedExperiment(key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${
                    isSelected
                      ? 'bg-accent-blue text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }
                `}
              >
                {exp.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Current experiment results */}
      {currentExperiment && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-white/5 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-2">
              {EXPERIMENTS[currentExperiment.experimentKey].name}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {EXPERIMENTS[currentExperiment.experimentKey].description}
            </p>

            {/* Overall stats */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">Total Users</div>
                <div className="text-2xl font-bold text-white">
                  {currentExperiment.totalUsers.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Impressions</div>
                <div className="text-2xl font-bold text-white">
                  {currentExperiment.totalImpressions.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Conversions</div>
                <div className="text-2xl font-bold text-white">
                  {currentExperiment.totalConversions.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Statistical significance */}
            {currentExperiment.pValue !== undefined && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Statistical Significance</div>
                    <div className="text-lg font-bold">
                      {currentExperiment.pValue < 0.05 ? (
                        <span className="text-green-400">✅ Significant (p = {currentExperiment.pValue.toFixed(4)})</span>
                      ) : (
                        <span className="text-yellow-400">⚠️ Not Significant (p = {currentExperiment.pValue.toFixed(4)})</span>
                      )}
                    </div>
                  </div>
                  {currentExperiment.winner && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Winner</div>
                      <div className="text-lg font-bold text-green-400">
                        {currentExperiment.variants[currentExperiment.winner.variantId].variantName}
                        <span className="text-sm ml-2">
                          (+{currentExperiment.winner.uplift.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Variant results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(currentExperiment.variants).map(([variantId, variant], index) => {
              const isWinner =
                currentExperiment.winner?.variantId === variantId;
              const isControl = index === 0;

              return (
                <div
                  key={variant.variantId}
                  className={`
                    bg-gradient-to-br from-[#1a1f2e] to-[#0f1419]
                    border rounded-lg p-6
                    ${
                      isWinner
                        ? 'border-green-500/60 shadow-lg shadow-green-500/20'
                        : 'border-white/5'
                    }
                  `}
                >
                  {/* Variant header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-white">{variant.variantName}</h3>
                      {isControl && (
                        <span className="text-xs text-gray-500">Control</span>
                      )}
                    </div>
                    {isWinner && (
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                        🏆 Winner
                      </span>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Users</span>
                      <span className="font-mono text-white">{variant.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Conversions</span>
                      <span className="font-mono text-white">{variant.conversions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Conversion Rate</span>
                      <span className="text-lg font-bold text-white">
                        {(variant.conversionRate * 100).toFixed(2)}%
                      </span>
                    </div>

                    {/* Confidence level */}
                    <div className="pt-3 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Confidence</span>
                        <span
                          className={`font-mono ${
                            variant.confidenceLevel >= 95
                              ? 'text-green-400'
                              : variant.confidenceLevel >= 85
                              ? 'text-yellow-400'
                              : 'text-gray-400'
                          }`}
                        >
                          {variant.confidenceLevel}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            variant.confidenceLevel >= 95
                              ? 'bg-green-500'
                              : variant.confidenceLevel >= 85
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                          }`}
                          style={{ width: `${variant.confidenceLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendations */}
          {currentExperiment.winner && currentExperiment.pValue && currentExperiment.pValue < 0.05 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <h4 className="font-bold text-green-400 mb-1">Recommendation: Deploy Winner</h4>
                  <p className="text-sm text-gray-300">
                    The experiment has reached statistical significance. Consider deploying the winning
                    variant <strong>{currentExperiment.variants[currentExperiment.winner.variantId].variantName}</strong> with{' '}
                    <strong>{currentExperiment.winner.uplift.toFixed(1)}% uplift</strong> over control.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentExperiment.pValue && currentExperiment.pValue >= 0.05 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <h4 className="font-bold text-yellow-400 mb-1">Not Yet Significant</h4>
                  <p className="text-sm text-gray-300">
                    The experiment has not yet reached statistical significance (p = {currentExperiment.pValue.toFixed(4)}).
                    Continue running the experiment or increase sample size.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={loadResults}
            className="w-full px-4 py-2 bg-accent-blue/10 hover:bg-accent-blue/20 border border-accent-blue/30 rounded-lg text-accent-blue font-medium transition-colors"
          >
            🔄 Refresh Results
          </button>
        </div>
      )}
    </div>
  );
}
