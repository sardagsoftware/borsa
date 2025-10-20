# 🔒 Legal Gate Enforcement

**SPRINT 0 - DoD Requirement**: White-hat only, partner approval enforcement

## What is Legal Gate?

Legal Gate is Lydian SDK's compliance system that prevents unauthorized use of vendor APIs. It enforces:

1. **Partner Approval**: Connectors requiring partner agreements cannot run in production without approval
2. **Sandbox Mode**: Development and testing can proceed without partner approval
3. **Runtime Validation**: Every action execution checks Legal Gate status
4. **CI/CD Integration**: GitHub Actions validates Legal Gate before deployment

## Connector Modes

Each connector has a `mode` field in its manifest:

### 1. `public_api` (Open Access)
- No partner agreement required
- Can be used in production immediately
- Examples: Trendyol, Hepsiburada (seller APIs)

### 2. `partner_required` (Gated)
- Requires partner approval before production use
- Blocked in production until status = `partner_ok`
- Examples: Getir, Yemeksepeti, Migros (closed APIs)

### 3. `data_residency` (Geographic Restriction)
- Data must stay within specific region
- Additional compliance checks (Russia, China)
- Examples: Wildberries, Ozon, Yandex Market

## Connector Status

Each connector has a `status` field:

- **`disabled`**: Connector is disabled (never registers)
- **`sandbox`**: Development/testing only (blocked in production)
- **`partner_ok`**: Partner approval granted (production-ready)
- **`production`**: Active in production

## Enforcement Points

### 1. Registration Time (Capability Manifest)

**File**: `packages/app-sdk/src/capability-manifest.ts:19-32`

```typescript
register(manifest: ConnectorManifest): void {
  // Block production registration without partner approval
  if (manifest.mode === 'partner_required' && manifest.status !== 'partner_ok') {
    if (process.env.NODE_ENV === 'production' && manifest.status !== 'partner_ok') {
      throw new Error(
        `[Legal Gate] Cannot register connector "${manifest.id}" in production without partner approval`
      );
    }
  }
  // ... rest of registration
}
```

### 2. Action Execution Time (Action Registry)

**File**: `packages/app-sdk/src/action-registry.ts:38-47`

```typescript
async registerConnector(connector: IConnector): Promise<void> {
  const manifest = connector.getManifest();

  // Check Legal Gate
  if (manifest.mode === 'partner_required' && manifest.status !== 'partner_ok') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `[Legal Gate] Cannot register connector "${manifest.id}" without partner approval`
      );
    }
    console.warn(`[Legal Gate] Connector "${manifest.id}" registered in sandbox mode`);
  }
  // ... rest of registration
}
```

**File**: `packages/app-sdk/src/action-registry.ts:103-119`

```typescript
// Check Legal Gate before action execution
if (capability.requiresPartner) {
  const manifest = capabilityRegistry.get(connectorId);
  if (manifest?.status !== 'partner_ok' && process.env.NODE_ENV === 'production') {
    return {
      success: false,
      error: {
        code: 'PARTNER_APPROVAL_REQUIRED',
        message: `Action "${action}" requires partner approval`,
      },
    };
  }
}
```

### 3. CI/CD Pipeline (GitHub Actions)

**File**: `.github/workflows/ci-main.yml:170-202`

```yaml
legal-gate-validation:
  name: Legal Gate Validation
  runs-on: ubuntu-latest
  steps:
    - name: Validate connector status
      run: |
        for config in packages/connectors-*/src/*/config.json; do
          mode=$(jq -r '.mode' "$config")
          status=$(jq -r '.status' "$config")

          # Fail if partner_required but status != partner_ok/sandbox/disabled
          if [ "$mode" = "partner_required" ] && [ "$status" = "production" ]; then
            echo "❌ ERROR: Connector requires partner approval but status=$status"
            exit 1
          fi
        done
```

## How to Add a New Connector

### Step 1: Create Connector Manifest

```typescript
// packages/connectors-delivery/src/getir/config.json
{
  "id": "getir",
  "name": "Getir",
  "version": "1.0.0",
  "mode": "partner_required",  // ← Legal Gate mode
  "status": "sandbox",          // ← Start with sandbox
  "vendor": {
    "name": "Getir",
    "country": "TR",
    "website": "https://getir.com"
  }
}
```

### Step 2: Implement Connector

```typescript
// packages/connectors-delivery/src/getir/connector.ts
import { BaseConnector } from '@lydian/connectors-core';

export class GetirConnector extends BaseConnector {
  getManifest(): ConnectorManifest {
    return {
      id: 'getir',
      name: 'Getir',
      mode: 'partner_required',
      status: 'sandbox', // Development mode
      capabilities: [/* ... */],
    };
  }
}
```

### Step 3: Test in Development

```bash
NODE_ENV=development pnpm run dev
# ✅ Connector registers successfully (sandbox mode)
```

### Step 4: Request Partner Approval

1. Contact vendor partner team
2. Sign partnership agreement
3. Obtain API credentials
4. Update status to `partner_ok`

### Step 5: Update Status

```typescript
// After partner approval
export class GetirConnector extends BaseConnector {
  getManifest(): ConnectorManifest {
    return {
      id: 'getir',
      name: 'Getir',
      mode: 'partner_required',
      status: 'partner_ok', // ← Production-ready
      capabilities: [/* ... */],
    };
  }
}
```

### Step 6: Deploy to Production

```bash
NODE_ENV=production pnpm run build
# ✅ CI/CD passes, connector is production-ready
```

## Legal Gate Bypass (NOT RECOMMENDED)

⚠️ **Warning**: Bypassing Legal Gate violates Terms of Service and may result in:
- API key revocation
- Legal action from vendors
- Account termination

**DO NOT**:
```typescript
// ❌ NEVER DO THIS
if (manifest.mode === 'partner_required') {
  manifest.status = 'partner_ok'; // Fake approval
}
```

## Monitoring

### Check Legal Gate Status

```bash
# List all connectors and their status
curl http://localhost:3100/api/actions | jq '.data.actions[] | {id, requiresPartner}'
```

### Health Check

```bash
# Check which connectors are production-ready
curl http://localhost:3100/healthz | jq '.services.connectors'
```

### Metrics

```bash
# Prometheus metrics
curl http://localhost:3100/metrics | grep lydian_connectors_production_ready
```

## Compliance Reports

Legal Gate enforcement is logged and auditable:

```typescript
// Audit log entry (automatic)
{
  "timestamp": "2025-01-15T10:30:00Z",
  "event": "LEGAL_GATE_BLOCKED",
  "connector": "getir",
  "mode": "partner_required",
  "status": "sandbox",
  "environment": "production",
  "requestId": "req_abc123",
  "message": "[Legal Gate] Action requires partner approval"
}
```

## FAQ

### Q: Can I test partner-required connectors without approval?
**A**: Yes! Use `NODE_ENV=development` or `status: 'sandbox'`. The connector works in development mode.

### Q: What happens if I try to use a gated connector in production?
**A**: The connector registration fails at startup, preventing the service from starting.

### Q: How long does partner approval take?
**A**: Varies by vendor. Typically 2-8 weeks. Start early!

### Q: Can I use mock data for testing?
**A**: Yes! Use MSW (Mock Service Worker) to mock vendor APIs in development.

## Support

- **Legal questions**: legal@ailydian.com
- **Technical questions**: dev@ailydian.com
- **Partner inquiries**: partners@ailydian.com

---

**Last Updated**: 2025-01-15
**SPRINT 0 Milestone**: Legal Gate enforcement complete ✅
