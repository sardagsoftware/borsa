// ========================================
// OAUTH2 BROKER - CREDENTIAL MANAGEMENT
// White-Hat: Secure credential handling with Vault integration
// ========================================

import type { OAuth2Config } from './types';

/**
 * OAuth2 Token Response
 */
export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * OAuth2 Client
 * Manages OAuth2 flow for a single vendor
 */
export class OAuth2Client {
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private refreshToken: string | null = null;

  constructor(
    private connectorId: string,
    private config: OAuth2Config
  ) {}

  /**
   * Get access token (auto-refresh if expired)
   */
  async getAccessToken(): Promise<string> {
    // Check if current token is valid
    if (this.accessToken && this.tokenExpiresAt) {
      const now = Date.now();
      const bufferMs = 60 * 1000; // Refresh 1 min before expiry

      if (now < this.tokenExpiresAt - bufferMs) {
        return this.accessToken;
      }
    }

    // Token expired or missing - fetch new one
    if (this.refreshToken && this.config.grantType === 'refresh_token') {
      return await this.refreshAccessToken();
    }

    return await this.fetchAccessToken();
  }

  /**
   * Fetch access token (client_credentials flow)
   */
  private async fetchAccessToken(): Promise<string> {
    console.log(`[OAuth2] Fetching access token for connector: ${this.connectorId}`);

    const params = new URLSearchParams({
      grant_type: this.config.grantType,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    if (this.config.scopes.length > 0) {
      params.append('scope', this.config.scopes.join(' '));
    }

    try {
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth2 token fetch failed (${response.status}): ${errorText}`);
      }

      const data: OAuth2TokenResponse = await response.json();

      // Store token
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
      this.refreshToken = data.refresh_token || null;

      console.log(`[OAuth2] ✅ Access token acquired for ${this.connectorId} (expires in ${data.expires_in}s)`);

      return this.accessToken;
    } catch (error: any) {
      console.error(`[OAuth2] ❌ Token fetch failed for ${this.connectorId}:`, error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      return await this.fetchAccessToken();
    }

    console.log(`[OAuth2] Refreshing access token for connector: ${this.connectorId}`);

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        // Refresh failed - fetch new token
        console.warn(`[OAuth2] Refresh failed, fetching new token`);
        return await this.fetchAccessToken();
      }

      const data: OAuth2TokenResponse = await response.json();

      // Update token
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }

      console.log(`[OAuth2] ✅ Access token refreshed for ${this.connectorId}`);

      return this.accessToken;
    } catch (error: any) {
      console.error(`[OAuth2] ❌ Token refresh failed for ${this.connectorId}:`, error);
      throw error;
    }
  }

  /**
   * Revoke token (on shutdown)
   */
  async revokeToken(): Promise<void> {
    if (!this.accessToken) {
      return;
    }

    console.log(`[OAuth2] Revoking token for connector: ${this.connectorId}`);

    // Clear local state
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.refreshToken = null;

    // Note: Actual revocation endpoint call would go here if vendor supports it
  }
}

/**
 * OAuth2 Broker
 * Manages OAuth2 clients for all connectors
 */
export class OAuth2Broker {
  private clients: Map<string, OAuth2Client> = new Map();

  /**
   * Register OAuth2 client for a connector
   */
  registerClient(connectorId: string, config: OAuth2Config): void {
    const client = new OAuth2Client(connectorId, config);
    this.clients.set(connectorId, client);
    console.log(`🔐 OAuth2 client registered for connector: ${connectorId}`);
  }

  /**
   * Get access token for a connector
   */
  async getAccessToken(connectorId: string): Promise<string> {
    const client = this.clients.get(connectorId);
    if (!client) {
      throw new Error(`OAuth2 client not found for connector: ${connectorId}`);
    }

    return await client.getAccessToken();
  }

  /**
   * Check if connector has OAuth2 client
   */
  hasClient(connectorId: string): boolean {
    return this.clients.has(connectorId);
  }

  /**
   * Revoke all tokens (on shutdown)
   */
  async revokeAll(): Promise<void> {
    console.log('[OAuth2Broker] Revoking all tokens...');

    for (const [connectorId, client] of this.clients.entries()) {
      try {
        await client.revokeToken();
        console.log(`  ✅ Revoked token for: ${connectorId}`);
      } catch (error: any) {
        console.error(`  ❌ Failed to revoke token for ${connectorId}:`, error);
      }
    }

    this.clients.clear();
  }
}

// Singleton instance
export const oauth2Broker = new OAuth2Broker();
