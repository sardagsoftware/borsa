import { PrismaClient } from '@prisma/client';

// Use existing prisma instance or create new one
const prisma = (globalThis as any).prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma;

interface FeatureFlag {
  key: string;
  value: boolean;
  description?: string;
}

interface CanaryConfig {
  percent: number;
  startTime: Date;
  endTime?: Date;
  metrics: {
    errorRate: number;
    responseTime: number;
    successRate: number;
  };
  isActive: boolean;
}

export class FeatureFlagsManager {
  private flags: Map<string, boolean> = new Map();
  private defaultFlags: Record<string, boolean> = {};

  constructor() {
    this.loadDefaultFlags();
    this.loadDatabaseFlags();
  }

  /**
   * Load default flags from environment
   */
  private loadDefaultFlags(): void {
    try {
      const flagsJson = process.env.FEATURE_FLAGS_JSON;
      if (flagsJson) {
        this.defaultFlags = JSON.parse(flagsJson);
        
        for (const [key, value] of Object.entries(this.defaultFlags)) {
          this.flags.set(key, value);
        }
        
        console.log(`🚩 Loaded ${Object.keys(this.defaultFlags).length} default feature flags`);
      }
    } catch (error) {
      console.error('Failed to parse FEATURE_FLAGS_JSON:', error);
    }
  }

  /**
   * Load flags from database (overrides defaults)
   */
  private async loadDatabaseFlags(): Promise<void> {
    try {
      const dbFlags = await prisma.featureFlag.findMany();
      
      for (const flag of dbFlags) {
        this.flags.set(flag.key, flag.value);
      }
      
      console.log(`🚩 Loaded ${dbFlags.length} database feature flags`);
    } catch (error) {
      console.error('Failed to load database flags:', error);
    }
  }

  /**
   * Check if feature flag is enabled
   */
  isEnabled(key: string): boolean {
    return this.flags.get(key) || false;
  }

  /**
   * Set feature flag value
   */
  async setFlag(key: string, value: boolean, description?: string): Promise<void> {
    this.flags.set(key, value);
    
    try {
      await prisma.featureFlag.upsert({
        where: { key },
        update: { value, description },
        create: { key, value, description }
      });
      
      console.log(`🚩 Set feature flag ${key} = ${value}`);
    } catch (error) {
      console.error(`Failed to set flag ${key}:`, error);
    }
  }

  /**
   * Get all flags
   */
  getAllFlags(): Record<string, boolean> {
    return Object.fromEntries(this.flags);
  }

  /**
   * Toggle flag value
   */
  async toggleFlag(key: string): Promise<boolean> {
    const currentValue = this.flags.get(key) || false;
    const newValue = !currentValue;
    
    await this.setFlag(key, newValue);
    return newValue;
  }

  /**
   * Reset flag to default value
   */
  async resetFlag(key: string): Promise<void> {
    const defaultValue = this.defaultFlags[key] || false;
    await this.setFlag(key, defaultValue);
  }

  /**
   * Bulk update flags
   */
  async bulkUpdate(updates: Record<string, boolean>): Promise<void> {
    const promises = Object.entries(updates).map(([key, value]) => 
      this.setFlag(key, value)
    );
    
    await Promise.all(promises);
    console.log(`🚩 Bulk updated ${Object.keys(updates).length} flags`);
  }

  /**
   * Health check for feature flags
   */
  healthCheck(): { status: 'healthy' | 'degraded' | 'unhealthy'; details: any } {
    return {
      status: 'healthy',
      details: {
        totalFlags: this.flags.size,
        enabledFlags: Array.from(this.flags.values()).filter(Boolean).length,
        defaultFlags: Object.keys(this.defaultFlags).length
      }
    };
  }
}

export class CanaryDeployment {
  private canaryConfig: CanaryConfig | null = null;
  private metrics: Map<string, number> = new Map();

  constructor() {
    this.loadCanaryConfig();
  }

  /**
   * Load canary configuration from environment
   */
  private loadCanaryConfig(): void {
    const percent = parseInt(process.env.CANARY_PERCENT || '10');
    const enabled = process.env.BLUE_GREEN_ENABLED === 'true';
    
    if (enabled) {
      console.log(`🐦 Canary deployment configured: ${percent}%`);
    }
  }

  /**
   * Start canary deployment
   */
  async startCanary(percent: number = 10): Promise<boolean> {
    if (this.canaryConfig?.isActive) {
      throw new Error('Canary deployment already active');
    }

    this.canaryConfig = {
      percent,
      startTime: new Date(),
      metrics: {
        errorRate: 0,
        responseTime: 0,
        successRate: 100
      },
      isActive: true
    };

    console.log(`🐦 Started canary deployment: ${percent}% traffic`);
    return true;
  }

  /**
   * Stop canary deployment
   */
  async stopCanary(promote: boolean = false): Promise<boolean> {
    if (!this.canaryConfig?.isActive) {
      throw new Error('No active canary deployment');
    }

    this.canaryConfig.isActive = false;
    this.canaryConfig.endTime = new Date();

    if (promote) {
      console.log('🚀 Promoting canary to production (blue-green switch)');
      // Here you would implement the actual deployment switch
      return true;
    } else {
      console.log('⏪ Rolling back canary deployment');
      return false;
    }
  }

  /**
   * Update canary metrics
   */
  updateMetrics(errorRate: number, responseTime: number, successRate: number): void {
    if (!this.canaryConfig?.isActive) return;

    this.canaryConfig.metrics = {
      errorRate,
      responseTime,
      successRate
    };

    // Auto-rollback if metrics are bad
    if (errorRate > 5 || responseTime > 2000 || successRate < 95) {
      console.warn('🚨 Canary metrics degraded, triggering auto-rollback');
      this.stopCanary(false);
    }
  }

  /**
   * Check if request should use canary version
   */
  shouldUseCanary(userId?: string): boolean {
    if (!this.canaryConfig?.isActive) return false;

    // Simple percentage-based routing
    // In production, you'd use more sophisticated routing (user ID hash, etc.)
    const random = Math.random() * 100;
    return random < this.canaryConfig.percent;
  }

  /**
   * Get canary status
   */
  getCanaryStatus(): {
    isActive: boolean;
    config?: CanaryConfig;
    duration?: number;
  } {
    if (!this.canaryConfig) {
      return { isActive: false };
    }

    const duration = this.canaryConfig.isActive 
      ? Date.now() - this.canaryConfig.startTime.getTime()
      : (this.canaryConfig.endTime?.getTime() || Date.now()) - this.canaryConfig.startTime.getTime();

    return {
      isActive: this.canaryConfig.isActive,
      config: this.canaryConfig,
      duration
    };
  }

  /**
   * Health check for canary system
   */
  healthCheck(): { status: 'healthy' | 'degraded' | 'unhealthy'; details: any } {
    const status = this.getCanaryStatus();
    
    return {
      status: 'healthy',
      details: {
        canaryActive: status.isActive,
        canaryPercent: status.config?.percent,
        canaryMetrics: status.config?.metrics,
        duration: status.duration
      }
    };
  }
}

// Create singleton instances
export const featureFlags = new FeatureFlagsManager();
export const canary = new CanaryDeployment();

// Common feature flag checks
export const flags = {
  // Trading features
  newSOR: () => featureFlags.isEnabled('newSOR'),
  greeksHedge: () => featureFlags.isEnabled('greeksHedge'),
  ultraMicro: () => featureFlags.isEnabled('ultraMicro'),
  
  // Multi-account features
  multiAccount: () => featureFlags.isEnabled('multiAccount'),
  portfolioOMS: () => featureFlags.isEnabled('portfolioOMS'),
  
  // Mobile features
  mobileSync: () => featureFlags.isEnabled('mobileSync'),
  pushNotifications: () => featureFlags.isEnabled('pushNotifications'),
  
  // Admin features
  advancedHealth: () => featureFlags.isEnabled('advancedHealth'),
  autoFix: () => featureFlags.isEnabled('autoFix'),
  
  // Experimental features
  aiSentiment: () => featureFlags.isEnabled('aiSentiment'),
  crossChainArb: () => featureFlags.isEnabled('crossChainArb'),
  optionsFlow: () => featureFlags.isEnabled('optionsFlow')
};
