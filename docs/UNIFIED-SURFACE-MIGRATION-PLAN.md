# 🚀 Lydian-IQ Unified Surface - Migration Plan v4.1

**Status:** 🔄 In Progress
**Started:** 2025-10-10
**Est. Completion:** 2-3 days (8-10 hours active work)
**Architect:** AX9F7E2B Code

---

## 📊 Current State (v4.0)

✅ **Completed:**
- Connector API adapter (white-hat, real/mock)
- Intent engine V2 (TR-aware, null-safe)
- Security guards (SSRF/CSRF/XSS)
- Telemetry system
- Auto-scroll fix
- Feature flags system
- Documentation (61KB)

⚠️ **Current Limitations:**
- HTML-based (not React)
- No unified layout (chat + dock in one screen)
- No state management
- Basic theme (not premium Black-Gold)
- No RBAC scope checks
- No legal gate CTAs

---

## 🎯 Target State (v4.1 Unified Surface)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        LayoutRoot.tsx                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Header                             │  │
│  │  GlobalSearch + Persona Switch + Locale Selector      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Main (Grid: chat + dock)                             │  │
│  │  ┌────────────────────┬──────────────────────────┐   │  │
│  │  │  MessageSurface    │   DockPanel (sticky)     │   │  │
│  │  │  (flex-1)          │   (380px width)          │   │  │
│  │  │                    │                          │   │  │
│  │  │  - AI messages     │  Tabs:                   │   │  │
│  │  │  - User messages   │  - Overview              │   │  │
│  │  │  - Inline cards    │  - Health                │   │  │
│  │  │  - Intent chips    │  - RateLimit             │   │  │
│  │  │                    │  - Logs                  │   │  │
│  │  │                    │  - Settings              │   │  │
│  │  └────────────────────┴──────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                ComposerBar (sticky bottom)            │  │
│  │  Multi-line input + Intent suggestions + Send        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### State Management (Zustand)

```typescript
interface AppState {
  // Messages
  messages: Message[];
  addMessage: (msg: Message) => void;
  
  // Intents
  intents: Intent[];
  setIntents: (intents: Intent[]) => void;
  
  // Dock
  dock: {
    open: boolean;
    tab: 'overview' | 'health' | 'logs' | 'settings';
    vendor?: string;
  };
  openDock: (vendor: string, tab?: string) => void;
  closeDock: () => void;
  
  // Flags
  flags: FeatureFlags;
  setFlags: (flags: FeatureFlags) => void;
  
  // User
  user: {
    scopes: string[];
    locale: string;
    persona: string;
  };
  
  // UI State
  busy: boolean;
  setBusy: (busy: boolean) => void;
}
```

---

## 📋 Implementation Phases

### ✅ Phase 0: Foundation (COMPLETE)
- [x] Feature flags system
- [x] Intent engine V2
- [x] Connector API adapter
- [x] Security guards
- [x] Telemetry

### 🔄 Phase 1: Core Infrastructure (2 hours)
- [ ] Zustand store setup
- [ ] TypeScript types
- [ ] Feature flag loader
- [ ] API client with RBAC
- [ ] Error boundaries

**Files:**
- `apps/console/src/state/store.ts`
- `apps/console/src/types/app.ts`
- `apps/console/src/lib/flags.ts`
- `apps/console/src/lib/api-client.ts`
- `apps/console/src/components/ErrorBoundary.tsx`

### 🔄 Phase 2: Layout Components (2 hours)
- [ ] LayoutRoot.tsx
- [ ] Header.tsx
- [ ] MessageSurface.tsx
- [ ] ComposerBar.tsx
- [ ] GlobalSearch.tsx

**Files:**
- `apps/console/src/app/lydian-iq/layout/LayoutRoot.tsx`
- `apps/console/src/components/layout/Header.tsx`
- `apps/console/src/components/chat/MessageSurface.tsx`
- `apps/console/src/components/chat/ComposerBar.tsx`
- `apps/console/src/components/search/GlobalSearch.tsx`

### ⏳ Phase 3: Dock Panel (2 hours)
- [ ] DockPanel.tsx (refactor existing)
- [ ] DockTabs component
- [ ] DockOverview tab
- [ ] DockHealth tab (WebSocket)
- [ ] DockLogs tab
- [ ] DockSettings tab

**Files:**
- `apps/console/src/components/dock/DockPanel.tsx`
- `apps/console/src/components/dock/tabs/*.tsx`

### ⏳ Phase 4: Premium Theme (1 hour)
- [ ] Black-Gold color tokens
- [ ] Glassmorphism CSS
- [ ] Dark/Light theme toggle
- [ ] A11y AA compliance
- [ ] Focus rings

**Files:**
- `apps/console/src/styles/theme.css`
- `apps/console/src/styles/glassmorphism.css`

### ⏳ Phase 5: RBAC & Legal Gates (1 hour)
- [ ] Scope checker utility
- [ ] RBAC wrapper component
- [ ] Legal gate CTAs
- [ ] Partner application flow

**Files:**
- `apps/console/src/lib/rbac.ts`
- `apps/console/src/components/auth/ScopeGate.tsx`
- `apps/console/src/components/auth/LegalGate.tsx`

### ⏳ Phase 6: Demo Routes Disable (30min)
- [ ] Route guard middleware
- [ ] Feature flag check
- [ ] 404 for demo pages in prod

**Files:**
- `middleware.ts`
- `apps/console/src/lib/route-guard.ts`

### ⏳ Phase 7: Documentation (30min)
- [ ] UNIFIED-SURFACE-GUIDE.md
- [ ] Component documentation
- [ ] Screenshots
- [ ] Migration guide

**Files:**
- `docs/UNIFIED-SURFACE-GUIDE.md`
- `docs/COMPONENT-API.md`

### ⏳ Phase 8: Testing & Deployment (1 hour)
- [ ] E2E tests (Playwright)
- [ ] A11y tests
- [ ] Performance tests
- [ ] Zero-error validation
- [ ] Production deployment

---

## 🚀 Quick Start (Next Steps)

### Step 1: Install Dependencies (if needed)

```bash
cd apps/console
npm install zustand immer
npm install --save-dev @types/node
```

### Step 2: Create Core Infrastructure

```bash
# State management
touch apps/console/src/state/store.ts
touch apps/console/src/types/app.ts

# Layout
mkdir -p apps/console/src/app/lydian-iq/layout
touch apps/console/src/app/lydian-iq/layout/LayoutRoot.tsx

# Dock
mkdir -p apps/console/src/components/dock/tabs
```

### Step 3: Run Development Server

```bash
cd apps/console
npm run dev
```

### Step 4: Test Unified Surface

```
http://localhost:3000/lydian-iq
```

---

## ⚠️ Migration Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing features | High | Feature flags + parallel deployment |
| State management complexity | Medium | Use Zustand (simple API) |
| Performance regression | Medium | Code splitting + lazy loading |
| A11y issues | Low | Built-in from start + tests |
| Bundle size increase | Medium | Tree shaking + dynamic imports |

---

## 📊 Success Metrics

✅ **Acceptance Criteria:**
- [ ] Single screen: chat + dock + search all visible
- [ ] Natural language queries work
- [ ] Dock panel opens/closes smoothly
- [ ] Premium theme active
- [ ] RBAC scope checks enforced
- [ ] Legal gates shown for partner_required
- [ ] Demo routes disabled in prod
- [ ] 0 console errors
- [ ] Lighthouse score ≥95
- [ ] p95 latency <2s

---

## 🔗 Related Documents

- [v4.0 Roadmap](./LYDIAN-IQ-V4-ROADMAP.md)
- [Connector Matrix](./CONNECTOR-REAL-DATA-MATRIX.md)
- [White-Hat Policy](./WHITE-HAT-POLICY-V4.md)
- [Runbook](./LYDIAN-IQ-V4-RUNBOOK.md)

---

**Next Action:** Start Phase 1 (Core Infrastructure)

**Command:**
```bash
# Create state store
cat > apps/console/src/state/store.ts << 'EOF'
// See implementation below
EOF
```
