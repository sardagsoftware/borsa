/**
 * ⚙️ Dock Settings Tab
 * Enhanced settings panel
 * 
 * @module components/dock/tabs/DockSettings
 * @white-hat Compliant
 */

'use client';

import React, { useState } from 'react';
import { useAppStore, type AppState } from '../../../state/store';
import { trackAction } from '../../../lib/telemetry';

export default function DockSettings() {
  const user = useAppStore((state: AppState) => state.user);
  const flags = useAppStore((state: AppState) => state.flags);
  const setUser = useAppStore((state: AppState) => state.setUser);
  const setFlags = useAppStore((state: AppState) => state.setFlags);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    setUser({ theme });
    trackAction('settings_theme_change', { theme });
  };

  const handleFlagToggle = (flag: string, value: boolean) => {
    setFlags({ [flag]: value });
    trackAction('settings_flag_toggle', { flag, value });
  };

  return (
    <div className="dock-settings">
      <div className="settings-section">
        <h4>🎨 Görünüm</h4>

        <div className="setting-item">
          <label>Tema</label>
          <div className="theme-selector">
            {(['auto', 'dark', 'light'] as const).map(theme => (
              <button
                key={theme}
                className={`theme-btn ${user.theme === theme ? 'active' : ''}`}
                onClick={() => handleThemeChange(theme)}
              >
                {theme === 'auto' && '🌓 Otomatik'}
                {theme === 'dark' && '🌙 Koyu'}
                {theme === 'light' && '☀️ Açık'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h4>🌍 Dil & Bölge</h4>

        <div className="setting-item">
          <label>Dil</label>
          <div className="value">{user.locale.toUpperCase()}</div>
          <div className="hint">Üst menüden değiştirebilirsiniz</div>
        </div>

        <div className="setting-item">
          <label>Persona</label>
          <div className="value">{user.persona}</div>
          <div className="hint">Üst menüden değiştirebilirsiniz</div>
        </div>
      </div>

      <div className="settings-section">
        <h4>🔐 Güvenlik & Yetkiler</h4>

        <div className="setting-item">
          <label>Kullanıcı Scopeları</label>
          <div className="scopes-list">
            {user.scopes.map(scope => (
              <div key={scope} className="scope-badge">
                <span className="scope-icon">🔒</span>
                <span className="scope-text">{scope}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h4>⚡ Özellikler</h4>

        <div className="setting-item">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={flags.telemetry_enabled}
              onChange={(e) => handleFlagToggle('telemetry_enabled', e.target.checked)}
            />
            <span>Telemetri (Kullanıcı izleme)</span>
          </label>
          <div className="hint">Kullanım verilerini toplama</div>
        </div>

        <div className="setting-item">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={flags.intent_suggestions_enabled}
              onChange={(e) => handleFlagToggle('intent_suggestions_enabled', e.target.checked)}
            />
            <span>Intent Önerileri</span>
          </label>
          <div className="hint">Akıllı işlem önerileri göster</div>
        </div>

        <div className="setting-item">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={flags.performance_monitoring}
              onChange={(e) => handleFlagToggle('performance_monitoring', e.target.checked)}
            />
            <span>Performans İzleme</span>
          </label>
          <div className="hint">Uygulama performansını takip et</div>
        </div>
      </div>

      <div className="settings-section">
        <button
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▼' : '▶'} Gelişmiş Ayarlar
        </button>

        {showAdvanced && (
          <div className="advanced-settings">
            <div className="setting-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={flags.ui_premium_theme}
                  onChange={(e) => handleFlagToggle('ui_premium_theme', e.target.checked)}
                />
                <span>Premium Tema</span>
              </label>
            </div>

            <div className="setting-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={flags.ui_dock_panel_enabled}
                  onChange={(e) => handleFlagToggle('ui_dock_panel_enabled', e.target.checked)}
                />
                <span>Dock Panel</span>
              </label>
            </div>

            <div className="setting-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={flags.rtl_support}
                  onChange={(e) => handleFlagToggle('rtl_support', e.target.checked)}
                />
                <span>RTL Desteği</span>
              </label>
            </div>

            <div className="setting-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={flags.rbac_scope_checks}
                  onChange={(e) => handleFlagToggle('rbac_scope_checks', e.target.checked)}
                />
                <span>RBAC Kontrolleri</span>
              </label>
            </div>

            <div className="setting-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={flags.legal_gates_enforced}
                  onChange={(e) => handleFlagToggle('legal_gates_enforced', e.target.checked)}
                />
                <span>Yasal Kontroller</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="settings-footer">
        <div className="version-info">
          <span className="version-label">Lydian-IQ</span>
          <span className="version-value">v4.1 Unified Surface</span>
        </div>
        <div className="compliance-badges">
          <span className="badge">🔒 KVKK/GDPR</span>
          <span className="badge">🎩 White-hat</span>
        </div>
      </div>

      <style jsx>{`
        .dock-settings {
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .settings-section {
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
        }

        .settings-section:last-child {
          border-bottom: none;
        }

        .settings-section h4 {
          margin: 0 0 1rem 0;
          color: #d4af37;
          font-size: 0.9375rem;
          font-weight: 600;
        }

        .setting-item {
          margin-bottom: 1rem;
        }

        .setting-item:last-child {
          margin-bottom: 0;
        }

        .setting-item label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: rgba(245, 245, 245, 0.9);
          margin-bottom: 0.5rem;
        }

        .value {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 6px;
          font-size: 0.8125rem;
          color: #d4af37;
          font-weight: 600;
        }

        .hint {
          margin-top: 0.25rem;
          font-size: 0.6875rem;
          color: rgba(245, 245, 245, 0.5);
          line-height: 1.4;
        }

        .theme-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .theme-btn {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 8px;
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .theme-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(212, 175, 55, 0.3);
        }

        .theme-btn.active {
          background: rgba(212, 175, 55, 0.15);
          border-color: rgba(212, 175, 55, 0.5);
          color: #d4af37;
        }

        .scopes-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .scope-badge {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: rgba(212, 175, 55, 0.15);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 16px;
          font-size: 0.75rem;
        }

        .scope-icon {
          font-size: 0.875rem;
        }

        .scope-text {
          color: #d4af37;
          font-weight: 600;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .toggle-label input[type="checkbox"] {
          cursor: pointer;
          width: 18px;
          height: 18px;
        }

        .advanced-toggle {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 8px;
          color: #d4af37;
          font-size: 0.875rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .advanced-toggle:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(212, 175, 55, 0.3);
        }

        .advanced-settings {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .settings-footer {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
        }

        .version-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .version-label {
          font-size: 0.75rem;
          color: rgba(245, 245, 245, 0.6);
        }

        .version-value {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #d4af37;
        }

        .compliance-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .badge {
          padding: 0.375rem 0.75rem;
          background: rgba(46, 213, 115, 0.15);
          border: 1px solid rgba(46, 213, 115, 0.3);
          border-radius: 12px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: #2ed573;
        }
      `}</style>
    </div>
  );
}
