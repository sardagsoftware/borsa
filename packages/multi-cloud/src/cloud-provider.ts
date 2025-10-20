/**
 * Multi-Cloud Provider Abstraction
 *
 * Unified interface for AWS, GCP, Azure GPU resources
 */

export enum CloudProvider {
  AWS = 'aws',
  GCP = 'gcp',
  AZURE = 'azure',
}

export enum GPUType {
  // NVIDIA
  A100 = 'a100',
  A10G = 'a10g',
  V100 = 'v100',
  T4 = 't4',
  L4 = 'l4',

  // AMD
  MI250 = 'mi250',
  MI210 = 'mi210',
}

export interface GPUInstance {
  id: string;
  provider: CloudProvider;
  region: string;
  gpuType: GPUType;
  gpuCount: number;
  vcpus: number;
  memoryGb: number;
  status: 'running' | 'stopped' | 'pending' | 'terminated';
  hourlyRate: number; // USD per hour
  spotPrice?: number; // Spot/preemptible instance price
  createdAt: Date;
  tags: Record<string, string>;
}

export interface GPUMetrics {
  instanceId: string;
  timestamp: Date;

  // Utilization
  gpuUtilization: number;      // 0-100%
  memoryUtilization: number;   // 0-100%

  // Performance
  throughputOps: number;        // Operations per second
  latencyMs: number;            // Average latency

  // Cost
  costPerHour: number;
  costToDate: number;
}

export interface ScalingPolicy {
  minInstances: number;
  maxInstances: number;
  targetGpuUtilization: number;  // 0-100%
  scaleUpThreshold: number;      // 0-100%
  scaleDownThreshold: number;    // 0-100%
  cooldownSeconds: number;
}

export abstract class CloudProviderAdapter {
  abstract readonly provider: CloudProvider;

  /**
   * List available GPU instance types
   */
  abstract listGPUTypes(region: string): Promise<{
    gpuType: GPUType;
    available: boolean;
    hourlyRate: number;
    spotPrice?: number;
  }[]>;

  /**
   * Launch GPU instance
   */
  abstract launchInstance(config: {
    region: string;
    gpuType: GPUType;
    gpuCount: number;
    spot?: boolean;
    tags?: Record<string, string>;
  }): Promise<GPUInstance>;

  /**
   * Terminate instance
   */
  abstract terminateInstance(instanceId: string): Promise<void>;

  /**
   * Get instance metrics
   */
  abstract getMetrics(instanceId: string): Promise<GPUMetrics>;

  /**
   * List all instances
   */
  abstract listInstances(): Promise<GPUInstance[]>;

  /**
   * Get current pricing
   */
  abstract getPricing(region: string, gpuType: GPUType): Promise<{
    onDemand: number;
    spot?: number;
  }>;
}
