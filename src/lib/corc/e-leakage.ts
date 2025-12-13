/**
 * Leakage Emissions Calculation (E_leakage)
 * Puro.earth Biochar Methodology - Section 8, Equation 8.1
 */

import type { LeakageInput, EcologicalLeakage, MarketActivityLeakage, ILUCInput } from './types';

/**
 * Calculate ecological leakage (L_ECO)
 *
 * Ecological leakage occurs when project activities cause displacement
 * of activities or land use changes that result in emissions elsewhere.
 *
 * Components:
 * - Facility construction/extension leakage
 * - Biomass sourcing area leakage
 *
 * @param leakage - Ecological leakage components
 * @returns Total ecological leakage in kg CO2e
 */
export function calculateEcologicalLeakage(leakage: EcologicalLeakage): number {
  const { facility, biomassSourcing } = leakage;

  return facility + biomassSourcing;
}

/**
 * Calculate market and activity-shifting leakage (L_MA)
 *
 * Market leakage occurs when project activities affect markets,
 * causing emissions to increase elsewhere.
 *
 * Components:
 * - AFOLU sector leakage (displacement of existing biomass uses)
 * - Energy/material market leakage (displacement of co-products)
 * - iLUC contribution (for high-risk feedstocks)
 *
 * @param leakage - Market/activity leakage components
 * @returns Total market/activity leakage in kg CO2e
 */
export function calculateMarketActivityLeakage(leakage: MarketActivityLeakage): number {
  const { afolu, energyMaterial, iluc } = leakage;

  return afolu + energyMaterial + iluc;
}

/**
 * Calculate total leakage emissions (E_leakage)
 *
 * Equation 8.1: E_leakage = L_ECO + L_MA
 *
 * Where:
 * - L_ECO: Ecological leakage (facility + biomass sourcing)
 * - L_MA: Market and activity-shifting leakage (AFOLU + energy/material + iLUC)
 *
 * @param input - Full leakage input
 * @returns Total leakage emissions in tonnes CO2e
 */
export function calculateELeakage(input: LeakageInput): number {
  const { ecologicalLeakage, marketActivityLeakage } = input;

  // Calculate individual components (all in kg CO2e)
  const ecologicalTotal = calculateEcologicalLeakage(ecologicalLeakage);
  const marketTotal = calculateMarketActivityLeakage(marketActivityLeakage);

  // Sum and convert from kg to tonnes
  const totalKgCO2e = ecologicalTotal + marketTotal;
  const totalTCO2e = totalKgCO2e / 1000;

  return totalTCO2e;
}

/**
 * Calculate iLUC contribution for high-risk feedstocks
 *
 * Per Section 8.6, indirect Land Use Change (iLUC) must be quantified
 * for feedstocks from Puro categories A, B, N (high-risk) or
 * dedicated energy crops.
 *
 * Formula: iLUC = Q × LHV × iLUC_factor × AF
 *
 * Where:
 * - Q: Quantity of feedstock (dry tonnes)
 * - LHV: Lower heating value (GJ/dry tonne)
 * - iLUC_factor: iLUC emission factor (kg CO2e/MJ)
 * - AF: Attribution factor (0-1)
 *
 * @param input - iLUC calculation input
 * @returns iLUC contribution in kg CO2e
 */
export function calculateILUC(input: ILUCInput): number {
  const {
    quantityDryTonnes,
    lowerHeatingValueGJ,
    ilucFactorKgCO2ePerMJ,
    attributionFactor = 1.0,
  } = input;

  if (quantityDryTonnes < 0) {
    throw new Error('Quantity cannot be negative');
  }

  if (lowerHeatingValueGJ < 0) {
    throw new Error('Lower heating value cannot be negative');
  }

  if (ilucFactorKgCO2ePerMJ < 0) {
    throw new Error('iLUC factor cannot be negative');
  }

  if (attributionFactor < 0 || attributionFactor > 1) {
    throw new Error('Attribution factor must be between 0 and 1');
  }

  // Convert GJ to MJ (1 GJ = 1000 MJ)
  const lhvMJ = lowerHeatingValueGJ * 1000;

  // iLUC = Q × LHV × iLUC_factor × AF
  const ilucKgCO2e = quantityDryTonnes * lhvMJ * ilucFactorKgCO2ePerMJ * attributionFactor;

  return ilucKgCO2e;
}

/**
 * Detailed leakage breakdown
 *
 * @param input - Full leakage input
 * @returns Detailed breakdown with all components
 */
export function getELeakageBreakdown(input: LeakageInput): {
  ecologicalLeakageKgCO2e: number;
  facilityKgCO2e: number;
  biomassSourcingKgCO2e: number;
  marketActivityLeakageKgCO2e: number;
  afoluKgCO2e: number;
  energyMaterialKgCO2e: number;
  ilucKgCO2e: number;
  totalLeakageKgCO2e: number;
  totalLeakageTCO2e: number;
} {
  const { ecologicalLeakage, marketActivityLeakage } = input;

  const ecologicalLeakageKgCO2e = calculateEcologicalLeakage(ecologicalLeakage);
  const marketActivityLeakageKgCO2e = calculateMarketActivityLeakage(marketActivityLeakage);
  const totalLeakageKgCO2e = ecologicalLeakageKgCO2e + marketActivityLeakageKgCO2e;
  const totalLeakageTCO2e = totalLeakageKgCO2e / 1000;

  return {
    ecologicalLeakageKgCO2e,
    facilityKgCO2e: ecologicalLeakage.facility,
    biomassSourcingKgCO2e: ecologicalLeakage.biomassSourcing,
    marketActivityLeakageKgCO2e,
    afoluKgCO2e: marketActivityLeakage.afolu,
    energyMaterialKgCO2e: marketActivityLeakage.energyMaterial,
    ilucKgCO2e: marketActivityLeakage.iluc,
    totalLeakageKgCO2e,
    totalLeakageTCO2e,
  };
}

/**
 * Create default (zero) leakage input
 *
 * Useful for initializing forms or when leakage is mitigated
 */
export function createDefaultLeakageInput(): LeakageInput {
  return {
    ecologicalLeakage: {
      facility: 0,
      biomassSourcing: 0,
    },
    marketActivityLeakage: {
      afolu: 0,
      energyMaterial: 0,
      iluc: 0,
    },
  };
}

/**
 * Check if feedstock requires iLUC assessment
 *
 * Per Section 8.6, high-risk categories A, B, N and dedicated crops
 * require iLUC quantification.
 *
 * @param puroCategory - Puro biomass category (A-O)
 * @param isDedicatedCrop - Whether feedstock is from dedicated energy crops
 * @returns Whether iLUC assessment is required
 */
export function requiresILUCAssessment(
  puroCategory: string,
  isDedicatedCrop: boolean = false
): boolean {
  const highRiskCategories = ['A', 'B', 'N'];

  if (isDedicatedCrop) {
    return true;
  }

  return highRiskCategories.includes(puroCategory.toUpperCase());
}

/**
 * Determine leakage risk level based on feedstock characteristics
 *
 * @param puroCategory - Puro biomass category
 * @param isDedicatedCrop - Whether feedstock is dedicated energy crop
 * @param hasExistingUse - Whether feedstock had existing economic use
 * @returns Risk level assessment
 */
export function assessLeakageRisk(
  puroCategory: string,
  isDedicatedCrop: boolean,
  hasExistingUse: boolean
): {
  riskLevel: 'low' | 'medium' | 'high';
  requiresILUC: boolean;
  mitigationRequired: boolean;
  notes: string[];
} {
  const notes: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  const requiresILUC = requiresILUCAssessment(puroCategory, isDedicatedCrop);

  // Dedicated crops are highest risk
  if (isDedicatedCrop) {
    riskLevel = 'high';
    notes.push('Dedicated energy crops require full iLUC assessment');
    notes.push('Must demonstrate no competition with food production');
  }

  // High-risk Puro categories
  if (['A', 'B', 'N'].includes(puroCategory.toUpperCase())) {
    if (riskLevel !== 'high') riskLevel = 'medium';
    notes.push(`Category ${puroCategory} is classified as high-risk for iLUC`);
  }

  // Existing economic use creates displacement risk
  if (hasExistingUse) {
    if (riskLevel === 'low') riskLevel = 'medium';
    notes.push('Feedstock with existing economic use may cause market displacement');
  }

  // Waste categories are lowest risk
  if (['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].includes(puroCategory.toUpperCase())) {
    if (!hasExistingUse) {
      notes.push('Waste/residue category with no existing use - low leakage risk');
    }
  }

  return {
    riskLevel,
    requiresILUC,
    mitigationRequired: riskLevel !== 'low',
    notes,
  };
}
