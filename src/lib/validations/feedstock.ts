import { z } from 'zod';

export const feedstockDeliverySchema = z.object({
  id: z.string().uuid().optional(),
  date: z.coerce.date(),
  vehicleId: z.string().optional().nullable(),
  vehicleDescription: z.string().optional().nullable(),
  deliveryDistanceKm: z.coerce.number().positive('Distance must be positive'),
  weightTonnes: z.coerce.number().positive('Weight must be positive').optional().nullable(),
  volumeM3: z.coerce.number().positive('Volume must be positive').optional().nullable(),
  feedstockType: z.string().min(1, 'Feedstock type is required'),
  fuelType: z.string().optional().nullable(),
  fuelAmount: z.coerce.number().positive('Fuel amount must be positive').optional().nullable(),
  notes: z.string().optional().nullable(),
  // Location fields for network map
  sourceAddress: z.string().optional().nullable(),
  sourceLat: z.coerce.number().min(-90).max(90).optional().nullable(),
  sourceLng: z.coerce.number().min(-180).max(180).optional().nullable(),
});

export const createFeedstockDeliverySchema = feedstockDeliverySchema.omit({ id: true });

export const updateFeedstockDeliverySchema = feedstockDeliverySchema.partial().required({ id: true });

export type FeedstockDeliveryInput = z.infer<typeof createFeedstockDeliverySchema>;
export type FeedstockDeliveryUpdate = z.infer<typeof updateFeedstockDeliverySchema>;

export const FEEDSTOCK_TYPES = [
  { value: 'agricultural_residue', label: 'Agricultural Residue' },
  { value: 'forestry_residue', label: 'Forestry Residue' },
  { value: 'organic_waste', label: 'Organic Waste' },
  { value: 'energy_crops', label: 'Energy Crops' },
  { value: 'other', label: 'Other' },
] as const;

export const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'electric', label: 'Electric' },
  { value: 'biodiesel', label: 'Biodiesel' },
  { value: 'other', label: 'Other' },
] as const;
