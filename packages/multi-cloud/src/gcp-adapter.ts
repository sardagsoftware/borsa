/**
 * GCP GPU Adapter
 *
 * Compute Engine GPU instances (a2-highgpu-8g, n1-standard-4 + GPU, etc.)
 */

import {
  CloudProviderAdapter,
  CloudProvider,
  GPUType,
  GPUInstance,
  GPUMetrics,
} from './cloud-provider';

export class GCPAdapter extends CloudProviderAdapter {
  readonly provider = CloudProvider.GCP;

  async listGPUTypes(region: string) {
    const pricing: Record<GPUType, number> = {
      [GPUType.A100]: 3.67,     // per GPU per hour (80GB)
      [GPUType.A10G]: 0,        // Not available
      [GPUType.V100]: 2.48,     // per GPU per hour
      [GPUType.T4]: 0.35,       // per GPU per hour
      [GPUType.L4]: 0.75,       // per GPU per hour
      [GPUType.MI250]: 0,       // Not available
      [GPUType.MI210]: 0,       // Not available
    };

    return Object.entries(pricing)
      .filter(([_, price]) => price > 0)
      .map(([gpuType, hourlyRate]) => ({
        gpuType: gpuType as GPUType,
        available: true,
        hourlyRate,
        spotPrice: hourlyRate * 0.4, // ~60% savings on preemptible
      }));
  }

  async launchInstance(config: {
    region: string;
    gpuType: GPUType;
    gpuCount: number;
    spot?: boolean;
    tags?: Record<string, string>;
  }): Promise<GPUInstance> {
    // In production: GCP Compute Engine API
    const pricing = await this.getPricing(config.region, config.gpuType);

    return {
      id: `gcp-${Math.random().toString(36).substr(2, 9)}`,
      provider: CloudProvider.GCP,
      region: config.region,
      gpuType: config.gpuType,
      gpuCount: config.gpuCount,
      vcpus: this.getVCPUs(config.gpuType, config.gpuCount),
      memoryGb: this.getMemoryGb(config.gpuType, config.gpuCount),
      status: 'pending',
      hourlyRate: (config.spot ? pricing.spot! : pricing.onDemand) * config.gpuCount,
      spotPrice: config.spot ? pricing.spot! * config.gpuCount : undefined,
      createdAt: new Date(),
      tags: config.tags || {},
    };
  }

  async terminateInstance(instanceId: string): Promise<void> {
    console.log(`[GCP] Terminating instance ${instanceId}`);
  }

  async getMetrics(instanceId: string): Promise<GPUMetrics> {
    // In production: Cloud Monitoring API
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

  private getVCPUs(gpuType: GPUType, gpuCount: number): number {
    // GCP allows flexible CPU counts with GPU attachments
    return gpuCount * 12; // Typical: 12 vCPUs per GPU
  }

  private getMemoryGb(gpuType: GPUType, gpuCount: number): number {
    const memPerGpu: Record<GPUType, number> = {
      [GPUType.A100]: 80,
      [GPUType.V100]: 16,
      [GPUType.T4]: 16,
      [GPUType.L4]: 24,
      [GPUType.A10G]: 0,
      [GPUType.MI250]: 0,
      [GPUType.MI210]: 0,
    };
    return memPerGpu[gpuType] * gpuCount + 85; // GPU memory + system memory
  }
}
