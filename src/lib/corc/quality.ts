/**
 * Biochar Quality Calculations
 * Puro.earth Biochar Methodology - Section 3.5 & Equation 6.5
 */

import { H_C_ORG_THRESHOLD } from './constants';
import type { HCorgInput, QualityValidationResult } from './types';

/**
 * Calculate H/C_org molar ratio (Equation 6.5)
 *
 * The H/C_org ratio is a key indicator of biochar quality and stability.
 * It represents the degree of carbonization - lower values indicate
 * more complete carbonization and higher stability.
 *
 * Formula: H/C_org = (m_H / m_C_org) × 12.0
 *
 * Where:
 * - m_H: Mass content of hydrogen (%)
 * - m_C_org: Mass content of organic carbon (%)
 * - 12.0: Factor to convert mass ratio to molar ratio
 *
 * @param input - Hydrogen and organic carbon percentages
 * @returns H/C_org molar ratio
 */
export function calculateHCorgRatio(input: HCorgInput): number {
  const { hydrogenPercent, organicCarbonPercent } = input;

  if (organicCarbonPercent <= 0) {
    throw new Error('Organic carbon percent must be greater than 0');
  }

  if (hydrogenPercent < 0) {
    throw new Error('Hydrogen percent cannot be negative');
  }

  // Equation 6.5: H/C_org = (m_H / m_C_org) × 12.0
  // The factor 12.0 converts from mass ratio to molar ratio
  // (Atomic mass of C = 12, Atomic mass of H = 1)
  const hCorgRatio = (hydrogenPercent / organicCarbonPercent) * 12.0;

  return hCorgRatio;
}

/**
 * Validate biochar quality against Puro methodology threshold
 *
 * Per Section 3.5, biochar must have H/C_org <= 0.7 to be eligible
 * for CORC issuance. This threshold ensures sufficient carbonization
 * and long-term stability.
 *
 * @param hCorgRatio - Calculated H/C_org molar ratio
 * @returns true if biochar passes quality threshold
 */
export function validateBiocharQuality(hCorgRatio: number): boolean {
  return hCorgRatio <= H_C_ORG_THRESHOLD;
}

/**
 * Full quality validation with detailed result
 *
 * @param input - Hydrogen and organic carbon percentages
 * @returns Detailed validation result
 */
export function validateQuality(input: HCorgInput): QualityValidationResult {
  const hCorgRatio = calculateHCorgRatio(input);
  const isValid = validateBiocharQuality(hCorgRatio);

  return {
    hCorgRatio,
    isValid,
    threshold: H_C_ORG_THRESHOLD,
    message: isValid
      ? `Biochar passes quality threshold (H/C_org = ${hCorgRatio.toFixed(3)} <= ${H_C_ORG_THRESHOLD})`
      : `Biochar fails quality threshold (H/C_org = ${hCorgRatio.toFixed(3)} > ${H_C_ORG_THRESHOLD}). Biochar must have H/C_org <= 0.7 for CORC eligibility.`,
  };
}

/**
 * Calculate organic carbon from total carbon and inorganic carbon
 *
 * C_org = C_tot - C_inorg
 *
 * @param totalCarbonPercent - Total carbon content (%)
 * @param inorganicCarbonPercent - Inorganic carbon content (%), default 0
 * @returns Organic carbon content (%)
 */
export function calculateOrganicCarbon(
  totalCarbonPercent: number,
  inorganicCarbonPercent: number = 0
): number {
  const organicCarbon = totalCarbonPercent - inorganicCarbonPercent;

  if (organicCarbon < 0) {
    throw new Error('Organic carbon cannot be negative (inorganic > total)');
  }

  return organicCarbon;
}

/**
 * Get quality classification based on H/C_org ratio
 *
 * @param hCorgRatio - H/C_org molar ratio
 * @returns Quality classification string
 */
export function getQualityClassification(hCorgRatio: number): string {
  if (hCorgRatio <= 0.4) {
    return 'Excellent - High stability (H/C_org <= 0.4)';
  } else if (hCorgRatio <= 0.5) {
    return 'Very Good - Good stability (H/C_org <= 0.5)';
  } else if (hCorgRatio <= 0.6) {
    return 'Good - Moderate stability (H/C_org <= 0.6)';
  } else if (hCorgRatio <= 0.7) {
    return 'Acceptable - Minimum stability (H/C_org <= 0.7)';
  } else {
    return 'Ineligible - Below threshold (H/C_org > 0.7)';
  }
}
