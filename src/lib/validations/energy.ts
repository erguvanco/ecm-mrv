import { z } from 'zod';

// Base schema without superRefine for use with .omit() and .partial()
const energyUsageBaseSchema = z.object({
  id: z.string().uuid().optional(),
  scope: z.string().min(1, 'Scope is required'),
  scopeOther: z.string().optional().nullable(),
  energyType: z.string().min(1, 'Energy type is required'),
  energyTypeOther: z.string().optional().nullable(),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  productionBatchId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Refinement for conditional validation
const energyRefinement = (data: z.infer<typeof energyUsageBaseSchema>, ctx: z.RefinementCtx) => {
  if (data.scope === 'other' && !data.scopeOther?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify the scope',
      path: ['scopeOther'],
    });
  }
  if (data.energyType === 'other' && !data.energyTypeOther?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify the energy type',
      path: ['energyTypeOther'],
    });
  }
};

export const energyUsageSchema = energyUsageBaseSchema.superRefine(energyRefinement);

export const createEnergyUsageSchema = energyUsageBaseSchema.omit({ id: true }).superRefine(energyRefinement);

export const updateEnergyUsageSchema = energyUsageBaseSchema.partial().required({ id: true });

export type EnergyUsageInput = z.infer<typeof createEnergyUsageSchema>;
export type EnergyUsageUpdate = z.infer<typeof updateEnergyUsageSchema>;

export const ENERGY_SCOPES = [
  { value: 'production', label: 'Production' },
  { value: 'transport', label: 'Transport' },
  { value: 'storage', label: 'Storage' },
  { value: 'other', label: 'Other' },
] as const;

export const ENERGY_TYPES = [
  { value: 'electricity', label: 'Electricity', defaultUnit: 'kWh' },
  { value: 'diesel', label: 'Diesel', defaultUnit: 'litres' },
  { value: 'gas', label: 'Natural Gas', defaultUnit: 'm3' },
  { value: 'propane', label: 'Propane', defaultUnit: 'kg' },
  { value: 'biomass', label: 'Biomass', defaultUnit: 'kg' },
  { value: 'other', label: 'Other', defaultUnit: null },
] as const;

export const ENERGY_UNITS = [
  { value: 'kWh', label: 'kWh' },
  { value: 'litres', label: 'Litres' },
  { value: 'm3', label: 'm³' },
  { value: 'kg', label: 'kg' },
] as const;

// Get default unit for energy type
export const getDefaultUnitForEnergyType = (energyType: string): string | null => {
  const type = ENERGY_TYPES.find(t => t.value === energyType);
  return type?.defaultUnit ?? null;
};
