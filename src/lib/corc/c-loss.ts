/**
 * Carbon Loss Calculation (BC+200 Persistence Model)
 * Puro.earth Biochar Methodology - Section 6.2, Equations 6.3 & 6.4
 */

import { PERSISTENCE_PARAMS, H_C_ORG_THRESHOLD } from './constants';
import type { PersistenceInput } from './types';

/**
 * Calculate persistence fraction (PF) using BC+200 model
 *
 * The persistence fraction represents the percentage of biochar carbon
 * that will remain stable over a 200-year timeframe, based on the
 * biochar's H/C_org ratio and the mean annual soil temperature.
 *
 * Equation 6.4: PF = M - a × H/C_org
 *
 * Where:
 * - M: Intercept coefficient (from Table 6.1, based on temperature)
 * - a: Slope coefficient (from Table 6.1, based on temperature)
 * - H/C_org: Molar ratio of hydrogen to organic carbon
 *
 * @param input - H/C_org ratio and mean soil temperature
 * @returns Persistence fraction (%)
 */
export function calculatePersistenceFraction(input: PersistenceInput): number {
  const { hCorgRatio, meanSoilTempC } = input;

  // Validate H/C_org ratio
  if (hCorgRatio > H_C_ORG_THRESHOLD) {
    throw new Error(
      `H/C_org ratio (${hCorgRatio.toFixed(3)}) exceeds threshold of ${H_C_ORG_THRESHOLD}. Biochar is not eligible.`
    );
  }

  if (hCorgRatio < 0) {
    throw new Error('H/C_org ratio cannot be negative');
  }

  // Clamp temperature to valid range (7-40°C)
  const clampedTemp = Math.max(7, Math.min(40, Math.round(meanSoilTempC)));

  // Get persistence parameters for this temperature
  const params = PERSISTENCE_PARAMS[clampedTemp];
  if (!params) {
    throw new Error(`No persistence parameters for temperature ${clampedTemp}°C`);
  }

  // Equation 6.4: PF = M - a × H/C_org
  const persistenceFraction = params.M - params.a * hCorgRatio;

  // Clamp result to 0-100% range
  return Math.max(0, Math.min(100, persistenceFraction));
}

/**
 * Calculate carbon loss due to decomposition
 *
 * Carbon loss represents the portion of stored carbon that will
 * decompose over the 200-year crediting period.
 *
 * Equation 6.3: C_loss = C_stored × (100 - PF) / 100
 *
 * @param cStoredTCO2e - Gross carbon stored (tCO2e)
 * @param persistenceFractionPercent - Persistence fraction (%)
 * @returns Carbon loss in tonnes CO2e
 */
export function calculateCLoss(
  cStoredTCO2e: number,
  persistenceFractionPercent: number
): number {
  if (cStoredTCO2e < 0) {
    throw new Error('C_stored cannot be negative');
  }

  if (persistenceFractionPercent < 0 || persistenceFractionPercent > 100) {
    throw new Error('Persistence fraction must be between 0 and 100');
  }

  // Equation 6.3: C_loss = C_stored × (100 - PF) / 100
  const lossPercent = 100 - persistenceFractionPercent;
  const cLoss = cStoredTCO2e * (lossPercent / 100);

  return cLoss;
}

/**
 * Calculate permanent carbon (carbon that will remain after 200 years)
 *
 * @param cStoredTCO2e - Gross carbon stored (tCO2e)
 * @param persistenceFractionPercent - Persistence fraction (%)
 * @returns Permanent carbon in tonnes CO2e
 */
export function calculatePermanentCarbon(
  cStoredTCO2e: number,
  persistenceFractionPercent: number
): number {
  return cStoredTCO2e * (persistenceFractionPercent / 100);
}

/**
 * Get persistence parameters for a given temperature
 *
 * @param meanSoilTempC - Mean annual soil temperature (°C)
 * @returns Persistence parameters { M, a }
 */
export function getPersistenceParams(meanSoilTempC: number): { M: number; a: number; tempUsed: number } {
  const clampedTemp = Math.max(7, Math.min(40, Math.round(meanSoilTempC)));
  const params = PERSISTENCE_PARAMS[clampedTemp];

  return {
    ...params,
    tempUsed: clampedTemp,
  };
}

/**
 * Detailed persistence calculation breakdown
 *
 * @param input - H/C_org ratio and mean soil temperature
 * @param cStoredTCO2e - Gross carbon stored (tCO2e)
 * @returns Detailed breakdown
 */
export function getPersistenceBreakdown(
  input: PersistenceInput,
  cStoredTCO2e: number
): {
  hCorgRatio: number;
  meanSoilTempC: number;
  tempUsed: number;
  M: number;
  a: number;
  persistenceFractionPercent: number;
  lossPercent: number;
  cStoredTCO2e: number;
  cLossTCO2e: number;
  permanentCarbonTCO2e: number;
} {
  const { hCorgRatio, meanSoilTempC } = input;
  const { M, a, tempUsed } = getPersistenceParams(meanSoilTempC);
  const persistenceFractionPercent = calculatePersistenceFraction(input);
  const lossPercent = 100 - persistenceFractionPercent;
  const cLossTCO2e = calculateCLoss(cStoredTCO2e, persistenceFractionPercent);
  const permanentCarbonTCO2e = calculatePermanentCarbon(cStoredTCO2e, persistenceFractionPercent);

  return {
    hCorgRatio,
    meanSoilTempC,
    tempUsed,
    M,
    a,
    persistenceFractionPercent,
    lossPercent,
    cStoredTCO2e,
    cLossTCO2e,
    permanentCarbonTCO2e,
  };
}

/**
 * Estimate persistence for a range of H/C_org values at a given temperature
 * Useful for sensitivity analysis
 *
 * @param meanSoilTempC - Mean annual soil temperature (°C)
 * @param hCorgValues - Array of H/C_org ratios to evaluate
 * @returns Array of { hCorgRatio, persistenceFraction } objects
 */
export function estimatePersistenceRange(
  meanSoilTempC: number,
  hCorgValues: number[] = [0.3, 0.4, 0.5, 0.6, 0.7]
): Array<{ hCorgRatio: number; persistenceFractionPercent: number }> {
  return hCorgValues.map((hCorgRatio) => ({
    hCorgRatio,
    persistenceFractionPercent: calculatePersistenceFraction({
      hCorgRatio,
      meanSoilTempC,
    }),
  }));
}
