# 🌍 ECW EKOSISTEM BRIEF - v7.3
## Ethical Climate Wallet - Tam Entegre Sistem

**Tarih**: 17 Ekim 2025
**Durum**: 📋 PLANLAMA AŞAMASI
**Kapsam**: 4 Major Sprints (v7.3 → v7.3.4)
**Yaklaşım**: Top-Sende | 0 Hata | Beyaz-Şapkalı | Production-Grade

---

## 📊 MEVCUT DURUM ANALİZİ

### Mevcut Monorepo Yapısı ✅

**Apps** (11 mevcut):
- ✅ lci-api, lci-web - LCI (Lydian Commerce Intelligence)
- ✅ messaging - Mesajlaşma sistemi
- ✅ console - Admin konsolu
- ✅ chat - AI chat interface
- ✅ web, companion-pwa - Frontend uygulamalar

**Packages** (44 mevcut):
- ✅ privacy - DP implementation
- ✅ civic-grid - Grid data models
- ✅ trust-layer - Trust & proof systems
- ✅ governance - Policy enforcement
- ✅ esg - ESG metrics
- ✅ economy-optimizer - Economic optimization
- ✅ connectors-* - External integrations
- ✅ ai-* - AI adapters & routing

**Infrastructure**:
- ✅ Prisma schema mevcut (/infra/prisma/schema.prisma)
- ✅ Test infrastructure (Playwright + Jest)
- ✅ Monorepo tooling (pnpm workspaces)
- ✅ Vercel deployment pipeline

---

## 🎯 PROJE KAPSAMI

### 4 Ana Sprint

#### **Sprint v7.3: ECW Backend - Ethical Climate Wallet**
**Hedef**: Karbon/su/enerji/atık takip sistemi + etik puanlama

**Bileşenler**:
- Backend API (NestJS/Express)
- Prisma DB models (Wallet, Transaction, ProofOfImpact)
- Etik skorlama (Ω/Φ) engine
- Proof-of-Impact sistemi (JWS + RFC3161 + Merkle)
- Real-data entegrasyonları (NICO, IRSSA, TFE, QEE, CTPEH)

**Endpoint'ler**:
```
POST /v7.3/ecw/wallet/create
GET  /v7.3/ecw/wallet/:id
POST /v7.3/ecw/tx/log
GET  /v7.3/ecw/tx/history/:id
POST /v7.3/ecw/proof/verify
POST /v7.3/ecw/report/summary
```

---

#### **Sprint v7.3.1: ECW Mobile - React Native App**
**Hedef**: iOS/Android mobil cüzdan uygulaması

**Bileşenler**:
- React Native 0.74 + Expo
- Offline-first architecture (MMKV + React Query)
- QR code generation/scanning (Proof gösterimi)
- i18n (tr/en) + A11y (WCAG 2.2 AA)
- Biometric authentication
- Push notifications

**Screens**:
- Dashboard (KPIs: CO2/H2O/kWh/Waste, Ω/Φ)
- Wallet (bakiyeler + işlem geçmişi)
- New Transaction (manuel/otomatik)
- Proof Viewer (QR + verify)
- Reports (bölgesel özet + TFE projeksiyon)
- Settings (region/lang/a11y)

---

#### **Sprint v7.3.3: EEG - Ethical Exchange Gateway**
**Hedef**: ECW kredilerini gerçek hayata bağlama

**Bileşenler**:
- Partner integration API
- Credit translator (ECW → fiat)
- Proof-of-Exchange sistemi
- Partner yönetimi (utility, transit, POS, NGO)

**Use Cases**:
- ✅ Enerji faturası indirimi
- ✅ Ulaşım kartı yükleme
- ✅ Market POS ödemeleri
- ✅ NGO bağışları

**Endpoint'ler**:
```
POST /v7.3.3/eeg/partner/register
GET  /v7.3.3/eeg/partner/list
POST /v7.3.3/eeg/exchange/create
GET  /v7.3.3/eeg/exchange/history/:id
POST /v7.3.3/eeg/proof/verify
```

---

#### **Sprint v7.3.4: EGI - EcoGrid Integration**
**Hedef**: Şehir-ölçekli enerji ekosistemi entegrasyonu

**Bileşenler**:
- SCADA/AMI/DER/EV telemetry ingest
- Grid orchestration (setpoint/DR planning)
- Priority matrix (hospital > shelter > critical)
- Proof-of-Grid (PoG) sistemi
- Demand-response incentives

**Use Cases**:
- ✅ Talep-yanıt programları
- ✅ Batarya/EV charge/discharge optimization
- ✅ Yük kaydırma (shift)
- ✅ Kritik altyapı koruması
- ✅ Karbon azaltım metriği

**Endpoint'ler**:
```
POST /v7.3.4/egi/ingest/telemetry
GET  /v7.3.4/egi/telemetry/:nodeId
POST /v7.3.4/egi/plan
POST /v7.3.4/egi/act
POST /v7.3.4/egi/incentive
POST /v7.3.4/egi/proof/verify
POST /v7.3.4/egi/report/region
```

---

## 🏗️ MİMARİ TASARIM

### Yeni Eklenecek Apps

```
/apps/
├── ecw-api/              # Sprint v7.3 - Backend API
│   ├── src/
│   │   ├── wallet/       # Wallet CRUD
│   │   ├── transaction/  # Transaction logging
│   │   ├── proof/        # Proof-of-Impact
│   │   ├── report/       # Analytics & reporting
│   │   └── integrations/ # NICO, IRSSA, TFE, QEE
│   ├── prisma/           # ECW-specific schema
│   └── test/
│
├── ecw-mobile/           # Sprint v7.3.1 - React Native
│   ├── app/              # Expo Router screens
│   │   ├── wallet/
│   │   ├── reports/
│   │   └── settings/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── store/        # Zustand
│   │   ├── hooks/        # useSync, useWallet
│   │   ├── components/   # UI components
│   │   └── i18n/
│   └── test/
│
├── eeg-api/              # Sprint v7.3.3 - Exchange Gateway
│   ├── src/
│   │   ├── partner/      # Partner management
│   │   ├── exchange/     # Exchange operations
│   │   ├── credit/       # Credit translation
│   │   └── proof/        # Proof-of-Exchange
│   ├── prisma/
│   └── test/
│
├── egi-api/              # Sprint v7.3.4 - Grid Integration
│   ├── src/
│   │   ├── telemetry/    # Data ingest
│   │   ├── planner/      # Orchestration
│   │   ├── action/       # Setpoint/DR execution
│   │   ├── incentive/    # ECW/EEG bridge
│   │   └── proof/        # Proof-of-Grid
│   ├── prisma/
│   └── test/
│
└── ecw-web/              # Optional - Web dashboard
    ├── app/
    ├── components/
    └── lib/
```

### Yeni Eklenecek Packages

```
/packages/
├── ecw-sdk/              # Shared SDK
│   ├── src/
│   │   ├── client.ts     # API client
│   │   ├── schemas.ts    # Zod schemas
│   │   └── types.ts      # TypeScript types
│   └── test/
│
├── ecw-core/             # Core business logic
│   ├── src/
│   │   ├── ethics/       # Ω/Φ calculation
│   │   ├── scoring/      # ESK/QEE integration
│   │   └── validation/   # Business rules
│   └── test/
│
├── proof-system/         # Unified proof engine
│   ├── src/
│   │   ├── poi/          # Proof-of-Impact
│   │   ├── poe/          # Proof-of-Exchange
│   │   ├── pog/          # Proof-of-Grid
│   │   ├── jws/          # JWS signing
│   │   ├── rfc3161/      # Timestamping
│   │   └── merkle/       # Merkle tree
│   └── test/
│
└── ethics-layer/         # Ethics enforcement
    ├── src/
    │   ├── ace/          # ACE policy
    │   ├── esk/          # Ethics coefficients
    │   ├── opa/          # OPA integration
    │   ├── residency/    # Data residency
    │   └── dp/           # Differential Privacy
    └── test/
```

### Mevcut Packages'leri Yeniden Kullan

- ✅ **packages/privacy** → DP implementation
- ✅ **packages/governance** → Policy enforcement
- ✅ **packages/civic-grid** → Grid data models (extend edilecek)
- ✅ **packages/trust-layer** → Base proof sistemi
- ✅ **packages/esg** → ESG metrics (extend edilecek)
- ✅ **packages/connectors-core** → External API integration

---

## 🗄️ VERİ MODELİ (Prisma)

### ECW Core Models

```prisma
// apps/ecw-api/prisma/schema.prisma

model Wallet {
  id            String   @id @default(cuid())
  ownerType     String   // individual|org|city
  ownerId       String
  region        String
  balanceCO2    Float    @default(0)
  balanceH2O    Float    @default(0)
  balanceKWh    Float    @default(0)
  balanceWaste  Float    @default(0)
  ethicsScore   Float    @default(0) // Ω
  impactScore   Float    @default(0) // Φ
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  transactions  Transaction[]
  exchanges     ExchangeRecord[]

  @@index([ownerType, ownerId])
  @@index([region])
}

model Transaction {
  id            String   @id @default(cuid())
  walletId      String
  type          String   // debit|credit
  metric        String   // CO2|H2O|KWh|Waste
  amount        Float
  reason        String
  source        String   // manual|nico|irssa|tfe|partner
  ethicsScore   Float
  impactScore   Float
  proofJws      String
  createdAt     DateTime @default(now())

  wallet        Wallet   @relation(fields: [walletId], references: [id])
  proof         ProofOfImpact?

  @@index([walletId])
  @@index([createdAt])
}

model ProofOfImpact {
  id            String   @id @default(cuid())
  txId          String   @unique
  merkleRoot    String
  jws           String   @db.Text
  tsr           Bytes    // RFC3161 timestamp
  verified      Boolean  @default(false)
  verifiedAt    DateTime?
  createdAt     DateTime @default(now())

  transaction   Transaction @relation(fields: [txId], references: [id])

  @@index([verified])
}
```

### EEG Models

```prisma
// apps/eeg-api/prisma/schema.prisma

model ExchangePartner {
  id          String   @id @default(cuid())
  name        String
  type        String   // utility|transit|pos|ngo
  region      String
  apiUrl      String
  ethicsCert  String   // ACE certification ID
  status      String   // active|suspended|pending
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  exchanges   ExchangeRecord[]

  @@index([type, region])
  @@index([status])
}

model ExchangeRecord {
  id            String   @id @default(cuid())
  partnerId     String
  walletId      String
  rewardTxId    String   // RTL transaction ref
  fiatValue     Float
  ethicsScore   Float
  impactScore   Float
  proofJws      String   @db.Text
  status        String   // pending|completed|failed
  createdAt     DateTime @default(now())
  completedAt   DateTime?

  partner       ExchangePartner @relation(fields: [partnerId], references: [id])
  proof         ProofOfExchange?

  @@index([walletId])
  @@index([status])
}

model ProofOfExchange {
  id            String   @id @default(cuid())
  exchangeId    String   @unique
  merkleRoot    String
  jws           String   @db.Text
  tsr           Bytes
  verified      Boolean  @default(false)
  createdAt     DateTime @default(now())

  exchange      ExchangeRecord @relation(fields: [exchangeId], references: [id])
}
```

### EGI Models

```prisma
// apps/egi-api/prisma/schema.prisma

model GridNode {
  id            String   @id @default(cuid())
  type          String   // hospital|shelter|evse|pv|battery|residential
  name          String
  region        String
  capacityKW    Float
  criticality   Int      // 1=highest … 5=lowest
  carbonRate    Float    // gCO2/kWh
  status        String   // active|degraded|offline
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  telemetry     Telemetry[]
  actions       GridAction[]

  @@index([type, region])
  @@index([criticality])
}

model Telemetry {
  id        String   @id @default(cuid())
  nodeId    String
  ts        DateTime
  powerKW   Float
  freqHz    Float?
  socPct    Float?   // battery/EV
  faults    Json?

  node      GridNode @relation(fields: [nodeId], references: [id])

  @@index([nodeId, ts])
}

model GridAction {
  id            String   @id @default(cuid())
  nodeId        String
  action        String   // setpoint|shed|shift|charge|discharge
  deltaKW       Float
  horizon       String   // now|15m|1h
  ethicsScore   Float
  impactScore   Float
  proofJws      String   @db.Text
  status        String   // planned|executed|failed|rollback
  createdAt     DateTime @default(now())
  executedAt    DateTime?

  node          GridNode @relation(fields: [nodeId], references: [id])
  proof         ProofOfGrid?

  @@index([nodeId])
  @@index([status])
}

model ProofOfGrid {
  id            String   @id @default(cuid())
  actionId      String   @unique
  merkleRoot    String
  jws           String   @db.Text
  tsr           Bytes
  verified      Boolean  @default(false)
  createdAt     DateTime @default(now())

  action        GridAction @relation(fields: [actionId], references: [id])
}
```

---

## 🔐 GÜVENLİK & ETİK KATMANI

### Beyaz-Şapka Prensipleri

**1. Data Residency & Privacy**
- ✅ Residency enforcement (EU/TR regions)
- ✅ Differential Privacy (DP: ε≤2, δ≤1e-5)
- ✅ Zero PII storage
- ✅ Encrypted at rest & in transit

**2. Ethics Enforcement**
- ✅ ACE (Ailydian Charter of Ethics) gates
- ✅ ESK (Ethics Coefficient) scoring
- ✅ OPA policy validation
- ✅ USK intent analysis

**3. Proof Systems**
- ✅ JWS signing (JWKS rotation)
- ✅ RFC3161 timestamping
- ✅ Merkle tree for batch verification
- ✅ ARP (Audit & Record Preservation) integration

**4. Fail-Safe Mechanisms**
- ✅ Two-man rule (>10k€ ops)
- ✅ Auto-rollback on proof failure
- ✅ IRFS incident reporting
- ✅ Critical node protection (hospitals/shelters)

---

## 🧪 TEST STRATEGY

### Unit Tests
```bash
pnpm -w test:unit              # Jest - all packages
pnpm --filter ecw-api test     # API unit tests
pnpm --filter ecw-mobile test  # Mobile unit tests
```

### Integration Tests
```bash
pnpm -w test:integration       # API integration
pnpm --filter ecw-api test:e2e # E2E flows
```

### E2E Tests
```bash
pnpm -w test:e2e               # Playwright
pnpm --filter ecw-mobile e2e   # Detox (mobile)
```

### Test Matrix (0-HATA)

**ECW API**:
- [ ] Wallet create/read/update
- [ ] Transaction log → Proof-of-Impact
- [ ] Ethics score calculation (Ω/Φ)
- [ ] Residency/DP enforcement
- [ ] Report generation

**ECW Mobile**:
- [ ] Onboarding flow
- [ ] Offline-first sync
- [ ] QR proof generation/verification
- [ ] Screen reader compatibility (A11y)
- [ ] i18n (tr/en)

**EEG API**:
- [ ] Partner registration (ethicsCert validation)
- [ ] Exchange create → Proof-of-Exchange
- [ ] Credit translation accuracy
- [ ] Partner API mocking

**EGI API**:
- [ ] Telemetry ingest (SCADA/AMI/DER/EV)
- [ ] Planning algorithm (grid constraints)
- [ ] Critical node protection (no shed)
- [ ] Proof-of-Grid verification
- [ ] CO2 reduction metrics

---

## 📊 PERFORMANS HEDEFLERI (SLO)

### API Latency (p95)
```
ECW wallet/create:        < 400ms
ECW tx/log:               < 900ms
ECW proof/issue:          < 700ms
ECW report/summary:       < 1500ms

EEG exchange/create:      < 900ms
EEG proof/verify:         < 600ms

EGI ingest/telemetry:     < 200ms
EGI plan:                 < 900ms
EGI act:                  < 600ms
EGI proof/verify:         < 700ms
```

### Mobile Performance
```
Cold start:               < 2500ms
API calls (cached):       < 500ms
Offline sync:             < 15 min intervals
Crash-free rate:          ≥ 99.9%
```

### Uptime & Reliability
```
API uptime:               ≥ 99.95%
Error budget:             ≤ 0.1% / month
Critical node uptime:     ≥ 99.97%
```

---

## 🚀 DEPLOYMENT PIPELINE

### Environments
```
Development  → localhost:3000-3100
Staging      → staging.ailydian.com
Canary       → canary.ailydian.com (10% traffic)
Production   → www.ailydian.com
```

### CI/CD Workflow

**1. Pre-commit**
```bash
pnpm -w lint
pnpm -w format
pnpm -w type-check
pnpm -w test:unit
```

**2. PR Validation**
```bash
pnpm -w build
pnpm -w test:integration
pnpm -w test:e2e
Ethics gates (ACE/ESK/OPA)
Security scan (Snyk/SonarQube)
```

**3. Deployment**
```bash
# Canary
vercel deploy --prebuilt
# Smoke tests (10 min)
# Production promotion
vercel alias <deployment-url> www.ailydian.com
```

**4. Post-deployment**
```bash
pnpm -w test:smoke:production
Monitor (Sentry, Datadog, Prometheus)
```

---

## 📅 İMPLEMENTASYON PLANI

### Phase 1: Foundation (Week 1-2)

**Sprint v7.3 - ECW Backend**
- [ ] Monorepo setup (apps/ecw-api, packages/ecw-sdk)
- [ ] Prisma schema (Wallet, Transaction, ProofOfImpact)
- [ ] Basic CRUD endpoints
- [ ] Ethics layer integration (ACE/ESK/OPA)
- [ ] Proof-of-Impact implementation
- [ ] Unit tests (80%+ coverage)

### Phase 2: Mobile (Week 3-4)

**Sprint v7.3.1 - ECW Mobile**
- [ ] React Native project setup (apps/ecw-mobile)
- [ ] Expo Router configuration
- [ ] Core screens (Dashboard, Wallet, Transactions)
- [ ] API client (ecw-sdk integration)
- [ ] Offline-first (MMKV + React Query)
- [ ] QR code generation/scanning
- [ ] i18n + A11y
- [ ] Detox E2E tests

### Phase 3: Exchange (Week 5-6)

**Sprint v7.3.3 - EEG Gateway**
- [ ] EEG API setup (apps/eeg-api)
- [ ] Partner management
- [ ] Exchange operations
- [ ] Credit translator
- [ ] Proof-of-Exchange
- [ ] Mock partner integrations
- [ ] Integration tests

### Phase 4: Grid (Week 7-8)

**Sprint v7.3.4 - EGI Integration**
- [ ] EGI API setup (apps/egi-api)
- [ ] Telemetry ingest
- [ ] Planning algorithm
- [ ] Priority matrix
- [ ] Action executor
- [ ] Proof-of-Grid
- [ ] Grid simulations
- [ ] Compliance tests

### Phase 5: Integration & Testing (Week 9)

- [ ] End-to-end integration tests
- [ ] Load testing (k6)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation finalization

### Phase 6: Deployment (Week 10)

- [ ] Canary deployment
- [ ] Smoke tests
- [ ] Monitoring setup
- [ ] Production rollout
- [ ] Post-launch review

---

## 📚 DÖKÜMANTASYON STRATEJİSİ

### Technical Docs
```
/docs/ECW/
├── ARCHITECTURE.md       # System architecture
├── API_REFERENCE.md      # API documentation
├── DATA_MODEL.md         # Prisma schemas
├── PROOF_SYSTEM.md       # Proof algorithms
├── ETHICS_LAYER.md       # ACE/ESK/OPA/DP
└── DEPLOYMENT.md         # Deployment guide

/docs/EEG/
├── ARCHITECTURE.md
├── API_REFERENCE.md
├── PARTNER_INTEGRATION.md
└── CREDIT_TRANSLATION.md

/docs/EGI/
├── ARCHITECTURE.md
├── API_REFERENCE.md
├── GRID_PLANNING.md
└── TELEMETRY_SPEC.md
```

### User Docs
```
/docs/USER/
├── ECW_MOBILE_GUIDE.md   # Mobile app guide
├── WALLET_FAQ.md         # Common questions
├── PROOF_VERIFICATION.md # How to verify proofs
└── PRIVACY_POLICY.md     # Privacy & data handling
```

### Developer Docs
```
/docs/DEV/
├── GETTING_STARTED.md    # Local setup
├── SDK_USAGE.md          # ecw-sdk guide
├── TESTING.md            # Test strategy
└── CONTRIBUTING.md       # Contribution guidelines
```

---

## 🎯 BAŞARI KRİTERLERİ

### Technical Metrics
- ✅ Zero production errors (0-HATA)
- ✅ Test coverage ≥ 80%
- ✅ API latency < SLO targets
- ✅ Mobile crash-free ≥ 99.9%
- ✅ Uptime ≥ 99.95%

### Business Metrics
- ✅ Proof verification rate = 100%
- ✅ Ethics violation rate = 0%
- ✅ User retention (mobile) ≥ 60% (30-day)
- ✅ Exchange success rate ≥ 95%
- ✅ Grid optimization: CO2 reduction ≥ 15%

### Compliance
- ✅ WCAG 2.2 AA (mobile/web)
- ✅ ISO 14001 alignment
- ✅ ISO 50001 alignment (EGI)
- ✅ AI Act compliance
- ✅ KVKK/GDPR compliance

---

## ⚠️ RİSKLER & AZALTMA

### Technical Risks

**Risk 1**: Proof sistem performansı (JWS + RFC3161 + Merkle)
- **Azaltma**: Batch processing, async queue, caching

**Risk 2**: Mobile offline sync conflicts
- **Azaltma**: CRDT-like conflict resolution, server-side reconciliation

**Risk 3**: Grid telemetry data volume
- **Azaltma**: Sampling, aggregation, time-series DB (TimescaleDB)

### Operational Risks

**Risk 4**: Partner API downtimes (EEG)
- **Azaltma**: Circuit breakers, retry logic, fallback modes

**Risk 5**: Grid action rollback failures
- **Azaltma**: Idempotent operations, state snapshots, manual override

### Security Risks

**Risk 6**: Proof manipulation
- **Azaltma**: Cryptographic signatures, timestamp authority, Merkle roots

**Risk 7**: Privacy breaches (DP violation)
- **Azaltma**: Automated DP audits, encrypted storage, access logging

---

## 🛠️ TOOLING & DEPENDENCIES

### Backend
```json
{
  "framework": "NestJS 10.x / Express 4.x",
  "database": "PostgreSQL 15+ (Prisma ORM)",
  "cache": "Redis 7+",
  "queue": "BullMQ / RabbitMQ",
  "crypto": "jose (JWS), node-rfc3161, merkle-tree-js",
  "validation": "Zod 3.x",
  "testing": "Jest, Supertest, Playwright"
}
```

### Mobile
```json
{
  "framework": "React Native 0.74",
  "navigation": "Expo Router",
  "state": "Zustand 4.x",
  "network": "React Query 5.x",
  "storage": "MMKV",
  "i18n": "i18next",
  "testing": "Jest, Detox"
}
```

### Monorepo
```json
{
  "manager": "pnpm 9.x",
  "build": "Turborepo / Nx",
  "ci": "GitHub Actions",
  "deploy": "Vercel (web/api), EAS (mobile)"
}
```

---

## 📞 İLETİŞİM & DESTEK

**Proje Lideri**: AX9F7E2B + Lydian
**Repo**: https://github.com/ailydian/ailydian-ultra-pro
**Domain**: www.ailydian.com
**Email**: support@ailydian.com

---

## 🎉 SONUÇ

**ECW Ekosistemi kapsamlı bir "Ethical Climate Wallet" platformudur.**

**4 Major Sprint**:
1. ✅ v7.3: Backend API (Wallet + Proof-of-Impact)
2. ✅ v7.3.1: Mobile App (iOS/Android)
3. ✅ v7.3.3: Exchange Gateway (Real-world integration)
4. ✅ v7.3.4: Grid Integration (Smart energy ecosystem)

**Toplam Süre**: 10 hafta (aggressive timeline)
**Toplam Kod**: ~50K+ LOC (backend + mobile + packages)
**Yeni Apps**: 4 (ecw-api, ecw-mobile, eeg-api, egi-api)
**Yeni Packages**: 4 (ecw-sdk, ecw-core, proof-system, ethics-layer)

**Proje hazır başlamaya! Sıradaki adım: Sprint v7.3 implementasyonu.**

---

**🟢 PLANLAMA TAMAMLANDI - İTERASYONA HAZIR! 🚀**

---

*Brief oluşturuldu: 17 Ekim 2025*
*Developer: AX9F7E2B AI + Lydian*
*Versiyon: v7.3 - Ethical Climate Wallet Ecosystem*
*Status: 📋 APPROVED FOR IMPLEMENTATION*
