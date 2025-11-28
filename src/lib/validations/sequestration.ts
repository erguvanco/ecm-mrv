import { z } from 'zod';

export const sequestrationEventSchema = z.object({
  id: z.string().uuid().optional(),
  storageBeforeDelivery: z.boolean().default(false),
  storageLocation: z.string().optional().nullable(),
  storageStartDate: z.coerce.date().optional().nullable(),
  storageEndDate: z.coerce.date().optional().nullable(),
  storageContainerIds: z.string().optional().nullable(),
  storageConditions: z.string().optional().nullable(),
  finalDeliveryDate: z.coerce.date(),
  deliveryVehicleDescription: z.string().optional().nullable(),
  deliveryPostcode: z.string().min(1, 'Delivery postcode is required'),
  // Destination coordinates for network map
  destinationLat: z.coerce.number().min(-90).max(90).optional().nullable(),
  destinationLng: z.coerce.number().min(-180).max(180).optional().nullable(),
  sequestrationType: z.string().min(1, 'Sequestration type is required'),
  status: z.enum(['draft', 'complete']).default('draft'),
  wizardStep: z.number().int().min(1).max(6).default(1),
  notes: z.string().optional().nullable(),
});

export const createSequestrationEventSchema = sequestrationEventSchema.omit({ id: true });

export const updateSequestrationEventSchema = sequestrationEventSchema.partial().required({ id: true });

// Wizard step validation schemas
export const sequestrationStep1Schema = z.object({
  storageBeforeDelivery: z.boolean(),
});

export const sequestrationStep2Schema = z.object({
  storageLocation: z.string().min(1, 'Storage location is required'),
  storageStartDate: z.coerce.date({ required_error: 'Storage start date is required' }),
  storageEndDate: z.coerce.date({ required_error: 'Storage end date is required' }),
  storageContainerIds: z.string().optional().nullable(),
  storageConditions: z.string().optional().nullable(),
});

export const sequestrationStep3Schema = z.object({
  // Batch linkage - handled separately via join table
});

export const sequestrationStep4Schema = z.object({
  finalDeliveryDate: z.coerce.date({ required_error: 'Delivery date is required' }),
  deliveryVehicleDescription: z.string().optional().nullable(),
  deliveryPostcode: z.string().min(1, 'Delivery postcode is required'),
  destinationLat: z.coerce.number().min(-90).max(90).optional().nullable(),
  destinationLng: z.coerce.number().min(-180).max(180).optional().nullable(),
  sequestrationType: z.string().min(1, 'Sequestration type is required'),
});

export const sequestrationStep5Schema = z.object({
  // Regulatory evidence - handled via evidence file uploads
});

export const sequestrationStep6Schema = z.object({
  notes: z.string().optional().nullable(),
});

export type SequestrationEventInput = z.infer<typeof createSequestrationEventSchema>;
export type SequestrationEventUpdate = z.infer<typeof updateSequestrationEventSchema>;

export const SEQUESTRATION_TYPES = [
  { value: 'soil', label: 'Soil Amendment' },
  { value: 'compost', label: 'Compost Blend' },
  { value: 'construction', label: 'Construction Material' },
  { value: 'filtration', label: 'Filtration Media' },
  { value: 'other', label: 'Other' },
] as const;

export const STORAGE_CONDITIONS = [
  { value: 'covered_outdoor', label: 'Covered Outdoor' },
  { value: 'uncovered_outdoor', label: 'Uncovered Outdoor' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'climate_controlled', label: 'Climate Controlled' },
] as const;

export const SEQUESTRATION_WIZARD_STEPS = [
  { id: 1, title: 'Storage Flag', description: 'Is there storage before delivery?' },
  { id: 2, title: 'Storage Details', description: 'Location and duration', conditional: true },
  { id: 3, title: 'Batch Linkage', description: 'Link production batches' },
  { id: 4, title: 'Delivery Info', description: 'Delivery details' },
  { id: 5, title: 'Regulatory', description: 'Licenses and permits' },
  { id: 6, title: 'Summary', description: 'Review and complete' },
] as const;
