/**
 * 🎨 Layout Root - Unified Surface
 * Main application layout: Header + Chat + Dock + Composer
 * 
 * @module app/lydian-iq/layout/LayoutRoot
 * @white-hat Compliant
 */

'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '../../../state/store';
import ErrorBoundary from '../../../components/ErrorBoundary';
import Header from '../../../components/layout/Header';
import MessageSurface from '../../../components/chat/MessageSurface';
import ComposerBar from '../../../components/chat/ComposerBar';
import DockPanel from '../../../components/dock/DockPanel';
import { trackPageView } from '../../../lib/telemetry';

export default function LayoutRoot() {
  const flags = useAppStore(state => state.flags);
  const dock = useAppStore(state => state.dock);

  useEffect(() => {
    // Track page view
    trackPageView('/lydian-iq');

    // Load feature flags
    useAppStore.getState().loadFlags();
  }, []);

  // Feature flag check
  if (!flags.ui_unified_surface) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>⚠️ Unified Surface Devre Dışı</h1>
        <p>Bu özellik feature flags ile kapatılmış.</p>
        <code>ui_unified_surface: false</code>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="layout-root">
        {/* Header: Global search + Persona + Locale */}
        <Header />

        {/* Main: Chat + Dock */}
        <main className="main-container">
          <div className="content-grid">
            {/* Left: Message surface */}
            <div className="message-column">
              <MessageSurface />
            </div>

            {/* Right: Dock panel (conditional) */}
            {flags.ui_dock_panel_enabled && dock.open && (
              <div className="dock-column">
                <DockPanel />
              </div>
            )}
          </div>
        </main>

        {/* Bottom: Composer bar (sticky) */}
        <ComposerBar />

        <style jsx>{`
          .layout-root {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
            color: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }

          .main-container {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .content-grid {
            display: grid;
            grid-template-columns: ${dock.open ? '1fr 380px' : '1fr'};
            gap: 0;
            height: 100%;
            overflow: hidden;
            transition: grid-template-columns 0.3s ease;
          }

          .message-column {
            overflow-y: auto;
            overflow-x: hidden;
            height: 100%;
            background: rgba(0, 0, 0, 0.2);
          }

          .dock-column {
            background: rgba(255, 255, 255, 0.03);
            border-left: 1px solid rgba(212, 175, 55, 0.2);
            overflow-y: auto;
            height: 100%;
          }

          /* Scrollbar styling (Premium Black-Gold) */
          .message-column::-webkit-scrollbar,
          .dock-column::-webkit-scrollbar {
            width: 8px;
          }

          .message-column::-webkit-scrollbar-track,
          .dock-column::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
          }

          .message-column::-webkit-scrollbar-thumb,
          .dock-column::-webkit-scrollbar-thumb {
            background: rgba(212, 175, 55, 0.3);
            border-radius: 4px;
          }

          .message-column::-webkit-scrollbar-thumb:hover,
          .dock-column::-webkit-scrollbar-thumb:hover {
            background: rgba(212, 175, 55, 0.5);
          }

          /* Responsive */
          @media (max-width: 768px) {
            .content-grid {
              grid-template-columns: 1fr;
            }

            .dock-column {
              position: fixed;
              top: 0;
              right: ${dock.open ? '0' : '-100%'};
              width: 100%;
              max-width: 380px;
              height: 100vh;
              z-index: 1000;
              transition: right 0.3s ease;
              box-shadow: -4px 0 12px rgba(0, 0, 0, 0.5);
            }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
