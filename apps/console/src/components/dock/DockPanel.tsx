/**
 * 🎛️ Dock Panel Component (Full Implementation - Phase 3)
 * Right sidebar with enhanced tabs
 * 
 * @module components/dock/DockPanel
 * @white-hat Compliant
 */

'use client';

import React from 'react';
import { useAppStore } from '../../state/store';
import DockOverview from './tabs/DockOverview';
import DockHealth from './tabs/DockHealth';
import DockRateLimit from './tabs/DockRateLimit';
import DockLogs from './tabs/DockLogs';
import DockSettings from './tabs/DockSettings';

export default function DockPanel() {
  const dock = useAppStore(state => state.dock);
  const closeDock = useAppStore(state => state.closeDock);
  const setDockTab = useAppStore(state => state.setDockTab);

  const tabs = [
    { id: 'overview', label: 'Genel', icon: '📊' },
    { id: 'health', label: 'Sağlık', icon: '💚' },
    { id: 'ratelimit', label: 'Limit', icon: '⏱️' },
    { id: 'logs', label: 'Loglar', icon: '📝' },
    { id: 'settings', label: 'Ayarlar', icon: '⚙️' },
  ] as const;

  return (
    <div className="dock-panel">
      {/* Header */}
      <div className="dock-header">
        <h3 className="dock-title">
          {dock.vendor ? `${dock.vendor} Panel` : 'Dock Panel'}
        </h3>
        <button className="close-btn" onClick={closeDock} title="Kapat">
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="dock-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${dock.tab === tab.id ? 'active' : ''}`}
            onClick={() => setDockTab(tab.id as any)}
            title={tab.label}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="dock-content">
        {dock.tab === 'overview' && <DockOverview />}
        {dock.tab === 'health' && <DockHealth />}
        {dock.tab === 'ratelimit' && <DockRateLimit />}
        {dock.tab === 'logs' && <DockLogs />}
        {dock.tab === 'settings' && <DockSettings />}
      </div>

      <style jsx>{`
        .dock-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: rgba(0, 0, 0, 0.3);
        }

        .dock-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
          background: rgba(0, 0, 0, 0.2);
        }

        .dock-title {
          font-size: 1rem;
          font-weight: 600;
          color: #d4af37;
          margin: 0;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: rgba(245, 245, 245, 0.6);
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #f5f5f5;
        }

        .dock-tabs {
          display: flex;
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
          padding: 0 1rem;
          background: rgba(0, 0, 0, 0.15);
        }

        .tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.75rem 0.5rem;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #d4af37;
          background: rgba(212, 175, 55, 0.05);
        }

        .tab.active {
          color: #d4af37;
          border-bottom-color: #d4af37;
          background: rgba(212, 175, 55, 0.08);
        }

        .tab-icon {
          font-size: 1.25rem;
        }

        .tab-label {
          font-weight: 600;
        }

        .dock-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        /* Scrollbar */
        .dock-content::-webkit-scrollbar {
          width: 6px;
        }

        .dock-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }

        .dock-content::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 3px;
        }

        .dock-content::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.5);
        }
      `}</style>
    </div>
  );
}
