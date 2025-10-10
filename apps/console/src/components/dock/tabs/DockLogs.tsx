/**
 * 📝 Dock Logs Tab
 * Real-time log viewer with filtering
 * 
 * @module components/dock/tabs/DockLogs
 * @white-hat Compliant
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../../state/store';
import { useWebSocket } from '../../../hooks/useWebSocket';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  connectorId: string;
  message: string;
  metadata?: Record<string, any>;
}

export default function DockLogs() {
  const dock = useAppStore(state => state.dock);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState({
    level: 'all',
    search: '',
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // WebSocket ile canlı loglar
  const { isConnected } = useWebSocket({
    url: 'ws://localhost:3100/api/logs/stream',
    onMessage: (data) => {
      if (data.type === 'log') {
        setLogs(prev => [...prev, data.payload].slice(-100)); // Son 100 log
      }
    },
  });

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    // Connector filtresi
    if (dock.vendor && log.connectorId !== dock.vendor) {
      return false;
    }

    // Level filtresi
    if (filter.level !== 'all' && log.level !== filter.level) {
      return false;
    }

    // Arama filtresi
    if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }

    return true;
  });

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="dock-logs">
      <div className="section-header">
        <h4>📝 Sistem Logları</h4>
        <div className="header-controls">
          <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="dot" />
            {isConnected ? 'Canlı' : 'Kapalı'}
          </div>
          <button className="clear-btn" onClick={clearLogs} title="Logları Temizle">
            🗑️
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Seviye:</label>
          <select
            value={filter.level}
            onChange={(e) => setFilter(prev => ({ ...prev, level: e.target.value }))}
            className="filter-select"
          >
            <option value="all">Tümü</option>
            <option value="info">Info</option>
            <option value="warn">Uyarı</option>
            <option value="error">Hata</option>
            <option value="debug">Debug</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Ara:</label>
          <input
            type="text"
            value={filter.search}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Log mesajında ara..."
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <span>Otomatik kaydır</span>
          </label>
        </div>
      </div>

      <div className="logs-container">
        {filteredLogs.length === 0 ? (
          <div className="empty-state">
            {logs.length === 0 ? (
              <p>Henüz log girişi yok. WebSocket bağlantısı kurulduğunda loglar burada görünecek.</p>
            ) : (
              <p>Filtre kriterlerine uygun log bulunamadı.</p>
            )}
          </div>
        ) : (
          filteredLogs.map(log => <LogEntry key={log.id} log={log} />)
        )}
        <div ref={logsEndRef} />
      </div>

      <div className="logs-footer">
        {filteredLogs.length} / {logs.length} log görüntüleniyor
      </div>

      <style jsx>{`
        .dock-logs {
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .section-header h4 {
          margin: 0;
          color: #d4af37;
          font-size: 1rem;
          font-weight: 600;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .connection-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
        }

        .connection-indicator.connected {
          color: #2ed573;
        }

        .connection-indicator.disconnected {
          color: #ff4757;
        }

        .connection-indicator .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .connection-indicator.connected .dot {
          animation: pulse 2s infinite;
        }

        .clear-btn {
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 6px;
          padding: 0.375rem 0.75rem;
          color: #d4af37;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-btn:hover {
          background: rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.5);
        }

        .filters {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .filter-group label {
          font-size: 0.8125rem;
          color: rgba(245, 245, 245, 0.7);
          white-space: nowrap;
        }

        .filter-select,
        .filter-input {
          flex: 1;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 6px;
          color: #f5f5f5;
          font-size: 0.8125rem;
        }

        .filter-select:focus,
        .filter-input:focus {
          outline: none;
          border-color: rgba(212, 175, 55, 0.5);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          cursor: pointer;
        }

        .logs-container {
          flex: 1;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 0.75rem;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 0.8125rem;
        }

        .logs-container::-webkit-scrollbar {
          width: 6px;
        }

        .logs-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }

        .logs-container::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 3px;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: rgba(245, 245, 245, 0.5);
          line-height: 1.6;
        }

        .logs-footer {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
          font-size: 0.75rem;
          color: rgba(245, 245, 245, 0.6);
          text-align: center;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function LogEntry({ log }: { log: LogEntry }) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return '#3498db';
      case 'warn': return '#ff9f40';
      case 'error': return '#ff4757';
      case 'debug': return '#888';
      default: return '#f5f5f5';
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      case 'debug': return '🐛';
      default: return '📝';
    }
  };

  const time = new Date(log.timestamp).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="log-entry">
      <div className="log-time">{time}</div>
      <div className="log-level" style={{ color: getLevelColor(log.level) }}>
        {getLevelBadge(log.level)} {log.level.toUpperCase()}
      </div>
      <div className="log-connector">[{log.connectorId}]</div>
      <div className="log-message">{log.message}</div>

      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <details className="log-metadata">
          <summary>Detaylar</summary>
          <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
        </details>
      )}

      <style jsx>{`
        .log-entry {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.5rem;
          margin-bottom: 0.25rem;
          border-radius: 4px;
          transition: background 0.2s;
          flex-wrap: wrap;
        }

        .log-entry:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .log-time {
          color: rgba(245, 245, 245, 0.5);
          font-size: 0.75rem;
          white-space: nowrap;
        }

        .log-level {
          font-weight: 700;
          font-size: 0.75rem;
          white-space: nowrap;
        }

        .log-connector {
          color: #d4af37;
          font-size: 0.75rem;
          white-space: nowrap;
        }

        .log-message {
          flex: 1;
          color: #f5f5f5;
          word-break: break-word;
        }

        .log-metadata {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .log-metadata summary {
          cursor: pointer;
          color: rgba(245, 245, 245, 0.7);
          margin-bottom: 0.5rem;
        }

        .log-metadata pre {
          margin: 0;
          color: rgba(245, 245, 245, 0.8);
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
