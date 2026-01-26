/**
 * CIVIC AGGREGATOR
 *
 * Purpose: Anonymized aggregate statistics with DP + k-anonymity
 * Privacy: Differential Privacy noise injection + k-anonymity suppression
 * Compliance: KVKK/GDPR Article 89 (public interest research)
 */

import { DifferentialPrivacyEngine } from './dp-engine';
import {
  InsightsQueryRequest,
  PriceTrendInsight,
  ReturnRateInsight,
  LogisticsBottleneckInsight,
  DPParameters,
  KAnonymityConfig,
} from './types';

/**
 * Default k-anonymity configuration
 */
const DEFAULT_K_ANONYMITY: KAnonymityConfig = {
  k: 5, // Minimum group size
  suppress_below_k: true,
  generalization_levels: {
    city: ['city', 'province', 'region', 'country'],
    date: ['day', 'week', 'month', 'quarter', 'year'],
  },
};

/**
 * Mock feature store interface
 * Production: Replace with DuckDB/Redis feature store
 */
interface FeatureStore {
  queryPriceTrend(params: {
    region?: string;
    sector?: string;
    start: string;
    end: string;
    granularity: 'daily' | 'weekly' | 'monthly';
  }): Promise<Array<{ date: string; avg_price: number; count: number }>>;

  queryReturnRate(params: {
    region?: string;
    sector?: string;
    start: string;
    end: string;
  }): Promise<{ returns: number; total_orders: number }>;

  queryLogisticsBottlenecks(params: { region: string; start: string; end: string }): Promise<
    Array<{
      area: string;
      avg_delay_hours: number;
      affected_shipments: number;
      total_shipments: number;
    }>
  >;
}

/**
 * Mock feature store implementation
 */
class MockFeatureStore implements FeatureStore {
  async queryPriceTrend(params: any) {
    const days = Math.ceil(
      (new Date(params.end).getTime() - new Date(params.start).getTime()) / (1000 * 60 * 60 * 24)
    );
    const dataPoints = Math.ceil(
      days / (params.granularity === 'daily' ? 1 : params.granularity === 'weekly' ? 7 : 30)
    );

    const result = [];
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date(params.start);
      date.setDate(
        date.getDate() +
          i * (params.granularity === 'daily' ? 1 : params.granularity === 'weekly' ? 7 : 30)
      );

      result.push({
        date: date.toISOString(),
        avg_price: 100 + Math.random() * 50,
        count: 50 + Math.floor(Math.random() * 200), // Random count for k-anonymity check
      });
    }
    return result;
  }

  async queryReturnRate(_params: any) {
    return {
      returns: 45,
      total_orders: 500,
    };
  }

  async queryLogisticsBottlenecks(_params: any) {
    return [
      {
        area: 'Kadıköy-Üsküdar',
        avg_delay_hours: 4.2,
        affected_shipments: 120,
        total_shipments: 800,
      },
      { area: 'Beyoğlu-Şişli', avg_delay_hours: 2.8, affected_shipments: 80, total_shipments: 600 },
      {
        area: 'Ankara-Çankaya',
        avg_delay_hours: 1.5,
        affected_shipments: 30,
        total_shipments: 400,
      },
    ];
  }
}

/**
 * Civic Aggregator with DP + k-anonymity
 */
export class CivicAggregator {
  private dpEngine: DifferentialPrivacyEngine;
  private featureStore: FeatureStore;
  private kAnonymityConfig: KAnonymityConfig;

  constructor(
    featureStore?: FeatureStore,
    kAnonymityConfig: KAnonymityConfig = DEFAULT_K_ANONYMITY
  ) {
    this.dpEngine = new DifferentialPrivacyEngine();
    this.featureStore = featureStore || new MockFeatureStore();
    this.kAnonymityConfig = kAnonymityConfig;
  }

  /**
   * Aggregate price trend with DP protection
   */
  async aggregatePriceTrend(request: InsightsQueryRequest): Promise<PriceTrendInsight> {
    // Validate request
    InsightsQueryRequest.parse(request);

    if (request.metric !== 'price_trend') {
      throw new Error('Invalid metric for price trend aggregation');
    }

    // Query feature store
    const rawData = await this.featureStore.queryPriceTrend({
      region: request.region,
      sector: request.sector,
      start: request.period_start,
      end: request.period_end,
      granularity: request.granularity,
    });

    // Apply k-anonymity filtering
    const kThreshold = this.kAnonymityConfig.k;
    const filteredData = rawData.filter(point => point.count >= kThreshold);

    // Determine data quality based on k-anonymity
    const avgCount = filteredData.reduce((sum, p) => sum + p.count, 0) / filteredData.length;
    const data_quality: 'high' | 'medium' | 'low' =
      avgCount > kThreshold * 10 ? 'high' : avgCount > kThreshold * 3 ? 'medium' : 'low';

    // Prepare DP parameters
    const dpParams: DPParameters = {
      epsilon: request.dp_epsilon || 1.0,
      sensitivity: 10.0, // Max price change per individual (e.g., 10 TRY)
      noise_mechanism: 'laplace',
    };

    // Apply DP noise to each data point
    const data_points = filteredData.map((point, idx) => {
      const noisy_price = this.dpEngine.applyDP(point.avg_price, dpParams);

      // Calculate price change
      const price_change_percent =
        idx > 0 && filteredData[idx - 1]?.avg_price
          ? ((noisy_price - filteredData[idx - 1].avg_price) / filteredData[idx - 1].avg_price) *
            100
          : 0;

      return {
        date: point.date,
        avg_price: Math.round(noisy_price * 100) / 100,
        price_change_percent: Math.round(price_change_percent * 100) / 100,
        dp_noise_added: true,
      };
    });

    // Generate privacy guarantee description
    const privacy_guarantee = this.dpEngine.getPrivacyGuarantee(dpParams);

    return {
      metric: 'price_trend',
      region: request.region,
      sector: request.sector,
      data_points,
      dp_parameters: dpParams,
      privacy_guarantee,
      data_quality,
    };
  }

  /**
   * Aggregate return rate with DP protection
   */
  async aggregateReturnRate(request: InsightsQueryRequest): Promise<ReturnRateInsight> {
    // Validate request
    InsightsQueryRequest.parse(request);

    if (request.metric !== 'return_rate') {
      throw new Error('Invalid metric for return rate aggregation');
    }

    // Query feature store
    const rawData = await this.featureStore.queryReturnRate({
      region: request.region,
      sector: request.sector,
      start: request.period_start,
      end: request.period_end,
    });

    // Check k-anonymity threshold
    const kThreshold = this.kAnonymityConfig.k;
    const suppressed = rawData.total_orders < kThreshold;

    if (suppressed && this.kAnonymityConfig.suppress_below_k) {
      return {
        metric: 'return_rate',
        region: request.region,
        sector: request.sector,
        return_rate_percent: 0,
        total_orders: 0,
        dp_noise_added: false,
        dp_parameters: {
          epsilon: request.dp_epsilon || 1.0,
          sensitivity: 1.0,
          noise_mechanism: 'laplace',
        },
        k_anonymity: kThreshold,
        suppressed: true,
      };
    }

    // Calculate true return rate
    const true_return_rate = (rawData.returns / rawData.total_orders) * 100;

    // Prepare DP parameters
    const dpParams: DPParameters = {
      epsilon: request.dp_epsilon || 1.0,
      sensitivity: 1.0, // Max contribution per individual (1 order)
      noise_mechanism: 'laplace',
    };

    // Apply DP noise to return rate
    const noisy_return_rate = this.dpEngine.applyDP(true_return_rate, dpParams);

    return {
      metric: 'return_rate',
      region: request.region,
      sector: request.sector,
      return_rate_percent: Math.max(0, Math.min(100, Math.round(noisy_return_rate * 100) / 100)),
      total_orders: rawData.total_orders,
      dp_noise_added: true,
      dp_parameters: dpParams,
      k_anonymity: kThreshold,
      suppressed: false,
    };
  }

  /**
   * Aggregate logistics bottlenecks with DP protection
   */
  async aggregateLogisticsBottlenecks(
    request: InsightsQueryRequest
  ): Promise<LogisticsBottleneckInsight> {
    // Validate request
    InsightsQueryRequest.parse(request);

    if (request.metric !== 'logistics_bottleneck') {
      throw new Error('Invalid metric for logistics bottleneck aggregation');
    }

    if (!request.region) {
      throw new Error('Region is required for logistics bottleneck analysis');
    }

    // Query feature store
    const rawData = await this.featureStore.queryLogisticsBottlenecks({
      region: request.region,
      start: request.period_start,
      end: request.period_end,
    });

    // Prepare DP parameters
    const dpParams: DPParameters = {
      epsilon: request.dp_epsilon || 1.0,
      sensitivity: 2.0, // Max delay contribution per individual (2 hours)
      noise_mechanism: 'laplace',
    };

    // Apply DP noise to bottleneck metrics
    const bottlenecks = rawData
      .filter(area => area.total_shipments >= this.kAnonymityConfig.k)
      .map(area => {
        const noisy_delay = this.dpEngine.applyDP(area.avg_delay_hours, dpParams);
        const affected_percent = (area.affected_shipments / area.total_shipments) * 100;

        // Classify severity
        const severity: 'low' | 'medium' | 'high' =
          noisy_delay > 4 ? 'high' : noisy_delay > 2 ? 'medium' : 'low';

        return {
          area: area.area,
          severity,
          avg_delay_hours: Math.max(0, Math.round(noisy_delay * 10) / 10),
          affected_shipments_percent: Math.round(affected_percent * 100) / 100,
        };
      });

    // Generate privacy guarantee
    const privacy_guarantee = this.dpEngine.getPrivacyGuarantee(dpParams);

    return {
      metric: 'logistics_bottleneck',
      region: request.region,
      bottlenecks,
      dp_parameters: dpParams,
      privacy_guarantee,
    };
  }
}
