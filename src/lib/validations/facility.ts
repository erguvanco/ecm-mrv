import { z } from 'zod';

/**
 * Facility Validation Schema
 * Based on Puro.earth Biochar Methodology Section 3.2
 */

export const BASELINE_TYPES = [
  { value: 'NEW_BUILT', label: 'New Built', description: 'New facility with no prior carbonization activity' },
  { value: 'RETROFIT_FACILITY', label: 'Retrofit Facility', description: 'Existing bioenergy/biomaterial facility retrofitted for biochar' },
  { value: 'CHARCOAL_REPURPOSE', label: 'Charcoal Repurpose', description: 'Existing charcoal diverted from combustion to long-term storage' },
] as const;

export const facilitySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Facility name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  baselineType: z.enum(['NEW_BUILT', 'RETROFIT_FACILITY', 'CHARCOAL_REPURPOSE']).default('NEW_BUILT'),

  // Location
  address: z.string().optional().nullable(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  country: z.string().optional().nullable(),

  // Crediting period (10 years per Puro methodology)
  creditingPeriodStart: z.coerce.date(),
  creditingPeriodEnd: z.coerce.date(),

  // Infrastructure for embodied emissions calculation
  infrastructureLifetimeYears: z.coerce.number().int().min(1).max(50).default(10),
  totalInfrastructureEmissionsTCO2e: z.coerce.number().nonnegative().default(0),
});

// Validation to ensure crediting period end is after start
const facilityRefinement = (data: z.infer<typeof facilitySchema>, ctx: z.RefinementCtx) => {
  if (data.creditingPeriodEnd <= data.creditingPeriodStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Crediting period end date must be after start date',
      path: ['creditingPeriodEnd'],
    });
  }

  // Crediting period should be approximately 10 years
  const tenYearsMs = 10 * 365 * 24 * 60 * 60 * 1000;
  const periodLength = data.creditingPeriodEnd.getTime() - data.creditingPeriodStart.getTime();
  if (periodLength > tenYearsMs * 1.1 || periodLength < tenYearsMs * 0.9) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Crediting period should be approximately 10 years per Puro methodology',
      path: ['creditingPeriodEnd'],
    });
  }
};

export const facilityWithRefinementSchema = facilitySchema.superRefine(facilityRefinement);

export const createFacilitySchema = facilitySchema.omit({ id: true }).superRefine(facilityRefinement);

export const updateFacilitySchema = facilitySchema.partial().required({ id: true });

export type FacilityInput = z.infer<typeof createFacilitySchema>;
export type FacilityUpdate = z.infer<typeof updateFacilitySchema>;
