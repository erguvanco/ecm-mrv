import { z } from 'zod';

/**
 * Biochar Lab Test Validation Schema
 * Based on Puro.earth Biochar Methodology Section 3.5 & Equation 6.5
 */

export const CARBON_ANALYSIS_METHODS = [
  { value: 'ISO_16948', label: 'ISO 16948 (Elemental analysis)' },
  { value: 'DIN_51732', label: 'DIN 51732 (C, H, N analysis)' },
  { value: 'ASTM_E870', label: 'ASTM E870 (Proximate analysis)' },
  { value: 'EBC_2022', label: 'EBC-IBI 2022 (Biochar analysis)' },
  { value: 'OTHER', label: 'Other (specify in notes)' },
] as const;

// H/C_org threshold from Puro methodology (Section 3.5)
const H_C_ORG_THRESHOLD = 0.7;

export const biocharLabTestSchema = z.object({
  id: z.string().uuid().optional(),
  productionBatchId: z.string().uuid(),

  // Test metadata
  testDate: z.coerce.date(),
  labName: z.string().min(1, 'Lab name is required'),
  labAccreditation: z.string().optional().nullable(),

  // Carbon analysis (required for CORC calculation)
  totalCarbonPercent: z.coerce.number()
    .min(0, 'Total carbon cannot be negative')
    .max(100, 'Total carbon cannot exceed 100%'),
  inorganicCarbonPercent: z.coerce.number()
    .min(0, 'Inorganic carbon cannot be negative')
    .max(100, 'Inorganic carbon cannot exceed 100%')
    .default(0),
  hydrogenPercent: z.coerce.number()
    .min(0, 'Hydrogen cannot be negative')
    .max(15, 'Hydrogen content seems too high (>15%)'),

  // Analytical method
  carbonMethod: z.string().optional().nullable(),

  // Moisture
  moisturePercent: z.coerce.number()
    .min(0, 'Moisture cannot be negative')
    .max(100, 'Moisture cannot exceed 100%')
    .optional()
    .nullable(),

  // Evidence file reference
  reportFileId: z.string().uuid().optional().nullable(),
});

// Calculate organic carbon and H/C_org ratio with validation
const labTestRefinement = (data: z.infer<typeof biocharLabTestSchema>, ctx: z.RefinementCtx) => {
  // Organic carbon = Total carbon - Inorganic carbon
  const organicCarbonPercent = data.totalCarbonPercent - data.inorganicCarbonPercent;

  if (organicCarbonPercent <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Organic carbon must be positive (inorganic carbon exceeds total carbon)',
      path: ['inorganicCarbonPercent'],
    });
    return;
  }

  // Calculate H/C_org ratio (Equation 6.5)
  // H/C_org = (m_H / m_C_org) × 12.0
  const hCorgRatio = (data.hydrogenPercent / organicCarbonPercent) * 12.0;

  if (hCorgRatio > H_C_ORG_THRESHOLD) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `H/C_org ratio (${hCorgRatio.toFixed(3)}) exceeds threshold of ${H_C_ORG_THRESHOLD}. Biochar is not eligible for CORC issuance.`,
      path: ['hydrogenPercent'],
    });
  }

  // Warning if close to threshold
  if (hCorgRatio > 0.6 && hCorgRatio <= H_C_ORG_THRESHOLD) {
    // This is a warning, not an error - could add to a warnings array if needed
  }
};

export const biocharLabTestWithRefinementSchema = biocharLabTestSchema.superRefine(labTestRefinement);

export const createLabTestSchema = biocharLabTestSchema.omit({ id: true }).superRefine(labTestRefinement);

export const updateLabTestSchema = biocharLabTestSchema.partial().required({ id: true });

export type LabTestInput = z.infer<typeof createLabTestSchema>;
export type LabTestUpdate = z.infer<typeof updateLabTestSchema>;

/**
 * Calculate derived values from lab test data
 */
export function calculateLabTestDerivedValues(data: {
  totalCarbonPercent: number;
  inorganicCarbonPercent: number;
  hydrogenPercent: number;
}): {
  organicCarbonPercent: number;
  hCorgRatio: number;
  passesQualityThreshold: boolean;
  qualityClassification: string;
} {
  const organicCarbonPercent = data.totalCarbonPercent - data.inorganicCarbonPercent;
  const hCorgRatio = (data.hydrogenPercent / organicCarbonPercent) * 12.0;
  const passesQualityThreshold = hCorgRatio <= H_C_ORG_THRESHOLD;

  let qualityClassification: string;
  if (hCorgRatio <= 0.4) {
    qualityClassification = 'Excellent - High stability';
  } else if (hCorgRatio <= 0.5) {
    qualityClassification = 'Very Good - Good stability';
  } else if (hCorgRatio <= 0.6) {
    qualityClassification = 'Good - Moderate stability';
  } else if (hCorgRatio <= 0.7) {
    qualityClassification = 'Acceptable - Minimum stability';
  } else {
    qualityClassification = 'Ineligible - Below threshold';
  }

  return {
    organicCarbonPercent,
    hCorgRatio,
    passesQualityThreshold,
    qualityClassification,
  };
}
