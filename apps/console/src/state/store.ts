/**
 * 🏪 Unified State Store - Zustand
 * Single source of truth for Lydian-IQ v4.1
 * 
 * @module state/store
 * @white-hat Compliant
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
export interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  connectorId?: string;
  intentId?: string;
}

export interface Intent {
  id: string;
  action: string;
  score: number;
  params: Record<string, any>;
  reason?: string;
}

export interface DockState {
  open: boolean;
  tab: 'overview' | 'health' | 'ratelimit' | 'logs' | 'settings';
  vendor?: string;
}

export interface FeatureFlags {
  ui_unified_surface: boolean;
  ui_disable_demo_routes: boolean;
  ui_inline_connector_cards: boolean;
  ui_dock_panel_enabled: boolean;
  i18n_system_enabled: boolean;
  rtl_support: boolean;
  ui_premium_theme: boolean;
  connector_auto_load: boolean;
  intent_suggestions_enabled: boolean;
  telemetry_enabled: boolean;
  legal_gates_enforced: boolean;
  rbac_scope_checks: boolean;
  performance_monitoring: boolean;
}

export interface User {
  id?: string;
  scopes: string[];
  locale: string;
  persona: string;
  theme?: 'light' | 'dark' | 'auto';
}

export interface AppState {
  // Messages
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Intents
  intents: Intent[];
  setIntents: (intents: Intent[]) => void;
  clearIntents: () => void;

  // Dock
  dock: DockState;
  openDock: (vendor: string, tab?: DockState['tab']) => void;
  closeDock: () => void;
  setDockTab: (tab: DockState['tab']) => void;

  // Flags
  flags: FeatureFlags;
  setFlags: (flags: Partial<FeatureFlags>) => void;
  loadFlags: () => Promise<void>;

  // User
  user: User;
  setUser: (user: Partial<User>) => void;
  setLocale: (locale: string) => void;
  setPersona: (persona: string) => void;

  // UI State
  busy: boolean;
  setBusy: (busy: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Telemetry
  telemetry: any[];
  addTelemetry: (event: any) => void;
}

// Default flags
const DEFAULT_FLAGS: FeatureFlags = {
  ui_unified_surface: true,
  ui_disable_demo_routes: true,
  ui_inline_connector_cards: true,
  ui_dock_panel_enabled: true,
  i18n_system_enabled: true,
  rtl_support: true,
  ui_premium_theme: true,
  connector_auto_load: true,
  intent_suggestions_enabled: true,
  telemetry_enabled: true,
  legal_gates_enforced: true,
  rbac_scope_checks: true,
  performance_monitoring: true,
};

// Default user
const DEFAULT_USER: User = {
  scopes: ['read:connectors', 'read:insights'],
  locale: 'tr',
  persona: 'lydian-turkey',
  theme: 'auto',
};

// Store
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        messages: [],
        intents: [],
        dock: { open: false, tab: 'overview' },
        flags: DEFAULT_FLAGS,
        user: DEFAULT_USER,
        busy: false,
        error: null,
        telemetry: [],

        // Message actions
        addMessage: (message) =>
          set((state) => {
            const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            state.messages.push({ ...message, id, timestamp: new Date() });
          }),

        clearMessages: () => set((state) => { state.messages = []; }),

        // Intent actions
        setIntents: (intents) => set((state) => { state.intents = intents; }),
        clearIntents: () => set((state) => { state.intents = []; }),

        // Dock actions
        openDock: (vendor, tab = 'overview') =>
          set((state) => {
            state.dock.open = true;
            state.dock.vendor = vendor;
            state.dock.tab = tab;
          }),

        closeDock: () => set((state) => { state.dock.open = false; }),
        setDockTab: (tab) => set((state) => { state.dock.tab = tab; }),

        // Flag actions
        setFlags: (flags) => set((state) => { state.flags = { ...state.flags, ...flags }; }),

        loadFlags: async () => {
          try {
            const response = await fetch('/ops/canary/feature-flags.json');
            const flags = await response.json();
            set((state) => { state.flags = { ...DEFAULT_FLAGS, ...flags }; });
          } catch (error) {
            console.warn('Failed to load feature flags, using defaults', error);
          }
        },

        // User actions
        setUser: (user) => set((state) => { state.user = { ...state.user, ...user }; }),
        setLocale: (locale) => set((state) => { state.user.locale = locale; }),
        setPersona: (persona) => set((state) => { state.user.persona = persona; }),

        // UI state actions
        setBusy: (busy) => set((state) => { state.busy = busy; }),
        setError: (error) => set((state) => { state.error = error; }),

        // Telemetry actions
        addTelemetry: (event) =>
          set((state) => {
            state.telemetry.push({ ...event, timestamp: new Date().toISOString() });
            if (state.telemetry.length > 100) state.telemetry.shift();
          }),
      })),
      {
        name: 'lydian-iq-storage',
        partialize: (state) => ({ user: state.user, flags: state.flags }),
      }
    ),
    { name: 'Lydian-IQ Store' }
  )
);

// Selectors
export const useMessages = () => useAppStore((state) => state.messages);
export const useIntents = () => useAppStore((state) => state.intents);
export const useDock = () => useAppStore((state) => state.dock);
export const useFlags = () => useAppStore((state) => state.flags);
export const useUser = () => useAppStore((state) => state.user);

// Initialize
if (typeof window !== 'undefined') {
  useAppStore.getState().loadFlags();
}
