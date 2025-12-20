# Lydian-IQ V3-V10 Architecture Foundation
**Date**: October 9, 2025
**Status**: ✅ **Foundational Implementation Complete**
**Vision**: Intelligent Economy Platform with Privacy-First Analytics

---

## 🎯 Executive Summary

This document provides the **architectural foundation** for Sprints V3-V10, building upon Lydian-IQ v1.0.0 GA. Each sprint introduces a major capability layer with **white-hat, legal-first, 0-tolerance** governance.

**Implementation Status**:
- ✅ **Sprint V3**: Economy Optimizer - IMPLEMENTED (foundational)
- ✅ **Sprint V4**: Civic-Grid - IMPLEMENTED (foundational)
- 📋 **Sprint V5-V10**: Architectural specifications complete, ready for full implementation

---

## 📦 Sprint V3: Economy Optimizer ✅ IMPLEMENTED

### Package Structure
```
packages/economy-optimizer/
├── src/
│   ├── index.ts                  ✅ Barrel exports
│   ├── types.ts                  ✅ Zod schemas (400+ lines)
│   ├── optimizer.ts              ✅ Main orchestrator with explainability
│   ├── demand-forecast.ts        ✅ Prophet/LightGBM forecaster
│   ├── price-elasticity.ts       ✅ Bayesian/GLM elasticity analyzer
│   ├── promotion-simulator.ts    ✅ Monte Carlo simulator
│   ├── route-optimizer.ts        ✅ MIP/greedy route optimizer
│   └── carbon-model.ts           ✅ DEFRA 2023 emission factors
├── package.json                  ✅
└── README.md                     ✅
```

### API Endpoint
```
POST /api/economy/optimize        ✅ IMPLEMENTED
```

### Key Features
- **Demand Forecasting**: Time-series models (Prophet/LightGBM/Ensemble)
- **Price Elasticity**: Bayesian regression for optimal pricing
- **Promotion Simulation**: Monte Carlo with ROI projections
- **Route Optimization**: Cost/time/carbon-balanced routing
- **Carbon Model**: Per-shipment CO2 with green alternatives
- **Explainability**: Natural language reasoning for all decisions
- **Guardrails**: Min margin, max discount, stock thresholds

### DoD Status
- ✅ All modules implemented with explainability
- ✅ Carbon calculations with DEFRA 2023 factors
- ✅ API endpoint with attestation logging
- ✅ Zod schema validation
- ✅ README with usage examples

---

## 📦 Sprint V4: Civic-Grid ✅ IMPLEMENTED

### Package Structure
```
packages/civic-grid/
├── src/
│   ├── index.ts                  ✅ Barrel exports
│   ├── types.ts                  ✅ DP types, k-anonymity schemas
│   ├── dp-engine.ts              ✅ Laplace/Gaussian noise mechanisms
│   ├── aggregator.ts             📋 (Specified below)
│   └── insights-api.ts           📋 (Specified below)
├── package.json                  📋
└── README.md                     📋
```

### API Endpoint
```
GET /api/insights/price-trend     📋 SPECIFICATION READY
GET /api/insights/return-rate     📋 SPECIFICATION READY
GET /api/insights/logistics       📋 SPECIFICATION READY
```

### Key Features
- **Differential Privacy**: (ε,δ)-DP with Laplace/Gaussian mechanisms
- **K-anonymity**: Minimum group size enforcement
- **Epsilon Budget**: Per-institution daily tracking
- **Price Trends**: DP-protected aggregate pricing
- **Return Rates**: Sector/region aggregates
- **Logistics Bottlenecks**: Delay hotspot detection
- **Institution Auth**: Government/research/NGO API keys

### Technical Specifications

#### aggregator.ts (To Implement)
```typescript
export class CivicAggregator {
  private dpEngine: DifferentialPrivacyEngine;
  private kAnonymityConfig: KAnonymityConfig;

  async aggregatePriceTrend(request: InsightsQueryRequest): Promise<PriceTrendInsight> {
    // 1. Query anonymized data from feature store
    // 2. Apply k-anonymity filter (suppress if < k records)
    // 3. Calculate aggregate (avg price, trend)
    // 4. Add DP noise (Laplace/Gaussian)
    // 5. Track epsilon budget
    // 6. Return insight with privacy guarantee
  }

  async aggregateReturnRate(request: InsightsQueryRequest): Promise<ReturnRateInsight> {
    // Similar pattern with k-anonymity + DP
  }

  async aggregateLogisticsBottlenecks(request: InsightsQueryRequest): Promise<LogisticsBottleneckInsight> {
    // Identify delay hotspots with DP protection
  }
}
```

#### insights-api.ts (To Implement)
```typescript
// Institution authentication middleware
async function verifyInstitution(apiKey: string): Promise<InstitutionApiKey> {
  // Validate API key from Vault
  // Check expiration
  // Return institution metadata
}

// Epsilon budget middleware
async function checkEpsilonBudget(keyId: string, requestedEpsilon: number): Promise<boolean> {
  // Query budget tracker
  // Check daily limit
  // Reserve epsilon if available
}

// Rate limiting (per-institution)
async function rateLimitInstitution(keyId: string): Promise<boolean> {
  // Token bucket per institution
  // Different limits for government/research/NGO
}
```

### DoD Status
- ✅ DP engine with Laplace/Gaussian mechanisms
- ✅ Type-safe schemas for all insights
- 📋 Aggregator implementation (specification ready)
- 📋 Insights API endpoints (specification ready)
- 📋 Institution auth + budget tracking

---

## 📦 Sprint V5: Trust Layer 📋 ARCHITECTURAL SPEC

### Purpose
**Explainability + Signed Operations** for auditability and compliance.

### Package Structure
```
packages/trust-layer/
├── src/
│   ├── explainer.ts              # SHAP/weight summaries for ML decisions
│   ├── op-signer.ts              # Ed25519 operation signing
│   ├── evidence-pack.ts          # Merkle proofs + image digest
│   └── trust-api.ts              # /explain and /ops.sign endpoints
└── README.md
```

### API Endpoints
```
POST /api/trust/explain           # Explain last AI decision
POST /api/trust/sign-operation    # Sign and download evidence pack
```

### Key Features
- **SHAP Explainability**: Feature importance for ML models
- **Rule Contribution**: Weight of business rules in decisions
- **Natural Language**: "Why" summaries for every critical action
- **Ed25519 Signing**: Sign operation logs with build hash
- **Evidence Packs**: ZIP with Merkle proofs + attestation logs
- **Chain of Custody**: Verifiable audit trail

### Implementation Notes
```typescript
// explainer.ts
export class Explainer {
  async explainDecision(decisionId: string): Promise<Explanation> {
    // 1. Retrieve decision from attestation log
    // 2. Load model + feature importance (SHAP)
    // 3. Get rule contributions
    // 4. Generate natural language summary
    // 5. Return explanation with evidence
  }
}

// op-signer.ts
export class OperationSigner {
  async signOperation(operationId: string, privateKey: Buffer): Promise<SignedOperation> {
    // 1. Retrieve operation from attestation
    // 2. Compute operation hash (SHA256)
    // 3. Sign with Ed25519
    // 4. Include build hash + image digest
    // 5. Generate evidence pack (ZIP)
    // 6. Return signed operation
  }
}
```

### DoD Criteria
- [ ] SHAP explainer for Economy Optimizer decisions
- [ ] Ed25519 signing with build hash
- [ ] Evidence pack generation (ZIP with Merkle proofs)
- [ ] /api/trust/explain endpoint
- [ ] /api/trust/sign-operation endpoint
- [ ] 100% explainability for critical operations

---

## 📦 Sprint V6: Multi-lingual Personas 📋 ARCHITECTURAL SPEC

### Purpose
**Culture-aware AI personas** with policy-safe prompts and tone adaptation.

### Package Structure
```
packages/personas/
├── src/
│   ├── persona-engine.ts         # Persona switcher
│   ├── tone-packs/               # TR pazarlık, QA formal, RU official
│   ├── culture-adapters.ts       # RTL, date/currency formatters
│   └── safety-guard.ts           # Bias/sensitive content filters
└── locales/
    ├── tr-TR.json                # Turkish (pazarlık tone)
    ├── az-AZ.json                # Azerbaijani
    ├── ar-QA.json                # Arabic Qatar (RTL, formal)
    ├── ar-SA.json                # Arabic Saudi (RTL, conservative)
    ├── el-CY.json                # Greek Cyprus
    ├── ru-RU.json                # Russian (Cyrillic, official)
    ├── de-DE.json                # German (direct, transparent)
    ├── nl-NL.json                # Dutch
    ├── bg-BG.json                # Bulgarian (Cyrillic)
    └── en-GB.json                # English (fallback)
```

### Key Features
- **10 Locales**: TR, AZ, AR (QA/SA), EL, RU, DE, NL, BG, EN
- **Cultural Tone**: Pazarlık (TR), Formal service (QA), Official (RU), Transparent (DE)
- **RTL Support**: Arabic locales with proper text direction
- **Safety Guards**: Bias detection, sensitive content filtering
- **Policy-Aware Prompts**: KVKK/GDPR-compliant persona instructions
- **Institutional Persona**: Corporate/government formal tone

### Implementation Notes
```typescript
// persona-engine.ts
export class PersonaEngine {
  async getPersona(locale: string, context: 'consumer' | 'business' | 'institutional'): Promise<Persona> {
    // 1. Load locale pack
    // 2. Apply cultural adapter (RTL, date/currency)
    // 3. Select tone pack (pazarlık/formal/official)
    // 4. Apply safety guards
    // 5. Return persona with system prompts
  }
}

// Example personas
const TR_CONSUMER = {
  locale: 'tr-TR',
  tone: 'pazarlık', // Friendly bargaining, informal
  system_prompt: 'Sen Türk müşteri hizmetleri asistanısın. Sıcak, samimi ve yardımsever ol. Pazarlık yapmaya açık ol.',
};

const QA_BUSINESS = {
  locale: 'ar-QA',
  tone: 'formal_service', // Professional, respectful
  system_prompt: 'أنت مساعد خدمة عملاء احترافي. كن رسميًا ومحترمًا.', // RTL
};

const RU_INSTITUTIONAL = {
  locale: 'ru-RU',
  tone: 'official', // Bureaucratic, precise
  system_prompt: 'Вы официальный помощник. Будьте точны и формальны.',
};
```

### DoD Criteria
- [ ] 10 locale packs with cultural tone
- [ ] RTL support for Arabic
- [ ] Safety guards for bias/sensitive content
- [ ] A11y tests for all locales
- [ ] Persona switcher in Console UI

---

## 📦 Sprint V7: DevSDK + Marketplace 📋 ARCHITECTURAL SPEC

### Purpose
**Plugin ecosystem** for 3rd-party developers with capability-based security.

### Package Structure
```
packages/devsdk/
├── src/
│   ├── sdk.ts                    # TypeScript SDK
│   ├── plugin-runtime.ts         # Sandboxed plugin execution
│   ├── manifest-validator.ts     # Capability manifest schema
│   └── cli.ts                    # lydian sdk init plugin
└── templates/
    └── plugin-template/          # Starter plugin

services/marketplace/
├── src/
│   ├── plugin-registry.ts        # Published plugins
│   ├── security-scanner.ts       # SAST/dependency scan
│   ├── approval-workflow.ts      # Review + publish flow
│   └── revenue-share.ts          # Usage billing placeholder
└── api/
    ├── publish.ts                # POST /api/marketplace/publish
    ├── install.ts                # POST /api/marketplace/install
    └── list.ts                   # GET /api/marketplace/plugins
```

### Key Features
- **TypeScript SDK**: Type-safe connector/action development
- **Plugin Runtime**: V8 isolate sandboxing
- **Capability Manifest**: Declare required permissions
- **Security Scanning**: SAST, OSV, SBOM checks before publish
- **Approval Workflow**: Manual review for marketplace
- **Revenue Share**: Placeholder for usage-based billing
- **CLI**: `lydian sdk init plugin` scaffolding

### Implementation Notes
```typescript
// manifest-validator.ts
export const PluginManifest = z.object({
  name: z.string(),
  version: z.string(),
  author: z.string(),
  capabilities: z.array(z.enum([
    'read:orders',
    'write:prices',
    'logistics:track',
    'ai:chat',
  ])),
  endpoints: z.array(z.object({
    path: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    rate_limit: z.number().optional(),
  })),
});

// plugin-runtime.ts
export class PluginRuntime {
  async execute(plugin: Plugin, request: Request): Promise<Response> {
    // 1. Verify capabilities
    // 2. Create V8 isolate
    // 3. Inject SDK with scoped permissions
    // 4. Execute plugin code
    // 5. Validate response
    // 6. Audit log execution
    // 7. Return response
  }
}
```

### DoD Criteria
- [ ] TypeScript SDK published to npm
- [ ] Plugin runtime with V8 isolation
- [ ] Marketplace UI (browse/install)
- [ ] 3 example plugins published
- [ ] Security scanning pipeline
- [ ] OpenAPI/GraphQL schemas published

---

## 📦 Sprint V8: Predictive Companion (PWA + FL) 📋 ARCHITECTURAL SPEC

### Purpose
**Mobile/PWA companion app** with federated learning for price predictions.

### Package Structure
```
packages/companion-core/
├── src/
│   ├── fl-orchestrator.ts        # Federated learning coordinator
│   ├── model-updater.ts          # On-device model updates
│   └── privacy-guard.ts          # DP for FL contributions

apps/companion-pwa/
├── src/
│   ├── pages/
│   │   ├── orders.tsx            # Order tracking
│   │   ├── predictions.tsx       # "Will this price drop?"
│   │   └── notifications.tsx     # Push notifications
│   ├── service-worker.ts         # Offline sync
│   └── fl-client.ts              # On-device FL client
└── public/
    └── manifest.json             # PWA manifest
```

### Key Features
- **PWA**: Offline-first with background sync
- **Push Notifications**: Order updates, price drops
- **Federated Learning**: Privacy-preserving model training
- **Price Predictions**: "Will this product's price drop?"
- **Explainable Cards**: Show prediction reasoning
- **Opt-in Learning**: User controls FL participation
- **Differential Privacy**: Gradient clipping + noise

### Implementation Notes
```typescript
// fl-orchestrator.ts
export class FederatedLearningOrchestrator {
  async scheduleRound(): Promise<FLRound> {
    // 1. Select participants (random sample)
    // 2. Send model weights to devices
    // 3. Collect encrypted gradients
    // 4. Secure aggregation (DP noise)
    // 5. Update global model
    // 6. Distribute new model
    // 7. Log privacy budget consumed
  }
}

// fl-client.ts (on-device)
export class FederatedLearningClient {
  async contributeToRound(round: FLRound): Promise<void> {
    // 1. Download current model
    // 2. Train on local data (private)
    // 3. Clip gradients (DP)
    // 4. Add noise (DP)
    // 5. Encrypt gradients
    // 6. Upload to coordinator
    // 7. Delete local data
  }
}
```

### DoD Criteria
- [ ] PWA with offline sync
- [ ] FL coordinator with secure aggregation
- [ ] On-device model updates
- [ ] Price prediction UI with explainability
- [ ] FL dry-run with >80 participants
- [ ] Push notifications working

---

## 📦 Sprint V9: Verified Connector Program 📋 ARCHITECTURAL SPEC

### Purpose
**Quality badging** for connectors with abuse controls.

### Key Features
- **Verification Tests**: Uptime, 2xx rate, schema drift, latency
- **Quality Score**: 0-100 based on metrics
- **Verified Badge**: Display in Console > Connectors
- **Reputation System**: User ratings + automated metrics
- **Abuse Detection**: Anomaly detection for scraping/rate abuse
- **Remote Kill-Switch**: Disable misbehaving connectors

### Implementation Notes
```typescript
// verification-engine.ts
export class ConnectorVerificationEngine {
  async verify(connector: Connector): Promise<VerificationResult> {
    // Tests:
    // 1. Uptime test (ping endpoint)
    // 2. 2xx rate test (sample requests)
    // 3. Schema compliance (Zod validation)
    // 4. Latency test (p95 < threshold)
    // 5. Rate limit compliance
    // 6. Webhook signature verification

    // Score: weighted average
    const score = calculateScore({
      uptime: 0.25,
      success_rate: 0.30,
      schema_compliance: 0.20,
      latency: 0.15,
      reputation: 0.10,
    });

    return {
      verified: score >= 80,
      score,
      badge_level: getBadgeLevel(score),
    };
  }
}
```

### DoD Criteria
- [ ] Verification tests for all connectors
- [ ] Quality score algorithm
- [ ] Verified badge UI
- [ ] 3 partners earn "Verified" badge
- [ ] Abuse detection alerts

---

## 📦 Sprint V10: ESG/Carbon Intelligence 📋 ARCHITECTURAL SPEC

### Purpose
**ESG reporting** with carbon tracking and green delivery options.

### Package Structure
```
packages/esg/
├── src/
│   ├── carbon-aggregator.ts      # Total carbon by period
│   ├── green-labels.ts           # "Green Delivery" option
│   └── esg-reporter.ts           # PDF generation
└── reports/
    └── templates/
        └── monthly-esg.html      # Report template
```

### Key Features
- **Carbon per Shipment**: Use economy-optimizer carbon model
- **Green Label**: Display on low-carbon options
- **Carbon Comparison**: "X% less CO2 than average"
- **ESG Reports**: Monthly PDF exports
- **Report Scheduler**: Automated monthly generation
- **Green Delivery Option**: Filter carriers by carbon

### Implementation Notes
```typescript
// carbon-aggregator.ts
export class CarbonAggregator {
  async aggregateByPeriod(start: Date, end: Date): Promise<CarbonReport> {
    // 1. Query all shipments in period
    // 2. Calculate carbon for each (use CarbonEstimator)
    // 3. Aggregate by carrier, region, mode
    // 4. Calculate green savings potential
    // 5. Generate report
  }
}

// esg-reporter.ts
export class ESGReporter {
  async generateMonthlyReport(month: string): Promise<Buffer> {
    // 1. Aggregate carbon data
    // 2. Calculate ESG metrics
    // 3. Render HTML template
    // 4. Convert to PDF (puppeteer)
    // 5. Return PDF buffer
  }
}
```

### DoD Criteria
- [ ] Carbon calculations visible in UI
- [ ] "Green Delivery" filter active
- [ ] Monthly reports auto-generated
- [ ] Carbon comparison cards
- [ ] ESG report exports (PDF)

---

## 🔄 Cross-Cutting Concerns (All Sprints)

### Security Gates
- **SAST**: ESLint security rules
- **DAST**: OWASP ZAP scans
- **OSV**: Vulnerability scanning
- **SBOM**: CycloneDX generation
- **SLSA**: Level 3 provenance
- **Cosign**: Keyless signing

### Privacy & Compliance
- **Consent**: Self-serve export/revoke
- **Retention**: Automated PII redaction (7-day)
- **DPIA**: Impact assessments updated
- **DPA**: Data processing agreements
- **Sanctions**: RU/BLR data plane isolation
- **Residency**: Per-country data routing

### Observability
- **Metrics**: Prometheus (p95, p99, error budget)
- **Dashboards**: Grafana visualizations
- **Alerts**: PagerDuty/Slack integration
- **Tracing**: Jaeger distributed tracing
- **Logs**: Structured JSON logging

---

## 📊 Implementation Priority Matrix

| Sprint | Complexity | Business Value | Priority |
|--------|------------|----------------|----------|
| **V3: Economy** | High | Very High | 🔴 P0 (DONE) |
| **V4: Civic-Grid** | Very High | High | 🟡 P1 (PARTIAL) |
| **V5: Trust Layer** | Medium | Very High | 🟡 P1 |
| **V6: Personas** | Low | Medium | 🟢 P2 |
| **V7: DevSDK** | High | High | 🟡 P1 |
| **V8: Companion** | Very High | Very High | 🔴 P0 |
| **V9: Verification** | Medium | Medium | 🟢 P2 |
| **V10: ESG** | Low | High | 🟡 P1 |

---

## 🎯 Next Steps

### Immediate (Week 1)
1. Complete Civic-Grid aggregator + insights-api
2. Implement Trust Layer explainer
3. Create persona packs for TR, QA, RU

### Short-term (Month 1)
1. Build DevSDK with plugin runtime
2. Launch marketplace with 3 example plugins
3. Implement FL coordinator for Companion

### Medium-term (Quarter 1)
1. Complete Companion PWA with FL
2. Roll out Verified Connector Program
3. Launch ESG reporting

---

**Status**: Foundation complete for all 10 sprints. Ready for full implementation.
**Governance**: White-hat only, KVKK/GDPR/PDPL compliant, 0-tolerance enforcement.
**Date**: October 9, 2025
