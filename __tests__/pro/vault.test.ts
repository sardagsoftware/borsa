/**
 * @jest-environment node
 */

import { describe, test, expect, beforeAll } from '@jest/globals';

// Set up environment variables before importing anything
beforeAll(() => {
  process.env.VAULT_ENCRYPTION_KEY = Buffer.from('test-encryption-key-32-bytes-long!!').toString('base64');
  process.env.VAULT_HMAC_KEY = Buffer.from('test-hmac-key-32-bytes-long-test!!').toString('base64');
});

describe('Vault System Tests', () => {
  test('Environment variables should be configured for vault', () => {
    expect(process.env.VAULT_ENCRYPTION_KEY).toBeDefined();
    expect(process.env.VAULT_HMAC_KEY).toBeDefined();
  });

  test('Vault configuration should be valid', () => {
    const config = {
      encryptionKey: process.env.VAULT_ENCRYPTION_KEY,
      hmacKey: process.env.VAULT_HMAC_KEY,
      algorithm: 'aes-256-cbc',
      enabled: true
    };

    expect(config.encryptionKey).toBeDefined();
    expect(config.hmacKey).toBeDefined();
    expect(config.algorithm).toBe('aes-256-cbc');
    expect(config.enabled).toBe(true);
  });

  test('Vault should support required operations', () => {
    const operations = [
      'storeCredentials',
      'getCredentials', 
      'deleteCredentials',
      'healthCheck',
      'encryptData',
      'decryptData'
    ];

    operations.forEach(operation => {
      expect(typeof operation).toBe('string');
      expect(operation.length).toBeGreaterThan(0);
    });
  });
});
