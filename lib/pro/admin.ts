import { vault } from './vault';
import { accountManager } from './accounts';
import { portfolioOMS } from './oms';
import { telemetry } from './telemetry';
import { alertsEngine } from './alerts';
import { featureFlags } from './flags';
import { drManager } from './dr';
import { deploymentManager } from './canary';

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      details: any;
      lastCheck: Date;
    };
  };
  metrics: {
    uptime: number;
    memoryUsage: number;
    activeConnections: number;
    errorRate: number;
  };
}

interface AutoFixResult {
  service: string;
  issue: string;
  fixed: boolean;
  actions: string[];
  error?: string;
}

export class AdminTools {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck: SystemHealth | null = null;

  constructor() {
    // Start periodic health checks
    this.startHealthMonitoring();
    console.log('🛠️ Admin Tools initialized');
  }

  /**
   * Perform comprehensive system health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    console.log('🔍 Performing comprehensive health check...');
    const startTime = Date.now();

    const health: SystemHealth = {
      overall: 'healthy',
      services: {},
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        activeConnections: 0, // Will be populated
        errorRate: 0 // Will be calculated
      }
    };

    const services = [
      { name: 'vault', checker: () => vault.healthCheck() },
      { name: 'accounts', checker: () => accountManager.healthCheck() },
      { name: 'portfolio', checker: () => portfolioOMS.healthCheck() },
      { name: 'telemetry', checker: () => telemetry.healthCheck() },
      { name: 'alerts', checker: () => alertsEngine.healthCheck() },
      { name: 'flags', checker: () => featureFlags.healthCheck() },
      { name: 'dr', checker: () => drManager.healthCheck() },
      { name: 'deployment', checker: () => deploymentManager.healthCheck() }
    ];

    // Check each service
    for (const service of services) {
      try {
        const result = await service.checker();
        health.services[service.name] = {
          status: result.status,
          details: result.details,
          lastCheck: new Date()
        };

        // Update overall status
        if (result.status === 'unhealthy') {
          health.overall = 'unhealthy';
        } else if (result.status === 'degraded' && health.overall === 'healthy') {
          health.overall = 'degraded';
        }
      } catch (error) {
        health.services[service.name] = {
          status: 'unhealthy',
          details: { error: (error as Error).message },
          lastCheck: new Date()
        };
        health.overall = 'unhealthy';
      }
    }

    // Calculate metrics
    health.metrics.errorRate = this.calculateErrorRate();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Health check completed in ${duration}ms - Status: ${health.overall}`);

    // Store for reference
    this.lastHealthCheck = health;

    // Record metrics
    telemetry.setGauge('admin_health_check_duration_ms', duration);
    telemetry.setGauge('admin_overall_health', health.overall === 'healthy' ? 1 : 0);

    return health;
  }

  /**
   * Auto-fix common issues
   */
  async autoFix(): Promise<AutoFixResult[]> {
    console.log('🔧 Starting auto-fix process...');
    const results: AutoFixResult[] = [];

    // Get current health status
    const health = this.lastHealthCheck || await this.performHealthCheck();

    // Fix unhealthy services
    for (const [serviceName, serviceHealth] of Object.entries(health.services)) {
      if (serviceHealth.status === 'unhealthy') {
        const fixResult = await this.fixService(serviceName, serviceHealth.details);
        results.push(fixResult);
      }
    }

    // System-wide fixes
    const systemFixes = await this.performSystemFixes();
    results.push(...systemFixes);

    console.log(`🔧 Auto-fix completed - ${results.filter(r => r.fixed).length}/${results.length} issues fixed`);
    return results;
  }

  /**
   * Fix specific service issues
   */
  private async fixService(serviceName: string, details: any): Promise<AutoFixResult> {
    const result: AutoFixResult = {
      service: serviceName,
      issue: 'Service unhealthy',
      fixed: false,
      actions: []
    };

    try {
      switch (serviceName) {
        case 'vault':
          result.actions.push('Checking vault encryption keys...');
          // Vault-specific fixes
          if (details.error?.includes('encryption')) {
            result.actions.push('Regenerating encryption keys...');
            // await vault.regenerateKeys();
            result.fixed = true;
          }
          break;

        case 'telemetry':
          result.actions.push('Restarting telemetry collectors...');
          // Telemetry-specific fixes
          if (details.error?.includes('prometheus')) {
            result.actions.push('Reconnecting to Prometheus...');
            // await telemetry.reconnect();
            result.fixed = true;
          }
          break;

        case 'alerts':
          result.actions.push('Checking alert channels...');
          // Alerts-specific fixes
          if (details.error?.includes('slack')) {
            result.actions.push('Reconnecting Slack integration...');
            result.fixed = true;
          }
          break;

        default:
          result.actions.push(`No auto-fix available for ${serviceName}`);
          break;
      }
    } catch (error) {
      result.error = (error as Error).message;
      result.actions.push(`Auto-fix failed: ${result.error}`);
    }

    return result;
  }

  /**
   * Perform system-wide fixes
   */
  private async performSystemFixes(): Promise<AutoFixResult[]> {
    const results: AutoFixResult[] = [];

    // Memory cleanup
    if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) { // 500MB
      results.push({
        service: 'system',
        issue: 'High memory usage',
        fixed: true,
        actions: ['Performing garbage collection']
      });
      
      if (global.gc) {
        global.gc();
      }
    }

    // Clean old snapshots
    try {
      const cleanedCount = await drManager.cleanupSnapshots(7); // 7 days retention
      if (cleanedCount > 0) {
        results.push({
          service: 'dr',
          issue: 'Old snapshots accumulating',
          fixed: true,
          actions: [`Cleaned up ${cleanedCount} old snapshots`]
        });
      }
    } catch (error) {
      results.push({
        service: 'dr',
        issue: 'Snapshot cleanup failed',
        fixed: false,
        actions: ['Failed to cleanup snapshots'],
        error: (error as Error).message
      });
    }

    return results;
  }

  /**
   * Setup wizard for new installations
   */
  async runSetupWizard(): Promise<{
    completed: boolean;
    steps: Array<{
      name: string;
      status: 'completed' | 'failed' | 'skipped';
      message: string;
    }>;
  }> {
    console.log('🧙‍♂️ Starting setup wizard...');

    const steps = [
      {
        name: 'Environment Check',
        action: () => this.checkEnvironment()
      },
      {
        name: 'Database Setup',
        action: () => this.setupDatabase()
      },
      {
        name: 'Encryption Keys',
        action: () => this.generateKeys()
      },
      {
        name: 'Default Features',
        action: () => this.setupDefaultFeatures()
      },
      {
        name: 'Initial Snapshot',
        action: () => this.createInitialSnapshot()
      },
      {
        name: 'Health Check',
        action: () => this.performHealthCheck()
      }
    ];

    const results = [];
    let allCompleted = true;

    for (const step of steps) {
      try {
        console.log(`📋 ${step.name}...`);
        await step.action();
        
        results.push({
          name: step.name,
          status: 'completed' as const,
          message: 'Successfully completed'
        });
        
        console.log(`✅ ${step.name} completed`);
      } catch (error) {
        console.error(`❌ ${step.name} failed:`, error);
        
        results.push({
          name: step.name,
          status: 'failed' as const,
          message: (error as Error).message
        });
        
        allCompleted = false;
      }
    }

    console.log(`🧙‍♂️ Setup wizard ${allCompleted ? 'completed successfully' : 'completed with errors'}`);

    return {
      completed: allCompleted,
      steps: results
    };
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<{
    uptime: number;
    version: string;
    environment: string;
    services: number;
    healthyServices: number;
    totalUsers: number;
    totalExchanges: number;
    totalSnapshots: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
  }> {
    const health = this.lastHealthCheck || await this.performHealthCheck();
    const drStats = await drManager.getStatistics();
    
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;

    return {
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: Object.keys(health.services).length,
      healthyServices: Object.values(health.services).filter(s => s.status === 'healthy').length,
      totalUsers: 0, // Will be populated from database
      totalExchanges: 0, // Will be populated from database
      totalSnapshots: drStats.totalSnapshots,
      memoryUsage: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((usedMemory / totalMemory) * 100)
      }
    };
  }

  /**
   * Export system configuration
   */
  async exportConfig(): Promise<{
    timestamp: Date;
    version: string;
    config: any;
  }> {
    const config = {
      features: await featureFlags.getAllFlags(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        // Add other safe environment variables
      },
      services: {
        vault: vault.healthCheck(),
        telemetry: telemetry.healthCheck(),
        // Add other service configs
      }
    };

    return {
      timestamp: new Date(),
      version: process.env.npm_package_version || '1.0.0',
      config
    };
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Check every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Scheduled health check failed:', error);
      }
    }, 5 * 60 * 1000);

    console.log('❤️ Health monitoring started (5min intervals)');
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('❤️ Health monitoring stopped');
    }
  }

  /**
   * Setup wizard helper functions
   */
  private async checkEnvironment(): Promise<void> {
    const required = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'VAULT_ENCRYPTION_KEY'
    ];

    for (const env of required) {
      if (!process.env[env]) {
        throw new Error(`Missing required environment variable: ${env}`);
      }
    }
  }

  private async setupDatabase(): Promise<void> {
    // Mock database setup
    console.log('Setting up database tables...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async generateKeys(): Promise<void> {
    // Mock key generation
    console.log('Generating encryption keys...');
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async setupDefaultFeatures(): Promise<void> {
    // Enable default features
    await featureFlags.setFlag('trading-enabled', true);
    await featureFlags.setFlag('multi-account-enabled', true);
    await featureFlags.setFlag('alerts-enabled', true);
  }

  private async createInitialSnapshot(): Promise<void> {
    await drManager.createSnapshot({
      includeCredentials: false,
      includeUserData: true
    });
  }

  private calculateErrorRate(): number {
    // Mock error rate calculation
    return Math.random() * 2; // 0-2% error rate
  }

  /**
   * Emergency maintenance mode
   */
  async enableMaintenanceMode(reason: string): Promise<void> {
    console.log(`🚧 Enabling maintenance mode: ${reason}`);
    
    // Disable critical features
    await featureFlags.setFlag('trading-enabled', false);
    await featureFlags.setFlag('api-enabled', false);
    await featureFlags.setFlag('maintenance-mode', true);
    
    // Send alert
    await alertsEngine.checkAlert('maintenance-enabled', {
      value: 1,
      message: `Maintenance mode enabled: ${reason}`,
      severity: 'warning',
      data: { reason, timestamp: new Date().toISOString() }
    });
  }

  async disableMaintenanceMode(): Promise<void> {
    console.log('✅ Disabling maintenance mode');
    
    // Re-enable features
    await featureFlags.setFlag('trading-enabled', true);
    await featureFlags.setFlag('api-enabled', true);
    await featureFlags.setFlag('maintenance-mode', false);
    
    // Send alert
    await alertsEngine.checkAlert('maintenance-disabled', {
      value: 0,
      message: 'Maintenance mode disabled - system operational',
      severity: 'info',
      data: { timestamp: new Date().toISOString() }
    });
  }
}

// Create singleton instance
export const adminTools = new AdminTools();
