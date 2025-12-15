import { z } from 'zod';

/**
 * Leakage Assessment Validation Schema
 * Based on Puro.earth Biochar Methodology Section 8
 */

export const LEAKAGE_STATUS = [
  { value: 'MITIGATED', label: 'Mitigated', description: 'Leakage risk mitigated through project design' },
  { value: 'QUANTIFIED', label: 'Quantified', description: 'Leakage quantified and included in calculation' },
  { value: 'NOT_APPLICABLE', label: 'Not Applicable', description: 'This leakage category does not apply' },
] as const;

export const leakageAssessmentSchema = z.object({
  id: z.string().uuid().optional(),
  facilityId: z.string().uuid(),
  monitoringPeriodId: z.string().uuid().optional().nullable(),
  assessmentDate: z.coerce.date(),

  // Ecological leakage (L_ECO) - Section 8.3
  facilityEcologicalStatus: z.enum(['MITIGATED', 'QUANTIFIED', 'NOT_APPLICABLE']).default('MITIGATED'),
  facilityEcologicalKgCO2e: z.coerce.number().nonnegative().default(0),
  biomassEcologicalStatus: z.enum(['MITIGATED', 'QUANTIFIED', 'NOT_APPLICABLE']).default('MITIGATED'),
  biomassEcologicalKgCO2e: z.coerce.number().nonnegative().default(0),

  // Market/activity shifting leakage (L_MA) - Section 8.4
  afoluLeakageStatus: z.enum(['MITIGATED', 'QUANTIFIED', 'NOT_APPLICABLE']).default('MITIGATED'),
  afoluLeakageKgCO2e: z.coerce.number().nonnegative().default(0),
  energyMaterialLeakageStatus: z.enum(['MITIGATED', 'QUANTIFIED', 'NOT_APPLICABLE']).default('NOT_APPLICABLE'),
  energyMaterialLeakageKgCO2e: z.coerce.number().nonnegative().default(0),

  // iLUC contribution - Section 8.6
  ilucContributionKgCO2e: z.coerce.number().nonnegative().default(0),

  // Total (calculated)
  totalLeakageKgCO2e: z.coerce.number().nonnegative().default(0),

  notes: z.string().optional().nullable(),
});

// Refinement for leakage assessment validation
const leakageRefinement = (data: z.infer<typeof leakageAssessmentSchema>, ctx: z.RefinementCtx) => {
  // Validate that quantified leakages have non-negative values
  // Note: A quantified value of 0 is valid (leakage was assessed and found to be zero)
  // Only reject negative values (which shouldn't be possible with nonnegative() but check anyway)
  if (data.facilityEcologicalStatus === 'QUANTIFIED' && data.facilityEcologicalKgCO2e < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Facility ecological leakage cannot be negative',
      path: ['facilityEcologicalKgCO2e'],
    });
  }

  if (data.biomassEcologicalStatus === 'QUANTIFIED' && data.biomassEcologicalKgCO2e < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Biomass ecological leakage cannot be negative',
      path: ['biomassEcologicalKgCO2e'],
    });
  }

  if (data.afoluLeakageStatus === 'QUANTIFIED' && data.afoluLeakageKgCO2e < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'AFOLU leakage cannot be negative',
      path: ['afoluLeakageKgCO2e'],
    });
  }

  if (data.energyMaterialLeakageStatus === 'QUANTIFIED' && data.energyMaterialLeakageKgCO2e < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Energy/material leakage cannot be negative',
      path: ['energyMaterialLeakageKgCO2e'],
    });
  }

  // Verify total matches sum of components
  const expectedTotal =
    data.facilityEcologicalKgCO2e +
    data.biomassEcologicalKgCO2e +
    data.afoluLeakageKgCO2e +
    data.energyMaterialLeakageKgCO2e +
    data.ilucContributionKgCO2e;

  if (Math.abs(expectedTotal - data.totalLeakageKgCO2e) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total leakage (${data.totalLeakageKgCO2e}) doesn't match sum of components (${expectedTotal.toFixed(2)})`,
      path: ['totalLeakageKgCO2e'],
    });
  }
};

export const leakageAssessmentWithRefinementSchema = leakageAssessmentSchema.superRefine(leakageRefinement);

export const createLeakageAssessmentSchema = leakageAssessmentSchema.omit({ id: true }).superRefine(leakageRefinement);

export const updateLeakageAssessmentSchema = leakageAssessmentSchema.partial().required({ id: true });

export type LeakageAssessmentInput = z.infer<typeof createLeakageAssessmentSchema>;
export type LeakageAssessmentUpdate = z.infer<typeof updateLeakageAssessmentSchema>;

/**
 * Calculate total leakage from assessment data
 */
export function calculateTotalLeakage(data: {
  facilityEcologicalKgCO2e: number;
  biomassEcologicalKgCO2e: number;
  afoluLeakageKgCO2e: number;
  energyMaterialLeakageKgCO2e: number;
  ilucContributionKgCO2e: number;
}): number {
  return (
    data.facilityEcologicalKgCO2e +
    data.biomassEcologicalKgCO2e +
    data.afoluLeakageKgCO2e +
    data.energyMaterialLeakageKgCO2e +
    data.ilucContributionKgCO2e
  );
}

/**
 * Create default leakage assessment with all mitigated
 */
export function createDefaultLeakageAssessment(facilityId: string): Omit<LeakageAssessmentInput, 'assessmentDate'> {
  return {
    facilityId,
    facilityEcologicalStatus: 'MITIGATED',
    facilityEcologicalKgCO2e: 0,
    biomassEcologicalStatus: 'MITIGATED',
    biomassEcologicalKgCO2e: 0,
    afoluLeakageStatus: 'MITIGATED',
    afoluLeakageKgCO2e: 0,
    energyMaterialLeakageStatus: 'NOT_APPLICABLE',
    energyMaterialLeakageKgCO2e: 0,
    ilucContributionKgCO2e: 0,
    totalLeakageKgCO2e: 0,
  };
}
