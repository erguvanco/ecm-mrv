/**
 * Carbon Stored Calculation
 * Puro.earth Biochar Methodology - Section 6.1 & Equation 6.1
 */

import { CO2_TO_C_RATIO } from './constants';
import type { CStoredInput } from './types';

/**
 * Calculate gross carbon stored in biochar (C_stored)
 *
 * This represents the total CO2-equivalent carbon content in the biochar
 * before accounting for any losses due to decomposition.
 *
 * Equation 6.1: C_stored = Q_biochar × C_org × (44/12)
 *
 * Where:
 * - Q_biochar: Dry mass of biochar produced (tonnes)
 * - C_org: Organic carbon content (as decimal, e.g., 0.75 for 75%)
 * - 44/12: CO2/C molar mass ratio (converts C to CO2 equivalent)
 *
 * @param input - Biochar dry mass and organic carbon percentage
 * @returns Carbon stored in tonnes CO2e
 */
export function calculateCStored(input: CStoredInput): number {
  const { biocharDryMassTonnes, organicCarbonPercent } = input;

  if (biocharDryMassTonnes < 0) {
    throw new Error('Biochar dry mass cannot be negative');
  }

  if (organicCarbonPercent < 0 || organicCarbonPercent > 100) {
    throw new Error('Organic carbon percent must be between 0 and 100');
  }

  // Convert percentage to decimal
  const carbonFraction = organicCarbonPercent / 100;

  // Equation 6.1: C_stored = Q_biochar × C_org × (44/12)
  // Result is in tonnes CO2e
  const cStored = biocharDryMassTonnes * carbonFraction * CO2_TO_C_RATIO;

  return cStored;
}

/**
 * Calculate carbon mass in biochar (without CO2 conversion)
 *
 * @param biocharDryMassTonnes - Dry mass of biochar (tonnes)
 * @param organicCarbonPercent - Organic carbon content (%)
 * @returns Carbon mass in tonnes C
 */
export function calculateCarbonMass(
  biocharDryMassTonnes: number,
  organicCarbonPercent: number
): number {
  return biocharDryMassTonnes * (organicCarbonPercent / 100);
}

/**
 * Calculate dry mass from wet mass and moisture content
 *
 * @param wetMassTonnes - Wet mass of biochar (tonnes)
 * @param moisturePercent - Moisture content (%)
 * @returns Dry mass in tonnes
 */
export function calculateDryMass(
  wetMassTonnes: number,
  moisturePercent: number
): number {
  if (moisturePercent < 0 || moisturePercent >= 100) {
    throw new Error('Moisture percent must be between 0 and 100');
  }

  // Dry mass = Wet mass × (1 - moisture fraction)
  return wetMassTonnes * (1 - moisturePercent / 100);
}

/**
 * Breakdown of C_stored calculation for transparency
 *
 * @param input - Biochar dry mass and organic carbon percentage
 * @returns Detailed breakdown of the calculation
 */
export function getCStoredBreakdown(input: CStoredInput): {
  biocharDryMassTonnes: number;
  organicCarbonPercent: number;
  carbonFraction: number;
  carbonMassTonnes: number;
  co2ToCRatio: number;
  cStoredTCO2e: number;
} {
  const { biocharDryMassTonnes, organicCarbonPercent } = input;
  const carbonFraction = organicCarbonPercent / 100;
  const carbonMassTonnes = biocharDryMassTonnes * carbonFraction;
  const cStoredTCO2e = carbonMassTonnes * CO2_TO_C_RATIO;

  return {
    biocharDryMassTonnes,
    organicCarbonPercent,
    carbonFraction,
    carbonMassTonnes,
    co2ToCRatio: CO2_TO_C_RATIO,
    cStoredTCO2e,
  };
}
