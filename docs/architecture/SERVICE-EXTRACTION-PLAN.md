# Service Extraction Plan - server.js Refactoring

**Date:** January 2, 2026
**Status:** Planning Phase
**Current State:** Monolithic (17,108 lines)
**Target State:** 18 Microservices
**Timeline:** 10-12 weeks

---

## Executive Summary

- **Total Lines**: 17,108
- **Estimated Endpoints**: 371+ HTTP routes
- **Current State**: Monolithic Express.js server
- **Recommendation**: Extract into 18 microservices
- **Team Size**: 8-12 developers
- **Risk Level**: High (HIPAA/medical compliance)

---

## Service Inventory

### **Service 1: auth-service.js**
- **Lines**: ~800-1000
- **Priority**: **P0** (Critical - blocks all other services)
- **Endpoints**: `/api/auth/*`, OAuth providers (Google, Microsoft, GitHub, Apple)
- **Dependencies**: JWT, Passport, session management

### **Service 2: medical-ai-service.js**
- **Lines**: ~3000-3500 (LARGEST service)
- **Priority**: **P0** (Mission-critical healthcare)
- **Endpoints**: 30+ medical endpoints (chat, transcribe, rare-disease, emergency-triage, etc.)
- **Dependencies**: HIPAA audit logger, FHIR/DICOM, Azure AI
- **Notes**: Consider sub-splitting into specialty services

### **Service 3: legal-ai-service.js**
- **Lines**: ~600-800
- **Priority**: **P1**
- **Endpoints**: `/api/legal-ai/*`, `/api/legal-services/*`
- **Dependencies**: Legal document analysis, contract review

### **Service 4: neuro-health-service.js**
- **Lines**: ~500-700
- **Priority**: **P1**
- **Endpoints**: `/api/neuro/*` (imaging, health-index, risk-assessment)
- **Dependencies**: Azure AI vision, medical imaging

### **Service 5: civic-intelligence-service.js (CIG)**
- **Lines**: ~800-1000
- **Priority**: **P1**
- **Endpoints**: 6 CIG modules (SVF, MAP, ATG, RRO, UMO, PHN)
- **Dependencies**: IoT data, real-time analytics

### **Service 6: azure-ai-service.js**
- **Lines**: ~1200-1500
- **Priority**: **P0** (Core AI provider)
- **Endpoints**: `/api/azure/*` (multimodal, search, speech, quantum, health)
- **Dependencies**: Azure Cognitive Services

### **Service 7: ai-chat-service.js**
- **Lines**: ~2000-2500
- **Priority**: **P0** (Core chat)
- **Endpoints**: `/api/chat*` (unified, GPT-5, Gemini, specialized)
- **Dependencies**: OpenAI, Anthropic, Google, Groq, Perplexity

### **Service 8: file-processing-service.js**
- **Lines**: ~600-800
- **Priority**: **P1**
- **Endpoints**: `/api/upload`, `/api/imagen-photo`, `/api/generate-image`
- **Dependencies**: Multer, Sharp, pdf-parse, mammoth

### **Service 9: translation-service.js**
- **Lines**: ~400-500
- **Priority**: **P1**
- **Endpoints**: `/api/translate`, `/api/languages` (100+ languages)
- **Dependencies**: Azure Translator

### **Service 10: rag-search-service.js**
- **Lines**: ~500-700
- **Priority**: **P1**
- **Endpoints**: `/api/rag`, `/api/search`, `/api/knowledge-graph/*`
- **Dependencies**: Vector DB, Neo4j

### **Service 11: video-processing-service.js**
- **Lines**: ~300-400
- **Priority**: **P2**
- **Endpoints**: `/api/video`
- **Dependencies**: Azure Video Indexer

### **Service 12: seo-indexing-service.js**
- **Lines**: ~300-400
- **Priority**: **P2**
- **Endpoints**: `/api/seo/*`, `/robots.txt`, `/sitemap.xml`
- **Dependencies**: IndexNow protocol

### **Service 13: admin-metrics-service.js**
- **Lines**: ~600-800
- **Priority**: **P1**
- **Endpoints**: `/api/admin/*`, `/api/metrics/*`, `/api/cost-tracking/*`
- **Dependencies**: Token Governor, API Health Monitor

### **Service 14: websocket-streaming-service.js**
- **Lines**: ~400-600
- **Priority**: **P1**
- **Endpoints**: WebSocket server, SSE streaming
- **Dependencies**: WebSocket library

### **Service 15: hospital-admin-service.js**
- **Lines**: ~400-500
- **Priority**: **P2**
- **Endpoints**: `/api/hospital/admin-auth`, `/api/hospital/config`
- **Dependencies**: Hospital-specific auth

### **Service 16: developer-tools-service.js**
- **Lines**: ~800-1000
- **Priority**: **P2**
- **Endpoints**: `/api/zai/*` (code, analyze, debug), `/developers`, `/api-docs`
- **Dependencies**: Z.AI DevPack

### **Service 17: monitoring-service.js**
- **Lines**: ~500-700
- **Priority**: **P0** (Critical for observability)
- **Endpoints**: `/status`, `/api/alerts/webhook`, health checks
- **Dependencies**: Sentry, Winston, API Health Monitor

### **Service 18: static-content-service.js**
- **Lines**: ~200-300
- **Priority**: **P2**
- **Endpoints**: Static pages (home, chat, dashboard, settings, etc.)
- **Dependencies**: Express static, CDN

---

## Migration Priority Matrix

### **Phase 1 (P0 - Critical)**: Week 1-2
1. monitoring-service.js - Observability first
2. auth-service.js - Authentication layer
3. azure-ai-service.js - Core AI provider
4. ai-chat-service.js - Core functionality

### **Phase 2 (P0 - Healthcare Critical)**: Week 3-4
5. medical-ai-service.js - HIPAA-compliant

### **Phase 3 (P1 - High Value)**: Week 5-6
6. legal-ai-service.js
7. neuro-health-service.js
8. civic-intelligence-service.js
9. admin-metrics-service.js

### **Phase 4 (P1 - Supporting)**: Week 7-8
10. file-processing-service.js
11. translation-service.js
12. rag-search-service.js
13. websocket-streaming-service.js

### **Phase 5 (P2 - Optional)**: Week 9-10
14. seo-indexing-service.js
15. hospital-admin-service.js
16. developer-tools-service.js
17. video-processing-service.js
18. static-content-service.js

---

## Critical Dependencies

### **Shared Across Services:**
- HIPAA Audit Logger (medical-ai, neuro-health, hospital-admin)
- Token Governor (medical-ai, ai-chat, azure-ai)
- Firildak AI Engine (ai-chat, azure-ai)
- Redis Cache (all services)
- Sentry (all services)
- Authentication (all services)

### **External APIs:**
- Azure Services (azure-ai, medical-ai, neuro-health, file-processing, translation)
- OpenAI (ai-chat)
- Anthropic (ai-chat, medical-ai)
- Google Gemini (ai-chat)
- Groq (ai-chat, medical-ai)
- Perplexity (ai-chat)

---

## Estimated Service Sizes

| Service | Lines | Complexity | Team |
|---------|-------|------------|------|
| medical-ai-service | 3000-3500 | Very High | 3-4 devs |
| ai-chat-service | 2000-2500 | High | 2-3 devs |
| azure-ai-service | 1200-1500 | High | 2 devs |
| auth-service | 800-1000 | Medium | 1-2 devs |
| civic-intelligence-service | 800-1000 | High | 2 devs |
| developer-tools-service | 800-1000 | Medium | 1-2 devs |
| admin-metrics-service | 600-800 | Medium | 1-2 devs |
| neuro-health-service | 500-700 | High | 1-2 devs |
| rag-search-service | 500-700 | Medium | 1-2 devs |
| legal-ai-service | 600-800 | Medium | 1-2 devs |
| monitoring-service | 500-700 | Medium | 1-2 devs |
| file-processing-service | 600-800 | Low | 1 dev |
| websocket-streaming-service | 400-600 | Medium | 1 dev |
| hospital-admin-service | 400-500 | Low | 1 dev |
| translation-service | 400-500 | Low | 1 dev |
| seo-indexing-service | 300-400 | Low | 1 dev |
| video-processing-service | 300-400 | Medium | 1 dev |
| static-content-service | 200-300 | Very Low | 1 dev |

---

## Critical Success Factors

1. Extract **monitoring FIRST** (observability)
2. Maintain **HIPAA compliance** during migration
3. **Zero downtime** deployment strategy
4. Comprehensive **integration testing**
5. Shared middleware as **npm packages**

---

## Risk Mitigation

### **High-Risk Services:**
- medical-ai-service (HIPAA compliance)
- auth-service (security-critical)
- azure-ai-service (external dependencies)

### **Mitigation Strategies:**
- Staged rollout (canary deployments)
- Feature flags (gradual migration)
- Rollback procedures
- Comprehensive monitoring
- Load testing before production

---

## Next Steps

1. Review and approve this plan
2. Set up microservices infrastructure (Docker, Kubernetes)
3. Extract auth-service (Week 1)
4. Extract monitoring-service (Week 1)
5. Continue with Phase 1 services
