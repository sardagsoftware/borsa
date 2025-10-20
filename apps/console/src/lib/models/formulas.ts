/**
 * AI POWER PANEL - Calculation Formulas
 * MG_param, MG_ops, FLOPs/token calculations
 *
 * WHITE-HAT COMPLIANCE: All formulas based on public research papers
 * - Kaplan et al. (2020) "Scaling Laws for Neural Language Models"
 * - Hoffmann et al. (2022) "Training Compute-Optimal Large Language Models"
 * - MoE formulas from Switch Transformer paper (Fedus et al. 2021)
 */

import { AIModel, ModelType } from './registry';

/**
 * Calculate Active Parameters (Billions)
 * For MoE models, only k experts are active per token
 *
 * Formula:
 * - Dense: All parameters are active
 * - MoE: (Total Params / n_experts) * k_active_experts + shared_params
 *        Approximation: (Total Params / n_experts) * k_active_experts
 * - Closed: Unknown (return null)
 */
export function calculateActiveParamsB(model: AIModel): number | null {
  if (model.type === 'closed') {
    return null; // Proprietary models don't expose params
  }

  if (model.type === 'dense') {
    return model.paramsB || 0;
  }

  if (model.type === 'moe') {
    if (!model.paramsB || !model.moe_k || !model.moe_n) {
      return null;
    }
    // Active params = (Total / n) * k
    // Example: Mixtral 8×22B (176B total, 8 experts, 2 active)
    // Active = (176B / 8) * 2 = 44B per token
    const expertSize = model.paramsB / model.moe_n;
    return expertSize * model.moe_k;
  }

  return null;
}

/**
 * Calculate FLOPs per Token (Billions)
 * Based on: C ≈ 2 * N (forward pass + backward pass approximation)
 * For inference only: C ≈ 2 * N (forward pass)
 *
 * Formula:
 * FLOPs/token = 2 * Active_Parameters
 *
 * Reference: Kaplan et al. (2020)
 */
export function calculateFLOPsPerToken(model: AIModel): number | null {
  const activeParams = calculateActiveParamsB(model);
  if (activeParams === null) return null;

  return 2 * activeParams; // Billions of FLOPs per token
}

/**
 * MG_param: Model Güç (Parameter-based Power)
 * Simple metric: Active parameters in billions
 *
 * Higher = More model capacity
 */
export function calculateMGParam(model: AIModel): number | null {
  return calculateActiveParamsB(model);
}

/**
 * MG_ops: Model Güç (Operational Power)
 * Based on throughput metrics (tokens/second)
 *
 * Formula:
 * MG_ops = tps * FLOPs_per_token / 1e9
 * Where:
 * - tps = tokens per second (from telemetry)
 * - FLOPs_per_token = 2 * Active_Params_B
 *
 * This gives TFLOPS (Tera FLOPs per second)
 */
export interface OperationalMetrics {
  tps?: number;        // Tokens per second (local models)
  TPM?: number;        // Tokens per minute (Azure quotas)
  RPM?: number;        // Requests per minute (Azure quotas)
  concurrency?: number; // Max concurrent requests
  p95_ms?: number;     // 95th percentile latency
}

export function calculateMGOps(
  model: AIModel,
  metrics: OperationalMetrics
): {
  mg_ops: number | null;
  tps: number | null;
  tflops: number | null;
} {
  const flopsPerToken = calculateFLOPsPerToken(model);

  // Calculate TPS (tokens per second)
  let tps: number | null = null;
  if (metrics.tps) {
    tps = metrics.tps;
  } else if (metrics.TPM) {
    tps = metrics.TPM / 60; // Convert TPM to TPS
  }

  if (tps === null || flopsPerToken === null) {
    return {
      mg_ops: null,
      tps: tps,
      tflops: null
    };
  }

  // TFLOPS = TPS * FLOPs_per_token_B * 1e9 / 1e12
  //        = TPS * FLOPs_per_token_B / 1000
  const tflops = (tps * flopsPerToken) / 1000;

  return {
    mg_ops: tflops,
    tps: tps,
    tflops: tflops
  };
}

/**
 * Calculate cost efficiency (tokens per dollar)
 * Higher = More cost-efficient
 */
export function calculateCostEfficiency(model: AIModel): number | null {
  if (!model.costPer1M || model.costPer1M === 0) {
    return null; // Free models (self-hosted) have infinite efficiency
  }
  return 1000000 / model.costPer1M; // Tokens per dollar
}

/**
 * Calculate throughput score (0-100)
 * Based on TPS normalized to max observed TPS
 */
export function calculateThroughputScore(tps: number | null, maxTPS: number = 1000): number | null {
  if (tps === null) return null;
  return Math.min(100, (tps / maxTPS) * 100);
}

/**
 * Calculate latency score (0-100)
 * Lower latency = Higher score
 */
export function calculateLatencyScore(p95_ms: number | null, targetMS: number = 1000): number | null {
  if (p95_ms === null) return null;
  // Score = 100 if p95 <= targetMS, decreases linearly
  const score = 100 - ((p95_ms - targetMS) / targetMS) * 50;
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate overall model power score (0-100)
 * Combines:
 * - Parameters (40%)
 * - Throughput (30%)
 * - Latency (20%)
 * - Cost efficiency (10%)
 */
export interface PowerScoreInputs {
  model: AIModel;
  metrics: OperationalMetrics;
  maxParams?: number; // For normalization
  maxTPS?: number;    // For normalization
}

export function calculatePowerScore({
  model,
  metrics,
  maxParams = 671, // DeepSeek R1 is largest
  maxTPS = 1000
}: PowerScoreInputs): number | null {
  let totalScore = 0;
  let totalWeight = 0;

  // 1. Parameters score (40%)
  const activeParams = calculateActiveParamsB(model);
  if (activeParams !== null) {
    const paramScore = Math.min(100, (activeParams / maxParams) * 100);
    totalScore += paramScore * 0.4;
    totalWeight += 0.4;
  }

  // 2. Throughput score (30%)
  const tps = metrics.tps || (metrics.TPM ? metrics.TPM / 60 : null);
  if (tps !== null) {
    const throughputScore = calculateThroughputScore(tps, maxTPS);
    if (throughputScore !== null) {
      totalScore += throughputScore * 0.3;
      totalWeight += 0.3;
    }
  }

  // 3. Latency score (20%)
  if (metrics.p95_ms !== null && metrics.p95_ms !== undefined) {
    const latencyScore = calculateLatencyScore(metrics.p95_ms);
    if (latencyScore !== null) {
      totalScore += latencyScore * 0.2;
      totalWeight += 0.2;
    }
  }

  // 4. Cost efficiency (10%)
  const costEff = calculateCostEfficiency(model);
  if (costEff !== null) {
    // Normalize: free models get 100, paid models scaled
    const costScore = 100; // Simplified: all get max for now
    totalScore += costScore * 0.1;
    totalWeight += 0.1;
  }

  if (totalWeight === 0) return null;
  return totalScore / totalWeight;
}

/**
 * Calculate total system parameters (open models only)
 */
export function calculateTotalSystemParams(models: AIModel[]): number {
  return models
    .filter(m => m.type !== 'closed')
    .reduce((sum, m) => sum + (m.paramsB || 0), 0);
}

/**
 * Calculate total system throughput (TPS)
 */
export function calculateTotalSystemTPS(
  models: AIModel[],
  metricsMap: Map<string, OperationalMetrics>
): number {
  let totalTPS = 0;
  for (const model of models) {
    const metrics = metricsMap.get(model.id);
    if (metrics?.tps) {
      totalTPS += metrics.tps;
    } else if (metrics?.TPM) {
      totalTPS += metrics.TPM / 60;
    }
  }
  return totalTPS;
}

/**
 * Calculate total system TPM (Azure quotas)
 */
export function calculateTotalSystemTPM(
  models: AIModel[],
  metricsMap: Map<string, OperationalMetrics>
): number {
  let totalTPM = 0;
  for (const model of models) {
    const metrics = metricsMap.get(model.id);
    if (metrics?.TPM) {
      totalTPM += metrics.TPM;
    }
  }
  return totalTPM;
}

/**
 * Calculate total system RPM (Azure quotas)
 */
export function calculateTotalSystemRPM(
  models: AIModel[],
  metricsMap: Map<string, OperationalMetrics>
): number {
  let totalRPM = 0;
  for (const model of models) {
    const metrics = metricsMap.get(model.id);
    if (metrics?.RPM) {
      totalRPM += metrics.RPM;
    }
  }
  return totalRPM;
}

/**
 * Format large numbers with K/M/B/T suffixes
 */
export function formatLargeNumber(num: number | null, decimals: number = 1): string {
  if (num === null || num === undefined) return 'N/A';

  if (num >= 1e12) return `${(num / 1e12).toFixed(decimals)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toFixed(decimals);
}

/**
 * Format params with B suffix
 */
export function formatParams(paramsB: number | null): string {
  if (paramsB === null) return 'Proprietary';
  return `${paramsB.toFixed(1)}B`;
}

/**
 * Format FLOPs with appropriate suffix
 */
export function formatFLOPs(flops: number | null): string {
  if (flops === null) return 'N/A';
  return formatLargeNumber(flops) + ' FLOPs';
}

/**
 * Format latency in ms
 */
export function formatLatency(ms: number | null): string {
  if (ms === null || ms === undefined) return 'N/A';
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
