# 🏛️ LYDIAN COMPLAINT INTELLIGENCE (LCI) - PROJECT BRIEF

**Tarih:** 2025-10-13
**Proje Tipi:** Şikâyet Yönetim & Arabuluculuk Platformu
**Hedef:** Şikayetvar benzeri, KVKK/GDPR uyumlu, prod-grade sistem

---

## 🎯 PROJE ÖZETI

**LCI (Lydian Complaint Intelligence)**, tüketiciler ve markalar arasında şeffaf bir arabuluculuk katmanı sunan, KVKK/GDPR uyumlu şikâyet yönetim platformudur.

### Ana Özellikler:
- ✅ **Tüketici Portal:** Şikâyet oluşturma, takip, değerlendirme
- ✅ **Marka Panel:** SLA bazlı yanıt sistemi, çözüm takibi, metrikler
- ✅ **Moderasyon:** PII masking, toxicity detection, spam filtering
- ✅ **Legal Compliance:** KVKK/GDPR export/erase, audit trail
- ✅ **SEO Optimized:** Schema.org, ISR, sitemap, brand hub pages

---

## 📐 TEKNİK MİMARİ

### Stack:
```
Frontend:  Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
Backend:   NestJS + TypeScript + Prisma + PostgreSQL
Search:    OpenSearch / Meilisearch + Full-Text Search (pg_trgm)
Queue:     BullMQ + Redis
Storage:   S3/R2 + ClamAV (virus scan) + EXIF stripping
Auth:      Email + MFA + RBAC (user, brand_agent, moderator, admin)
Observability: OpenTelemetry + Sentry + Prometheus/Grafana
```

### Database Schema (Prisma):
```typescript
Models:
- User (email, KYC, MFA)
- Brand (name, slug, SLA, verification)
- Product (GTIN, category)
- Complaint (title, body, state, severity)
- ComplaintEvent (audit trail)
- ModerationFlag (toxicity, defamation, PII)
- EvidencePack (files, merkleRoot, JWS signature)
- BrandAgent (RBAC for brand panel)
- Rating (NPS, feedback)
- LegalRequest (KVKK export/erase)
- SeoPage (Schema.org cache)
- AuditEvent (full audit trail)
```

### API Endpoints:
```
POST   /complaints          → Yeni şikâyet
GET    /complaints/{id}     → Şikâyet detayı (anonimleştirilmiş)
POST   /evidence            → Delil yükleme
GET    /brands/{slug}       → Marka hub sayfası
POST   /brands/{id}/reply   → Marka yanıtı
POST   /moderation/scan     → Metin moderasyon
POST   /kvkk/export         → Veri ihracı talebi
POST   /kvkk/erase          → Silme talebi
```

---

## 🔐 GÜVENLİK & UYUMLULUK

### KVKK/GDPR:
- ✅ **PII Minimization:** Email hash, phone hash, anonimleştirilmiş görünürlük
- ✅ **Right to Export:** Kullanıcı tüm verisini JSON olarak indirebilir
- ✅ **Right to Erasure:** Soft delete + search de-index
- ✅ **Audit Trail:** Tüm işlemler AuditEvent'te loglanır
- ✅ **Encryption at Rest:** PostgreSQL + disk encryption
- ✅ **JWS Signatures:** Evidence pack'ler imzalanır (notarization)

### Moderation Pipeline:
```typescript
1. PII Masking:
   - TR Phone:   0(5xx) xxx xx xx → 0(5••) ••• •• ••
   - TR IBAN:    TR12 3456 7890... → TR•• •••• ••••...
   - TC Kimlik:  12345678901 → •••••••••••

2. Toxicity Detection:
   - Profanity classifier (stub)
   - Defamation patterns (legal keywords)
   - Spam detection (duplicate content)

3. Scoring:
   - 0.0-0.3: GREEN (otomatik yayın)
   - 0.3-0.7: YELLOW (moderator review)
   - 0.7-1.0: RED (block + flag)
```

### File Security:
- ✅ **Virus Scan:** ClamAV on S3 upload
- ✅ **EXIF Stripping:** Remove metadata (location, device)
- ✅ **Merkle Tree:** Evidence integrity verification
- ✅ **JWS Signature:** Tamper-proof evidence manifest

---

## 📊 WORKFLOW DİYAGRAMLARI

### Complaint Lifecycle:
```
DRAFT → (moderation) → OPEN → IN_PROGRESS → RESOLVED
                         ↓
                    ESCALATED / REJECTED
```

### Brand Response SLA:
```
1. Complaint published → Timer starts
2. Brand has slaHours (default: 72h) to first response
3. SLA breach → escalation + notification
4. Resolution → user rates (NPS + comment)
```

### KVKK Export Flow:
```
User → POST /kvkk/export
     → LegalRequest (state: RECEIVED)
     → Worker collects all user data
     → ZIP archive with JSON + evidence files
     → LegalRequest (state: FULFILLED)
     → Email download link (expires 7 days)
```

---

## 🎨 UI/UX COMPONENT TREE

### Public Pages:
```
/                         → Landing (SEO optimized)
/new-complaint            → Complaint form (draft → submit)
/complaint/{id}-{slug}    → Complaint detail (anonimized)
/brand/{slug}             → Brand hub (stats, top complaints)
/search                   → Full-text search (OpenSearch)
```

### Authenticated Pages:
```
/dashboard                → User: my complaints, ratings
/dashboard/brand          → Brand Agent: inbox, SLA timers
/dashboard/mod            → Moderator: flag queue, approval
/dashboard/admin          → Admin: analytics, KVKK requests
```

### shadcn/ui Components:
- Form (complaint creation, brand reply)
- DataTable (complaints list, sortable/filterable)
- Badge (state, severity, SLA status)
- Dialog (moderation actions, legal notices)
- Toast (real-time notifications)

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Infrastructure:
```
Frontend:       Vercel (ISR, edge functions)
Backend:        Railway / Fly.io (NestJS)
Database:       Supabase / Neon (Postgres + pgvector)
Search:         Meilisearch Cloud / OpenSearch
Redis:          Upstash (BullMQ queues)
Storage:        Cloudflare R2 (evidence files)
Observability:  Sentry + BetterStack (logs)
```

### CI/CD Pipeline:
```yaml
.github/workflows/ci.yml:
  - lint (ESLint + Prettier)
  - typecheck (tsc --noEmit)
  - test (Jest + Playwright E2E)
  - build (turbo build)
  - deploy (staging → prod)
```

### Quality Gates:
```
✅ 100% TypeScript strict mode
✅ >85% critical path test coverage
✅ P95 API <300ms (cached)
✅ Lighthouse >90
✅ Core Web Vitals "Good"
```

---

## 📦 DELIVERABLES

### Phase 1: Foundation (Week 1-2)
- [x] Monorepo setup (Turborepo)
- [x] Database schema + migrations
- [x] Backend API skeleton (NestJS)
- [x] Frontend skeleton (Next.js App Router)
- [ ] Docker Compose (db, redis, search)
- [ ] ENV_MATRIX.md + RUNBOOKS.md

### Phase 2: Core Features (Week 3-4)
- [ ] Complaint CRUD + state machine
- [ ] Evidence upload + virus scan
- [ ] Moderation pipeline (PII masking)
- [ ] Brand panel + SLA timer
- [ ] User rating + NPS

### Phase 3: Compliance (Week 5)
- [ ] KVKK export/erase endpoints
- [ ] Audit trail system
- [ ] Privacy notice templates
- [ ] Legal request dashboard

### Phase 4: SEO & Polish (Week 6)
- [ ] Schema.org JSON-LD
- [ ] Sitemap generation
- [ ] ISR for brand pages
- [ ] Seed data (20 brands + 50 complaints)

### Phase 5: Production (Week 7-8)
- [ ] E2E tests (Playwright)
- [ ] Observability stack
- [ ] Performance optimization
- [ ] Staging deployment
- [ ] Go-live checklist

---

## 🎯 ACCEPTANCE CRITERIA

### Minimum Viable Product (MVP):
```
✅ Tüketici yeni şikâyet oluşturabilir
✅ Marka panelden şikâyete yanıt verebilir
✅ Moderasyon PII'yi maskeler
✅ SLA timer çalışır (breach → notification)
✅ Kullanıcı çözümü değerlendirebilir (rating)
✅ KVKK export/erase çalışır
✅ Brand hub sayfaları SEO optimized
✅ Evidence upload virus scan'den geçer
```

### Production Readiness:
```
✅ E2E tests passing
✅ No critical security vulnerabilities
✅ Rate limiting + CAPTCHA
✅ Error tracking (Sentry)
✅ Backup strategy
✅ Runbook for incidents
```

---

## 📊 METRICS & KPIs

### Platform Metrics:
- **Complaint Volume:** Günlük şikâyet sayısı
- **Resolution Rate:** Çözülen şikâyet oranı
- **SLA Compliance:** Zamanında yanıt oranı
- **User Satisfaction:** NPS skoru

### Technical Metrics:
- **API Latency:** P50, P95, P99
- **Error Rate:** 4xx, 5xx oranları
- **Queue Lag:** BullMQ job processing time
- **Search Performance:** Full-text query latency

### Business Metrics:
- **Active Brands:** Doğrulanmış marka sayısı
- **Brand Engagement:** Marka yanıt oranı
- **User Retention:** Repeat user oranı
- **SEO Traffic:** Organic search visits

---

## 🛡️ RISK MANAGEMENT

### Technical Risks:
| Risk | Mitigation |
|------|------------|
| PII leak | Encryption + masking + audit trail |
| DDoS attack | Rate limiting + Cloudflare |
| Data loss | Daily backups + point-in-time recovery |
| Toxic content | Moderation pipeline + human review |

### Legal Risks:
| Risk | Mitigation |
|------|------------|
| Defamation claims | Pre-moderation + legal disclaimer |
| KVKK non-compliance | Regular audits + DPO consultation |
| Brand disputes | Clear ToS + arbitration clause |

### Operational Risks:
| Risk | Mitigation |
|------|------------|
| Service downtime | Multi-region deployment + monitoring |
| Team availability | Runbooks + on-call rotation |
| Dependency failure | Graceful degradation + fallbacks |

---

## 📚 DOCUMENTATION

### Developer Docs:
- [ ] **README.md:** Quick start guide
- [ ] **ARCHITECTURE.md:** System design overview
- [ ] **API.md:** Endpoint documentation (OpenAPI)
- [ ] **RUNBOOK.md:** Operations guide

### User Docs:
- [ ] **User Guide:** Şikâyet oluşturma rehberi
- [ ] **Brand Guide:** Marka panel kullanım kılavuzu
- [ ] **Privacy Policy:** KVKK/GDPR compliance
- [ ] **Terms of Service:** Platform kullanım koşulları

---

## 🎬 NEXT STEPS

**KOMUTUNUZU BEKLİYORUM!** 🚀

Lütfen belirtin:
1. **Hangi phase'den başlamak istersiniz?**
   - [ ] Phase 1: Foundation (monorepo + DB)
   - [ ] Phase 2: Core Features (complaint flow)
   - [ ] Phase 3: Compliance (KVKK)
   - [ ] Phase 4: SEO
   - [ ] Phase 5: Production

2. **Öncelik sırası:**
   - [ ] MVP en hızlı şekilde (core features)
   - [ ] Compliance öncelikli (KVKK/GDPR)
   - [ ] SEO optimizasyonu öncelikli

3. **Deployment hedefi:**
   - [ ] Local development only
   - [ ] Staging deployment
   - [ ] Production ready

**Komutunuzu gönderin, hemen başlayalım!** 💪
