/**
 * 🌱 ESG Carbon Footprint Calculation API
 * Calculate carbon emissions for shipments and operations
 */

/**
 * Carbon emission factors (kg CO2 per km)
 */
const EMISSION_FACTORS = {
  road: {
    truck: 0.062, // kg CO2 per km for standard truck
    van: 0.045,
    motorcycle: 0.025
  },
  air: {
    domestic: 0.255, // kg CO2 per km
    international: 0.195
  },
  sea: {
    container: 0.011, // kg CO2 per km
    bulk: 0.008
  },
  rail: {
    electric: 0.006, // kg CO2 per km
    diesel: 0.022
  }
};

/**
 * Average distances between Turkish cities (km)
 */
const CITY_DISTANCES = {
  'istanbul-ankara': 450,
  'istanbul-izmir': 470,
  'istanbul-antalya': 720,
  'ankara-izmir': 590,
  'ankara-antalya': 550,
  'izmir-antalya': 450
};

/**
 * Calculate carbon footprint
 */
async function calculateCarbon(req, res) {
  const {
    orderId,
    shipmentId,
    distance,
    transportMode = 'road',
    transportType,
    weight = 1.0,
    origin,
    destination
  } = req.body;

  let calculatedDistance = distance;

  // If distance not provided but cities are, calculate
  if (!distance && origin && destination) {
    const cityPair = [origin.toLowerCase(), destination.toLowerCase()].sort().join('-');
    calculatedDistance = CITY_DISTANCES[cityPair] || 500; // Default 500km
  }

  // Default distance if still not available
  if (!calculatedDistance) {
    calculatedDistance = 300; // Average shipment distance
  }

  // Get emission factor
  let emissionFactor = 0.062; // Default to road truck

  if (EMISSION_FACTORS[transportMode]) {
    if (transportType && EMISSION_FACTORS[transportMode][transportType]) {
      emissionFactor = EMISSION_FACTORS[transportMode][transportType];
    } else {
      // Use first available type as default
      const modes = Object.values(EMISSION_FACTORS[transportMode]);
      emissionFactor = modes[0];
    }
  }

  // Calculate total emissions
  const baseEmissions = calculatedDistance * emissionFactor;
  const weightFactor = Math.sqrt(weight); // Heavier packages have somewhat higher emissions
  const totalEmissions = baseEmissions * weightFactor;

  // Breakdown by source
  const breakdown = [
    {
      source: 'Taşıma',
      amount: Math.round(totalEmissions * 0.75 * 100) / 100,
      percentage: 75
    },
    {
      source: 'Paketleme',
      amount: Math.round(totalEmissions * 0.15 * 100) / 100,
      percentage: 15
    },
    {
      source: 'Depolama',
      amount: Math.round(totalEmissions * 0.10 * 100) / 100,
      percentage: 10
    }
  ];

  // Generate recommendations
  const recommendations = [];

  if (transportMode === 'air') {
    recommendations.push('Havayolu yerine kara veya deniz taşımacılığı %80 daha az emisyon sağlar');
  }

  if (transportMode === 'road' && calculatedDistance > 500) {
    recommendations.push('Uzun mesafeler için demiryolu tercih edilebilir (%70 daha az emisyon)');
  }

  recommendations.push('Geri dönüştürülebilir paketleme malzemesi kullanın');
  recommendations.push('Rotaları optimize ederek mesafe ve emisyon azaltılabilir');

  if (weight > 5) {
    recommendations.push('Hafif paketleme alternatifleri değerlendirilebilir');
  }

  // Calculate carbon offset cost (approximate $25 per ton CO2)
  const offsetCostPerKg = 0.025; // $0.025 per kg CO2
  const offsetCost = Math.round(totalEmissions * offsetCostPerKg * 100) / 100;

  // Compare to alternatives
  const alternatives = [];

  if (transportMode === 'air') {
    const roadEmissions = calculatedDistance * EMISSION_FACTORS.road.truck * weightFactor;
    alternatives.push({
      mode: 'Kara yolu',
      emissions: Math.round(roadEmissions * 100) / 100,
      reduction: Math.round(((totalEmissions - roadEmissions) / totalEmissions) * 100)
    });
  }

  if (transportMode === 'road' && calculatedDistance > 200) {
    const railEmissions = calculatedDistance * EMISSION_FACTORS.rail.electric * weightFactor;
    alternatives.push({
      mode: 'Demiryolu',
      emissions: Math.round(railEmissions * 100) / 100,
      reduction: Math.round(((totalEmissions - railEmissions) / totalEmissions) * 100)
    });
  }

  res.json({
    success: true,
    orderId,
    shipmentId,
    carbonFootprint: Math.round(totalEmissions * 100) / 100,
    unit: 'kg CO₂',
    details: {
      distance: calculatedDistance,
      transportMode,
      transportType: transportType || 'standard',
      weight,
      emissionFactor
    },
    breakdown,
    recommendations,
    offset: {
      cost: offsetCost,
      currency: 'USD',
      provider: 'Carbon Offset Initiative'
    },
    alternatives,
    impact: {
      treesNeeded: Math.ceil(totalEmissions / 21), // One tree absorbs ~21kg CO2/year
      equivalentKm: Math.round(totalEmissions / 0.12), // Average car emissions 0.12 kg/km
      category: totalEmissions < 5 ? 'low' : totalEmissions < 20 ? 'medium' : 'high'
    },
    timestamp: new Date().toISOString()
  });
}

module.exports = { calculateCarbon };
