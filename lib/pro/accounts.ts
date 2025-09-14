import { vault } from './vault';

interface AccountInfo {
  id: string;
  exchange: string;
  alias: string;
  isActive: boolean;
  lastUsed?: Date;
  testnet?: boolean;
}

interface AccountSession {
  userId: string;
  activeAccountId?: string;
  accounts: AccountInfo[];
}

export class MultiAccountManager {
  private sessions: Map<string, AccountSession> = new Map();

  /**
   * Initialize user session with accounts
   */
  async initializeUserSession(userId: string): Promise<AccountSession> {
    const accounts = await vault.listAccounts(userId);
    
    const accountInfos: AccountInfo[] = accounts.map(acc => ({
      id: acc.id,
      exchange: acc.exchange,
      alias: acc.alias,
      isActive: acc.isActive,
      lastUsed: acc.lastUsed
    }));

    // Set most recently used account as active
    const activeAccountId = accountInfos.length > 0 ? accountInfos[0].id : undefined;

    const session: AccountSession = {
      userId,
      activeAccountId,
      accounts: accountInfos
    };

    this.sessions.set(userId, session);
    return session;
  }

  /**
   * Get user session
   */
  getUserSession(userId: string): AccountSession | null {
    return this.sessions.get(userId) || null;
  }

  /**
   * Switch active account
   */
  async switchAccount(userId: string, accountId: string): Promise<boolean> {
    const session = this.sessions.get(userId);
    if (!session) {
      throw new Error('User session not initialized');
    }

    const account = session.accounts.find(acc => acc.id === accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found for user ${userId}`);
    }

    // Verify credentials are accessible
    const credentials = await vault.getCredentials(userId, accountId);
    if (!credentials) {
      throw new Error(`Cannot access credentials for account ${accountId}`);
    }

    session.activeAccountId = accountId;
    this.sessions.set(userId, session);

    console.log(`🔄 User ${userId} switched to account ${accountId} (${account.exchange})`);
    return true;
  }

  /**
   * Get active account credentials
   */
  async getActiveCredentials(userId: string) {
    const session = this.sessions.get(userId);
    if (!session || !session.activeAccountId) {
      return null;
    }

    return await vault.getCredentials(userId, session.activeAccountId);
  }

  /**
   * Add new account
   */
  async addAccount(
    userId: string, 
    exchange: string, 
    alias: string, 
    credentials: any
  ): Promise<string> {
    const maxAccounts = parseInt(process.env.MAX_ACCOUNTS_PER_USER || '5');
    
    const session = this.sessions.get(userId);
    if (session && session.accounts.length >= maxAccounts) {
      throw new Error(`Maximum ${maxAccounts} accounts allowed per user`);
    }

    const accountId = await vault.storeCredentials(userId, exchange, alias, credentials);
    
    // Refresh session
    await this.initializeUserSession(userId);
    
    return accountId;
  }

  /**
   * Remove account
   */
  async removeAccount(userId: string, accountId: string): Promise<boolean> {
    const success = await vault.removeAccount(userId, accountId);
    
    if (success) {
      // Refresh session
      await this.initializeUserSession(userId);
      
      const session = this.sessions.get(userId);
      if (session && session.activeAccountId === accountId) {
        // Switch to first available account
        session.activeAccountId = session.accounts.length > 0 ? session.accounts[0].id : undefined;
      }
    }
    
    return success;
  }

  /**
   * Get account info without credentials
   */
  getAccountInfo(userId: string, accountId: string): AccountInfo | null {
    const session = this.sessions.get(userId);
    if (!session) return null;
    
    return session.accounts.find(acc => acc.id === accountId) || null;
  }

  /**
   * List all accounts for user
   */
  listAccounts(userId: string): AccountInfo[] {
    const session = this.sessions.get(userId);
    return session?.accounts || [];
  }

  /**
   * Get active account info
   */
  getActiveAccount(userId: string): AccountInfo | null {
    const session = this.sessions.get(userId);
    if (!session || !session.activeAccountId) return null;
    
    return session.accounts.find(acc => acc.id === session.activeAccountId) || null;
  }

  /**
   * Check if multi-account is enabled
   */
  isMultiAccountEnabled(): boolean {
    return process.env.MULTI_ACCOUNT === 'true';
  }

  /**
   * Health check for account manager
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      const vaultHealth = await vault.healthCheck();
      const sessionCount = this.sessions.size;
      
      return {
        status: vaultHealth.status,
        details: {
          vault: vaultHealth.details,
          activeSessions: sessionCount,
          multiAccountEnabled: this.isMultiAccountEnabled()
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
export const accountManager = new MultiAccountManager();
