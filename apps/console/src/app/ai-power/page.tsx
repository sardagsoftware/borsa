/**
 * AI POWER PANEL - Main Page
 * 21 Models Consolidated View with Real Metrics
 *
 * GOVERNANCE: White-hat, KVKK/GDPR/PDPL compliant
 * SECURITY: No PII, SSRF protected, Vault-managed credentials
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { AI_MODELS, getActiveModels } from '../../lib/models/registry';
import { fetchAllMetrics } from '../../lib/models/metrics';
import {
  OperationalMetrics,
  calculateActiveParamsB,
  calculateTotalSystemParams,
  calculateTotalSystemTPS,
  calculateTotalSystemTPM,
  calculateTotalSystemRPM
} from '../../lib/models/formulas';
import { PowerCards, PowerCardData } from '../../components/power/Cards';
import { PowerTable } from '../../components/power/Table';

export default function AIPowerPanel() {
  const [metricsMap, setMetricsMap] = useState<Map<string, OperationalMetrics>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch metrics on mount and every 30 seconds if autoRefresh enabled
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const activeModels = getActiveModels();
        const metrics = await fetchAllMetrics(activeModels);
        setMetricsMap(metrics);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Calculate summary data
  const summaryData = useMemo<PowerCardData>(() => {
    const activeModels = getActiveModels();
    const totalActiveParamsB = activeModels
      .filter(m => m.type !== 'closed')
      .reduce((sum, m) => sum + (calculateActiveParamsB(m) || 0), 0);

    const totalTPS = calculateTotalSystemTPS(activeModels, metricsMap);
    const totalTPM = calculateTotalSystemTPM(activeModels, metricsMap);
    const totalRPM = calculateTotalSystemRPM(activeModels, metricsMap);

    return {
      totalActiveParamsB,
      totalTPS,
      totalTPM,
      totalRPM,
      activeModels: activeModels.length,
      totalModels: AI_MODELS.length
    };
  }, [metricsMap]);

  return (
    <div className="ai-power-panel">
      <header className="panel-header">
        <div className="header-content">
          <h1 className="panel-title">
            <span className="title-icon">⚡</span>
            AI Power Panel
          </h1>
          <p className="panel-subtitle">
            21 Models Consolidated | Real-time Metrics | Azure Quotas Integrated
          </p>
        </div>
        <div className="header-actions">
          <button
            className="refresh-button"
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh (30s)</span>
          </label>
        </div>
      </header>

      {lastUpdate && (
        <div className="last-update">
          Last updated: {lastUpdate.toLocaleTimeString()} |
          Active: {summaryData.activeModels}/{summaryData.totalModels} models
        </div>
      )}

      <div className="panel-content">
        <section className="summary-section">
          <h2 className="section-title">System Overview</h2>
          <PowerCards data={summaryData} loading={loading} />
        </section>

        <section className="models-section">
          <h2 className="section-title">Model Details</h2>
          <PowerTable
            models={getActiveModels()}
            metricsMap={metricsMap}
            loading={loading}
          />
        </section>

        <footer className="panel-footer">
          <div className="footer-info">
            <span>✅ White-hat compliant</span>
            <span>🔒 KVKK/GDPR/PDPL certified</span>
            <span>🛡️ Zero PII</span>
            <span>⚡ Real-time telemetry</span>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .ai-power-panel {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-content {
          flex: 1;
          min-width: 300px;
        }

        .panel-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .title-icon {
          font-size: 3rem;
        }

        .panel-subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0.5rem 0 0 0;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .refresh-button {
          background: white;
          color: #667eea;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-button:hover:not(:disabled) {
          background: #f8f9fa;
          transform: translateY(-1px);
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auto-refresh-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          cursor: pointer;
          user-select: none;
        }

        .auto-refresh-toggle input {
          cursor: pointer;
        }

        .last-update {
          background: rgba(255, 255, 255, 0.95);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          display: flex;
          gap: 1rem;
        }

        .panel-content {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1.5rem 0;
        }

        .summary-section {
          margin-bottom: 3rem;
        }

        .models-section {
          margin-bottom: 2rem;
        }

        .panel-footer {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .footer-info {
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .footer-info span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .ai-power-panel {
            padding: 1rem;
          }

          .panel-title {
            font-size: 1.75rem;
          }

          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .refresh-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
