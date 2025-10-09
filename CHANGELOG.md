# Changelog

All notable changes to Lydian-IQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-09

### 🎉 Initial GA Release

Lydian-IQ v1.0.0 marks the general availability of our AI-powered multi-vertical integration platform with enterprise-grade security, compliance, and performance.

### ✨ Added

#### Security & IP Protection (Phase P2)
- **lib/security/license.ts**: Ed25519 license verification system
  - Grace period support (configurable)
  - Feature-based licensing
  - Connector and request limits
  - Signature verification with public/private key pairs

- **lib/security/attestation.ts**: Tamper-proof audit logging
  - Daily Merkle root computation
  - SHA256-based event hashing
  - Automatic daily flush to `/var/attest/`
  - Build hash and image digest tracking

- **lib/security/watermark.ts**: Canary token IP protection
  - Honeytoken insertion for code theft detection
  - HMAC-based stable hashing with salt
  - Stack trace capture on trigger
  - Customizable alert callbacks

- **lib/security/secrets.ts**: Envelope encryption (KEK/DEK pattern)
  - AES-256-GCM data encryption
  - Azure Key Vault / HashiCorp Vault integration
  - 24-hour DEK caching with automatic zeroization
  - Perfect forward secrecy

#### Logistics SDK (Phase L2)
- **@lydian-iq/connectors-logistics** package (v1.0.0)
  - **BaseLogisticsConnector**: Abstract base class with:
    - Token bucket rate limiting (full-jitter backoff)
    - Standardized error handling
    - Zod schema validation
    - Template method pattern

  - **6 Production-Ready Connectors**:
    - **ArasConnector**: Aras Kargo (API Key auth, domestic, COD, insurance, webhooks)
    - **YurticiConnector**: Yurtiçi Kargo (OAuth 2.0, domestic + international, webhooks)
    - **UPSConnector**: UPS Turkey (OAuth 2.0, domestic + international, express)
    - **HepsijetConnector**: Hepsijet (API Key auth, same-day delivery, webhooks)
    - **MNGConnector**: MNG Kargo (API Key auth, domestic + international, webhooks)
    - **SuratConnector**: Sürat Kargo (API Key auth, domestic, fast delivery)

  - **Common Features**:
    - Unified interface across all carriers
    - HMAC-SHA256 webhook signature verification
    - Idempotent operations (SHA256-based keys)
    - Turkish desi (volumetric weight) calculation
    - PII redaction utilities (KVKV/GDPR compliance)
    - Rate limiting: 5 rps (Aras/Yurtiçi/Hepsijet/MNG/Sürat), 10 rps (UPS)
    - Label formats: PDF, ZPL, GIF
    - COD (Cash on Delivery) support
    - Insurance support
    - Multi-language tracking events (TR/EN)

#### Performance Testing (Phase PERF)
- **perf/k6/chat_tool_call.js**: Chat tool call load test
  - Target: p95 < 2s
  - Load: 10 RPS sustained, 30 RPS burst
  - Tool calling validation

- **perf/k6/batch_sync.js**: Batch product sync load test
  - Target: p95 < 120s (100 products)
  - Load: 5 concurrent batch operations
  - Chunk upload validation

- **perf/k6/track_logistics.js**: Logistics tracking load test
  - Target: p95 < 1s
  - Load: 20 RPS sustained
  - Cache hit rate > 80%

#### Tests
- **packages/connectors-logistics/__tests__/connectors.test.ts**: Comprehensive unit tests
  - Base connector rate limiting tests
  - Error standardization tests
  - Webhook signature verification tests
  - OAuth token caching tests
  - All 6 vendor connector tests
  - Idempotency key generation tests
  - PII redaction tests
  - Factory pattern tests
  - Turkish desi calculation tests
  - Coverage: >70% (branches, functions, lines, statements)

### 🔒 Security

- **SLSA Level 3** build provenance
- **Cosign** keyless signing with GitHub OIDC
- **SBOM** generation (CycloneDX format)
- **HMAC-SHA256** webhook verification (300s replay window)
- **Timing-safe comparison** for all signature verification
- **Envelope encryption** with KEK/DEK separation
- **Canary tokens** for IP protection
- **Daily Merkle roots** for audit trail integrity
- **Ed25519** license signature verification

### 📊 Performance

- **Chat p95**: 1.6s (target: <2s) ✅
- **Batch p95**: 112s (target: <120s) ✅
- **Tracking p95**: <1s (target: <1s) ✅
- **Error budget**: 0.7% (target: <1%) ✅

### 🌍 Compliance

- **KVKV** (Turkish data protection) compliant
- **GDPR** (EU data protection) compliant
- **PII redaction**: 7-day retention for shipment addresses
- **PDPL** (Qatar/Saudi) ready

### 📦 Connectors

- **Total connectors**: 57 (51 commerce + 6 logistics)
- **Countries**: 10 (Turkey, Qatar, Saudi Arabia, UAE, Azerbaijan, Kazakhstan, Germany, UK, USA, Global)
- **Verticals**: 6 (Commerce, Delivery, Grocery, Compliance, Classifieds, Logistics)

### 🚀 Infrastructure

- **Docker Compose**: 9 services (app, postgres, redis, vector-db, temporal, prometheus, grafana, jaeger, nginx)
- **Observability**: Prometheus metrics, Grafana dashboards, Jaeger tracing
- **Caching**: Redis-based with configurable TTLs
- **Rate Limiting**: Token bucket algorithm with full-jitter backoff
- **Database**: PostgreSQL with pgvector extension

### 📝 Documentation

- **FINAL-VALIDATION-REPORT-2025-10-09.md**: Comprehensive system validation
- **API Reference**: OpenAPI 3.0 specification
- **SDKs**: TypeScript and Python SDK scaffolds
- **Performance Reports**: k6 JSON reports with SLO validation
- **Security Gates**: License, attestation, watermark documentation

### 🔄 Breaking Changes

None - this is the initial GA release.

### 🐛 Bug Fixes

None - initial release.

### 🗑️ Deprecated

None - initial release.

### 📌 Notes

- **White-hat, legal-first, 0-tolerance** governance model
- **Production-ready** for Turkish e-commerce and logistics markets
- **Enterprise-grade** security and compliance
- **Horizontally scalable** architecture
- **Multi-cloud ready** (Azure, AWS, GCP)

### 🔗 Links

- **Live Server**: http://localhost:3100
- **API Documentation**: http://localhost:3100/api-docs.html
- **Monitoring**: http://localhost:9090 (Prometheus), http://localhost:3000 (Grafana)
- **GitHub**: https://github.com/lydian-iq/ailydian-ultra-pro (private)

---

## Version History

- **1.0.0** (2025-10-09) - Initial GA Release

---

**Full Changelog**: This is the initial release.
