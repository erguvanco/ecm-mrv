import { z } from 'zod';

// Default origin address (Garanti Karadeniz plant)
export const DEFAULT_ORIGIN_ADDRESS = 'Soğucak OSB, Sanayi Cd. No:94, 54160 Söğütlü/Sakarya';
export const DEFAULT_ORIGIN_COORDS = { lat: 40.8847, lng: 30.1669 }; // Approximate coordinates

// Base schema without superRefine for use with .omit() and .partial()
const transportEventBaseSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.coerce.date(),
  // Origin location
  originAddress: z.string().min(1, 'Origin address is required'),
  originLat: z.coerce.number().min(-90).max(90),
  originLng: z.coerce.number().min(-180).max(180),
  // Destination location
  destinationAddress: z.string().min(1, 'Destination address is required'),
  destinationLat: z.coerce.number().min(-90).max(90),
  destinationLng: z.coerce.number().min(-180).max(180),
  // Distance - auto-calculated or manual
  distanceKm: z.coerce.number().nonnegative('Distance cannot be negative').default(0),
  vehicleId: z.string().optional().nullable(),
  vehicleDescription: z.string().optional().nullable(),
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
