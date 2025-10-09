# DATA PROCESSING AGREEMENT (DPA)
## Lydian-IQ Platform

**Version**: 1.0
**Date**: 2025-10-09
**Status**: Template (Requires Legal Signature)

---

## PARTIES

**DATA CONTROLLER** ("Client"):
[CLIENT NAME]
[CLIENT ADDRESS]

**DATA PROCESSOR** ("Lydian"):
Lydian AI Inc.
[LYDIAN ADDRESS]

---

## 1. DEFINITIONS

**Personal Data**: Any information relating to an identified or identifiable natural person as defined in GDPR Art. 4(1).

**Processing**: Any operation performed on Personal Data, including collection, storage, transmission, deletion.

**Sub-Processor**: Third-party processor engaged by Lydian (e.g., Azure, OpenAI).

---

## 2. SCOPE OF PROCESSING

**Subject Matter**: Multi-channel e-commerce synchronization (commerce, delivery, grocery)

**Duration**: Term of Service Agreement + 30 days retention

**Nature and Purpose**:
- Product catalog synchronization
- Order management
- AI-powered optimization
- Compliance and audit

**Personal Data Categories**:
- Identity: Name, email, phone
- Financial: Order values (tokenized)
- Location: Delivery addresses
- Behavioral: Product views, AI interactions

**Data Subjects**: Sellers, buyers, couriers

---

## 3. OBLIGATIONS OF DATA PROCESSOR (LYDIAN)

Lydian shall:

1. **Process only on documented instructions** from Client (this DPA + Service Agreement)
2. **Ensure confidentiality** of personnel with access to Personal Data
3. **Implement technical and organizational measures** per GDPR Art. 32:
   - Encryption (TLS 1.3, AES-256)
   - Access control (RBAC, MFA)
   - Monitoring (OpenTelemetry, Prometheus)
4. **Engage Sub-Processors** only with prior written consent (list in Annex A)
5. **Assist Client** in responding to Data Subject Rights requests (≤30 days)
6. **Notify breaches** to Client within 24 hours of detection
7. **Delete or return** Personal Data within 30 days of contract termination
8. **Provide audit information** to Client upon request

---

## 4. SUB-PROCESSORS (ANNEX A)

| Sub-Processor | Purpose | Location | Safeguards |
|---------------|---------|----------|------------|
| Microsoft Azure | Hosting, storage | EU/TR | SCC, ISO 27001 |
| Upstash | Redis caching | Global (EU option) | SCC |
| OpenAI | AI processing | US | DPA, data deletion |
| Anthropic | AI processing | US | DPA, data deletion |
| Stripe | Payment tokenization | Global | PCI-DSS Level 1 |

**Client Consent**: Client consents to the Sub-Processors listed above. Lydian will notify Client 30 days before engaging new Sub-Processors.

---

## 5. DATA SUBJECT RIGHTS

Lydian will assist Client in fulfilling Data Subject Rights:

- **Access** (GDPR Art. 15): Export data within 30 days
- **Rectification** (Art. 16): Update profile via API
- **Erasure** (Art. 17): Delete data within 7 days
- **Portability** (Art. 20): Export to JSON/CSV

---

## 6. SECURITY MEASURES

**Encryption**:
- TLS 1.3 (in transit)
- AES-256 (at rest)

**Access Control**:
- RBAC/ABAC
- MFA for admin
- Per-connector scoped tokens

**Monitoring**:
- 24/7 security monitoring
- Intrusion detection (Azure Sentinel)
- Audit logs (365-day retention)

**Incident Response**:
- Breach notification ≤72h (GDPR Art. 33)
- Forensic investigation
- Post-incident report

---

## 7. DATA RETENTION

| Data Type | Retention | Deletion Method |
|-----------|-----------|-----------------|
| Transactional | 7 days | Automated redaction |
| Analytics | 90 days | Automated deletion |
| Audit logs | 365 days | Secure deletion (NIST 800-88) |
| Backups | 30 days | Encrypted overwrite |

---

## 8. INTERNATIONAL DATA TRANSFERS

**Mechanism**: Standard Contractual Clauses (SCC) - EU Commission Decision 2021/914

**Transfers**:
- EU → Azure EU data centers (intra-EU, no transfer)
- TR → Azure Turkey region (local processing)
- MENA → Regional data centers
- **RU → BLOCKED** (production deployment disabled)

---

## 9. AUDIT RIGHTS

Client may audit Lydian's compliance:
- **Frequency**: Once per year
- **Notice**: 30 days advance notice
- **Scope**: Security controls, data processing records
- **Alternative**: Accept third-party audit report (SOC 2 Type II, ISO 27001)

---

## 10. LIABILITY AND INDEMNIFICATION

**Lydian Liability**: Limited to direct damages up to 12 months' fees (Service Agreement)

**Indemnification**: Lydian indemnifies Client for GDPR fines arising from Lydian's breach of this DPA.

---

## 11. TERM AND TERMINATION

**Effective Date**: Upon Service Agreement execution

**Termination**: Upon Service Agreement termination + 30-day data retention

**Post-Termination**:
- Lydian deletes or returns all Personal Data within 30 days
- Client may request certification of deletion

---

## 12. AMENDMENTS

This DPA may be amended by mutual written consent to reflect regulatory changes (e.g., GDPR updates).

---

## SIGNATURES

**DATA CONTROLLER (Client)**:

Name: _________________________
Title: _________________________
Signature: _____________________
Date: __________________________

**DATA PROCESSOR (Lydian)**:

Name: _________________________
Title: _________________________
Signature: _____________________
Date: __________________________

---

**Annexes**:
- Annex A: Sub-Processor List
- Annex B: Technical and Organizational Measures (see DPIA.md)
- Annex C: Standard Contractual Clauses (EU Commission 2021/914)
