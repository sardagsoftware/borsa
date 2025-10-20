# LYDIAN-IQ v3.0 - Server.js Authentication Integration Guide

This document provides the code additions needed to integrate OIDC/tenant authentication into server.js.

## Required Additions to server.js

### 1. Import Auth Modules (add after existing requires)

```javascript
// Authentication & OIDC
const jwtManager = require('./lib/auth/jwt-manager');
const tenantManager = require('./lib/auth/tenant-manager');
const { requireAuth, requireScope, optionalAuth } = require('./lib/auth/middleware');
```

### 2. OIDC Discovery Endpoint (add before 404 handler)

```javascript
// ===== OIDC DISCOVERY =====
app.get('/.well-known/openid-configuration', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oidc/authorize`,
    token_endpoint: `${baseUrl}/oidc/token`,
    jwks_uri: `${baseUrl}/oidc/jwks.json`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: [
      'marketplace.read',
      'marketplace.install',
      'marketplace.publish',
      'esg.read',
      'esg.write',
      'insights.read',
      'economy.optimize',
      'fl.participate',
    ],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
    claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'tenant_id', 'roles', 'scopes'],
    code_challenge_methods_supported: ['S256'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
  });
});
```

### 3. JWKS Endpoint (add before 404 handler)

```javascript
// ===== JWKS ENDPOINT =====
app.get('/oidc/jwks.json', (req, res) => {
  const jwks = jwtManager.getJWKS();
  
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.json(jwks);
});
```

### 4. Tenant Registration Endpoint (add before 404 handler)

```javascript
// ===== TENANT REGISTRATION =====
app.post('/tenant/register', async (req, res) => {
  try {
    const { organization_name, tax_id, email, roles } = req.body;

    if (!organization_name || !tax_id || !email) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'Missing required fields: organization_name, tax_id, email',
      });
    }

    const tenant = await tenantManager.registerTenant({
      organization_name,
      tax_id,
      email,
      roles: roles || ['admin'],
    });

    res.status(201).json({
      tenant_id: tenant.tenant_id,
      organization_name: tenant.organization_name,
      email: tenant.email,
      roles: tenant.roles,
      scopes: tenant.scopes,
      created_at: tenant.created_at,
    });
  } catch (error) {
    console.error('[Tenant Registration] Error:', error);
    res.status(400).json({
      error: 'registration_failed',
      message: error.message,
    });
  }
});
```

### 5. OIDC Authorize Endpoint (add before 404 handler)

```javascript
// ===== OIDC AUTHORIZE =====
app.get('/oidc/authorize', async (req, res) => {
  const {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    code_challenge,
    code_challenge_method,
    tenant_id, // In real app, this would come from login session
  } = req.query;

  // Validate parameters
  if (!response_type || response_type !== 'code') {
    return res.status(400).json({ error: 'invalid_request', message: 'Invalid response_type' });
  }

  if (!client_id || !redirect_uri || !scope) {
    return res.status(400).json({ error: 'invalid_request', message: 'Missing required parameters' });
  }

  if (!code_challenge || code_challenge_method !== 'S256') {
    return res.status(400).json({ error: 'invalid_request', message: 'PKCE with S256 is required' });
  }

  try {
    // In production, tenant_id would come from authenticated session
    const useTenantId = tenant_id || 'tenant_demo_001'; // Demo fallback

    const code = await tenantManager.generateAuthCode(
      useTenantId,
      client_id,
      redirect_uri,
      scope,
      code_challenge,
      code_challenge_method
    );

    // Redirect back to client with code
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (state) redirectUrl.searchParams.set('state', state);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('[OIDC Authorize] Error:', error);
    res.status(400).json({
      error: 'authorization_failed',
      message: error.message,
    });
  }
});
```

### 6. OIDC Token Endpoint (add before 404 handler)

```javascript
// ===== OIDC TOKEN =====
app.post('/oidc/token', async (req, res) => {
  const { grant_type, code, redirect_uri, client_id, code_verifier, refresh_token } = req.body;

  try {
    if (grant_type === 'authorization_code') {
      if (!code || !client_id || !redirect_uri || !code_verifier) {
        return res.status(400).json({
          error: 'invalid_request',
          message: 'Missing required parameters',
        });
      }

      const tokens = await tenantManager.exchangeCodeForToken(
        code,
        client_id,
        redirect_uri,
        code_verifier
      );

      res.json(tokens);
    } else if (grant_type === 'refresh_token') {
      if (!refresh_token) {
        return res.status(400).json({
          error: 'invalid_request',
          message: 'Missing refresh_token',
        });
      }

      const tokens = await tenantManager.refreshAccessToken(refresh_token);

      res.json(tokens);
    } else {
      res.status(400).json({
        error: 'unsupported_grant_type',
        message: `Grant type '${grant_type}' is not supported`,
      });
    }
  } catch (error) {
    console.error('[OIDC Token] Error:', error);
    res.status(400).json({
      error: 'invalid_grant',
      message: error.message,
    });
  }
});
```

### 7. Update Marketplace Endpoints with Auth (find and replace existing endpoints)

```javascript
// V7: MARKETPLACE (with authentication)
app.get('/api/marketplace/plugins', requireAuth, requireScope('marketplace.read'), async (req, res) => {
  try {
    const { category, search, limit = 10 } = req.query;

    const allPlugins = [
      {
        id: 'pricing-rules-v1',
        name: 'Dynamic Pricing Rules',
        description: 'AI-powered pricing optimization with demand forecasting',
        version: '1.0.0',
        author: 'Lydian DevTeam',
        category: 'pricing',
        security_score: 95,
        installs: 1250,
        rating: 4.8,
        capabilities: ['pricing', 'analytics'],
        license: 'MIT',
      },
      {
        id: 'credit-formatter-v1',
        name: 'Credit Offer Formatter',
        description: 'Compliance-checked credit display with APR calculation',
        version: '1.0.0',
        author: 'Lydian DevTeam',
        category: 'compliance',
        security_score: 98,
        installs: 890,
        rating: 4.9,
        capabilities: ['compliance', 'finance'],
        license: 'MIT',
      },
      {
        id: 'shipping-label-v1',
        name: 'Shipping Label Generator',
        description: 'Multi-carrier label generation with address validation',
        version: '1.0.0',
        author: 'Lydian DevTeam',
        category: 'logistics',
        security_score: 92,
        installs: 2100,
        rating: 4.7,
        capabilities: ['logistics', 'data_transform'],
        license: 'MIT',
      },
    ];

    let plugins = allPlugins;

    if (category) {
      plugins = plugins.filter(p => p.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      plugins = plugins.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    plugins = plugins.slice(0, parseInt(limit));

    res.status(200).json({
      plugins,
      total: plugins.length,
      tenant_id: req.tenant.tenant_id,
    });
  } catch (error) {
    console.error('[Marketplace] Error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

app.post('/api/marketplace/plugins/:id/install', requireAuth, requireScope('marketplace.install'), async (req, res) => {
  try {
    const { id } = req.params;
    
    res.status(200).json({
      success: true,
      plugin_id: id,
      tenant_id: req.tenant.tenant_id,
      installed_at: new Date().toISOString(),
      message: `Plugin '${id}' installed successfully`,
    });
  } catch (error) {
    console.error('[Marketplace Install] Error:', error);
    res.status(500).json({ error: 'install_failed', message: error.message });
  }
});
```

### 8. Update ESG Metrics Endpoint with Auth (find and replace existing endpoint)

```javascript
// Update existing /api/esg/metrics endpoint
app.get('/api/esg/metrics', requireAuth, requireScope('esg.read'), async (req, res) => {
  try {
    const { period = '2025-10' } = req.query;

    const metrics = {
      period,
      tenant_id: req.tenant.tenant_id,
      total_shipments: 1250,
      total_carbon_kg_co2: 875.5,
      avg_carbon_per_shipment: 0.7,
      green_deliveries_percent: 15.2,
      carbon_reduction_vs_baseline_percent: -8.5,
      top_polluting_routes: [
        { origin: 'Istanbul', destination: 'Ankara', carbon_kg_co2: 125.3, shipments: 450 },
        { origin: 'Izmir', destination: 'Bursa', carbon_kg_co2: 98.7, shipments: 320 },
      ],
      recommendations: [
        'Switch 25% of ground shipments to rail (potential 45kg CO₂ reduction)',
        'Consolidate shipments to reduce frequency (potential 22kg CO₂ reduction)',
      ],
    };

    res.status(200).json({ metrics });
  } catch (error) {
    console.error('[ESG Metrics] Error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});
```

### 9. Update Insights Endpoints with Auth (optional - if needed)

```javascript
// Add to existing /api/insights/* endpoints if tenant-specific insights are needed
// Example for /api/insights/price-trend
app.get('/api/insights/price-trend', optionalAuth, async (req, res) => {
  // If authenticated, can provide tenant-specific insights
  // If not authenticated, provide generic public insights (with DP)
  
  const tenant_id = req.tenant ? req.tenant.tenant_id : 'public';
  
  // ... existing endpoint logic ...
});
```

## Integration Order

1. **Add imports** to top of server.js
2. **Add OIDC discovery** endpoint
3. **Add JWKS** endpoint
4. **Add tenant registration** endpoint
5. **Add OIDC authorize** endpoint
6. **Add OIDC token** endpoint
7. **Update marketplace endpoints** with auth middleware
8. **Update ESG metrics endpoint** with auth middleware
9. **Restart server** and test

## Testing the Integration

```bash
# 1. Check OIDC discovery
curl http://localhost:3100/.well-known/openid-configuration | jq .

# 2. Check JWKS
curl http://localhost:3100/oidc/jwks.json | jq .

# 3. Register tenant
curl -X POST http://localhost:3100/tenant/register \
  -H "Content-Type: application/json" \
  -d '{"organization_name":"Test Corp","tax_id":"1234567890","email":"admin@test.com","roles":["admin"]}' | jq .

# 4. Get authorization code (PKCE)
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_')
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -sha256 -binary | base64 | tr -d '=' | tr '+/' '-_')

curl "http://localhost:3100/oidc/authorize?response_type=code&client_id=test-client&redirect_uri=http://localhost:3100/callback&scope=marketplace.read%20esg.read&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256&tenant_id=<TENANT_ID>"

# 5. Exchange code for token
curl -X POST http://localhost:3100/oidc/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=<AUTH_CODE>&redirect_uri=http://localhost:3100/callback&client_id=test-client&code_verifier=$CODE_VERIFIER" | jq .

# 6. Use token to access protected endpoint
TOKEN="<ACCESS_TOKEN>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3100/api/marketplace/plugins | jq .

# 7. Test ESG metrics with token
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3100/api/esg/metrics?period=2025-10" | jq .
```

## Notes

- All auth modules are loaded as singletons
- JWT keys auto-rotate every 24 hours
- PKCE (S256) is required for all authorization flows
- Access tokens expire in 30 minutes
- Refresh tokens expire in 7 days
- In production, replace in-memory storage with Redis

