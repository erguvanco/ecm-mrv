/**
 * Project Emissions Calculation (E_project)
 * Puro.earth Biochar Methodology - Section 7, Equations 7.1 & 7.2
 */

import { GWP_VALUES } from './constants';
import type {
  EProjectInput,
  BiomassEmissions,
  ProductionEmissions,
  EmbodiedEmissions,
  EndUseEmissions,
} from './types';

/**
 * Calculate total biomass sourcing emissions (E_biomass)
 *
 * Includes cultivation (for dedicated crops), collection, transport, and preprocessing
 *
 * @param emissions - Biomass emissions breakdown
 * @returns Total biomass emissions in kg CO2e
 */
export function calculateBiomassEmissions(emissions: BiomassEmissions): number {
  const { cultivation, collection, transport, preprocessing } = emissions;

  return cultivation + collection + transport + preprocessing;
}

/**
 * Calculate total production emissions (E_production)
 *
 * Includes energy, materials, waste, direct stack emissions, and maintenance.
 * Stack emissions (CH4, N2O) are converted to CO2e using GWP values.
 *
 * @param emissions - Production emissions breakdown
 * @returns Total production emissions in kg CO2e
 */
export function calculateProductionEmissions(emissions: ProductionEmissions): number {
  const {
    energy,
    materials,
    waste,
    stackCH4Kg,
    stackN2OKg,
    fossilCO2Kg,
    maintenance,
  } = emissions;

  // Convert stack emissions to CO2e using GWP values
  const stackCH4CO2e = stackCH4Kg * GWP_VALUES.CH4;
  const stackN2OCO2e = stackN2OKg * GWP_VALUES.N2O;

  return (
    energy +
    materials +
    waste +
    stackCH4CO2e +
    stackN2OCO2e +
    fossilCO2Kg +
    maintenance
  );
}

/**
 * Calculate total embodied emissions (E_emb)
 *
 * Includes infrastructure (amortized) and direct land use change (dLUC)
 *
 * @param emissions - Embodied emissions breakdown
 * @returns Total embodied emissions in kg CO2e
 */
export function calculateEmbodiedEmissions(emissions: EmbodiedEmissions): number {
  const { infrastructure, dLUC } = emissions;

  return infrastructure + dLUC;
}

/**
 * Calculate total end-use emissions (E_use)
 *
 * Includes transport to end-use location, packaging, and incorporation
 *
 * @param emissions - End-use emissions breakdown
 * @returns Total end-use emissions in kg CO2e
 */
export function calculateEndUseEmissions(emissions: EndUseEmissions): number {
  const { transport, packaging, incorporation } = emissions;

  return transport + packaging + incorporation;
}

/**
 * Calculate total project emissions (E_project)
 *
 * Equation 7.1: E_project = E_ops + E_emb
 * Equation 7.2: E_ops = E_biomass + E_production + E_use
 *
 * Therefore: E_project = E_biomass + E_production + E_use + E_emb
 *
 * If co-product allocation is applicable, it's applied to production emissions.
 *
 * @param input - Full project emissions input
 * @returns Total project emissions in tonnes CO2e
 */
export function calculateEProject(input: EProjectInput): number {
  const {
    biomassEmissions,
    productionEmissions,
    embodiedEmissions,
    endUseEmissions,
    coProductAllocationFactor,
  } = input;

  // Calculate individual components (all in kg CO2e)
  const biomassTotal = calculateBiomassEmissions(biomassEmissions);
  let productionTotal = calculateProductionEmissions(productionEmissions);
  const embodiedTotal = calculateEmbodiedEmissions(embodiedEmissions);
  const endUseTotal = calculateEndUseEmissions(endUseEmissions);

  // Apply co-product allocation to production emissions if applicable
  // Default to 1.0 (100% allocation to biochar) if not specified or invalid
  const allocationFactor = (
    coProductAllocationFactor !== undefined &&
    coProductAllocationFactor > 0 &&  // Factor of 0 would zero out emissions incorrectly
    coProductAllocationFactor <= 1
  ) ? coProductAllocationFactor : 1.0;

  productionTotal *= allocationFactor;

  // Sum all components (convert from kg to tonnes)
  const totalKgCO2e = biomassTotal + productionTotal + embodiedTotal + endUseTotal;
  const totalTCO2e = totalKgCO2e / 1000;

  return totalTCO2e;
}

/**
 * Detailed project emissions breakdown
 *
 * @param input - Full project emissions input
 * @returns Detailed breakdown with all components
 */
export function getEProjectBreakdown(input: EProjectInput): {
  biomassEmissionsKgCO2e: number;
  productionEmissionsKgCO2e: number;
  productionEmissionsAllocatedKgCO2e: number;
  embodiedEmissionsKgCO2e: number;
  endUseEmissionsKgCO2e: number;
  operationalEmissionsKgCO2e: number;
  totalEmissionsKgCO2e: number;
  totalEmissionsTCO2e: number;
  coProductAllocationFactor: number;
  breakdown: {
    biomass: BiomassEmissions;
    production: ProductionEmissions & { stackCH4CO2e: number; stackN2OCO2e: number };
    embodied: EmbodiedEmissions;
    endUse: EndUseEmissions;
  };
} {
  const {
    biomassEmissions,
    productionEmissions,
    embodiedEmissions,
    endUseEmissions,
    coProductAllocationFactor = 1.0,
  } = input;

  const biomassEmissionsKgCO2e = calculateBiomassEmissions(biomassEmissions);
  const productionEmissionsKgCO2e = calculateProductionEmissions(productionEmissions);
  const productionEmissionsAllocatedKgCO2e = productionEmissionsKgCO2e * coProductAllocationFactor;
  const embodiedEmissionsKgCO2e = calculateEmbodiedEmissions(embodiedEmissions);
  const endUseEmissionsKgCO2e = calculateEndUseEmissions(endUseEmissions);

  // E_ops = E_biomass + E_production (allocated) + E_use
  const operationalEmissionsKgCO2e =
    biomassEmissionsKgCO2e + productionEmissionsAllocatedKgCO2e + endUseEmissionsKgCO2e;

  // E_project = E_ops + E_emb
  const totalEmissionsKgCO2e = operationalEmissionsKgCO2e + embodiedEmissionsKgCO2e;
  const totalEmissionsTCO2e = totalEmissionsKgCO2e / 1000;

  return {
    biomassEmissionsKgCO2e,
    productionEmissionsKgCO2e,
    productionEmissionsAllocatedKgCO2e,
    embodiedEmissionsKgCO2e,
    endUseEmissionsKgCO2e,
    operationalEmissionsKgCO2e,
    totalEmissionsKgCO2e,
    totalEmissionsTCO2e,
    coProductAllocationFactor,
    breakdown: {
      biomass: biomassEmissions,
      production: {
        ...productionEmissions,
        stackCH4CO2e: productionEmissions.stackCH4Kg * GWP_VALUES.CH4,
        stackN2OCO2e: productionEmissions.stackN2OKg * GWP_VALUES.N2O,
      },
      embodied: embodiedEmissions,
      endUse: endUseEmissions,
    },
  };
}

/**
 * Create default (zero) emissions input
 *
 * Useful for initializing forms or when emissions data is not yet available
 */
export function createDefaultEProjectInput(): EProjectInput {
  return {
    biomassEmissions: {
      cultivation: 0,
      collection: 0,
      transport: 0,
      preprocessing: 0,
    },
    productionEmissions: {
      energy: 0,
      materials: 0,
      waste: 0,
      stackCH4Kg: 0,
      stackN2OKg: 0,
      fossilCO2Kg: 0,
      maintenance: 0,
    },
    embodiedEmissions: {
      infrastructure: 0,
      dLUC: 0,
    },
    endUseEmissions: {
      transport: 0,
      packaging: 0,
      incorporation: 0,
    },
    coProductAllocationFactor: 1.0,
  };
}

/**
 * Calculate co-product allocation factor based on energy content (LHV)
 *
 * Per Section 7.5.2.b, energy content allocation is required for biochar production
 *
 * @param biocharEnergyMJ - Energy content of biochar (MJ)
 * @param totalCoProductEnergyMJ - Total energy content of all co-products (MJ)
 * @returns Allocation factor for biochar (0-1)
 */
export function calculateCoProductAllocationFactor(
  biocharEnergyMJ: number,
  totalCoProductEnergyMJ: number
): number {
  const totalEnergy = biocharEnergyMJ + totalCoProductEnergyMJ;

  if (totalEnergy <= 0) {
    return 1.0; // No co-products, biochar gets 100%
  }

  return biocharEnergyMJ / totalEnergy;
}
