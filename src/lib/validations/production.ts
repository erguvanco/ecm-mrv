import { z } from 'zod';

// Schema for feedstock allocation (percentage of a delivery used in a batch)
export const feedstockAllocationSchema = z.object({
  feedstockDeliveryId: z.string().uuid(),
  percentageUsed: z.coerce.number().min(0.01, 'Percentage must be greater than 0').max(100, 'Percentage cannot exceed 100'),
});

export const productionBatchSchema = z.object({
  id: z.string().uuid().optional(),
  productionDate: z.coerce.date(),
  feedstockDeliveryId: z.string().uuid().optional().nullable(), // Deprecated: use feedstockAllocations
  feedstockAllocations: z.array(feedstockAllocationSchema).optional(),
  inputFeedstockWeightTonnes: z.coerce.number().positive('Input weight must be positive'),
  outputBiocharWeightTonnes: z.coerce.number().positive('Output weight must be positive'),
  temperatureMin: z.coerce.number().min(0).optional().nullable(),
  temperatureMax: z.coerce.number().min(0).optional().nullable(),
  temperatureAvg: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(['draft', 'complete']).default('draft'),
  wizardStep: z.number().int().min(1).max(5).default(1),
  notes: z.string().optional().nullable(),
});

export const createProductionBatchSchema = productionBatchSchema.omit({ id: true });

export const updateProductionBatchSchema = productionBatchSchema.partial().required({ id: true });

// Wizard step validation schemas
export const productionStep1Schema = z.object({
  productionDate: z.coerce.date({ required_error: 'Production date is required' }),
  feedstockDeliveryId: z.string().uuid().optional().nullable().or(z.literal('')), // Deprecated
  feedstockAllocations: z.array(feedstockAllocationSchema).optional(),
});

export const productionStep2Schema = z.object({
  inputFeedstockWeightTonnes: z.coerce.number().positive('Input weight must be positive'),
});

export const productionStep3Schema = z.object({
  outputBiocharWeightTonnes: z.coerce.number().positive('Output weight must be positive'),
});

export const productionStep4Schema = z.object({
  temperatureMin: z.coerce.number().min(0, 'Temperature must be at least 0').optional().nullable(),
  temperatureMax: z.coerce.number().min(0, 'Temperature must be at least 0').optional().nullable(),
  temperatureAvg: z.coerce.number().min(0, 'Temperature must be at least 0').optional().nullable(),
});

export const productionStep5Schema = z.object({
  notes: z.string().optional().nullable(),
});

export type FeedstockAllocation = z.infer<typeof feedstockAllocationSchema>;
export type ProductionBatchInput = z.infer<typeof createProductionBatchSchema>;
export type ProductionBatchUpdate = z.infer<typeof updateProductionBatchSchema>;

export const PRODUCTION_WIZARD_STEPS = [
  { id: 1, title: 'Basic Info', description: 'Production date and feedstock allocation' },
  { id: 2, title: 'Output Biochar', description: 'Output weight produced' },
  { id: 3, title: 'Temperature', description: 'Temperature profile data' },
  { id: 4, title: 'Summary', description: 'Review and complete' },
] as const;
