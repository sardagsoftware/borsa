/**
 * 🎯 Header Component
 * Global search + Persona switch + Locale selector
 * 
 * @module components/layout/Header
 * @white-hat Compliant
 */

'use client';

import React, { useState } from 'react';
import { useAppStore, type AppState } from '../../state/store';
import GlobalSearch from '../search/GlobalSearch';
import { trackAction } from '../../lib/telemetry';

export default function Header() {
  const user = useAppStore((state: AppState) => state.user);
  const setPersona = useAppStore((state: AppState) => state.setPersona);
  const setLocale = useAppStore((state: AppState) => state.setLocale);
  const openDock = useAppStore((state: AppState) => state.openDock);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showLocaleMenu, setShowLocaleMenu] = useState(false);

  const personas = [
    { id: 'lydian-turkey', name: 'Lydian Turkey', flag: '🇹🇷' },
    { id: 'lydian-europe', name: 'Lydian Europe', flag: '🇪🇺' },
    { id: 'lydian-mena', name: 'Lydian MENA', flag: '🌍' },
  ];

  const locales = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  const handlePersonaChange = (personaId: string) => {
    setPersona(personaId);
    setShowPersonaMenu(false);
    trackAction('persona_change', { persona: personaId });
  };

  const handleLocaleChange = (localeCode: string) => {
    setLocale(localeCode);
    setShowLocaleMenu(false);
    trackAction('locale_change', { locale: localeCode });
    
    // RTL support
    const locale = locales.find(l => l.code === localeCode);
    if (locale?.rtl) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  const currentPersona = personas.find(p => p.id === user.persona) || personas[0];
  const currentLocale = locales.find(l => l.code === user.locale) || locales[0];

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo */}
        <div className="logo" onClick={() => window.location.href = '/'}>
          <span className="logo-icon">⚡</span>
          <span className="logo-text">Lydian-IQ</span>
          <span className="version">v4.1</span>
        </div>

        {/* Global Search */}
        <div className="search-container">
          <GlobalSearch />
        </div>

        {/* Controls */}
        <div className="controls">
          {/* Persona Switcher */}
          <div className="dropdown">
            <button
              className="control-btn"
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              title="Persona"
            >
              <span>{currentPersona.flag}</span>
              <span className="label">{currentPersona.name}</span>
              <span className="chevron">▼</span>
            </button>
            {showPersonaMenu && (
              <div className="dropdown-menu">
                {personas.map(persona => (
                  <button
                    key={persona.id}
                    className={`menu-item ${persona.id === user.persona ? 'active' : ''}`}
                    onClick={() => handlePersonaChange(persona.id)}
                  >
                    <span>{persona.flag}</span>
                    <span>{persona.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Locale Selector */}
          <div className="dropdown">
            <button
              className="control-btn"
              onClick={() => setShowLocaleMenu(!showLocaleMenu)}
              title="Dil / Language"
            >
              <span>{currentLocale.flag}</span>
              <span className="label">{currentLocale.name}</span>
              <span className="chevron">▼</span>
            </button>
            {showLocaleMenu && (
              <div className="dropdown-menu">
                {locales.map(locale => (
                  <button
                    key={locale.code}
                    className={`menu-item ${locale.code === user.locale ? 'active' : ''}`}
                    onClick={() => handleLocaleChange(locale.code)}
                  >
                    <span>{locale.flag}</span>
                    <span>{locale.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            className="control-btn icon-only"
            onClick={() => openDock('settings', 'settings')}
            title="Ayarlar"
          >
            ⚙️
          </button>
        </div>
      </div>

      <style jsx>{`
        .header {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
          padding: 0.75rem 1.5rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          max-width: 1920px;
          margin: 0 auto;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
          transition: opacity 0.2s;
        }

        .logo:hover {
          opacity: 0.8;
        }

        .logo-icon {
          font-size: 1.5rem;
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .version {
          font-size: 0.75rem;
          color: rgba(212, 175, 55, 0.6);
          font-weight: 600;
        }

        .search-container {
          flex: 1;
          max-width: 600px;
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .dropdown {
          position: relative;
        }

        .control-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 8px;
          color: #f5f5f5;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(212, 175, 55, 0.4);
        }

        .control-btn.icon-only {
          padding: 0.5rem;
          font-size: 1.25rem;
        }

        .label {
          display: none;
        }

        @media (min-width: 768px) {
          .label {
            display: inline;
          }
        }

        .chevron {
          font-size: 0.625rem;
          opacity: 0.6;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          min-width: 200px;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 8px;
          padding: 0.5rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }

        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: #f5f5f5;
          font-size: 0.875rem;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
        }

        .menu-item:hover {
          background: rgba(212, 175, 55, 0.1);
        }

        .menu-item.active {
          background: rgba(212, 175, 55, 0.2);
          font-weight: 600;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header-content {
            gap: 0.75rem;
          }

          .logo-text {
            display: none;
          }

          .search-container {
            max-width: none;
          }
        }
      `}</style>
    </header>
  );
}
