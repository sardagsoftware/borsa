/**
 * LYDIAN-IQ v3.0 - Tenant Manager
 *
 * Manages tenant registration, authentication, and OIDC flows
 */

const crypto = require('crypto');
const jwtManager = require('./jwt-manager');
const tenantScopes = require('../../policies/tenant-scopes.json');

class TenantManager {
  constructor() {
    // In-memory storage (use Redis in production)
    this.tenants = new Map(); // tenant_id -> {org_name, tax_id, email, roles, scopes, created_at}
    this.authCodes = new Map(); // code -> {tenant_id, client_id, code_challenge, redirect_uri, scopes, exp}
    this.refreshTokens = new Map(); // refresh_token -> {tenant_id, scopes, exp}
  }

  async registerTenant(data) {
    const { organization_name, tax_id, email, roles = ['admin'] } = data;

    // Validate input
    if (!organization_name || !tax_id || !email) {
      throw new Error('Missing required fields');
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      throw new Error('At least one role is required');
    }

    // Validate roles
    for (const role of roles) {
      if (!tenantScopes.roles[role]) {
        throw new Error(`Invalid role: ${role}`);
      }
    }

    const tenant_id = `tenant_${crypto.randomUUID()}`;

    // Aggregate scopes from roles
    const scopes = new Set();
    for (const role of roles) {
      const roleScopes = tenantScopes.roles[role].scopes || [];
      roleScopes.forEach(s => scopes.add(s));
    }

    const tenant = {
      tenant_id,
      organization_name,
      tax_id,
      email,
      roles,
      scopes: Array.from(scopes),
      created_at: new Date().toISOString(),
      status: 'active',
    };

    this.tenants.set(tenant_id, tenant);

    console.log(`[Tenant] Registered: ${tenant_id} (${organization_name})`);

    return tenant;
  }

  getTenant(tenant_id) {
    return this.tenants.get(tenant_id);
  }

  async generateAuthCode(tenant_id, client_id, redirect_uri, scopes, code_challenge, code_challenge_method) {
    const tenant = this.getTenant(tenant_id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Validate scopes
    const requestedScopes = scopes.split(' ');
    for (const scope of requestedScopes) {
      if (!tenant.scopes.includes(scope)) {
        throw new Error(`Scope '${scope}' not authorized for this tenant`);
      }
    }

    // Validate PKCE
    if (!code_challenge || code_challenge_method !== 'S256') {
      throw new Error('PKCE with S256 is required');
    }

    const code = crypto.randomBytes(32).toString('base64url');
    const exp = Date.now() + 120000; // 2 minutes

    this.authCodes.set(code, {
      tenant_id,
      client_id,
      redirect_uri,
      scopes,
      code_challenge,
      exp,
    });

    // Clean up expired codes
    setTimeout(() => this.authCodes.delete(code), 120000);

    return code;
  }

  async exchangeCodeForToken(code, client_id, redirect_uri, code_verifier) {
    const authCode = this.authCodes.get(code);

    if (!authCode) {
      throw new Error('Invalid or expired authorization code');
    }

    if (authCode.client_id !== client_id) {
      throw new Error('Client ID mismatch');
    }

    if (authCode.redirect_uri !== redirect_uri) {
      throw new Error('Redirect URI mismatch');
    }

    if (authCode.exp < Date.now()) {
      this.authCodes.delete(code);
      throw new Error('Authorization code expired');
    }

    // Verify PKCE code_challenge
    const hash = crypto.createHash('sha256').update(code_verifier).digest('base64url');
    if (hash !== authCode.code_challenge) {
      throw new Error('Invalid code_verifier');
    }

    // Delete code (single use)
    this.authCodes.delete(code);

    const tenant = this.getTenant(authCode.tenant_id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Generate access token
    const accessToken = jwtManager.sign({
      tenant_id: tenant.tenant_id,
      roles: tenant.roles,
      scopes: authCode.scopes.split(' '),
    }, {
      expiresIn: 1800, // 30 minutes
    });

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('base64url');
    this.refreshTokens.set(refreshToken, {
      tenant_id: tenant.tenant_id,
      scopes: authCode.scopes.split(' '),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 1800,
      refresh_token: refreshToken,
      scope: authCode.scopes,
    };
  }

  async refreshAccessToken(refresh_token) {
    const refreshData = this.refreshTokens.get(refresh_token);

    if (!refreshData) {
      throw new Error('Invalid refresh token');
    }

    if (refreshData.exp < Date.now()) {
      this.refreshTokens.delete(refresh_token);
      throw new Error('Refresh token expired');
    }

    const tenant = this.getTenant(refreshData.tenant_id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Generate new access token
    const accessToken = jwtManager.sign({
      tenant_id: tenant.tenant_id,
      roles: tenant.roles,
      scopes: refreshData.scopes,
    }, {
      expiresIn: 1800,
    });

    // Rotate refresh token (best practice)
    this.refreshTokens.delete(refresh_token);
    const newRefreshToken = crypto.randomBytes(32).toString('base64url');
    this.refreshTokens.set(newRefreshToken, {
      tenant_id: tenant.tenant_id,
      scopes: refreshData.scopes,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 1800,
      refresh_token: newRefreshToken,
      scope: refreshData.scopes.join(' '),
    };
  }

  // Check if tenant has required scope
  hasScope(tenant, requiredScope) {
    if (!tenant || !tenant.scopes) {
      return false;
    }
    return tenant.scopes.includes(requiredScope);
  }

  // Check if tenant has required role
  hasRole(tenant, requiredRole) {
    if (!tenant || !tenant.roles) {
      return false;
    }
    return tenant.roles.includes(requiredRole);
  }
}

// Singleton instance
const tenantManager = new TenantManager();

module.exports = tenantManager;
