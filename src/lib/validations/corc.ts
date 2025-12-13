import { z } from 'zod';

/**
 * CORC Issuance Validation Schema
 * Based on Puro.earth Biochar Methodology Equation 5.1
 */

export const CORC_STATUS = [
  { value: 'draft', label: 'Draft', description: 'CORC calculation completed but not yet issued' },
  { value: 'issued', label: 'Issued', description: 'CORC officially issued and registered' },
  { value: 'retired', label: 'Retired', description: 'CORC retired for offset claim' },
] as const;

export const PERMANENCE_TYPES = [
  { value: 'BC100+', label: 'BC+100', description: '100-year permanence claim' },
  { value: 'BC200+', label: 'BC+200', description: '200-year permanence claim (default)' },
] as const;

export const corcIssuanceSchema = z.object({
  id: z.string().uuid().optional(),
  serialNumber: z.string().min(1, 'Serial number is required'),
  monitoringPeriodId: z.string().uuid(),

  // CORC calculation breakdown (in tCO2e)
  cStoredTCO2e: z.coerce.number().nonnegative('C_stored cannot be negative'),
  cBaselineTCO2e: z.coerce.number().nonnegative('C_baseline cannot be negative').default(0),
  cLossTCO2e: z.coerce.number().nonnegative('C_loss cannot be negative'),
  persistenceFractionPercent: z.coerce.number().min(0).max(100),
  eProjectTCO2e: z.coerce.number().nonnegative('E_project cannot be negative'),
  eLeakageTCO2e: z.coerce.number().nonnegative('E_leakage cannot be negative').default(0),
  netCORCsTCO2e: z.coerce.number(), // Can be negative if emissions exceed storage

  // Permanence type
  permanenceType: z.enum(['BC100+', 'BC200+']).default('BC200+'),

  // Status
  status: z.enum(['draft', 'issued', 'retired']).default('draft'),
  issuanceDate: z.coerce.date().optional().nullable(),

  // Ownership
  ownerName: z.string().optional().nullable(),
  ownerAccountId: z.string().optional().nullable(),

  // Retirement
  retirementDate: z.coerce.date().optional().nullable(),
  retirementBeneficiary: z.string().optional().nullable(),

  notes: z.string().optional().nullable(),
});

// Refinement for CORC validation
const corcRefinement = (data: z.infer<typeof corcIssuanceSchema>, ctx: z.RefinementCtx) => {
  // Net CORCs should match the formula
  // Formula: CORCs = C_stored − C_baseline − C_loss − E_project − E_leakage
  const expectedNet = data.cStoredTCO2e - data.cBaselineTCO2e - data.cLossTCO2e - data.eProjectTCO2e - data.eLeakageTCO2e;
  const tolerance = 0.001; // Allow small floating point differences

  // The calculator clamps negative values to 0, so we need to account for that
  // Valid cases:
  // 1. expectedNet >= 0 and netCORCsTCO2e matches expectedNet (within tolerance)
  // 2. expectedNet < 0 and netCORCsTCO2e is 0 (clamped to zero)
  const expectedNetClamped = Math.max(0, expectedNet);

  if (Math.abs(expectedNetClamped - data.netCORCsTCO2e) > tolerance) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Net CORCs (${data.netCORCsTCO2e}) doesn't match expected value (${expectedNetClamped.toFixed(3)}). Formula result: ${expectedNet.toFixed(3)}`,
      path: ['netCORCsTCO2e'],
    });
  }

  // If formula result is negative, add informational warning (but it's valid if clamped to 0)
  if (expectedNet < 0 && data.netCORCsTCO2e === 0) {
    // This is valid - emissions exceed storage, no CORCs issued
    // Could optionally add a warning here for visibility
  } else if (data.netCORCsTCO2e < 0) {
    // This should not happen - netCORCsTCO2e should never be negative
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Net CORCs cannot be negative. The value should be clamped to 0 when emissions exceed storage.',
      path: ['netCORCsTCO2e'],
    });
  }

  // Issuance date required if status is 'issued'
  if (data.status === 'issued' && !data.issuanceDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Issuance date is required when status is "issued"',
      path: ['issuanceDate'],
    });
  }

  // Retirement fields required if status is 'retired'
  if (data.status === 'retired') {
    if (!data.retirementDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Retirement date is required when status is "retired"',
        path: ['retirementDate'],
      });
    }
    if (!data.retirementBeneficiary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Retirement beneficiary is required when status is "retired"',
        path: ['retirementBeneficiary'],
      });
    }
  }
};

export const corcIssuanceWithRefinementSchema = corcIssuanceSchema.superRefine(corcRefinement);

export const createCORCSchema = corcIssuanceSchema.omit({ id: true }).superRefine(corcRefinement);

export const updateCORCSchema = corcIssuanceSchema.partial().required({ id: true });

// Schema for issuing a CORC (changing status from draft to issued)
export const issueCORCSchema = z.object({
  id: z.string().uuid(),
  issuanceDate: z.coerce.date().default(() => new Date()),
  ownerName: z.string().optional().nullable(),
  ownerAccountId: z.string().optional().nullable(),
});

// Schema for retiring a CORC
export const retireCORCSchema = z.object({
  id: z.string().uuid(),
  retirementDate: z.coerce.date().default(() => new Date()),
  retirementBeneficiary: z.string().min(1, 'Beneficiary is required for retirement'),
  notes: z.string().optional().nullable(),
});

export type CORCIssuanceInput = z.infer<typeof createCORCSchema>;
export type CORCIssuanceUpdate = z.infer<typeof updateCORCSchema>;
export type IssueCORCInput = z.infer<typeof issueCORCSchema>;
export type RetireCORCInput = z.infer<typeof retireCORCSchema>;

/**
 * Generate a CORC serial number
 */
export function generateCORCSerialNumber(
  facilityCode: string,
  year: number,
  sequence: number
): string {
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `CORC-${facilityCode}-${year}-${paddedSequence}`;
}
