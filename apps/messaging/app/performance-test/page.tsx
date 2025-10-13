/**
 * SHARD_13.3 - Performance Test Page
 * Monitor and test performance metrics
 *
 * Features:
 * - Web Vitals monitoring
 * - Resource timing
 * - Bundle size check
 * - Performance score
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  measureWebVitals,
  getPerformanceScore,
  formatMetricValue,
  getMetricColor,
  getLargestResources,
  getPerformanceSummary,
  type WebVitals,
  type PerformanceMetric
} from '@/lib/performance/metrics';
import {
  formatBytes,
  getBundleRecommendations,
  checkPerformanceBudget,
  PERFORMANCE_BUDGET
} from '@/lib/performance/optimizer';

type LogEntry = { time: string; type: 'info' | 'success' | 'warning' | 'error'; message: string };

export default function PerformanceTestPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [webVitals, setWebVitals] = useState<WebVitals>({});
  const [performanceScore, setPerformanceScore] = useState<number>(0);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('tr-TR');
    setLogs((prev) => [{ time, type, message }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    // Start monitoring on mount
    startMonitoring();
  }, []);

  const startMonitoring = () => {
    addLog('📊 Web Vitals monitoring başlatıldı', 'info');
    setIsMonitoring(true);

    measureWebVitals((vitals) => {
      setWebVitals(vitals);
      const score = getPerformanceScore(vitals);
      setPerformanceScore(score);

      // Log new metrics
      Object.entries(vitals).forEach(([key, metric]) => {
        if (metric) {
          const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
          addLog(
            `${emoji} ${metric.name}: ${formatMetricValue(metric.name, metric.value)} (${metric.rating})`,
            metric.rating === 'good' ? 'success' : metric.rating === 'needs-improvement' ? 'warning' : 'error'
          );
        }
      });
    });
  };

  const testResourceTiming = () => {
    addLog('🔍 Resource timing analizi başlatıldı...');

    const summary = getPerformanceSummary();
    addLog(`📦 Total resources: ${summary.totalResources}`, 'info');
    addLog(`💾 Total size: ${formatBytes(summary.totalSize)}`, 'info');
    addLog(`⏱️ Total duration: ${Math.round(summary.totalDuration)}ms`, 'info');

    const largestResources = getLargestResources(5);
    addLog('📊 Top 5 largest resources:', 'info');
    largestResources.forEach((resource, i) => {
      addLog(
        `${i + 1}. ${formatBytes(resource.size)} - ${resource.name.split('/').pop()}`,
        resource.size > 100 * 1024 ? 'warning' : 'info'
      );
    });

    addLog('✅ Resource timing analizi tamamlandı', 'success');
  };

  const testBundleSize = () => {
    addLog('📦 Bundle size analizi başlatıldı...');

    const summary = getPerformanceSummary();
    const recommendations = getBundleRecommendations(summary.totalSize);

    addLog(`💾 Bundle size: ${formatBytes(summary.totalSize)}`, 'info');

    recommendations.forEach((rec) => {
      addLog(`💡 ${rec}`, summary.totalSize > 300 * 1024 ? 'warning' : 'success');
    });

    addLog('✅ Bundle size analizi tamamlandı', 'success');
  };

  const testPerformanceBudget = () => {
    addLog('🎯 Performance budget kontrolü başlatıldı...');

    const budget = checkPerformanceBudget({
      lcp: webVitals.lcp?.value,
      fid: webVitals.fid?.value,
      cls: webVitals.cls?.value,
      totalSize: getPerformanceSummary().totalSize
    });

    if (budget.passed) {
      addLog('✅ Performance budget sınırları içinde!', 'success');
    } else {
      addLog('⚠️ Performance budget aşımları:', 'warning');
      budget.violations.forEach((violation) => {
        addLog(`❌ ${violation}`, 'error');
      });
    }
  };

  const runAllTests = () => {
    addLog('🚀 Tüm performance testleri başlatılıyor...');

    startMonitoring();
    setTimeout(() => testResourceTiming(), 1000);
    setTimeout(() => testBundleSize(), 2000);
    setTimeout(() => testPerformanceBudget(), 3000);

    setTimeout(() => {
      addLog('🎉 Tüm testler tamamlandı!', 'success');
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">⚡ Performance Monitoring</h1>
        <p className="text-[#9CA3AF]">
          Web Vitals, bundle size ve resource timing analizi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Web Vitals */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">📊 Web Vitals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard metric={webVitals.lcp} />
              <MetricCard metric={webVitals.fid} />
              <MetricCard metric={webVitals.cls} />
              <MetricCard metric={webVitals.fcp} />
              <MetricCard metric={webVitals.ttfb} />
            </div>
          </div>

          {/* Performance Score */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">🏆 Performance Score</h2>
            <div className="text-center">
              <div
                className="text-6xl font-bold mb-2"
                style={{ color: getScoreColor(performanceScore) }}
              >
                {performanceScore}
              </div>
              <p className="text-sm text-[#9CA3AF]">{getScoreLabel(performanceScore)}</p>
              <div className="mt-4 w-full bg-[#1F2937] rounded-full h-4">
                <div
                  className="h-4 rounded-full transition-all"
                  style={{
                    width: `${performanceScore}%`,
                    backgroundColor: getScoreColor(performanceScore)
                  }}
                />
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">🧪 Performance Tests</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={testResourceTiming} className="btn-secondary">
                📦 Resource Timing
              </button>
              <button onClick={testBundleSize} className="btn-secondary">
                💾 Bundle Size
              </button>
              <button onClick={testPerformanceBudget} className="btn-secondary">
                🎯 Budget Check
              </button>
              <button onClick={startMonitoring} className="btn-secondary">
                🔄 Refresh Vitals
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* Quick Test */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">⚡ Hızlı Test</h2>
            <button onClick={runAllTests} className="btn-primary">
              🚀 Tümünü Test Et
            </button>
          </div>

          {/* Budget Info */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">🎯 Performance Budget</h2>
            <div className="space-y-2 text-sm">
              <BudgetItem label="LCP" value={`${PERFORMANCE_BUDGET.lcp}ms`} />
              <BudgetItem label="FID" value={`${PERFORMANCE_BUDGET.fid}ms`} />
              <BudgetItem label="CLS" value={PERFORMANCE_BUDGET.cls.toString()} />
              <BudgetItem label="Bundle" value={formatBytes(PERFORMANCE_BUDGET.totalSize)} />
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">💡 Optimizations</h2>
            <div className="space-y-2 text-sm text-[#9CA3AF]">
              <p>• Lazy load images</p>
              <p>• Code splitting</p>
              <p>• Tree shaking</p>
              <p>• Compression (gzip/br)</p>
              <p>• CDN caching</p>
            </div>
          </div>
        </div>
      </div>

      {/* Console Logs */}
      <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">📊 Test Logları</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-[#6B7280] text-sm">Monitoring başlatıldı...</p>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className={`text-sm p-2 rounded ${
                  log.type === 'error'
                    ? 'bg-[#EF4444]/10 text-[#EF4444]'
                    : log.type === 'warning'
                    ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                    : log.type === 'success'
                    ? 'bg-[#10A37F]/10 text-[#10A37F]'
                    : 'bg-[#374151] text-[#E5E7EB]'
                }`}
              >
                <span className="text-[#6B7280] mr-2">[{log.time}]</span>
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .btn-primary {
          @apply w-full py-3 rounded-lg bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] text-white font-semibold transition-all;
        }
        .btn-secondary {
          @apply px-4 py-3 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-white font-semibold transition-all text-sm;
        }
      `}</style>
    </div>
  );
}

function MetricCard({ metric }: { metric?: PerformanceMetric }) {
  if (!metric) {
    return (
      <div className="bg-[#1F2937] rounded-lg p-4">
        <div className="text-sm text-[#6B7280] mb-2">Measuring...</div>
        <div className="text-2xl font-bold text-[#374151]">--</div>
      </div>
    );
  }

  return (
    <div className="bg-[#1F2937] rounded-lg p-4 border-l-4" style={{ borderColor: getMetricColor(metric.rating) }}>
      <div className="text-sm text-[#9CA3AF] mb-2">{metric.name}</div>
      <div className="text-2xl font-bold" style={{ color: getMetricColor(metric.rating) }}>
        {formatMetricValue(metric.name, metric.value)}
      </div>
      <div className="text-xs text-[#6B7280] mt-1 capitalize">{metric.rating.replace('-', ' ')}</div>
    </div>
  );
}

function BudgetItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-2 bg-[#1F2937] rounded">
      <span className="text-[#9CA3AF]">{label}:</span>
      <span className="font-semibold text-[#10A37F]">{value}</span>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#10A37F';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent Performance';
  if (score >= 75) return 'Good Performance';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor Performance';
}
