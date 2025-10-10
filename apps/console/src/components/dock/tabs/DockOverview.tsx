/**
 * 📊 Dock Overview Tab
 * Connector metrics and overview
 * 
 * @module components/dock/tabs/DockOverview
 * @white-hat Compliant
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../../state/store';
import { apiFetch } from '../../../lib/api-client';

interface ConnectorMetrics {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  requestCount: number;
  errorRate: number;
  avgLatency: number;
  lastCheck: string;
}

export default function DockOverview() {
  const dock = useAppStore(state => state.dock);
  const [metrics, setMetrics] = useState<ConnectorMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 10000); // Her 10 saniyede
    return () => clearInterval(interval);
  }, [dock.vendor]);

  const loadMetrics = async () => {
    try {
      const result = await apiFetch<{ connectors: ConnectorMetrics[] }>(
        '/api/connectors/metrics',
        { scopes: ['read:connectors'] }
      );

      if (result.success && result.data) {
        setMetrics(result.data.connectors);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner">⏳</div>
        <p>Metrikler yükleniyor...</p>
        <style jsx>{`
          .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            color: rgba(245, 245, 245, 0.6);
          }
          .spinner {
            font-size: 2rem;
            margin-bottom: 1rem;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const filteredMetrics = dock.vendor
    ? metrics.filter(m => m.id === dock.vendor)
    : metrics;

  return (
    <div className="dock-overview">
      <div className="section-header">
        <h4>📊 Connector Metrikleri</h4>
        <button className="refresh-btn" onClick={loadMetrics} title="Yenile">
          🔄
        </button>
      </div>

      <div className="metrics-grid">
        {filteredMetrics.map(metric => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {filteredMetrics.length === 0 && (
        <div className="empty-state">
          <p>Henüz metrik verisi yok.</p>
        </div>
      )}

      <style jsx>{`
        .dock-overview {
          padding: 0;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .section-header h4 {
          margin: 0;
          color: #d4af37;
          font-size: 1rem;
          font-weight: 600;
        }

        .refresh-btn {
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 6px;
          padding: 0.375rem 0.75rem;
          color: #d4af37;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.5);
        }

        .metrics-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: rgba(245, 245, 245, 0.5);
        }
      `}</style>
    </div>
  );
}

function MetricCard({ metric }: { metric: ConnectorMetrics }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#2ed573';
      case 'degraded': return '#ff9f40';
      case 'down': return '#ff4757';
      default: return '#888';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Sağlıklı';
      case 'degraded': return 'Yavaş';
      case 'down': return 'Kapalı';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <div className="metric-card">
      <div className="card-header">
        <div className="card-title">
          <span className="connector-icon">🔌</span>
          <span className="connector-name">{metric.name}</span>
        </div>
        <div className="status-badge" style={{ backgroundColor: `${getStatusColor(metric.status)}20`, color: getStatusColor(metric.status) }}>
          {getStatusText(metric.status)}
        </div>
      </div>

      <div className="metrics-row">
        <div className="metric-item">
          <div className="metric-label">Uptime</div>
          <div className="metric-value">{metric.uptime.toFixed(2)}%</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">İstekler</div>
          <div className="metric-value">{metric.requestCount.toLocaleString()}</div>
        </div>
      </div>

      <div className="metrics-row">
        <div className="metric-item">
          <div className="metric-label">Hata Oranı</div>
          <div className="metric-value" style={{ color: metric.errorRate > 5 ? '#ff4757' : '#2ed573' }}>
            {metric.errorRate.toFixed(2)}%
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Ortalama Gecikme</div>
          <div className="metric-value">{metric.avgLatency}ms</div>
        </div>
      </div>

      <div className="card-footer">
        <span className="last-check">Son kontrol: {new Date(metric.lastCheck).toLocaleTimeString('tr-TR')}</span>
      </div>

      <style jsx>{`
        .metric-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.2s;
        }

        .metric-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(212, 175, 55, 0.3);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .connector-icon {
          font-size: 1.25rem;
        }

        .connector-name {
          font-weight: 600;
          color: #f5f5f5;
          font-size: 0.9375rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .metrics-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .metric-item {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 0.75rem;
          color: rgba(245, 245, 245, 0.6);
          margin-bottom: 0.25rem;
        }

        .metric-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #d4af37;
        }

        .card-footer {
          padding-top: 0.75rem;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
        }

        .last-check {
          font-size: 0.6875rem;
          color: rgba(245, 245, 245, 0.4);
        }
      `}</style>
    </div>
  );
}
