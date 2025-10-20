/**
 * AWS GPU Adapter
 *
 * EC2 GPU instances (p4d.24xlarge, p3.16xlarge, g5.xlarge, etc.)
 */

import {
  CloudProviderAdapter,
  CloudProvider,
  GPUType,
  GPUInstance,
  GPUMetrics,
} from './cloud-provider';

export class AWSAdapter extends CloudProviderAdapter {
  readonly provider = CloudProvider.AWS;

  private readonly instanceTypeMap: Record<GPUType, string> = {
    [GPUType.A100]: 'p4d.24xlarge',     // 8x A100 (40GB)
    [GPUType.A10G]: 'g5.xlarge',        // 1x A10G
    [GPUType.V100]: 'p3.16xlarge',      // 8x V100 (16GB)
    [GPUType.T4]: 'g4dn.xlarge',        // 1x T4
    [GPUType.L4]: 'g6.xlarge',          // 1x L4
    [GPUType.MI250]: '',                // Not available on AWS
    [GPUType.MI210]: '',                // Not available on AWS
  };

  async listGPUTypes(region: string) {
    // In production, use AWS SDK to query actual availability
    const pricing: Record<GPUType, number> = {
      [GPUType.A100]: 32.77,    // p4d.24xlarge (8x A100)
      [GPUType.A10G]: 1.006,    // g5.xlarge (1x A10G)
      [GPUType.V100]: 24.48,    // p3.16xlarge (8x V100)
      [GPUType.T4]: 0.526,      // g4dn.xlarge (1x T4)
      [GPUType.L4]: 0.92,       // g6.xlarge (1x L4)
      [GPUType.MI250]: 0,       // Not available
      [GPUType.MI210]: 0,       // Not available
    };

    return Object.entries(pricing)
      .filter(([_, price]) => price > 0)
      .map(([gpuType, hourlyRate]) => ({
        gpuType: gpuType as GPUType,
        available: true,
        hourlyRate,
        spotPrice: hourlyRate * 0.3, // ~70% savings on spot
      }));
  }

  async launchInstance(config: {
    region: string;
    gpuType: GPUType;
    gpuCount: number;
    spot?: boolean;
    tags?: Record<string, string>;
  }): Promise<GPUInstance> {
    // In production: AWS SDK ec2.runInstances()
    const instanceType = this.instanceTypeMap[config.gpuType];
    if (!instanceType) {
      throw new Error(`GPU type ${config.gpuType} not available on AWS`);
    }

    const pricing = await this.getPricing(config.region, config.gpuType);

    return {
      id: `i-${Math.random().toString(36).substr(2, 9)}`,
      provider: CloudProvider.AWS,
      region: config.region,
      gpuType: config.gpuType,
      gpuCount: config.gpuCount,
      vcpus: this.getVCPUs(config.gpuType),
      memoryGb: this.getMemoryGb(config.gpuType),
      status: 'pending',
      hourlyRate: config.spot ? pricing.spot! : pricing.onDemand,
      spotPrice: config.spot ? pricing.spot : undefined,
      createdAt: new Date(),
      tags: config.tags || {},
    };
  }

  async terminateInstance(instanceId: string): Promise<void> {
    // In production: AWS SDK ec2.terminateInstances()
    console.log(`[AWS] Terminating instance ${instanceId}`);
  }

  async getMetrics(instanceId: string): Promise<GPUMetrics> {
    // In production: CloudWatch metrics
    return {
      instanceId,
      timestamp: new Date(),
      gpuUtilization: Math.random() * 100,
      memoryUtilization: Math.random() * 100,
      throughputOps: Math.random() * 10000,
      latencyMs: Math.random() * 100,
      costPerHour: 1.0,
      costToDate: 10.5,
    };
  }

  async listInstances(): Promise<GPUInstance[]> {
    // In production: AWS SDK ec2.describeInstances()
    return [];
  }

  async getPricing(region: string, gpuType: GPUType): Promise<{
    onDemand: number;
    spot?: number;
  }> {
    const types = await this.listGPUTypes(region);
    const gpu = types.find((t) => t.gpuType === gpuType);

    if (!gpu) {
      throw new Error(`GPU type ${gpuType} not available in ${region}`);
    }

    return {
      onDemand: gpu.hourlyRate,
      spot: gpu.spotPrice,
    };
  }

  private getVCPUs(gpuType: GPUType): number {
    const map: Record<GPUType, number> = {
      [GPUType.A100]: 96,
      [GPUType.A10G]: 4,
      [GPUType.V100]: 64,
      [GPUType.T4]: 4,
      [GPUType.L4]: 4,
      [GPUType.MI250]: 0,
      [GPUType.MI210]: 0,
    };
    return map[gpuType];
  }

  private getMemoryGb(gpuType: GPUType): number {
    const map: Record<GPUType, number> = {
      [GPUType.A100]: 1152,
      [GPUType.A10G]: 16,
      [GPUType.V100]: 488,
      [GPUType.T4]: 16,
      [GPUType.L4]: 16,
      [GPUType.MI250]: 0,
      [GPUType.MI210]: 0,
    };
    return map[gpuType];
  }
}
