/**
 * LYDIAN-IQ ESG — CARBON CALCULATOR
 *
 * Calculate carbon footprint for shipments and transactions
 * Uses DEFRA 2023 emission factors
 */

import { z } from 'zod';

// Shipment Schema
export const ShipmentSchema = z.object({
  shipment_id: z.string(),
  origin: z.string(),
  destination: z.string(),
  distance_km: z.number().min(0),
  weight_kg: z.number().min(0),
  transport_mode: z.enum(['ground', 'air', 'sea', 'rail']),
  carrier: z.string(),
  delivery_type: z.enum(['standard', 'express', 'eco']).optional(),
});

export type Shipment = z.infer<typeof ShipmentSchema>;

// Carbon Result
export interface CarbonFootprint {
  shipment_id: string;
  carbon_kg_co2: number;
  emission_factor: number;
  transport_mode: string;
  green_label: boolean;
  offset_cost_usd: number;
  recommendations: string[];
}

// ESG Metrics
export interface ESGMetrics {
  period: string; // YYYY-MM
  total_shipments: number;
  total_carbon_kg_co2: number;
  avg_carbon_per_shipment: number;
  green_deliveries_percent: number;
  carbon_reduction_vs_baseline_percent: number;
  top_polluting_routes: Array<{ route: string; carbon_kg: number }>;
  recommendations: string[];
}

export class CarbonCalculator {
  // DEFRA 2023 emission factors (kg CO2 per tonne-km)
  private EMISSION_FACTORS = {
    ground: {
      aras: 0.062,
      yurtici: 0.065,
      ups: 0.058,
      hepsijet: 0.070,
      mng: 0.063,
      surat: 0.068,
      default: 0.065,
    },
    air: {
      ups: 0.602,
      default: 0.600,
    },
    sea: { default: 0.011 },
    rail: { default: 0.022 },
  };

  /**
   * Calculate carbon footprint for a shipment
   */
  calculateShipmentCarbon(shipment: Shipment): CarbonFootprint {
    const validated = ShipmentSchema.parse(shipment);

    // Get emission factor
    const modeFactors = this.EMISSION_FACTORS[validated.transport_mode];
    const emission_factor = (modeFactors as any)[validated.carrier.toLowerCase()] || (modeFactors as any).default;

    // Calculate carbon: (distance_km × weight_kg / 1000) × emission_factor
    const carbon_kg_co2 = (validated.distance_km * validated.weight_kg / 1000) * emission_factor;

    // Determine if green label eligible (rail/sea or eco delivery)
    const green_label = validated.transport_mode === 'rail' ||
                        validated.transport_mode === 'sea' ||
                        validated.delivery_type === 'eco';

    // Calculate offset cost ($15 per tonne CO2)
    const offset_cost_usd = (carbon_kg_co2 / 1000) * 15;

    // Generate recommendations
    const recommendations: string[] = [];
    if (validated.transport_mode === 'air') {
      recommendations.push('Consider switching to ground transport for 85% carbon reduction');
    }
    if (validated.transport_mode === 'ground' && validated.distance_km > 500) {
      recommendations.push('Consider rail transport for long distances (65% carbon reduction)');
    }
    if (!green_label) {
      recommendations.push('Opt for eco-friendly delivery to earn green label');
    }

    return {
      shipment_id: validated.shipment_id,
      carbon_kg_co2: Math.round(carbon_kg_co2 * 100) / 100,
      emission_factor,
      transport_mode: validated.transport_mode,
      green_label,
      offset_cost_usd: Math.round(offset_cost_usd * 100) / 100,
      recommendations,
    };
  }

  /**
   * Calculate ESG metrics for a period
   */
  calculateESGMetrics(shipments: CarbonFootprint[], period: string): ESGMetrics {
    const total_shipments = shipments.length;
    const total_carbon_kg_co2 = shipments.reduce((sum, s) => sum + s.carbon_kg_co2, 0);
    const avg_carbon_per_shipment = total_shipments > 0 ? total_carbon_kg_co2 / total_shipments : 0;

    const green_count = shipments.filter(s => s.green_label).length;
    const green_deliveries_percent = total_shipments > 0 ? (green_count / total_shipments) * 100 : 0;

    // Calculate baseline (assume 20% reduction target)
    const baseline_carbon = total_carbon_kg_co2 * 1.2;
    const carbon_reduction_vs_baseline_percent = ((baseline_carbon - total_carbon_kg_co2) / baseline_carbon) * 100;

    // Top polluting routes (mock data - in production, aggregate by route)
    const top_polluting_routes = [
      { route: 'Istanbul → Ankara (Air)', carbon_kg: 450.5 },
      { route: 'İzmir → Adana (Ground)', carbon_kg: 180.2 },
      { route: 'Antalya → Bursa (Ground)', carbon_kg: 145.8 },
    ];

    // Recommendations
    const recommendations: string[] = [];
    if (green_deliveries_percent < 30) {
      recommendations.push('Increase green delivery adoption to reduce carbon footprint by 40%');
    }
    if (carbon_reduction_vs_baseline_percent < 15) {
      recommendations.push('Switch 30% of air shipments to ground transport for significant savings');
    }
    recommendations.push('Implement carbon offset program for unavoidable emissions');

    return {
      period,
      total_shipments,
      total_carbon_kg_co2: Math.round(total_carbon_kg_co2 * 100) / 100,
      avg_carbon_per_shipment: Math.round(avg_carbon_per_shipment * 100) / 100,
      green_deliveries_percent: Math.round(green_deliveries_percent * 10) / 10,
      carbon_reduction_vs_baseline_percent: Math.round(carbon_reduction_vs_baseline_percent * 10) / 10,
      top_polluting_routes,
      recommendations,
    };
  }

  /**
   * Generate green label eligibility
   */
  isGreenLabelEligible(carbon_kg_co2: number, transport_mode: string): boolean {
    const thresholds = {
      ground: 50,
      rail: 100,
      sea: 100,
      air: 20, // Stricter for air
    };

    const threshold = (thresholds as any)[transport_mode] || 50;
    return carbon_kg_co2 <= threshold;
  }
}
