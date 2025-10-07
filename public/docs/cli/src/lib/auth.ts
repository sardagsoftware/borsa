/**
 * Authentication Logic
 * Handles OAuth2 device flow and token management
 */

import * as inquirer from 'inquirer';
import * as ora from 'ora';
import { client } from './client';
import { configManager } from './config';
import { AuthTokenResponse, DeviceCodeResponse, UserInfo } from '../types';
import { AuthenticationError } from './errors';

export class AuthManager {
  /**
   * Perform OAuth2 device flow login
   */
  async login(): Promise<UserInfo> {
    const spinner = ora('Initiating device authentication...').start();

    try {
      // Request device code
      const deviceResponse = await client.post<DeviceCodeResponse>('/oauth/device/code', {
        client_id: 'lydian-cli',
        scope: 'openid profile email offline_access'
      });

      if (!deviceResponse.success || !deviceResponse.data) {
        throw new AuthenticationError('Failed to get device code');
      }

      const deviceData = deviceResponse.data;
      spinner.stop();

      // Display user code
      console.log('\n');
      console.log('To authenticate, please visit:');
      console.log(`  ${deviceData.verification_uri}`);
      console.log('\n');
      console.log('And enter the code:');
      console.log(`  ${deviceData.user_code}`);
      console.log('\n');
      console.log('Waiting for authentication...');

      // Poll for token
      const token = await this.pollForToken(
        deviceData.device_code,
        deviceData.interval
      );

      // Save token to config
      await configManager.set('auth_method', 'oauth2');
      await configManager.set('access_token', token.access_token);
      await configManager.set('refresh_token', token.refresh_token);
      await configManager.set('token_expires_at', Date.now() + token.expires_in * 1000);

      // Get user info
      await client.init();
      const userInfo = await this.getCurrentUser();

      return userInfo;
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  /**
   * Poll for OAuth token
   */
  private async pollForToken(
    deviceCode: string,
    interval: number
  ): Promise<AuthTokenResponse> {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      await this.sleep(interval * 1000);
      attempts++;

      try {
        const response = await client.post<AuthTokenResponse>('/oauth/device/token', {
          client_id: 'lydian-cli',
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        });

        if (response.success && response.data) {
          return response.data;
        }
      } catch (error: any) {
        if (error.code === 'authorization_pending') {
          continue;
        } else if (error.code === 'slow_down') {
          interval += 5;
          continue;
        } else if (error.code === 'expired_token') {
          throw new AuthenticationError('Device code expired. Please try again.');
        } else if (error.code === 'access_denied') {
          throw new AuthenticationError('Authentication denied by user.');
        }
        throw error;
      }
    }

    throw new AuthenticationError('Authentication timeout. Please try again.');
  }

  /**
   * Logout and clear credentials
   */
  async logout(): Promise<void> {
    const { config } = await configManager.getCurrentProfile();

    // Revoke token if exists
    if (config.access_token) {
      try {
        await client.post('/oauth/revoke', {
          token: config.access_token
        });
      } catch {
        // Ignore errors during revocation
      }
    }

    // Clear credentials
    await configManager.set('access_token', undefined);
    await configManager.set('refresh_token', undefined);
    await configManager.set('apikey', undefined);
    await configManager.set('token_expires_at', undefined);
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<UserInfo> {
    const response = await client.get<UserInfo>('/oauth/userinfo');

    if (!response.success || !response.data) {
      throw new AuthenticationError('Failed to get user info');
    }

    return response.data;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<void> {
    const { config } = await configManager.getCurrentProfile();

    if (!config.refresh_token) {
      throw new AuthenticationError('No refresh token available');
    }

    const response = await client.post<AuthTokenResponse>('/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: config.refresh_token
    });

    if (!response.success || !response.data) {
      throw new AuthenticationError('Failed to refresh token');
    }

    const token = response.data;
    await configManager.set('access_token', token.access_token);
    await configManager.set('refresh_token', token.refresh_token);
    await configManager.set('token_expires_at', Date.now() + token.expires_in * 1000);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { config } = await configManager.getCurrentProfile();

      if (config.auth_method === 'apikey' && config.apikey) {
        return true;
      }

      if (config.auth_method === 'oauth2' && config.access_token) {
        // Check if token is expired
        if (config.token_expires_at && config.token_expires_at < Date.now()) {
          // Try to refresh
          try {
            await this.refreshToken();
            return true;
          } catch {
            return false;
          }
        }
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Require authentication
   */
  async requireAuth(): Promise<void> {
    const authenticated = await this.isAuthenticated();
    if (!authenticated) {
      throw new AuthenticationError(
        'Not authenticated. Please run: lydian auth login'
      );
    }
  }

  /**
   * Helper to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const authManager = new AuthManager();
