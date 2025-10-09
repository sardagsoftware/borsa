# PERSONAL DATA PROTECTION LAW (PDPL) COMPLIANCE
## Qatar & Saudi Arabia

**Version**: 1.0
**Date**: 2025-10-09
**Applicable Laws**: Qatar PDPL (Law No. 13/2016), Saudi Arabia PDPL (Royal Decree M/19/2021)

---

## 1. DATA LOCALIZATION (QATAR)

**Requirement**: Personal Data of Qatar residents must be stored within Qatar or GCC countries (PDPL Art. 13).

**Lydian Implementation**:
- ✅ Azure Qatar Central region for QA data
- ✅ GCC-region backup (UAE)
- ✅ No data transfer outside GCC without consent

**Vendors Affected**: Talabat, Snoonu, Carrefour QA, Lulu QA

---

## 2. DATA LOCALIZATION (SAUDI ARABIA)

**Requirement**: Sensitive Personal Data must be stored within Saudi Arabia (PDPL Art. 25).

**Lydian Implementation**:
- ✅ Azure Saudi Arabia North region for SA data
- ✅ Cross-region replication within KSA
- ✅ No transfer to third countries without SDAIA approval

**Vendors Affected**: Noon, Haraj, HungerStation, Mrsool, Nana

---

## 3. CONSENT REQUIREMENTS

**Qatar PDPL Art. 8**: Explicit consent required for processing

**Saudi PDPL Art. 6**: Informed consent with right to withdraw

**Lydian Implementation**:
- ✅ Double opt-in (email verification)
- ✅ Granular consent (marketing, AI, analytics)
- ✅ One-click withdrawal
- ✅ Consent audit trail (3-year retention)

---

## 4. DATA SUBJECT RIGHTS

### Qatar PDPL (Art. 21-23)
- Right to access, rectify, erase, object

### Saudi PDPL (Art. 4)
- Right to know purpose of processing, access, rectify

**Lydian SLA**: Respond within 30 days

---

## 5. CROSS-BORDER TRANSFERS

**Qatar**: Transfers to countries with adequate protection (EU, GCC) or with consent (Art. 13)

**Saudi**: Transfers require SDAIA approval unless to countries with equivalent protection

**Lydian Mechanism**:
- ✅ Intra-GCC transfers (adequate protection)
- ✅ EU SCC for transfers to Azure EU (third-party processors)
- ✅ No transfers to non-adequate countries

---

## 6. DATA BREACH NOTIFICATION

**Qatar**: Notify authority within 72 hours (PDPL Art. 20)

**Saudi**: Notify SDAIA immediately (PDPL Implementing Regulations)

**Lydian Process**:
- Internal detection: ≤24h
- Authority notification: ≤72h
- Data subject notification: If high risk

---

## 7. COMPLIANCE CONTACTS

**Qatar**:
- Ministry of Transport and Communications (MOTC)
- Website: https://motc.gov.qa/

**Saudi Arabia**:
- Saudi Data & AI Authority (SDAIA)
- Website: https://sdaia.gov.sa/

---

**Document Control**: INTERNAL - LEGAL
