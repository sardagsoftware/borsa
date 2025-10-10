/**
 * 💚 Dock Health Tab
 * Real-time health monitoring with WebSocket
 * 
 * @module components/dock/tabs/DockHealth
 * @white-hat Compliant
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../../state/store';
import { useWebSocket } from '../../../hooks/useWebSocket';

interface HealthData {
  connectorId: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  latency_p50: number;
  latency_p95: number;
  latency_p99: number;
  lastCheck: string;
  checks: {
    database: boolean;
    api: boolean;
    cache: boolean;
  };
}

export default function DockHealth() {
  const dock = useAppStore(state => state.dock);
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);

  // WebSocket bağlantısı
  const { isConnected, lastMessage } = useWebSocket({
    url: 'ws://localhost:3100/api/health/stream',
    onMessage: (data) => {
      if (data.type === 'health_update') {
        setHealthData(prev => {
          const index = prev.findIndex(h => h.connectorId === data.payload.connectorId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data.payload;
            return updated;
          }
          return [...prev, data.payload];
        });
      }
    },
  });

  useEffect(() => {
    if (dock.vendor) {
      setSelectedConnector(dock.vendor);
    }
  }, [dock.vendor]);

  const filteredData = selectedConnector
    ? healthData.filter(h => h.connectorId === selectedConnector)
    : healthData;

  return (
    <div className="dock-health">
      <div className="section-header">
        <h4>💚 Sağlık Durumu</h4>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="status-text">
            {isConnected ? 'Canlı' : 'Bağlantı Kesik'}
          </span>
        </div>
      </div>

      {!isConnected && (
        <div className="warning-banner">
          ⚠️ WebSocket bağlantısı kurulamadı. Gerçek zamanlı veri akışı devre dışı.
        </div>
      )}

      <div className="health-list">
        {filteredData.map(data => (
          <HealthCard key={data.connectorId} data={data} />
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="empty-state">
          <p>Henüz sağlık verisi yok.</p>
          <p className="hint">WebSocket bağlantısı kurulduğunda veriler burada görünecek.</p>
        </div>
      )}

      <style jsx>{`
        .dock-health {
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

        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #888;
        }

        .status-dot.connected {
          background: #2ed573;
          box-shadow: 0 0 8px rgba(46, 213, 115, 0.5);
          animation: pulse 2s infinite;
        }

        .status-dot.disconnected {
          background: #ff4757;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-text {
          font-size: 0.75rem;
          color: rgba(245, 245, 245, 0.7);
          font-weight: 600;
        }

        .warning-banner {
          background: rgba(255, 159, 64, 0.15);
          border: 1px solid rgba(255, 159, 64, 0.3);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
          color: #ff9f40;
          font-size: 0.8125rem;
          line-height: 1.5;
        }

        .health-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: rgba(245, 245, 245, 0.5);
        }

        .empty-state .hint {
          font-size: 0.8125rem;
          margin-top: 0.5rem;
          color: rgba(245, 245, 245, 0.4);
        }
      `}</style>
    </div>
  );
}

function HealthCard({ data }: { data: HealthData }) {
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
    <div className="health-card">
      <div className="card-header">
        <div className="connector-info">
          <span className="connector-icon">🔌</span>
          <span className="connector-name">{data.connectorId}</span>
        </div>
        <div className="status-badge" style={{ 
          backgroundColor: `${getStatusColor(data.status)}20`, 
          color: getStatusColor(data.status) 
        }}>
          {getStatusText(data.status)}
        </div>
      </div>

      <div className="uptime-section">
        <div className="uptime-label">Uptime</div>
        <div className="uptime-bar">
          <div className="uptime-fill" style={{ width: `${data.uptime}%` }} />
        </div>
        <div className="uptime-value">{data.uptime.toFixed(2)}%</div>
      </div>

      <div className="latency-section">
        <div className="section-title">Gecikme (Latency)</div>
        <div className="latency-row">
          <div className="latency-item">
            <span className="latency-label">p50</span>
            <span className="latency-value">{data.latency_p50}ms</span>
          </div>
          <div className="latency-item">
            <span className="latency-label">p95</span>
            <span className="latency-value">{data.latency_p95}ms</span>
          </div>
          <div className="latency-item">
            <span className="latency-label">p99</span>
            <span className="latency-value">{data.latency_p99}ms</span>
          </div>
        </div>
      </div>

      <div className="checks-section">
        <div className="section-title">Sistem Kontrolleri</div>
        <div className="checks-grid">
          <div className="check-item">
            <span className={`check-icon ${data.checks.database ? 'success' : 'error'}`}>
              {data.checks.database ? '✓' : '✗'}
            </span>
            <span className="check-label">Database</span>
          </div>
          <div className="check-item">
            <span className={`check-icon ${data.checks.api ? 'success' : 'error'}`}>
              {data.checks.api ? '✓' : '✗'}
            </span>
            <span className="check-label">API</span>
          </div>
          <div className="check-item">
            <span className={`check-icon ${data.checks.cache ? 'success' : 'error'}`}>
              {data.checks.cache ? '✓' : '✗'}
            </span>
            <span className="check-label">Cache</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <span className="last-check">
          Son kontrol: {new Date(data.lastCheck).toLocaleTimeString('tr-TR')}
        </span>
      </div>

      <style jsx>{`
        .health-card {
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

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .uptime-section {
          margin-bottom: 1rem;
        }

        .uptime-label {
          font-size: 0.75rem;
          color: rgba(245, 245, 245, 0.6);
          margin-bottom: 0.5rem;
        }

        .uptime-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .uptime-fill {
          height: 100%;
          background: linear-gradient(90deg, #2ed573 0%, #26d07c 100%);
          transition: width 0.3s ease;
        }

        .uptime-value {
          font-size: 0.875rem;
          color: #2ed573;
          font-weight: 700;
        }

        .section-title {
          font-size: 0.75rem;
          color: rgba(245, 245, 245, 0.6);
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .latency-section {
          margin-bottom: 1rem;
        }

        .latency-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .latency-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
        }

        .latency-label {
          font-size: 0.6875rem;
          color: rgba(245, 245, 245, 0.5);
          margin-bottom: 0.25rem;
        }

        .latency-value {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #d4af37;
        }

        .checks-section {
          margin-bottom: 1rem;
        }

        .checks-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .check-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
        }

        .check-icon {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .check-icon.success {
          color: #2ed573;
        }

        .check-icon.error {
          color: #ff4757;
        }

        .check-label {
          font-size: 0.6875rem;
          color: rgba(245, 245, 245, 0.6);
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
