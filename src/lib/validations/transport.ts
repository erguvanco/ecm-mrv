import { z } from 'zod';

// Base schema without superRefine for use with .omit() and .partial()
const transportEventBaseSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.coerce.date(),
  vehicleId: z.string().optional().nullable(),
  vehicleDescription: z.string().optional().nullable(),
  distanceKm: z.coerce.number().positive('Distance must be positive'),
  fuelType: z.string().optional().nullable(),
  fuelTypeOther: z.string().optional().nullable(),
  fuelAmount: z.coerce.number().positive('Fuel amount must be positive').optional().nullable(),
  cargoDescription: z.string().optional().nullable(),
  feedstockDeliveryId: z.string().uuid().optional().nullable(),
  sequestrationEventId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Refinement for conditional validation
const transportRefinement = (data: z.infer<typeof transportEventBaseSchema>, ctx: z.RefinementCtx) => {
  if (data.fuelType === 'other' && !data.fuelTypeOther?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify the fuel type',
      path: ['fuelTypeOther'],
    });
  }
};

export const transportEventSchema = transportEventBaseSchema.superRefine(transportRefinement);

export const createTransportEventSchema = transportEventBaseSchema.omit({ id: true }).superRefine(transportRefinement);

export const updateTransportEventSchema = transportEventBaseSchema.partial().required({ id: true });

export type TransportEventInput = z.infer<typeof createTransportEventSchema>;
export type TransportEventUpdate = z.infer<typeof updateTransportEventSchema>;

export const TRANSPORT_FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'electric', label: 'Electric' },
  { value: 'biodiesel', label: 'Biodiesel' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'other', label: 'Other' },
] as const;
