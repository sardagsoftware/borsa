import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

// Use existing prisma instance or create new one
const prisma = (globalThis as any).prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma;

interface VaultConfig {
  provider: 'kv' | 'hashicorp' | 'cloud-kms';
  namespace?: string;
  encryptionKey?: string;
}

interface ExchangeCredentials {
  apiKey: string;
  secret?: string;
  apiSecret?: string;
  passphrase?: string;
  subAccount?: string;
  testnet?: boolean;
  sandbox?: boolean;
}

interface StoredCredentials {
  id: string;
  userId: string;
  exchange: string;
  alias: string;
  encryptedData: string;
  iv: string;
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export class SecureVault {
  private config: VaultConfig;
  private encryptionKey: Buffer;

  constructor() {
    this.config = {
      provider: (process.env.VAULT_PROVIDER as any) || 'kv',
      namespace: process.env.VAULT_KV_NAMESPACE || 'exkeys',
      encryptionKey: process.env.VAULT_ENCRYPTION_KEY
    };

    if (!this.config.encryptionKey) {
      throw new Error('VAULT_ENCRYPTION_KEY is required for secure vault operations');
    }

    // Support both hex and base64 encoding
    try {
      if (this.config.encryptionKey.length === 64) {
        // Hex encoded (64 chars = 32 bytes)
        this.encryptionKey = Buffer.from(this.config.encryptionKey, 'hex');
      } else {
        // Base64 encoded
        this.encryptionKey = Buffer.from(this.config.encryptionKey, 'base64');
      }
    } catch {
      throw new Error('Invalid encryption key format - must be hex or base64 encoded');
    }

    if (this.encryptionKey.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (256-bit AES)');
    }
  }

  /**
   * Encrypt credentials using AES-256-CBC
   */
  private encrypt(data: ExchangeCredentials): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16); // 128-bit IV for CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Create integrity tag using HMAC
    const tag = crypto.createHmac('sha256', this.encryptionKey)
      .update(encrypted + iv.toString('base64'))
      .digest('base64')
      .substring(0, 16);
    
    return {
      encrypted,
      iv: iv.toString('base64'),
      tag
    };
  }

  /**
   * Decrypt credentials using AES-256-CBC
   */
  private decrypt(encryptedData: string, iv: string, tag: string): ExchangeCredentials {
    // Verify integrity tag
    const expectedTag = crypto.createHmac('sha256', this.encryptionKey)
      .update(encryptedData + iv)
      .digest('base64')
      .substring(0, 16);
    
    if (tag !== expectedTag) {
      throw new Error('Data integrity check failed');
    }
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, Buffer.from(iv, 'base64'));
    
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Store encrypted credentials for a user
   */
  async storeCredentials(
    userId: string, 
    exchange: string, 
    alias: string, 
    credentials: ExchangeCredentials
  ): Promise<string> {
    const { encrypted, iv, tag } = this.encrypt(credentials);
    
    // Combine encrypted data and tag for storage
    const encryptedWithTag = `${encrypted}:${tag}`;
    
    const stored = await prisma.exchangeAccount.create({
      data: {
        userId,
        exchange,
        alias,
        encryptedData: encryptedWithTag,
        iv,
        isActive: true,
        createdAt: new Date()
      }
    });

    console.log(`🔐 Stored credentials for ${exchange} (${alias}) - User: ${userId}`);
    return stored.id;
  }

  /**
   * Retrieve and decrypt credentials
   */
  async getCredentials(userId: string, accountId: string): Promise<ExchangeCredentials | null> {
    const account = await prisma.exchangeAccount.findFirst({
      where: {
        id: accountId,
        userId,
        isActive: true
      }
    });

    if (!account) {
      return null;
    }

    try {
      const [encrypted, tag] = account.encryptedData.split(':');
      const credentials = this.decrypt(encrypted, account.iv, tag);
      
      // Update last used timestamp
      await prisma.exchangeAccount.update({
        where: { id: accountId },
        data: { lastUsed: new Date() }
      });

      return credentials;
    } catch (error) {
      console.error(`❌ Failed to decrypt credentials for account ${accountId}:`, error);
      return null;
    }
  }

  /**
   * List all accounts for a user (without credentials)
   */
  async listAccounts(userId: string): Promise<Array<{
    id: string;
    exchange: string;
    alias: string;
    createdAt: Date;
    lastUsed?: Date;
    isActive: boolean;
  }>> {
    const accounts = await prisma.exchangeAccount.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        exchange: true,
        alias: true,
        createdAt: true,
        lastUsed: true,
        isActive: true
      },
      orderBy: { lastUsed: 'desc' }
    });

    return accounts;
  }

  /**
   * Remove/deactivate account
   */
  async removeAccount(userId: string, accountId: string): Promise<boolean> {
    const result = await prisma.exchangeAccount.updateMany({
      where: {
        id: accountId,
        userId,
        isActive: true
      },
      data: {
        isActive: false,
        deactivatedAt: new Date()
      }
    });

    return result.count > 0;
  }

  /**
   * Rotate encryption key (for scheduled key rotation)
   */
  async rotateCredentials(userId: string, accountId: string, newCredentials: ExchangeCredentials): Promise<boolean> {
    const account = await prisma.exchangeAccount.findFirst({
      where: { id: accountId, userId, isActive: true }
    });

    if (!account) {
      return false;
    }

    const { encrypted, iv, tag } = this.encrypt(newCredentials);
    const encryptedWithTag = `${encrypted}:${tag}`;

    await prisma.exchangeAccount.update({
      where: { id: accountId },
      data: {
        encryptedData: encryptedWithTag,
        iv,
        lastRotated: new Date()
      }
    });

    console.log(`🔄 Rotated credentials for account ${accountId}`);
    return true;
  }

  /**
   * Health check for vault operations
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      // Test encryption/decryption
      const testData: ExchangeCredentials = {
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        testnet: true
      };

      const { encrypted, iv, tag } = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted, iv, tag);

      const isValid = JSON.stringify(testData) === JSON.stringify(decrypted);

      if (!isValid) {
        return {
          status: 'unhealthy',
          details: { error: 'Encryption/decryption test failed' }
        };
      }

      // Test database connectivity
      const accountCount = await prisma.exchangeAccount.count();

      return {
        status: 'healthy',
        details: {
          provider: this.config.provider,
          totalAccounts: accountCount,
          encryptionTest: 'passed'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }
}

// Singleton instance
export const vault = new SecureVault();
