import { z } from 'zod';

// PURO METHODOLOGY: End-use categories (Section 3.6)
export const END_USE_CATEGORIES = [
  { value: 'SOIL_AGRICULTURE', label: 'Soil - Agriculture', requiresSoilTemp: true },
  { value: 'SOIL_FORESTRY', label: 'Soil - Forestry', requiresSoilTemp: true },
  { value: 'SOIL_URBAN', label: 'Soil - Urban/Landscaping', requiresSoilTemp: true },
  { value: 'SOIL_REMEDIATION', label: 'Soil - Remediation', requiresSoilTemp: true },
  { value: 'CONSTRUCTION_CONCRETE', label: 'Construction - Concrete', requiresSoilTemp: false },
  { value: 'CONSTRUCTION_ASPHALT', label: 'Construction - Asphalt', requiresSoilTemp: false },
  { value: 'CONSTRUCTION_INSULATION', label: 'Construction - Insulation', requiresSoilTemp: false },
  { value: 'FILTRATION', label: 'Filtration Media', requiresSoilTemp: false },
  { value: 'COMPOSTING', label: 'Composting Additive', requiresSoilTemp: true },
  { value: 'OTHER', label: 'Other', requiresSoilTemp: false },
] as const;

// PURO METHODOLOGY: Incorporation methods (Section 3.6)
export const INCORPORATION_METHODS = [
  { value: 'TILLAGE', label: 'Tillage', description: 'Mixed into soil via tillage' },
  { value: 'TOP_DRESSING', label: 'Top Dressing', description: 'Applied to soil surface' },
  { value: 'MIXING', label: 'Mixing', description: 'Mixed into substrate (compost, concrete)' },
  { value: 'EMBEDDING', label: 'Embedding', description: 'Embedded in construction material' },
] as const;

// PURO METHODOLOGY: End-of-life fates for non-soil applications
export const END_OF_LIFE_FATES = [
  { value: 'LANDFILL', label: 'Landfill', description: 'Disposed to landfill at end of life' },
  { value: 'RECYCLING', label: 'Recycling', description: 'Recycled at end of life' },
  { value: 'INCINERATION', label: 'Incineration', description: 'Incinerated at end of life' },
] as const;

// PURO METHODOLOGY: Permanence verification methods
export const PERMANENCE_VERIFICATION_METHODS = [
  { value: 'DOCUMENTATION', label: 'Documentation', description: 'Verified through documentation and records' },
  { value: 'SITE_VISIT', label: 'Site Visit', description: 'Physical site inspection' },
  { value: 'REMOTE_SENSING', label: 'Remote Sensing', description: 'Satellite or aerial monitoring' },
] as const;

// Base schema without superRefine for use with .omit() and .partial()
const sequestrationEventBaseSchema = z.object({
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
  geocodeStatus: z.string().optional().nullable(),
  // Route fields
  routeGeometry: z.string().optional().nullable(),
  routeDistanceKm: z.coerce.number().nonnegative().optional().nullable(),
  routeDurationMin: z.coerce.number().nonnegative().optional().nullable(),
  routeStatus: z.string().optional().nullable(),
  routeCalculatedAt: z.coerce.date().optional().nullable(),
  sequestrationType: z.string().min(1, 'Sequestration type is required'),
  sequestrationTypeOther: z.string().optional().nullable(),
  status: z.enum(['draft', 'complete']).default('draft'),
  wizardStep: z.number().int().min(1).max(6).default(1),
  notes: z.string().optional().nullable(),

  // PURO METHODOLOGY: End-use category (Section 3.6)
  endUseCategory: z.string().optional().nullable(),
  endUseSubcategory: z.string().optional().nullable(),

  // PURO METHODOLOGY: Soil temperature for BC+200 model (Section 6.2, Table 6.1)
  meanAnnualSoilTempC: z.coerce.number().min(7, 'Minimum soil temp is 7°C').max(40, 'Maximum soil temp is 40°C').optional().nullable(),
  soilTempRegion: z.string().optional().nullable(),
  soilTempDataSource: z.string().optional().nullable(),

  // PURO METHODOLOGY: Calculated persistence (Equation 6.4)
  persistenceFractionPercent: z.coerce.number().min(0).max(100).optional().nullable(),

  // PURO METHODOLOGY: Incorporation details (Section 3.6)
  incorporationMethod: z.enum(['TILLAGE', 'TOP_DRESSING', 'MIXING', 'EMBEDDING']).optional().nullable(),
  incorporationDepthCm: z.coerce.number().positive().optional().nullable(),

  // PURO METHODOLOGY: For non-soil applications
  expectedProductLifetimeYears: z.coerce.number().int().positive().optional().nullable(),
  endOfLifeFate: z.enum(['LANDFILL', 'RECYCLING', 'INCINERATION']).optional().nullable(),

  // PURO METHODOLOGY: Permanence verification
  permanenceVerificationMethod: z.enum(['DOCUMENTATION', 'SITE_VISIT', 'REMOTE_SENSING']).optional().nullable(),
  reversalRiskAssessment: z.string().optional().nullable(),
});

// Refinement for conditional validation
const sequestrationRefinement = (data: z.infer<typeof sequestrationEventBaseSchema>, ctx: z.RefinementCtx) => {
  if (data.sequestrationType === 'other' && !data.sequestrationTypeOther?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify the sequestration type',
      path: ['sequestrationTypeOther'],
    });
  }
};

export const sequestrationEventSchema = sequestrationEventBaseSchema.superRefine(sequestrationRefinement);

export const createSequestrationEventSchema = sequestrationEventBaseSchema.omit({ id: true }).superRefine(sequestrationRefinement);

export const updateSequestrationEventSchema = sequestrationEventBaseSchema.partial().required({ id: true });

// Wizard step validation schemas
export const sequestrationStep1Schema = z.object({
  storageBeforeDelivery: z.boolean(),
});

export const sequestrationStep2Schema = z.object({
  storageLocation: z.string().min(1, 'Storage location is required'),
  storageStartDate: z.coerce.date({ required_error: 'Storage start date is required' }),
  storageEndDate: z.coerce.date({ required_error: 'Storage end date is required' }),
  storageContainerIds: z.string().min(1, 'Container IDs are required'),
  storageConditions: z.string().optional().nullable(),
}).refine((data) => {
  if (data.storageStartDate && data.storageEndDate) {
    return data.storageEndDate >= data.storageStartDate;
  }
  return true;
}, {
  message: 'Storage end date must be on or after the start date',
  path: ['storageEndDate'],
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
  sequestrationTypeOther: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.sequestrationType === 'other' && !data.sequestrationTypeOther?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify the sequestration type',
      path: ['sequestrationTypeOther'],
    });
  }
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
