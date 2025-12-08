import { z } from 'zod';

export const emissionFactorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['electricity', 'fuel', 'transport', 'feedstock', 'other']),
  categoryOther: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  year: z.coerce.number().int().min(1990).max(2100),
  source: z.enum(['IPCC', 'DEFRA', 'EPA', 'BEIS', 'GHG_Protocol', 'Custom']),
  sourceOther: z.string().optional(),
  region: z.string().optional(),
  co2Factor: z.coerce.number().optional(),
  ch4Factor: z.coerce.number().optional(),
  n2oFactor: z.coerce.number().optional(),
  totalCo2e: z.coerce.number().positive('Total CO2e must be positive'),
  gwpCh4: z.coerce.number().optional(),
  gwpN2o: z.coerce.number().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type EmissionFactorInput = z.infer<typeof emissionFactorSchema>;

export const CATEGORIES = [
  { value: 'electricity', label: 'Electricity' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'transport', label: 'Transport' },
  { value: 'feedstock', label: 'Feedstock' },
  { value: 'other', label: 'Other' },
] as const;

export const SOURCES = [
  { value: 'IPCC', label: 'IPCC' },
  { value: 'DEFRA', label: 'DEFRA (UK)' },
  { value: 'EPA', label: 'EPA (US)' },
  { value: 'BEIS', label: 'BEIS (UK)' },
  { value: 'GHG_Protocol', label: 'GHG Protocol' },
  { value: 'Custom', label: 'Custom' },
] as const;

export const REGIONS = [
  { value: 'Global', label: 'Global' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'EU', label: 'European Union' },
  { value: 'Other', label: 'Other' },
] as const;
