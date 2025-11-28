// Simplified LCA emission factors
// Based on typical biochar carbon removal emission factors

export const EMISSION_FACTORS = {
  // Transport emissions (kg CO2e per km per tonne)
  transport: {
    diesel: 0.089, // kg CO2e per km-tonne
    petrol: 0.095,
    electric: 0.025,
    biodiesel: 0.045,
    hybrid: 0.065,
    other: 0.089,
  },

  // Energy emissions (kg CO2e per unit)
  energy: {
    electricity: 0.233, // kg CO2e per kWh (UK grid average)
    diesel: 2.68, // kg CO2e per litre
    gas: 2.02, // kg CO2e per m³
    propane: 1.51, // kg CO2e per litre
    biomass: 0.015, // kg CO2e per kg (low due to biogenic)
    other: 1.0, // fallback
  },

  // Carbon sequestration factors
  sequestration: {
    carbonContentBiochar: 0.75, // 75% carbon content in biochar
    permanenceMultiplier: 0.85, // Account for non-permanent fraction
    co2PerCarbonRatio: 3.67, // CO2 / C ratio (44/12)
  },
} as const;

export interface LCACalculation {
  // Inputs
  totalFeedstockTonnes: number;
  totalBiocharTonnes: number;
  totalTransportKm: number;
  totalEnergyKWh: number;

  // Emissions breakdown
  transportEmissions: number;
  energyEmissions: number;
  totalEmissions: number;

  // Removals
  grossRemoval: number;
  netRemoval: number;

  // Metrics
  carbonEfficiency: number;
  emissionIntensity: number;
}

export function calculateLCA(params: {
  biocharTonnes: number;
  transportEvents: Array<{
    distanceKm: number;
    cargoTonnes?: number;
    fuelType?: string;
  }>;
  energyUsages: Array<{
    quantity: number;
    unit: string;
    energyType: string;
  }>;
}): LCACalculation {
  const { biocharTonnes, transportEvents, energyUsages } = params;

  // Calculate transport emissions
  let transportEmissions = 0;
  let totalTransportKm = 0;
  for (const event of transportEvents) {
    const fuelFactor =
      EMISSION_FACTORS.transport[
        event.fuelType as keyof typeof EMISSION_FACTORS.transport
      ] || EMISSION_FACTORS.transport.diesel;
    const cargoTonnes = event.cargoTonnes || 1;
    transportEmissions += event.distanceKm * cargoTonnes * fuelFactor;
    totalTransportKm += event.distanceKm;
  }

  // Calculate energy emissions
  let energyEmissions = 0;
  let totalEnergyKWh = 0;
  for (const usage of energyUsages) {
    const factor =
      EMISSION_FACTORS.energy[
        usage.energyType as keyof typeof EMISSION_FACTORS.energy
      ] || EMISSION_FACTORS.energy.other;

    // Convert to standard units if needed
    let quantity = usage.quantity;
    if (usage.unit === 'kWh') {
      totalEnergyKWh += quantity;
    } else if (usage.unit === 'litres') {
      totalEnergyKWh += quantity * 2.78; // Approximate conversion
    }

    energyEmissions += quantity * factor;
  }

  // Calculate total emissions
  const totalEmissions = transportEmissions + energyEmissions;

  // Calculate gross carbon removal
  const { carbonContentBiochar, permanenceMultiplier, co2PerCarbonRatio } =
    EMISSION_FACTORS.sequestration;

  // Gross removal: biochar tonnes * carbon content * CO2 ratio * 1000 (to kg)
  const grossRemoval =
    biocharTonnes * carbonContentBiochar * co2PerCarbonRatio * 1000;

  // Net removal: Gross removal - emissions, adjusted for permanence
  const netRemoval = grossRemoval * permanenceMultiplier - totalEmissions;

  // Carbon efficiency: Net removal / Gross removal
  const carbonEfficiency = grossRemoval > 0 ? (netRemoval / grossRemoval) * 100 : 0;

  // Emission intensity: kg CO2e emitted per tonne biochar
  const emissionIntensity = biocharTonnes > 0 ? totalEmissions / biocharTonnes : 0;

  return {
    totalFeedstockTonnes: 0, // Set by caller if known
    totalBiocharTonnes: biocharTonnes,
    totalTransportKm,
    totalEnergyKWh,
    transportEmissions,
    energyEmissions,
    totalEmissions,
    grossRemoval,
    netRemoval,
    carbonEfficiency,
    emissionIntensity,
  };
}

// Convert kg to tonnes for display
export function kgToTonnes(kg: number): number {
  return kg / 1000;
}

// Format number for display
export function formatNumber(value: number, decimals = 2): string {
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return value.toFixed(decimals);
}
