/**
 * Multi-Cloud GPU Autoscaler
 *
 * Automatically scales GPU instances based on demand
 * Optimizes cost by selecting cheapest provider/region
 */

import {
  CloudProviderAdapter,
  GPUInstance,
  GPUMetrics,
  ScalingPolicy,
  GPUType,
} from './cloud-provider';

export interface AutoscalerConfig {
  policy: ScalingPolicy;
  providers: CloudProviderAdapter[];
  preferredRegions: string[];
  gpuType: GPUType;
  useSpot: boolean;
}

export interface ScalingDecision {
  action: 'scale-up' | 'scale-down' | 'none';
  targetCount: number;
  reason: string;
  estimatedCost: number;
}

export class MultiCloudAutoscaler {
  private config: AutoscalerConfig;
  private instances: Map<string, GPUInstance> = new Map();
  private lastScalingTime: Date = new Date(0);

  constructor(config: AutoscalerConfig) {
    this.config = config;
  }

  /**
   * Evaluate scaling decision based on current metrics
   */
  async evaluateScaling(metrics: GPUMetrics[]): Promise<ScalingDecision> {
    const currentCount = this.instances.size;

    // Calculate average GPU utilization
    const avgUtilization =
      metrics.reduce((sum, m) => sum + m.gpuUtilization, 0) / metrics.length || 0;

    // Check cooldown period
    const timeSinceLastScaling =
      Date.now() - this.lastScalingTime.getTime();
    if (timeSinceLastScaling < this.config.policy.cooldownSeconds * 1000) {
      return {
        action: 'none',
        targetCount: currentCount,
        reason: `Cooldown period (${this.config.policy.cooldownSeconds}s)`,
        estimatedCost: this.calculateCurrentCost(),
      };
    }

    // Scale up if utilization too high
    if (avgUtilization > this.config.policy.scaleUpThreshold) {
      const targetCount = Math.min(
        currentCount + 1,
        this.config.policy.maxInstances
      );

      if (targetCount > currentCount) {
        return {
          action: 'scale-up',
          targetCount,
          reason: `High utilization: ${avgUtilization.toFixed(1)}% > ${this.config.policy.scaleUpThreshold}%`,
          estimatedCost: await this.estimateCost(targetCount),
        };
      }
    }

    // Scale down if utilization too low
    if (avgUtilization < this.config.policy.scaleDownThreshold) {
      const targetCount = Math.max(
        currentCount - 1,
        this.config.policy.minInstances
      );

      if (targetCount < currentCount) {
        return {
          action: 'scale-down',
          targetCount,
          reason: `Low utilization: ${avgUtilization.toFixed(1)}% < ${this.config.policy.scaleDownThreshold}%`,
          estimatedCost: await this.estimateCost(targetCount),
        };
      }
    }

    return {
      action: 'none',
      targetCount: currentCount,
      reason: `Utilization OK: ${avgUtilization.toFixed(1)}%`,
      estimatedCost: this.calculateCurrentCost(),
    };
  }

  /**
   * Execute scaling action
   */
  async executeScaling(decision: ScalingDecision): Promise<void> {
    if (decision.action === 'none') return;

    const currentCount = this.instances.size;
    const delta = decision.targetCount - currentCount;

    if (delta > 0) {
      // Scale up
      for (let i = 0; i < delta; i++) {
        await this.launchInstance();
      }
    } else if (delta < 0) {
      // Scale down
      await this.terminateInstances(Math.abs(delta));
    }

    this.lastScalingTime = new Date();
  }

  /**
   * Launch new instance on cheapest provider
   */
  private async launchInstance(): Promise<GPUInstance> {
    // Find cheapest provider/region combination
    const cheapest = await this.findCheapestOption();

    const instance = await cheapest.provider.launchInstance({
      region: cheapest.region,
      gpuType: this.config.gpuType,
      gpuCount: 1,
      spot: this.config.useSpot,
      tags: {
        managed_by: 'ailydian-autoscaler',
        created_at: new Date().toISOString(),
      },
    });

    this.instances.set(instance.id, instance);

    console.log(
      `[Autoscaler] Launched ${instance.provider}/${instance.region} ${instance.gpuType} @ $${instance.hourlyRate}/hr`
    );

    return instance;
  }

  /**
   * Terminate instances (prioritize most expensive)
   */
  private async terminateInstances(count: number): Promise<void> {
    const instances = Array.from(this.instances.values());

    // Sort by hourly rate (descending) - terminate expensive ones first
    instances.sort((a, b) => b.hourlyRate - a.hourlyRate);

    const toTerminate = instances.slice(0, count);

    for (const instance of toTerminate) {
      const provider = this.config.providers.find(
        (p) => p.provider === instance.provider
      );

      if (provider) {
        await provider.terminateInstance(instance.id);
        this.instances.delete(instance.id);

        console.log(
          `[Autoscaler] Terminated ${instance.provider}/${instance.region} ${instance.gpuType}`
        );
      }
    }
  }

  /**
   * Find cheapest provider/region for GPU type
   */
  private async findCheapestOption(): Promise<{
    provider: CloudProviderAdapter;
    region: string;
    price: number;
  }> {
    const options: {
      provider: CloudProviderAdapter;
      region: string;
      price: number;
    }[] = [];

    for (const provider of this.config.providers) {
      for (const region of this.config.preferredRegions) {
        try {
          const pricing = await provider.getPricing(region, this.config.gpuType);
          options.push({
            provider,
            region,
            price: this.config.useSpot ? pricing.spot! : pricing.onDemand,
          });
        } catch (err) {
          // GPU not available in this region
          continue;
        }
      }
    }

    if (options.length === 0) {
      throw new Error(
        `No GPU ${this.config.gpuType} available in any region`
      );
    }

    // Sort by price (ascending)
    options.sort((a, b) => a.price - b.price);

    return options[0];
  }

  /**
   * Calculate current total cost
   */
  private calculateCurrentCost(): number {
    let total = 0;
    for (const instance of this.instances.values()) {
      total += instance.hourlyRate;
    }
    return total;
  }

  /**
   * Estimate cost for target instance count
   */
  private async estimateCost(targetCount: number): Promise<number> {
    const cheapest = await this.findCheapestOption();
    return cheapest.price * targetCount;
  }

  /**
   * Get current instances
   */
  getInstances(): GPUInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get autoscaler status
   */
  getStatus(): {
    currentInstances: number;
    minInstances: number;
    maxInstances: number;
    totalCostPerHour: number;
    lastScalingTime: Date;
  } {
    return {
      currentInstances: this.instances.size,
      minInstances: this.config.policy.minInstances,
      maxInstances: this.config.policy.maxInstances,
      totalCostPerHour: this.calculateCurrentCost(),
      lastScalingTime: this.lastScalingTime,
    };
  }
}
