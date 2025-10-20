/**
 * =Â DockPanel - Sticky Right Sidebar with Tabs
 *
 * Features:
 * - Sticky right sidebar (300px)
 * - Multiple tabs: Geçmi_, Favoriler, Ayarlar
 * - Collapsible
 * - Glassmorphism design (Analydian Premium)
 * - Turkish labels by default
 *
 * @module components/unified/dock
 */

'use client';

import React, { useState } from 'react';

// ============================================================================
// Types
// ============================================================================

type DockTab = 'history' | 'favorites' | 'settings';

interface DockPanelProps {
  locale?: string;
  defaultTab?: DockTab;
}

interface HistoryItem {
  id: string;
  query: string;
  timestamp: number;
  action: string;
}

// ============================================================================
// Tab Labels
// ============================================================================

const TAB_LABELS: Record<string, Record<DockTab, string>> = {
  tr: {
    history: 'Geçmi_',
    favorites: 'Favoriler',
    settings: 'Ayarlar',
  },
  en: {
    history: 'History',
    favorites: 'Favorites',
    settings: 'Settings',
  },
};

// ============================================================================
// DockPanel Component
// ============================================================================

export function DockPanel({
  locale = 'tr',
  defaultTab = 'history',
}: DockPanelProps) {
  const [activeTab, setActiveTab] = useState<DockTab>(defaultTab);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const labels = TAB_LABELS[locale] || TAB_LABELS['tr'];

  // Mock data for demonstration
  const mockHistory: HistoryItem[] = [
    {
      id: '1',
      query: 'Aras kargo 1234567890 takip',
      timestamp: Date.now() - 300000,
      action: 'shipment.track',
    },
    {
      id: '2',
      query: 'Trendyol ürün ara',
      timestamp: Date.now() - 600000,
      action: 'product.sync',
    },
    {
      id: '3',
      query: '250 bin TL kredi kar_1la_t1r',
      timestamp: Date.now() - 900000,
      action: 'loan.compare',
    },
  ];

  return (
    <div className={`dock-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse Toggle */}
      <button
        className="collapse-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Geni_let' : 'Daralt'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          {isCollapsed ? (
            <path
              d="M6 12L10 8L6 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </button>

      {!isCollapsed && (
        <div className="dock-content">
          {/* Tab Navigation */}
          <div className="dock-tabs">
            {(['history', 'favorites', 'settings'] as DockTab[]).map((tab) => (
              <button
                key={tab}
                className={`dock-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {labels[tab]}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="dock-tab-content">
            {activeTab === 'history' && (
              <div className="history-list">
                {mockHistory.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-query">{item.query}</div>
                    <div className="history-meta">
                      <span className="history-action">{item.action}</span>
                      <span className="history-time">
                        {new Date(item.timestamp).toLocaleTimeString(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M24 4L29.09 18.91L44 24L29.09 29.09L24 44L18.91 29.09L4 24L18.91 18.91L24 4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
                <p>Henüz favori yok</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-list">
                <div className="settings-item">
                  <label className="settings-label">Otomatik Tercüme</label>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="settings-item">
                  <label className="settings-label">Bildirimler</label>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="settings-item">
                  <label className="settings-label">Koyu Tema</label>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .dock-panel {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 320px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          border-left: 1px solid rgba(255, 215, 0, 0.1);
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
        }

        .dock-panel.collapsed {
          width: 48px;
        }

        .collapse-toggle {
          position: absolute;
          top: 20px;
          left: 16px;
          width: 32px;
          height: 32px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 8px;
          color: rgba(255, 215, 0, 0.8);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .collapse-toggle:hover {
          background: rgba(255, 215, 0, 0.2);
          transform: scale(1.05);
        }

        .dock-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding-top: 64px;
          overflow: hidden;
        }

        .dock-tabs {
          display: flex;
          padding: 0 16px;
          gap: 8px;
          border-bottom: 1px solid rgba(255, 215, 0, 0.1);
        }

        .dock-tab {
          flex: 1;
          padding: 12px 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dock-tab:hover {
          color: rgba(255, 255, 255, 0.9);
        }

        .dock-tab.active {
          color: rgba(255, 215, 0, 0.9);
          border-bottom-color: rgba(255, 215, 0, 0.8);
        }

        .dock-tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .history-item {
          padding: 12px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 215, 0, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .history-item:hover {
          background: rgba(0, 0, 0, 0.6);
          border-color: rgba(255, 215, 0, 0.3);
        }

        .history-query {
          color: #fff;
          font-size: 14px;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .history-action {
          color: rgba(255, 215, 0, 0.7);
        }

        .history-time {
          color: rgba(255, 255, 255, 0.5);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
        }

        .empty-state svg {
          color: rgba(255, 215, 0, 0.3);
          margin-bottom: 16px;
        }

        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .settings-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 215, 0, 0.1);
          border-radius: 12px;
        }

        .settings-label {
          color: #fff;
          font-size: 14px;
        }

        input[type='checkbox'] {
          width: 40px;
          height: 20px;
          appearance: none;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        input[type='checkbox']:checked {
          background: rgba(255, 215, 0, 0.6);
        }

        input[type='checkbox']::before {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          top: 2px;
          left: 2px;
          transition: all 0.3s ease;
        }

        input[type='checkbox']:checked::before {
          left: 22px;
        }
      `}</style>
    </div>
  );
}

export default DockPanel;
