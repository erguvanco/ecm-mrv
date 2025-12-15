/**
 * CORC Calculator
 * Puro.earth Biochar Methodology - Equation 5.1
 *
 * Main quantification formula:
 * CORCs = C_stored − C_baseline − C_loss − E_project − E_leakage
 */

import { CALCULATION_VERSION } from './constants';
import type { CORCCalculationInput, CORCCalculationResult } from './types';
import { calculateHCorgRatio, validateBiocharQuality } from './quality';
import { calculateCStored, getCStoredBreakdown } from './c-stored';
import { calculatePersistenceFraction, calculateCLoss, getPersistenceBreakdown } from './c-loss';
import { calculateEProject, getEProjectBreakdown } from './e-project';
import { calculateELeakage, getELeakageBreakdown } from './e-leakage';

/**
 * Calculate net CORCs (CO2 Removal Certificates)
 *
 * Equation 5.1: CORCs = C_stored − C_baseline − C_loss − E_project − E_leakage
 *
 * Where:
 * - C_stored: Carbon stored in biochar (Equation 6.1)
 * - C_baseline: Baseline carbon storage scenario
 * - C_loss: Carbon loss due to decomposition (Equation 6.3)
 * - E_project: Project lifecycle emissions (Equation 7.1)
 * - E_leakage: Leakage emissions (Equation 8.1)
 *
 * @param input - Full CORC calculation input
 * @returns CORC calculation result with detailed breakdown
 */
export function calculateCORCs(input: CORCCalculationInput): CORCCalculationResult {
  const {
    biocharDryMassTonnes,
    organicCarbonPercent,
    hydrogenPercent,
    meanSoilTempC,
    baselineType,
    baselineCarbonStorageTCO2e = 0,
    projectEmissions,
    leakageEmissions,
  } = input;

  // Step 1: Calculate H/C_org ratio and validate quality
  const hCorgRatio = calculateHCorgRatio({
    hydrogenPercent,
    organicCarbonPercent,
  });

  const qualityValid = validateBiocharQuality(hCorgRatio);

  // Step 2: Calculate C_stored (Equation 6.1)
  const cStoredTCO2e = calculateCStored({
    biocharDryMassTonnes,
    organicCarbonPercent,
  });

  // Step 3: Determine baseline carbon storage
  let cBaselineTCO2e = 0;

  switch (baselineType) {
    case 'NEW_BUILT':
      // New facility: no baseline carbon storage
      cBaselineTCO2e = 0;
      break;

    case 'RETROFIT_FACILITY':
      // Retrofit: baseline is zero (existing emissions, not storage)
      cBaselineTCO2e = 0;
      break;

    case 'CHARCOAL_REPURPOSE':
      // Repurposed charcoal kiln: baseline is previous charcoal production
      // This is subtracted because charcoal was already sequestering carbon
      cBaselineTCO2e = baselineCarbonStorageTCO2e;
      break;

    default:
      cBaselineTCO2e = 0;
  }

  // Step 4: Calculate persistence fraction and C_loss (Equations 6.3, 6.4)
  const persistenceFractionPercent = calculatePersistenceFraction({
    hCorgRatio,
    meanSoilTempC,
  });

  const cLossTCO2e = calculateCLoss(cStoredTCO2e, persistenceFractionPercent);

  // Step 5: Calculate E_project (Equation 7.1)
  const eProjectTCO2e = calculateEProject(projectEmissions);

  // Step 6: Calculate E_leakage (Equation 8.1)
  const eLeakageTCO2e = calculateELeakage(leakageEmissions);

  // Step 7: Calculate net CORCs (Equation 5.1)
  // CORCs = C_stored − C_baseline − C_loss − E_project − E_leakage
  const netCORCsTCO2e =
    cStoredTCO2e - cBaselineTCO2e - cLossTCO2e - eProjectTCO2e - eLeakageTCO2e;

  // Get detailed breakdowns for reporting
  const projectBreakdown = getEProjectBreakdown(projectEmissions);
  const leakageBreakdown = getELeakageBreakdown(leakageEmissions);

  return {
    // Inputs processed
    hCorgRatio,
    qualityValid,

    // Formula components
    cStoredTCO2e,
    cBaselineTCO2e,
    cLossTCO2e,
    persistenceFractionPercent,
    eProjectTCO2e,
    eLeakageTCO2e,

    // Result
    netCORCsTCO2e: Math.max(0, netCORCsTCO2e), // CORCs cannot be negative

    // Metadata
    permanenceType: 'BC200+',
    calculationVersion: CALCULATION_VERSION,

    // Detailed breakdown
    breakdown: {
      biomassEmissionsTCO2e: projectBreakdown.biomassEmissionsKgCO2e / 1000,
      productionEmissionsTCO2e: projectBreakdown.productionEmissionsAllocatedKgCO2e / 1000,
      embodiedEmissionsTCO2e: projectBreakdown.embodiedEmissionsKgCO2e / 1000,
      endUseEmissionsTCO2e: projectBreakdown.endUseEmissionsKgCO2e / 1000,
      ecologicalLeakageTCO2e: leakageBreakdown.ecologicalLeakageKgCO2e / 1000,
      marketLeakageTCO2e: leakageBreakdown.marketActivityLeakageKgCO2e / 1000,
    },
  };
}

/**
 * Full CORC calculation with detailed breakdown
 *
 * @param input - Full CORC calculation input
 * @returns Extended result with all intermediate calculations
 */
export function getCORCCalculationBreakdown(input: CORCCalculationInput): {
  result: CORCCalculationResult;
  cStoredBreakdown: ReturnType<typeof getCStoredBreakdown>;
  persistenceBreakdown: ReturnType<typeof getPersistenceBreakdown>;
  projectEmissionsBreakdown: ReturnType<typeof getEProjectBreakdown>;
  leakageBreakdown: ReturnType<typeof getELeakageBreakdown>;
  formulaSteps: {
    step: string;
    formula: string;
    value: number;
    unit: string;
  }[];
} {
  const result = calculateCORCs(input);

  const cStoredBreakdown = getCStoredBreakdown({
    biocharDryMassTonnes: input.biocharDryMassTonnes,
    organicCarbonPercent: input.organicCarbonPercent,
  });

  const persistenceBreakdown = getPersistenceBreakdown(
    { hCorgRatio: result.hCorgRatio, meanSoilTempC: input.meanSoilTempC },
    result.cStoredTCO2e
  );

  const projectEmissionsBreakdown = getEProjectBreakdown(input.projectEmissions);
  const leakageBreakdown = getELeakageBreakdown(input.leakageEmissions);

  // Generate step-by-step formula breakdown
  const formulaSteps = [
    {
      step: '1. Calculate H/C_org ratio',
      formula: 'H/C_org = (m_H / m_C_org) × 12.0',
      value: result.hCorgRatio,
      unit: 'molar ratio',
    },
    {
      step: '2. Calculate C_stored',
      formula: 'C_stored = Q_biochar × C_org × (44/12)',
      value: result.cStoredTCO2e,
      unit: 'tCO2e',
    },
    {
      step: '3. Determine C_baseline',
      formula: `Baseline type: ${input.baselineType}`,
      value: result.cBaselineTCO2e,
      unit: 'tCO2e',
    },
    {
      step: '4. Calculate Persistence Fraction',
      formula: 'PF = M - a × H/C_org',
      value: result.persistenceFractionPercent,
      unit: '%',
    },
    {
      step: '5. Calculate C_loss',
      formula: 'C_loss = C_stored × (100 - PF) / 100',
      value: result.cLossTCO2e,
      unit: 'tCO2e',
    },
    {
      step: '6. Calculate E_project',
      formula: 'E_project = E_biomass + E_production + E_use + E_emb',
      value: result.eProjectTCO2e,
      unit: 'tCO2e',
    },
    {
      step: '7. Calculate E_leakage',
      formula: 'E_leakage = L_ECO + L_MA',
      value: result.eLeakageTCO2e,
      unit: 'tCO2e',
    },
    {
      step: '8. Calculate Net CORCs',
      formula: 'CORCs = C_stored - C_baseline - C_loss - E_project - E_leakage',
      value: result.netCORCsTCO2e,
      unit: 'tCO2e',
    },
  ];

  return {
    result,
    cStoredBreakdown,
    persistenceBreakdown,
    projectEmissionsBreakdown,
    leakageBreakdown,
    formulaSteps,
  };
}

/**
 * Quick estimate of CORCs without full LCA data
 *
 * Useful for preliminary estimates using default emission factors.
 * Uses conservative assumptions for emissions.
 *
 * @param biocharDryMassTonnes - Dry mass of biochar (tonnes)
 * @param organicCarbonPercent - Organic carbon content (%)
 * @param hydrogenPercent - Hydrogen content (%)
 * @param meanSoilTempC - Mean soil temperature at end-use location (°C)
 * @returns Estimated net CORCs
 */
export function estimateCORCs(
  biocharDryMassTonnes: number,
  organicCarbonPercent: number,
  hydrogenPercent: number,
  meanSoilTempC: number
): {
  estimatedCORCsTCO2e: number;
  cStoredTCO2e: number;
  cLossTCO2e: number;
  estimatedEmissionsTCO2e: number;
  note: string;
} {
  // Calculate H/C_org ratio
  const hCorgRatio = calculateHCorgRatio({
    hydrogenPercent,
    organicCarbonPercent,
  });

  // Calculate C_stored
  const cStoredTCO2e = calculateCStored({
    biocharDryMassTonnes,
    organicCarbonPercent,
  });

  // Calculate persistence and loss
  const persistenceFractionPercent = calculatePersistenceFraction({
    hCorgRatio,
    meanSoilTempC,
  });

  const cLossTCO2e = calculateCLoss(cStoredTCO2e, persistenceFractionPercent);

  // Conservative emission estimate: 15-20% of C_stored is typical
  // Using 20% as conservative estimate
  const estimatedEmissionsTCO2e = cStoredTCO2e * 0.20;

  // Estimate net CORCs
  const estimatedCORCsTCO2e = Math.max(
    0,
    cStoredTCO2e - cLossTCO2e - estimatedEmissionsTCO2e
  );

  return {
    estimatedCORCsTCO2e,
    cStoredTCO2e,
    cLossTCO2e,
    estimatedEmissionsTCO2e,
    note:
      'This is an estimate using conservative emission assumptions (20% of C_stored). ' +
      'Full LCA calculation required for actual CORC issuance.',
  };
}

/**
 * Validate CORC calculation input
 *
 * @param input - CORC calculation input
 * @returns Validation result with any errors
 */
export function validateCORCInput(input: CORCCalculationInput): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate biochar mass
  if (input.biocharDryMassTonnes <= 0) {
    errors.push('Biochar dry mass must be greater than 0');
  }

  // Validate organic carbon
  if (input.organicCarbonPercent <= 0 || input.organicCarbonPercent > 100) {
    errors.push('Organic carbon percent must be between 0 and 100');
  }

  // Validate hydrogen
  if (input.hydrogenPercent < 0 || input.hydrogenPercent > 100) {
    errors.push('Hydrogen percent must be between 0 and 100');
  }

  // Validate H/C_org ratio
  try {
    const hCorgRatio = calculateHCorgRatio({
      hydrogenPercent: input.hydrogenPercent,
      organicCarbonPercent: input.organicCarbonPercent,
    });

    if (hCorgRatio > 0.7) {
      errors.push(
        `H/C_org ratio (${hCorgRatio.toFixed(3)}) exceeds 0.7 threshold. Biochar is not eligible for CORCs.`
      );
    } else if (hCorgRatio > 0.6) {
      warnings.push(
        `H/C_org ratio (${hCorgRatio.toFixed(3)}) is close to 0.7 threshold. Consider optimizing pyrolysis conditions.`
      );
    }
  } catch {
    errors.push('Unable to calculate H/C_org ratio');
  }

  // Validate soil temperature
  if (input.meanSoilTempC < 7) {
    warnings.push(
      `Soil temperature (${input.meanSoilTempC}°C) is below model range (7-40°C). Using 7°C for calculation.`
    );
  } else if (input.meanSoilTempC > 40) {
    warnings.push(
      `Soil temperature (${input.meanSoilTempC}°C) is above model range (7-40°C). Using 40°C for calculation.`
    );
  }

  // Validate baseline type
  const validBaselineTypes = ['NEW_BUILT', 'RETROFIT_FACILITY', 'CHARCOAL_REPURPOSE'];
  if (!validBaselineTypes.includes(input.baselineType)) {
    errors.push(`Invalid baseline type: ${input.baselineType}`);
  }

  // Validate charcoal repurpose baseline
  if (
    input.baselineType === 'CHARCOAL_REPURPOSE' &&
    (!input.baselineCarbonStorageTCO2e || input.baselineCarbonStorageTCO2e <= 0)
  ) {
    warnings.push(
      'Charcoal repurpose baseline type requires baseline carbon storage value'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate carbon efficiency metrics
 *
 * @param input - CORC calculation input
 * @param result - CORC calculation result
 * @returns Efficiency metrics
 */
export function calculateEfficiencyMetrics(
  input: CORCCalculationInput,
  result: CORCCalculationResult
): {
  carbonEfficiencyPercent: number;
  emissionIntensityTCO2ePerTonneBiochar: number;
  netCORCsPerTonneBiochar: number;
  grossToNetRatioPercent: number;
} {
  const carbonEfficiencyPercent =
    (result.netCORCsTCO2e / result.cStoredTCO2e) * 100;

  const emissionIntensityTCO2ePerTonneBiochar =
    (result.eProjectTCO2e + result.eLeakageTCO2e) / input.biocharDryMassTonnes;

  const netCORCsPerTonneBiochar =
    result.netCORCsTCO2e / input.biocharDryMassTonnes;

  const totalDeductions =
    result.cBaselineTCO2e +
    result.cLossTCO2e +
    result.eProjectTCO2e +
    result.eLeakageTCO2e;

  const grossToNetRatioPercent =
    ((result.cStoredTCO2e - totalDeductions) / result.cStoredTCO2e) * 100;

  return {
    carbonEfficiencyPercent,
    emissionIntensityTCO2ePerTonneBiochar,
    netCORCsPerTonneBiochar,
    grossToNetRatioPercent: Math.max(0, grossToNetRatioPercent),
  };
}
