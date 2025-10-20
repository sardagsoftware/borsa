# RUSSIA DATA LOCALIZATION COMPLIANCE
## Federal Law No. 242-FZ (Data Localization Law)

**Version**: 1.0
**Date**: 2025-10-09
**Status**: PRODUCTION DEPLOYMENT BLOCKED (Sanctions Compliance)
**Law**: Federal Law No. 242-FZ (July 21, 2014)

---

## 1. DATA LOCALIZATION REQUIREMENT

**Russian Federal Law 242-FZ**: Personal data of Russian citizens must be stored on servers physically located in Russia.

**Scope**: All personal data of Russian citizens, regardless of where the company is registered.

**Penalty**: Fines up to RUB 18M (~$200K USD) + potential service blocking.

---

## 2. LYDIAN-IQ POSITION: PRODUCTION BLOCKED

Due to **international sanctions** (US/EU/UK) and **data residency complexity**, Lydian-IQ **permanently blocks production deployment** for Russian connectors.

**Status**: `sandbox_only` (development and testing only)

**Affected Vendors**:
- Wildberries
- Ozon
- Yandex Market
- Avito
- Yandex Eats

---

## 3. SANCTIONS COMPLIANCE

### US Sanctions (OFAC)
- Executive Order 14024 (April 2021): Sanctions on Russian economy
- Restrictions on financial transactions, technology transfers

### EU Sanctions
- Council Regulation (EU) 833/2014: Sectoral sanctions on Russia
- Export controls on dual-use goods and technology

### UK Sanctions
- Russia (Sanctions) (EU Exit) Regulations 2019

**Lydian Compliance**:
- ✅ No payment processing for RU vendors
- ✅ No production deployment
- ✅ Feature-flagged connectors (disabled by default)
- ✅ Data residency=ru_only (no data export)

---

## 4. TECHNICAL CONTROLS

### Legal Gate Enforcement

**File**: `config/security/sanctions.json`

```json
{
  "RU": {
    "sanctioned": true,
    "data_residency": "ru_only",
    "status": "sandbox_only",
    "restrictions": {
      "production_deployment": false,
      "payment_processing": false,
      "data_export": false
    }
  }
}
```

### CI/CD Checks

**Pre-Deploy Check**:
```bash
# FAIL if RU connector is deployed to production
if [ "$CONNECTOR" = "wildberries" ] && [ "$ENV" = "production" ]; then
  echo "ERROR: RU connectors blocked in production (sanctions compliance)"
  exit 1
fi
```

### Runtime Enforcement

**Code**: All RU connectors throw `PRODUCTION_BLOCKED` error if `APP_ENV=production`.

---

## 5. DATA RESIDENCY (IF FUTURE DEPLOYMENT)

**IF** sanctions are lifted AND Lydian decides to serve Russian market:

**Requirements**:
1. **Server Location**: Physical servers in Russia (Moscow/St. Petersburg data centers)
2. **Database**: PostgreSQL instance in Russia
3. **Data Processing**: All processing must occur on Russian soil
4. **Roskomnadzor Registration**: Register as data operator
5. **Personal Data Cross-Border Transfer**: Requires Roskomnadzor approval

**Estimated Cost**: $50K+ setup, $10K/month hosting

**Current Decision**: **NOT PURSUED** due to sanctions and compliance complexity.

---

## 6. ALTERNATIVE: SANDBOX TESTING ONLY

**Permitted Use Cases**:
- Connector development (local testing)
- Integration testing (sandbox APIs)
- Research and analysis

**Prohibited Use Cases**:
- ❌ Production deployment
- ❌ Real customer data processing
- ❌ Payment processing
- ❌ Data storage (beyond local development)

---

## 7. ROSKOMNADZOR CONTACTS

**Federal Service for Supervision of Communications** (Roskomnadzor):
- Website: https://rkn.gov.ru/
- Email: rsoc@rkn.gov.ru
- Hotline: +7 (495) 987-68-00

**Personal Data Protection Registry**:
- https://pd.rkn.gov.ru/

---

## 8. SANCTIONS MONITORING

**Review Frequency**: Quarterly (or upon sanctions updates)

**Monitoring Sources**:
- US OFAC Sanctions List: https://sanctionssearch.ofac.treas.gov/
- EU Sanctions Map: https://www.sanctionsmap.eu/
- UK Sanctions List: https://www.gov.uk/government/collections/financial-sanctions-regime-specific-consolidated-lists-and-releases

**Next Review**: 2026-01-09

---

## 9. LEGAL DISCLAIMER

This document is for informational purposes only and does not constitute legal advice. Lydian AI Inc. does not guarantee compliance with Russian data localization laws.

For legal advice, consult a Russian-licensed attorney specializing in data protection and sanctions law.

---

**Document Control**: INTERNAL - LEGAL PRIVILEGED
**Classification**: RESTRICTED
**Retention**: Until sanctions lifted + 5 years
