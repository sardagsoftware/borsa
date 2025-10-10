/**
 * ⏱️ Dock Rate Limit Tab
 * Rate limiting status and charts
 * 
 * @module components/dock/tabs/DockRateLimit
 * @white-hat Compliant
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../../state/store';
import { apiFetch } from '../../../lib/api-client';

interface RateLimitData {
  connectorId: string;
  limit: number;
  remaining: number;
  reset: string;
  window: string;
  requests: Array<{
    timestamp: string;
    count: number;
  }>;
}

export default function DockRateLimit() {
  const dock = useAppStore(state => state.dock);
  const [rateLimits, setRateLimits] = useState<RateLimitData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRateLimits();
    const interval = setInterval(loadRateLimits, 5000); // Her 5 saniyede
    return () => clearInterval(interval);
  }, [dock.vendor]);

  const loadRateLimits = async () => {
    try {
      const result = await apiFetch<{ rateLimits: RateLimitData[] }>(
        '/api/connectors/rate-limits',
        { scopes: ['read:connectors'] }
      );

      if (result.success && result.data) {
        setRateLimits(result.data.rateLimits);
      }
    } catch (error) {
      console.error('Failed to load rate limits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner">⏳</div>
        <p>Rate limitler yükleniyor...</p>
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

  const filteredData = dock.vendor
    ? rateLimits.filter(r => r.connectorId === dock.vendor)
    : rateLimits;

  return (
    <div className="dock-rate-limit">
      <div className="section-header">
        <h4>⏱️ Rate Limiting</h4>
        <button className="refresh-btn" onClick={loadRateLimits} title="Yenile">
          🔄
        </button>
      </div>

      <div className="rate-limit-list">
        {filteredData.map(data => (
          <RateLimitCard key={data.connectorId} data={data} />
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="empty-state">
          <p>Henüz rate limit verisi yok.</p>
        </div>
      )}

      <style jsx>{`
        .dock-rate-limit {
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

        .rate-limit-list {
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

function RateLimitCard({ data }: { data: RateLimitData }) {
  const usagePercent = ((data.limit - data.remaining) / data.limit) * 100;
  const resetTime = new Date(data.reset);
  const now = new Date();
  const minutesUntilReset = Math.max(0, Math.floor((resetTime.getTime() - now.getTime()) / 60000));

  const getUsageColor = (percent: number) => {
    if (percent < 50) return '#2ed573';
    if (percent < 80) return '#ff9f40';
    return '#ff4757';
  };

  return (
    <div className="rate-limit-card">
      <div className="card-header">
        <div className="connector-info">
          <span className="connector-icon">🔌</span>
          <span className="connector-name">{data.connectorId}</span>
        </div>
        <div className="reset-time">
          Reset: {minutesUntilReset}dk
        </div>
      </div>

      <div className="usage-section">
        <div className="usage-stats">
          <div className="stat">
            <span className="stat-label">Kullanılan</span>
            <span className="stat-value">{data.limit - data.remaining}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Kalan</span>
            <span className="stat-value" style={{ color: getUsageColor(usagePercent) }}>
              {data.remaining}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Limit</span>
            <span className="stat-value">{data.limit}</span>
          </div>
        </div>

        <div className="usage-bar">
          <div 
            className="usage-fill" 
            style={{ 
              width: `${usagePercent}%`,
              background: getUsageColor(usagePercent)
            }} 
          />
        </div>

        <div className="usage-percent" style={{ color: getUsageColor(usagePercent) }}>
          {usagePercent.toFixed(1)}% kullanılmış
        </div>
      </div>

      <div className="window-info">
        <span className="window-label">Zaman Penceresi:</span>
        <span className="window-value">{data.window}</span>
      </div>

      {data.requests.length > 0 && (
        <div className="chart-section">
          <div className="chart-title">Son İstekler</div>
          <div className="mini-chart">
            {data.requests.slice(-10).map((req, idx) => {
              const maxCount = Math.max(...data.requests.map(r => r.count));
              const height = (req.count / maxCount) * 100;
              return (
                <div key={idx} className="chart-bar" title={`${req.count} istek`}>
                  <div className="bar-fill" style={{ height: `${height}%` }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .rate-limit-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          padding: 1rem;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .connector-info {
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

        .reset-time {
          font-size: 0.75rem;
          color: rgba(245, 245, 245, 0.6);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
        }

        .usage-section {
          margin-bottom: 1rem;
        }

        .usage-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-label {
          font-size: 0.6875rem;
          color: rgba(245, 245, 245, 0.6);
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #d4af37;
        }

        .usage-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .usage-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .usage-percent {
          font-size: 0.875rem;
          font-weight: 600;
          text-align: center;
        }

        .window-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .window-label {
          font-size: 0.75rem;
          color: rgba(245, 245, 245, 0.6);
        }

        .window-value {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #d4af37;
        }

        .chart-section {
          border-top: 1px solid rgba(212, 175, 55, 0.1);
          padding-top: 1rem;
        }

        .chart-title {
          font-size: 0.75rem;
          color: rgba(245, 245, 245, 0.6);
          margin-bottom: 0.75rem;
        }

        .mini-chart {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 60px;
        }

        .chart-bar {
          flex: 1;
          height: 100%;
          display: flex;
          align-items: flex-end;
          cursor: pointer;
        }

        .bar-fill {
          width: 100%;
          background: linear-gradient(180deg, #d4af37 0%, #f4d03f 100%);
          border-radius: 2px 2px 0 0;
          transition: height 0.3s ease;
          min-height: 4px;
        }

        .chart-bar:hover .bar-fill {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
