import { z } from 'zod';

// Default origin address (Garanti Karadeniz plant)
export const DEFAULT_ORIGIN_ADDRESS = 'Soğucak OSB, Sanayi Cd. No:94, 54160 Söğütlü/Sakarya';
export const DEFAULT_ORIGIN_COORDS = { lat: 40.8847, lng: 30.1669 }; // Approximate coordinates

// Base schema without superRefine for use with .omit() and .partial()
const transportEventBaseSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.coerce.date(),
  // Origin location (optional - can be set later or auto-filled from plant)
  originAddress: z.string().optional().nullable(),
  originLat: z.coerce.number().min(-90).max(90).optional().nullable(),
  originLng: z.coerce.number().min(-180).max(180).optional().nullable(),
  // Destination location (optional)
  destinationAddress: z.string().optional().nullable(),
  destinationLat: z.coerce.number().min(-90).max(90).optional().nullable(),
  destinationLng: z.coerce.number().min(-180).max(180).optional().nullable(),
  // Distance - auto-calculated or manual
  distanceKm: z.coerce.number().nonnegative('Distance cannot be negative').default(0),
  vehicleId: z.string().optional().nullable(),
  vehicleDescription: z.string().min(1, 'Vehicle description is required'),
  fuelType: z.string().min(1, 'Energy type is required'),
  fuelTypeOther: z.string().optional().nullable(),
  fuelUnit: z.string().optional().nullable(),
  fuelAmount: z.coerce.number().positive('Fuel amount must be positive').optional().nullable(),
  cargoDescription: z.string().optional().nullable(),
  feedstockDeliveryId: z.string().uuid().optional().nullable(),
  sequestrationEventId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Refinement for conditional validation
const transportRefinement = (data: z.infer<typeof transportEventBaseSchema>, ctx: z.RefinementCtx) => {
  if (data.fuelType === 'other') {
    if (!data.fuelTypeOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please specify the energy type',
        path: ['fuelTypeOther'],
      });
    }
    if (!data.fuelUnit?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a unit',
        path: ['fuelUnit'],
      });
    }
  }
};

export const transportEventSchema = transportEventBaseSchema.superRefine(transportRefinement);

export const createTransportEventSchema = transportEventBaseSchema.omit({ id: true }).superRefine(transportRefinement);

export const updateTransportEventSchema = transportEventBaseSchema.partial().required({ id: true });

export type TransportEventInput = z.infer<typeof createTransportEventSchema>;
export type TransportEventUpdate = z.infer<typeof updateTransportEventSchema>;

export const TRANSPORT_FUEL_TYPES = [
  { value: 'electricity', label: 'Electricity', unit: 'kWh' },
  { value: 'diesel', label: 'Diesel', unit: 'liters' },
  { value: 'natural_gas', label: 'Natural Gas', unit: 'm³' },
  { value: 'propane', label: 'Propane', unit: 'kg' },
  { value: 'biomass', label: 'Biomass', unit: 'kg' },
  { value: 'other', label: 'Other', unit: null },
] as const;

export const TRANSPORT_VEHICLE_TYPES = [
  { value: 'van', label: 'Van' },
  { value: 'rigid_truck_3.5_7.5', label: 'Rigid Truck (>3.5 - 7.5 tonnes)' },
  { value: 'rigid_truck_7.5_17', label: 'Rigid Truck (>7.5 tonnes-17 tonnes)' },
  { value: 'rigid_truck_17_plus', label: 'Rigid Truck (>17 tonnes)' },
  { value: 'articulated_truck_3.5_33', label: 'Articulated Truck (>3.5 - 33t)' },
  { value: 'articulated_truck_33_plus', label: 'Articulated Truck (>33t)' },
] as const;

export const OTHER_FUEL_UNITS = ['kWh', 'liters', 'm³', 'kg'] as const;
