import { z } from 'zod';

// Base schema without superRefine for use with .omit() and .partial()
const feedstockDeliveryBaseSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.coerce.date(),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  vehicleDescription: z.string().min(1, 'Vehicle description is required'),
  // Distance is auto-calculated from route - defaults to 0 until route is calculated
  deliveryDistanceKm: z.coerce.number().nonnegative('Distance cannot be negative').default(0),
  weightTonnes: z.coerce.number().positive('Weight must be positive'),
  volumeM3: z.coerce.number().positive('Volume must be positive').optional().nullable(),
  feedstockType: z.string().min(1, 'Feedstock type is required'),
  feedstockTypeOther: z.string().optional().nullable(),
  fuelType: z.string().min(1, 'Fuel type is required'),
  fuelTypeOther: z.string().optional().nullable(),
  fuelAmount: z.coerce.number().positive('Fuel amount must be positive'),
  notes: z.string().optional().nullable(),
  // Location fields - required for route calculation
  sourceAddress: z.string().min(1, 'Source address is required'),
  sourceLat: z.coerce.number().min(-90).max(90),
  sourceLng: z.coerce.number().min(-180).max(180),
});

// Refinement for conditional validation
const feedstockRefinement = (data: z.infer<typeof feedstockDeliveryBaseSchema>, ctx: z.RefinementCtx) => {
  if (data.feedstockType === 'other' && !data.feedstockTypeOther?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify the feedstock type',
      path: ['feedstockTypeOther'],
    });
  }
  if (data.fuelType === 'other' && !data.fuelTypeOther?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify the fuel type',
      path: ['fuelTypeOther'],
    });
  }
};

export const feedstockDeliverySchema = feedstockDeliveryBaseSchema.superRefine(feedstockRefinement);

export const createFeedstockDeliverySchema = feedstockDeliveryBaseSchema.omit({ id: true }).superRefine(feedstockRefinement);

export const updateFeedstockDeliverySchema = feedstockDeliveryBaseSchema.partial().required({ id: true });

export type FeedstockDeliveryInput = z.infer<typeof createFeedstockDeliverySchema>;
export type FeedstockDeliveryUpdate = z.infer<typeof updateFeedstockDeliverySchema>;

export const FEEDSTOCK_TYPE_GROUPS = [
  {
    label: 'Agricultural Residues',
    options: [
      { value: 'wheat_straw', label: 'Wheat straw' },
      { value: 'corn_stover', label: 'Corn stover (stalks & cobs)' },
      { value: 'corn_silk', label: 'Corn silk' },
      { value: 'rice_husk', label: 'Rice husk' },
      { value: 'sugar_beet_pulp', label: 'Sugar beet pulp' },
      { value: 'cotton_stalks', label: 'Cotton stalks' },
      { value: 'hazelnut_shells', label: 'Hazelnut shells' },
    ],
  },
  {
    label: 'Forestry & Wood',
    options: [
      { value: 'wood_chips', label: 'Wood chips' },
      { value: 'sawdust', label: 'Sawdust' },
      { value: 'bark', label: 'Bark' },
      { value: 'logging_residues', label: 'Logging residues' },
    ],
  },
  {
    label: 'Organic & Food Waste',
    options: [
      { value: 'food_waste', label: 'Food waste' },
      { value: 'brewery_spent_grain', label: 'Brewery spent grain' },
      { value: 'fruit_vegetable_residues', label: 'Fruit & vegetable processing residues' },
    ],
  },
  {
    label: 'Animal Residues',
    options: [
      { value: 'cattle_manure', label: 'Cattle manure' },
      { value: 'poultry_litter', label: 'Poultry litter' },
      { value: 'animal_slurry', label: 'Animal slurry' },
    ],
  },
  {
    label: 'Waste Oils & Fats',
    options: [
      { value: 'used_cooking_oil', label: 'Used cooking oil (UCO)' },
      { value: 'animal_fats', label: 'Animal fats (tallow)' },
    ],
  },
  {
    label: 'Energy Crops',
    options: [
      { value: 'energy_maize', label: 'Energy maize' },
      { value: 'miscanthus', label: 'Miscanthus' },
      { value: 'switchgrass', label: 'Switchgrass' },
      { value: 'sweet_sorghum', label: 'Sweet sorghum' },
    ],
  },
  {
    label: 'Other',
    options: [
      { value: 'other', label: 'Other (please specify)' },
    ],
  },
] as const;

// Flat list for backward compatibility and validation
export const FEEDSTOCK_TYPES = FEEDSTOCK_TYPE_GROUPS.flatMap(group =>
  group.options.map(opt => ({ value: opt.value, label: opt.label }))
);

export const VEHICLE_TYPES = [
  { value: 'van', label: 'Van' },
  { value: 'rigid_truck_3_5_7_5t', label: 'Rigid Truck (>3.5 - 7.5 tonnes)' },
  { value: 'rigid_truck_7_5_17t', label: 'Rigid Truck (>7.5 - 17 tonnes)' },
  { value: 'rigid_truck_17t', label: 'Rigid Truck (>17 tonnes)' },
  { value: 'articulated_truck_3_5_33t', label: 'Articulated Truck (>3.5 - 33t)' },
  { value: 'articulated_truck_33t', label: 'Articulated Truck (>33t)' },
] as const;

export const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'electric', label: 'Electric' },
  { value: 'biodiesel', label: 'Biodiesel' },
  { value: 'other', label: 'Other' },
] as const;
