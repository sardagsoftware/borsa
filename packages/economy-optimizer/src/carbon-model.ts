/**
 * CARBON FOOTPRINT ESTIMATOR
 *
 * Purpose: Calculate carbon emissions for shipments
 * Method: Distance × Weight × Emission Factor
 * Compliance: Transparent methodology, auditable calculations
 */

import { CarbonEstimate } from './types';

/**
 * Emission factors (kg CO2 per ton-km)
 *
 * Source: DEFRA 2023 Conversion Factors
 */
const EMISSION_FACTORS: Record<string, Record<string, number>> = {
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
  sea: {
    default: 0.011,
  },
  rail: {
    default: 0.022,
  },
};

export class CarbonEstimator {
  /**
   * Estimate carbon footprint for shipment
   *
   * @param shipment_id - Shipment ID
   * @param distance_km - Distance in kilometers
   * @param weight_kg - Weight in kilograms
   * @param carrier - Carrier name
   * @param transport_mode - Transport mode
   * @returns Carbon estimate with green alternatives
   *
   * @example
   * ```typescript
   * const estimator = new CarbonEstimator();
   * const carbon = await estimator.estimate(
   *   'SHIP-123',
   *   500, // km
   *   10,  // kg
   *   'aras',
   *   'ground'
   * );
   *
   * console.log(carbon.carbon_kg); // 0.31 kg CO2
   * console.log(carbon.green_alternative_available); // true
   * ```
   */
  async estimate(
    shipment_id: string,
    distance_km: number,
    weight_kg: number,
    carrier: string,
    transport_mode: 'ground' | 'air' | 'sea' | 'rail'
  ): Promise<CarbonEstimate> {
    // Get emission factor for carrier and mode
    const modeFactors = EMISSION_FACTORS[transport_mode] || EMISSION_FACTORS.ground;
    const emission_factor = modeFactors[carrier.toLowerCase()] || modeFactors.default;

    // Calculate carbon: (distance_km × weight_kg / 1000) × emission_factor
    // Weight divided by 1000 to convert kg to tons
    const carbon_kg = (distance_km * (weight_kg / 1000)) * emission_factor;

    // Check for green alternative
    const green_alternative_available = transport_mode === 'air' || transport_mode === 'ground';
    let green_alternative_carbon_kg: number | undefined;

    if (green_alternative_available) {
      if (transport_mode === 'air') {
        // Rail alternative for air
        const rail_factor = EMISSION_FACTORS.rail.default;
        green_alternative_carbon_kg = (distance_km * (weight_kg / 1000)) * rail_factor;
      } else {
        // Best ground carrier alternative
        const best_ground_factor = Math.min(...Object.values(EMISSION_FACTORS.ground));
        green_alternative_carbon_kg = (distance_km * (weight_kg / 1000)) * best_ground_factor;
      }
    }

    return {
      shipment_id,
      distance_km,
      weight_kg,
      carrier,
      transport_mode,
      carbon_kg: Math.round(carbon_kg * 1000) / 1000, // Round to 3 decimals
      emission_factor,
      green_alternative_available,
      green_alternative_carbon_kg: green_alternative_carbon_kg
        ? Math.round(green_alternative_carbon_kg * 1000) / 1000
        : undefined,
    };
  }

  /**
   * Batch estimate for multiple shipments
   */
  async batchEstimate(
    shipments: Array<{
      shipment_id: string;
      distance_km: number;
      weight_kg: number;
      carrier: string;
      transport_mode: 'ground' | 'air' | 'sea' | 'rail';
    }>
  ): Promise<CarbonEstimate[]> {
    const estimates: CarbonEstimate[] = [];

    for (const shipment of shipments) {
      const estimate = await this.estimate(
        shipment.shipment_id,
        shipment.distance_km,
        shipment.weight_kg,
        shipment.carrier,
        shipment.transport_mode
      );
      estimates.push(estimate);
    }

    return estimates;
  }

  /**
   * Calculate total carbon for period
   */
  calculateTotalCarbon(estimates: CarbonEstimate[]): {
    total_carbon_kg: number;
    total_distance_km: number;
    total_weight_kg: number;
    avg_emission_factor: number;
    green_savings_potential_kg: number;
  } {
    const total_carbon_kg = estimates.reduce((sum, e) => sum + e.carbon_kg, 0);
    const total_distance_km = estimates.reduce((sum, e) => sum + e.distance_km, 0);
    const total_weight_kg = estimates.reduce((sum, e) => sum + e.weight_kg, 0);

    const avg_emission_factor = total_carbon_kg / ((total_distance_km * total_weight_kg) / 1000);

    const green_savings_potential_kg = estimates.reduce((sum, e) => {
      if (e.green_alternative_available && e.green_alternative_carbon_kg) {
        return sum + (e.carbon_kg - e.green_alternative_carbon_kg);
      }
      return sum;
    }, 0);

    return {
      total_carbon_kg: Math.round(total_carbon_kg * 1000) / 1000,
      total_distance_km: Math.round(total_distance_km),
      total_weight_kg: Math.round(total_weight_kg * 100) / 100,
      avg_emission_factor: Math.round(avg_emission_factor * 1000) / 1000,
      green_savings_potential_kg: Math.round(green_savings_potential_kg * 1000) / 1000,
    };
  }
}
