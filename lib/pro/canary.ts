import { canary, featureFlags } from './flags';
import { telemetry, metrics } from './telemetry';
import { alertsEngine } from './alerts';

interface DeploymentStrategy {
  type: 'canary' | 'blue-green' | 'direct';
  config: any;
}

interface DeploymentMetrics {
  errorRate: number;
  responseTime: number;
  throughput: number;
  successRate: number;
  userSatisfaction: number;
}

interface HealthThreshold {
  errorRate: number;     // Max acceptable error rate (%)
  responseTime: number;  // Max acceptable response time (ms)
  successRate: number;   // Min acceptable success rate (%)
}

export class DeploymentManager {
  private strategy: DeploymentStrategy;
  private healthThresholds: HealthThreshold;
  private isDeploying: boolean = false;
  private metricsHistory: DeploymentMetrics[] = [];

  constructor() {
    this.strategy = {
      type: (process.env.DEPLOY_STRATEGY as any) || 'canary',
      config: {
        canaryPercent: parseInt(process.env.CANARY_PERCENT || '10'),
        blueGreenEnabled: process.env.BLUE_GREEN_ENABLED === 'true'
      }
    };

    this.healthThresholds = {
      errorRate: 2,      // 2% max error rate
      responseTime: 1500, // 1.5s max response time
      successRate: 98    // 98% min success rate
    };

    console.log(`🚀 Deployment strategy: ${this.strategy.type}`);
  }

  /**
   * Start deployment process
   */
  async startDeployment(version: string, options: {
    percent?: number;
    skipHealthChecks?: boolean;
    rollbackOnError?: boolean;
  } = {}): Promise<boolean> {
    if (this.isDeploying) {
      throw new Error('Deployment already in progress');
    }

    this.isDeploying = true;
    
    try {
      console.log(`🚀 Starting ${this.strategy.type} deployment: ${version}`);
      
      // Pre-deployment health check
      if (!options.skipHealthChecks) {
        const healthCheck = await this.performHealthCheck();
        if (!healthCheck.healthy) {
          throw new Error(`Pre-deployment health check failed: ${healthCheck.reason}`);
        }
      }

      // Execute deployment based on strategy
      switch (this.strategy.type) {
        case 'canary':
          return await this.executeCanaryDeployment(version, options);
        case 'blue-green':
          return await this.executeBlueGreenDeployment(version, options);
        case 'direct':
          return await this.executeDirectDeployment(version, options);
        default:
          throw new Error(`Unknown deployment strategy: ${this.strategy.type}`);
      }
    } catch (error) {
      console.error('💥 Deployment failed:', error);
      await this.handleDeploymentFailure(error as Error);
      return false;
    } finally {
      this.isDeploying = false;
    }
  }

  /**
   * Execute canary deployment
   */
  private async executeCanaryDeployment(version: string, options: any): Promise<boolean> {
    const percent = options.percent || this.strategy.config.canaryPercent;
    
    // Start canary
    await canary.startCanary(percent);
    
    // Monitor metrics for validation period
    const validationPeriod = 10 * 60 * 1000; // 10 minutes
    const startTime = Date.now();
    
    console.log(`🐦 Canary ${version} started with ${percent}% traffic. Monitoring for ${validationPeriod / 1000}s...`);
    
    while (Date.now() - startTime < validationPeriod) {
      // Collect metrics
      const metrics = await this.collectDeploymentMetrics();
      this.metricsHistory.push(metrics);
      
      // Update canary metrics
      canary.updateMetrics(metrics.errorRate, metrics.responseTime, metrics.successRate);
      
      // Check if metrics are within acceptable range
      if (!this.areMetricsHealthy(metrics)) {
        console.warn('⚠️ Canary metrics unhealthy, rolling back...');
        await canary.stopCanary(false);
        
        // Send alert
        await alertsEngine.checkAlert('canary-rollback', {
          value: metrics.errorRate,
          message: `Canary deployment ${version} rolled back due to unhealthy metrics`,
          severity: 'warning',
          data: { metrics, version }
        });
        
        return false;
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30s
    }
    
    // Promote canary to production
    console.log('✅ Canary validation successful, promoting to production');
    await canary.stopCanary(true);
    
    // Send success alert
    await alertsEngine.checkAlert('canary-success', {
      value: 100,
      message: `Canary deployment ${version} successfully promoted to production`,
      severity: 'info',
      data: { version, duration: validationPeriod }
    });
    
    return true;
  }

  /**
   * Execute blue-green deployment
   */
  private async executeBlueGreenDeployment(version: string, options: any): Promise<boolean> {
    console.log(`🔄 Executing blue-green deployment: ${version}`);
    
    // In a real implementation, this would:
    // 1. Deploy to green environment
    // 2. Run health checks on green
    // 3. Switch traffic from blue to green
    // 4. Keep blue as backup
    
    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Health check on new environment
    const healthCheck = await this.performHealthCheck();
    if (!healthCheck.healthy) {
      console.error('❌ Blue-green health check failed');
      return false;
    }
    
    // Switch traffic
    console.log('🔀 Switching traffic to green environment');
    
    // Monitor for issues
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Blue-green deployment completed successfully');
    return true;
  }

  /**
   * Execute direct deployment
   */
  private async executeDirectDeployment(version: string, options: any): Promise<boolean> {
    console.log(`⚡ Executing direct deployment: ${version}`);
    
    // Direct deployment - higher risk but faster
    // Simulate deployment
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Quick health check
    const healthCheck = await this.performHealthCheck();
    if (!healthCheck.healthy && !options.skipHealthChecks) {
      console.error('❌ Direct deployment health check failed');
      return false;
    }
    
    console.log('✅ Direct deployment completed');
    return true;
  }

  /**
   * Collect deployment metrics
   */
  private async collectDeploymentMetrics(): Promise<DeploymentMetrics> {
    // In real implementation, collect from monitoring systems
    // This is a mock implementation
    
    const baseErrorRate = 0.5;
    const errorRate = baseErrorRate + (Math.random() - 0.5) * 1;
    
    const baseResponseTime = 200;
    const responseTime = baseResponseTime + Math.random() * 100;
    
    const baseThroughput = 1000;
    const throughput = baseThroughput + (Math.random() - 0.5) * 200;
    
    const successRate = 100 - errorRate;
    const userSatisfaction = 95 + (Math.random() - 0.5) * 10;
    
    // Record metrics in telemetry
    telemetry.setGauge('deployment_error_rate', errorRate);
    telemetry.setGauge('deployment_response_time', responseTime);
    telemetry.setGauge('deployment_throughput', throughput);
    telemetry.setGauge('deployment_success_rate', successRate);
    
    return {
      errorRate: Math.max(0, errorRate),
      responseTime,
      throughput,
      successRate: Math.min(100, successRate),
      userSatisfaction: Math.max(0, Math.min(100, userSatisfaction))
    };
  }

  /**
   * Check if metrics are within healthy range
   */
  private areMetricsHealthy(metrics: DeploymentMetrics): boolean {
    return metrics.errorRate <= this.healthThresholds.errorRate &&
           metrics.responseTime <= this.healthThresholds.responseTime &&
           metrics.successRate >= this.healthThresholds.successRate;
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<{ healthy: boolean; reason?: string; details?: any }> {
    try {
      // Check feature flags system
      const flagsHealth = featureFlags.healthCheck();
      if (flagsHealth.status !== 'healthy') {
        return {
          healthy: false,
          reason: 'Feature flags system unhealthy',
          details: flagsHealth.details
        };
      }

      // Check telemetry system
      const telemetryHealth = telemetry.healthCheck();
      if (telemetryHealth.status === 'unhealthy') {
        return {
          healthy: false,
          reason: 'Telemetry system unhealthy',
          details: telemetryHealth.details
        };
      }

      // Check alerts system
      const alertsHealth = alertsEngine.healthCheck();
      if (alertsHealth.status === 'unhealthy') {
        return {
          healthy: false,
          reason: 'Alerts system unhealthy',
          details: alertsHealth.details
        };
      }

      // All systems healthy
      return { healthy: true };
      
    } catch (error) {
      return {
        healthy: false,
        reason: 'Health check failed',
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Handle deployment failure
   */
  private async handleDeploymentFailure(error: Error): Promise<void> {
    console.error('💥 Handling deployment failure:', error.message);
    
    // Stop any active canary
    try {
      const canaryStatus = canary.getCanaryStatus();
      if (canaryStatus.isActive) {
        await canary.stopCanary(false);
      }
    } catch (rollbackError) {
      console.error('Failed to rollback canary:', rollbackError);
    }
    
    // Send failure alert
    await alertsEngine.checkAlert('deployment-failure', {
      value: 0,
      message: `Deployment failed: ${error.message}`,
      severity: 'critical',
      data: { error: error.message, timestamp: new Date().toISOString() }
    });
    
    // Record failure metrics
    telemetry.incrementCounter('deployments_failed_total', { 
      strategy: this.strategy.type, 
      reason: error.message 
    });
  }

  /**
   * Get deployment status
   */
  getDeploymentStatus(): {
    isDeploying: boolean;
    strategy: DeploymentStrategy;
    canaryStatus: any;
    recentMetrics: DeploymentMetrics[];
  } {
    return {
      isDeploying: this.isDeploying,
      strategy: this.strategy,
      canaryStatus: canary.getCanaryStatus(),
      recentMetrics: this.metricsHistory.slice(-10) // Last 10 metrics
    };
  }

  /**
   * Emergency rollback
   */
  async emergencyRollback(reason: string): Promise<boolean> {
    try {
      console.log(`🚨 Emergency rollback triggered: ${reason}`);
      
      // Stop canary if active
      const canaryStatus = canary.getCanaryStatus();
      if (canaryStatus.isActive) {
        await canary.stopCanary(false);
      }
      
      // Send alert
      await alertsEngine.checkAlert('emergency-rollback', {
        value: 0,
        message: `Emergency rollback executed: ${reason}`,
        severity: 'critical',
        data: { reason, timestamp: new Date().toISOString() }
      });
      
      return true;
    } catch (error) {
      console.error('Failed emergency rollback:', error);
      return false;
    }
  }

  /**
   * Health check for deployment manager
   */
  healthCheck(): { status: 'healthy' | 'degraded' | 'unhealthy'; details: any } {
    return {
      status: 'healthy',
      details: {
        strategy: this.strategy.type,
        isDeploying: this.isDeploying,
        canaryStatus: canary.getCanaryStatus(),
        metricsHistorySize: this.metricsHistory.length
      }
    };
  }
}

// Extend metrics with deployment-specific metrics
Object.assign(metrics, {
  deploymentStarted: (strategy: string) => 
    telemetry.incrementCounter('deployments_started_total', { strategy }),
  
  deploymentCompleted: (strategy: string, success: boolean) => 
    telemetry.incrementCounter('deployments_completed_total', { strategy, success: success.toString() }),
  
  deploymentFailed: (strategy: string, reason: string) => 
    telemetry.incrementCounter('deployments_failed_total', { strategy, reason }),
  
  canaryRollback: (reason: string) => 
    telemetry.incrementCounter('canary_rollbacks_total', { reason })
});

// Create singleton instance
export const deploymentManager = new DeploymentManager();
