import { z } from 'zod';

/**
 * Monitoring Period Validation Schema
 * Based on Puro.earth Biochar Methodology monitoring requirements
 */

export const MONITORING_PERIOD_STATUS = [
  { value: 'active', label: 'Active', description: 'Currently collecting data' },
  { value: 'closed', label: 'Closed', description: 'Data collection complete, awaiting verification' },
  { value: 'verified', label: 'Verified', description: 'Verified by third party, CORCs issued' },
] as const;

export const monitoringPeriodSchema = z.object({
  id: z.string().uuid().optional(),
  facilityId: z.string().uuid(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  status: z.enum(['active', 'closed', 'verified']).default('active'),

  // CORC calculation results (cached after calculation)
  cStoredTCO2e: z.coerce.number().nonnegative().optional().nullable(),
  cBaselineTCO2e: z.coerce.number().nonnegative().optional().nullable(),
  cLossTCO2e: z.coerce.number().nonnegative().optional().nullable(),
  persistenceFractionPercent: z.coerce.number().min(0).max(100).optional().nullable(),
  eProjectTCO2e: z.coerce.number().nonnegative().optional().nullable(),
  eLeakageTCO2e: z.coerce.number().nonnegative().optional().nullable(),
  netCORCsTCO2e: z.coerce.number().optional().nullable(),

  calculatedAt: z.coerce.date().optional().nullable(),
});

// Refinement for monitoring period validation
const monitoringPeriodRefinement = (data: z.infer<typeof monitoringPeriodSchema>, ctx: z.RefinementCtx) => {
  // Period end must be after start
  if (data.periodEnd <= data.periodStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Period end date must be after start date',
      path: ['periodEnd'],
    });
  }

  // Period cannot be longer than 12 months per Puro methodology
  const maxPeriodMs = 366 * 24 * 60 * 60 * 1000; // ~12 months
  const periodLength = data.periodEnd.getTime() - data.periodStart.getTime();
  if (periodLength > maxPeriodMs) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Monitoring period cannot exceed 12 months per Puro methodology',
      path: ['periodEnd'],
    });
  }

  // Cannot close/verify period if no calculation exists
  if ((data.status === 'closed' || data.status === 'verified') && data.netCORCsTCO2e === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CORC calculation must be completed before closing/verifying period',
      path: ['status'],
    });
  }
};

export const monitoringPeriodWithRefinementSchema = monitoringPeriodSchema.superRefine(monitoringPeriodRefinement);

export const createMonitoringPeriodSchema = monitoringPeriodSchema.omit({ id: true }).superRefine(monitoringPeriodRefinement);

export const updateMonitoringPeriodSchema = monitoringPeriodSchema.partial().required({ id: true });

// Schema for running CORC calculation on a monitoring period
export const calculateCORCSchema = z.object({
  monitoringPeriodId: z.string().uuid(),
  // Optional overrides for calculation inputs
  meanSoilTempCOverride: z.coerce.number().min(7).max(40).optional(),
  coProductAllocationFactorOverride: z.coerce.number().min(0).max(1).optional(),
});

export type MonitoringPeriodInput = z.infer<typeof createMonitoringPeriodSchema>;
export type MonitoringPeriodUpdate = z.infer<typeof updateMonitoringPeriodSchema>;
export type CalculateCORCInput = z.infer<typeof calculateCORCSchema>;

/**
 * Check if a date falls within a monitoring period
 */
export function isDateInPeriod(date: Date, periodStart: Date, periodEnd: Date): boolean {
  return date >= periodStart && date <= periodEnd;
}

/**
 * Calculate monitoring period duration in days
 */
export function getPeriodDurationDays(periodStart: Date, periodEnd: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((periodEnd.getTime() - periodStart.getTime()) / msPerDay);
}
